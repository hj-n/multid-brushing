import { csrTo2DArray } from "./utils/csrParser";
import * as pr from "./utils/pointRenderer";

class MultiDBrushing {
	
	constructor(
		preprocessed, 
		technique, 
		canvasDom, 
		canvasSize, 
		pointSize,
		pointRenderingStyle
	) {
		this.preprocessed = preprocessed;
		this.technique = technique;
		this.canvasDom = canvasDom;
		this.canvasSize = canvasSize;
		this.pointSize = pointSize;
		this.pointRenderingStyle = pointRenderingStyle;

		// set context of the canvas
		this.ctx = canvasDom.getContext("2d");


		this.parser();
		this.initialRendering();
	}

	parser() {
		/**
		 * parse the preprocessed data and re-organize it to be suitable for JS manipulation
		 */
		const csr = this.preprocessed.csr;

		// Important informations
		this.hdSim = csrTo2DArray(csr);
		this.hd = this.preprocessed.hd;
		this.ld = this.preprocessed.ld;
		this.knn = this.preprocessed.knn;
		this.labels = this.preprocessed.labels;
	}


	initialRendering() {
		/**
		 * Render the initial points
		 */
		pr.render(
			this.pointRenderingStyle,
			this.canvasDom,
			this.ctx,
			this.ld,
			"black",
			1,
			this.canvasSize,
			this.pointSize
		);


	}

	

}

export default MultiDBrushing;