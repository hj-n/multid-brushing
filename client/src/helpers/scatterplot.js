/**
 * Scatterplot for Brushing MDP
 * Supported Functionalities:
 * * Update Position 
 * * Update Styles: Color / Opacity / Radius 
 */

/**
 * INITIALIZATION
 * const scatterplot = new Scatterplot (data, dom)
 * "data" parameter should hold the initial information of the scatterplot
 * "dom" paramter should hold the dom element where the scatterplot will be rendered
 *
 * UPDATE
 * scatterplot.update(data, duration, delay)
 * * note that "duration" and "delay" should be given as millisecond
 *
 * data: {
 *  position: ~~ each element is vec2 (should be normalized to -1 ~ 1)
 *  opacity:  ~~ each element is float value
 *  color:    ~~ each element is vec3 (each value denotes to r,g,b, respectively)
 *  radius:   ~~ each elemtn is float value
 * }
 */


export class Scatterplot {
  constructor (data, dom) {
    this.points = data.position;
    this.opacity = data.opacity;
    this.color = data.color;
    this.radius = data.radius;
    this.dom = dom;

    this.currentPositions = this.points;  // current position of the points
    this.currentOpacity = this.opacity;   // current opacity values of the points
    this.currentColor = this.color;       // current color
    this.currentRadius = this.radius;     // current radius

    this.mouseX = -2.0;
    this.mouseY = -2.0;

    // Initial Scatterplot Rendering

    this.initializeSplot = null;
    this.isUpdating = false;

    let gl = this.dom.getContext("webgl");
    this.regl = require('regl')(gl);

    this.regl.clear({
      color: [255, 255, 255, 0],
      depth: 1,
    });

    this.initializeSplot = this.initializeCommand();
    this.initializeSplot({
      mousex: this.mouseX,
      mousey: this.mouseY,
      width  : dom.offsetWidth,
      height : dom.offsetHeight
    });

    // mouse event handler

    this.interactionFrameLoop = null;

    const setInteractionFrameLoop = () => {
      this.interactionFrameLoop = this.regl.frame(() => {
        this.regl.clear({
          color: [255, 255, 255, 0],
          depth: 1,
        });
        this.initializeSplot({
          mousex: this.mouseX,
          mousey: this.mouseY,
          width  : dom.offsetWidth,
          height : dom.offsetHeight
        });
      });
    }
    
    dom.addEventListener('mouseout', e => {
      this.mouseX = -2.0;
      this.mouseY = -2.0;
      this.interactionFrameLoop.cancel();
      this.interactionFrameLoop = null;
    });

    dom.addEventListener('mousemove', e => {
      this.mouseX = (e.offsetX / dom.offsetWidth) * 2 - 1;
      this.mouseY = - ((e.offsetY / dom.offsetHeight) * 2 - 1);
      if (this.interactionFrameLoop === null) setInteractionFrameLoop();
    });

    dom.addEventListener('mouseover', e => {
      setInteractionFrameLoop();
    });

  }

  // regl command for the inialization of the scatterplot
  initializeCommand() {
    return this.regl({
      frag: `
        precision highp float;

        varying float fragOpacity;
        varying vec3 fragColor;

        void main() {
          float r = 0.0;
          vec2 cxy  = 2.0 * gl_PointCoord - 1.0;

          r = dot(cxy, cxy);
          if (r > 1.0) {
            discard;
          }
          gl_FragColor = vec4(fragColor, fragOpacity);
        }
      `,
      vert: `
        attribute vec2 position;
        attribute float opacity;
        attribute vec3 color;
        attribute float radius;

        varying float fragOpacity;
        varying vec3 fragColor;

        uniform float mousex, mousey;
        uniform float width, height;

        void main() {
          float mouseDist = distance(vec2(position[0] * width, position[1] * height) / 2.0, 
                                     vec2(mousex * width, mousey * height) / 2.0) * 2.0;


          if (mouseDist < radius) {
            gl_PointSize = radius * 2.0;
            gl_Position = vec4(position, - 0.1, 1);
          }
          else {
            gl_PointSize = radius;
            gl_Position = vec4(position, 0, 1);
          }
          
          fragOpacity = opacity;
          fragColor = color / 255.0;
        }
      `,
      attributes: {
        position: this.currentPositions,
        opacity: this.currentOpacity,
        color: this.currentColor,
        radius: this.currentRadius,
      },
      uniforms: {
        mousex: this.regl.prop("mousex"),
        mousey: this.regl.prop("mousey"),
        width:  this.regl.prop("width"),
        height: this.regl.prop("height"),
      },
      count: this.points.length,
      primitive:  'points',
    });
  }

  // update scatterplot
  update(data, duration=0, delay=0) {

    // exception handling
    if (this.isUpdating) return;
    else this.isUpdating = true;

    if (this.interactionFrameLoop !== null) {
      this.interactionFrameLoop.cancel();
      this.interactionFrameLoop = null;
    }

    // update
    let newPositions = data.position;
    let newOpacity = data.opacity;
    let newColor = data.color;
    let newRadius = data.radius;


    let startTime = null;

    const updateSplot = this.updateCommand(newPositions, newOpacity, newColor, newRadius);

    const frameLoop = this.regl.frame(({time}) => {
      if (startTime === null) {
        startTime = time;
      }

      this.regl.clear({
        color: [255, 255, 255, 0],
        depth: 1,
      });


      updateSplot({
        delay,
        duration,
        startTime
      });

      if (time - startTime > (duration + delay) / 1000) {
        frameLoop.cancel();
        this.currentPositions = newPositions;
        this.currentOpacity = newOpacity;
        this.currentColor = newColor;
        this.currentRadius = newRadius;
        this.initializeSplot = this.initializeCommand();
        this.isUpdating = false;
      }
    })

  }


  // REGL command for updating scatterplot
  updateCommand(newPositions, newOpacity, newColor, newRadius) {
    return this.regl({
      frag: `
        precision highp float;

        varying float fragOpacity;
        varying vec3 fragColor;

        void main() {
          float r = 0.0;
          vec2 cxy  = 2.0 * gl_PointCoord - 1.0;

          r = dot(cxy, cxy);
          if (r > 1.0) {
            discard;
          }
          gl_FragColor = vec4(fragColor, fragOpacity);
        }
      `,
      vert: `
        attribute vec2 startPosition;
        attribute vec2 endPosition;
        attribute float startOpacity;
        attribute float endOpacity;
        attribute vec3 startColor;
        attribute vec3 endColor;
        attribute float startRadius;
        attribute float endRadius;

        varying float fragOpacity;
        varying vec3 fragColor;

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
          float t;
          if (duration == 0.0 && delay == 0.0)       t = 1.0;
          else if (elapsed < delay)  t = 0.0;
          else                       t = easeCubicInOut((elapsed - delay) / duration);

          gl_PointSize = mix(startRadius, endRadius, t);

          vec2 position = mix(startPosition, endPosition, t);
          fragOpacity = mix(startOpacity, endOpacity, t);
          fragColor = mix(startColor, endColor, t) / 255.0;

          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      attributes: {
        startPosition: this.currentPositions,
        startOpacity: this.currentOpacity,
        startColor: this.currentColor,
        startRadius: this.currentRadius,
        endPosition: newPositions,
        endOpacity: newOpacity,
        endColor: newColor,
        endRadius: newRadius
      },
      uniforms: {
        delay: this.regl.prop('delay'),
        duration: this.regl.prop('duration'),
        startTime: this.regl.prop('startTime'),
        elapsed: (context, props) => (context.time - props.startTime) * 1000
      },
      count: this.points.length,
      primitive: 'points'
    });
  }

}