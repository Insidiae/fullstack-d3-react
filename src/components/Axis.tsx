import * as React from "react";
import * as d3 from "d3";

import { useDimensionsContext } from "./Chart";

import type { BoundedDimensions } from "../utils/types";

import styles from "./styles/Axis.module.css";

const formatNumber = d3.format(",");

type FormatTickFunction = ((n: number) => string) | ((date: Date) => string);

interface BaseAxisProps {
  dimension: "x" | "y";
  scale:
    | d3.ScaleTime<number, number, never>
    | d3.ScaleLinear<number, number, never>;
  formatTick?: FormatTickFunction;
  label?: string;
  numberOfTicks?: number;
}
function Axis({
  dimension = "x",
  scale,
  formatTick = formatNumber,
  label = "",
  numberOfTicks,
  ...props
}: BaseAxisProps) {
  const dimensions = useDimensionsContext() as BoundedDimensions;

  switch (dimension) {
    case "x":
      return (
        <AxisHorizontal
          scale={scale}
          formatTick={formatTick}
          dimensions={dimensions}
          label={label}
          numberOfTicks={numberOfTicks}
          {...props}
        />
      );
    case "y":
      return (
        <AxisVertical
          scale={scale}
          formatTick={formatTick}
          dimensions={dimensions}
          label={label}
          numberOfTicks={numberOfTicks}
          {...props}
        />
      );
    default:
      throw new Error("Please specify x or y dimension!");
  }
}

interface AxisProps extends Omit<BaseAxisProps, "dimension"> {
  dimensions: BoundedDimensions;
  formatTick: FormatTickFunction;
}

function AxisHorizontal({
  dimensions,
  label,
  formatTick,
  scale,
  numberOfTicks,
  ...props
}: AxisProps) {
  //? Let's aim for one tick per 100 pixels for small screens
  //? and one tick per 250 pixels for wider screens
  // const numberOfTicks =
  //   dimensions.boundedWidth < 600
  //     ? dimensions.boundedWidth / 100
  //     : dimensions.boundedWidth / 250;
  // const ticks = scale.ticks(numberOfTicks);
  const ticks = scale.ticks(numberOfTicks);

  return (
    <g
      className="Axis AxisHorizontal"
      {...props}
      transform={`translate(0, ${dimensions.boundedHeight})`}
    >
      <line className={styles.axisLine} x2={dimensions.boundedWidth} />
      {ticks.map((tick, i) => (
        <g key={i} transform={`translate(${scale(tick)}, 0)`}>
          <line stroke="black" y2={6} />
          <text className={styles.axisTickHorizontal} y={9} dy="0.71em">
            {formatTick(tick as number & Date)}
          </text>
        </g>
      ))}
      {label ? (
        <text
          className={styles.axisLabel}
          transform={`translate(${dimensions.boundedWidth / 2}, ${
            dimensions.margin.bottom - 10
          })`}
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function AxisVertical({
  dimensions,
  label,
  formatTick,
  scale,
  numberOfTicks,
  ...props
}: AxisProps) {
  // const numberOfTicks = dimensions.boundedHeight / 70;
  // const ticks = scale.ticks(numberOfTicks);
  const ticks = scale.ticks(numberOfTicks);

  return (
    <g className="Axis AxisVertical" {...props}>
      <line className={styles.axisLine} y2={dimensions.boundedHeight} />
      {ticks.map((tick, i) => (
        <g key={i} transform={`translate(0, ${scale(tick)})`}>
          <line stroke="black" x2={-6} />
          <text className={styles.axisTickVertical} x={-9}>
            {formatTick(tick as number & Date)}
          </text>
        </g>
      ))}
      {label ? (
        <text
          className={styles.axisLabel}
          transform={`translate(${-dimensions.margin.left + 10}, ${
            dimensions.boundedHeight / 2
          }) rotate(-90)`}
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export default Axis;
