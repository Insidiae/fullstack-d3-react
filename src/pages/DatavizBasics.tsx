import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";

import type { BoundedDimensions } from "../utils/types";

import type { WeatherData } from "../hooks/useWeatherData";

import styles from "./styles/DatavizBasics.module.css";

function downsampleData(
  dataset: WeatherData[],
  xAccessor: (d: WeatherData) => Date,
  yAccessor: (d: WeatherData) => number
) {
  const weeks = d3.timeWeeks(
    xAccessor(dataset[0]),
    xAccessor(dataset[dataset.length - 1])
  );

  return weeks.map((week, index) => {
    const weekEnd = weeks[index + 1] || new Date();
    const days = dataset.filter(
      (d) => xAccessor(d) > week && xAccessor(d) <= weekEnd
    );
    return {
      date: d3.timeFormat("%Y-%m-%d")(week),
      humidity: d3.mean(days, yAccessor) as number,
    };
  });
}

type DownsampledWeatherData = ReturnType<typeof downsampleData>[number];

//* Step 1b. Access Data
const dateParser = d3.timeParse("%Y-%m-%d");
const xAccessor = (d: WeatherData | DownsampledWeatherData) =>
  dateParser(d.date) as Date;
const yAccessor = (d: WeatherData | DownsampledWeatherData) => d.humidity;

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

function DatavizBasics({ dataset }: { dataset: WeatherData[] }) {
  const downsampledData = downsampleData(dataset, xAccessor, yAccessor);

  //* Step 4. Create scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor) as [Date, Date])
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor) as [number, number])
    .range([dimensions.boundedHeight, 0])
    .nice(5);

  const xAccessorScaled = (d: DownsampledWeatherData) => xScale(xAccessor(d));
  const yAccessorScaled = (d: DownsampledWeatherData) => yScale(yAccessor(d));

  //! We want to focus on trends based on the time of year.
  //? We're showing the months on our x axis, but we can do some work for the reader
  //? and highlight the different seasons.
  const seasonBoundaries = ["3-20", "6-21", "9-21", "12-21"];
  const seasonNames = ["Spring", "Summer", "Fall", "Winter"] as const;

  type SeasonData = {
    start: Date;
    end: Date;
    name: typeof seasonNames[number];
    mean: number;
  };
  const seasonsData: SeasonData[] = [];
  const startDate = xAccessor(dataset[0]);
  const endDate = xAccessor(dataset[dataset.length - 1]);
  const years = d3.timeYears(d3.timeMonth.offset(startDate, -13), endDate);

  years.forEach((yearDate) => {
    const year = +d3.timeFormat("%Y")(yearDate);

    seasonBoundaries.forEach((boundary, index) => {
      const seasonStart = dateParser(`${year}-${boundary}`) as Date;
      const seasonEnd = (
        seasonBoundaries[index + 1]
          ? dateParser(`${year}-${seasonBoundaries[index + 1]}`)
          : dateParser(`${year + 1}-${seasonBoundaries[0]}`)
      ) as Date;

      const boundaryStart = d3.max([startDate, seasonStart]) as Date;
      const boundaryEnd = d3.min([endDate, seasonEnd]) as Date;

      const days = dataset.filter(
        (d) => xAccessor(d) > boundaryStart && xAccessor(d) <= boundaryEnd
      );

      if (!days.length) return;

      seasonsData.push({
        start: boundaryStart,
        end: boundaryEnd,
        name: seasonNames[index],
        mean: d3.mean(days, yAccessor) as number,
      });
    });
  });

  const seasonOffset = 10;

  const lineGenerator = d3
    .area<DownsampledWeatherData>()
    .x(xAccessorScaled)
    .y(yAccessorScaled)
    .curve(d3.curveBasis);

  const line = lineGenerator(downsampledData) as string;

  const yTicks = yScale.ticks(3);

  return (
    <div className={styles.container}>
      {/* Step 3. Draw canvas */}
      <Chart dimensions={dimensions} className={styles.chart}>
        {/* Step 5. Draw data */}
        {seasonsData.map((season, idx) => (
          <rect
            key={season.name + idx}
            className={[styles.season, styles[season.name.toLowerCase()]].join(
              " "
            )}
            x={xScale(season.start)}
            y={seasonOffset}
            width={xScale(season.end) - xScale(season.start)}
            height={dimensions.boundedHeight - seasonOffset}
          />
        ))}
        <path className={styles.line} d={line} />
        {/* 
          //! Let's add the original points back in, in the form of small circles.
          //? We don't want to lose the granularity of the original data,
          //? even when we're getting the basic trend with the downsampled line.
        */}
        {dataset.map((data) => (
          <circle
            key={data.date}
            className={styles.dot}
            cx={xAccessorScaled(data)}
            cy={yAccessorScaled(data)}
            r={2}
          />
        ))}
        {/* Step 6. Draw peripherals */}
        {/* 
          //! While we've made it easier to compare trends across seasons,
          //! it's not easy to conclude how the seasons compare in general.
          //? Let's add seasonal means as lines, which should enhance the chart
          //? but not take away from the main picture.
        */}
        {seasonsData.map((season, idx) => (
          <line
            key={season.name + idx}
            className={styles.seasonMean}
            x1={xScale(season.start)}
            x2={xScale(season.end)}
            y1={yScale(season.mean)}
            y2={yScale(season.mean)}
          />
        ))}
        <text
          className={styles.seasonMeanLabel}
          x={-15}
          y={yScale(seasonsData[0].mean)}
        >
          Season mean
        </text>
        <g
          className={styles.yAxis}
          fontFamily="sans-serif"
          fontSize={10}
          textAnchor="end"
        >
          {yTicks.map((tick, i) => (
            <g
              key={i}
              className={styles.tick}
              transform={`translate(0, ${yScale(tick)})`}
            >
              <text x={-9} dy="0.32em">
                {d3.format(".1f")(tick)}
              </text>
            </g>
          ))}
        </g>
        <text
          className={[styles.yAxisLabel, styles.yAxisLabelSuffix].join(" ")}
          y={5.5}
        >
          relative humidity
        </text>
        {/* 
          //! Let's label the seasons directly on the chart instead of having an x axis
        */}
        {seasonsData
          .filter((season) => xScale(season.end) - xScale(season.start) > 60)
          .map((season) => (
            <text
              key={season.name}
              className={styles.seasonLabel}
              x={
                xScale(season.start) +
                (xScale(season.end) - xScale(season.start)) / 2
              }
              y={dimensions.boundedHeight + 30}
            >
              {season.name}
            </text>
          ))}
      </Chart>
    </div>
  );
}

export default DatavizBasics;
