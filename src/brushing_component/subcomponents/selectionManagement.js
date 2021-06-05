// code to revise / control / utilize the selection info

import { Mode } from "../../helpers/status";
import { deepcopyArr } from "../../helpers/utils";



export function updateSelectionInfo(
  status, mouseoverPoints, 
  prevSelections, 
  currSelections, 
  currSelectionNum, 
  selectionInfo,
  overwritedSelectionInfo
) {  
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
          overwritedSelectionInfo[currSelectionNum][currSelections[idx]] += 1;
          overwritedSelectionInfo[currSelections[idx]][currSelectionNum] += 1;
          currSelections[idx] = currSelectionNum;
        } 
      }
    });
  }
  else {
    mouseoverPoints.forEach((idx) => {
      if (currSelections[idx] === currSelectionNum) {
        selectionInfo[currSelectionNum] -= 1;
        selectionInfo[prevSelections[idx]] += 1;
        if (prevSelections[idx] !== 0) {
          overwritedSelectionInfo[currSelectionNum][prevSelections[idx]] -= 1;
          overwritedSelectionInfo[prevSelections[idx]][currSelectionNum] -= 1;
        }
        currSelections[idx] = prevSelections[idx];
      }
    });
  }
}

export function restoreOtherSelections(emb, originEmb, currSelections, currSelectionNum, erasedAll) {
  const restoringEmb = deepcopyArr(emb);
  const restoringIdx = []
  currSelections.forEach((selectionNum, idx) => {
    if (erasedAll) {
      restoringEmb[idx][0] = originEmb[idx][0];
      restoringEmb[idx][1] = originEmb[idx][1];
      restoringIdx.push(idx);
    }
    else {
      if (selectionNum !== 0 && selectionNum !== currSelectionNum) {
        restoringEmb[idx][0] = originEmb[idx][0];
        restoringEmb[idx][1] = originEmb[idx][1];
        restoringIdx.push(idx);
      }
    }
    });
    
  return [restoringEmb, restoringIdx];
}

export function addSpaceToSelectionInfos(selectionInfo, overwritedSelectionInfo) {
  selectionInfo.push(0);
  for(let i = 0; i < overwritedSelectionInfo.length; i++) overwritedSelectionInfo[i].push(0);
  overwritedSelectionInfo.push(new Array(overwritedSelectionInfo.length + 1).fill(0));  
}

export function getHoveringSelections(mouseoverPoints, currSelections, currSelectionNum) {
  const hoveringSelectionsSet = new Set();
  mouseoverPoints.forEach(idx => {
    if (currSelections[idx] !== 0 && currSelections[idx] !== currSelectionNum) 
      hoveringSelectionsSet.add(currSelections[idx]);
  })
  return Array.from(hoveringSelectionsSet);
}
