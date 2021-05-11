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

    initData() {}
}

// Random Data Generation
export class RandomData extends Data {
    constructor(size) {
        super();
        this.size = size;
        const rng = d3.randomNormal(0, 0.05);
        this.emb = [];
        for(let i = 0; i < this.size; i++) {
            this.emb.push([rng(), rng()])
        }
    }
    
    emb() {
        return this.emb;
    }

}
