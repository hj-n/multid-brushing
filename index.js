import { csrTo2DArray } from "./utils/csrParser";
import * as pr from "./utils/pointRenderer";
import * as lr from "./utils/lensRenderer";
import * as dabL from "./utils/dabLogic";
import * as d3 from 'd3';

class MultiDBrushing {
	
	constructor(
		preprocessed, 
		canvasDom, 
		canvasSize, 
		pointRenderingStyle,
		techniqueStyle = {
			"technique": "dab",
			"painterColor": "green",
			"initialPainterRadius": 70,
			"initialRelocationThreshold": 600, // in ms
			"initialRelocationDuration": 700, // in ms
			"relocationInterval": 1000, // in ms
			"relocationUpdateDuration": 350, // ms
			"showLens": true,
			"lensStyle": {
				"color": "red",
				"strokeWidth": 5
			}
		},
		showDensity = true, // flag determining whether to show the HD density of the points,
		frameRate = 20, // in ms,
		maxOpacity = 1,  // maximum opacity
		minOpacity = 0.1 // minimum opacity
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
		this.maxOpacity = maxOpacity;
		this.minOpacity = minOpacity;


		// set context of the canvas
		this.ctx = canvasDom.getContext("2d");


		// interactively updated hyperparameters for painter
		this.painterRadius = this.techniqueStyle.initialPainterRadius;
		this.zeta = undefined;
		this.currentBrushIdx = 0;

		// interactively updated hyperparameter while brushing
		this.lensHull = undefined;
		this.prevLensHull = undefined;


		// import flags to maintain distortion-aware brushing
		this.mode = "inspect";
		this.isInitialRelocationTriggered = false;
		this.triggeredRelocation = null;
		this.isRelocating = false;

		// brushing status
		this.brushingStatus = {};


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
		this.currLd = [...this.ld]; // current position of the points
		this.prevLd = [...this.ld]; // previous position of the points
		this.nextLd = [...this.ld]; // next position of the points
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
			const opacityScale = d3.scaleLinear().domain([0, d3.max(this.density)]).range([this.minOpacity, this.maxOpacity]);
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
		if (this.techniqueStyle.technique == "dab") {
			// find the initial seed point

			if (this.mode === "inspect") {
				this.initialSeedPoint = dabL.findInitialSeedPoint(
					this.currLd, this.xPos, this.yPos, this.painterRadius, this.density
				);
				if (this.initialSeedPoint !== -1) {
					this.seedPoints = dabL.findSeedPoints(
						this.currLd, this.knn, this.xPos, this.yPos, this.painterRadius, this.density, this.initialSeedPoint
					);

					this.seedPoints.push(this.initialSeedPoint);
					this.zeta = this.seedPoints.length;

					this.closenessArr = dabL.closeness(
						this.seedPoints, this.zeta, this.hdSim, this.knn
					);
					this.seedPoints.forEach((i) => {
						// this.borderArr[i] = true;
						this.sizeArr[i] = this.sizeArr[i] * 1.3;
						this.colorArr[i] = this.getCurrentBrushColor();
						this.zIndexArr[i] = 1;
					});
					this.closenessArr.forEach((d, i) => { this.opacityArr[i] = d3.scaleLinear().domain([0, 1]).range([this.minOpacity, this.maxOpacity])(d);});
				}

			}
			else if (this.mode === "brush" || this.mode === "rest") {
				Object.keys(this.brushingStatus).forEach((brushIdx) => {
					this.brushingStatus[brushIdx].forEach((i) => {
						this.sizeArr[i] = this.sizeArr[i] * 1.3;
						this.colorArr[i] = this.getCurrentBrushColor();
						this.borderArr[i] = true;
						this.zIndexArr[i] = 1;
					});

					// convert the set to array

					if (brushIdx == this.currentBrushIdx) {
						this.closenessArr = dabL.closeness(
							Array.from(this.brushingStatus[brushIdx]), this.zeta, this.hdSim, this.knn
						);
						this.closenessArr.forEach((d, i) => { this.opacityArr[i] = d3.scaleLinear().domain([0, 1]).range([this.minOpacity, this.maxOpacity])(d); });
					}
				});
			}
			
			
		}
	}

	scatterplotRendering() {
		pr.scatterplotRenderer(
			this.pointRenderingStyle,
			this.sizeArr,
			this.colorArr,
			this.opacityArr,
			this.borderArr,
			this.zIndexArr,
			this.ctx,
			this.hd,
			this.currLd,
			this.canvasSize,
			this.showDensity ? this.density : undefined,
		);
	}

