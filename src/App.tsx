import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainPage from "./pages/MainPage";
import LineChart from "./pages/LineChart";
import ScatterPlot from "./pages/ScatterPlot";

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
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
