import * as React from "react";
import { Link } from "react-router-dom";

import ReactLogo from "../logo-react.svg";
import D3Logo from "../logo-d3.svg";
import styles from "../App.module.css";

function MainPage() {
  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <div className={styles.logoRow}>
          <img src={ReactLogo} className={styles.reactLogo} alt="logo" />
          <span className={styles.plusSign}>+</span>
          <img src={D3Logo} className={styles.d3Logo} alt="logo" />
        </div>
        <p>Hello Vite + React + D3!</p>

        <h2>Table Of Contents</h2>

        <ol className={styles.contents}>
          <li>
            <Link
              className={styles.appLink}
              to="chapters/making-your-first-chart"
            >
              Making Your First Chart
            </Link>
          </li>
          <li>
            <Link className={styles.appLink} to="chapters/making-a-scatterplot">
              Making a Scatterplot
            </Link>
          </li>
          <li>
            <Link className={styles.appLink} to="chapters/making-a-bar-chart">
              Making a Bar Chart
            </Link>
          </li>
          <li>
            Animations and Transitions
            <ul>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/animations-and-transitions/histogram"
                >
                  Using React Spring to smoothly change between histogram
                  metrics
                </Link>
              </li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/animations-and-transitions/line"
                >
                  Animating a line chart when it gets new data
                </Link>
              </li>
            </ul>
          </li>
          <li>
            Interactions
            <ul>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/interactions/histogram"
                >
                  Adding interactions to our histogram
                </Link>
              </li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/interactions/scatterplot"
                >
                  Adding interactions to our scatter plot
                </Link>
              </li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/interactions/line"
                >
                  Adding interactions to our line chart
                </Link>
              </li>
            </ul>
          </li>
          <li>Making a Map (COMING SOON!)</li>
          <li>
            <Link className={styles.appLink} to="chapters/data-visualization">
              Data Visualization Basics
            </Link>
          </li>
          <li>
            Common Charts
            <ul>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/common-charts/timeline"
                >
                  Timeline
                </Link>
              </li>
              <li>Heatmap (COMING SOON!)</li>
              <li>Radar Chart (COMING SOON!)</li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/common-charts/scatterplot"
                >
                  Scatter Plot
                </Link>
              </li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/common-charts/pie"
                >
                  Pie Charts &amp; Donut Charts
                </Link>
              </li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/common-charts/histogram"
                >
                  Histogram
                </Link>
              </li>
              <li>
                <Link
                  className={styles.appLink}
                  to="chapters/common-charts/box-plot"
                >
                  Box Plot
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link className={styles.appLink} to="chapters/dashboard-design">
              Dashboard Design
            </Link>
          </li>
          <li>
            <Link className={styles.appLink} to="chapters/marginal-histogram">
              Marginal Histogram
            </Link>
          </li>
          <li>
            <Link className={styles.appLink} to="chapters/radar-weather-chart">
              Radar Weather Chart
            </Link>
          </li>
          <li>Animated Sankey Diagram (COMING SOON!)</li>
        </ol>
      </header>
    </div>
  );
}

export default MainPage;
