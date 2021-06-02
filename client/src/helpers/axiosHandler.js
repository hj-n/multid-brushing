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

export function initialSplotRenderingData(emb, density, pointLen, radius, border) {
  return {
    position: emb,
    opacity: density,
    color : new Array(pointLen).fill([0, 0, 0]),
    radius : new Array(pointLen).fill(radius),
    border : new Array(pointLen).fill(border),
    borderColor : new Array(pointLen).fill([0, 0, 0])
  }
}