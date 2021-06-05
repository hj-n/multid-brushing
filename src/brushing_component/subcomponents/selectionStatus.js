import * as d3 from "d3";

export function updateSelectionButtons(selectionStatusDiv, info, buttonSize, margin, colors) {
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
                    .style("background",(d, idx) => d3.rgb(colors[idx + 1][0], colors[idx + 1][1], colors[idx + 1][2]).toString());
}

export function updateSelectionText(selectionStatusDiv, info) {
  selectionStatusDiv.selectAll(".buttonDiv")
                    .select("button")
                    .text((_, i) => info[i + 1]);
}