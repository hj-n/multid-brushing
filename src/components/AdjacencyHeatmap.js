import React, { forwardRef, useEffect, useImperativeHandle } from "react";

import axios from 'axios';

import { Heatmap } from "./heatmap";
import { ConditionalNodeDependencies } from "mathjs";


const AdjacencyHeatmap = forwardRef((props, ref) => {

	let sim_matrix;
	let heatmap;
	function initializeAdjHeatmap() {
		var canvas = document.getElementById('AdjacencyHeatmap');
		//console.log(canvas.getContext("2d"));
		var maxRow = sim_matrix.map(function(row){return Math.max.apply(Math, row);});
		console.log(sim_matrix);
		var max = Math.max.apply(null, maxRow);
		
		
		// var red = sim_matrix.map(n => n.map(m => m)).flat();
		// var green = sim_matrix.map(n => n.map(m => 0)).flat();
		// var blue= sim_matrix.map(n => n.map(m => m)).flat();
		// var pixel = [];
		// pixel[0] = red;
		// pixel[1] = green;
		// pixel[2] = blue;
		//console.log(pixel);

		var pixel = sim_matrix.flat().map(m => [1.0 - m/max, 1.0 - m/max, 1.0 - m/max]);
		let data = {pixelValue : [pixel]};
		//console.log(new_matrix);
		
		//let new_matrix = {pixelValue : matrix.concat(sim_matrix, matrix)};
		//console.log(new_matrix);
		//let new_matrix = {pixelValue : matrix.concat(matrix, matrix)};
		
		heatmap = new Heatmap(data, 2000, canvas);
		// //heatmap = new Heatmap(data, resolution, dom);
	}

	function updateAdjHeatmap(selectionInfo, currSelections, duration) {
		// TODO (use sim_matrix and update infos)
		//console.log(selectionInfo, currSelections, duration);

		function comp(a, b){
			let a_ = a.cluster;
			let b_ = b.cluster;
			if(a_ === 0){
				a_ = selectionInfo.length;
			}
			if(b_ === 0){
				b_ = selectionInfo.length;
			}
			return a_ - b_;
		}

		var copy_currSelections = currSelections.slice();
		var get_index = [];
		copy_currSelections.forEach((n, i) => get_index.push({cluster: n, index: i}));
		get_index.sort(comp);
		
		var maxRow = sim_matrix.map(function(row){return Math.max.apply(Math, row);});
		var max = Math.max.apply(null, maxRow);
		var flat_matrix = sim_matrix.flat();
		var reorder_matrix = []
		get_index.forEach(n => get_index.forEach(m => reorder_matrix.push(flat_matrix[n.index*2000 + m.index])));
		var pixel = reorder_matrix.map(m => [1.0 - m/max, 1.0 - m/max, 1.0 - m/max]);

		let data = {pixelValue : [pixel]};
		
		heatmap.update(data, duration);
	}

	useImperativeHandle(ref, () => ({
		update(selectionInfo, currSelections, duration) {
			updateAdjHeatmap(selectionInfo, currSelections, duration);
		}
	}))


	useEffect(() => {
		axios.get(props.url + "simmatrix", {
			params: {
				dataset: props.dataset,
				method: props.method,
				sample : props.sample_rate
			}
		}).then(response => {
			sim_matrix = response.data
			initializeAdjHeatmap();
		})
	}, []);
	return (

		<div >
			<div style={{display: "block"}}>
      <div style={{marginBottom: props.margin, marginTop: props.margin}}>
        Adjacency Heatmap
      </div>
	<foreignObject>
    <canvas id="AdjacencyHeatmap"
		xmlns="http://www.w3.org/1999/xhtml" 
		height={props.size}
		width={props.size}
		style={{
			border: "1px solid black",
			display: "block"
		}}
		></canvas>
  	</foreignObject>
	
    </div>
		</div>
	)
});

export default AdjacencyHeatmap;
/*
      <svg id="AdjacencyHeatmap"
        width={props.size}       
        height={props.size} 
        style={{
          border: "1px solid black",
          display: "block"
        }}
      >

</svg>
*/