import { Scatterplot } from "./scatterplot";

let scatterplot;


export function initialSplotRendering(emb, density, pointLen, radius, border, splotRef) {
  const data = initialSplotRenderingData(emb, density, pointLen, radius, border);
  scatterplot = new Scatterplot(data, splotRef.current);
}

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

export function basicSplotRenderingData(
  density, pointLen, colors, radius, 
  currSelections, getMouseoverPoints
) {
  const colorList = currSelections.map((d, idx) => {
    return d === 0 ? [0, 0, 0] : colors[idx];
  });
  const opacityList = currSelections.map((d, idx) => {
    return d === 0 ? density[idx] : 1;
  });
  const borderColorList = currSelections.map((d, idx) => {
    return d === 0 ? [0, 0, 0] : colors[idx];
  });

  return {
    color : colorList,
    opacity: opacityList,
    radius : new Array(pointLen).fill(radius),
    borderColor : borderColorList
  };
}

export function renderScatterplot(data, duration, delay) {
  scatterplot.update(data, duration, delay);
}


