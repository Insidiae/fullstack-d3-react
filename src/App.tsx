import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainPage from "./pages/MainPage";
import LineChart from "./pages/LineChart";
import ScatterPlot from "./pages/ScatterPlot";
import HistogramPage from "./pages/HistogramPage";
import AnimatedHistogram from "./pages/AnimatedHistogram";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/">
            <Route index element={<MainPage />} />
            <Route path="chapters">
              <Route path="making-your-first-chart" element={<LineChart />} />
              <Route path="making-a-scatterplot" element={<ScatterPlot />} />
              <Route path="making-a-bar-chart" element={<HistogramPage />} />
              <Route path="animations-and-transitions">
                <Route path="histogram" element={<AnimatedHistogram />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
