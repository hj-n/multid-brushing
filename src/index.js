import * as utils from "./utils";
import * as Three from "three";




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
		this.pointScale = pointScale;
		this.defaultK   = defaultK;
		this.pointRederingMethod = pointRederingMethod;
		this.initiateCanvas();
		this.initiateSlider();
		this.initiateLdPositions();
		this.addPointObjects();
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

	initiateRendering() {
		const object = this;
		function render() {
			object.scene.background = new Three.Color(0xffffff);
			object.renderer.render(object.scene, object.camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
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

		this.pointObjects.forEach((d, i) => {
			// d.material.color.setRGB(1, 0, 0);
			// d.material.opacity = 0.5;
		});

	}



	

}



export * from "./pointRendering";