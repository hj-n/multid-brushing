import * as d3 from "d3";

export function getMouseoverPoints(b, size, emb) {
  const [scaledR, scaledX, scaledY] = scaleDownBrushInfo(b, size);
  return getScaledMouseoverPoints(scaledR, scaledX, scaledY, emb);
}

function getScaledMouseoverPoints(radius, bx, by, emb) {
  const rad_sq = radius * radius;
  return emb.reduce((acc, pos, i) => {
    const dx = bx - pos[0];
    const dy = by - pos[1];
    if (dx * dx + dy * dy < rad_sq) acc.push(i);
    return acc;
  }, [])
}


function scaleDownBrushInfo(b, size) {
  return [
    (b.bR / size) * 2,
    (b.bX / size) * 2 - 1,
    - (b.bY / size) * 2 + 1
  ]
}

export function generateColors () {
  let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  let colors = [[0, 0, 0]];
  for (let i = 0; i < 10; i++) {
    let color = d3.rgb(colorScale(i))
    colors.push([color.r, color.g, color.b])
  }
  return colors;
}

export function colorDarker (color, k) {
  const darker = Math.pow(0.7, k);
  return [color[0] * darker, color[1] * darker, color[2] * darker];
}

export function checkMoved (b, e) {
  return Math.abs(b.bX - e.offsetX) + Math.abs(b.bY - e.offsetY) > 30;
}

export function deepcopyArr(a) {
  return JSON.parse(JSON.stringify(a));
}