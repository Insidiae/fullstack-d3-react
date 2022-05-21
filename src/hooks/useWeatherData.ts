import * as React from "react";
import * as d3 from "d3";

import { useAsync } from "./useAsync";

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

export type ScaledWeatherAccessorFunction = (d: WeatherData) => number;

export function useWeatherData() {
  //* Step 1a. Fetch Data
  const { data: dataset, status, error, run } = useAsync<Array<WeatherData>>();

  React.useEffect(() => {
    const datasetPromise = d3.json("/data/my_weather_data.json") as Promise<
      Array<WeatherData>
    >;

    run(datasetPromise);
  }, []);

  return { dataset, status, error, run };
}

// const sampleData: WeatherData = {
//   time: 1514782800,
//   summary: "Clear throughout the day.",
//   icon: "clear-day",
//   sunriseTime: 1514809280,
//   sunsetTime: 1514842810,
//   moonPhase: 0.48,
//   precipIntensity: 0,
//   precipIntensityMax: 0,
//   precipProbability: 0,
//   temperatureHigh: 18.39,
//   temperatureHighTime: 1514836800,
//   temperatureLow: 12.23,
//   temperatureLowTime: 1514894400,
//   apparentTemperatureHigh: 17.29,
//   apparentTemperatureHighTime: 1514844000,
//   apparentTemperatureLow: 4.51,
//   apparentTemperatureLowTime: 1514887200,
//   dewPoint: -1.67,
//   humidity: 0.54,
//   pressure: 1028.26,
//   windSpeed: 4.16,
//   windGust: 13.98,
//   windGustTime: 1514829600,
//   windBearing: 309,
//   cloudCover: 0.02,
//   uvIndex: 2,
//   uvIndexTime: 1514822400,
//   visibility: 10,
//   temperatureMin: 6.17,
//   temperatureMinTime: 1514808000,
//   temperatureMax: 18.39,
//   temperatureMaxTime: 1514836800,
//   apparentTemperatureMin: -2.19,
//   apparentTemperatureMinTime: 1514808000,
//   apparentTemperatureMax: 17.29,
//   apparentTemperatureMaxTime: 1514844000,
//   date: "2018-01-01",
// };
