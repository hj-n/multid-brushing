import * as d3 from 'd3';

/**
* implementation of core logics of distortion-aware brushing
*/

export function findInitialSeedPoint(ld, painterXPos, painterYPos, painterRadius, density) {
	// find the points within the painter
	let pointsInPainter = [];
	for (let i = 0; i < ld.length; i++) {
		let dist = Math.sqrt(
			Math.pow(ld[i][0] - painterXPos, 2) + Math.pow(ld[i][1] - painterYPos, 2)
		);
		if (dist < painterRadius) {
			pointsInPainter.push(i);
		}
	}

	// find the point with the highest density
	let maxDensity = 0;
	let maxDensityIndex = -1;
	for (let i = 0; i < pointsInPainter.length; i++) {
		if (density[pointsInPainter[i]] > maxDensity) {
			maxDensity = density[pointsInPainter[i]];
			maxDensityIndex = pointsInPainter[i];
		}
	}

	return maxDensityIndex;

}

export function findSeedPoints(ld, knn, painterXPos, painterYPos, painterRadius, density, initialSeedPointIdx) {
	const nnOfSeed = knn[initialSeedPointIdx];
	// find the nnOfSeed within the painter
	const nnOfSeedInPainter = nnOfSeed.filter(d => {
		let dist = Math.sqrt(
			Math.pow(ld[d][0] - painterXPos, 2) + Math.pow(ld[d][1] - painterYPos, 2)
		);
		return dist < painterRadius;
	});

	return nnOfSeedInPainter;
}

export function findPointsWithinPainter(ld, painterXPos, painterYPos, painterRadius) {
	const pointsWithinPainter = ld.map(pos => {
		const dist = Math.sqrt(
			Math.pow(pos[0] - painterXPos, 2) + Math.pow(pos[1] - painterYPos, 2)
		);
		return dist < painterRadius;
	})

	// convert boolean array to index array
	return pointsWithinPainter.map((d, i) => d ? i : -1).filter(d => d !== -1);

}

export function closeness(targetGroup, zeta, hdSim, knn) {
	/**
	returns a 1D array that contains closeness of each point to the target group
	*/
	return hdSim.map((simArr, i) => {
		const zetaNN = knn[i].slice(0, zeta);
		const zetaNNInTargetGroup = zetaNN.filter(d => targetGroup.includes(d));

		
		const simSumZetaNN = zetaNN.reduce((acc, cur) => acc + simArr[cur], 0);
		const simSumZetaNNInTargetGroup = zetaNNInTargetGroup.reduce((acc, cur) => acc + simArr[cur], 0);

		const closeness = simSumZetaNNInTargetGroup / simSumZetaNN;


		return closeness;
	});

}

function findSlopeToCircleCenter(x, y, cx, cy, radius) {
	/**
	 * find the slope of the line from (x, y) to the center of the circle (cx, cy)
	 * then make the length of the line to be radius
	 */
	const dx = x - cx;
	const dy = y - cy;
	const dist = getDist(x, y, cx, cy);
	const ratio = radius / dist;
	return [dx * ratio, dy * ratio];
} 

function getDist(x, y, cx, cy) {
	return Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
}


export function findInitialRelocationPositions(
	seedPoints, painterXPos, painterYPos, painterRadius, currentLd, closenessArr
) {
  /**
	find the initial relocation positions of the points based on seed points
	*/

	const relocatedLd = currentLd.map((pos, i) => {
		if (seedPoints.includes(i)) { return pos; }
		else {
			const slope = findSlopeToCircleCenter(
				pos[0], pos[1], painterXPos, painterYPos, painterRadius
			);
			if (closenessArr[i] === 1) { 
				if (getDist(pos[0], pos[1], painterXPos, painterYPos) <= painterRadius) {
					return [pos[0], pos[1]];
				}
				return [painterXPos + slope[0], painterYPos + slope[1]]; 
			}
			if (closenessArr[i] === 0) { 
				if (getDist(pos[0], pos[1], painterXPos, painterYPos) > 3 * painterRadius) {
					return [pos[0], pos[1]];
				}
				return [painterXPos + slope[0] * 4, painterYPos + slope[1] * 4]; 
			}
			else { return [painterXPos + slope[0] * (3  - 2 * closenessArr[i]), painterYPos + slope[1] * (3 - 2 * closenessArr[i])]; }
		}
	});
	return relocatedLd;

}

