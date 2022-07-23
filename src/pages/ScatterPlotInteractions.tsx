import * as React from "react";
import * as d3 from "d3";
import { useTransition, animated, config } from "@react-spring/web";

import Chart from "../components/Chart";
import Axis from "../components/Axis";

import type { BoundedDimensions } from "../utils/types";

import type { WeatherData } from "../hooks/useWeatherData";

import styles from "./styles/ScatterplotInteractions.module.css";

//* Step 1b. Access Data
const xAccessor = (d: WeatherData) => d.dewPoint;
const yAccessor = (d: WeatherData) => d.humidity;

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

type TooltipState = {
  show: boolean;
  coords: {
    x: number;
    y: number;
  };
  formattedDate?: string;
  dewpoint?: number;
  humidity?: number;
  dot?: [
    {
      cx: number;
      cy: number;
    }
  ];
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
      return { ...state, show: false, dot: undefined };
    case "SHOW":
      return { ...state, show: true, ...action.payload };
  }
}

function ScatterPlotInteractions({ dataset }: { dataset: WeatherData[] }) {
  //* Step 4. Create scales
  const xScale = d3
    .scaleTime()
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

  //? Let's create a Voronoi diagram from our data points!
  //? https://en.wikipedia.org/wiki/Voronoi_diagram
  //? Each voronoi cell will serve as our hover target
  //? so the user can hover on a much larger surface area than our small dots.
  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
  );
  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;

  //* Step 7a. Handle interactions
  const [tooltip, dispatch] = React.useReducer(tooltipReducer, {
    show: false,
    coords: {
      x: 0,
      y: 0,
    },
  });

  function showTooltip(d: WeatherData) {
    const dateParser = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%A, %B %-d, %Y");

    const x = xAccessorScaled(d) + dimensions.margin.left;
    const y = yAccessorScaled(d) + dimensions.margin.top;

    dispatch({
      type: "SHOW",
      payload: {
        coords: {
          x,
          y,
        },
        dot: [
          {
            cx: xAccessorScaled(d),
            cy: yAccessorScaled(d),
          },
        ],
        formattedDate: formatDate(dateParser(d.date) as Date),
        dewpoint: xAccessor(d),
        humidity: yAccessor(d),
      },
    });
  }

  function hideTooltip() {
    dispatch({ type: "HIDE" });
  }

  const transitions = useTransition(tooltip.dot, {
    from: { r: 0 },
    enter: { r: 7 },
    leave: { r: 0 },
    config: config.wobbly,
  });

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Step 3. Draw canvas */}
        <Chart dimensions={dimensions}>
          {/* Step 5. Draw data */}
          {dataset.map((data, idx) => (
            <circle
              key={idx}
              className={styles.dot}
              cx={xAccessorScaled(data)}
              cy={yAccessorScaled(data)}
              r={4}
            />
          ))}
          {dataset.map((data, idx) => (
            <path
              key={idx}
              className={styles.voronoi}
              d={voronoi.renderCell(idx)}
              onMouseEnter={() => showTooltip(data)}
              onMouseLeave={() => hideTooltip()}
            />
          ))}
          {/* Step 6. Draw peripherals */}
          {transitions(({ r }, dot) =>
            dot ? (
              <animated.circle
                // style={style}
                className={styles.tooltipDot}
                r={r}
                cx={dot.cx}
                cy={dot.cy}
                fill="hsl(259deg 98% 67%)"
              />
            ) : null
          )}
          <Axis dimension="x" scale={xScale} label="Dew point (&deg;F)" />
          <Axis
            dimension="y"
            scale={yScale}
            numberOfTicks={4}
            formatTick={formatTick}
            label="Relative Humidity"
          />
        </Chart>
        {/* Step 7b. Create interactions */}
        <div
          id="tooltip"
          className={styles.tooltip}
          style={{
            opacity: tooltip.show ? 1 : 0,
            transform: `translate(calc(${tooltip.coords.x}px - 50%), calc(${tooltip.coords.y}px - 100%))`,
          }}
        >
          <div className={styles.tooltipDate}>
            <span id="date">{tooltip.formattedDate}</span>
          </div>
          <div className="tooltip-humidity">
            Humidity: <span id="humidity">{tooltip.humidity}</span>
          </div>
          <div className="tooltip-dew-point">
            Dew Point: <span id="dew-point">{tooltip.dewpoint}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScatterPlotInteractions;
