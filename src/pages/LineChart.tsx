import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";
import Line from "../components/Line";
import Axis from "../components/Axis";

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

const formatTimelineDate = d3.timeFormat("%B");

function LineChart({ dataset }: { dataset: WeatherData[] }) {
  //* Step 4. Create scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor) as [Date, Date])
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor) as [number, number])
    .range([dimensions.boundedHeight, 0]);

  const xAccessorScaled = (d: WeatherData) => xScale(xAccessor(d));
  const yAccessorScaled = (d: WeatherData) => yScale(yAccessor(d));
  // const y0AccessorScaled = () => yScale(yScale.domain()[0]);

  const freezingTemperaturePlacement = yScale(32);

  //* Notice how React lets us draw everything we need for the charts
  //* in such a nice, declarative way
  //* We can also abstract common steps in separate reusable components
  //* to make our workflow a lot easier!
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
        <Line
          data={dataset}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
        />
        {/* <Line
          type="area"
          data={dataset}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
          y0Accessor={y0AccessorScaled}
          style={{ fill: "hsl(41deg 35% 52% / 0.185)" }}
        /> */}
        {/* Step 6. Draw peripherals */}
        <Axis dimension="x" scale={xScale} formatTick={formatTimelineDate} />
        <Axis dimension="y" scale={yScale} />
      </Chart>
    </div>
  );
}

export default LineChart;
