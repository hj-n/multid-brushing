import { rangeTransformDependencies } from 'mathjs';
import React, { forwardRef, useImperativeHandle } from 'react';
import { scatterplotStyle } from '../helpers/styles';

const SelectionInfoMatrix = forwardRef((props, ref) => {

  useImperativeHandle(ref, () => ({
    update(matrixInfo, duration) { updateMatrix(matrixInfo, duration); }
  }));

  const updateMatrix = (matrixInfo, duration) => {
    // TODO  
    //console.log("UPDATE MATRIX", matrixInfo, duration, props.color);
    var d3 = require("d3");
    let svg = d3.select('svg#selectionInfoMatrix');
    var margin = 20;// = props.margin;
    var height = props.width;
    var length = matrixInfo.length;
    let x = d3.scaleBand()
              .domain([...Array(length).keys()])
              .range([margin, props.width - margin])
              .padding(0.2);

    let y = d3.scaleBand()
              .domain([...Array(length).keys()])
              .range([height - margin, margin])
              .padding(0.2);

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

              
    function make_data(data){
      let result = [];
      var max = d3.max(data, d => d3.max(d));
      data.forEach((d1, i1) => d1.forEach((d2, i2) => result.push({col : i1, row : i2, val : d2 / max})));
      return result;
    }
    let matrix_data = make_data(matrixInfo);
    svg.selectAll('rect').data(matrix_data, d => {return d.col+':'+d.row})
        .join(
          enter => enter.append('rect')
                        .attr("x", d => x(d.col))
                        .attr("y", d => y(d.row))
                        .attr('width', x.bandwidth())
                        .attr('height', y.bandwidth())
                        .style('fill', props.color)
                        .style('opacity', 0)
                        .call(enter => enter.transition()
                                              .duration(1200)
                                              .style('opacity', d => d.val)),
          update => update.call(update => update.transition()
                                                  .duration(1200)
                                                  .attr("x", d => x(d.col))
                                                  .attr("y", d => y(d.row))
                                                  .attr('width', x.bandwidth())
                                                  .attr('height', y.bandwidth())
                                                  .style('opacity', d => d.val)));

  }


  // style이나 위치같은건 대충 나중에 맞추면 되니까 일단은 props.width랑 props.margin 사용해서 맘대로
  return (
    <div style={{display: "block"}}>
      <div style={{marginBottom: props.margin}}>
        SelectionInfo Matrix
      </div>
      <svg id="selectionInfoMatrix"
        width={props.width}       // 알아서 설정, props.width보단 작아야 함 (더 크면 넘침)
        height={props.width + 10} // 알아서 설정, props.width보다 조금 더 크면 괜찮을듯
        style={{
          border: "1px solid black",
          display: "block"
        }}
      />
    </div>
  );
});

export default SelectionInfoMatrix;