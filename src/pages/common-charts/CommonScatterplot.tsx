import * as React from "react";
import * as d3 from "d3";

import Chart from "../../components/Chart";
import Axis from "../../components/Axis";

import type { BoundedDimensions } from "../../utils/types";

import type {
  WeatherData,
  NumericWeatherDataMetric,
} from "../../hooks/useWeatherData";

import styles from "./styles/CommonStyles.module.css";

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

function Scatterplot({
  dataset,
  xMetric,
  yMetric,
  xLabel,
  yLabel,
  xNumberOfTicks,
  yNumberOfTicks,
}: {
  dataset: WeatherData[];
  xMetric: NumericWeatherDataMetric;
  yMetric: NumericWeatherDataMetric;
  xLabel?: string;
  yLabel?: string;
  xNumberOfTicks?: number;
  yNumberOfTicks?: number;
}) {
  //* Step 1b. Access Data
  const xAccessor = (d: WeatherData) => d[xMetric];
  const yAccessor = (d: WeatherData) => d[yMetric];

  //* Step 4. Create scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor) as [number, number])
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor) as [number, number])
    .range([dimensions.boundedHeight, 0])
    .nice();

  const xAccessorScaled = (d: WeatherData) => xScale(xAccessor(d));
  const yAccessorScaled = (d: WeatherData) => yScale(yAccessor(d));

  return (
    //* Step 3. Draw canvas
    <Chart dimensions={dimensions}>
      {/* Step 5. Draw data */}
      {dataset?.map((data, idx) => (
        <circle
          key={idx}
          cx={xAccessorScaled(data)}
          cy={yAccessorScaled(data)}
          fill="hsl(221deg 98% 67%)"
          r={4}
        />
      ))}
      {/* Step 6. Draw peripherals */}
      <Axis
        dimension="x"
        scale={xScale}
        label={xLabel}
        numberOfTicks={xNumberOfTicks}
      />
      <Axis
        dimension="y"
        scale={yScale}
        label={yLabel}
        numberOfTicks={yNumberOfTicks}
      />
    </Chart>
  );
}

function CommonScatterplot({ dataset }: { dataset: WeatherData[] }) {
  return (
    <div className={styles.wrapper}>
      <Scatterplot
        dataset={dataset}
        xMetric="temperatureMax"
        xLabel="Maximum Temperature (&deg;F)"
        yMetric="pressure"
        yLabel="Pressure"
        yNumberOfTicks={4}
      />
    </div>
  );
}

export default CommonScatterplot;
