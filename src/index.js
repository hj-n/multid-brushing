import * as utils from "./utils";
import * as Three from "three";




export class DistortionAwareBrushing {

	constructor(canvas, slider, file, defaultK, pointRederingMethod) {
		this.canvas   = canvas;
		this.slider   = slider;
		this.file     = file;
		this.ld 		  = this.file.ld;
		this.hd 		  = this.file.hd;
		this.knn 		  = this.file.hd_csr.knn;
		this.maxK     = this.knn[0].length;
		this.density  = this.file.density;
		this.defaultK = defaultK;
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
		// this.slider.min = this.pixel / 3;
		// this.slider.max = this.pixel * 3;
		// this.slider.value = this.pixel;
		// this.slider.oninput = (e) => {
		// 	this.pixel = e.target.value;
		// 	this.initiateCanvas();
		// 	this.initiateLdPositions();
		// 	this.renderCurrentLd();
		// }
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
	}



	

}



export * from "./pointRendering";