// Mouseevent functions for brushing / brusher

import * as d3 from "d3";
import { Mode } from "../helpers/status";


const defaultOpacity = 0.2;
const clickedOpacity = 0.5;
const minbR = 5, maxbR = 60;           // default brusher information

let brusher, brusherSvg;  // brusher component reference

export function initializeBrusher(b) {
  brusherSvg = d3.select("#brusherSvg");
  brusher = brusherSvg.append("circle")
                          .attr("fill", "green")
                          .attr("r", b.bR)
                          .attr("transform", "translate(" + 300 + "," + 300 + ")")
                          .style("opacity", 0);
}

export function addSplotEventListener(dom, b, status, updateExecutor) {
  dom.addEventListener("mouseover", function( ) { splotMouseover(brusher);        });
  dom.addEventListener("mousemove", function(e) { splotMousemove(brusher, b, e);  });
  dom.addEventListener("mouseout" , function( ) { splotMouseout (brusher);        });
  dom.addEventListener("mousedown", function( ) { splotMousedown(brusher, status, updateExecutor); });
  dom.addEventListener("mouseup"  , function( ) { splotMouseup  (brusher, status) });
  dom.addEventListener("wheel"    , function(e) { splotWheel    (brusher, b, e); })
}

export function documentEventListener(status) {
  document.addEventListener("keydown", function(e) { documentKeydown(brusher, status, e); });
  document.addEventListener("keyup"  , function(e) { documentKeyup  (brusher, status, e); });
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

function documentKeydown(brusher, status, e) {
  if (e.key === "Alt") {
    if (status.shift) return;
    brusher.attr("fill", "red");
    status.alt = true;
    status.mode = Mode.ERASE;
  };
  if (e.key === "Shift") {
      if (status.alt) return;
      brusher.attr("fill", "blue")
      status.shift = true;
      status.mode = Mode.OVERWRITE;
  }
}

function documentKeyup(brusher, status, e) {
  if (e.key === "Alt") {
    brusher.attr("fill", "green");
    status.alt = false;
    status.mode = Mode.NORMAL;
  };
  if (e.key === "Shift") {
      brusher.attr("fill", "green");
      status.shift = false;
      status.mode  = Mode.NORMAL;
  };
}