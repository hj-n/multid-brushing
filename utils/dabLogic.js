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
				if (getDist(pos[0], pos[1], painterXPos, painterYPos) > 2 * painterRadius) {
					return [pos[0], pos[1]];
				}
				return [painterXPos + slope[0] * 2.5, painterYPos + slope[1] * 2.5]; 
			}
			else { return [painterXPos + slope[0] * (2 - closenessArr[i]), painterYPos + slope[1] * (2 - closenessArr[i])]; }
		}
	});
	return relocatedLd;

}

export function findSlopeBasedOnHull(
	x, y, bisectors, hull, painterRadius
) {
	// for a given point (x,y), find the two bisectors that enclose the point
	let bisectorIndices = undefined;
	for (let i = 0; i < hull.length; i++) {
		const nextIdx = (i + 1) % hull.length;
		const currentBisector = bisectors[i];
		const nextBisector = bisectors[nextIdx];

		const isUnderCurrentBisector = y < currentBisector[0] * x + currentBisector[1];
		const isUnderNextBisector = y < nextBisector[0] * x + nextBisector[1];

		if (isUnderCurrentBisector !== isUnderNextBisector) {
			bisectorIndices = [i, nextIdx];
			continue;
		}
	}
	// find the point where the line from (x,y) parallel to the hull edge intersects with the bisectors
	const parallelSlope = (hull[bisectorIndices[1]][1] - hull[bisectorIndices[0]][1]) / (hull[bisectorIndices[1]][0] - hull[bisectorIndices[0]][0]);
	const parallelIntercept = y - parallelSlope * x;

	const bisector1Slope = bisectors[bisectorIndices[0]][0];
	const bisector1Intercept = bisectors[bisectorIndices[0]][1];

	const intersect1X = (parallelIntercept - bisector1Intercept) / (bisector1Slope - parallelSlope);
	const intersect1Y = bisector1Slope * intersectX + bisector1Intercept;

	const bisector2Slope = bisectors[bisectorIndices[1]][0];
	const bisector2Intercept = bisectors[bisectorIndices[1]][1];

	const intersect2X = (parallelIntercept - bisector2Intercept) / (bisector2Slope - parallelSlope);
	const intersect2Y = bisector2Slope * intersectX + bisector2Intercept;

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
		const bisectorIntercept = d[1] - bisectorSlope * d[0];
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
	seedPoints, hull, currentLd, closenessArr, painterRadius
) {
	/**
	* find the relocation positions of the points based on seed points and convex hull
	*/

	const bisectors = getBisectors(hull);
	
	const relocatedLd = currentLd.map((pos, i) => {
		if (seedPoints.includes(i)) { return pos; }
		else {
			const slopeInfo = findSlopeBasedOnHull(
				pos[0], pos[1], bisectors, hull, painterRadius
			);
			const slope = slopeInfo.slope;
			const hullStartPoint = slopeInfo.hullStartPoint;
			if (closenessArr === 1) {
				if (isPointWithinHull(pos[0], pos[1], hull)) {
					return [pos[0], pos[1]];
				}
				return [hullStartPoint[0], hullStartPoint[1]];
			}
			else if (closenessArr === 0) {
				if (getDist(pos[0], pos[1], hullStartPoint[0], hullStartPoint[1]) > painterRadius) {
					return [pos[0], pos[1]];
				}
				return [hullStartPoint[0] + slope[0] * 3.5, hullStartPoint[1] + slope[1] * 3.5];
	
			}
			else {
				return [hullStartPoint[0] + slope[0] * (3 - 2 * closenessArr[i]), hullStartPoint[1] + slope[1] * (3 -  2 * closenessArr[i])];
			}
		}
	});
	return relocatedLd;
}