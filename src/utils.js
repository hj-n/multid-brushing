import * as d3 from "d3";

export function deepcopyArr(arr) {
	// deep copy an array
	return JSON.parse(JSON.stringify(arr));
}

export function scaleToPixel(ld, pixel) {
	const xDomain = d3.extent(ld, d => d[0]);
	const yDomain = d3.extent(ld, d => d[1]);
	const xRange  = [0 + pixel * 0.05, pixel * 0.95];
	const yRange  = [0 + pixel * 0.05, pixel * 0.95];
	const xScale = d3.scaleLinear().domain(xDomain).range(xRange);
	const yScale = d3.scaleLinear().domain(yDomain).range(yRange);
	return ld.map(d => [xScale(d[0]), yScale(d[1])]);
}