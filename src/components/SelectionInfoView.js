import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import SelectionInfoMatrix from "./SelectionInfoMatrix";
import SelectionInfoBarChart from "./SelectionInfoBarChart";

const SelectionInfoView = forwardRef((props, ref) => {


  const selectionInfoMatrixRef = useRef();
  const selectionInfoBarChartRef = useRef();

  useImperativeHandle(ref, (selectionInfo) => ({
    update(selectionInfo) {
      selectionInfoBarChartRef.current.update(selectionInfo);
      selectionInfoMatrixRef.current.update("X");
    }
  }));

  return (
    <div style={{ margin: props.margin, width: props.width}}>
      <SelectionInfoBarChart
        width={props.width}
        margin={props.margin}
        ref={selectionInfoBarChartRef}
      />
      <SelectionInfoMatrix
        width={props.width}
        margin={props.margin}
        ref={selectionInfoMatrixRef}
      />
    </div>
  );
});

export default SelectionInfoView;