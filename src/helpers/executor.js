// codes for managing update executors


import  { Mode, Step } from "./status";
import { 
  notBrushingSplotRenderingData,
  skimmingSplotRenderingData,
  initializingSplotRenderingData, 
  brushingSplotRenderingData,
  renderScatterplot,
  draggingProjectionRenderingData,
} from "../brushing_component/subcomponents/renderingScatterplot";

export function updateSim(
  status, colors, density, pointLen, radius, border, duration, 
  currSelections, mouseoverPoints, currSelectionNum, sim
) {
  switch(status.step){
    case Step.NOTBRUSHING:
    case Step.SKIMMING:
    case Step.BRUSHING:
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
          ), duration, 0
        );
      break;
    case Step.INITIALIZING:
      break;
  }
}

export function updateWhenDragging(
  b, bDragStart, size, currentHoveringSelections, emb, density, colors, 
  currSelections, radius, border, pointLen, duration
) {
  renderScatterplot(
    draggingProjectionRenderingData(
      b, bDragStart, size, currentHoveringSelections, emb, density, colors, currSelections, radius, border, pointLen
    ), duration, 0
  );
}

export function updatePosition(status, newEmb, duration) {

  switch(status.step){
    case Step.NOTBRUSHING: break;
    case Step.SKIMMING: 
    case Step.INITIALIZING:
    case Step.BRUSHING:
      renderScatterplot(initializingSplotRenderingData(newEmb), duration, 0)
      break;
    
      // break;
  }
}

export function updatePositionSim(
  newEmb, status, colors, density, pointLen, radius, border, duration, 
  currSelections, mouseoverPoints, currSelectionNum, sim
) {

  renderScatterplot(
    brushingSplotRenderingData(
      newEmb, status, density, pointLen, colors, radius, border, 
      currSelections, mouseoverPoints, currSelectionNum, sim 
    ), duration, 0
  )
};


