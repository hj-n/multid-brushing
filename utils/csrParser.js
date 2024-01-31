export function csrTo2DArray(csrData) {
	const numRows = csrData.indptr.length - 1;
	const numCols = Math.max(...csrData.indices) + 1;
	const matrix = Array.from({ length: numRows }, () => new Array(numCols).fill(0));

	for (let i = 0; i < numRows; i++) {
		for (let j = csrData.indptr[i]; j < csrData.indptr[i + 1]; j++) {
			const col = csrData.indices[j];
			const value = csrData.data[j];
			matrix[i][col] = value;
		}
	}

	return matrix;
}