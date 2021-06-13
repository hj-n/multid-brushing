/**
 * Trace view implemented with WebGL
 */

export class Trace {
	constructor (pointLen, dom) {
		// Data	
		this.lineStartPositions = new Array(pointLen).fill([0, 0]);
		this.lineEndPositions = new Array(pointLen).fill([0, 0]);
		// this.isDrawing = new Array(pointLen).fill(false);
		this.startTimeList = new Array(pointLen).fill(0);
		this.augmentTimeList = new Array(pointLen).fill(0);    // time required for lines to be appear

		// Metadata
		this.dom = dom;
		this.mainTainTime = 1000;
		this.diminishTime = 500;

		let gl = this.dom.getContext("webgl");
		this.regl = require('regl')(gl);

		this.frameLoop = this.regl.frame(({}) => {
			// console.log(time, Date.now());
			const currentTime = Date.now();
		});

	}

	initiailzeComand() {
		// return this.regl({
		// 	frag: `
			
		// 	`,
		// 	vert: `
			
		// 	`,
		// 	attributes: {

		// 	},
		// 	uniforms: {

		// 	},
		// 	count: ,
		// 	primitive: 'line'
		// });
	}

	updateLineData(emb, newEmb, pointsFromOutside, augmentTime, startTime) {
		pointsFromOutside.forEach(idx => {
			this.lineStartPositions[idx][0] = emb[idx][0];
			this.lineStartPoistions[idx][1] = emb[idx][1];
			this.lineEndPositions[idx][0]   = newEmb[idx][0];
			this.lineEndPoistions[idx][1]   = newEmb[idx][1];
			this.startTimeList[idx] = startTime;
			this.augmentTimeList[idx] = augmentTime;
		})

	}
}