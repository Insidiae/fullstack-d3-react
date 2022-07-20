import * as React from "react";
import * as d3 from "d3";
import { animated, Transition, Spring } from "@react-spring/web";

import Chart from "../components/Chart";
import Axis from "../components/Axis";

import { useWeatherData } from "../hooks/useWeatherData";

import type { WeatherData } from "../hooks/useWeatherData";
import type { BoundedDimensions } from "../utils/types";

import styles from "./styles/AnimatedHistogram.module.css";

//* Step 2. Create chart dimensions
const width = 600;

const dimensions: BoundedDimensions = {
  width,
  //? Histograms are easiest to read when they are wider than they are tall!
  height: width * 0.6,
  margin: {
    top: 30,
    right: 10,
    bottom: 50,
    left: 50,
  },
  boundedWidth: 0,
  boundedHeight: 0,
};

dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

//? Get the metrics from WeatherData which return a number
//? https://stackoverflow.com/questions/56863875/typescript-how-do-you-filter-a-types-properties-to-those-of-a-certain-type
type NumberDataMetric = {
  [K in keyof WeatherData]-?: WeatherData[K] extends number ? K : never;
}[keyof WeatherData];

type WeatherDataBin = d3.Bin<WeatherData, number>;

const metrics: NumberDataMetric[] = [
  "windSpeed",
  "moonPhase",
  "dewPoint",
  "humidity",
  "uvIndex",
  "windBearing",
  "temperatureMin",
  "temperatureMax",
];

function AnimatedHistogram() {
  //* Step 1a. Fetch Data
  const { dataset, status, error } = useWeatherData();
  const [selectedMetricIndex, setSelectedMetricIndex] = React.useState(0);

  const metric = metrics[selectedMetricIndex];

  function changeMetric() {
    setSelectedMetricIndex((selectedMetricIndex + 1) % metrics.length);
  }

  switch (status) {
    case "idle":
      return <span>Waiting for data...</span>;
    case "pending":
      return <div>Loading data...</div>;
    case "rejected":
      throw error;
    case "resolved": {
      //* Step 1b. Access Data
      const xAccessor = (d: WeatherData) => d[metric];
      const yAccessor = (bin: WeatherDataBin) => bin.length;

      //* Step 4. Create scales
      const xScale = d3
        .scaleLinear()
        .domain(
          d3.extent(dataset as WeatherData[], xAccessor) as [number, number]
        )
        .range([0, dimensions.boundedWidth])
        .nice();

      const binsGenerator = d3
        .bin<WeatherData, number>()
        .domain(xScale.domain() as [number, number])
        .value(xAccessor)
        .thresholds(12);

      const bins = binsGenerator(dataset as WeatherData[]);

      const yScale = d3
        .scaleLinear()
        //? For histograms, we want the y axis to always start at 0
        .domain([0, d3.max(bins, yAccessor)] as [0, number])
        .range([dimensions.boundedHeight, 0])
        .nice();

      const barPadding = 1;
      const xAccessorScaled = (d: WeatherDataBin) =>
        xScale(d.x0 as number) + barPadding;
      const yAccessorScaled = (bin: WeatherDataBin) => yScale(yAccessor(bin));

      //! React handles updates differently than d3.transition().
      //! As such, changing metrics causes values to be calculated
      //! with the latest scale/accessor functions during rendering.
      //! This causes the bars to get a lot wider/thinner when switching
      //! between metrics that have different scales.
      const widthAccessorScaled = (d: WeatherDataBin) =>
        xScale(d.x1 as number) - xScale(d.x0 as number) - barPadding;
      const heightAccessorScaled = (d: WeatherDataBin) =>
        dimensions.boundedHeight - yScale(yAccessor(d));

      const midpointAccessorScaled = (d: WeatherDataBin) =>
        xScale(d.x0 as number) +
        (xScale(d.x1 as number) - xScale(d.x0 as number)) / 2;

      const mean = d3.mean(dataset as WeatherData[], xAccessor) as number;

      return (
        <div className={styles.container}>
          {/* Add a div to copy the structure from the original example */}
          <div>
            {/* Step 3. Draw canvas */}
            <Chart dimensions={dimensions}>
              {/* Step 5. Draw data */}
              <g
                role="list"
                tabIndex={0}
                aria-label="histogram bars"
                clipPath="url(#bounds-clip-path)"
              >
                <Transition
                  items={bins}
                  from={(bin) => ({
                    barY: dimensions.boundedHeight,
                    barWidth: Math.max(0, widthAccessorScaled(bin)),
                    barHeight: 0,
                    textY: dimensions.boundedHeight + 5,
                    textOpacity: 0,
                    fill: "#63fd58",
                  })}
                  enter={(bin) => [
                    {
                      barY: dimensions.boundedHeight,
                      barWidth: Math.max(0, widthAccessorScaled(bin)),
                      barHeight: 0,
                      textY: dimensions.boundedHeight + 5,
                      fill: "#63fd58",
                    },
                    {
                      barY: yAccessorScaled(bin),
                      barHeight: heightAccessorScaled(bin),
                      textY: yAccessorScaled(bin) - 5,
                      textOpacity: 1,
                    },
                    { fill: "#588dfd" },
                  ]}
                  leave={{
                    fill: "#fd5869",
                    textOpacity: 0,
                    barY: dimensions.boundedHeight,
                    barHeight: 0,
                    textY: dimensions.boundedHeight + 5,
                  }}
                  exitBeforeEnter={true}
                >
                  {(
                    { barY, barWidth, barHeight, textY, textOpacity, fill },
                    bin
                  ) => {
                    return (
                      <g
                        role="listitem"
                        tabIndex={0}
                        aria-label={`There were ${yAccessor(
                          bin
                        )} days with ${metric} between ${bin.x0} and ${bin.x1}`}
                      >
                        <animated.rect
                          x={xAccessorScaled(bin)}
                          // width={Math.max(0, widthAccessorScaled(bin))}
                          style={{
                            y: barY,
                            width: barWidth,
                            height: barHeight,
                            fill,
                          }}
                        />
                        <animated.text
                          x={midpointAccessorScaled(bin)}
                          textAnchor="middle"
                          fill="hsl(0deg 0% 40%)"
                          fontSize="12px"
                          style={{
                            y: textY,
                            opacity: textOpacity,
                          }}
                        >
                          {yAccessor(bin)}
                        </animated.text>
                      </g>
                    );
                  }}
                </Transition>
              </g>
              {/* Step 6. Draw peripherals */}
              <Spring to={{ x: xScale(mean) }} delay={700}>
                {({ x }) => (
                  <>
                    <animated.line
                      x1={x}
                      x2={x}
                      y1={-15}
                      y2={dimensions.boundedHeight}
                      className={styles.mean}
                      stroke="maroon"
                      strokeDasharray="2px 4px"
                    />
                    <animated.text
                      role="presentation"
                      aria-hidden={true}
                      x={x}
                      y={-20}
                      textAnchor="middle"
                      fill="maroon"
                      fontSize="12px"
                    >
                      mean
                    </animated.text>
                  </>
                )}
              </Spring>
              <Axis dimension="x" scale={xScale} label={metric} />
              <clipPath id="bounds-clip-path">
                <rect
                  width={dimensions.boundedWidth}
                  height={dimensions.boundedHeight + dimensions.margin.top}
                  y={-dimensions.margin.top}
                />
              </clipPath>
            </Chart>
          </div>
          <button className={styles.btn} onClick={changeMetric}>
            Change metric
          </button>
        </div>
      );
    }
  }
}

export default AnimatedHistogram;
