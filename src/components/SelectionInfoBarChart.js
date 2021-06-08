import { color } from 'd3';
import React, { forwardRef, useImperativeHandle } from 'react';
import { scatterplotStyle } from '../helpers/styles'

const SelectionInfoBarChart = forwardRef((props, ref) => {

  useImperativeHandle(ref, () => ({ 
    update(selectionInfo, duration) { updateBarChart(selectionInfo, duration); }
  }));
 
  const updateBarChart = (selectionInfo, duration) => {
    
    // TODO
    // console.log("UPDATE BAR CHART", selectionInfo, duration);
    var d3 = require("d3");
    let svg = d3.select('svg#selectionInfoBarChart');
    var margin = 20;// = props.margin;
    var height = props.width + margin;
    let x = d3.scaleBand()
        .domain([...Array(selectionInfo.length).keys()])
        .range([margin, props.width - margin])
        .padding(0.2);
    let y = d3.scaleLinear()
        .domain([0, d3.max(selectionInfo, d => d)])
        .range([height - margin, margin]);
    if(svg.selectAll('g.xbar').empty()){
      svg.append('g').attr('class', 'xbar')
          .attr("transform", `translate(0, ${height - margin})`)
          .call(d3.axisBottom(x));
    }else {
      svg.select('g.xbar')
          .transition()
          .duration(1200)
          .attr("transform", `translate(0, ${height - margin})`)
          .call(d3.axisBottom(x));
    }
    if(svg.selectAll('g.ybar').empty()){
      svg.append('g').attr('class', 'ybar')
          .attr("transform", `translate(${margin}, 0)`)
          .call(d3.axisLeft(y));
    }else {
      svg.select('g.ybar')
          .transition()
          .duration(1200)
          .attr("transform", `translate(${margin}, 0)`)
          .call(d3.axisLeft(y));
    }

    svg.selectAll('rect').data(selectionInfo)
        .join(
          enter => enter.append('rect')
                        .attr("x", (d, i) => x(i))
                        .attr("y", d => y(d))
                        .attr('width', x.bandwidth())
                        .attr('height', d => height - margin - y(d))
                        .style('fill', (d, i) => {return `rgb(${props.colors[i][0]}, ${props.colors[i][1]}, ${props.colors[i][2]})`})
                        .style('opacity', 0)
                        .call(enter => enter.transition()
                                              .duration(1200)
                                              .style('opacity', 1)),
          update => update.call(update => update.transition()
                                                  .duration(1200)
                                                  .attr("x", (d, i) => x(i))
                                                  .attr("y", d => y(d))
                                                  .attr('width', x.bandwidth())
                                                  .attr('height', d => height - margin - y(d))));
  }

  // style이나 위치같은건 대충 나중에 맞추면 되니까 일단은 props.width랑 props.margin 사용해서 맘대로
  return (
    <div style={{display: "block" ,marginBottom: props.margin}}>
      <div style={{marginBottom: props.margin}}>
        SelectionInfo Bar Chart
      </div>
      <svg id="selectionInfoBarChart"
        width={props.width}       // 알아서 설정, props.width보단 작아야 함 (더 크면 넘침)
        height={props.width + 20} // 알아서 설정, props.width보다 조금 더 크면 괜찮을듯
        style={{
          border: "1px solid black",
          display: "block"
        }}
      />
    </div>
  );
});

export default SelectionInfoBarChart;