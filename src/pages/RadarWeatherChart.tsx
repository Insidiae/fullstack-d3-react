import * as React from "react";
import * as d3 from "d3";

import type { BoundedDimensions } from "../utils/types";

import type { WeatherData, precipTypeOption } from "../hooks/useWeatherData";

import styles from "./styles/RadarWeatherChart.module.css";

//* Step 1a. Access Data
const temperatureMinAccessor = (d: WeatherData) => d.temperatureMin;
const temperatureMaxAccessor = (d: WeatherData) => d.temperatureMax;
const uvIndexAccessor = (d: WeatherData) => d.uvIndex;
const precipProbabilityAccessor = (d: WeatherData) => d.precipProbability;
const precipTypeAccessor = (d: WeatherData) => d.precipType as precipTypeOption;
const cloudCoverAccessor = (d: WeatherData) => d.cloudCover;
const dateParser = d3.timeParse("%Y-%m-%d");
const dateAccessor = (d: WeatherData) => dateParser(d.date) as Date;

//* Step 2. Create chart dimensions
interface RadarDimensions extends BoundedDimensions {
  radius: number;
  boundedRadius: number;
}

const diameter = 600;
const dimensions: RadarDimensions = {
  width: diameter,
  height: diameter,
  radius: diameter / 2,
  margin: {
    top: 120,
    right: 120,
    bottom: 120,
    left: 120,
  },
  boundedWidth: 0,
  boundedHeight: 0,
  boundedRadius: 0,
};

dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
dimensions.boundedRadius =
  dimensions.radius - (dimensions.margin.left + dimensions.margin.right) / 2;

const numberOfStops = 10;
const gradientColorScale = d3.interpolateYlOrRd;

function getCoordinatesForAngle(angle: number, offset = 1) {
  return [
    Math.cos(angle - Math.PI / 2) * dimensions.boundedRadius * offset,
    Math.sin(angle - Math.PI / 2) * dimensions.boundedRadius * offset,
  ];
}

function getAngleFromCoordinates(x: number, y: number) {
  const angle = Math.atan2(y, x) + Math.PI / 2;
  return angle > 0 ? angle : angle + Math.PI * 2;
}

const uvIndexThreshold = 8;
const uvIndexOffset = 0.95;

const cloudCoverOffset = 1.27;

const precipTypes = ["rain", "sleet", "snow"] as const;
const precipOffset = 1.14;

const precipColorScale = d3
  .scaleOrdinal<string>()
  .domain(precipTypes)
  .range(["hsl(213deg 100% 66%)", "hsl(196deg 7% 42%)", "hsl(198deg 12% 73%)"]); // ["#54a0ff", "#636e72", "#b2bec3"]

function drawAnnotation(angle: number, offset: number, text: string) {
  const [x1, y1] = getCoordinatesForAngle(angle, offset);
  const [x2, y2] = getCoordinatesForAngle(angle, 1.6);

  return (
    <>
      <line className={styles.annotationLine} x1={x1} x2={x2} y1={y1} y2={y2} />
      <text className={styles.annotationText} x={x2 + 6} y={y2}>
        {text}
      </text>
    </>
  );
}

