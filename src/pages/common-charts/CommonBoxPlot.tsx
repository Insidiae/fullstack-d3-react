import * as React from "react";
import * as d3 from "d3";

import Chart from "../../components/Chart";
import Axis from "../../components/Axis";

import type {
  WeatherData,
  NumericWeatherDataMetric,
} from "../../hooks/useWeatherData";
import type { BoundedDimensions } from "../../utils/types";

import styles from "./styles/CommonBoxPlot.module.css";

//* Step 2. Create chart dimensions
const width = 700;

const dimensions: BoundedDimensions = {
  width,
  height: width * 0.6,
  margin: {
    top: 30,
    right: 10,
    bottom: 30,
    left: 50,
  },
  boundedWidth: 0,
  boundedHeight: 0,
};

dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

type DataByMonthWithStats = {
  month: number;
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
  rangeMin: number;
  rangeMax: number;
  outliers: WeatherData[];
};

const parseMonth = d3.timeParse("%m");
const formatMonth = d3.timeFormat("%b");

const barPadding = 6;

function BoxPlot({
  dataset,
  metric,
  label,
}: {
  dataset: WeatherData[];
  metric: NumericWeatherDataMetric;
  label?: string;
}) {
  //* Step 1b. Access Data
  const dateParser = d3.timeParse("%Y-%m-%d");
  const formatAsMonth = d3.timeFormat("%m");
  const dataByMonth = Array.from(
    d3.group(dataset, (d) => formatAsMonth(dateParser(d.date) as Date))
  );

  const yAccessor = (d: WeatherData) => d[metric];
  const monthAccessor = (d: DataByMonthWithStats) => d.month;

  const dataByMonthWithStats = dataByMonth.map(([month, values]) => {
    const monthYValues = values.map(yAccessor).sort((a, b) => a - b);
    const q1 = d3.quantile(monthYValues, 0.25) as number;
    const median = d3.median(monthYValues) as number;
    const q3 = d3.quantile(monthYValues, 0.75) as number;
    const iqr = q3 - q1;
    const [min, max] = d3.extent(monthYValues) as [number, number];
    const rangeMin = d3.max([min, q1 - iqr * 1.5]) as number;
    const rangeMax = d3.min([max, q3 + iqr * 1.5]) as number;
    const outliers = values.filter(
      (d) => yAccessor(d) < rangeMin || yAccessor(d) > rangeMax
    );

    return {
      month: +month,
      q1,
      median,
      q3,
      iqr,
      min,
      max,
      rangeMin,
      rangeMax,
      outliers,
    };
  });

  //* Step 4. Create scales
  const xScale = d3
    .scaleLinear()
    .domain([1, dataByMonth.length])
    .rangeRound([
      0,
      //? Need to account for bar padding
      dimensions.boundedWidth - barPadding * dataByMonthWithStats.length,
    ])
    .nice();

  const binsGenerator = d3
    .bin<DataByMonthWithStats, number>()
    .value(monthAccessor)
    .thresholds(dataByMonth.length);

  const bins = binsGenerator(dataByMonthWithStats);
  type BoxPlotBin = typeof bins[number];

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, yAccessor) as number])
    .range([dimensions.boundedHeight, 0])
    .nice();

  const getBarWidth = (bar: BoxPlotBin) =>
    xScale(bar.x1 ?? 0) - xScale(bar.x0 ?? 0);

  return (
    //* Step 3. Draw canvas
    <Chart dimensions={dimensions}>
      {/* Step 5. Draw data */}
      {bins.map((bin) => (
        <g key={bin.x0} className={styles.bin}>
          {/* Range lines */}
          <line
            className={styles.line}
            x1={xScale(bin.x0 ?? 0) + getBarWidth(bin) / 2}
            x2={xScale(bin.x0 ?? 0) + getBarWidth(bin) / 2}
            y1={yScale(bin[0].rangeMin)}
            y2={yScale(bin[0].rangeMax)}
          />
          {/* Bar Rects */}
          <rect
            x={xScale(bin.x0 ?? 0) + barPadding / 2}
            y={yScale(bin[0].q3)}
            width={getBarWidth(bin) - barPadding}
            height={yScale(bin[0].q1) - yScale(bin[0].q3)}
          />
          {/* Medians */}
          <line
            className={styles.median}
            x1={xScale(bin.x0 ?? 0) + barPadding / 2}
            x2={
              xScale(bin.x0 ?? 0) +
              barPadding / 2 +
              getBarWidth(bin) -
              barPadding
            }
            y1={yScale(bin[0].median)}
            y2={yScale(bin[0].median)}
          />
          {/* Range Mins */}
          <line
            className={styles.line}
            x1={xScale(bin.x0 ?? 0) + barPadding / 2 + getBarWidth(bin) * 0.3}
            x2={xScale(bin.x1 ?? 0) - barPadding / 2 - getBarWidth(bin) * 0.3}
            y1={yScale(bin[0].rangeMin)}
            y2={yScale(bin[0].rangeMin)}
          />
          {/* Range Maxes */}
          <line
            className={styles.line}
            x1={xScale(bin.x0 ?? 0) + barPadding / 2 + getBarWidth(bin) * 0.3}
            x2={xScale(bin.x1 ?? 0) - barPadding / 2 - getBarWidth(bin) * 0.3}
            y1={yScale(bin[0].rangeMax)}
            y2={yScale(bin[0].rangeMax)}
          />
          {/* Outliers */}
          <g
            transform={`translate(${
              xScale(bin.x0 ?? 0) + getBarWidth(bin) / 2
            }, 0)`}
          >
            {bin[0].outliers.map((outlier) => (
              <circle
                key={outlier.date}
                className={styles.outlier}
                cy={yScale(yAccessor(outlier))}
                r={2}
              />
            ))}
          </g>
          {/* Month Labels */}
          <text
            className={styles.label}
            transform={`translate(${
              xScale(bin.x0 ?? 0) + getBarWidth(bin) / 2
            }, -15)`}
          >
            {formatMonth(parseMonth(bin[0].month.toString()) as Date)}
          </text>
        </g>
      ))}
      {/* Step 6. Draw peripherals */}
      <Axis
        dimension="y"
        scale={yScale}
        numberOfTicks={4}
        lineClassName={styles.yAxisDomain}
        label={label ?? metric}
      />
    </Chart>
  );
}

function CommonBoxPlot({ dataset }: { dataset: WeatherData[] }) {
  return (
    <div className={styles.wrapper}>
      <BoxPlot
        dataset={dataset}
        metric="temperatureMax"
        label="Maximum Temperature (&deg;F)"
      />
    </div>
  );
}

export default CommonBoxPlot;
