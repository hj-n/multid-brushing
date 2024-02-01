import * as d3 from 'd3';


function scalePoints(points, canvasSize) {
	/**
	 * Scales the points to fit the canvas size
	 * Left 10% for padding
	*/
	const padding = 0.1;
	const width = canvasSize;
	const height = canvasSize;

	const xDomain = d3.extent(points, d => d[0]);
	const yDomain = d3.extent(points, d => d[1]);

	const xScale = d3.scaleLinear().domain(xDomain).range([padding * width, width - padding * width]);
	const yScale = d3.scaleLinear().domain(yDomain).range([padding * height, height - padding * height]);

	return points.map(p => [xScale(p[0]), yScale(p[1])]);
}

export function render(renderingStyle, canvasDom, ctx, ld, color, opacity, canvasSize, pointSize) {
	const ld_scaled = scalePoints(ld, canvasSize);
	// if  not an array, convert it to array
	if (!Array.isArray(color)) { color = Array(ld_scaled.length).fill(color); }
	if (!Array.isArray(opacity)) { opacity = Array(ld_scaled.length).fill(opacity); }
	if (!Array.isArray(pointSize)) { pointSize = Array(ld_scaled.length).fill(pointSize); }

	if (renderingStyle === "dot") {
		dotRender(canvasDom, ctx, ld_scaled, color, opacity, canvasSize, pointSize);
	}
}

export function dotRender(canvasDom, ctx, ld, color, opacity, canvasSize, pointSize) {
	/**
	 * Render the points as dots
	 */

	ctx.clearRect(0, 0, canvasSize, canvasSize);
	for (let i = 0; i < ld.length; i++) {
		ctx.beginPath();
		ctx.arc(ld[i][0], ld[i][1], pointSize[i], 0, 2 * Math.PI);
		ctx.fillStyle = d3.color(color[i]).copy({ opacity: opacity[i] });
		ctx.fill();
		ctx.closePath();
	}

}