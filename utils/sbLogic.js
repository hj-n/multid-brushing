





export function extendBrushedPoints (brushedPoints, hdSim, hdRadius) {

	let extendedPoints = []
	brushedPoints.forEach((brushedPointIndex, i) => {
		const hdSimArr = hdSim[brushedPointIndex];
		hdSimArr.forEach((sim, j) => {
			if (sim > 1 - hdRadius) {
				extendedPoints.push(j);
			}
		});
	});

	extendedPoints = [...new Set(extendedPoints)];
	return extendedPoints;
}