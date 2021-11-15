// Code for handling data modification and wrangling to communicate with flask server

export function initialSplotAxiosParam(dataset, method, sample_rate) {
  return {
    params: {
      dataset: dataset,
      method : method,
      sample : sample_rate
    }
  };
}

export function similarityParam(consideringPoints) {
  return {
    params: {
      index: {
        data: consideringPoints
      }
    }
  };
}

export function idxParam(idx) {
  return {
    params: {
      index: {
        data: idx
      }
    }
  };
}

export function embDiffParam(idx, xDiff, yDiff) {
  return {
    params: {
      index: {
        data: idx
      },
      xDiff: xDiff,
      yDiff: yDiff
    }
  };
}

export function positionUpdateParam(
  consideringPoints, 
  prevSelectedPoints, 
  resolution,
  scale4offset,
  offset,   // ratio compared to resolution
  kdeThreshold, 
  simThreshold,
  status
) {

  return {
    params: {
      index: { data : consideringPoints }, 
      group: { data : prevSelectedPoints },
      resolution: resolution,
      scale4offset: scale4offset,
      offset : offset,   
      threshold : kdeThreshold,
      simthreshold : simThreshold,
      status: status
    }
  }
}

export function calculateMetricParam(currSelections, currSelectionNum, dataset, method, sample_rate) {
  return {
    params: {
      clusteredlabel: { data: currSelections },
      labelnum: currSelectionNum,
      dataset: dataset,
      method : method,
      sample : sample_rate
    }
  };
}