import * as React from "react";
import * as d3 from "d3";
import { animated, AnimatedProps } from "@react-spring/web";

import styles from "./styles/Line.module.css";

interface LineProps<DataType>
  extends AnimatedProps<React.SVGAttributes<SVGPathElement>> {
  type?: "line" | "area";
  data: DataType[];
  xAccessor: (d: DataType) => number;
  yAccessor: (d: DataType) => number;
  y0Accessor?: (d: DataType) => number;
  interpolation?: d3.CurveFactory;
}

function AnimatedLine<DataType>({
  type = "line",
  data,
  xAccessor,
  yAccessor,
  y0Accessor = () => 0,
  interpolation = d3.curveMonotoneX,
  ...props
}: LineProps<DataType>) {
  const lineGenerator = d3[type]<DataType>();

  lineGenerator.x(xAccessor);
  lineGenerator.y(yAccessor);
  lineGenerator.curve(interpolation);

  if (type == "area") {
    (lineGenerator as d3.Area<DataType>).y0(y0Accessor).y1(yAccessor);
  }

  const line = lineGenerator(data) as string;

  return <animated.path {...props} className={styles[type]} d={line} />;
}

export default AnimatedLine;
