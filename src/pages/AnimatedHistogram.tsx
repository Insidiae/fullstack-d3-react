import * as React from "react";
import * as d3 from "d3";
import { animated, Transition } from "@react-spring/web";

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
                  //TODO: figure out how to make the animations work
                  from={{ yOffset: 1, hue: 221 }}
                  // enter={{ yOffset: 0, hue: 221 }}
                  enter={() => async (next) => {
                    await next({ hue: 116 });
                    await next({ yOffset: 0, hue: 221 });
                  }}
                  leave={() => async (next) => {
                    await next({ hue: 221 });
                    await next({ hue: 354 });
                    await next({ yOffset: 1 });
                  }}
                  exitBeforeEnter={true}
                >
                  {({ yOffset, hue }, bin) => {
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
                          // y={yOffset.to(
                          //   (y: number) =>
                          //     y * dimensions.boundedHeight +
                          //     yAccessorScaled(bin)
                          // )}
                          y={yOffset.to({
                            output: [
                              dimensions.boundedHeight,
                              yAccessorScaled(bin),
                            ],
                            range: [1, 0],
                          })}
                          width={Math.max(widthAccessorScaled(bin), 10)}
                          // height={height.to(
                          //   (h: number) => h * heightAccessorScaled(bin)
                          // )}
                          height={heightAccessorScaled(bin)}
                          fill={`hsl(${hue.get()}deg 98% 67%)`}
                        />
                        <animated.text
                          x={midpointAccessorScaled(bin)}
                          y={yOffset.to(
                            (y: number) =>
                              y * dimensions.boundedHeight +
                              yAccessorScaled(bin) -
                              5
                          )}
                          textAnchor="middle"
                          fill="hsl(0deg 0% 40%)"
                          fontSize="12px"
                        >
                          {yAccessor(bin)}
                        </animated.text>
                      </g>
                    );
                  }}
                </Transition>
                {/* {bins.map((bin, i) => (
                  <g
                    key={`histogram-bin-${i}`}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`There were ${yAccessor(
                      bin
                    )} days with ${metric} between ${bin.x0} and ${bin.x1}`}
                  >
                    <rect
                      x={xAccessorScaled(bin)}
                      y={yAccessorScaled(bin)}
                      width={widthAccessorScaled(bin)}
                      height={heightAccessorScaled(bin)}
                      fill="hsl(221deg 98% 67%)"
                    />
                    <text
                      x={midpointAccessorScaled(bin)}
                      y={yAccessorScaled(bin) - 5}
                      textAnchor="middle"
                      fill="hsl(0deg 0% 40%)"
                      fontSize="12px"
                    >
                      {yAccessor(bin)}
                    </text>
                  </g>
                ))} */}
              </g>
              {/* Step 6. Draw peripherals */}
              <line
                x1={xScale(mean)}
                x2={xScale(mean)}
                y1={-15}
                y2={dimensions.boundedHeight}
                className={styles.mean}
                stroke="maroon"
                strokeDasharray="2px 4px"
              />
              <text
                role="presentation"
                aria-hidden={true}
                x={xScale(mean)}
                y={-20}
                textAnchor="middle"
                fill="maroon"
                fontSize="12px"
              >
                mean
              </text>
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
