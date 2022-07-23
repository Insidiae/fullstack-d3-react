import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";
import Axis from "../components/Axis";

import type { WeatherData } from "../hooks/useWeatherData";
import type { BoundedDimensions } from "../utils/types";

import styles from "./styles/HistogramInteractions.module.css";

//* Step 2. Create chart dimensions
const width = 600;

const dimensions: BoundedDimensions = {
  width,
  //? Histograms are easiest to read when they are wider than they are tall!
  height: width * 0.6,
  margin: {
    top: 30,
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

type TooltipState = {
  show: boolean;
  range?: {
    min: number;
    max: number;
  };
  value?: number;
  coords: {
    x: number;
    y: number;
  };
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

function HistogramInteractions({ dataset }: { dataset: WeatherData[] }) {
  //* Step 1b. Access Data
  const xAccessor = (d: WeatherData) => d.humidity;

  //* Step 4. Create scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor) as [number, number])
    .range([0, dimensions.boundedWidth])
    .nice();

  const binGenerator = d3
    .bin<WeatherData, number>()
    .domain(xScale.domain() as [number, number])
    .value(xAccessor)
    .thresholds(12);

  const bins = binGenerator(dataset);
  type WeatherDataBin = typeof bins[number];

  const yAccessor = (bin: WeatherDataBin) => bin.length;

  const yScale = d3
    .scaleLinear()
    //? For histograms, we want the y axis to always start at 0
    .domain([0, d3.max(bins, yAccessor)] as [0, number])
    .range([dimensions.boundedHeight, 0])
    .nice();

  const barPadding = 1;
  const xAccessorScaled = (d: WeatherDataBin) =>
    xScale(d.x0 as number) + barPadding;
  const yAccessorScaled = (bin: WeatherDataBin) => yScale(yAccessor(bin));

  const widthAccessorScaled = (d: WeatherDataBin) =>
    xScale(d.x1 as number) - xScale(d.x0 as number) - barPadding;
  const heightAccessorScaled = (d: WeatherDataBin) =>
    dimensions.boundedHeight - yScale(yAccessor(d));

  const midpointAccessorScaled = (d: WeatherDataBin) =>
    xScale(d.x0 as number) +
    (xScale(d.x1 as number) - xScale(d.x0 as number)) / 2;

  const mean = d3.mean(dataset, xAccessor) as number;

  //* Step 7a. Handle interactions
  const [tooltip, dispatch] = React.useReducer(tooltipReducer, {
    show: false,
    coords: {
      x: 0,
      y: 0,
    },
  });

  function showTooltip(bin: WeatherDataBin) {
    const x =
      xScale(bin.x0 as number) +
      barPadding / 2 +
      (xScale(bin.x1 as number) - xScale(bin.x0 as number)) / 2 +
      dimensions.margin.left;
    const y = yScale(yAccessor(bin)) + dimensions.margin.top;

    dispatch({
      type: "SHOW",
      payload: {
        range: {
          min: bin.x0 as number,
          max: bin.x1 as number,
        },
        value: bin.length,
        coords: {
          x,
          y,
        },
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
          {/* Step 5. Draw data */}
          <g role="list" tabIndex={0} aria-label="histogram bars">
            {bins.map((bin, i) => (
              <g
                key={`histogram-bin-${i}`}
                className={styles.bin}
                role="listitem"
                tabIndex={0}
                aria-label={`There were ${yAccessor(
                  bin
                )} days with humidity between ${bin.x0} and ${bin.x1}`}
                onMouseEnter={() => showTooltip(bin)}
                onMouseLeave={() => hideTooltip()}
                //? We can even add interactions on accessible focus/blur events!
                onFocus={() => showTooltip(bin)}
                onBlur={() => hideTooltip()}
              >
                <rect
                  x={xAccessorScaled(bin)}
                  y={yAccessorScaled(bin)}
                  width={widthAccessorScaled(bin)}
                  height={heightAccessorScaled(bin)}
                  fill="hsl(221deg 98% 67%)"
                />
                <text
                  x={midpointAccessorScaled(bin)}
                  y={yAccessorScaled(bin) - 5}
                  textAnchor="middle"
                  fill="hsl(0deg 0% 40%)"
                  fontSize="12px"
                >
                  {yAccessor(bin)}
                </text>
              </g>
            ))}
          </g>
          {/* Step 6. Draw peripherals */}
          <line
            x1={xScale(mean)}
            x2={xScale(mean)}
            y1={-15}
            y2={dimensions.boundedHeight}
            stroke="maroon"
            strokeDasharray="2px 4px"
          />
          <text
            role="presentation"
            aria-hidden={true}
            x={xScale(mean)}
            y={-20}
            textAnchor="middle"
            fill="maroon"
            fontSize="12px"
          >
            mean
          </text>
          <Axis dimension="x" scale={xScale} label="Humidity" />
        </Chart>
        {/* Step 7b. Create interactions */}
        <div
          className={styles.tooltip}
          style={{
            opacity: tooltip.show ? 1 : 0,
            transform: `translate(calc(${tooltip.coords.x}px - 50%), calc(${tooltip.coords.y}px - 100%))`,
          }}
        >
          <div className={styles.tooltipRange}>
            Humidity:{" "}
            <span id="range">
              {tooltip.range?.min} - {tooltip.range?.max}
            </span>
          </div>
          <div className="tooltipValue">
            <span id="count">{tooltip.value}</span> days
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistogramInteractions;
