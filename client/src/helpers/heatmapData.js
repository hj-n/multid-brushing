// code for generating raw heatmap data

import * as d3 from "d3";

export function heatmapData(resolution) {
  let data = [];
  for(let i = 0; i < resolution; i++) {
    data.push(new Array(resolution).fill(0));
  }
  
  const innerRadius = d3.randomInt(parseInt(resolution * 0.15))();
  const outerRadius = d3.randomInt(parseInt(resolution * 0.15) + 1, parseInt(resolution * 0.4))();
  const lastRadius  = d3.randomInt(parseInt(resolution * 0.40) + 1, parseInt(resolution * 0.6))();
  const x = d3.randomInt(resolution)();
  const y = d3.randomInt(resolution)();


  const innerRadScale = d3.scaleLinear().domain([innerRadius, outerRadius]).range([0, 1]);
  const outerRadScale = d3.scaleLinear().domain([outerRadius, lastRadius]).range([1, 0]);


  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      let dist = Math.sqrt((i - y) ** 2 + (j - x) ** 2);
      if (dist > innerRadius && dist < outerRadius){
        data[i][j] = innerRadScale(dist);
      }
      if (dist >= outerRadius && dist < lastRadius) {
        data[i][j] = outerRadScale(dist);
      }
    }
  }

  return data;

  
}

