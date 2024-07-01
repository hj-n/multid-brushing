
export function findPointsWithinCircle(
	ld, x0, y0, x1, y1
) {
	/**
	 * Find points within the circular region
	 */

	const radius = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2) * (1/Math.sqrt(2));
	
	const brushedPoints = [];
	ld.forEach((point, i) => {
		if ((point[0] - x0) ** 2 + (point[1] - y0) ** 2 <= radius ** 2) {
			brushedPoints.push(i);
		}
	});
	return brushedPoints;
}

export function findPointsWithinHDCircle(
	currentBrushedPoints, hd, ld, x0, y0
) {
	// find the point that are closed to the (x0, y0) in ld
	let centerPoint = -1;
	let minDistance = Infinity;

	currentBrushedPoints.forEach((pointIndx) => {
		const distance = (ld[pointIndx][0] - x0) ** 2 + (ld[pointIndx][1] - y0) ** 2;
		if (distance < minDistance) {
			minDistance = distance;
			centerPoint = pointIndx;
		}
	});

	// find the furthest point from the center point
	let maxDistance = 0;
	let furthestPoint = -1;
	currentBrushedPoints.forEach((pointIndx) => {
		const distance = (ld[pointIndx][0] - ld[centerPoint][0]) ** 2 + (ld[pointIndx][1] - ld[centerPoint][1]) ** 2;
		if (distance > maxDistance) {
			maxDistance = distance;
			furthestPoint = pointIndx;
		}
	});

	console.log(centerPoint, furthestPoint);
	// find the hd radius (distance between the center point and the furthest point in HD)
	let hdRadius = 0
	hd[centerPoint].forEach((value, i) => {
		hdRadius += (value - hd[furthestPoint][i]) ** 2;
	});
	hdRadius = Math.sqrt(hdRadius);

	// find all points within the hd circle
	const brushedPoints = [];
	hd.forEach((point, i) => {
		let distance = 0;
		point.forEach((value, j) => {
			distance += (value - hd[centerPoint][j]) ** 2;
		});
		distance = Math.sqrt(distance);
		if (distance <= hdRadius) {
			brushedPoints.push(i);
		}
	});

	return [...(new Set(brushedPoints).intersection(new Set(currentBrushedPoints)))]

	

}