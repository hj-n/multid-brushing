// Deprecated 

import React, { forwardRef, useEffect, useImperativeHandle, } from 'react';
import * as d3 from "d3";

const SelectionStatus = forwardRef((props, ref) => {

  let selectionStatus;

  const colors = props.colors;

  function updateGroupButtons() {
    selectionStatus.selectAll(".buttonDiv").remove();
    selectionStatus.selectAll(".buttonDiv")
                   .data(props.info)
                   .enter()
                   .append("div")
                   .attr("class", "buttonDiv")
                   .append("button")
                   .style("width", props.buttonSize + "px")
                   .style("height", props.buttonSize + "px")
                   .style("margin-left", props.margin + "px")
                   .style("border-radius", "3px")
                   .style("box-shadow", "1px 1px 1px ")
                   .style("color", "white")
                   .style("font-size", "16px")
                   .style("font-weight", "bold")
                   .style("background",(d, idx) => d3.rgb(colors[idx + 1][0], colors[idx + 1][1], colors[idx + 1][2]).toString());
  }

  function updateGroupText() {
    selectionStatus.selectAll(".buttonDiv")
                   .select("button")
                   .text((_, i) => props.info[i]);
  }

  useImperativeHandle(ref, (mode) => ( {
    update(mode) {
      if (mode === "add") {
        updateGroupButtons();
      }
      updateGroupText();

    }
  }))

  useEffect(() => {
    selectionStatus = d3.select("#selectionStatus");
    updateGroupButtons();
    updateGroupText();
  })



  return (
    <div id="selectionStatus" style={{display: 'flex'}}>
      
    </div>
  );
});

export default SelectionStatus;