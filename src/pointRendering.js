import * as d3 from "d3";
import * as Three from "three";

export function render2DMonochromeImage(hdDatum, xPos, yPos) {
	// hd_datum is a 1D array of length n * n holding monochrome image
	// ctx is the canvas context
	// render hdDatum in (xPos, yPos) in ctx
	// render using Three.js
	// generate 8-bit array
	const n = Math.round(Math.sqrt(hdDatum.length));
	const meshDatum = new Uint8Array(hdDatum.length * 4);
	for (let i = 0; i < hdDatum.length; i++) {
		const opIdx = hdDatum.length - i - 1;
		meshDatum[4 * i] = 255 - hdDatum[opIdx] * 255;
		meshDatum[4 * i + 1] = 255 - hdDatum[opIdx] * 255;
		meshDatum[4 * i + 2] = 255 - hdDatum[opIdx] * 255;
		if (hdDatum[opIdx] < 0.01) {
			meshDatum[4 * i + 3] = 0;
		}
		else {
			meshDatum[4 * i + 3] = 255;
		}
		// meshDatum[4 * i + 3] = 255;
	}
	
	// meshDatum
	const texture = new Three.DataTexture(meshDatum, n, n, Three.RGBAFormat);
	texture.needsUpdate = true;
	// console.log(texture)
	const geometry = new Three.PlaneGeometry(n, n);
	const material = new Three.MeshBasicMaterial({map: texture});
	material.transparent = true;
	const mesh = new Three.Mesh(geometry, material);
	mesh.position.set(xPos, yPos, 0);
	// mesh.scale.set(1, 1, 1);
	return mesh;

	// const n = Math.round(Math.sqrt(hdDatum.length));


	// const imageData = ctx.createImageData(n, n);
	// // scale hdDatum to [0, 255]
	// const hdDatumScaled = hdDatum.map(d => d3.scaleLinear().domain([0, 1]).range([0, 255])(d));
	


	// for (let i = 0; i < hdDatum.length; i++) {
	// 	imageData.data[4 * i] = 255 - hdDatumScaled[i];
	// 	imageData.data[4 * i + 1] = 255 - hdDatumScaled[i];
	// 	imageData.data[4 * i + 2] = 255 - hdDatumScaled[i];
	// 	imageData.data[4 * i + 3] = 255;

	// }
	// ctx.putImageData(imageData, xPos, yPos);



}