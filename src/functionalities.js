import * as d3 from 'd3';

export function findHighestDensityIdx(coveredPoints, density) {
	let maxDensity = -1;
	let maxDensityIdx = -1;
	for (let i = 0; i < coveredPoints.length; i++) {
		if (coveredPoints[i] === true && density[i] > maxDensity) {
			maxDensity = density[i];
			maxDensityIdx = i;
		}
	}
	return maxDensityIdx;
}

export function getKnn(index, knn, k) {
	return knn[index].slice(0, k);
}

export function simPointsAndCluster(pointNum, clusters, knn, k) {
	const simArray = [];
	for (let i = 0; i < pointNum; i++) {
		const simClusterArray = [];
		for (let j = 0; j < clusters.length; j++) {
			simClusterArray.push(simPointAndPointBasedOnCluster(i, j, clusters, knn, k));
		}
		simArray.push(d3.max(simClusterArray));
	}
	return simArray;
}

export function simPointAndPointBasedOnCluster(point1Idx, point2Idx, clusterIdx, knn, k) {
	const point1Knn 		= getKnn(point1Idx, knn, k);
	const point2Knn 		= getKnn(point2Idx, knn, k);
	const point1KnnSet  = new Set(point1Knn);
	const point2KnnSet  = new Set(point2Knn);
	const point1KnnDict = {};
	const point2KnnDict = {};

	for (let i = 0; i < k; i++) point1KnnDict[point1Knn[i]] = (k - i) / (2 / (k * (k + 1)));
	for (let i = 0; i < k; i++) point2KnnDict[point2Knn[i]] = (k - i) / (2 / (k * (k + 1)));
	const pointKnnIntersection = new Set([...point1KnnSet].filter(x => point2KnnSet.has(x)));
	const pointKnnClusterIntersection = clusterIdx.filter(x => pointKnnIntersection.has(x));

	let sim = 0;
	for (let i = 0; i < pointKnnClusterIntersection.length; i++) {
		sim += point1KnnDict[pointKnnClusterIntersection[i]] * point2KnnDict[pointKnnClusterIntersection[i]];
	}

	const denominater = (4 * k + 2)/ (k * (3 * k + 3));
	return sim / denominater;
}