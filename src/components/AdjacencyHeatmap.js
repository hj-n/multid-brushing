import React, { forwardRef, useEffect, useImperativeHandle } from "react";

import axios from 'axios';

import { Heatmap } from "./heatmap";
import { ConditionalNodeDependencies } from "mathjs";


function copyArray(originArray){
	var index = 0, targetSize = originArray.length, targetArray = [];

	for(; index < targetSize ; index++) {
		targetArray[index] = originArray[index];
	}
	return targetArray;
}
const AdjacencyHeatmap = forwardRef((props, ref) => {

	let sim_matrix;
	let canvas;
	let heatmap;
	let heatmapupdate;
	let pixel;
	let length;
	let pastSelections;//과거 선택된것.
	let get_index;//현재 index 순서.
	let select_num;//선택된 점 개수.
	let update_num;
	let cluster_num;//이전 입력에서의 cluster 개수
	let reorder_pixel;
	let reorder_index;
	
	function initializeAdjHeatmap() {
		canvas = document.getElementById('AdjacencyHeatmap');
		var canvasupdate = document.getElementById('AdjacencyHeatmapupdate');

		var maxRow = sim_matrix.map(function(row){return Math.max.apply(Math, row);});
		var max = Math.max.apply(null, maxRow);
		
		length = sim_matrix.length;
		
		pixel = sim_matrix.flat().map(m => [1.0 - m/max]);
		//pixel = sim_matrix.flat().map(m => [1.0, 0, 0, m/max]);
		let data = {pixelValue : [pixel]};

		heatmap = new Heatmap(data, sim_matrix.length, canvas, 1);
		heatmapupdate = new Heatmap(data, sim_matrix.length, canvasupdate, 0);

		pastSelections = new Array(length).fill(0);
		select_num = 0;
		update_num = 0;
		get_index = [...Array(length).keys()];
		cluster_num = 1;
	}

	function updateAdjHeatmap(selectionInfo, currSelections, duration) {
		// TODO (use sim_matrix and update infos)
		reorder_pixel = [];
		reorder_index = [];
		for(let i = 0; i < length; i++){
			if(pastSelections[i] != currSelections[i]){
				let index_i = get_index.indexOf(i);
				let val = get_index[select_num];
				get_index[select_num] = get_index[index_i];
				get_index[index_i] = val;
				
				select_num++;
				update_num++;
			}
		}
		//get_index = copyArray(c_get_index);
		
		pastSelections = copyArray(currSelections);

		let index = {pixelIndex : get_index};
		if(selectionInfo.length > cluster_num + 1){// || update_num > 100
			//새로운 cluster가 추가되었을때 heatmap을 update
			cluster_num = selectionInfo.length - 1;
			update_num = 0;
			heatmap.update(index, 1, duration);
			heatmapupdate.update(index, 0, duration, 1);
			// TODO 기존 heatmap update; 
		}
		else{
			heatmapupdate.update(index, 0, duration);
		}
		/*function comp(a, b){
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

		heatmap.update(data, duration);*/
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
	<div style={{position: "relative"}}>
    	<canvas id="AdjacencyHeatmap"
		height={1000}
		width={1000}
		style={{
			position: "absolute",
			border: "1px solid black",
			display: "block"
		}}
		>
		</canvas>
		<canvas id="AdjacencyHeatmapupdate"
		height={1000}
		width={1000}
		style={{
			position: "absolute",
			border: "1px solid black",
			display: "block"
		}}
		>


		</canvas>
		</div>
	
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