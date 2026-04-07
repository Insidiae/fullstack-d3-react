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

interface VisiblePerson extends Person {
  x: number;
  y: number;
  opacity: number;
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

//* Precomputed symbol paths
const circleSymbolPath = d3.symbol().type(d3.symbolCircle)() ?? "";
const triangleSymbolPath = d3.symbol().type(d3.symbolTriangle)() ?? "";

//* Utility functions
const getRandomNumberInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const getRandomValue = (arr: number[]) =>
  arr[Math.floor(getRandomNumberInRange(0, arr.length))];
const sentenceCase = (str: string) =>
  [str.slice(0, 1).toUpperCase(), str.slice(1)].join("");

function AnimatedSankey() {
  const dataset = useLoaderData<typeof educationDataLoader>();

  const [visiblePeople, setVisiblePeople] = React.useState<VisiblePerson[]>([]);
  const [endingPercentages, setEndingPercentages] = React.useState<EndingData[]>([]);

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
    const maximumPeople = 10000;
    const people: Person[] = [];
    let currentPersonId = 0;
    let animStartTime: number | null = null;
    let animFrameId: number;

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

    function tick(timestamp: number) {
      if (animStartTime === null) animStartTime = timestamp;
      const elapsed = timestamp - animStartTime;

      const xProgressAccessor = (d: Person) => (elapsed - d.startTime) / 5000;

      if (people.length < maximumPeople) {
        people.push(...d3.range(2).map(() => generatePerson(elapsed)));
      }

      const visible: VisiblePerson[] = people
        .filter((d) => xProgressAccessor(d) < 1)
        .map((d) => {
          const xProgress = xProgressAccessor(d);
          const x = xScale(xProgress);
          const yStart = startYScale(sesAccessor(d));
          const yEnd = endYScale(educationAccessor(d));
          const yChange = yEnd - yStart;
          const yProgress = yTransitionProgressScale(xProgress);
          const y = yStart + d.yJitter + yChange * yProgress;
          return { ...d, x, y, opacity: x < 10 ? 0 : 1 };
        });

      const endingGroups = educationIds.map((endId) =>
        people.filter(
          (d) => xProgressAccessor(d) >= 1 && educationAccessor(d) === endId
        )
      );

      const newEndingPercentages: EndingData[] = d3.merge(
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

      setVisiblePeople(visible);
      setEndingPercentages(newEndingPercentages);

      animFrameId = requestAnimationFrame(tick);
    }

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
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

        {/* Ending labels and dynamic value counts */}
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
                d={triangleSymbolPath}
                transform={`translate(5, ${endYScale(id) + 20})`}
              />
              <path
                className={styles.endingMarker}
                d={circleSymbolPath}
                transform={`translate(5, ${endYScale(id) + 5})`}
              />
            </React.Fragment>
          ))}
          {endingPercentages.map((d) => (
            <text
              key={`${d.endingId}-${d.sexId}-${d.sesId}`}
              className={styles.endingValue}
              x={d.sesId * 33 + 47}
              y={
                endYScale(d.endingId) -
                dimensions.pathHeight / 2 +
                14 * d.sexId +
                35
              }
              fill={d.countInBar ? colorScale(d.sesId) : "#dadadd"}
            >
              {d.count}
            </text>
          ))}
        </g>

        {/* Legend */}
        <g className={styles.legend} transform={`translate(${dimensions.boundedWidth}, 5)`}>
          <g transform={`translate(${-dimensions.endsBarWidth / 2 - 4}, 0)`}>
            <path
              d={circleSymbolPath}
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
              d={triangleSymbolPath}
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

        {/* Animated markers */}
        <g>
          {visiblePeople.map((person) => (
            <path
              key={person.id}
              className={styles.marker}
              d={sexAccessor(person) === 0 ? circleSymbolPath : triangleSymbolPath}
              style={{
                transform: `translate(${person.x}px, ${person.y}px)`,
                opacity: person.opacity,
              }}
              fill={colorScale(sesAccessor(person))}
            />
          ))}
        </g>

        {/* Ending bars */}
        <g transform={`translate(${dimensions.boundedWidth}, 0)`}>
          {endingPercentages.map((d) => (
            <rect
              key={`${d.endingId}-${d.sexId}-${d.sesId}`}
              className={styles.endingBar}
              x={
                -dimensions.endsBarWidth * (d.sexId + 1) -
                d.sexId * dimensions.endingBarPadding
              }
              width={dimensions.endsBarWidth}
              y={
                endYScale(d.endingId) -
                dimensions.pathHeight / 2 +
                dimensions.pathHeight * d.percentAbove
              }
              height={
                d.countInBar
                  ? dimensions.pathHeight * d.percent
                  : dimensions.pathHeight
              }
              fill={d.countInBar ? colorScale(d.sesId) : "#dadadd"}
            />
          ))}
        </g>
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
