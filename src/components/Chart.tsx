import * as React from "react";

import type { BoundedDimensions } from "../utils/types";

interface ChartProps {
  dimensions: BoundedDimensions;
  children?: React.ReactNode;
}

const ChartContext = React.createContext<BoundedDimensions>({
  width: 0,
  height: 0,
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  boundedWidth: 0,
  boundedHeight: 0,
});

export function useDimensionsContext() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useDimensionsContext must be used within a <Chart />");
  }
  return context;
}

function Chart({ dimensions, children }: ChartProps) {
  return (
    <ChartContext.Provider value={dimensions}>
      <svg
        className="Chart"
        width={dimensions.width}
        height={dimensions.height}
      >
        <g
          transform={`translate(${dimensions.margin.left}, ${dimensions.margin.top})`}
        >
          {children}
        </g>
      </svg>
    </ChartContext.Provider>
  );
}

export default Chart;
