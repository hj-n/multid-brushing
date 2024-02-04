import * as d3 from 'd3';

export function circleBorderRender(ctx, radius, color, strokeWidth, xPos, yPos, opacity) {
	/**
	Render a circle with no fill, only border
	*/

	ctx.beginPath();
	ctx.arc(xPos, yPos, radius, 0, 2 * Math.PI);
	ctx.strokeStyle = d3.color(color).copy({ opacity: opacity });
	ctx.lineWidth = strokeWidth;
	ctx.stroke();
	ctx.closePath();

}

export function convexHullBorderRenderer() {
	/**
	Render a convex hull, with no fill, only border
	*/
}

export function circleLensRenderer(ctx, painterRadius, xPos, yPos, opacity, lensStyle) {
	/**
	Render outer lens
	*/

	const color = lensStyle.color;
	const strokeWidth = lensStyle.strokeWidth;

	circleBorderRender(ctx, painterRadius * 2, color, strokeWidth, xPos, yPos, opacity);

}