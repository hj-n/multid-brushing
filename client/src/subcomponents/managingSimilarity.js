import axios from 'axios';
import { similarityParam } from "../helpers/axiosHandler";

function union(a, b) {
  return new Set([...a, ...b]);
}

function intersection(a, b) {
  return new Set([...a].filter(x => b.has(x)));
}

export function getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum) {
  const mouseoverPointsSet = new Set(mouseoverPoints);
  const prevSelectedPointsSet = currSelections.reduce((acc, d, idx) => {
    if (d === currSelectionNum) acc.add(idx);
    return acc;
  }, new Set())
  const consideringPoints = union(mouseoverPointsSet, prevSelectedPointsSet);
  return Array.from(consideringPoints);
}

export async function getSimilarity(url, consideringPoints) {
  let sim;
  if (consideringPoints.length === 0) return null; 
  await axios.get(url + "similarity", similarityParam(consideringPoints)).then(response => {
    sim = response.data; 
  });
  if (consideringPoints.length === 1) sim[consideringPoints[0]] = 1;
  return sim;
}