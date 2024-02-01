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

export function render(renderingStyle, ctx, hd, ld, canvasSize) {
	const ld_scaled = scalePoints(ld, canvasSize);
	// if  not an array, convert it to array
	// if (!Array.isArray(color)) { color = Array(ld_scaled.length).fill(color); }
	// if (!Array.isArray(opacity)) { opacity = Array(ld_scaled.length).fill(opacity); }
	// if (!Array.isArray(pointWidth)) { pointWidth = Array(ld_scaled.length).fill(pointWidth); }
	// if (!Array.isArray(pointHeight)) { pointHeight = Array(ld_scaled.length).fill(pointHeight); }


	if (renderingStyle.style === "dot") {
		dotRender(ctx, ld_scaled, canvasSize, renderingStyle);
	}
	if (renderingStyle.style === "monochrome") {
		monochromeRenderer(ctx, hd, ld_scaled, canvasSize, renderingStyle);
	
	}
}

export function dotRender(ctx, ld, canvasSize, renderingStyle) {
	/**
	 * Render the points as dots
	 */

	let size = renderingStyle.size;
	let color, opacity;
	if (!color) { color = Array(ld.length).fill("black"); }
	if (!opacity) { opacity = Array(ld.length).fill(0.5); }

	if (!Array.isArray(size)) { size = Array(ld.length).fill(size); }

	ctx.clearRect(0, 0, canvasSize, canvasSize);
	for (let i = 0; i < ld.length; i++) {
		ctx.beginPath();
		ctx.ellipse(ld[i][0], ld[i][1], size[i], size[i], 0, 0, 2 * Math.PI);
		ctx.fillStyle = d3.color(color[i]).copy({ opacity: opacity[i] });
		ctx.fill();
		ctx.closePath();
	}

}


export function monochromeRenderer(
	ctx, hd, ld, canvasSize, renderingStyle
) {
	/**
	 * Render the points with monochrome coloring
	 * Render the 3D image specified in "hd"
	 */

	const pixelWidth = renderingStyle.pixelWidth;
	const pixelHeight = renderingStyle.pixelHeight;
	const inversed = renderingStyle.inversed;
	const removeBackground = renderingStyle.removeBackground;
	
	let pointWidth = renderingStyle.width;
	let pointHeight = renderingStyle.height;


	if (!Array.isArray(pointWidth)) { pointWidth = Array(ld.length).fill(pointWidth); }
	if (!Array.isArray(pointHeight)) { pointHeight = Array(ld.length).fill(pointHeight); }


	ctx.clearRect(0, 0, canvasSize, canvasSize);
	const imageData = ctx.createImageData(canvasSize, canvasSize);
	for (let i = 0; i < ld.length; i++) {
		const xPos = parseInt(ld[i][0]);
		const yPos = parseInt(ld[i][1]);

		for (let j = 0; j < pointWidth[i]; j++) {
			for (let k = 0; k < pointHeight[i]; k++) {
				const index = (xPos + j + (yPos + k) * canvasSize) * 4;

				const pixelJ = parseInt((j / pointWidth[i]) * pixelWidth);
				const pixelK = parseInt((k / pointHeight[i]) * pixelHeight);
				const pixelIndex = (pixelJ + pixelK * pixelWidth);

				let value = hd[i][pixelIndex] * 255;
				if (!value) { value = 0; }
				if (inversed) { value = 255 - value; }


				if (removeBackground && value === 255) continue;
				imageData.data[index] = value;
				imageData.data[index + 1] = value;
				imageData.data[index + 2] = value;
				imageData.data[index + 3] = 255;
			}
		}

	}

	ctx.putImageData(imageData, 0, 0);


}

