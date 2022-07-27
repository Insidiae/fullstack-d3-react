import * as React from "react";
import * as d3 from "d3";

import Chart from "../../components/Chart";

import { iconPaths } from "../../utils/iconPaths";

import type { WeatherData } from "../../hooks/useWeatherData";
import type { BoundedDimensions } from "../../utils/types";

import styles from "./styles/CommonPieChart.module.css";

//* Step 2. Create chart dimensions
const width = 500;
const dimensions: BoundedDimensions = {
  width: width,
  height: width,
  margin: {
    top: 60,
    right: 60,
    bottom: 60,
    left: 60,
  },
  boundedWidth: 0,
  boundedHeight: 0,
};
dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

function PieChart({
  dataset,
  metric,
}: {
  dataset: WeatherData[];
  metric: "icon" | "summary";
}) {
  //* Step 1b. Access Data
  const iconAccessor = (d: WeatherData) => d[metric];
  const datasetByMetric = Array.from(d3.group(dataset, iconAccessor)).sort(
    (a, b) => b[1].length - a[1].length
  );
  const combinedDatasetBMetric = [
    ...datasetByMetric.slice(0, 4),
    ["other", d3.merge(datasetByMetric.slice(4).map((d) => d[1]))],
  ] as [string, WeatherData[]][];

  const arcGenerator = d3
    .pie<typeof datasetByMetric[number]>()
    .padAngle(0.005)
    // .value(([key, values]) => values.length);
    .value(([, values]) => values.length);

  //* Step 4. Create scales
  const arcs = arcGenerator(combinedDatasetBMetric);

  const interpolateWithSteps = (numberOfSteps: number) =>
    new Array(numberOfSteps).fill(null).map((d, i) => i / (numberOfSteps - 1));
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(
      arcs
        .sort((a, b) => a.data[1].length - b.data[1].length)
        .map((d) => d.data[0])
    )
    .range(
      interpolateWithSteps(datasetByMetric.length).map(
        d3.interpolateLab("#f3a683", "#3dc1d3")
      )
    );

  const radius = dimensions.boundedWidth / 2;
  const arc = d3
    .arc<typeof arcs[number]>()
    .innerRadius(radius * 0.7) // set to 0 for a pie chart
    .outerRadius(radius);

  return (
    //* Step 3. Draw canvas
    <Chart dimensions={dimensions}>
      {/* Step 5. Draw data */}
      <g
        transform={`translate(${dimensions.boundedHeight / 2}, ${
          dimensions.boundedWidth / 2
        })`}
      >
        {arcs.map((d) => (
          <React.Fragment key={d.startAngle}>
            <path
              fill={d.data[0] === "other" ? "#dadadd" : colorScale(d.data[0])}
              d={arc(d) ?? ""}
            >
              <title>{d.data[0]}</title>
            </path>
            <g transform={`translate(${arc.centroid(d)})`}>
              <path
                className={styles.icon}
                d={iconPaths[d.data[0]]}
                transform="translate(-25, -32) scale(0.5)"
              />
              <text className={styles.label} transform="translate(0, 20)">
                {d.data[1].length}
              </text>
            </g>
          </React.Fragment>
        ))}
      </g>
      {/* Step 6. Draw peripherals */}
      <text
        className={styles.title}
        transform={`translate(${dimensions.boundedWidth / 2}, ${
          dimensions.boundedHeight / 2
        })`}
      >
        2018 Weather
      </text>
      <text
        className={styles.titleSmall}
        transform={`translate(${dimensions.boundedWidth / 2}, ${
          dimensions.boundedHeight / 2 + 30
        })`}
      >
        New York City, NY
      </text>
    </Chart>
  );
}

function CommonPieChart({ dataset }: { dataset: WeatherData[] }) {
  return (
    <div className={styles.wrapper}>
      <PieChart dataset={dataset} metric="icon" />

      <div className={styles.note}>
        Icons from <a href="http://adamwhitcroft.com/climacons/">Climacons</a>{" "}
        by <b>Adam Whitcroft</b>
      </div>
    </div>
  );
}

export default CommonPieChart;
