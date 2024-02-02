import { csrTo2DArray } from "./utils/csrParser";
import * as pr from "./utils/pointRenderer";

class MultiDBrushing {
	
	constructor(
		preprocessed, 
		technique, 
		canvasDom, 
		canvasSize, 
		pointRenderingStyle,
		showDensity = true // flag determining whether to show the HD density of the points
	) {
		this.preprocessed = preprocessed;
		this.technique = technique;
		this.canvasDom = canvasDom;
		this.canvasSize = canvasSize;
		

		// rendering options
		this.pointRenderingStyle = pointRenderingStyle;
		this.showDensity = showDensity;

		// set context of the canvas
		this.ctx = canvasDom.getContext("2d");


		this.parser();
		this.rendering();
	}

	parser() {
		/**
		 * parse the preprocessed data and re-organize it to be suitable for JS manipulation
		 */
		const csr = this.preprocessed.csr;

		// Important informations directly extracted from the preprocessed data
		this.hdSim = csrTo2DArray(csr);
		this.hd = this.preprocessed.hd;
		this.ld = this.preprocessed.ld;
		this.knn = this.preprocessed.knn;
		this.labels = this.preprocessed.labels;

		// more informations with further processing
		this.density = this.hdSim.map((row) => row.reduce((acc, val) => acc + val, 0));
	}


	rendering() {
		/**
		 * Render the initial points
		 */
		pr.render(
			this.pointRenderingStyle,
			this.ctx,
			this.hd,
			this.ld,
			this.canvasSize,
			this.showDensity ? this.density : undefined
		);

	}

	registerPainter() {
		
	}

	

}

export default MultiDBrushing;