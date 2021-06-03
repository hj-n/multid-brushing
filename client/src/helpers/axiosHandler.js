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

export function positionUpdateParam(
  consideringPoints, 
  prevSelectedPoints, 
  resolution,
  scale4offset,
  offset,   // ratio compared to resolution
  kdeThreshold, 
  simThreshold
) {

  return {
    params: {
      index: { data : consideringPoints }, 
      group: { data : prevSelectedPoints },
      resolution: resolution,
      scale4offset: scale4offset,
      offset : offset,   
      threshold : kdeThreshold,
      simthreshold : simThreshold
    }
  }
}