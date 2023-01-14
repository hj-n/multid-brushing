import * as utils from "./utils";
import * as Three from "three";
import * as d3 from "d3";
import * as func from "./functionalities";




export class DistortionAwareBrushing {

	constructor(canvas, slider, file, pointScale, defaultBrusherSize, defaultK, pointRederingMethod) {
		this.canvas     = canvas;
		this.slider     = slider;
		this.file       = file;
		this.ld 		    = this.file.ld;
		this.hd 		    = this.file.hd;
		this.pointNum   = this.ld.length;
		this.knn 		    = this.file.knn;
		this.maxK       = this.knn[0].length;
		this.density    = this.file.density;
		this.densityMax = d3.max(this.density);
		this.density    = this.density.map(d => d / this.densityMax);
		this.pointScale = pointScale;
		this.defaultBrusherSize = defaultBrusherSize;
		this.k 				  = defaultK;
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
		this.brusher = new Brusher(this.scene, this.defaultBrusherSize);
		this.canvas.addEventListener("mousemove", (e) => { 
			this.brusher.updatePosition(e.offsetX, this.canvas.height - e.offsetY); 
			const coveredPoints = this.updateCoveredPoints();
			console.log(func.simPointsAndCluster(this.pointNum, coveredPoints, this.knn, this.k));
		});
		this.canvas.addEventListener("mouseover", (e) => {
			this.brusher.updatePosition(e.offsetX, this.canvas.height - e.offsetY);
			this.brusher.updateOpacity(0.3);
		})
		this.canvas.addEventListener("mouseout", (e) => { this.brusher.updateOpacity(0); });
		this.canvas.addEventListener("wheel", (e) => { 
			if (e.ctrlKey) {

				this.updateK(-e.deltaY);
				this.updateCoveredPoints();
				return;
			}
			this.brusher.updateRadius(e.deltaY);
			this.updateCoveredPoints();
		} );
	}

	updateCoveredPoints() {
		const coveredPoints = this.brusher.getCoveredPoints(this.currentLd);
		if (coveredPoints.filter(d => d === true).length === 0) {
			this.pointObjects.forEach(d => d.material.color.set(0xffffff));
			return;
		};
		const highestDensityIdx = func.findHighestDensityIdx(coveredPoints, this.density);
		const highestDensityIdxKnn = func.getKnn(highestDensityIdx, this.knn, this.k);
		this.pointObjects.forEach((d, i) => {
			d.material.color.set(0xffffff);
			d.position.z = 0;
		});
		[highestDensityIdx, ...highestDensityIdxKnn].forEach((idx) => {
			this.pointObjects[idx].material.color.set(0x8888ff);
			this.pointObjects[idx].position.z = 0.00001;
		});

		return [highestDensityIdx, ...highestDensityIdxKnn];
	}

	updateK(delta) {
		if (delta > 0) { if (this.k < this.maxK) this.k += 1; }
		else { if (this.k >= 3) this.k -= 1; }
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
	constructor(scene, defaultBrusherSize) {
		this.scene = scene;
		this.defaultBrusherSize = defaultBrusherSize;
		this.embedBrusher();
	}

	embedBrusher() {
		// make a circle in the middle of the canvas using Three.js
		const geometry = new Three.CircleGeometry(this.defaultBrusherSize, 32);
		const material = new Three.MeshBasicMaterial({color: 0x8888ff});
		this.mesh = new Three.Mesh(geometry, material);
		this.mesh.position.set(0, 0, 0);
		this.mesh.scale.set(1, 1, 1);
		this.mesh.material.transparent = true;
		this.updateOpacity(0);
		this.scene.add(this.mesh);
	}

	updatePosition(x, y) { this.mesh.position.set(x, y, 0.001); }
	updateOpacity(opacity) { this.mesh.material.opacity = opacity; }
	updateRadius(deltaY) { 
		const scaleX = this.mesh.scale.x;
		const scaleY = this.mesh.scale.y;
		if (scaleX - deltaY / 1000 < 0.3) return;
		this.mesh.scale.set(scaleX - deltaY / 1000, scaleY - deltaY / 1000, 1);

	}

	getCoveredPoints(ld) {
		const brusherX = this.mesh.position.x;
		const brusherY = this.mesh.position.y;
		const brusherRadius = this.mesh.scale.x * this.defaultBrusherSize;
		const coveredPoints = ld.map((d, i) => {
			const dist = Math.sqrt((d[0] - brusherX) ** 2 + (d[1] - brusherY) ** 2);
			return dist <= brusherRadius;
		});

		return coveredPoints;

	}


}



export * from "./pointRendering";