import * as d3 from 'd3';
import * as dabL from "./dabLogic";

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

function catmullRomSpline( p0, p1, p2, p3, numPoints = 20) {
	const curvePoints = [];
	p0 = { x: p0[0], y: p0[1] };
	p1 = { x: p1[0], y: p1[1] };
	p2 = { x: p2[0], y: p2[1] };
	p3 = { x: p3[0], y: p3[1] };
	for (let i = 0; i < numPoints; i++) {
		const t = i / (numPoints - 1);
		const t2 = t * t;
		const t3 = t2 * t;
		const q0 = -t3 + 2 * t2 - t;
		const q1 = 3 * t3 - 5 * t2 + 2;
		const q2 = -3 * t3 + 4 * t2 + t;
		const q3 = t3 - t2;
		const tx = 0.5 * (p0.x * q0 + p1.x * q1 + p2.x * q2 + p3.x * q3);
		const ty = 0.5 * (p0.y * q0 + p1.y * q1 + p2.y * q2 + p3.y * q3);
		curvePoints.push({ x: tx, y: ty });
	}
	return curvePoints;
}

export function convexHullBorderRenderer(ctx, hull, color, strokeWidth, opacity) {
	/**
	Render a convex hull continaed in hull, with no fill, only border
	make sure that hull's points are smoothed (rounded)
	*/



	ctx.beginPath();
	ctx.strokeStyle = d3.color(color).copy({ opacity: opacity });
	ctx.lineWidth = strokeWidth;

	for (let i = 0; i < hull.length; i++) {
		const p0 = hull[(i - 1 + hull.length) % hull.length];
		const p1 = hull[i];
		const p2 = hull[(i + 1) % hull.length];
		const p3 = hull[(i + 2) % hull.length];
		const curvePoints = catmullRomSpline(p0, p1, p2, p3, 20);

		if (i === 0) ctx.moveTo(curvePoints[0].x, curvePoints[0].y);

		curvePoints.forEach((point, index) => {
			if (index > 0) {
				ctx.lineTo(point.x, point.y);
			}
		});
	}



	ctx.closePath();
	ctx.stroke();


}

export function circleLensRenderer(ctx, painterRadius, xPos, yPos, opacity, lensStyle) {
	/**
	Render outer lens
	*/

	const color = lensStyle.color;
	const strokeWidth = lensStyle.strokeWidth;

	circleBorderRender(ctx, painterRadius * 2, color, strokeWidth, xPos, yPos, opacity);

}

export function convexHull(brushedPoints) {
	return d3.polygonHull(brushedPoints);
}

export function extendHull(hull, extendLength) {
	// extendLength = extendLength * 4;
	const bisectors = dabL.getBisectors(hull);
	const extendedHull = hull.map((point, i) => {
		const slope = bisectors[i][0];
		const slopeStep = [1, slope];
		const normalizedStep = [
			slopeStep[0] / Math.sqrt(slopeStep[0] ** 2 + slopeStep[1] ** 2), 
			slopeStep[1] / Math.sqrt(slopeStep[0] ** 2 + slopeStep[1] ** 2)
		];
		const x = point[0];
		const y = point[1];
		const check = d3.polygonContains(hull, [x + normalizedStep[0] * 0.01, y + normalizedStep[1] * 0.01]);
		if (check) {
			return [x - normalizedStep[0] * extendLength, y - normalizedStep[1] * extendLength];
		}
		return [x + normalizedStep[0] * extendLength, y + normalizedStep[1] * extendLength];
	});
	return extendedHull;
}

export function convexHullLensRenderer(ctx, hull, opacity, lensStyle, extendLength) {
	/**
	* Render convex-hull based outer lens
	*/


	const color = lensStyle.color;
	const strokeWidth = lensStyle.strokeWidth;





	convexHullBorderRenderer(ctx, extendHull(hull, extendLength), color, strokeWidth, opacity);
	// convexHullBorderRenderer(ctx, hull, color, strokeWidth, opacity);
}