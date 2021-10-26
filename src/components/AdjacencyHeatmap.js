import React, { forwardRef, useEffect, useImperativeHandle } from "react";

import axios from 'axios';

import { Heatmap } from "./heatmap";
import { ConditionalNodeDependencies } from "mathjs";



function copyArray(originArray) {
	var index = 0, targetSize = originArray.length, targetArray = [];

	for (; index < targetSize; index++) {
		targetArray[index] = originArray[index];
	}
	return targetArray;
}
const AdjacencyHeatmap = forwardRef((props, ref) => {

	let sim_matrix;
	let heatmap;
	let heatmapupdate;
	let resolution;
	let pastSelections;
	let get_index;
	let cluster_index;
	let select_num;
	let cluster_num;

	function initializeAdjHeatmap() {
		var canvas = document.getElementById('AdjacencyHeatmap');
		var canvasupdate = document.getElementById('AdjacencyHeatmapupdate');

		var maxRow = sim_matrix.map(function (row) { return Math.max.apply(Math, row); });
		var max = Math.max.apply(null, maxRow);

		resolution = sim_matrix.length;

		let pixel = sim_matrix.flat().map(m => [m / max]);
		let color = (props.colors).map(d => [d[0] / 255, d[1] / 255, d[2] / 255]);


		let data = { pixelValue: [pixel], clusterColor: color};

		heatmap = new Heatmap(data, resolution, canvas, 1);
		heatmapupdate = new Heatmap(data, resolution, canvasupdate, 0);

		pastSelections = new Array(resolution).fill(0);
		select_num = 0;
		get_index = [...Array(resolution).keys()];
		cluster_index = new Array(resolution).fill(0);
		cluster_num = 1;
	}

	function updateAdjHeatmap(selectionInfo, currSelections, duration) {
		// TODO (use sim_matrix and update infos)
		for (let i = 0; i < resolution; i++) {
			if (pastSelections[i] != currSelections[i]) {
				let index_i = get_index.indexOf(i);
				let val = get_index[select_num];
				get_index[select_num] = get_index[index_i];
				get_index[index_i] = val;
				cluster_index[select_num] = currSelections[i];
				select_num++;
			}
		}

		pastSelections = copyArray(currSelections);

		let data = { pixelIndex: get_index , clusterIndex: cluster_index};
		if (selectionInfo.length > cluster_num + 1) {
			cluster_num = selectionInfo.length - 1;
			heatmap.update(data, 1, duration);
			heatmapupdate.update(data, 0, duration, 1);
		}
		else {
			heatmapupdate.update(data, 0, duration);
		}
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
				sample : props.sample
			}
		}).then(response => {
			sim_matrix = response.data
			initializeAdjHeatmap();
		})
	}, []);
	return (
		<div>
			<div style={{ display: "block" }}>
				<div style={{ marginBottom: props.margin, marginTop: props.margin }}>
					Adjacency Heatmap
            </div>
				<div style={{ position: "relative" }}>
					<canvas id="AdjacencyHeatmap"
						height={1000}
						width={1000}
						style={{
							position: "absolute",
							border: "1px solid black",
							display: "block"
						}}>
					</canvas>
					<canvas id="AdjacencyHeatmapupdate"
						height={1000}
						width={1000}
						style={{
							position: "absolute",
							border: "1px solid black",
							display: "block"
						}}>
					</canvas>
				</div>
			</div>
		</div>
	)
});


export default AdjacencyHeatmap;