type TooltipState = {
  show: boolean;
  coords: {
    x: number;
    y: number;
  };
  angle: number;
  dataPoint: WeatherData;
  formattedDate?: string;
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

const tooltipArcGenerator = d3
  .arc<number>()
  .innerRadius(0)
  .outerRadius(dimensions.boundedRadius * 1.6)
  .startAngle((angle) => angle - 0.015)
  .endAngle((angle) => angle + 0.015);

function RadarWeatherChart({ dataset }: { dataset: WeatherData[] }) {
  //* Step 4. Create scales
  const angleScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, dateAccessor) as [Date, Date])
    .range([0, 2 * Math.PI]); //? this is in radians

  const radiusScale = d3
    .scaleLinear()
    //? We want to scale both temperatureMin and temperatureMax for the radius
    .domain(
      d3.extent([
        ...dataset.map(temperatureMinAccessor),
        ...dataset.map(temperatureMaxAccessor),
      ]) as [number, number]
    )
    .range([0, dimensions.boundedRadius])
    .nice();

  const temperatureColorScale = d3
    .scaleSequential()
    .domain(radiusScale.domain())
    .interpolator(gradientColorScale);

  //* Step 7a. Handle interactions
  const [tooltip, dispatch] = React.useReducer(tooltipReducer, {
    show: false,
    coords: {
      x: 0,
      y: 0,
    },
    angle: 0,
    dataPoint: dataset[0],
  });

  function showTooltip(event: React.MouseEvent) {
    const [mouseX, mouseY] = d3.pointer(event);

    const angle = getAngleFromCoordinates(mouseX, mouseY);

    const date = angleScale.invert(angle);
    const dateString = d3.timeFormat("%Y-%m-%d")(date);
    const dataPoint = dataset.find((d) => d.date === dateString);

    if (!dataPoint) {
      return;
    }

    const [x, y] = getCoordinatesForAngle(angle, 1.6);
    dispatch({
      type: "SHOW",
      payload: {
        coords: {
          x,
          y,
        },
        angle,
        dataPoint,
        formattedDate: d3.timeFormat("%B %-d")(date),
      },
    });
  }

  function hideTooltip() {
    dispatch({ type: "HIDE" });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>New York City Weather in 2018</h2>

      <div id="wrapper" className={styles.wrapper}>
        {/* Step 3. Draw canvas */}
        <svg
          className={styles.chart}
          width={dimensions.width}
          height={dimensions.height}
        >
          <defs>
            <radialGradient id="temperature-gradient">
              {d3.range(numberOfStops).map((i) => (
                <stop
                  key={i}
                  offset={`${(i * 100) / (numberOfStops - 1)}%`}
                  stopColor={gradientColorScale(i / (numberOfStops - 1))}
                />
              ))}
            </radialGradient>
          </defs>
          {/* 
            //? To make our math simpler, let’s instead shift our bounds
            //? to start in the center of our chart.
            //? This will help us when we decide where to place our
            //? data and peripheral elements – we’ll only need to know
            //? where they lie in respect to the center of our circle.
          */}
          <g
            style={{
              transform: `translate(${
                dimensions.margin.left + dimensions.boundedRadius
              }px, ${dimensions.margin.top + dimensions.boundedRadius}px)`,
            }}
          >
            <MemoizedChartBody
              dataset={dataset}
              angleScale={angleScale}
              radiusScale={radiusScale}
            />
            {/* Step 7b. Set up interactions */}
            <circle
              className={styles.listenerCircle}
              r={dimensions.radius}
              onMouseMove={showTooltip}
              onMouseLeave={() => hideTooltip()}
            />
            <path
              className={styles.tooltipLine}
              style={{ opacity: tooltip.show ? 1 : 0 }}
              d={tooltipArcGenerator(tooltip.angle) as string}
            />
          </g>
        </svg>
        <div
          id="tooltip"
          className={styles.tooltip}
          style={{
            opacity: tooltip.show ? 1 : 0,
            transform: `translate(calc(${
              tooltip.coords.x +
              dimensions.margin.left +
              dimensions.boundedRadius
            }px + ${
              tooltip.coords.x < -50
                ? "40px - 100"
                : tooltip.coords.x > 50
                ? "-40px + 0"
                : "-50"
            }%), calc(${
              tooltip.coords.y +
              dimensions.margin.top +
              dimensions.boundedRadius
            }px + ${
              tooltip.coords.y < -50
                ? "40px - 100"
                : tooltip.coords.y > 50
                ? "-40px + 0"
                : "-50"
            }%))`,
          }}
        >
          <div id="tooltip-date" className={styles.tooltipDate}>
            {tooltip.formattedDate}
          </div>
          <div id="tooltip-temperature" className={styles.tooltipTemperature}>
            <span
              id="tooltip-temperature-min"
              style={{
                color: temperatureColorScale(
                  temperatureMinAccessor(tooltip.dataPoint)
                ),
              }}
            >
              {d3.format(".1f")(temperatureMinAccessor(tooltip.dataPoint))}
              &deg;F
            </span>
            -
            <span
              id="tooltip-temperature-max"
              style={{
                color: temperatureColorScale(
                  temperatureMaxAccessor(tooltip.dataPoint)
                ),
              }}
            >
              {d3.format(".1f")(temperatureMaxAccessor(tooltip.dataPoint))}
              &deg;F
            </span>
          </div>
          <div className={[styles.tooltipMetric, styles.tooltipUv].join(" ")}>
            <div>UV Index</div>
            <div id="tooltip-uv">{uvIndexAccessor(tooltip.dataPoint)}</div>
          </div>
          <div
            className={[styles.tooltipMetric, styles.tooltipCloud].join(" ")}
          >
            <div>Cloud Cover</div>
            <div id="tooltip-cloud">
              {cloudCoverAccessor(tooltip.dataPoint)}
            </div>
          </div>
          <div
            className={[styles.tooltipMetric, styles.tooltipPrecip].join(" ")}
          >
            <div>Precipitation Probability</div>
            <div id="tooltip-precip">
              {d3.format(".0%")(precipProbabilityAccessor(tooltip.dataPoint))}
            </div>
          </div>
          <div
            className={[styles.tooltipMetric, styles.tooltipPrecipType].join(
              " "
            )}
          >
            <div>Precipitation Type</div>
            <div
              id="tooltip-precip-type"
              style={{
                color: precipTypeAccessor(tooltip.dataPoint)
                  ? precipColorScale(precipTypeAccessor(tooltip.dataPoint))
                  : "hsl(210deg 4% 86%)",
              }}
            >
              {precipTypeAccessor(tooltip.dataPoint)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//! We're rendering a LOT of data in our chart, so it might be wise to memoize it!
type ChartBodyProps = {
  dataset: WeatherData[];
  angleScale: d3.ScaleTime<number, number>;
  radiusScale: d3.ScaleLinear<number, number>;
};

function ChartBody({ dataset, angleScale, radiusScale }: ChartBodyProps) {
  const months = d3.timeMonths(...(angleScale.domain() as [Date, Date]));

  const cloudRadiusScale = d3
    .scaleSqrt()
    .domain(d3.extent(dataset, cloudCoverAccessor) as [number, number])
    .range([1, 10]);

  const precipRadiusScale = d3
    .scaleSqrt()
    .domain(d3.extent(dataset, precipProbabilityAccessor) as [number, number])
    .range([0, 8]);

  function getXFromDataPoint(d: WeatherData, offset = 1.4) {
    return getCoordinatesForAngle(angleScale(dateAccessor(d)), offset)[0];
  }
  function getYFromDataPoint(d: WeatherData, offset = 1.4) {
    return getCoordinatesForAngle(angleScale(dateAccessor(d)), offset)[1];
  }

  const temperatureTicks = radiusScale.ticks(4);

  const areaGenerator = d3
    .areaRadial<WeatherData>()
    .angle((d) => angleScale(dateAccessor(d)))
    .innerRadius((d) => radiusScale(temperatureMinAccessor(d)))
    .outerRadius((d) => radiusScale(temperatureMaxAccessor(d)));

  return (
    <>
      {/* 
        //? For this type of chart that we're building, it would be
        //? more helpful to draw the peripherals before we draw the data.
      */}
      {/* Step 5. Draw peripherals */}
      <g>
        {months.map((month) => {
          const angle = angleScale(month);
          const [x2, y2] = getCoordinatesForAngle(angle, 1);
          const [labelX, labelY] = getCoordinatesForAngle(angle, 1.38);

          return (
            <React.Fragment key={month.toString()}>
              <line className={styles.gridLine} x2={x2} y2={y2} />
              <text
                className={styles.tickLabel}
                x={labelX}
                y={labelY}
                textAnchor={
                  Math.abs(labelX) < 5 ? "middle" : labelX > 0 ? "start" : "end"
                }
              >
                {d3.timeFormat("%b")(month)}
              </text>
            </React.Fragment>
          );
        })}
        {temperatureTicks.map((tick) => (
          <circle
            key={tick}
            className={styles.gridLine}
            r={radiusScale(tick)}
          />
        ))}
        {temperatureTicks.map((tick) =>
          tick > 0 ? (
            <React.Fragment key={tick}>
              <rect
                y={-10 - radiusScale(tick)}
                width={40}
                height={20}
                fill="hsl(210deg 17% 98%)"
              />
              <text
                className={styles.gridLabel}
                x={4}
                y={2 - radiusScale(tick)}
              >
                {d3.format(".0f")(tick)}&deg;F
              </text>
            </React.Fragment>
          ) : null
        )}
      </g>
      <circle className={styles.freezingCircle} r={radiusScale(32)} />
      {/* Step 6. Draw data */}
      <path
        d={areaGenerator(dataset) as string}
        fill="url(#temperature-gradient)"
      />
      <g>
        {dataset
          .filter((d) => uvIndexAccessor(d) >= uvIndexThreshold)
          .map((d) => (
            <line
              key={d.date}
              className={styles.uvIndexLine}
              x1={getXFromDataPoint(d, uvIndexOffset)}
              y1={getYFromDataPoint(d, uvIndexOffset)}
              x2={getXFromDataPoint(d, uvIndexOffset + 0.1)}
              y2={getYFromDataPoint(d, uvIndexOffset + 0.1)}
            />
          ))}
      </g>
      <g>
        {dataset.map((d) => (
          <circle
            key={d.date}
            className={styles.cloudCoverDot}
            cx={getXFromDataPoint(d, cloudCoverOffset)}
            cy={getYFromDataPoint(d, cloudCoverOffset)}
            r={cloudRadiusScale(cloudCoverAccessor(d))}
          />
        ))}
      </g>
      <g>
        {dataset
          .filter((d) => d.precipProbability)
          .map((d) => (
            <circle
              key={d.date}
              className={styles.precipDot}
              cx={getXFromDataPoint(d, precipOffset)}
              cy={getYFromDataPoint(d, precipOffset)}
              r={precipRadiusScale(precipProbabilityAccessor(d))}
              fill={precipColorScale(precipTypeAccessor(d))}
            />
          ))}
      </g>
      <g>
        {drawAnnotation(Math.PI * 0.23, cloudCoverOffset, "Cloud Cover")}
        {drawAnnotation(Math.PI * 0.26, precipOffset, "Precipitation")}
        {drawAnnotation(
          Math.PI * 0.734,
          uvIndexOffset,
          `UV Index over ${uvIndexThreshold}`
        )}
        {drawAnnotation(Math.PI * 0.7, 0.5, "Temperature")}
        {drawAnnotation(
          Math.PI * 0.9,
          radiusScale(32) / dimensions.boundedRadius,
          "Freezing Temperature"
        )}
        {precipTypes.map((precipType, index) => {
          const [labelX, labelY] = getCoordinatesForAngle(Math.PI * 0.26, 1.6);

          return (
            <React.Fragment key={precipType}>
              <circle
                className={styles.precipDot}
                cx={labelX + 15}
                cy={labelY + 16 * (index + 1)}
                r={4}
                fill={precipColorScale(precipType)}
              />
              <text
                className={styles.annotationText}
                x={labelX + 25}
                y={labelY + 16 * (index + 1)}
                style={{ fill: precipColorScale(precipType) }}
              >
                {precipType}
              </text>
            </React.Fragment>
          );
        })}
      </g>
    </>
  );
}

const MemoizedChartBody = React.memo(ChartBody, (prevProps, nextProps) => {
  //? re-render ONLY IF we receive a different dataset
  if (prevProps.dataset !== nextProps.dataset) {
    return false;
  }

  return true;
});

MemoizedChartBody.displayName = "MemoizedChartBody";

export default RadarWeatherChart;
