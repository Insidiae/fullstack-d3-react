import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";
import Axis from "../components/Axis";

import { useWeatherData } from "../hooks/useWeatherData";

import type { BoundedDimensions } from "../utils/types";

import type { WeatherData } from "../hooks/useWeatherData";

import styles from "./styles/Scatterplot.module.css";

//* Step 1b. Access Data
const xAccessor = (d: WeatherData) => d.dewPoint;
const yAccessor = (d: WeatherData) => d.humidity;
const colorAccessor = (d: WeatherData) => d.cloudCover;

//* Step 2. Create chart dimensions
const chartSize = d3.min([
  window.innerWidth * 0.9,
  window.innerHeight * 0.9,
]) as number;
const dimensions: BoundedDimensions = {
  width: chartSize,
  height: chartSize,
  margin: {
    top: 10,
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

const formatTick = d3.format(".1f");

function ScatterPlot() {
  //* Step 1a. Fetch Data
  const { dataset, status, error } = useWeatherData();

  switch (status) {
    case "idle":
      return <span>Waiting for data...</span>;
    case "pending":
      return <div>Loading data...</div>;
    case "rejected":
      throw error;
    case "resolved": {
      //* Step 4. Create scales
      const xScale = d3
        .scaleTime()
        .domain(
          d3.extent(dataset as WeatherData[], xAccessor) as [number, number]
        )
        .range([0, dimensions.boundedWidth])
        .nice();

      const yScale = d3
        .scaleLinear()
        .domain(
          d3.extent(dataset as WeatherData[], yAccessor) as [number, number]
        )
        .range([dimensions.boundedHeight, 0])
        .nice();

      const colorScale = d3
        //? We need string types for the color range values
        .scaleLinear<string>()
        .domain(
          d3.extent(dataset as WeatherData[], colorAccessor) as [number, number]
        )
        .range(["skyblue", "darkslategrey"]);

      const xAccessorScaled = (d: WeatherData) => xScale(xAccessor(d));
      const yAccessorScaled = (d: WeatherData) => yScale(yAccessor(d));
      const colorAccessorScaled = (d: WeatherData) =>
        colorScale(colorAccessor(d));

      return (
        <div className={styles.wrapper}>
          {/* Step 3. Draw canvas */}
          <Chart dimensions={dimensions}>
            {/* Step 5. Draw data */}
            {dataset?.map((data, idx) => (
              <circle
                key={idx}
                cx={xAccessorScaled(data)}
                cy={yAccessorScaled(data)}
                // fill="cornflowerblue"
                fill={colorAccessorScaled(data)}
                r={5}
              />
            ))}
            {/* Step 6. Draw peripherals */}
            <Axis dimension="x" scale={xScale} label="Dew point (&deg;F)" />
            <Axis
              dimension="y"
              scale={yScale}
              numberOfTicks={4}
              formatTick={formatTick}
              label="Relative Humidity"
            />
          </Chart>
        </div>
      );
    }
  }
}

export default ScatterPlot;
