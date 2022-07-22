import * as React from "react";
import * as d3 from "d3";
import { Spring } from "@react-spring/web";

import Chart from "../components/Chart";
import AnimatedLine from "../components/AnimatedLine";
import Axis from "../components/Axis";

import { useInterval } from "../hooks/useInterval";

import type { BoundedDimensions } from "../utils/types";

import type { WeatherData } from "../hooks/useWeatherData";

//* Step 1b. Access Data
const dateParser = d3.timeParse("%Y-%m-%d");
const xAccessor = (d: WeatherData) => dateParser(d.date) as Date;
const yAccessor = (d: WeatherData) => d.temperatureMax;

//* Step 2. Create chart dimensions
const dimensions: BoundedDimensions = {
  width: window.innerWidth * 0.9,
  height: 400,
  margin: {
    top: 15,
    right: 15,
    bottom: 40,
    left: 60,
  },
  boundedWidth: 0,
  boundedHeight: 0,
};

dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

const formatTimelineDate = d3.timeFormat("%b %d");

function AnimatedLineChart({ dataset }: { dataset: WeatherData[] }) {
  const [sliceExtent, setSliceExtent] = React.useState({ from: 0, to: 100 });

  const datasetSlice = dataset.slice(sliceExtent.from, sliceExtent.to);

  useInterval(() => {
    setSliceExtent((prevState) => ({
      from: prevState.from + 1,
      to: prevState.to + 1,
    }));
  }, 1000);

  //* Step 4. Create scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(datasetSlice, xAccessor) as [Date, Date])
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor) as [number, number])
    .range([dimensions.boundedHeight, 0]);

  const xAccessorScaled = (d: WeatherData) => xScale(xAccessor(d));
  const yAccessorScaled = (d: WeatherData) => yScale(yAccessor(d));
  // const y0AccessorScaled = () => yScale(yScale.domain()[0]);

  const freezingTemperaturePlacement = yScale(32);

  const lastTwoPoints = datasetSlice.slice(-2);
  const pixelsBetweenLastPoints =
    xScale(xAccessor(lastTwoPoints[1])) - xScale(xAccessor(lastTwoPoints[0]));

  return (
    <div>
      {/* Step 3. Draw canvas */}
      <Chart dimensions={dimensions}>
        <rect
          x="0"
          width={dimensions.boundedWidth}
          y={freezingTemperaturePlacement}
          height={dimensions.boundedHeight - freezingTemperaturePlacement}
          fill="hsl(180deg 44% 92%)"
        />
        {/* Step 5. Draw data */}
        <Spring
          //? Re-render the line when the datasetSlice updates
          //? to imitate our original output with vanilla D3
          key={`${sliceExtent.from}-${sliceExtent.to}`}
          from={{ transform: `translateX(${pixelsBetweenLastPoints}px)` }}
          to={{ transform: "translateX(0px)" }}
        >
          {(springStyles) => (
            <>
              <AnimatedLine
                data={datasetSlice}
                xAccessor={xAccessorScaled}
                yAccessor={yAccessorScaled}
                style={springStyles}
              />
              {/* <AnimatedLine
                type="area"
                data={datasetSlice}
                xAccessor={xAccessorScaled}
                yAccessor={yAccessorScaled}
                y0Accessor={y0AccessorScaled}
                style={{ ...springStyles, fill: "hsl(41deg 35% 52% / 0.185)" }}
              /> */}
            </>
          )}
        </Spring>
        {/* Step 6. Draw peripherals */}
        <Axis dimension="x" scale={xScale} formatTick={formatTimelineDate} />
        <Axis dimension="y" scale={yScale} />
      </Chart>
    </div>
  );
}

export default AnimatedLineChart;
