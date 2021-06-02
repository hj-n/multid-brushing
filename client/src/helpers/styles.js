// Javascript file for generating stylesheet which requries external data

export function scatterplotStyle(size) {
  return {
    border: "1px black solid",
    width: size,
    height: size,
    position: "absolute"
  };
}

export function widthMarginStyle(size, margin) {
  return {
    width: size,
    margin: margin
  };
}

export function sizeMarginStyle(size, margin) {
  return Object.assign({}, widthMarginStyle(size, margin), { height: size });
}