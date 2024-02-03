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

export function closeness(targetIndex, zeta, hdSim, knn) {
	/**
	returns a 1D array that contains closeness of each point to the target point
	*/

	// under implementation

}