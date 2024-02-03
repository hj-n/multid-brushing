export function csrTo2DArray(csrData) {
	const numRows = csrData.indptr.length - 1;

	// this makes maximum call stack size exceeded
	// this makes the code work
	let numCols = -1;
	for (let i = 0; i < csrData.indices.length; i++) {
		if (csrData.indices[i] > numCols) {
			numCols = csrData.indices[i];
		}
	}


	const matrix = Array.from({ length: numRows }, () => new Array(numCols).fill(0));

	for (let i = 0; i < numRows; i++) {
		for (let j = csrData.indptr[i]; j < csrData.indptr[i + 1]; j++) {
			const col = csrData.indices[j];
			const value = csrData.data[j];
			matrix[i][col] = value;
		}
	}

	console.log(csrData);

	return matrix;
}