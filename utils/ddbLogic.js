

export function findPointsWithinRect(
	ld, x1, y1, x2, y2
) {
	/**
	 * Find points within the rectangular region
	 */

	if (x1 > x2) {
		[x1, x2] = [x2, x1];
	}
	if (y1 > y2) {
		[y1, y2] = [y2, y1];
	}
	const brushedPoints = [];
	ld.forEach((point, i) => {
		if (point[0] >= x1 && point[0] <= x2 && point[1] >= y1 && point[1] <= y2) {
			brushedPoints.push(i);
		}
	});
	return brushedPoints;
}


export function findPointsWithinHDRect(
	currentBrushedPoints, hd
) {
	// construct the smallest hypercube that encompasses all brushed points
	let starts = new Array(hd[0].length).fill(0);
	let ends = new Array(hd[0].length).fill(0);

	currentBrushedPoints.forEach((pointIndex) => {
		hd[pointIndex].forEach((value, i) => {
			if (value < starts[i]) {
				starts[i] = value;
			}
			if (value > ends[i]) {
				ends[i] = value;
			}
		});
	});

	// find all points within the hypercube
	const brushedPoints = [];
	hd.forEach((point, i) => {
		let isWithin = true;
		point.forEach((value, j) => {
			if (value < starts[j] || value > ends[j]) {
				isWithin = false;
			}
		});
		if (isWithin) {
			brushedPoints.push(i);
		}
	});
	return brushedPoints;
}