// Mouseevent functions for brushing / brusher

import * as d3 from "d3";


// CONSTANTs

const defaultOpacity = 0.2;
const clickedOpacity = 0.5;
const minbR = 5, maxbR = 60;           // default brusher information

export function initializeBrusher(b) {
  let brusherSvg = d3.select("#brusherSvg");
  let brusher = brusherSvg.append("circle")
                          .attr("fill", "green")
                          .attr("r", b.bR)
                          .attr("transform", "translate(" + 300 + "," + 300 + ")")
                          .style("opacity", 0);
  return [brusherSvg, brusher];
}

export function addSplotEventListener(dom, brusher, b, status, updateExecutor) {
  dom.addEventListener("mouseover", function( ) { splotMouseover(brusher);        });
  dom.addEventListener("mousemove", function(e) { splotMousemove(brusher, b, e);  });
  dom.addEventListener("mouseout" , function( ) { splotMouseout (brusher);        });
  dom.addEventListener("mousedown", function( ) { splotMousedown(brusher, status, updateExecutor); });
  dom.addEventListener("mouseup"  , function( ) { splotMouseup  (brusher, status) });
  dom.addEventListener("wheel"    , function(e) { splotWheel    (brusher, b, e); })
}

function splotMouseover(brusher) {
  brusher.transition()
         .duration(300)
         .style("opacity", defaultOpacity);
}

function splotMousemove(brusher, b, e) {
  b.bX = e.offsetX;
  b.bY = e.offsetY;
  brusher.attr("transform", "translate(" + b.bX + "," + b.bY + ")")
}

function splotMouseout(brusher) {
  brusher.transition()
         .duration(300)
         .style("opacity", 0);
}

function splotMousedown(brusher, status, updateExecutor) {
  status.click = true;  
  updateExecutor.pos = null;
  brusher.style("opacity", clickedOpacity);
}

function splotMouseup(brusher, status) {
  status.click = false; 
  brusher.style("opacity", defaultOpacity);
}

function splotWheel(brusher, b, e) {
  b.bR = b.bR * ((100 - e.deltaY * b.wheelSensitivity) / 100);
  b.bR = b.bR < minbR ? minbR : b.bR;
  b.bR = b.bR > maxbR ? maxbR : b.bR;
  brusher.attr("r", b.bR);
}