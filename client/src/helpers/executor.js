// codes for managing update executors

import { getMouseoverPoints } from "./utils";
import  { Step } from "./status";

export function updateSim(b, flag, status, size, emb, colors) {
  console.log(b.bX);
  
  // IF NOT Brushing 
  switch(status.step){
    case Step.NOTBRUSHING:
      break;
    case Step.SKIMMING:
      break;
    case Step.INITIALIZING:
      break;
    case Step.BRUSHING:
      break;
  }
  
}


