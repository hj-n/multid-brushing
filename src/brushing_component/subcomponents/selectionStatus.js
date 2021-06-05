import * as d3 from "d3";
import { colorDarker } from "../../helpers/utils";

export function updateSelectionButtons(
  selectionStatusDiv, info, currSelectionNum, 
  buttonSize, margin, colors, updateCurrSelectionNum
) {
  selectionStatusDiv.selectAll(".buttonDiv").remove();
  selectionStatusDiv.selectAll(".buttonDiv")
                    .data(info.slice(1))
                    .enter()
                    .append("div")
                    .attr("class", "buttonDiv")
                    .append("button")
                    .style("width", buttonSize + "px")
                    .style("height", buttonSize + "px")
                    .style("margin-left", margin + "px")
                    .style("border-radius", "3px")
                    .style("box-shadow", "1px 1px 1px ")
                    .style("color", "white")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .style("padding", "0px")
                    .style("background",(d, idx) =>  {
                      let color = colors[idx + 1];
                      if (idx + 1 === currSelectionNum) color = colorDarker(color, 1);
                      return d3.rgb(color[0], color[1], color[2]).toString()
                    })
                    .style("border-width", (d, idx) => (idx + 1 === currSelectionNum ? "6px" : "3px"))
                    .attr("id", (d, idx) => "button" + (idx + 1))
                    .on("click", (e) => {
                      const idx = parseInt(e.target.id.slice(6))
                      updateCurrSelectionNum(idx)
                    })
}

export function updateSelectionText(selectionStatusDiv, info) {
  selectionStatusDiv.selectAll(".buttonDiv")
                    .select("button")
                    .text((_, i) => info[i + 1]);
}