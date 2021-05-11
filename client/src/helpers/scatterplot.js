/**
 * Scatterplot for Brushing MDP
 * Supported Functionalities:
 * * Update Position 
 * * Update Color / Opacity
 */


// TODO add update support

export class Scatterplot {
  constructor (points, opacity, radius, dom) {
    this.points = points;
    this.opacity = opacity;
    this.dom = dom;
    this.radius = radius;

    this.currentPositions = points;  // current position of the points
    this.currentOpacity = opacity;   // current opacity values of the points

    this.isUpdating = false;

    let gl = this.dom.getContext("webgl");
    this.regl = require('regl')(gl);


    let frameLoop = this.regl.frame(() => {
      this.regl.clear({
        color: [255, 255, 255, 1],
        depth: 1,
      });

      const initializeSplot = this.initializeCommand();
      initializeSplot({ radius })

      if (frameLoop) {
        frameLoop.cancel();
      }
    });
  }

  // regl command for the inialization of the scatterplot
  initializeCommand() {
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

  // update scatterplot
  update(newPositions, newOpacity, delay, duration) {

    if (this.isUpdating) return;
    else this.isUpdating = true;

    let startTime = null;

    const updateSplot = this.updateCommand(newPositions, newOpacity);

    const frameLoop = this.regl.frame(({time}) => {
      if (startTime === null) {
        startTime = time;
      }

      this.regl.clear({
        color: [255, 255, 255, 1],
        depth: 1,
      });


      updateSplot({
        radius: this.radius,
        delay,
        duration,
        startTime
      });

      if (time - startTime > (duration + delay) / 1000) {
        frameLoop.cancel();
        this.currentPositions = newPositions;
        this.currentOpacity = newOpacity;
        this.isUpdating = false;

      }



    })
  }


  // REGL command for updating scatterplot
  updateCommand(newPositions, newOpacity) {
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
        attribute vec2 startPosition;
        attribute vec2 endPosition;
        attribute float startOpacity;
        attribute float endOpacity;

        varying float fragOpacity;

        uniform float radius;
        uniform float delay;        
        uniform float duration;  
        uniform float elapsed;

        float easeCubicInOut(float t) {
          t *= 2.0;
          t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;

          if (t > 1.0) {
            t = 1.0;
          }
          return t;
        }

        void main() {
          gl_PointSize = radius;

          float t;
          if (duration == 0.0)       t = 1.0;
          else if (elapsed < delay)  t = 0.0;
          else                       t = easeCubicInOut((elapsed - delay) / duration);

          vec2 position = mix(startPosition, endPosition, t);
          fragOpacity = mix(startOpacity, endOpacity, t);

          gl_Position = vec4(position, 0.0, 1.0);

        }
      `,
      attributes: {
        startPosition: this.currentPositions,
        startOpacity: this.currentOpacity,
        endPosition: newPositions,
        endOpacity: newOpacity
      },
      uniforms: {
        radius: this.regl.prop('radius'),
        delay: this.regl.prop('delay'),
        duration: this.regl.prop('duration'),
        startTime: this.regl.prop('duration'),
        elapsed: (context, props) => (context.time - props.startTime) * 1000
      },
      count: this.points.length,
      primitive: 'points'
    });
  }

}