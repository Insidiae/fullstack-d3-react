import * as React from "react";
import * as d3 from "d3";

import type { DataRecord, ScaledAccessorFunction } from "../utils/types";

import styles from "./styles/Line.module.css";

interface LineProps extends React.SVGAttributes<SVGLineElement> {
  type?: "line" | "area";
  data: DataRecord[];
  xAccessor: ScaledAccessorFunction;
  yAccessor: ScaledAccessorFunction;
  y0Accessor?: ScaledAccessorFunction;
  interpolation?: d3.CurveFactory;
}

function Line({
  type = "line",
  data,
  xAccessor,
  yAccessor,
  y0Accessor = () => 0,
  interpolation = d3.curveMonotoneX,
  ...props
}: LineProps) {
  const lineGenerator = d3[type]<DataRecord>();

  lineGenerator.x(xAccessor);
  lineGenerator.y(yAccessor);
  lineGenerator.curve(interpolation);

  if (type == "area") {
    (lineGenerator as d3.Area<DataRecord>).y0(y0Accessor).y1(yAccessor);
  }

  const line = lineGenerator(data) as string;

  return <path {...props} className={styles[type]} d={line} />;
}

export default Line;
