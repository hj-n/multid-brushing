import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import axios from 'axios';
import { axisBottom } from 'd3-axis';

import * as d3 from "d3";

const ParallelCoordinates = forwardRef((props, ref) => {

	let attr, unnormal_raw;
	const scaleArray = [];
	const defaultScaleArray = [];

	const svgRef = useRef(null);

	let paths;

	let dragging = false;
	let draggingStart = 0;
	let draggingStartDomain = [0, 0];
	let draggingStartScale;

	
	useEffect(() => {
		axios.get(props.url + "pcp").then(response => {
			attr = response.data.attr;
			unnormal_raw = response.data.uraw;

			// for california 
			attr[6] = attr[8];
			attr.pop(); attr.pop();
			unnormal_raw.forEach(ele => {
				ele[6] = ele[8];
				ele.pop(); ele.pop();
			})


			// for california
			const cdomain = [
				[1.02, 20],
				[2, 52],
			 [1.13, 12], 
			 [0.75, 2.0], 
			 [25, 7000], 
			 [1.3, 8],
			 [0.329, 5.0001]
			]

			attr.forEach((a, i) => {
				const scale = d3.scaleLinear().domain(cdomain[i]).range([props.height, 0]);
				scaleArray.push(scale);
				defaultScaleArray.push(scale);
			})

      // default
			// attr.forEach((a, i) => {
			// 	const attrData = unnormal_raw.map(d => d[i]);
			// 	console.log(d3.extent(attrData))
			// 	const scale = d3.scaleLinear().domain(d3.extent(attrData)).range([props.height, 0]);
			// 	scaleArray.push(scale);
			// 	defaultScaleArray.push(scale);
			// })



			paths = d3.select(svgRef.current)
			  .append("g").attr("id", "linesG")
				.attr("transform", `translate(${props.margin}, ${props.margin})`)
				.selectAll("path")
				.data(unnormal_raw)
				.enter()
				.append("path")
				.attr("d", (d, i) => {
					const lineVal = d.map(((e, idx) => {
						const y = scaleArray[idx](e);
						const x = idx * (props.width / (attr.length - 1));
						return [x, y];
					}))
					return d3.line()(lineVal)
				})
				.attr("fill", "none")
				.style("stroke", "black")
				.style("stroke-width", 0.3)
				.style("opacity", 0.015)

			function updatePath() {
				paths.attr("d",(d, i) => {
					const lineVal = d.map(((e, idx) => {
						const y = scaleArray[idx](e);
						const x = idx * (props.width / (attr.length - 1));
						return [x, y];
					}))
					return d3.line()(lineVal);
				})
			}

						
			d3.select(svgRef.current)
			  .attr("width", props.width + 2 * props.margin)
				.attr("height", props.height + 2 * props.margin);

			const axisSelection = d3.select(svgRef.current)
															.append("g").attr("id", "axesG")
															.attr("transform", `translate(${props.margin}, ${props.margin})`)
															.selectAll(".axisG")
															.data(attr)
															.enter();
			
			const axisGs = axisSelection.append("g")
																	.attr("transform", (d, i) => `translate(${(props.width / (attr.length - 1)) * i}, 0)`)
																	.each(function(d, i) { 
																		const axis = d3.axisLeft(scaleArray[i]);
																		d3.select(this).call(axis);
																	});
			axisSelection.append("text")
									 .attr("transform", (d, i) => `translate(${(props.width / (attr.length - 1)) * i - 8}, ${props.height + 15})`)
									 .text((d, i) => d)
									 .attr("font-size", "7pt");

			axisGs.on("mouseenter", function(event) {
				d3.select(this)
				  .selectAll("path")
					.attr("stroke-width", 6)
					.attr("stroke", "red");
			});
			axisGs.on("mouseleave", function(event) {
				d3.select(this)
				  .selectAll("path")
					.attr("stroke-width", 1)
					.attr("stroke", "black");

				dragging = false;

			});

			axisGs.on("wheel", function(event) {
				const idx = axisGs.nodes().indexOf(this);
				const variant = (1000 - event.deltaY) / 1000;
				const scale = scaleArray[idx];
				const pointVal = scale.invert(event.offsetY - props.margin);
				const currDomain = scale.domain();
				const domainDistances = [pointVal - currDomain[0], currDomain[1] - pointVal];
				const nextDomainDistances = [domainDistances[0] * variant, domainDistances[1] * variant];
				const nextDomain = [pointVal - nextDomainDistances[0], pointVal + nextDomainDistances[1]];
				
				const defaultDomain = defaultScaleArray[idx].domain();
				nextDomain[0] = nextDomain[0] > defaultDomain[0] ? nextDomain[0] : defaultDomain[0];
				nextDomain[1] = nextDomain[1] < defaultDomain[1] ? nextDomain[1] : defaultDomain[1];
				
				scaleArray[idx] = d3.scaleLinear().domain(nextDomain).range(scale.range())
				const axis = d3.axisLeft(scaleArray[idx]);
				d3.select(this).call(axis);				

				updatePath();
			});

			axisGs.on("mousedown", function(e)  { 
				const idx = axisGs.nodes().indexOf(this);
				dragging = true; 
				draggingStart = scaleArray[idx].invert(e.offsetY - props.margin); 
				draggingStartDomain = scaleArray[idx].domain();
				draggingStartScale = scaleArray[idx].copy();
			})
			axisGs.on("mouseup", function()  { dragging = false; })

			axisGs.on("mousemove", function(event) {

				const idx = axisGs.nodes().indexOf(this);
				if (!dragging) return;

				console.log("dragging")
				
				const draggingCurrent = draggingStartScale.invert(event.offsetY - props.margin); 
				const draggedDistance = (draggingCurrent - draggingStart) * 4;
				const nextDomain = [draggingStartDomain[0] + draggedDistance, draggingStartDomain[1] + draggedDistance];
				
				const defaultDomain = defaultScaleArray[idx].domain();
				if (nextDomain[0] < defaultDomain[0] || nextDomain[1] > defaultDomain[1] ) return;
				
				scaleArray[idx] = d3.scaleLinear().domain(nextDomain).range(draggingStartScale.range());
				const axis = d3.axisLeft(scaleArray[idx]);
				d3.select(this).call(axis);				

				updatePath();
			})

		});
	})

	useImperativeHandle(ref, () => ({
		update(selectionInfo, currSelections, duration) {
			paths.style("stroke", (d, i) => {
							const c = props.colors[currSelections[i]];
							return d3.rgb(c[0], c[1], c[2]);
						})
					 .style("opacity", (d, i) => {
						 return currSelections[i] > 0 ? 0.35 : 0.015;
						//  return currSelections[i] > 0 ? 0.2 : 0.0;
					 })
					 .style("stroke-width", (d, i) => {
						 return currSelections[i] > 1 ? 0.35: 0.35;
					 })
			
		}
	}));

	return (
		<div style={{ margin : props.margin, width: props.width, height: props.height }}>
			<svg
				ref={svgRef}
			/>
		</div>
	)
	
});

export default ParallelCoordinates;