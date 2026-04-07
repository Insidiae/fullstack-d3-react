import * as React from "react";
import { useLoaderData } from "react-router";
import * as d3 from "d3";

import Chart from "../components/Chart";

import type { educationDataLoader, EducationData } from "../loaders";
import type { BoundedDimensions } from "../utils/types";

import styles from "./styles/AnimatedSankey.module.css";

interface Person {
  id: number;
  sex: number;
  ses: number;
  education: number;
  startTime: number;
  yJitter: number;
}

interface EndingData {
  endingId: number;
  sesId: number;
  sexId: number;
  count: number;
  countInBar: number;
  percentAbove: number;
  percent: number;
}

//* Step 1. Access data - accessors and constants
const sexAccessor = (d: Person) => d.sex;
const sexes = ["female", "male"];
const sexIds = d3.range(2);

const educationAccessor = (d: Person) => d.education;
const educationNames = [
  "<High School",
  "High School",
  "Some Post-secondary",
  "Post-secondary",
  "Associate's",
  "Bachelor's and up",
];
const educationIds = d3.range(educationNames.length);

const sesAccessor = (d: Person) => d.ses;
const sesNames = ["low", "middle", "high"];
const sesIds = d3.range(sesNames.length);

const getStatusKey = ({ sex, ses }: { sex: string; ses: string }) =>
  [sex, ses].join("--");

//* Step 2. Create chart dimensions
interface SankeyDimensions extends BoundedDimensions {
  pathHeight: number;
  endsBarWidth: number;
  endingBarPadding: number;
}

const width = Math.min(window.innerWidth * 0.9, 1200);
const dimensions: SankeyDimensions = {
  width,
  height: 500,
  margin: { top: 10, right: 200, bottom: 10, left: 120 },
  pathHeight: 50,
  endsBarWidth: 15,
  endingBarPadding: 3,
  boundedWidth: 0,
  boundedHeight: 0,
};
dimensions.boundedWidth =
  dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
  dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

//* Step 4. Create scales
const xScale = d3
  .scaleLinear()
  .domain([0, 1])
  .range([0, dimensions.boundedWidth])
  .clamp(true);

const startYScale = d3
  .scaleLinear()
  .domain([sesIds.length, -1])
  .range([0, dimensions.boundedHeight]);

const endYScale = d3
  .scaleLinear()
  .domain([educationIds.length, -1])
  .range([0, dimensions.boundedHeight]);

const yTransitionProgressScale = d3
  .scaleLinear()
  .domain([0.45, 0.55])
  .range([0, 1])
  .clamp(true);

const colorScale = d3
  .scaleLinear<string>()
  .domain(d3.extent(sesIds) as [number, number])
  .range(["#12CBC4", "#B53471"])
  .interpolate(d3.interpolateHcl);

//* Step 5. Draw data - link path generator
const linkLineGenerator = d3
  .line<[number, number]>()
  .x((_, i) => i * (dimensions.boundedWidth / 5))
  .y((d, i) => (i <= 2 ? startYScale(d[0]) : endYScale(d[1])))
  .curve(d3.curveMonotoneX);

const linkOptions: [number, number][][] = d3.merge(
  sesIds.map((startId) =>
    educationIds.map(
      (endId) => new Array(6).fill([startId, endId]) as [number, number][]
    )
  )
);

//* Utility functions
const getRandomNumberInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const getRandomValue = (arr: number[]) =>
  arr[Math.floor(getRandomNumberInRange(0, arr.length))];
const sentenceCase = (str: string) =>
  [str.slice(0, 1).toUpperCase(), str.slice(1)].join("");

