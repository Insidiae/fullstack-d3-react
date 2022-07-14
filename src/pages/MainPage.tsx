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
                  Smoothly changing between histogram metrics
                </Link>
              </li>
            </ul>
          </li>
        </ol>
      </header>
    </div>
  );
}

export default MainPage;
