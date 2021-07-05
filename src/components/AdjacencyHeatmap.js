import React, { forwardRef, useEffect, useImperativeHandle } from "react";

import axios from 'axios';


const AdjacencyHeatmap = forwardRef((props, ref) => {

	let sim_matrix;

	function initializeAdjHeatmap() {
		// TODO (use sim_matrix)
	}

	function updateAdjHeatmap(selectionInfo, currSelections, duration) {
		// TODO (use sim_matrix and update infos)
	}

	useImperativeHandle(ref, () => ({
		update(selectionInfo, currSelections, duration) {
			console.log(selectionInfo, currSelections, duration);
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
      <svg id="selectionInfoMatrix"
        width={props.size}       
        height={props.size} 
        style={{
          border: "1px solid black",
          display: "block"
        }}
      />
    </div>
		</div>
	)
});

export default AdjacencyHeatmap;