export function extendHull(hull, extendLength) {
	// extendLength = extendLength * 4;
	const bisectors = getBisectors(hull);
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

export function pointToLineDist(x, y, x1, y1, x2, y2) {
	/**
	 * find the distance between the point (x, y) and the line that connects (x1, y1) and (x2, y2)
	 * if it is not possible to find the orthogonal projection of the point to the line, 
	 * then find the distance to the closest endpoint
	 */
	const dx = x2 - x1;
	const dy = y2 - y1;
	const l2 = dx * dx + dy * dy;
	const t = ((x - x1) * dx + (y - y1) * dy) / l2;
	const t1 = Math.max(0, Math.min(1, t));
	const projectionX = x1 + t1 * dx;
	const projectionY = y1 + t1 * dy;

	const projectionToP1 = Math.sqrt((projectionX - x1) ** 2 + (projectionY - y1) ** 2);
	const projectionToP2 = Math.sqrt((projectionX - x2) ** 2 + (projectionY - y2) ** 2);
	const P1toP2 = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

	const distToProjection = Math.sqrt((projectionX - x) ** 2 + (projectionY - y) ** 2);
	const distToP1 = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
	const distToP2 = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);

	if (projectionToP1 + projectionToP2 > P1toP2) {
		return Math.min(distToP1, distToP2);
	}
	else {
		return distToProjection;
	}
	
}

export function findSlopeBasedOnHull(
	x, y, bisectors, hull, painterRadius
) {
	// for a given point (x,y), find the two bisectors that enclose the point
	let bisectorIndices = [0, 1]
	let minDist = 100000000;
	for (let i = 0; i < hull.length; i++) {
		const currIdx = i;
		const nextIdx = (i + 1) % hull.length;

		const dist = pointToLineDist(
			x, y, hull[currIdx][0], hull[currIdx][1], hull[nextIdx][0], hull[nextIdx][1]
		)

		
		if (dist < minDist) {
			minDist = dist;
			bisectorIndices = [currIdx, nextIdx];
		}
	}



	// find the point where the line from (x,y) parallel to the hull edge intersects with the bisectors
	const parallelSlope = (hull[bisectorIndices[1]][1] - hull[bisectorIndices[0]][1]) / (hull[bisectorIndices[1]][0] - hull[bisectorIndices[0]][0]);
	const parallelIntercept = y - parallelSlope * x;

	const bisector1Slope = bisectors[bisectorIndices[0]][0];
	const bisector1Intercept = bisectors[bisectorIndices[0]][1];

	const intersect1X = (parallelIntercept - bisector1Intercept) / (bisector1Slope - parallelSlope);
	const intersect1Y = bisector1Slope * intersect1X + bisector1Intercept;

	const bisector2Slope = bisectors[bisectorIndices[1]][0];
	const bisector2Intercept = bisectors[bisectorIndices[1]][1];

	const intersect2X = (parallelIntercept - bisector2Intercept) / (bisector2Slope - parallelSlope);
	const intersect2Y = bisector2Slope * intersect2X + bisector2Intercept;

	// find the ratio of the (x,y) that cuts the line between the two intersection points
	const dist1 = getDist(x, y, intersect1X, intersect1Y);
	const dist2 = getDist(x, y, intersect2X, intersect2Y);
	const ratio = dist1 / (dist1 + dist2);

	// fint the slope of the line from (x,y) to the corresponding point to the hull
	const hullStartPoint = [
		hull[bisectorIndices[0]][0] * (1 - ratio) + hull[bisectorIndices[1]][0] * ratio,
		hull[bisectorIndices[0]][1] * (1 - ratio) + hull[bisectorIndices[1]][1] * ratio
	];

	const slope = findSlopeToCircleCenter(
		x, y, hullStartPoint[0], hullStartPoint[1], painterRadius
	);
	
  return {
		slope: slope,
		hullStartPoint: hullStartPoint
	}


}


