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
		statusUpdateCallback,
		pointRenderingStyle,
		showGlobalDensity = true, // flag determining whether to show the HD density of the points,
		showLocalCloseness = true, // flag determining whether to show local closeness in the inspection mode
		technique = "dab", // brushing technique
		techniqueStyle = {
			"painterColor": "green",
			"erasingPainterColor": "red",
			"initialPainterRadius": 35,
			"initialRelocationThreshold": 600, // in ms
			"initialRelocationDuration": 700, // in ms
			"relocationInterval": 1000, // in ms
			"relocationUpdateDuration": 350, // ms
			"showLens": true,
			"lensStyle": {
				"color": "red",
				"strokeWidth": 3
			}
		},
		maxBrushNum = 10, // maximum number of brushes
		frameRate = 20, // in ms,
		maxOpacity = 1,  // maximum opacity
		minOpacity = 0.1 // minimum opacity
	) {



		this.preprocessed = preprocessed;
		this.canvasDom = canvasDom;
		this.canvasSize = canvasSize;
		this.canvasPixelSize = parseInt(this.canvasDom.style.width.slice(0, -2));
		if (this.canvasPixelSize === NaN) this.canvasPixelSize = this.canvasDom.style.width
		this.scalingFactor = this.canvasSize / this.canvasPixelSize;

		// callback
		this.statusUpdateCallback = statusUpdateCallback;

		// rendering and functionality options
		this.pointRenderingStyle = pointRenderingStyle;
		this.technique = technique;
		this.techniqueStyle = techniqueStyle;
		this.maxBrushNum = maxBrushNum;
		this.showGlobalDensity = showGlobalDensity;
		this.showLocalCloseness = showLocalCloseness;
		this.frameRate = frameRate;
		this.timer = true;
		this.maxOpacity = maxOpacity;
		this.minOpacity = minOpacity;

		this.colorScale = d3.scaleOrdinal().domain(d3.range(10)).range(d3.schemeCategory10);


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
		this.triggerRest = false;
		this.isPainterRendering = true;
		this.isErasing = false; // flag to determine whether the erasing mode is on (only for rest mode)
		this.readyErasing = false;

		// brushing status
		this.brushingStatus = { 0: new Set() };


		// initialize
		this.parser();
		this.initializeRenderingInfo();
		this.clearRendering();
		this.scatterplotRendering();
		if (this.technique == "dab" || this.technique == "sb") this.registerPainter();
	}

	parser() {
		/**
		 * parse the preprocessed data and re-organize it to be suitable for JS manipulation
		 */
		const csr = this.preprocessed.csr;


		// Important informations directly extracted from the preprocessed data
		this.hdSim = csrTo2DArray(csr);
		this.hd = this.preprocessed.hd;
		this.ld = [...this.preprocessed.ld];
		if (this.pointRenderingStyle["x_inverse"]) {
			this.ld = this.ld.map(d => [-d[1], d[0]]);
		}
		if (this.pointRenderingStyle["y_inverse"]) {
			this.ld = this.ld.map(d => [d[0], -d[1]]);
		}
		this.ld = pr.scalePoints(this.ld, this.canvasSize, this.pointRenderingStyle);
		this.originalLd = [...this.ld];
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
		return this.colorScale(this.currentBrushIdx);
	}

	initializeRenderingInfo() {
		this.sizeArr = Array(this.hd.length).fill(this.pointRenderingStyle.size);
		this.colorArr = Array(this.hd.length).fill("black");
		this.borderArr = Array(this.hd.length).fill(0);
		this.zIndexArr = Array(this.hd.length).fill(0);
		if (this.showGlobalDensity) { 
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
		if (this.technique == "dab") {
			// find the initial seed point
			if (this.mode === "inspect") {

				this.seedPoints = [];
				Object.keys(this.brushingStatus).forEach((brushIdx) => {
					this.brushingStatus[brushIdx].forEach((i) => {
						this.colorArr[i] = this.getBrushingColor(brushIdx);
						this.zIndexArr[i] = 1;
					});
				});

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
					if (this.showLocalCloseness) {
						this.closenessArr.forEach((d, i) => { this.opacityArr[i] = d3.scaleLinear().domain([0, 1]).range([this.minOpacity, this.maxOpacity])(d);});
					}
					else if (this.showGlobalDensity) {
						this.opacityArr = this.density.map(d => d3.scaleLinear().domain([0, d3.max(this.density)]).range([this.minOpacity, this.maxOpacity])(d));
					}
					else {
						this.opacityArr = Array(this.hd.length).fill(1);
					}
					this.seedPoints.forEach((i) => {
						// this.borderArr[i] = true;
						this.sizeArr[i] = this.sizeArr[i] * 1.3;
						this.colorArr[i] = this.getCurrentBrushColor();
						this.zIndexArr[i] = 2;
						this.opacityArr[i] = 1;
					});
				}

			}
			else if (this.mode === "brush" || this.mode === "rest" || this.mode === "reconstruct") {
				Object.keys(this.brushingStatus).forEach((brushIdx) => {
					this.brushingStatus[brushIdx].forEach((i) => {
						if (brushIdx == this.currentBrushIdx) {
							this.sizeArr[i] = this.sizeArr[i] * 1.3;
							this.borderArr[i] = true;
							this.zIndexArr[i] = 1;
						}
						this.colorArr[i] = this.getBrushingColor(brushIdx);
						this.zIndexArr[i] = 0.5;
					});

					// convert the set to array

					if (brushIdx == this.currentBrushIdx) {
						this.zeta = this.brushingStatus[brushIdx].size;
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
			this.mode === "inspect" || this.mode === "reconstruct"
		);
	}

	painterRendering(radius, xPos, yPos) {
		pr.painterRenderer(
			this.ctx, radius, xPos, yPos, 
			this.readyErasing ? this.techniqueStyle.erasingPainterColor : this.techniqueStyle.painterColor
		);
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


		if (this.technique == "dab" || this.technique == "sb") {

			this.isInitialRelocationTriggered = false;
			if (this.timer) {
				this.timer = false;
				// rendering impo
				this.clearRendering();
				this.constructRenderingInfo();	
				this.scatterplotRendering();
				if (this.isPainterRendering)
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

	initiateRelocationDuringBrushing(perform = true) {
		if (perform) {
			const newLd = dabL.findRelocationPositionsHull(
				this.brushingStatus[this.currentBrushIdx], this.lensHull, this.currLd,
				this.closenessArr, this.painterRadius, this.canvasSize
			);
			this.nextLd = [...newLd];
		}
		else {
			this.nextLd = [...this.currLd];
		}
		
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

		this.beforeBrushPointNum = -1;

		// console.log(beforeBrushPointNum, afterBrushPointNum);
		pr.initiateBrushingAnimation(
			this.ctx, this.canvasSize, this.techniqueStyle.relocationInterval, this.techniqueStyle.relocationUpdateDuration,
			() => {
				this.updateLensWhileBrushing();
				
				this.afterBrushPointNum = [...this.brushingStatus[this.currentBrushIdx]].length;
				if (this.beforeBrushPointNum !== this.afterBrushPointNum)
					this.initiateRelocationDuringBrushing(true);
				else 
					this.initiateRelocationDuringBrushing(false);
				
				this.beforeBrushPointNum = this.afterBrushPointNum;
			},
			(progress, relocationProgress) => {
				this.constructRenderingInfo();

				if (relocationProgress > 1 && this.triggerRest) {
					this.triggerRest = false;
					if ([...this.brushingStatus[this.currentBrushIdx]].length > 0) this.mode = "rest";
					else this.mode = "inspect";
					this.updater();
				}

				if (relocationProgress < 1 && progress > 1) {
					this.performRelocationDuringBrushing(relocationProgress);
				}
				pr.scatterplotRenderer(
					this.pointRenderingStyle, this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
					this.ctx, this.hd, this.currLd, this.canvasSize,
					this.mode === "inspect" || this.mode === "reconstruct"
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

	eraseBruhsing() {
		const erasedPoints = dabL.findPointsWithinPainter(
			this.currLd, this.xPos, this.yPos, this.painterRadius
		);
		erasedPoints.forEach(d => this.brushingStatus[this.currentBrushIdx].delete(d));
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

	mousemoveEventHandler(e) {
		this.xPos = e.offsetX * this.scalingFactor;
		this.yPos = e.offsetY * this.scalingFactor;


		// check whether the shift key is pressed
		if (e.shiftKey) { this.readyErasing = true; }
		else { this.readyErasing = false; this.isErasing = false;}


		if (this.isRelocating) {
			return;
		}
		if (this.mode === "inspect") {
			this.updater(e);
			this.registerInitialRelocation();
			this.statusUpdateCallback(this.getEntireBrushingStatus(), {
				"points": this.seedPoints ? this.seedPoints : [], 
				"color": this.getBrushingColor(this.currentBrushIdx)});
		}
		if (this.mode === "initiate") {
			this.cancelInitialRelocation();
		}
		if (this.mode === "brush") {
			this.proceedBrushing();
			this.statusUpdateCallback(this.getEntireBrushingStatus());
			this.updater(e);
		}
		if (this.mode === "rest") {
			if (this.isErasing) {
				this.eraseBruhsing();
				this.updater(e);
			}
			else {
				this.updater(e);
			}
		}
	}

	mousedownEventHandler(e) {
		this.xPos = e.offsetX * this.scalingFactor;
		this.yPos = e.offsetY * this.scalingFactor;

		if (this.isRelocating) {
			return;
		}

		if (this.mode === "initiate") {
			this.startBrushing();
			this.statusUpdateCallback(this.getEntireBrushingStatus());
			this.updater(e);
		}
		else if (this.mode === "rest") {
			if (this.readyErasing) {
				this.isErasing = true;
				return;
			}
			this.mode = "brush";
			this.startBrushing(true);
			this.updater(e);
			
		}
	}

	mouseupEventHandler(e) {
		if (this.mode === "brush") {
			this.triggerRest = true;

		}
		if (this.mode === "rest") {
			this.isErasing = false;
		}
	}

	mousewheelEventHandler(e) {
		this.painterRadius += e.deltaY * 0.017;
		this.updater(e);
	}


	registerPainter() {
		this.mousemoveHigherOrderFunction = () => (e) => { this.mousemoveEventHandler(e) };
		this.mousedownHigherOrderFunction = () => (e) => { this.mousedownEventHandler(e) };
		this.mouseupHigherOrderFunction = () => (e) => { this.mouseupEventHandler(e) };
		this.mousewheelHigherOrderFunction = () => (e) => { this.mousewheelEventHandler(e) };
		this.mousemoveFunction = this.mousemoveHigherOrderFunction();
		this.mousedownFunction = this.mousedownHigherOrderFunction();
		this.mouseupFunction = this.mouseupHigherOrderFunction();
		this.mousewheelFunction = this.mousewheelHigherOrderFunction();



		this.canvasDom.addEventListener("mousemove", this.mousemoveFunction); // moving the painter
		this.canvasDom.addEventListener("mousedown", this.mousedownFunction); // start brushing
		this.canvasDom.addEventListener("mouseup", this.mouseupFunction); // end brushing
		this.canvasDom.addEventListener("wheel", this.mousewheelFunction); // change the radius of the painter
	}

	unMount() {
		this.canvasDom.removeEventListener("mousemove", this.mousemoveFunction);
		this.canvasDom.removeEventListener("mousedown", this.mousedownFunction);
		this.canvasDom.removeEventListener("mouseout", this.mouseoutFunction);
		this.canvasDom.removeEventListener("mouseup", this.mouseupFunction);
		this.canvasDom.removeEventListener("wheel", this.mousewheelFunction);
	}


	// functions related to the update of the brushing status
	addNewBrush() {
		const maxBrushIdx = Math.max(...Object.keys(this.brushingStatus).map(d => parseInt(d)));
		if (maxBrushIdx >= this.maxBrushNum) return;
		this.currentBrushIdx = maxBrushIdx + 1;
		this.brushingStatus[this.currentBrushIdx] = new Set();

		this.reconstructInitialScatterplot();

	}

	changeBrush(brushIdx) {
		this.currentBrushIdx = brushIdx;
	}

	removeBrush(brushIdx) {
		delete this.brushingStatus[brushIdx];
	}

	getEntireBrushingStatus() {
		const entireBrushingStatus = [];
		Object.keys(this.brushingStatus).forEach((brushIdx) => {
			entireBrushingStatus.push({
				"idx": brushIdx,
				"points": [...this.brushingStatus[brushIdx]],
				"color": this.getBrushingColor(brushIdx),
				"isCurrent": brushIdx == this.currentBrushIdx
			});
		});
		return entireBrushingStatus;
	}

	getBrushingStatus() {
		return this.brushingStatus;
	}

	getCurrentBrushIdx() {
		return this.currentBrushIdx;
	}

	getBrushingColor(brushIdx) {
		
		return this.colorScale(brushIdx);
	}

	reconstructInitialScatterplot() {
		// update the position and opacity of the points 
		this.constructRenderingInfo();
		this.isRelocating = true;
		this.borderArr = Array(this.hd.length).fill(false);
		this.opacityArr = this.density.map(d => d3.scaleLinear().domain([0, d3.max(this.density)]).range([this.minOpacity, this.maxOpacity])(d));
		pr.startScatterplotRenderAnimation(
			this.pointRenderingStyle.style,
			this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
			this.ctx, this.canvasSize, this.hd, this.mode === "reconstruct" ? this.originalLd : this.currLd, this.originalLd, this.techniqueStyle.initialRelocationDuration, this.pointRenderingStyle,
			() => {
				this.isRelocating = false;
				this.prevLd = [...this.originalLd];
				this.currLd = [...this.originalLd];
				this.nextLd = [...this.originalLd];
				this.mode = "inspect";
			},
			(progress) => {
				this.painterRendering(this.painterRadius, this.xPos, this.yPos);
			}
		);
	}

	temporalReconstructInitialScatterplot() {
		this.isRelocating = true;

		this.opacityArr = this.density.map(d => d3.scaleLinear().domain([0, d3.max(this.density)]).range([this.minOpacity, this.maxOpacity])(d));
		pr.startScatterplotRenderAnimation(
			this.pointRenderingStyle.style,
			this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
			this.ctx, this.canvasSize, this.hd, this.currLd, this.originalLd, this.techniqueStyle.initialRelocationDuration, this.pointRenderingStyle,
			() => {
				this.mode = "reconstruct";
			},
			(progress) => { }
		);
	}

	cancelTemporalReconstruction() {
		this.constructRenderingInfo();
		pr.startScatterplotRenderAnimation(
			this.pointRenderingStyle.style,
			this.sizeArr, this.colorArr, this.opacityArr, this.borderArr, this.zIndexArr,
			this.ctx, this.canvasSize, this.hd, this.originalLd, this.currLd, this.techniqueStyle.initialRelocationDuration, this.pointRenderingStyle,
			() => {
				this.isRelocating = false;
				this.prevLd = [...this.currLd];
				this.mode = "rest";
			},
			(progress) => { }
		);
	}



}

export default MultiDBrushing;