import { Scatterplot } from "./scatterplot";

import { colorDarker } from "../../helpers/utils";
import { Mode } from "../../helpers/status";

let scatterplot;




function initialSplotRenderingData(emb, density, pointLen, radius, border) {
  return {
    position: emb,
    opacity: density,
    color : new Array(pointLen).fill([0, 0, 0]),
    radius : new Array(pointLen).fill(radius),
    border : new Array(pointLen).fill(border),
    borderColor : new Array(pointLen).fill([0, 0, 0])
  }
}

function skimmingBrushingNonPositionData(
  status, density, pointLen, colors, radius, border,
  currSelections, mouseoverPoints, currSelectionNum, sim
) {
  const colorList = currSelections.map((selectionNum, idx) => {
    return selectionNum !== 0 ? colors[selectionNum] : (
      sim[idx] > 0 ? colors[currSelectionNum] : [0, 0, 0]
    );
  });
  const opacityList = currSelections.map((selectionNum, idx) => {
    return selectionNum === currSelectionNum ? 1 : (   
      selectionNum === 0 ? (
        sim[idx] > 0 ? sim[idx] : density[idx]
      ) : (
        status.mode === Mode.OVERWRITE ? ( sim[idx] > 0 ? sim[idx] : 0 ) : 1
      )
    );
  });

  const radiusList = new Array(pointLen).fill(radius);
  const borderList = new Array(pointLen).fill(border)
  mouseoverPoints.forEach(idx => {
    radiusList[idx] = radius * 1.4;
    borderList[idx] = border * 2;
  });

  const borderColorList = currSelections.map((selectionNum, idx) => {
    if (selectionNum > 0) {
      radiusList[idx] = radius * 1.4;
      borderList[idx] = border * 5;
    }
    return selectionNum === 0 ? (
      sim[idx] > 0 ? colors[currSelectionNum] : [0, 0, 0]
    ) : colorDarker(colors[selectionNum], 2);
  });

  return {
    color : colorList,
    opacity: opacityList,
    radius : radiusList,
    border : borderList,
    borderColor : borderColorList
  };
} 




export function initialSplotRendering(emb, density, pointLen, radius, border, splotRef) {
  const data = initialSplotRenderingData(emb, density, pointLen, radius, border);
  scatterplot = new Scatterplot(data, splotRef.current);
}

export function skimmingSplotRenderingData(
  status, density, pointLen, colors, radius, border,
  currSelections, mouseoverPoints, currSelectionNum, sim
) {
  return skimmingBrushingNonPositionData(
    status, density, pointLen, colors, radius, border,
    currSelections, mouseoverPoints, currSelectionNum, sim
  );
}

export function notBrushingSplotRenderingData(
  density, colors, currSelections, radius, border, pointLen
) {

  const colorList = currSelections.map((selectionNum, idx) => {
    return selectionNum !== 0 ? colors[selectionNum] : [0, 0, 0];
  });
  const opacityList = currSelections.map((selectionNum, idx) => {
    return selectionNum !== 0 ? 1 : density[idx];
  });

  const borderColorList = currSelections.map((selectionNum, idx) => {
    return selectionNum === 0 ? [0, 0, 0] : colorDarker(colors[selectionNum], 2);
  });

  const radiusList = new Array(pointLen).fill(radius);
  const borderList = new Array(pointLen).fill(border);
  currSelections.map((selectionNum, idx) => {
    if (selectionNum > 0) {
      radiusList[idx] = radius * 1.4;
      borderList[idx] = border * 5;
    }
  });
  
  return {
    color: colorList,
    opacity: opacityList,
    radius: radiusList,
    border: borderList,
    borderColor: borderColorList
  }
}

export function initializingSplotRenderingData(newEmb) {
  return {
    position: newEmb
  };
}

export function brushingSplotRenderingData(
  newEmb, status, density, pointLen, colors, radius, border,
  currSelections, mouseoverPoints, currSelectionNum, sim
) {
  const data = skimmingBrushingNonPositionData(
    status, density, pointLen, colors, radius, border,
    currSelections, mouseoverPoints, currSelectionNum, sim
  );
  data.position = newEmb;
  return data;
}

export function initialProjectionRenderingData(
  emb, density, colors, currSelections, radius, border, pointLen
) {
  const data = notBrushingSplotRenderingData(
    density, colors, currSelections, radius, border, pointLen
  );
  data.position = emb;
  return data;
}

export function renderScatterplot(data, duration, delay) {
  scatterplot.update(data, duration, delay);
}

export function isScatterplotRendering() {
  return scatterplot.isUpdating;
}