export function getBisectors(hull) {
	return hull.map((d, i) => {
		const nextIdx = (i + 1) % hull.length;
		const prevIdx = (i - 1 + hull.length) % hull.length;
		const nextPos = hull[nextIdx];
		const prevPos = hull[prevIdx];

		const nextSlope = [d[0] - nextPos[0], d[1] - nextPos[1]];
		const prevSlope = [d[0] - prevPos[0], d[1] - prevPos[1]];
		const normalizdeNextSlope = [
			nextSlope[0] / Math.sqrt(nextSlope[0] ** 2 + nextSlope[1] ** 2),
			nextSlope[1] / Math.sqrt(nextSlope[0] ** 2 + nextSlope[1] ** 2)
		];
		const normalizedPrevSlope = [
			prevSlope[0] / Math.sqrt(prevSlope[0] ** 2 + prevSlope[1] ** 2),
			prevSlope[1] / Math.sqrt(prevSlope[0] ** 2 + prevSlope[1] ** 2)
		];

		// find the bisector of the two lines
		const bisectorSlope = [normalizdeNextSlope[0] + normalizedPrevSlope[0], normalizdeNextSlope[1] + normalizedPrevSlope[1]];
		const bisectorSlopeVal = bisectorSlope[1] / bisectorSlope[0];
		const bisectorIntercept = d[1] - bisectorSlopeVal * d[0];
		return [bisectorSlopeVal, bisectorIntercept];
	});
}

export function isPointWithinHull(x, y, hull) {
	/**
	 * check if the point (x, y) is within the convex hull using d3
	 */
	return d3.polygonContains(hull, [x, y]);

}



export function findRelocationPositionsHull(
	seedPoints, hull, currentLd, closenessArr, painterRadius, canvasSize
) {
	/**
	* find the relocation positions of the points based on seed points and convex hull
	*/

	const bisectors = getBisectors(hull);
	const extendedHull = extendHull(hull, painterRadius * 2);

	const relaxedPoints = relaxation([...seedPoints], currentLd, 100, canvasSize);

	
	const relocatedLd = currentLd.map((pos, i) => {
		
		if ([...seedPoints].includes(i)) { return relaxedPoints[i]; }
		else {
			const slopeInfo = findSlopeBasedOnHull(
				pos[0], pos[1], bisectors, hull, painterRadius
			);
			let slope = slopeInfo.slope;
			const hullStartPoint = slopeInfo.hullStartPoint;
			if (closenessArr[i] === 1) {
				if (isPointWithinHull(pos[0], pos[1], hull)) {
					return [pos[0], pos[1]];
				}
				return [hullStartPoint[0], hullStartPoint[1]];
			}
			else if (closenessArr[i] === 0) {
				if (!isPointWithinHull(pos[0], pos[1], extendedHull)) {
					return [pos[0], pos[1]];
				}
				return [hullStartPoint[0] + slope[0] * 3, hullStartPoint[1] + slope[1] * 3];
			}
			else {
				return [hullStartPoint[0] + slope[0] * (2 - 2 *  closenessArr[i]), hullStartPoint[1] + slope[1] * (2 -  2 * closenessArr[i])];
			}
		}
	});
	return relocatedLd;
}



export function relaxation(indices, ld, iteration, canvasSize) {
  /**
	* relaxation of the points based on lloyd's relaxation 
	* for the points forming the convex hull, the points are fixed
	* the relaxation is done within the hull
	*/
	let points = indices.map(i => ld[i]);

	const hull = d3.polygonHull(points);
	const hullIndices = [];
	points.forEach((pos, i) => {
		for (let j = 0; j < hull.length; j++) {
			if (pos[0] === hull[j][0] && pos[1] === hull[j][1]) {
				hullIndices.push(i);
				break;
			}
		}
	})


	
	for (let i = 0; i < iteration; i++) {
		const delaunay = d3.Delaunay.from(points.map(d => [d[0], d[1]]));
		const voronoi = delaunay.voronoi([0, 0, canvasSize, canvasSize]);
		const voronoiPolygons = indices.map((idx, j) => { return voronoi.cellPolygon(j) });


		// // clip the polygons to fit the hull
		const clippedPolygons = voronoiPolygons.map((polygon, j) => {
			if (polygon === null) return null;
			const clippedPolygon = polygon.filter(point => d3.polygonContains(hull, point));
			return clippedPolygon;
		});


		points = points.map((point, j) => {
			if (hullIndices.includes(j)) { return point; }
			if (clippedPolygons[j] === null) { return point; }
			const clippedPolygon = clippedPolygons[j];
			if (clippedPolygon.length === 0) { return point;}
			else if (clippedPolygon.length === 1) { return point; }
			else if (clippedPolygon.length === 2) { return point; }
			else {
				const centroid = d3.polygonCentroid(clippedPolygon);
				if (isNaN(centroid[0]) || isNaN(centroid[1])) { return point; }
				else return centroid;
			}
		});

	}

	const indicesToPos = {};
	indices.forEach((idx, i) => {
		indicesToPos[idx] = points[i];
	});

	return indicesToPos;

}