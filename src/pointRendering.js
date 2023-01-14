import * as d3 from "d3";
import * as Three from "three";

export function render2DMonochromeImage(hdDatum, xPos, yPos) {
	// hd_datum is a 1D array of length n * n holding monochrome image
	// ctx is the canvas context
	// render hdDatum in (xPos, yPos) in ctx
	// render using Three.js
	const n = Math.round(Math.sqrt(hdDatum.length));
	const hdDatum2D= [];
	for (let i = 0; i < n; i++) {
		hdDatum2D.push(hdDatum.slice(i * n, (i + 1) * n));
	}
	const hdDatum2DFlipped = hdDatum2D.reverse();
	const hdDatumFlipped = []
	for (let i = 0; i < n; i++) {
		hdDatumFlipped.push(...hdDatum2DFlipped[i]);
	}
	

	const meshDatum = new Uint8Array(hdDatumFlipped.length * 4);
	for (let i = 0; i < hdDatumFlipped.length; i++) {
		meshDatum[4 * i] = 255 - hdDatumFlipped[i] ;
		meshDatum[4 * i + 1] = 255 - hdDatumFlipped[i] ;
		meshDatum[4 * i + 2] = 255 - hdDatumFlipped[i] ;
		if (hdDatumFlipped[i] < 0.01) {
			meshDatum[4 * i + 3] = 0;
		}
		else {
			meshDatum[4 * i + 3] = 255;
		}
	}

	console.log(meshDatum)
	
	// meshDatum
	const texture = new Three.DataTexture(meshDatum, n, n, Three.RGBAFormat);
	texture.needsUpdate = true;
	// console.log(texture)
	const geometry = new Three.PlaneGeometry(n, n);
	const material = new Three.MeshBasicMaterial({map: texture});
	material.transparent = true;
	const mesh = new Three.Mesh(geometry, material);
	mesh.position.set(xPos, yPos, 0);
	return mesh;

}