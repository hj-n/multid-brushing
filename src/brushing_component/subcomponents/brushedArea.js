// Subcomponent code for managing brusher area (a.k.a. contour)

import * as d3 from "d3";

let LINE;  


let contourSvg , contourOffsetSvg;
let contourPath, contourOffsetPath;

export function initializeBrushedArea (size) {
  contourSvg       = d3.select("#contourSvg").append("g");
  contourOffsetSvg = d3.select("#contourSvg").append("g");


  contourPath = contourSvg.append("path")
                          .attr("stroke", d3.rgb(100, 10, 10))
                          .attr("stroke-width", 3)
                          .style("stroke-dasharray", ("3, 3"))
                          .attr("fill", "none")
                          .style("opacity", 0);

  contourOffsetPath = contourOffsetSvg.append("path")
                                      .attr("stroke", d3.rgb(200, 50, 50))
                                      .attr("stroke-width", 3)
                                      .style("stroke-dasharray", ("3, 3"))
                                      .attr("fill", "none")
                                      .style("opacity", 0);
  LINE = d3.line()
          .curve(d3.curveCardinal)
          .x(d => size * 0.5 * (d[0] + 1))
          .y(d => - size * 0.5 * (d[1] - 1));
}

export function updateBrushedArea (contour, offsettedContour, positionDuration) {
  contour.push(contour[0]);
  offsettedContour.push(offsettedContour[0]);
  contourPath.attr("d", LINE(contour))
            .transition()
            .duration(positionDuration)
            .style("opacity", 1);
  contourOffsetPath.attr("d", LINE(offsettedContour))
          .transition()
          .duration(positionDuration)
          .style("opacity", 1);
}


export function eraseBrushedArea (t) {
  contourPath.transition().duration(t).style("opacity", 0);
  contourOffsetPath.transition().duration(t).style("opacity", 0);
}