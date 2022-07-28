import * as React from "react";
import * as d3 from "d3";

import Chart from "../components/Chart";

import { useAsync } from "../hooks/useAsync";

import type { Feature, FeatureCollection } from "geojson";

import type { BoundedDimensions } from "../utils/types";

import styles from "./styles/MapPage.module.css";

type CSVColumns =
  | "Country Name"
  | "Country Code"
  | "Series Name"
  | "Series Code"
  | "2017 [YR2017]";

type CountryData = {
  [key: string]: number;
};

export function useWorldData() {
  //* Step 1a. Fetch Data
  const { data, status, error, run } =
    useAsync<[FeatureCollection, d3.DSVRowArray<CSVColumns>]>();

  React.useEffect(() => {
    const abortController = new AbortController();
    const countryShapesRequest = d3.json(
      "/data/world-geojson.json"
    ) as Promise<FeatureCollection>;
    const datasetPromise = d3.csv("/data/data_bank_data.csv", {
      signal: abortController.signal,
    }) as Promise<d3.DSVRowArray<CSVColumns>>;

    run(Promise.all([countryShapesRequest, datasetPromise]));

    return () => {
      abortController.abort();
    };
  }, [run]);

  if (!data) {
    return { countryShapes: null, metricDataByCountry: null, status, error };
  }

  const metric = "Population growth (annual %)";
  const metricDataByCountry: CountryData = {};
  const [countryShapes, dataset] = data;

  dataset.forEach((d) => {
    if (d["Series Name"] === metric) {
      metricDataByCountry[d["Country Code"] as string] =
        +(d["2017 [YR2017]"] as string) || 0;
    }
  });

  return { countryShapes, metricDataByCountry, status, error };
}

type TooltipState = {
  show: boolean;
  coords: {
    x: number;
    y: number;
  };
  countryName?: string;
  value?: string;
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

function Map({
  countryShapes,
  metricDataByCountry,
}: {
  countryShapes: FeatureCollection;
  metricDataByCountry: CountryData;
}) {
  //* Step 1b. Access Data
  const metricValues = Object.values(metricDataByCountry);
  const countryNameAccessor = (feature: Feature) =>
    feature.properties?.["NAME"] as string;
  const countryIdAccessor = (feature: Feature) =>
    feature.properties?.["ADM0_A3_IS"] as string;

  //* Step 2. Create chart dimensions
  const dimensions: BoundedDimensions = {
    width: window.innerWidth * 0.9,
    height: 0,
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  };

  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;

  const sphere: d3.GeoSphere = { type: "Sphere" };
  const projection = d3
    .geoEqualEarth()
    .fitWidth(dimensions.boundedWidth, sphere);

  const pathGenerator = d3.geoPath(projection);
  // const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);
  const [, [, y1]] = pathGenerator.bounds(sphere);

  dimensions.boundedHeight = y1;
  dimensions.height =
    dimensions.boundedHeight + dimensions.margin.top + dimensions.margin.bottom;

  const legendGradientId = "legend-gradient";
  const gradientRange = ["indigo", "white", "darkgreen"];

  //* Step 4. Create scales
  //? metricValuesExtent starts below zero, which means some countries
  //? have negative population growth. We'll want to represent these
  //? negative and positive growths using a piecewise color scale.
  const metricValuesExtent = d3.extent(metricValues) as [number, number];
  //? We'll also want to create a scale which scales evenly on both sides
  const maxChange = d3.max([
    -metricValuesExtent[0],
    metricValuesExtent[1],
  ]) as number;

  const colorScale = d3
    .scaleLinear<string>()
    .domain([-maxChange, 0, maxChange])
    .range(gradientRange);

  const graticuleJson = d3.geoGraticule10();

  const legendWidth = 120;
  const legendHeight = 16;

  //* Step 7a. Handle Interactions
  const [currentPosition, setCurrentPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition((myPosition) => {
      const [x, y] = projection([
        myPosition.coords.longitude,
        myPosition.coords.latitude,
      ]) as [number, number];

      setCurrentPosition({ x, y });
    });
  }, [projection]);
  const [tooltip, dispatch] = React.useReducer(tooltipReducer, {
    show: false,
    coords: {
      x: 0,
      y: 0,
    },
  });

  function showTooltip(d: Feature) {
    const metricValue = metricDataByCountry[countryIdAccessor(d)];

    const [centerX, centerY] = pathGenerator.centroid(d);
    const x = centerX + dimensions.margin.left;
    const y = centerY + dimensions.margin.top;

    dispatch({
      type: "SHOW",
      payload: {
        coords: {
          x,
          y,
        },
        countryName: countryNameAccessor(d),
        value: `${d3.format(",.2f")(metricValue || 0)}%`,
      },
    });
  }

  function hideTooltip() {
    dispatch({ type: "HIDE" });
  }

  return (
    <div className={styles.wrapper}>
      {/* Step 3. Draw canvas */}
      <Chart dimensions={dimensions}>
        <defs>
          <linearGradient id={legendGradientId}>
            {gradientRange.map((d, i) => (
              <stop
                key={d}
                stopColor={d}
                offset={`${(i * 100) / (gradientRange.length - 1)}%`}
              />
            ))}
          </linearGradient>
        </defs>
        {/* Step 5. Draw data */}
        <path className={styles.earth} d={pathGenerator(sphere) ?? ""} />
        <path
          className={styles.graticule}
          d={pathGenerator(graticuleJson) ?? ""}
        />
        {/* {countryShapes.features.map((feature, idx) => {
          const metricValue = metricDataByCountry[countryIdAccessor(feature)];

          return (
            <path
              key={idx}
              className={styles.country}
              d={pathGenerator(feature) ?? ""}
              fill={metricValue ? colorScale(metricValue) : "#e2e6e9"}
              onMouseEnter={() => showTooltip(feature)}
              onMouseLeave={() => hideTooltip()}
            />
          );
        })} */}
        <MemoizedMapPath
          countryShapes={countryShapes}
          metricDataByCountry={metricDataByCountry}
          countryIdAccessor={countryIdAccessor}
          pathGenerator={pathGenerator}
          colorScale={colorScale}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
        {currentPosition ? (
          <circle
            className={styles.myLocation}
            cx={currentPosition.x}
            cy={currentPosition.y}
            r={10}
          />
        ) : null}
        {/* Step 6. Draw peripherals */}
        <g
          transform={`translate(${120}, ${
            dimensions.width < 800
              ? dimensions.boundedHeight - 30
              : dimensions.boundedHeight * 0.5
          })`}
        >
          <text className={styles.legendTitle} y={-23}>
            Population Growth
          </text>
          <text className={styles.legendByline} y={-9}>
            Percent change in 2017
          </text>
          <rect
            x={-legendWidth / 2}
            width={legendWidth}
            height={legendHeight}
            fill={`url(#${legendGradientId})`}
          />
          <text
            className={styles.legendValue}
            x={-legendWidth / 2 - 10}
            y={legendHeight / 2}
            textAnchor="end"
          >
            {d3.format(".1f")(-maxChange)}%
          </text>
          <text
            className={styles.legendValue}
            x={legendWidth / 2 + 10}
            y={legendHeight / 2}
          >
            {d3.format(".1f")(maxChange)}%
          </text>
        </g>
      </Chart>
      {/* Step 7b. Set up interactions */}
      <div
        className={styles.tooltip}
        style={{
          opacity: tooltip.show ? 1 : 0,
          transform: `translate(calc(${tooltip.coords.x}px - 50%), calc(${tooltip.coords.y}px - 100%))`,
        }}
      >
        <div className={styles.tooltipCountry} id="country">
          {tooltip.countryName}
        </div>
        <div className={styles.tooltipValue}>
          <span id="value">{tooltip.value}</span> population change
        </div>
      </div>
    </div>
  );
}

