import * as d3 from "d3";

export function getMouseoverPoints(radius, bx, by, emb) {
  const rad_sq = radius * radius;
  return emb.reduce((acc, pos, i) => {
    const dx = bx - pos[0];
    const dy = by - pos[1];
    if (dx * dx + dy * dy < rad_sq) acc.push(i);
    return acc;
  }, [])
}

export function generateColors () {
  let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  let colors = []
  for (let i = 0; i < 10; i++) {
    let color = colorScale(i);
    let colorCode = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    colors.push([parseInt(colorCode[1], 16) , parseInt(colorCode[2], 16) , parseInt(colorCode[3], 16)]);
  }

  return colors;

}
