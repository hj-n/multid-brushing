// code to revise / control / utilize the selection info

import { Mode } from "../helpers/status";
import { deepcopyArr } from "../helpers/utils";



export function updateSelectionInfo(status, mouseoverPoints, prevSelections, currSelections, currSelectionNum, selectionInfo) {  
  if (status.mode !== Mode.ERASE) {
    mouseoverPoints.forEach((idx) => {
      if (currSelections[idx] === currSelectionNum) return;
      else if (currSelections[idx] === 0) {
        currSelections[idx] = currSelectionNum;
        selectionInfo[currSelectionNum] += 1;
      }
      else {
        if (status.mode === Mode.OVERWRITE) {
          selectionInfo[currSelections[idx]] -= 1;
          selectionInfo[currSelectionNum] += 1;
          currSelections[idx] = currSelectionNum;
        } 
      }
    });
  }
  else {
    mouseoverPoints.forEach((idx) => {
      if (currSelections[idx] === currSelectionNum) {
        currSelections[idx] = prevSelections[idx];
        selectionInfo[currSelectionNum] -= 1;
        selectionInfo[prevSelections[idx]] += 1;
      }
    });
  }
}

export function restoreOtherSelections(emb, originEmb, currSelections, currSelectionNum) {
  const restoringEmb = deepcopyArr(emb);
  const restoringIdx = []
  currSelections.forEach((selectionNum, idx) => {
    if (selectionNum !== 0 && selectionNum !== currSelectionNum) {
      restoringEmb[idx][0] = originEmb[idx][0];
      restoringEmb[idx][1] = originEmb[idx][1];
      restoringIdx.push(idx);
    }
  });
  return [restoringEmb, restoringIdx];
}

