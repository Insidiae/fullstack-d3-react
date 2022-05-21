import * as React from "react";
import * as d3 from "d3";

import styles from "./styles/Line.module.css";

interface LineProps<DataType> extends React.SVGAttributes<SVGPathElement> {
  type?: "line" | "area";
  data: DataType[];
  xAccessor: (d: DataType) => number;
  yAccessor: (d: DataType) => number;
  y0Accessor?: (d: DataType) => number;
  interpolation?: d3.CurveFactory;
}

function Line<DataType>({
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

  return <path {...props} className={styles[type]} d={line} />;
}

export default Line;