//! Rendering the map seems to be expensive enough to cause janky interactions,
//! so it might be a good idea to memoize it!
//TODO: Instead of memoizing this whole component and passing A LOT of props,
//TODO: see if we can memoize the props in the first place!
function MapPath({
  countryShapes,
  metricDataByCountry,
  countryIdAccessor,
  pathGenerator,
  colorScale,
  showTooltip,
  hideTooltip,
}: {
  countryShapes: FeatureCollection;
  metricDataByCountry: CountryData;
  countryIdAccessor: (feature: Feature) => string;
  pathGenerator: d3.GeoPath;
  colorScale: d3.ScaleLinear<string, string>;
  showTooltip: (feature: Feature) => void;
  hideTooltip: () => void;
}) {
  return (
    <>
      {countryShapes.features.map((feature, idx) => {
        const metricValue = metricDataByCountry[countryIdAccessor(feature)];

        return (
          <path
            key={idx}
            className={styles.country}
            d={pathGenerator(feature) ?? ""}
            fill={metricValue ? colorScale(metricValue) : "#e2e6e9"}
            onMouseEnter={() => showTooltip(feature)}
            onMouseLeave={() => hideTooltip()}
          />
        );
      })}
    </>
  );
}

const MemoizedMapPath = React.memo(MapPath, (prevProps, nextProps) => {
  //? re-render ONLY IF we receive a different dataset
  if (prevProps.countryShapes !== nextProps.countryShapes) {
    return false;
  }
  if (prevProps.metricDataByCountry !== nextProps.metricDataByCountry) {
    return false;
  }

  return true;
});

MemoizedMapPath.displayName = "MemoizedMapPath";

function MapPage() {
  const { countryShapes, metricDataByCountry, status, error } = useWorldData();

  if (status === "idle") {
    return <span>Waiting for data...</span>;
  }

  if (status === "pending") {
    return <div>Loading data...</div>;
  }

  if (status === "rejected") {
    throw error;
  }

  if (countryShapes && metricDataByCountry) {
    return (
      <div className={styles.container}>
        <Map
          countryShapes={countryShapes}
          metricDataByCountry={metricDataByCountry}
        />
      </div>
    );
  }

  throw new Error("invalid case!");
}

export default MapPage;
