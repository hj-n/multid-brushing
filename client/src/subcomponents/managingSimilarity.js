export function getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum) {
  const mouseoverPointsSet = new Set(mouseoverPoints);
  const prevSelectedPointsSet = currSelections.reduce((acc, d, idx) => {
    if (d === currSelectionNum) acc.add(idx);
    return acc;
  }, new Set())
  console.log(prevSelectedPointsSet, mouseoverPointsSet);
}