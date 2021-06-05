import React, { forwardRef, useImperativeHandle } from 'react';
import { widthMarginStyle } from '../helpers/styles';

const SelectionInfoView = forwardRef((props, ref) => {

  useImperativeHandle(ref, (selectionInfo) => ({
    update(selectionInfo) {
      console.log(selectionInfo)
    }
  }));

  return (
    <div style={widthMarginStyle(props.size, props.margin)}>
      TESTTEST
    </div>
  );
});

export default SelectionInfoView;