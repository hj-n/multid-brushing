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

