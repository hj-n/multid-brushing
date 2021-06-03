// codes for managing update executors


import  { Step } from "./status";
import { 
  notBrushingSplotRenderingData,
  skimmingSplotRenderingData, 
  renderScatterplot,
} from "../subcomponents/renderingScatterplot"

export function updateSim(
  flag, status, colors, density, pointLen, radius, border, duration, 
  currSelections, mouseoverPoints, currSelectionNum, sim
) {
  switch(status.step){
    case Step.NOTBRUSHING:
    case Step.SKIMMING:
      if (sim !== null) 
        renderScatterplot(
          skimmingSplotRenderingData(
            status, density, pointLen, colors, radius, border, 
            currSelections, mouseoverPoints, currSelectionNum, sim
          ), duration, 0
        );
      else 
        renderScatterplot(
          notBrushingSplotRenderingData(
            density, colors, currSelections, radius, border, pointLen
          ), duration * 3, 0
        );
      break;
    case Step.INITIALIZING:
      break;
    case Step.BRUSHING:
      break;
  }
  
}


