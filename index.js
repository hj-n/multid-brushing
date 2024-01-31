import { csrTo2DArray } from "./utils/csrParser";

class MultiDBrushing {
	
	constructor(preprocessed, technique, canvasDom, size) {
		this.preprocessed = preprocessed;
		this.technique = technique;
		this.canvasDom = canvasDom;
		this.size = size;

		this.parser();
	}

	parser() {
		/**
		 * This function will parse the preprocessed data and re-organize it to be suitable for JS manipulation
		 */
		const csr = this.preprocessed.csr;
		this.hdSim = csrTo2DArray(csr);

		console.log(this.hdSim);


	}

}

export default MultiDBrushing;