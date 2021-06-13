/**
 * Trace view implemented with WebGL
 */

import { deepcopyArr } from '../../helpers/utils';

export class Trace {
	constructor (pointLen, dom) {
		// Data	
		this.listLength = pointLen * 2;
		this.linePositions = [];
		this.lineDirections = [];
		for (let i = 0; i < this.listLength; i++) {
			this.linePositions.push([0, 0]);
			this.lineDirections.push([0, 0]);
		}
		this.startTimeList = new Array(this.listLength).fill(0);
		this.augmentTimeList = new Array(this.listLength).fill(0);    // time required for lines to be appear


		// 0 if start, 1 if end
		this.startOrEnd = (new Array(this.listLength).fill(0)).map((_, i) => {
			return i % 2 === 1 ? 1.0 : 0.0;
		}) 

		// Metadata
		this.dom = dom;
		this.maintainTime = 200;
		this.diminishTime = 500;
		this.width = 0.1;
		this.color = [255, 0, 0]

		let gl = this.dom.getContext("webgl");
		this.regl = require('regl')(gl);



		const updateTrace = this.initiailzeComand();

		this.frameLoop = this.regl.frame(({}) => {
			const currentTime = Date.now() % 360000;

			updateTrace({
				positions: this.linePositions,
				startTimeList: this.startTimeList,
				augmentTimeList: this.augmentTimeList,
				directions: this.lineDirections,
				currentTime: currentTime,
			});
		});

	}

	initiailzeComand() {
		return this.regl({
			frag: `
				precision highp float;
				varying vec3 fragColor;
				varying float isDrawing;
			
				void main() {
					if (isDrawing == 1.0) {
						gl_FragColor = vec4(fragColor, 0.5);
					}
					else {
						discard;
					}
				}
			
			`,
			vert: `
				attribute vec2 position;
				attribute vec2 direction;
				attribute float startTime, augmentTime;
				attribute float startOrEnd;  // 0 if start, 1 if end

				varying vec3 fragColor;
				varying float isDrawing;

				uniform float maintainTime;
				uniform float diminishTime;
				uniform float currentTime;
				uniform vec3 color;

				float easeCubicInOut(float t) {
          t *= 2.0;
          t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;
          if (t > 1.0) { t = 1.0; }
          return t;
        }

				void main() {
					fragColor = color / 255.;
					isDrawing = 1.0;

					float timePassed = currentTime - startTime;
					float t;

					if (timePassed < augmentTime) {
						if (startOrEnd == 0.0) {    // start
							gl_Position = vec4(position, 0.0, 1.0);
						}
						else {				// end
							t = easeCubicInOut(1.0 - timePassed / augmentTime);
							gl_Position = vec4(position - direction * t, 0.0, 1.0);
						}

					}
					else if (timePassed < augmentTime + maintainTime) {
						gl_Position = vec4(position, 0.0, 1.0);
					}
					else if (timePassed < augmentTime + maintainTime + diminishTime) {
						if (startOrEnd == 0.0) {
							t = easeCubicInOut((timePassed - (augmentTime + maintainTime)) / diminishTime);
							gl_Position = vec4(position + direction * t, 0.0, 1.0);
						}
						else {
							gl_Position = vec4(position, 0.0, 1.0);
						}
					}
					else {
						isDrawing = 0.0;
						gl_Position = vec4(-2, -2, 0, 0);
					}
				}
			
			`,
			attributes: {
				position:    this.regl.prop("positions"),
				startTime: 	 this.regl.prop("startTimeList"),
				augmentTime: this.regl.prop("augmentTimeList"),
				direction:   this.regl.prop("directions"),
				startOrEnd:  this.startOrEnd
			},
			uniforms: {
				maintainTime: this.maintainTime,
				diminishTime: this.diminishTime,
				currentTime:  this.regl.prop("currentTime"),
				color: 				this.color
			},
			count: this.listLength,
			primitive: 'lines',
			lineWidth: 1
		});
	}

	updateLineData(emb, newEmb, pointsFromOutside, augmentTime, startTime) {
		// console.log(this.linePositions)
		startTime = startTime % 360000;
		pointsFromOutside.forEach(idx => {
			this.linePositions[idx * 2][0] = emb[idx][0];
			this.linePositions[idx * 2][1] = emb[idx][1];
			this.linePositions[idx * 2 + 1][0]   = newEmb[idx][0];
			this.linePositions[idx * 2 + 1][1]   = newEmb[idx][1];
			
			this.lineDirections[idx * 2][0] = newEmb[idx][0] - emb[idx][0];
			this.lineDirections[idx * 2][1] = newEmb[idx][1] - emb[idx][1]; 
			this.lineDirections[idx * 2 + 1][0] = newEmb[idx][0] - emb[idx][0];
			this.lineDirections[idx * 2 + 1][1] = newEmb[idx][1] - emb[idx][1]; 
			
			this.startTimeList[idx * 2] = startTime;
			this.startTimeList[idx * 2 + 1] = startTime;
			this.augmentTimeList[idx * 2] = augmentTime;
			this.augmentTimeList[idx * 2 + 1] = augmentTime;

		});
		console.log(this.augmentTimeList);
		console.log(startTime);
	}
}