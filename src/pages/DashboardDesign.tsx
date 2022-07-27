import * as React from "react";
import * as d3 from "d3";

import type { WeatherData } from "../hooks/useWeatherData";

import styles from "./styles/DashboardDesign.module.css";

//* Step 1b. Access Data
const dateParser = d3.timeParse("%Y-%m-%d");
const dateAccessor = (d: WeatherData) => dateParser(d.date) as Date;

const dateFormat = (d: string) =>
  d3.timeFormat("%-m/%d")(dateParser(d) as Date);
// const hourFormat = (d: number) =>
//   d3.timeFormat("%-I %p")(new Date(d.valueOf() * 1000));
const format24HourTime = (d: number) =>
  +d3.timeFormat("%H")(new Date(d * 1000));

function DashboardDesign({ dataset }: { dataset: WeatherData[] }) {
  const sortedDataset = React.useMemo(
    () =>
      dataset.sort(
        (a, b) => dateAccessor(a).valueOf() - dateAccessor(b).valueOf()
      ),
    [dataset]
  );

  const numberOfRows = 60;
  const datasetSlice = sortedDataset.slice(0, numberOfRows);

  const colorScale = d3.interpolateHcl("#a5c3e8", "#efa8a1");
  const grayColorScale = d3.interpolateHcl("#fff", "#bdc4ca");
  const tempScale = d3
    .scaleLinear()
    .domain(
      d3.extent(datasetSlice, (d: WeatherData) => d.temperatureMax) as [
        number,
        number
      ]
    )
    .range([0, 1]);
  const timeScale = d3.scaleLinear().domain([0, 24]).range([0, 80]);
  const humidityScale = d3
    .scaleLinear()
    .domain(
      d3.extent(datasetSlice, (d: WeatherData) => d.windSpeed) as [
        number,
        number
      ]
    )
    .range([0, 1]);

  const columns = [
    {
      label: "Day",
      type: "date",
      format: (d: WeatherData) => dateFormat(d.date),
    },
    { label: "Summary", type: "text", format: (d: WeatherData) => d.summary },
    {
      label: "Max Temp",
      type: "number",
      format: (d: WeatherData) => d3.format(".1f")(d.temperatureMax),
      background: (d: WeatherData) => colorScale(tempScale(d.temperatureMax)),
    },
    {
      label: "Max Temp Time",
      type: "marker",
      format: () => "|",
      transform: (d: WeatherData) =>
        `translateX(${timeScale(
          format24HourTime(d.apparentTemperatureMaxTime)
        )}%)`,
    },
    {
      label: "Wind Speed",
      type: "number",
      format: (d: WeatherData) => d3.format(".2f")(d.windSpeed),
      background: (d: WeatherData) =>
        grayColorScale(humidityScale(d.windSpeed)),
    },
    {
      label: "Did Snow",
      type: "centered",
      format: (d: WeatherData) => (d.precipType == "snow" ? "❄" : ""),
    },
    {
      label: "UV Index",
      type: "symbol",
      format: (d: WeatherData) => new Array(+d.uvIndex).fill("✸").join(""),
    },
  ];

  return (
    <div className={styles.container}>
      <table id="table" className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((column) => (
              <th key={column.label} className={styles[column.type]}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className={styles.tbody}>
          {datasetSlice.map((d) => (
            <tr key={d.date}>
              {columns.map((column) => (
                <td
                  key={column.label}
                  className={styles[column.type]}
                  style={{
                    background: column.background && column.background(d),
                    transform: column.transform && column.transform(d),
                  }}
                >
                  {column.format(d)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DashboardDesign;
