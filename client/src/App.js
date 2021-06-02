import React, { useRef, useContext, createContext } from 'react';

import Brushing from "./components/Brushing";


import { generateColors } from "./helpers/utils";


function App({match}) {


  // CONSTANT Parameter Settings
  const PATH = "http://127.0.0.1:5000/";
  const defaultParams = {
    dataset: "mnist",
    method: "pca",
    sample_rate: 5
  }
  const params = match.params;
  const dataset     = params.dataset === undefined ? defaultParams.dataset : params.dataset;
  const method      = params.method  === undefined ? defaultParams.method  : params.method;
  const sample_rate = params.sample  === undefined || isNaN(parseInt(params.sample)) ? defaultParams.sample_rate  : parseInt(params.sample);


  // CONSTANT Layout / Design constants
  const size = 500;
  const margin = 10;
  const resolution = 25;
  const maxSelection = 10;
  const colors = generateColors();


  // NOTE STATEs that we use

  // const [selectionInfo, setSelectionInfo] = useState([0]);

  // const selectionStatusRef = useRef();

  // let selectionInfo = [0];
  // function updateSelectionInfo(mode) {
  //   if (mode === "add") { selectionInfo.push(0); }
  //   selectionStatusRef.current.update(mode);
  // }


  return (
    <div className="App">
      <Brushing 
        url={PATH}
        size={size}
        margin={margin}
        dataset={dataset}
        maxSelection={maxSelection}
        method={method}
        sample={sample_rate}
        resolution={resolution}
        // updateSelectionInfo={updateSelectionInfo}
        colors={colors}
        buttonSize={(size + margin) / maxSelection - margin}
        radius={15}
        border={3}
      />
      {/* <SelectionStatus
        info={selectionInfo}
        ref={selectionStatusRef}
        margin={margin}
        buttonSize={(size + margin) / maxSelection - margin}
        colors={colors}
      /> */}
    </div>
  );
}

export default App;
