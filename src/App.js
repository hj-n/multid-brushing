import React, { useRef } from 'react';

import Brushing from "./brushing_component/Brushing";
import SelectionInfoView from "./components/SelectionInfoView"
import AdjacencyHeatmap from './components/AdjacencyHeatmap';

import { generateColors } from "./helpers/utils";


function App({match}) {

  // CONSTANT Parameter Settings
  const PATH = "http://127.0.0.1:5000/";
  const defaultParams = {
    dataset: "mnist",
    method: "pca",
    sample_rate: 5,
    isMatrix: true
  }
  const params = match.params;
  const dataset     = params.dataset  === undefined ? defaultParams.dataset : params.dataset;
  const method      = params.method   === undefined ? defaultParams.method  : params.method;
  const sample_rate = params.sample   === undefined || isNaN(parseInt(params.sample)) ? defaultParams.sample_rate  : parseInt(params.sample);
  const isMatrix    = params.isMatrix === undefined ? defaultParams.isMatrix : params.isMatrix === "true" ? true : false;

  // CONSTANT Layout / Design constants
  const size = 500;
  const margin = 10;
  const resolution = 55;
  const maxSelection = 10;
  const colors = generateColors();

  const pointLen = 2000;

  // NOTE SelectionInfo View
  const selectionInfoViewRef = useRef();
  const adjacencyHeatmapRef  = useRef();
  const getSelectionInfo = (selectionInfo, overwritedSelectionInfo, currSelections, duration) => { 
    selectionInfoViewRef.current.update(selectionInfo, overwritedSelectionInfo, duration); 
    if (isMatrix)
      adjacencyHeatmapRef.current.update(selectionInfo, currSelections, duration);
  }

  return (
    <div className="App">
      <div style={{display: "flex"}}>
        <Brushing 
          url={PATH}
          size={size}
          margin={margin}
          dataset={dataset}
          maxSelection={maxSelection}
          method={method}
          sample={sample_rate}
          resolution={resolution}
          getSelectionInfo={getSelectionInfo}
          colors={colors}
          buttonSize={(size - margin) / maxSelection - margin}
          radius={30}
          border={3}
        />
        <SelectionInfoView
          ref={selectionInfoViewRef}
          width={size * 0.4}
          margin={margin}
          colors={colors}
        />
        {isMatrix &&
          <AdjacencyHeatmap
          ref={adjacencyHeatmapRef}
          url={PATH}
          size={size * 0.9}
          margin={margin}
          pointLen={pointLen}
          dataset={dataset}
          method={method}
          sample={sample_rate}
        />
        }
        
      </div>
    </div>
  );
}

export default App;
