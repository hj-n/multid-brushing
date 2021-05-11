/**
 * Scatterplot for Brushing MDP
 * Supported Functionalities:
 * * Update Position 
 * * Update Color / Opacity
 */

export class Scatterplot {
  constructor (points, opacity, radius, dom) {
    this.points = points;
    this.dom = dom;
    this.radius = radius;
    this.opacity = opacity;

    let gl = this.dom.getContext("webgl");
    this.regl = require('regl')(gl);


    let frameLoop = this.regl.frame(() => {
      this.regl.clear({
        color: [255, 255, 255, 1],
        depth: 1,
      });

      const initializeSplot = this.initializeCommand();
      initializeSplot({
        radius,
      })

      if (frameLoop) {
        frameLoop.cancel();

      }
    });
  }

  initializeCommand() {
    // regl command for the inialization of the scatterplot
    return this.regl({
      frag: `
        precision highp float;

        varying float fragOpacity;

        void main() {
          float r = 0.0;
          vec2 cxy  = 2.0 * gl_PointCoord - 1.0;

          r = dot(cxy, cxy);
          if (r > 1.0) {
            discard;
          }
          gl_FragColor = vec4(0, 0, 0, fragOpacity);
        }
      `,
      vert: `
        attribute vec2 position;
        attribute float opacity;

        uniform float radius;

        varying float fragOpacity;

        
        void main() {
          gl_PointSize = radius;
          gl_Position = vec4(position, 0, 1);     
          
          fragOpacity = opacity;
        }
      `,
      attributes: {
        position: this.points,
        opacity: this.opacity
      },
      uniforms: {
        radius: this.regl.prop('radius'),
      },
      count: this.points.length,
      primitive:  'points',
    });
  }

}