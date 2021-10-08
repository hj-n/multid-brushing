/**
 * HeatMap for Brushing MDP  
 * Supported Functionalities:
 * Update each pixel's color based on linear color scale
 */

 import { ConditionalNodeDependencies, index } from 'mathjs';


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
   constructor(data, resolution, dom, background) {
     this.resolution = resolution;
     this.pixelValue = [].concat(...data.pixelValue);
     this.clusterColor = data.clusterColor;
     this.dom = dom;
 
     this.pixelSize = this.dom.width / this.resolution;
     this.pixelColor = [];
     this.yIndex = [];
     this.xIndex = [];
 
     for (let i = 0; i < this.resolution; i++) {
       this.pixelColor.push(new Array(this.resolution).fill(this.clusterColor[0]));
       this.yIndex.push(new Array(this.resolution).fill(i));
       this.xIndex.push(Array.from(new Array(this.resolution).keys()));
     }
     this.isUpdating = false;
     this.p_value = [];
	 this.color_value = [];
 
     let gl = this.dom.getContext("webgl");
     this.regl = require('regl')(gl);
 
     if (background) {
       this.updateIndex = [];
       for (let i = 0; i < this.resolution; i++) {
         for (let j = 0; j < this.resolution; j++) {
           this.updateIndex.push([i, j]);
         }
       }
       let frameLoop = this.regl.frame(() => {
 
         this.regl.clear({
           color: [0, 0, 0, 0],
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
     else {
       (this.visited = []).length = this.resolution; this.visited.fill(0);
       this.updateIndex = [];
       this.currentIndex = [];
       for (let i = 0; i < this.resolution; i++) {
         this.currentIndex.push(i);
       }
     }
 
   }
 
 
   // regl command for the initialization of the heatmap
   initializeCommand() {
     return this.regl({
       frag: `
          precision highp float;
  
          varying vec3 fragColor;
          varying float fragValue;
  
          void main() {
            gl_FragColor = vec4(1.0 - (1.0 - fragColor.x) * fragValue, 1.0 - (1.0 - fragColor.y) * fragValue, 1.0 - (1.0 - fragColor.z) * fragValue, 1.0);
          }
        `,
       vert: `
          attribute float pixelValue;
          attribute vec3 pixelColor;
          attribute float x, y;
  
          varying vec3 fragColor;
          varying float fragValue;
  
          uniform float pixelSize;
          uniform float resolution;
  
          void main() {
            gl_PointSize = pixelSize;
            gl_Position = vec4(2.0 * ( (x + 0.5) / resolution) - 1.0, 2.0 * ( (- 0.5 - y) / resolution) + 1.0, 0, 1);
  
            fragColor = pixelColor;
            fragValue = pixelValue;
          }
        `,
       attributes: {
         pixelValue: this.pixelValue,
         pixelColor: this.pixelColor,
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
   update(data, background, duration = 0, clear = 0, delay = 0) {
     let newIndex = [].concat(...data.pixelIndex);
	 let clusterIndex = data.clusterIndex;
 
     if (clear == 1) {
       this.updateIndex = [];
       this.p_value = [];
	   this.color_value = [];
       (this.visited = []).length = this.resolution; this.visited.fill(0);
       this.currentIndex = newIndex;
     }
     let start = new Date();
 
     if (!background) {
       let len = this.p_value.length;
       let changedIndex;
       (changedIndex = []).length = this.resolution; changedIndex.fill(0);
       for (let i = 0; i < this.resolution; i++) {
         if (this.currentIndex[i] != newIndex[i]) {
           changedIndex[i] = 1;

           //heatmap 바꾸기 -> i의 위치에 c_get_index[i]의 색깔.
           if (this.visited[i] == 0) {
             for (let j = 0; j < this.resolution; j++) {
               if (this.visited[j] == 0) {
                 let value = this.pixelValue[newIndex[i] * this.resolution + newIndex[j]]
                 this.updateIndex.push([i, j]);
                 this.updateIndex.push([j, i]);
                 this.p_value.push(value);
                 this.p_value.push(value);

				 let color;
				 if(clusterIndex[i] == clusterIndex[j]){
					 color = this.clusterColor[clusterIndex[i]];
				 } else{
					 color = this.clusterColor[0];
				 }
				 this.color_value.push(color)
				 this.color_value.push(color)
               }
             }
             this.visited[i] = 1;
           }
         }
       }
       this.currentIndex = newIndex;
       let i = 0;
       while (i < len) {
         let x = this.updateIndex[i][0];
         let y = this.updateIndex[i][1];
         if (changedIndex[x] == 1 || changedIndex[y] == 1) {
           let value = this.pixelValue[newIndex[x] * this.resolution + newIndex[y]]
           this.p_value[i] = value;
           this.p_value[i + 1] = value;

		   let color;
		   if(clusterIndex[x] == clusterIndex[y]){
			   color = this.clusterColor[clusterIndex[x]];
		   } else{
			   color = this.clusterColor[0];
		   }
		   this.color_value[i] = color;
		   this.color_value[i + 1] = color;
		
         }
         i = i + 2;
       }
	   console.log(this.p_value, this.color_value, this.updateIndex);
     } else {
       this.p_value = [];
	   this.color_value = [];
       let i = 0;
       while (i < this.updateIndex.length) {
		   let x = this.updateIndex[i][0];
		   let y = this.updateIndex[i][1]
         this.p_value.push(this.pixelValue[newIndex[x] * this.resolution + newIndex[y]]);
		
		 if(clusterIndex[x] == clusterIndex[y]){
			this.color_value.push(this.clusterColor[clusterIndex[x]]);
		 } else{
			this.color_value.push(this.clusterColor[0]);
		 }

         i++;
       }
	   console.log(this.p_value, this.color_value, this.updateIndex);
     }
 
 
     let start2 = new Date();
     if (this.isUpdating) return;
     else this.isUpdating = true;
 
     let startTime = null;
 
     const updateHmap = this.updateCommand();
     let start3 = new Date();
     let frameLoop = this.regl.frame(({ time }) => {
       if (startTime === null) {
         startTime = time;
       }
 
       this.regl.clear({
         color: [0, 0, 0, 0],
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
         this.isUpdating = false;
       }
     });
     let end = new Date();
     //console.log(start2 - start, start3 - start2, end - start3);
   }
 
   // REGL command for updating heatmap
   updateCommand() {
     return this.regl({
       frag: `
          precision highp float;
  
          varying float fragValue;
          varying vec3 fragColor;
  
          void main() {
            gl_FragColor = vec4(1.0 - (1.0 - fragColor.x) * fragValue, 1.0 - (1.0 - fragColor.y) * fragValue, 1.0 - (1.0 - fragColor.z) * fragValue, 1.0);
          }
        `,
       vert: `
          attribute float PixelValue;
          attribute vec3 PixelColor;
          attribute vec2 index;
  
          varying float fragValue;
          varying vec3 fragColor;
  
          uniform float pixelSize;
          uniform float delay;
          uniform float duration;
          uniform float elapsed;
          uniform float resolution;
  
          void main() {
            gl_PointSize = pixelSize;
            gl_Position = vec4(2.0 * ( (index.x + 0.5) / resolution) - 1.0, 2.0 * ( (- 0.5 - index.y) / resolution) + 1.0, 0, 1);
  
            fragColor = PixelColor;
            fragValue = PixelValue;
          }
        `,
       attributes: {
         PixelValue: this.p_value,
		 PixelColor : this.color_value,
         index: this.updateIndex
       },
       uniforms: {
         pixelSize: this.regl.prop('pixelSize'),
         resolution: this.regl.prop('resolution'),
         delay: this.regl.prop('delay'),
         duration: this.regl.prop('duration'),
         elapsed: (context, props) => (context.time - props.startTime) * 1000
       },
       count: this.updateIndex.length,
       primitive: 'points'
     });
   }
 
 
 }
 
 