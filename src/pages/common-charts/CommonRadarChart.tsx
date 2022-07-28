import * as React from "react";
import * as d3 from "d3";

import Chart from "../../components/Chart";

import type { BoundedDimensions } from "../../utils/types";

import type {
  WeatherData,
  NumericWeatherDataMetric,
} from "../../hooks/useWeatherData";

import styles from "./styles/CommonRadarChart.module.css";

//* Step 2. Create chart dimensions
interface RadarDimensions extends BoundedDimensions {
  radius: number;
  boundedRadius: number;
}

const chartSize = 600;
const dimensions: RadarDimensions = {
  width: chartSize,
  height: chartSize,
  radius: chartSize / 2,
  margin: {
    top: 80,
    right: 80,
    bottom: 80,
    left: 80,
  },
  boundedWidth: 0,
  boundedHeight: 0,
  boundedRadius: 0,
};

dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
dimensions.boundedRadius =
  dimensions.radius - (dimensions.margin.left + dimensions.margin.right) / 2;

function RadarChart({
  data,
  metrics,
  scales,
}: {
  data: WeatherData;
  metrics: NumericWeatherDataMetric[];
  scales: d3.ScaleLinear<number, number>[];
}) {
  const lineGenerator = d3
    .lineRadial<NumericWeatherDataMetric>()
    .angle((metric, i) => i * ((Math.PI * 2) / metrics.length))
    .radius((metric, i) => scales[i](+data[metric] || 0))
    .curve(d3.curveLinearClosed);

  return (
    //* Step 3. Draw canvas
    <Chart dimensions={dimensions}>
      {/* Step 6. Draw peripherals */}
      {/* 
        //? We're drawing our axes early here so they don't overlap our radar line
      */}
      {d3.range(4).map((d, i) => (
        <circle
          key={i}
          className={styles.gridLine}
          cx={dimensions.boundedRadius}
          cy={dimensions.boundedRadius}
          r={dimensions.boundedRadius * (i / 3)}
        />
      ))}
      {metrics.map((metric, idx) => {
        const angle = idx * ((Math.PI * 2) / metrics.length) - Math.PI * 0.5;
        const x =
          Math.cos(angle) * (dimensions.boundedRadius * 1.1) +
          dimensions.boundedWidth / 2;
        const y =
          Math.sin(angle) * (dimensions.boundedRadius * 1.1) +
          dimensions.boundedHeight / 2;

        return (
          <React.Fragment key={metric}>
            <line
              className={styles.gridLine}
              x1={dimensions.boundedWidth / 2}
              x2={
                Math.cos(angle) * dimensions.boundedRadius +
                dimensions.boundedWidth / 2
              }
              y1={dimensions.boundedHeight / 2}
              y2={
                Math.sin(angle) * dimensions.boundedRadius +
                dimensions.boundedWidth / 2
              }
            />
            <text
              className={styles.metricLabel}
              x={x}
              y={y}
              style={{
                textAnchor:
                  idx === 0 || idx === metrics.length / 2
                    ? "middle"
                    : idx < metrics.length / 2
                    ? "start"
                    : "end",
              }}
            >
              {metric}
            </text>
          </React.Fragment>
        );
      })}
      {/* Step 5. Draw data */}
      <path
        className={styles.line}
        style={{
          transform: `translate(${dimensions.boundedRadius}px, ${dimensions.boundedRadius}px)`,
        }}
        d={lineGenerator(metrics) as string}
      />
    </Chart>
  );
}

function CommonRadarChart({ dataset }: { dataset: WeatherData[] }) {
  //* Step 1b. Access data
  const dateParser = d3.timeParse("%Y-%m-%d");
  const dateAccessor = (d: WeatherData) => dateParser(d.date) as Date;
  const dateFormatter = d3.timeFormat("%B %-d, %Y");

  const sortedDataset = dataset.sort(
    (a, b) => dateAccessor(a).valueOf() - dateAccessor(b).valueOf()
  );

  const [activeDayIndex, setActiveDayIndex] = React.useState(0);

  const activeDay = sortedDataset[activeDayIndex];

  const metrics: NumericWeatherDataMetric[] = [
    "windBearing",
    "moonPhase",
    "pressure",
    "humidity",
    "windSpeed",
    "temperatureMax",
  ];

  //* Step 4. Create scales
  const metricScales = metrics.map((metric) =>
    d3
      .scaleLinear()
      .domain(
        d3.extent(dataset, (d: WeatherData) => d[metric]) as [number, number]
      )
      .range([0, dimensions.boundedRadius])
      .nice()
  );

  function getNextDay() {
    setActiveDayIndex((activeDayIndex + 1) % sortedDataset.length);
  }

  return (
    <div className={styles.wrapper} style={{ padding: "5em 2em" }}>
      <div className={styles.title}>
        <h3 id="title">{dateFormatter(dateAccessor(activeDay))}</h3>
        <button
          id="show-next-day"
          className={styles.button}
          onClick={getNextDay}
        >
          Next day
        </button>
      </div>

      <RadarChart data={activeDay} metrics={metrics} scales={metricScales} />
    </div>
  );
}

export default CommonRadarChart;
