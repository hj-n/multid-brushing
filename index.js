import { csrTo2DArray } from "./utils/csrParser";
import * as pr from "./utils/pointRenderer";
import * as dabL from "./utils/dabLogic";
import * as d3 from 'd3';

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




		// set context of the canvas
		this.ctx = canvasDom.getContext("2d");

		// interactively updated hyperparameters
		this.painterRadius = this.techniqueStyle.initialPainterRadius;
		this.zeta = undefined;
		this.currentBrushIdx = 0;


		// initialize
		this.parser();
		this.initializeRenderingInfo();
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

	getCurrentBrushColor() {
		// currently use tab10 color scheme
		const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
		return colorScale(this.currentBrushIdx);
	}

	initializeRenderingInfo() {
		this.sizeArr = Array(this.hd.length).fill(this.pointRenderingStyle.size);
		this.colorArr = Array(this.hd.length).fill("black");
		this.borderArr = Array(this.hd.length).fill(0);
		this.zIndexArr = Array(this.hd.length).fill(0);

		if (this.showDensity) { 
			const opacityScale = d3.scaleLinear().domain([0, d3.max(this.density)]).range([0, 1]);
			this.opacityArr = this.density.map(d => opacityScale(d));
		}
		else if (!this.pointRenderingStyle.opacity) { this.opacityArr = Array(this.hd.length).fill(1); }
		else { this.opacityArr = Array(this.hd.length).fill(this.pointRenderingStyle.opacity); }
	}

	constructRenderingInfo() {
		/**
		* construct the scatterplot rendering info
		*/

		// basic info
		this.initializeRenderingInfo();

		// update the rendering info based on the interaction
		if (this.techniqueStyle.technique == "dab" || this.techniqueStyle.technique == "sb") {
			// find the initial seed point
			this.initialSeedPoint = dabL.findInitialSeedPoint(
				this.ld, this.xPos, this.yPos, this.painterRadius, this.density
			);

			this.borderArr[this.initialSeedPoint] = true;
			this.sizeArr[this.initialSeedPoint] = this.sizeArr[this.initialSeedPoint] * 2.5;
			this.colorArr[this.initialSeedPoint] = this.getCurrentBrushColor();
			this.zIndexArr[this.initialSeedPoint] = 1;

		}
	}

	scatterplotRendering() {
		pr.scatterplotRenderer(
			this.pointRenderingStyle.style,
			this.sizeArr,
			this.colorArr,
			this.opacityArr,
			this.borderArr,
			this.zIndexArr,
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

		this.xPos = e.offsetX * this.scalingFactor;
		this.yPos = e.offsetY * this.scalingFactor;

		if (this.techniqueStyle.technique == "dab" || this.techniqueStyle.technique == "sb") {
			if (this.timer) {
				this.timer = false;
				// rendering impo
				this.clearRendering();
				this.constructRenderingInfo();	
				this.scatterplotRendering();
				this.painterRendering(this.painterRadius, this.xPos, this.yPos);


				setTimeout(() => {
					this.timer = true;
				}, this.frameRate);
			}
		}
	}


	registerPainter() {
		this.canvasDom.addEventListener("mousemove", this.updater.bind(this)); // moving the painter
		this.canvasDom.addEventListener("wheel", (e) => { // wheeling to change the painter radius
			this.painterRadius += e.deltaY * 0.017;
			this.updater(e);
		});

	}

	

}

export default MultiDBrushing;