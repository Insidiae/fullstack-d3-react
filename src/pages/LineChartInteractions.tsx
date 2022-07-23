import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";
import Line from "../components/Line";
import Axis from "../components/Axis";

import type { BoundedDimensions } from "../utils/types";

import type { WeatherData } from "../hooks/useWeatherData";

import styles from "./styles/LineChartInteractions.module.css";

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

type TooltipState = {
  show: boolean;
  coords: {
    x: number;
    y: number;
  };
  closestDataPoint: WeatherData;
  formattedDate?: string;
  temperature?: number;
};

type TooltipAction =
  | {
      type: "SHOW";
      payload: Omit<TooltipState, "show">;
    }
  | { type: "HIDE" };

function tooltipReducer(state: TooltipState, action: TooltipAction) {
  switch (action.type) {
    case "HIDE":
      return { ...state, show: false };
    case "SHOW":
      return { ...state, show: true, ...action.payload };
  }
}

function LineChartInteractions({ dataset }: { dataset: WeatherData[] }) {
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

  const freezingTemperaturePlacement = yScale(32);

  //* Step 7a. Handle interactions
  const [tooltip, dispatch] = React.useReducer(tooltipReducer, {
    show: false,
    coords: {
      x: 0,
      y: 0,
    },
    closestDataPoint: dataset[0],
  });

  function getDistanceFromHoveredDate(d: WeatherData, hoveredDate: Date) {
    // return Math.abs(xAccessor(d) - hoveredDate);
    //? Convert the Date values to Number so TypeScript doesn't complain
    return Math.abs(Number(xAccessor(d)) - Number(hoveredDate));
  }

  function showTooltip(event: React.MouseEvent) {
    console.log(event);
    const [mouseXPosition] = d3.pointer(event);
    const hoveredDate = xScale.invert(mouseXPosition);

    const closestIndex = d3.leastIndex(dataset, (current, next) => {
      return (
        getDistanceFromHoveredDate(current, hoveredDate) -
        getDistanceFromHoveredDate(next, hoveredDate)
      );
    });

    const closestDataPoint = dataset[closestIndex as number];

    const formatDate = d3.timeFormat("%A, %B %-d, %Y");

    const x = xAccessorScaled(closestDataPoint) + dimensions.margin.left;
    const y = yAccessorScaled(closestDataPoint) + dimensions.margin.top - 8;

    dispatch({
      type: "SHOW",
      payload: {
        coords: {
          x,
          y,
        },
        closestDataPoint,
        formattedDate: formatDate(xAccessor(closestDataPoint)),
        temperature: yAccessor(closestDataPoint),
      },
    });
  }

  function hideTooltip() {
    dispatch({ type: "HIDE" });
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Step 3. Draw canvas */}
        <Chart dimensions={dimensions}>
          <rect
            className={styles.freezing}
            x="0"
            y={freezingTemperaturePlacement}
            width={dimensions.boundedWidth}
            height={dimensions.boundedHeight - freezingTemperaturePlacement}
          />
          {/* Step 5. Draw data */}
          <Line
            data={dataset}
            xAccessor={xAccessorScaled}
            yAccessor={yAccessorScaled}
          />
          {/* Step 6. Draw peripherals */}
          <Axis dimension="x" scale={xScale} formatTick={formatTimelineDate} />
          <Axis
            dimension="y"
            scale={yScale}
            label="Maximum Temperature (&deg;F)"
          />
          {/* Step 7b. Set up interactions */}
          <rect
            className={styles.listenerRect}
            width={dimensions.boundedWidth}
            height={dimensions.boundedHeight}
            onMouseMove={showTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          <line
            className={styles.tooltipLine}
            style={{ opacity: tooltip.show ? 1 : 0 }}
            x1={xAccessorScaled(tooltip.closestDataPoint)}
            y1={dimensions.boundedHeight}
            x2={xAccessorScaled(tooltip.closestDataPoint)}
            y2={yAccessorScaled(tooltip.closestDataPoint)}
          />
          <circle
            className={styles.tooltipDot}
            style={{ opacity: tooltip.show ? 1 : 0 }}
            cx={xAccessorScaled(tooltip.closestDataPoint)}
            cy={yAccessorScaled(tooltip.closestDataPoint)}
            r={4}
          />
        </Chart>
        <div
          className={styles.tooltip}
          style={{
            opacity: tooltip.show ? 1 : 0,
            transform: `translate(calc(${tooltip.coords.x}px - 50%), calc(${tooltip.coords.y}px - 100%))`,
          }}
        >
          <div className={styles.tooltipDate}>
            <span id="date">{tooltip.formattedDate}</span>
          </div>
          <div className="tooltip-temperature">
            Maximum Temperature:{" "}
            <span id="temperature">{tooltip.temperature} &deg;F</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LineChartInteractions;
