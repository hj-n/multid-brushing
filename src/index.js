
class DistortionAwareBrushing {

	constructor(canvas, path, identifier, defaultK) {
		this.canvas  = canvas;
		this.path    = require(`${path}/${idenifier}_ld`)
	}

	constructor(canvas, ld, knn, sim, defaultK) {
		this.canvas   = canvas;
		this.ld       = ld;
		this.knn      = knn;
		this.sim      = sim;
		this.maxK     = this.knn[0].length;
		this.defaultK = defaultK;
	}
}