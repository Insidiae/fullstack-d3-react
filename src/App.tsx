import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { weatherDataLoader, worldDataLoader, educationDataLoader } from "./loaders";

import MainPage from "./pages/MainPage";

import LineChart from "./pages/LineChart";
import ScatterPlot from "./pages/ScatterPlot";
import HistogramPage from "./pages/HistogramPage";

import AnimatedHistogram from "./pages/AnimatedHistogram";
import AnimatedLineChart from "./pages/AnimatedLineChart";

import HistogramInteractions from "./pages/HistogramInteractions";
import ScatterPlotInteractions from "./pages/ScatterPlotInteractions";
import LineChartInteractions from "./pages/LineChartInteractions";

import MapPage from "./pages/MapPage";

import DatavizBasics from "./pages/DatavizBasics";

import CommonTimeline from "./pages/common-charts/CommonTimeline";
import CommonHeatmap from "./pages/common-charts/CommonHeatmap";
import CommonRadarChart from "./pages/common-charts/CommonRadarChart";
import CommonScatterplot from "./pages/common-charts/CommonScatterplot";
import CommonPieChart from "./pages/common-charts/CommonPieChart";
import CommonHistogram from "./pages/common-charts/CommonHistogram";
import CommonBoxPlot from "./pages/common-charts/CommonBoxPlot";

import DashboardDesign from "./pages/DashboardDesign";

import MarginalHistogram from "./pages/MarginalHistogram";
import RadarWeatherChart from "./pages/RadarWeatherChart";
import AnimatedSankey from "./pages/AnimatedSankey";

const router = createBrowserRouter([
  {
    path: "/",
    index: true,
    element: <MainPage />,
  },
  {
    path: "/chapters",
    children: [
      {
        path: "making-your-first-chart",
        loader: weatherDataLoader,
        element: <LineChart />,
      },
      {
        path: "making-a-scatterplot",
        loader: weatherDataLoader,
        element: <ScatterPlot />,
      },
      {
        path: "making-a-bar-chart",
        loader: weatherDataLoader,
        element: <HistogramPage />,
      },
      {
        path: "animations-and-transitions",
        children: [
          {
            path: "histogram",
            loader: weatherDataLoader,
            element: <AnimatedHistogram />,
          },
          {
            path: "line",
            loader: weatherDataLoader,
            element: <AnimatedLineChart />,
          },
        ],
      },
      {
        path: "interactions",
        children: [
          {
            path: "histogram",
            loader: weatherDataLoader,
            element: <HistogramInteractions />,
          },
          {
            path: "scatterplot",
            loader: weatherDataLoader,
            element: <ScatterPlotInteractions />,
          },
          {
            path: "line",
            loader: weatherDataLoader,
            element: <LineChartInteractions />,
          },
        ],
      },
      {
        path: "making-a-map",
        loader: worldDataLoader,
        element: <MapPage />,
      },
      {
        path: "data-visualization",
        loader: weatherDataLoader,
        element: <DatavizBasics />,
      },
      {
        path: "common-charts",
        children: [
          {
            path: "timeline",
            loader: weatherDataLoader,
            element: <CommonTimeline />,
          },
          {
            path: "heatmap",
            loader: weatherDataLoader,
            element: <CommonHeatmap />,
          },
          {
            path: "radar",
            loader: weatherDataLoader,
            element: <CommonRadarChart />,
          },
          {
            path: "scatterplot",
            loader: weatherDataLoader,
            element: <CommonScatterplot />,
          },
          {
            path: "pie",
            loader: weatherDataLoader,
            element: <CommonPieChart />,
          },
          {
            path: "histogram",
            loader: weatherDataLoader,
            element: <CommonHistogram />,
          },
          {
            path: "box-plot",
            loader: weatherDataLoader,
            element: <CommonBoxPlot />,
          },
        ],
      },
      {
        path: "dashboard-design",
        loader: weatherDataLoader,
        element: <DashboardDesign />,
      },
      {
        path: "marginal-histogram",
        loader: weatherDataLoader,
        element: <MarginalHistogram />,
      },
      {
        path: "radar-weather-chart",
        loader: weatherDataLoader,
        element: <RadarWeatherChart />,
      },
      {
        path: "animated-sankey",
        loader: educationDataLoader,
        element: <AnimatedSankey />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
