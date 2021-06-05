import React, { forwardRef, useImperativeHandle } from 'react';
import { scatterplotStyle } from '../helpers/styles'

const SelectionInfoBarChart = forwardRef((props, ref) => {

  useImperativeHandle(ref, (selectionInfo) => ({ 
    update(selectionInfo) { updateBarChart(selectionInfo); }
  }));
 
  const updateBarChart = (selectionInfo) => {
    console.log("UPDATE BAR CHART", selectionInfo);
  }

  // style이나 위치같은건 대충 나중에 맞추면 되니까 일단은 props.width랑 props.margin 사용해서 맘대로
  return (
    <div style={{display: "block" ,marginBottom: props.margin}}>
      <div style={{marginBottom: props.margin}}>
        SelectionInfo Bar Chart
      </div>
      <svg id="selectionInfoMatrix"
        width={props.width}       // 알아서 설정, props.width보단 작아야 함 (더 크면 넘침)
        height={props.width + 20} // 알아서 설정, props.width보다 조금 더 크면 괜찮을듯
        style={{
          border: "1px solid black",
          display: "block"
        }}
      />
    </div>
  )

});

export default SelectionInfoBarChart;