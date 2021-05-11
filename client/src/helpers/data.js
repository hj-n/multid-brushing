/*
 * Data gathering (initialization, update, etc...)
*/

import * as d3 from "d3";


// Abstract Data Class
class Data {
    constructor() {
        if (new.target === Data) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
    }

    // normalize to -1 to 1 (for test)
    normalize(data) {
        let xScale = d3.scaleLinear()
                      .domain([d3.min(data.map(d => d[0])), d3.max(data.map(d => d[0]))])
                      .range([-1, 1]);
        let yScale = d3.scaleLinear()
                      .domain([d3.min(data.map(d => d[1])), d3.max(data.map(d => d[1]))])
                      .range([-1, 1]);
        let dataNormal = data.map(d => [xScale(d[0]), yScale(d[1])]);
        return dataNormal;
    }

    initData() {}
}

// Random Data Generation
export class RandomData extends Data {
    constructor(size) {
        super();
        this.size = size;


        // data generation
        const rng = d3.randomNormal(0, 0.1);
        this.emb = [];
        for(let i = 0; i < this.size; i++) {
            this.emb.push([rng(), rng()])
        }
        this.emb = this.normalize(this.emb);

        this.opacity = []
        for(let i = 0; i < this.size; i++)  {
            const pos = this.emb[i];
            let dist = pos[0] * pos[0] + pos[1] * pos[1];
            dist = dist > 1 ? 1 : dist;
            this.opacity.push(dist);
        }




    }

    emb() { return this.emb; }

    opacity() { return this.opacity; }

}
