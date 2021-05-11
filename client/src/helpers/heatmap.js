/**
 * HeatMap for Brushing MDP  
 * Supported Functionalities:
 * Update each pixel's color based on linear color scale
 */


/**
 * INITIALIZATION
 * const heatmap = new Heatmap (data, dom)
 * "data" parameter should hold the initial information of the scatterplot
 * "dom" paramter should hold the dom element where the scatterplot will be rendered
 *
 * UPDATE
 * 
 */

export class Heatmap {
  constructor (data, dom) {
    this.resolution = data.resolution;
    this.pixelValue = [].concat(...data.pixelValue);
    this.dom = dom;

    this.pixelSize = this.dom.offsetWidth / this.resolution;

    this.yIndex = [];
    for (let i = 0; i < this.resolution; i++) 
      this.yIndex.push(new Array(this.resolution).fill(i));

    this.xIndex = [];
    for (let i = 0; i < this.resolution; i++) 
      this.xIndex.push(Array.from(new Array(this.resolution).keys()));
    
    this.currentPixelValue = this.pixelValue;
    this.isUpdating = false;

    let gl = this.dom.getContext("webgl");
    this.regl = require('regl')(gl);

    let frameLoop = this.regl.frame(() => {
      
      this.regl.clear({
        color: [255, 255, 255, 0],
        depth: 1,
      });

      const initializeHmap = this.initializeCommand();
      initializeHmap({ 
        pixelSize: this.pixelSize, 
        resolution: this.resolution
      });

      if (frameLoop) {
        frameLoop.cancel();
      }
    });

  }


  // regl command for the initialization of the heatmap
  initializeCommand() {
    return this.regl({
      frag: `
        precision highp float;

        varying float fragColor;

        void main() {
          gl_FragColor = vec4(1.0 - fragColor, 1, 1, 1);
        }
      `,
      vert: `
        attribute float pixelValue;
        attribute float x, y;

        varying float fragColor;

        uniform float pixelSize;
        uniform float resolution;

        void main() {
          gl_PointSize = pixelSize;
          gl_Position = vec4(2.0 * ( (x + 0.5) / resolution) - 1.0, 2.0 * ( (y + 0.5) / resolution) - 1.0, 0, 1);

          fragColor = pixelValue;
        }
      `,
      attributes: {
        pixelValue: this.pixelValue,
        x: this.xIndex,
        y: this.yIndex
      },
      uniforms: {
        pixelSize: this.regl.prop('pixelSize'),
        resolution: this.regl.prop('resolution')
      },
      count: this.resolution * this.resolution,
      primitive: 'points',
    })
  }

  // update heatmap
  update(data, duration=0, delay=0) {

  }

  // REGL command for updating heatmap
  update(newPixelValue) {
    return this.regl({
      frag: `
      `,
      vert: `
      `,
      attributes: {
        startPixelValue: this.currentPixelValue,
        endPixelValue: newPixelValue

      },
      uniforms: {},
      count: this.resolution * this.resolution,
      primitive: 'points'
    });
  }


}