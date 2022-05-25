import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";
import Line from "../components/Line";
import Axis from "../components/Axis";

import { useAsync } from "../hooks/useAsync";

import type {
  DataRecord,
  AccessorFunction,
  BoundedDimensions,
  ScaledAccessorFunction,
} from "../utils/types";

//* Step 1b. Access Data
const dateParser = d3.timeParse("%Y-%m-%d");
const xAccessor: AccessorFunction<Date> = (d) =>
  dateParser(d.date as string) as Date;
const yAccessor: AccessorFunction<number> = (d) => d.temperatureMax as number;

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

function LineChart() {
  //* Step 1a. Fetch Data
  const { data: dataset, status, error, run } = useAsync<Array<DataRecord>>();

  React.useEffect(() => {
    const datasetPromise = d3.json("/data/my_weather_data.json") as Promise<
      Array<DataRecord>
    >;

    run(datasetPromise);
  }, [run]);

  switch (status) {
    case "idle":
      return <span>Submit a pokemon</span>;
    case "pending":
      return <div>Loading...</div>;
    case "rejected":
      throw error;
    case "resolved": {
      //* Step 4. Create scales
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(dataset as DataRecord[], xAccessor) as [Date, Date])
        .range([0, dimensions.boundedWidth]);

      const yScale = d3
        .scaleLinear()
        .domain(
          d3.extent(dataset as DataRecord[], yAccessor) as [number, number]
        )
        .range([dimensions.boundedHeight, 0]);

      const xAccessorScaled: ScaledAccessorFunction = (d) =>
        xScale(xAccessor(d));
      const yAccessorScaled: ScaledAccessorFunction = (d) =>
        yScale(yAccessor(d));

      const freezingTemperaturePlacement = yScale(32);

      //* Notice how React lets us draw everything we need for the charts
      //* in such a nice, declarative way
      //* We can also abstract common steps in separate reusable components
      //* to make our workflow a lot easier!
      return (
        <div>
          {/* Step 3. Draw canvas */}
          <Chart dimensions={dimensions}>
            <rect
              x="0"
              width={dimensions.boundedWidth}
              y={freezingTemperaturePlacement}
              height={dimensions.boundedHeight - freezingTemperaturePlacement}
              fill="hsl(180deg 44% 92%)"
            />
            {/* Step 5. Draw data */}
            <Line
              data={dataset as DataRecord[]}
              xAccessor={xAccessorScaled}
              yAccessor={yAccessorScaled}
            />
            {/* Step 6. Draw peripherals */}
            <Axis
              dimension="x"
              scale={xScale}
              formatTick={formatTimelineDate}
            />
            <Axis dimension="y" scale={yScale} />
          </Chart>
        </div>
      );
    }
  }
}

export default LineChart;
