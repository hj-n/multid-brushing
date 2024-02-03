import { csrTo2DArray } from "./utils/csrParser";
import * as pr from "./utils/pointRenderer";

class MultiDBrushing {
	
	constructor(
		preprocessed, 
		canvasDom, 
		canvasSize, 
		pointRenderingStyle,
		techniqueStyle,
		showDensity = true, // flag determining whether to show the HD density of the points,
		frameRate = 20 // in ms
	) {


		this.preprocessed = preprocessed;
		this.canvasDom = canvasDom;
		this.canvasSize = canvasSize;
		this.canvasPixelSize = parseInt(this.canvasDom.style.width.slice(0, -2));
		this.scalingFactor = this.canvasSize / this.canvasPixelSize;

		// rendering and functionality options
		this.pointRenderingStyle = pointRenderingStyle;
		this.techniqueStyle = techniqueStyle;
		this.showDensity = showDensity;
		this.frameRate = frameRate;
		this.timer = true;


		// extract options
		this.painterRadius = this.techniqueStyle.initialPainterRadius;

		// set context of the canvas
		this.ctx = canvasDom.getContext("2d");


		// initialize
		this.parser();
		this.clearRendering();
		this.scatterplotRendering();
		if (this.techniqueStyle.technique == "dab" || this.techniqueStyle.technique == "sb") this.registerPainter();
	}

	parser() {
		/**
		 * parse the preprocessed data and re-organize it to be suitable for JS manipulation
		 */
		const csr = this.preprocessed.csr;

		// Important informations directly extracted from the preprocessed data
		this.hdSim = csrTo2DArray(csr);
		this.hd = this.preprocessed.hd;
		this.ld = pr.scalePoints(this.preprocessed.ld, this.canvasSize);
		this.knn = this.preprocessed.knn;
		this.labels = this.preprocessed.labels;

		// more informations with further processing
		this.density = this.hdSim.map((row) => row.reduce((acc, val) => acc + val, 0));
	}



	scatterplotRendering() {
		pr.scatterplotRenderer(
			this.pointRenderingStyle,
			this.ctx,
			this.hd,
			this.ld,
			this.canvasSize,
			this.showDensity ? this.density : undefined,
		);
	}

	painterRendering(radius, xPos, yPos) {
		pr.painterRenderer(this.ctx, radius, xPos, yPos);
	}

	clearRendering() {
		this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
	}

	updater(e) {
		/**
		* Update and rerender the entire system
		*/
		if (this.techniqueStyle.technique == "dab" || this.techniqueStyle.technique == "sb") {
			if (this.timer) {
				this.timer = false;
				this.clearRendering();
				this.scatterplotRendering();
				this.painterRendering(this.painterRadius, e.offsetX * this.scalingFactor, e.offsetY * this.scalingFactor);
				setTimeout(() => {
					this.timer = true;
				}, this.frameRate);
			}
		}
	}


	registerPainter() {



		const update = (e) => {
			console.log("UPDATE")
			this.clearRendering();
			this.scatterplotRendering();
			this.painterRendering(this.painterRadius, e.offsetX * scalingFactor, e.offsetY * scalingFactor);
		}

		this.canvasDom.addEventListener("mousemove", this.updater.bind(this));
	}

	

}

export default MultiDBrushing;