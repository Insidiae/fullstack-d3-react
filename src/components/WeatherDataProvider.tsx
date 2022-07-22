import * as React from "react";

import { useWeatherData } from "../hooks/useWeatherData";

import type { WeatherData } from "../hooks/useWeatherData";

function WeatherDataProvider({
  Consumer,
}: {
  Consumer: React.FC<{ dataset: WeatherData[] }>;
}) {
  //* Step 1a. Fetch Data
  const { dataset, status, error } = useWeatherData();

  switch (status) {
    case "idle":
      return <span>Waiting for data...</span>;
    case "pending":
      return <div>Loading data...</div>;
    case "rejected":
      throw error;
    case "resolved":
      return <Consumer dataset={dataset as WeatherData[]} />;
  }
}

export default WeatherDataProvider;
