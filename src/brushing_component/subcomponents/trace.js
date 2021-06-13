/**
 * Trace view implemented with WebGL
 */

export class Trace {
	constructor (pointLen, dom) {
		// Data	
		this.lineStartPositions = new Array(pointLen).fill([0, 0]);
		this.lineEndPositions = new Array(pointLen).fill([0, 0]);
		this.isDrawing = new Array(pointLen).fill(false);
		this.startTime = new Array(pointLen).fill(0);
		this.augmentTime = new Array(pointLen).fill(0);    // time required for lines to be appear

		// Metadata
		this.dom = dom;
		this.mainTainTime = 1000;
		this.diminishTime = 500;

		let gl = this.dom.getContext("webgl");
		this.regl = require('regl')(gl);
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
}