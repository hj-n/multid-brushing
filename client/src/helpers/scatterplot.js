/**
 * Scatterplot for Brushing MDP
 * Supported Functionalities:
 * * Update Position 
 * * Update Color / Opacity
 */

export class Scatterplot {
  constructor (points, dom) {
    this.points = points;
    this.dom = dom;
    let gl = this.dom.getContext("webgl");
    this.regl = require('regl')(gl);

    let frameLoop = this.regl.frame(({time}) => {
      this.regl.clear({
        color: [255, 255, 255, 1],
        depth: 1,
      });

      if (frameLoop) {
        frameLoop.cancel();

      }
    });
  }

  initializeCommand() {
    // regl
    return this.regl({
      frag: `
      
      `,
      vert: `
      
      `,
      attributes: {

      },
      uniforms: {

      },
      count: this.points.length,
      primitive:  'points',
    })
  }
}