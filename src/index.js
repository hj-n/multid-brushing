
class DistortionAwareBrushing {

	constructor(canvas, file, defaultK) {
		this.canvas   = canvas;
		this.file     = file;
		this.ld 		  = this.file.ld;
		this.knn 		  = this.file.hd_csr.knn;
		this.maxK     = this.knn[0].length;
		this.density  = this.file.density;
		this.defaultK = defaultK;
		this.initiateCanvas();
	}


	initiateCanvas() {
		// initiate canvas
		this.ctx = this.canvas.getContext('2d');
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	initiate() {
		// render this.ld in canvas
	}
}