function AnimatedSankey() {
  const dataset = useLoaderData<typeof educationDataLoader>();

  const markersGroupRef = React.useRef<SVGGElement>(null);
  const endingBarGroupRef = React.useRef<SVGGElement>(null);
  const endingValuesGroupRef = React.useRef<SVGGElement>(null);

  const stackedProbabilities = React.useMemo(() => {
    const result: Record<string, number[]> = {};
    dataset.forEach((startingPoint: EducationData) => {
      const key = getStatusKey(startingPoint as { sex: string; ses: string });
      let stackedProbability = 0;
      result[key] = educationNames.map((education, i) => {
        stackedProbability += (startingPoint[education] as number) / 100;
        return i < educationNames.length - 1 ? stackedProbability : 1;
      });
    });
    return result;
  }, [dataset]);

  //* Step 7. Set up interactions - animation loop
  React.useEffect(() => {
    let currentPersonId = 0;
    const maximumPeople = 10000;
    const people: Person[] = [];

    function generatePerson(elapsed: number): Person {
      currentPersonId++;
      const sex = getRandomValue(sexIds);
      const ses = getRandomValue(sesIds);
      const statusKey = getStatusKey({
        sex: sexes[sex],
        ses: sesNames[ses],
      });
      const probabilities = stackedProbabilities[statusKey];
      const education = d3.bisect(probabilities, Math.random());
      return {
        id: currentPersonId,
        sex,
        ses,
        education,
        startTime: elapsed + getRandomNumberInRange(-0.1, 0.1),
        yJitter: getRandomNumberInRange(-15, 15),
      };
    }

    const timer = d3.timer((elapsed) => {
      const xProgressAccessor = (d: Person) => (elapsed - d.startTime) / 5000;

      if (people.length < maximumPeople) {
        people.push(...d3.range(2).map(() => generatePerson(elapsed)));
      }

      const markersGroup = d3.select(markersGroupRef.current);

      const females = markersGroup
        .selectAll<SVGPathElement, Person>(".marker-circle")
        .data(
          people.filter((d) => xProgressAccessor(d) < 1 && sexAccessor(d) === 0),
          (d) => d.id
        );
      females
        .enter()
        .append("path")
        .attr("class", "marker marker-circle")
        .attr("d", d3.symbol().type(d3.symbolCircle))
        .style("opacity", 0);
      females.exit().remove();

      const males = markersGroup
        .selectAll<SVGPathElement, Person>(".marker-triangle")
        .data(
          people.filter((d) => xProgressAccessor(d) < 1 && sexAccessor(d) === 1),
          (d) => d.id
        );
      males
        .enter()
        .append("path")
        .attr("class", "marker marker-triangle")
        .attr("d", d3.symbol().type(d3.symbolTriangle))
        .style("opacity", 0);
      males.exit().remove();

      markersGroup
        .selectAll<SVGPathElement, Person>(".marker")
        .style("transform", (d) => {
          const x = xScale(xProgressAccessor(d));
          const yStart = startYScale(sesAccessor(d));
          const yEnd = endYScale(educationAccessor(d));
          const yChange = yEnd - yStart;
          const yProgress = yTransitionProgressScale(xProgressAccessor(d));
          const y = yStart + d.yJitter + yChange * yProgress;
          return `translate(${x}px, ${y}px)`;
        })
        .attr("fill", (d) => colorScale(sesAccessor(d)))
        .transition()
        .duration(100)
        .style("opacity", (d) => (xScale(xProgressAccessor(d)) < 10 ? 0 : 1));

      const endingGroups = educationIds.map((endId) =>
        people.filter(
          (d) => xProgressAccessor(d) >= 1 && educationAccessor(d) === endId
        )
      );

      const endingPercentages: EndingData[] = d3.merge(
        endingGroups.map((peopleWithSameEnding, endingId) =>
          d3.merge(
            sexIds.map((sexId) =>
              sesIds.map((sesId) => {
                const peopleInBar = peopleWithSameEnding.filter(
                  (d) => sexAccessor(d) === sexId
                );
                const countInBar = peopleInBar.length;
                const peopleInBarWithSameStart = peopleInBar.filter(
                  (d) => sesAccessor(d) === sesId
                );
                const count = peopleInBarWithSameStart.length;
                const numberOfPeopleAbove = peopleInBar.filter(
                  (d) => sesAccessor(d) > sesId
                ).length;
                return {
                  endingId,
                  sesId,
                  sexId,
                  count,
                  countInBar,
                  percentAbove: numberOfPeopleAbove / (peopleInBar.length || 1),
                  percent: count / (countInBar || 1),
                };
              })
            )
          )
        )
      );

      d3.select(endingBarGroupRef.current)
        .selectAll<SVGRectElement, EndingData>(".ending-bar")
        .data(endingPercentages)
        .join("rect")
        .attr("class", "ending-bar")
        .attr(
          "x",
          (d) =>
            -dimensions.endsBarWidth * (d.sexId + 1) -
            d.sexId * dimensions.endingBarPadding
        )
        .attr("width", dimensions.endsBarWidth)
        .attr(
          "y",
          (d) =>
            endYScale(d.endingId) -
            dimensions.pathHeight / 2 +
            dimensions.pathHeight * d.percentAbove
        )
        .attr("height", (d) =>
          d.countInBar ? dimensions.pathHeight * d.percent : dimensions.pathHeight
        )
        .attr("fill", (d) => (d.countInBar ? colorScale(d.sesId) : "#dadadd"));

      d3.select(endingValuesGroupRef.current)
        .selectAll<SVGTextElement, EndingData>(".ending-value")
        .data(endingPercentages)
        .join("text")
        .attr("class", "ending-value")
        .attr("x", (d) => d.sesId * 33 + 47)
        .attr(
          "y",
          (d) =>
            endYScale(d.endingId) -
            dimensions.pathHeight / 2 +
            14 * d.sexId +
            35
        )
        .attr("fill", (d) => (d.countInBar ? colorScale(d.sesId) : "#dadadd"))
        .text((d) => d.count);
    });

    return () => timer.stop();
  }, [stackedProbabilities]);

  //* Step 3. Draw canvas (via Chart component)
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>
        What do people achieve within 12 years of starting high school?
      </h2>
      <p className={styles.description}>
        Simulated data based on a National Center for Education Statistics study
        of where high school sophomores are ten years later
      </p>
      <Chart dimensions={dimensions}>
      {/* Step 5. Draw data - links */}
      <g>
        {linkOptions.map((d, i) => (
          <path
            key={i}
            className={styles.categoryPath}
            d={linkLineGenerator(d) ?? undefined}
            strokeWidth={dimensions.pathHeight}
          />
        ))}
      </g>

      {/* Step 6. Draw peripherals - starting labels */}
      <g style={{ transform: "translateX(-20px)" }}>
        {sesIds.map((sesId) => (
          <React.Fragment key={sesId}>
            <text
              className={`${styles.label} ${styles.startLabel}`}
              y={startYScale(sesId)}
            >
              {sentenceCase(sesNames[sesId])}
            </text>
            <rect
              x={20}
              y={startYScale(sesId) - dimensions.pathHeight / 2}
              width={dimensions.endsBarWidth}
              height={dimensions.pathHeight}
              fill={colorScale(sesId)}
            />
          </React.Fragment>
        ))}
        <text
          className={styles.startTitle}
          y={startYScale(sesIds[sesIds.length - 1]) - 65}
        >
          Socioeconomic
        </text>
        <text
          className={styles.startTitle}
          y={startYScale(sesIds[sesIds.length - 1]) - 50}
        >
          Status
        </text>
      </g>

      {/* Ending labels (static React-rendered, dynamic values D3-managed) */}
      <g style={{ transform: `translateX(${dimensions.boundedWidth + 20}px)` }}>
        {educationNames.map((name, i) => (
          <text
            key={name}
            className={`${styles.label}`}
            y={endYScale(i) - 15}
          >
            {name}
          </text>
        ))}
        {educationIds.map((id) => (
          <React.Fragment key={id}>
            <path
              className={styles.endingMarker}
              d={d3.symbol().type(d3.symbolTriangle)() ?? undefined}
              transform={`translate(5, ${endYScale(id) + 20})`}
            />
            <path
              className={styles.endingMarker}
              d={d3.symbol().type(d3.symbolCircle)() ?? undefined}
              transform={`translate(5, ${endYScale(id) + 5})`}
            />
          </React.Fragment>
        ))}
        {/* D3-managed ending value counts */}
        <g ref={endingValuesGroupRef} />
      </g>

      {/* Legend */}
      <g className={styles.legend} transform={`translate(${dimensions.boundedWidth}, 5)`}>
        <g transform={`translate(${-dimensions.endsBarWidth / 2 - 4}, 0)`}>
          <path
            d={d3.symbol().type(d3.symbolCircle)() ?? undefined}
            transform="translate(5, 0)"
          />
          <text x={15}>Female</text>
          <line
            className={styles.legendLine}
            x1={dimensions.endsBarWidth / 2 - 3}
            x2={dimensions.endsBarWidth / 2 - 3}
            y1={12}
            y2={37}
          />
        </g>
        <g
          transform={`translate(${
            -dimensions.endsBarWidth * 1.5 + dimensions.endingBarPadding + 1
          }, 0)`}
        >
          <path
            d={d3.symbol().type(d3.symbolTriangle)() ?? undefined}
            transform="translate(-7, 0)"
          />
          <text className={styles.legendTextLeft} x={-20}>
            Male
          </text>
          <line
            className={styles.legendLine}
            x1={-dimensions.endsBarWidth / 2 + 1}
            x2={-dimensions.endsBarWidth / 2 + 1}
            y1={12}
            y2={37}
          />
        </g>
      </g>

      {/* D3-managed animated markers */}
      <g ref={markersGroupRef} />

      {/* D3-managed ending bars */}
      <g
        ref={endingBarGroupRef}
        transform={`translate(${dimensions.boundedWidth}, 0)`}
      />
    </Chart>
      <p className={styles.source}>
        Data from{" "}
        <a href="https://nces.ed.gov/programs/digest/d14/tables/dt14_104.91.asp">
          the U.S. Department of Education, National Center for Education
          Statistics, Education Longitudinal Study of 2002
        </a>
      </p>
    </div>
  );
}

export default AnimatedSankey;
