import React, { forwardRef, useImperativeHandle } from 'react';
import { scatterplotStyle } from '../helpers/styles'

const SelectionInfoMatrix = forwardRef((props, ref) => {

  useImperativeHandle(ref, (matrixInfo) => ({
    update(matrixInfo) { updateMatrix(matrixInfo); }
  }));

  const updateMatrix = (matrixInfo) => {
    console.log("UPDATE MATRIX", matrixInfo);
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
  )

});

export default SelectionInfoMatrix;