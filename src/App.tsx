import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainPage from "./pages/MainPage";
import LineChart from "./pages/LineChart";
import ScatterPlot from "./pages/ScatterPlot";
import HistogramPage from "./pages/HistogramPage";
import AnimatedHistogram from "./pages/AnimatedHistogram";
import AnimatedLineChart from "./pages/AnimatedLineChart";

import WeatherDataProvider from "./components/WeatherDataProvider";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/">
            <Route index element={<MainPage />} />
            <Route path="chapters">
              <Route
                path="making-your-first-chart"
                element={<WeatherDataProvider Consumer={LineChart} />}
              />
              <Route
                path="making-a-scatterplot"
                element={<WeatherDataProvider Consumer={ScatterPlot} />}
              />
              <Route
                path="making-a-bar-chart"
                element={<WeatherDataProvider Consumer={HistogramPage} />}
              />
              <Route path="animations-and-transitions">
                <Route
                  path="histogram"
                  element={<WeatherDataProvider Consumer={AnimatedHistogram} />}
                />
                <Route
                  path="line"
                  element={<WeatherDataProvider Consumer={AnimatedLineChart} />}
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
