/**
 * HeatMap for Brushing MDP  
 * Supported Functionalities:
 * Update each pixel's color based on linear color scale
 */


/**
 * INITIALIZATION
 * const heatmap = new Heatmap (data, resolution, dom)
 * "data" parameter should hold the initial information of the scatterplot
 * "dom" paramter should hold the dom element where the scatterplot will be rendered
 *
 * UPDATE
 * heatmap.update(data, duration ,delay)
 * * note that "duration" and "delay" should be given as millisecond
 * data: {
 *   pixelValue: ~~ each element is vec3 (each value denotes to r,g,b, respectively) (length: n * n)
 * }
 */

export class Heatmap {
  constructor (data, resolution, dom) {
    this.resolution = resolution;
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

        varying vec3 fragColor;

        void main() {
          gl_FragColor = vec4(fragColor, 1);
        }
      `,
      vert: `
        attribute vec3 pixelValue;
        attribute float x, y;

        varying vec3 fragColor;

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
    let newPixelValue = [].concat(...data.pixelValue);

    if (this.isUpdating) return;
    else this.isUpdating = true;

    let startTime = null;

    const updateHmap = this.updateCommand(newPixelValue);

    let frameLoop = this.regl.frame(({time}) => {
      if (startTime === null) {
        startTime = time;
      }

      this.regl.clear({
        color: [255, 255, 255, 0],
        depth: 1,
      });

      updateHmap({
        pixelSize: this.pixelSize,
        resolution: this.resolution,
        startTime: startTime,
        delay, duration
      });

      if (time - startTime > (duration + delay) / 1000) {
        frameLoop.cancel();
        this.currentPixelValue = newPixelValue;
        this.isUpdating = false;
      }
    });

  }

  // REGL command for updating heatmap
  updateCommand(newPixelValue) {
    return this.regl({
      frag: `
        precision highp float;

        varying vec3 fragColor;

        void main() {
          gl_FragColor = vec4(fragColor, 1);
        }
      `,
      vert: `
        attribute vec3 startPixelValue;
        attribute vec3 endPixelValue;
        attribute float x,y;

        varying vec3 fragColor;

        uniform float pixelSize;
        uniform float delay;
        uniform float duration;
        uniform float elapsed;
        uniform float resolution;

        float easeCubicInOut(float t) {
          t *= 2.0;
          t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;

          if (t > 1.0) {
            t = 1.0;
          }
          return t;
        }

        void main() {
          float t;
          if (duration == 0.0 && delay == 0.0) t = 1.0;
          else if (elapsed < delay) t = 0.0;
          else                      t = easeCubicInOut((elapsed - delay) / duration);

          gl_PointSize = pixelSize;
          gl_Position = vec4(2.0 * ( (x + 0.5) / resolution) - 1.0, 2.0 * ( (y + 0.5) / resolution) - 1.0, 0, 1);

          fragColor = mix(startPixelValue, endPixelValue, t);

        }
      `,
      attributes: {
        startPixelValue: this.currentPixelValue,
        endPixelValue: newPixelValue,
        x: this.xIndex,
        y: this.yIndex
      },
      uniforms: {
        pixelSize: this.regl.prop('pixelSize'),
        resolution: this.regl.prop('resolution'),
        delay: this.regl.prop('delay'),
        duration: this.regl.prop('duration'),
        elapsed: (context, props) => (context.time - props.startTime) * 1000
      },
      count: this.resolution * this.resolution,
      primitive: 'points'
    });
  }


}