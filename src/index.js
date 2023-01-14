import * as utils from "./utils";
import * as Three from "three";
import * as d3 from "d3";




export class DistortionAwareBrushing {

	constructor(canvas, slider, file, pointScale, defaultK, pointRederingMethod) {
		this.canvas     = canvas;
		this.slider     = slider;
		this.file       = file;
		this.ld 		    = this.file.ld;
		this.hd 		    = this.file.hd;
		this.knn 		    = this.file.knn;
		this.maxK       = this.knn[0].length;
		this.density    = this.file.density;
		this.densityMax = d3.max(this.density);
		this.density    = this.density.map(d => d / this.densityMax);
		// sort the ld, hd, and knn by density
		this.ld  = this.ld.map((d, i) => [d, this.density[i]]).sort((a, b) => a[1] - b[1]).map(d => d[0]);
		this.hd  = this.hd.map((d, i) => [d, this.density[i]]).sort((a, b) => a[1] - b[1]).map(d => d[0]);
		this.knn = this.knn.map((d, i) => [d, this.density[i]]).sort((a, b) => a[1] - [1]).map(d => d[0]);
		this.density = this.density.sort((a, b) => a - b);
		this.pointScale = pointScale;
		this.defaultK   = defaultK;
		this.pointRederingMethod = pointRederingMethod;
		this.initiateCanvas();
		this.initiateSlider();
		this.initiateLdPositions();
		this.initiateBrusher();
		this.addPointObjects();
		this.visualizeDensityAsOpacity();
		this.initiateRendering();
	}


	initiateCanvas() {
		// initiate canvas
		this.renderer = new Three.WebGLRenderer({canvas: this.canvas});
		this.renderer.setSize(this.canvas.width, this.canvas.height);
		this.camera   = new Three.OrthographicCamera(
			0, this.canvas.width, this.canvas.height, 0, 0, 1
		);
		this.camera.position.set(0, 0, 1);
		this.scene    = new Three.Scene();
	}

	initiateSlider() {
		this.slider.min = 0.1;
		this.slider.max = 3;
		this.slider.step = 0.01;
		this.slider.value = this.pointScale;
		this.slider.oninput = (e) => {
			this.pointScale = e.target.value;
			this.pointObjects.forEach(d => d.scale.set(this.pointScale, this.pointScale, 1));
		}
	}

	initiateLdPositions() {
		// rescale ld positions
		this.originalLd = utils.scaleToPixel(this.ld, this.canvas.width);
		this.currentLd  = utils.deepcopyArr(this.originalLd);
	}

	addPointObjects() {
		// rescale the size of the canvas
		this.scene.background = new Three.Color(0xffffff);
		this.pointObjects = this.currentLd.map((d, i) => {
			return this.pointRederingMethod(this.hd[i], d[0], d[1]);
		});
		// add point objects to the scene
		this.pointObjects.forEach(d => this.scene.add(d));
		this.pointObjects.forEach(d => d.scale.set(this.pointScale, this.pointScale, 1));
	}

	visualizeDensityAsOpacity() {
		this.pointObjects.forEach((d, i) => {
			d.material.opacity = this.density[i];
		});
	}

	initiateBrusher() {
		this.brusher = new Brusher(this.scene);
		this.canvas.addEventListener("mousemove", (e) => { this.brusher.updatePosition(e.offsetX, this.canvas.height - e.offsetY); });
	}

	initiateRendering() {
		const object = this;
		function render() {
			object.scene.background = new Three.Color(0xffffff);
			object.renderer.render(object.scene, object.camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
	}
	
}

class Brusher {
	constructor(scene) {
		this.scene = scene;
		this.embedBrusher();
	}

	embedBrusher() {
		// make a circle in the middle of the canvas using Three.js
		const geometry = new Three.CircleGeometry(100, 32);
		const material = new Three.MeshBasicMaterial({color: 0xffff00});
		this.mesh = new Three.Mesh(geometry, material);
		this.mesh.position.set(0, 0, 0);
		this.mesh.scale.set(0.5, 0.5, 1);
		this.mesh.material.transparent = true;
		this.mesh.material.opacity = 0.3;
		this.scene.add(this.mesh);
	}

	updatePosition(x, y) { this.mesh.position.set(x, y, 0.001); }

}



export * from "./pointRendering";