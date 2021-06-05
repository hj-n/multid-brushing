import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import SelectionInfoMatrix from "./SelectionInfoMatrix";
import SelectionInfoBarChart from "./SelectionInfoBarChart";

const SelectionInfoView = forwardRef((props, ref) => {


  const selectionInfoMatrixRef = useRef();
  const selectionInfoBarChartRef = useRef();

  useImperativeHandle(ref, () => ({
    update(selectionInfo, overwritedSelectionInfo, duration) {
      const slicedSelectionInfo = selectionInfo.slice(1);
      const slicedOverwritedSelectionInfo = overwritedSelectionInfo.slice(1).map(arr => arr.slice(1));
      selectionInfoBarChartRef.current.update(slicedSelectionInfo, duration);
      selectionInfoMatrixRef.current.update(slicedOverwritedSelectionInfo, duration);
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