import * as React from "react";
import * as d3 from "d3";

import Chart from "../../components/Chart";

import type { BoundedDimensions } from "../../utils/types";

import type {
  WeatherData,
  NumericWeatherDataMetric,
} from "../../hooks/useWeatherData";

import styles from "./styles/CommonHeatmap.module.css";

const metrics: NumericWeatherDataMetric[] = [
  "moonPhase",
  "windSpeed",
  "dewPoint",
  "humidity",
  "uvIndex",
  "windBearing",
  "temperatureMin",
  "temperatureMax",
];

function CommonHeatmap({ dataset }: { dataset: WeatherData[] }) {
  //* Step 1b. Access Data
  const parseDate = d3.timeParse("%Y-%m-%d");
  const dateAccessor = (d: WeatherData) => parseDate(d.date) as Date;

  const firstDate = dateAccessor(dataset[0]);
  // const weekFormat = d3.timeFormat("%-e");
  const xAccessor = (d: WeatherData) =>
    d3.timeWeeks(firstDate, dateAccessor(d)).length;
  const dayOfWeekFormat = d3.timeFormat("%-w");
  const yAccessor = (d: WeatherData) => +dayOfWeekFormat(dateAccessor(d));

  const [metricIdx, setMetricIdx] = React.useState(0);
  const metric = metrics[metricIdx];

  function changeMetric() {
    setMetricIdx((metricIdx + 1) % metrics.length);
  }

  const colorAccessor = (d: WeatherData) => d[metric];
  const colorRangeDomain = d3.extent(dataset, colorAccessor) as [
    number,
    number
  ];
  const colorRange = d3
    .scaleLinear()
    .domain(colorRangeDomain)
    .range([0, 1])
    .clamp(true);
  const colorGradient = d3.interpolateHcl("#ecf0f1", "#5758BB");
  const colorScale = (d: number) => colorGradient(colorRange(d));

  //* Step 2. Create chart dimensions
  const numberOfWeeks = Math.ceil(dataset.length / 7) + 1;
  const dimensions: BoundedDimensions = {
    width: 0,
    height: 0,
    margin: {
      top: 30,
      right: 0,
      bottom: 0,
      left: 80,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  };

  dimensions.width =
    (window.innerWidth - dimensions.margin.left - dimensions.margin.right) *
    0.95;
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.height =
    (dimensions.boundedWidth * 7) / numberOfWeeks +
    dimensions.margin.top +
    dimensions.margin.bottom;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  //* Step 4. Create scales
  const barPadding = 0;
  const totalBarDimension = d3.min([
    dimensions.boundedWidth / numberOfWeeks,
    dimensions.boundedHeight / 7,
  ]) as number;
  const barDimension = totalBarDimension - barPadding;

  const monthFormat = d3.timeFormat("%b");
  const months = d3.timeMonths(
    dateAccessor(dataset[0]),
    dateAccessor(dataset[dataset.length - 1])
  );

  const dayOfWeekParse = d3.timeParse("%-e");
  const dayOfWeekTickFormat = d3.timeFormat("%-A");

  return (
    <div className={styles.wrapper}>
      <div id="heading" className={styles.heading}>
        <h2 id="metric" className={styles.metric}>
          {metric}
        </h2>
        <div className={styles.legend}>
          <div className={styles.legendText} id="legend-min">
            {colorRangeDomain[0]}
          </div>
          <div
            className={styles.legendGradient}
            id="legend-gradient"
            style={{
              background: `linear-gradient(to right, ${new Array(10)
                .fill(null)
                .map((d, i) => `${colorGradient(i / 9)} ${(i * 100) / 9}%`)
                .join(", ")})`,
            }}
          ></div>
          <div className={styles.legendText} id="legend-max">
            {colorRangeDomain[1]}
          </div>
        </div>
        <button className={styles.button} onClick={changeMetric}>
          Change metric
        </button>
      </div>

      {/* Step 3. Draw canvas */}
      <Chart dimensions={dimensions}>
        {/* Step 5. Draw data */}
        {months.map((month) => (
          <text
            key={month.valueOf()}
            className={styles.month}
            transform={`translate(${
              totalBarDimension * d3.timeWeeks(firstDate, month).length
            }, -10)`}
          >
            {monthFormat(month)}
          </text>
        ))}
        {d3.range(8).map((d) => (
          <text
            key={d}
            className={styles.label}
            transform={`translate(-10, ${totalBarDimension * (d + 0.5)})`}
          >
            {dayOfWeekTickFormat(dayOfWeekParse(d.toString()) as Date)}
          </text>
        ))}
        {dataset.map((d) => (
          <rect
            key={d.date}
            className={styles.day}
            x={totalBarDimension * xAccessor(d)}
            y={totalBarDimension * yAccessor(d)}
            width={barDimension}
            height={barDimension}
            fill={colorScale(colorAccessor(d))}
          />
        ))}
        {/* Step 6. Draw peripherals */}
      </Chart>
    </div>
  );
}

export default CommonHeatmap;