	painterRendering(radius, xPos, yPos) {
		pr.painterRenderer(this.ctx, radius, xPos, yPos);
	}

	lensRendering(lensType, radius, xPos, yPos, opacity) {
		if (lensType === "circle") {
			lr.circleLensRenderer(this.ctx, radius, xPos, yPos, opacity, this.techniqueStyle.lensStyle);
		}
	}

	clearRendering() {
		pr.clearRender(this.ctx, this.canvasSize);
	}

	updater(e) {
		/**
		* Update and rerender the entire system during inspection
		*/

		if (this.techniqueStyle.technique == "dab" || this.techniqueStyle.technique == "sb") {

			this.isInitialRelocationTriggered = false;
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

	registerInitialRelocation() {
		const isHoveringPoints = dabL.findInitialSeedPoint(
			this.currLd, this.xPos, this.yPos, this.painterRadius, this.density
		) !== -1;

		if (isHoveringPoints) {

			if (this.triggeredRelocation) clearTimeout(this.triggeredRelocation);
			this.isInitialRelocationTriggered = true;
			this.triggeredRelocation = setTimeout(() => {

				if (!this.isInitialRelocationTriggered) return;
				const newLd = dabL.findInitialRelocationPositions(
					[...this.seedPoints],
					this.xPos, this.yPos, this.painterRadius,
					this.currLd, [...this.closenessArr]
				)
				
				this.isRelocating = true;
				pr.startScatterplotRenderAnimation(
					this.pointRenderingStyle.style,
					this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
					this.ctx, this.canvasSize, this.hd,
					this.currLd, newLd, this.techniqueStyle.initialRelocationDuration, this.pointRenderingStyle,
					() => {
						this.prevLd = [...this.currLd];
						this.currLd = [...newLd];
						this.mode = "initiate";
						this.isRelocating = false;
					},
					(progress) => { 
						this.painterRendering(this.painterRadius, this.xPos, this.yPos);
						this.lensRendering("circle", this.painterRadius, this.xPos, this.yPos, progress);
					 }
				);
			}, this.techniqueStyle.initialRelocationThreshold);
		}
	}

	cancelInitialRelocation() {
		this.isRelocating = true;
		this.initializeRenderingInfo();
		pr.startScatterplotRenderAnimation(
			this.pointRenderingStyle.style,
			this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
			this.ctx, this.canvasSize, this.hd, 
			this.currLd, this.prevLd, this.techniqueStyle.initialRelocationDuration,
			this.pointRenderingStyle,
			() => {
				this.mode = "inspect";
				this.currLd = [...this.prevLd];
				this.isRelocating = false;
			},
			() => {
				this.painterRendering(this.painterRadius, this.xPos, this.yPos);
			}
		)
	}

	initiateRelocationDuringBrushing() {
		const newLd = dabL.findRelocationPositionsHull(
			this.brushingStatus[this.currentBrushIdx], this.lensHull, this.currLd, 
			this.closenessArr, this.painterRadius, this.canvasSize
		);
		this.nextLd = [...newLd];
	}

	performRelocationDuringBrushing(relocationProgress) {
		this.isRelocating = true;
		const intermediateLd = this.currLd.map((pos, i) => {
			const posX = pos[0] + (this.nextLd[i][0] - pos[0]) * relocationProgress;
			const posY = pos[1] + (this.nextLd[i][1] - pos[1]) * relocationProgress;
			return [posX, posY];
		});

		this.currLd = [...intermediateLd];
	}

	startBrushing(isResume = false) {
		this.mode = "brush";
	  const startBrushingXPos = this.xPos;
		const startBrushingYPos = this.yPos;
		const newBrushedPoints = dabL.findPointsWithinPainter(
			this.currLd, this.xPos, this.yPos, this.painterRadius
		);


		if (this.brushingStatus[this.currentBrushIdx] === undefined) {
			this.brushingStatus[this.currentBrushIdx] = new Set(newBrushedPoints);
		}
		else {
			newBrushedPoints.forEach(d => this.brushingStatus[this.currentBrushIdx].add(d));
		}
		pr.initiateBrushingAnimation(
			this.ctx, this.canvasSize, this.techniqueStyle.relocationInterval, this.techniqueStyle.relocationUpdateDuration,
			() => {
				this.updateLensWhileBrushing();
				this.initiateRelocationDuringBrushing();
			},
			(progress, relocationProgress) => {
				this.constructRenderingInfo();

				if (relocationProgress < 1 && progress > 1) {
					this.performRelocationDuringBrushing(relocationProgress);
				}
				pr.scatterplotRenderer(
					this.pointRenderingStyle, this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
					this.ctx, this.hd, this.currLd, this.canvasSize
				);
				if (progress < 1) {
					if (!isResume) this.lensRendering("circle", this.painterRadius, startBrushingXPos, startBrushingYPos, 1);
					else lr.convexHullLensRenderer(this.ctx, this.lensHull, progress, this.techniqueStyle.lensStyle, this.painterRadius * 2);
				}
				else if (progress < 2) {
					if (relocationProgress < 1) {
						if (!isResume) this.lensRendering("circle", this.painterRadius, startBrushingXPos, startBrushingYPos, 1 - relocationProgress);
						else lr.convexHullLensRenderer(this.ctx, this.prevLensHull, 1 - relocationProgress, this.techniqueStyle.lensStyle, this.painterRadius * 2);	
						lr.convexHullLensRenderer(this.ctx, this.lensHull, relocationProgress, this.techniqueStyle.lensStyle, this.painterRadius * 2);
					}
					else {
						this.isRelocating = false;
						lr.convexHullLensRenderer(this.ctx, this.lensHull, 1, this.techniqueStyle.lensStyle, this.painterRadius * 2);
					}
				}
				else {
					if (relocationProgress < 1) {
						lr.convexHullLensRenderer(this.ctx, this.lensHull, relocationProgress, this.techniqueStyle.lensStyle, this.painterRadius * 2);
						lr.convexHullLensRenderer(this.ctx, this.prevLensHull, 1 - relocationProgress, this.techniqueStyle.lensStyle, this.painterRadius * 2);
					}
					else {
						this.isRelocating = false;
						lr.convexHullLensRenderer(this.ctx, this.lensHull, 1, this.techniqueStyle.lensStyle, this.painterRadius * 2);
					}
				}
				this.painterRendering(this.painterRadius, this.xPos, this.yPos);
			},
			() => { return this.mode !== "brush"; }
		);

	}

	proceedBrushing() {
		const newBrushedPoints = dabL.findPointsWithinPainter(
			this.currLd, this.xPos, this.yPos, this.painterRadius
		);
		newBrushedPoints.forEach(d => this.brushingStatus[this.currentBrushIdx].add(d));

	}

	updateLensWhileBrushing() {
		const brushedPointsPos = Array.from(this.brushingStatus[this.currentBrushIdx]).map(d => this.currLd[d]);
		const newHull = lr.convexHull(brushedPointsPos);
		if (this.prevLensHull === undefined) {
			this.prevLensHull = newHull;
		}
		else {
			this.prevLensHull = JSON.parse(JSON.stringify(this.lensHull));
		}
		this.lensHull = newHull;
	}


	registerPainter() {
		this.canvasDom.addEventListener("mousemove", (e) => {
			this.xPos = e.offsetX * this.scalingFactor;
			this.yPos = e.offsetY * this.scalingFactor;

			
			if (this.isRelocating) { 
				return; 
			}
			if (this.mode === "inspect") {
				this.updater(e);
				this.registerInitialRelocation();
			}
			if (this.mode === "initiate") {
				this.cancelInitialRelocation();
			}
			if (this.mode === "brush") {
				this.proceedBrushing();
				this.updater(e);
			}
			if (this.mode === "rest") {
				this.updater(e);
			}
		}); // moving the painter
		this.canvasDom.addEventListener("mousedown", (e) => {
			this.xPos = e.offsetX * this.scalingFactor;
			this.yPos = e.offsetY * this.scalingFactor;

			if (this.mode === "initiate") {
				this.startBrushing();
				this.updater(e);
			}
			else if (this.mode === "rest") {
				this.mode = "brush";
				this.startBrushing(true);
				this.updater(e);
			}
		});
		this.canvasDom.addEventListener("mouseup", (e) => {
			if (this.mode === "brush") {
				if ([...this.brushingStatus[this.currentBrushIdx]].length > 0) this.mode = "rest";
				else this.mode = "inspect";
				this.updater(e);

			}
		});
		this.canvasDom.addEventListener("wheel", (e) => { // wheeling to change the painter radius
			this.painterRadius += e.deltaY * 0.017;
			this.updater(e);
		});
	}

	

}

export default MultiDBrushing;