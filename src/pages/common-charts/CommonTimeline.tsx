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

function Timeline({
  dataset,
  metric,
  label,
}: {
  dataset: WeatherData[];
  metric: NumericWeatherDataMetric;
  label: string;
}) {
  //* Step 1b. Access Data
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d: WeatherData) => dateParser(d.date) as Date;
  const yAccessor = (d: WeatherData) => d[metric];

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

  const lineGenerator = d3
    .line<WeatherData>()
    .x(xAccessorScaled)
    .y(yAccessorScaled);

  return (
    //* Step 3. Draw canvas
    <Chart dimensions={dimensions}>
      {/* Step 5. Draw data */}
      <path
        d={lineGenerator(dataset) as string}
        fill="none"
        stroke="hsl(204deg 64% 44%)"
        strokeWidth={2}
      />
      {/* Step 6. Draw peripherals */}
      <Axis dimension="x" scale={xScale} formatTick={formatTimelineDate} />
      <Axis dimension="y" scale={yScale} numberOfTicks={4} label={label} />
    </Chart>
  );
}

function CommonTimeline({ dataset }: { dataset: WeatherData[] }) {
  const datasetSlice = dataset.slice(0, 100);
  return (
    <div className={styles.wrapper} style={{ padding: "5em 2em" }}>
      <Timeline
        dataset={datasetSlice}
        metric="temperatureMax"
        label="Maximum Temperature (&deg;F)"
      />
    </div>
  );
}

export default CommonTimeline;
