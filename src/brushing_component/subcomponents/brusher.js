// Mouseevent functions for brushing / brusher

import * as d3 from "d3";
import { Mode, Step } from "../../helpers/status";


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

export function addSplotEventListener(dom, b, status) {
  dom.addEventListener("mouseover", function( ) { splotMouseover(brusher);         });
  dom.addEventListener("mousemove", function(e) { splotMousemove(brusher, b, e);   });
  dom.addEventListener("mouseout" , function( ) { splotMouseout (brusher);         });
  dom.addEventListener("mousedown", function( ) { splotMousedown(brusher, status); });
  dom.addEventListener("mouseup"  , function( ) { splotMouseup  (brusher, status)  });
  dom.addEventListener("wheel"    , function(e) { splotWheel    (brusher, b, e);   });
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
  // flag.mouseout = true;
  brusher.transition()
         .duration(300)
         .style("opacity", 0);
}

function splotMousedown(brusher, status) {
  status.click = true;  
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
    if (status.shift || status.ctrl) return;
    brusher.attr("fill", "red");
    status.alt = true;
    status.mode = Mode.ERASE;
  };
  if (e.key === "Shift") {
      if (status.alt || status.ctrl) return;
      brusher.attr("fill", "blue")
      status.shift = true;
      status.mode = Mode.OVERWRITE;
  }
  if (e.key === "Control" || e.key === "Meta") {   // For mac users 
    if (status.shift || status.alt) return;
    if (status.step === Step.INITIALIZING || status.click) return;
    brusher.attr("fill", "orange")
    status.ctrl = true;
    status.mode = Mode.DRAGGING;
  }
}

function documentKeyup(brusher, status, e) {
  if (e.key === "Alt" && !e.shift && !e.ctrl) {
    brusher.attr("fill", "green");
    status.alt = false;
    status.mode = Mode.NORMAL;
  };
  if (e.key === "Shift" && !e.alt && !e.ctrl) {
    brusher.attr("fill", "green");
    status.shift = false;
    status.mode  = Mode.NORMAL;
  };
  if ((e.key === "Control" || e.key === "Meta") && !e.shift && !e.alt) {
    if (status.mode !== Mode.DRAGGING) return;
    brusher.attr("fill", "green");
    status.ctrl = false;
    status.mode = Mode.NORMAL;
  }
}