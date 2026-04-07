import * as d3 from "d3";

import type { FeatureCollection } from "geojson";

export type precipTypeOption = "rain" | "sleet" | "snow";

//? Get the metrics from WeatherData which return a number
//? https://stackoverflow.com/questions/56863875/typescript-how-do-you-filter-a-types-properties-to-those-of-a-certain-type
export type NumericWeatherDataMetric = {
  [K in keyof WeatherData]-?: WeatherData[K] extends d3.Numeric ? K : never;
}[keyof WeatherData];

export interface WeatherData {
  time: number;
  summary: string;
  icon: string;
  sunriseTime: number;
  sunsetTime: number;
  moonPhase: number;
  precipIntensity: number;
  precipIntensityMax: number;
  precipProbability: number;
  //? precipType only exists if precipProbability is higher than 0
  precipType?: precipTypeOption;
  temperatureHigh: number;
  temperatureHighTime: number;
  temperatureLow: number;
  temperatureLowTime: number;
  apparentTemperatureHigh: number;
  apparentTemperatureHighTime: number;
  apparentTemperatureLow: number;
  apparentTemperatureLowTime: number;
  dewPoint: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windGust: number;
  windGustTime: number;
  windBearing: number;
  cloudCover: number;
  uvIndex: number;
  uvIndexTime: number;
  visibility: number;
  temperatureMin: number;
  temperatureMinTime: number;
  temperatureMax: number;
  temperatureMaxTime: number;
  apparentTemperatureMin: number;
  apparentTemperatureMinTime: number;
  apparentTemperatureMax: number;
  apparentTemperatureMaxTime: number;
  date: string;
}

export const weatherDataLoader = async () => {
  return d3.json("/data/my_weather_data.json") as Promise<Array<WeatherData>>;
};

type CSVColumns =
  | "Country Name"
  | "Country Code"
  | "Series Name"
  | "Series Code"
  | "2017 [YR2017]";

export type CountryData = {
  [key: string]: number;
};

export const worldDataLoader = async () => {
  const countryShapesRequest = d3.json(
    "/data/world-geojson.json"
  ) as Promise<FeatureCollection>;
  const datasetPromise = d3.csv("/data/data_bank_data.csv") as Promise<
    d3.DSVRowArray<CSVColumns>
  >;

  const [countryShapes, dataset] = await Promise.all([
    countryShapesRequest,
    datasetPromise,
  ]);

  const metric = "Population growth (annual %)";
  const metricDataByCountry: CountryData = {};

  dataset.forEach((d) => {
    if (d["Series Name"] === metric) {
      metricDataByCountry[d["Country Code"] as string] =
        +(d["2017 [YR2017]"] as string) || 0;
    }
  });

  return { countryShapes, metricDataByCountry };
};
