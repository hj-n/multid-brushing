import React, { forwardRef, useEffect, useImperativeHandle } from "react";

import axios from 'axios';

import { Heatmap } from "./heatmap";
import { ConditionalNodeDependencies } from "mathjs";


const AdjacencyHeatmap = forwardRef((props, ref) => {

	let sim_matrix;
	let heatmap;
	let pixel;
	let length;

	function initializeAdjHeatmap() {
		var canvas = document.getElementById('AdjacencyHeatmap');

		var maxRow = sim_matrix.map(function(row){return Math.max.apply(Math, row);});
		var max = Math.max.apply(null, maxRow);
		
		length = sim_matrix.length;
		pixel = sim_matrix.flat().map(m => [1.0, 1.0 - m/max, 1.0 - m/max]);
		let data = {pixelValue : [pixel]};

		heatmap = new Heatmap(data, sim_matrix.length, canvas);
	}

	function updateAdjHeatmap(selectionInfo, currSelections, duration) {
		// TODO (use sim_matrix and update infos)
		//console.log(selectionInfo, currSelections, duration);

		function comp(a, b){
			return a.cluster - b.cluster;
		}
		
		var get_index = [];
		currSelections.forEach((n, i) => {
			if(n === 0){
				n = selectionInfo.length;
			}
			get_index.push({cluster: n, index: i})
		});
		get_index.sort(comp);


		var reorder_pixel = []
		get_index.forEach(n => get_index.forEach(m => reorder_pixel.push(pixel[n.index * length + m.index])));
		let data = {pixelValue : [reorder_pixel]};
		
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