// codes for managing update executors


import  { Step } from "./status";
import { basicSplotRenderingData, renderScatterplot } from "../subcomponents/renderingScatterplot"

export function updateSim(
  flag, status, colors, density, pointLen, radius, duration,
  currSelections, mouseoverPoints
) {
  switch(status.step){
    case Step.NOTBRUSHING:
    case Step.SKIMMING:
      const data = basicSplotRenderingData(
        density, pointLen, colors, radius, 
        currSelections, mouseoverPoints
      );
      renderScatterplot(data, duration, 0);
      break;
    case Step.INITIALIZING:
      break;
    case Step.BRUSHING:
      break;
  }
  
}


