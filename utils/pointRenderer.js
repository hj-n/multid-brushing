import * as d3 from 'd3';


export function scalePoints(points, canvasSize) {
	/**
	 * Scales the points to fit the canvas size
	 * Left 10% for padding
	*/
	const padding = 0.15;
	const width = canvasSize;
	const height = canvasSize;

	const xDomain = d3.extent(points, d => d[0]);
	const yDomain = d3.extent(points, d => d[1]);

	const xScale = d3.scaleLinear().domain(xDomain).range([padding * width, width - padding * width]);
	const yScale = d3.scaleLinear().domain(yDomain).range([padding * height, height - padding * height]);

	return points.map(p => [xScale(p[0]), yScale(p[1])]);
}

export function scatterplotRenderer(
	pointRenderingStyle, sizeArr, colorArr, opacityArr, borderArr, zIndexArr,
	ctx, hd, ld, canvasSize 
) {

	const style = pointRenderingStyle.style;
	if (style === "dot") {
		dotRender(
			sizeArr, colorArr, opacityArr, borderArr, zIndexArr,
			ctx, ld
		);
	}
	else if (style === "monochrome") {
		monochromeRenderer(
			sizeArr, colorArr, opacityArr, borderArr, zIndexArr,
			ctx, hd, ld, canvasSize, pointRenderingStyle
		);
	}
}

export function painterRenderer(ctx, radius, xPos, yPos) {
	/**
	 * Render the painter on the canvas
	 */
	ctx.beginPath();
	ctx.arc(xPos, yPos, radius, 0, 2 * Math.PI);
	ctx.fillStyle = d3.color("green").copy({ opacity: 0.15 });
	ctx.fill();
	ctx.closePath();
}

export function clearRender(ctx, canvasSize) {
	/**
	 * Clear the canvas
	 */
	ctx.clearRect(0, 0, canvasSize, canvasSize);
}


export function startScatterplotRenderAnimation(
	style, sizeArr, colorArr, opacityArr, borderArr, zIndexArr,
	ctx, canvasSize, hd, currentLd, nextLd, duration, renderingStyle,
	callback = undefined,
	updateCallback = undefined
) {
	let start = undefined;

	const update = (timestamp) => {

		if (!start) start = timestamp;
		const progress = (timestamp - start) / duration;

		// console.log(timestamp, progress, duration);

		const intermediateLd = currentLd.map((d, i) => {
			return [d[0] + (nextLd[i][0] - d[0]) * progress, d[1] + (nextLd[i][1] - d[1]) * progress];
		});

		clearRender(ctx, canvasSize);
		if (style === "dot")
			dotRender(
				sizeArr, colorArr, opacityArr, borderArr, zIndexArr,
				ctx, intermediateLd
			);
		else if (style === "monochrome") {
			monochromeRenderer(
				sizeArr, colorArr, opacityArr, borderArr, zIndexArr,
				ctx, hd, intermediateLd, canvasSize, renderingStyle
			);
		}
		if (updateCallback) { updateCallback(progress); }
		if (progress < 1) {
			requestAnimationFrame(update);
		}
		else { if (callback) { callback(); } }
	}

	requestAnimationFrame(update);
}



export function initiateBrushingAnimation(
	ctx, canvasSize, relocationInterval, relocationUpdateDuration,
	intervalCallback = undefined, 
	updateCallback = undefined, 
	checkFinishCallback = undefined
) {
	let start = undefined;
	let lastRelocationProgress = 0;

	const update = (timestamp) => {
		if (!start) start = timestamp;
		const progress = (timestamp - start) / relocationInterval;
		const relocationProgress = 
			(progress - Math.floor(progress)) / (relocationUpdateDuration / relocationInterval) > 1 ?
				100 : (progress - Math.floor(progress)) / (relocationUpdateDuration / relocationInterval);

		clearRender(ctx, canvasSize);
		if (progress - lastRelocationProgress >= 1) {
			lastRelocationProgress = parseInt(Math.floor(progress));
			if (intervalCallback) { intervalCallback(); } // run for every relocation interval
		}

		if (updateCallback) { updateCallback(progress, relocationProgress);} // run for every update iteration

		if (!checkFinishCallback()) {
			requestAnimationFrame(update);
		}
	}

	requestAnimationFrame(update);

}

export function dotRender(
	sizeArr, colorArr, opacityArr, borderArr, zIndexArr, ctx, ld
) {
	/**
	 * Render the points as dots
	 */
	// sort indices based on zIndex
	const indices = Array.from(Array(ld.length).keys());
	indices.sort((a, b) => zIndexArr[a] - zIndexArr[b]);


	for (let i = 0; i < ld.length; i++) {
		const index = indices[i];
		ctx.beginPath();
		ctx.arc(ld[index][0], ld[index][1], sizeArr[index], 0, 2 * Math.PI);
		ctx.fillStyle = d3.color(colorArr[index]).copy({ opacity: opacityArr[index] });
		ctx.fill();
		ctx.lineWidth = borderArr[index] ? sizeArr[i] * 0.3 : 0.5;
		ctx.strokeStyle = "black";
		ctx.stroke();

		ctx.closePath();
	}

}


export function monochromeRenderer(
	sizeArr, colorArr, opacityArr, borderArr, zIndexArr, 
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
	



	const imageData = ctx.createImageData(canvasSize, canvasSize);
	for (let i = 0; i < ld.length; i++) {
		const xPos = parseInt(ld[i][0] - 0.5 * sizeArr[i]) 
		const yPos = parseInt(ld[i][1] - 0.5 * sizeArr[i]) 

		const rgb = d3.color(colorArr[i]);

		for (let j = 0; j < sizeArr[i]; j++) {
			for (let k = 0; k < sizeArr[i]; k++) {
				const index = (xPos + j + (yPos + k) * canvasSize) * 4;

				const pixelJ = parseInt((j / sizeArr[i]) * pixelWidth);
				const pixelK = parseInt((k / sizeArr[i]) * pixelHeight);
				const pixelIndex = (pixelJ + pixelK * pixelWidth);

				let value = hd[i][pixelIndex] * 255;
				if (inversed) { value = 255 - value; }
				if (value < 255) {
					value = 255 - (255 - value) * opacityArr[i];
				}


				const r = rgb.r;
				const g = rgb.g;
				const b = rgb.b;


				if (removeBackground && value === 255) continue;
				imageData.data[index] = r
				imageData.data[index + 1] = g
				imageData.data[index + 2] = b;
				imageData.data[index + 3] = (255 - value);
			}
		}

	}


	ctx.putImageData(imageData, 0, 0);

	for (let i = 0; i < ld.length; i++) {
		const xPos = parseInt(ld[i][0]);
		const yPos = parseInt(ld[i][1]);
		// circular border (thicker when borderArr[i] is true)
		if (borderArr[i]) {
			ctx.beginPath();
			ctx.arc(xPos, yPos, sizeArr[i] / 1.5, 0, 2 * Math.PI);
			ctx.strokeStyle = d3.color("black").copy({ opacity: opacityArr[i] });
			ctx.lineWidth = 0.5;
			ctx.stroke();
			ctx.closePath();
		}

	}



}

