import axios from 'axios';
import { similarityParam, positionUpdateParam, idxParam, embDiffParam, calculateMetricParam } from "../../helpers/axiosHandler";

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
  const pointSetIntersection = intersection(mouseoverPointsSet, prevSelectedPointsSet);

  return [
    Array.from(consideringPoints), 
    Array.from(prevSelectedPointsSet),
    Array.from(pointSetIntersection)
  ];
}

export function restoreOrigin(url, flag) {
  flag.posUpdating = true;
  axios.get(url + "restoreorigin").then((response) => { 
    if (response.data === "success")
      flag.posUpdating = false;
    else
      throw "Somethings wrong in server!!";
  })
}

export function updateOrigin(url) {
  axios.get(url + "updateorigin").then((response) => { 
    if (!response.data === "success")
      throw "Somethings wrong in server!!";
  })
}

export function restoreIdx(url, flag, idx) {
  axios.get(url + "restoreidx", idxParam(idx)).then((response) => {
    if (!response.data === "success")
      throw "Somethings wrong in sever!!"
  })
}

export function updateEmbDiff(url, idx, xDiff, yDiff) {
  axios.get(url + "updateembdiff", embDiffParam(idx, xDiff, yDiff)).then(response => {
    if (!response.data === "success")
      throw "Somethings wrong in sever!!"
  })
}

export async function getSimilarity(url, consideringPoints) {
  let sim;
  if (consideringPoints.length === 0) return null; 
  await axios.get(url + "similarity", similarityParam(consideringPoints)).then(response => {
    sim = response.data; 
  });
  return sim;
}

export async function getUpdatedPosition(
  url, 
  emb,
  consideringPoints, 
  prevSelectedPoints, 
  resolution,
  scale4offset,
  offset,   // ratio compared to resolution
  kdeThreshold, 
  simThreshold
) {
  const newEmb = []
  let contour, offsettedContour, pointsFromOutside;
  emb.forEach((d, i) => { newEmb.push([d[0], d[1]]); });
  await axios.get(
    url + "positionupdate", 
    positionUpdateParam(
      consideringPoints, prevSelectedPoints, resolution,
      scale4offset, offset, kdeThreshold, simThreshold
    )
  ).then(response => {
    const newPositions = response.data.new_positions;
    newPositions.forEach(d => {
      newEmb[d[0]][0] = d[1];
      newEmb[d[0]][1] = d[2];
    });
    contour = response.data.contour;
    offsettedContour = response.data.contour_offsetted;
    pointsFromOutside = response.data.points_from_outside;
  })
  return [newEmb, contour, offsettedContour, pointsFromOutside];
  
}

export function calculateMetric(url, currSelections, currSelectionNum, dataset, method, sample_rate) {
  axios.get(url + "calculatemetric", calculateMetricParam(currSelections, currSelectionNum, dataset, method, sample_rate)).then((response) => { 
    if (!response.data === "success")
      throw "Somethings wrong in server!!";
  })
}