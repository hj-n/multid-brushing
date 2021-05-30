import React, { useRef, useEffect, useState, isValidElement } from 'react';
import * as d3 from "d3";
import axios from 'axios';
import { reshape } from "mathjs";

import { Scatterplot } from "../subcomponents/scatterplot";
import { heatmapData } from "../subcomponents/heatmapData";
import { Heatmap } from '../subcomponents/heatmap';
// import { Contour } from '../subcomponents/contours';

import { getMouseoverPoints, generateColors } from "../helpers/utils";


const Brushing = (props) => {

    // CONSTANT METADATA    
    const dataset     = props.dataset;
    const method      = props.method;
    const sample_rate = props.sample;
    const resolution  = props.resolution;
    const url = props.url;

    let loaded = false;

    // CONSTANT DATA 
    let emb,             // positions
        density,         // initial snn density of points
        pointLen,        // number of points
        groups,          // grouping info (currently [0, 0, ....])
        originGroups;    // original Groups info (for undo operation with Alt)

    let colors = generateColors();
    const colorNum = 10;

    // NOTE Group Management
    let groupInfo = [0];
    let groupNum = 1; // current No. of brushed group
    let groupButtonsSvg;


    function updateGroupButtons() {
        groupButtonsSvg.selectAll("rect").remove();
        groupButtonsSvg.selectAll("rect")
                    .data(groupInfo)
                    .enter()
                    .append("rect")
                    .attr("fill", (d, idx) => d3.rgb(colors[idx + 1][0], colors[idx + 1][1], colors[idx + 1][2]))
                    .attr("width", 40)
                    .attr("height", 40)
                    .attr("transform", (d, i) => "translate(" + (i * 50 + 5) + "," + 10 + ")")
                    .attr("stroke-width", (d, i) => {
                        if (i === groupNum - 1) return 4;
                        else                return 0;
                    })
                    .attr("stroke", "black")
    }

    function updateGroupText() {
        groupButtonsSvg.selectAll("text").remove();
        groupButtonsSvg.selectAll("text")
                       .data(groupInfo)
                       .enter()
                       .append("text")
                       .attr("transform", (d, i) => "translate(" + (i * 50 + 25) + "," + 35 + ")")
                       .text(d => d)
                       .attr("fill", "white")
                       .style("font-weight", "bold")
                       .attr("text-anchor", "middle")
    }

    useEffect(() => {
        groupButtonsSvg = d3.select("#groupButtons")   
                            .attr("width", props.size)
                            .attr("height", props.size * 0.15);
        updateGroupButtons();
        updateGroupText();
    }, [])

    function addGroup(e) {
        if(groupNum == colorNum) { alert("Cannot add more groups"); return; }
        groupNum += 1;
        groupInfo.push(0);
        originGroups = groups.map(d => d);
        updateGroupButtons();
        updateGroupText();
        update(0, 2, 2, props.size, emb, false)
    }



    // CONSTANT SCATTERPLOT_DATA
    const splotRef = useRef(null);
    let scatterplot;
    let radius = 15;
    let border = 3;

    // NOTE INITAL SCATTERPLOT RENDERING
    useEffect(async () => {
        // initial data extraction
        await axios.get(url + "init", {
            params: {
                dataset: dataset,
                method : method,
                sample : sample_rate
            }
        }).then(response => {
            emb      = response.data.emb;
            density  = response.data.density;
            pointLen = density.length;
            groups   = new Array(pointLen).fill(0); // grouping info (currently [0, 0, ....])
            originGroups = new Array(pointLen).fill(0);
        })

        // rendering
        const data = {
            position: emb,
            opacity: density,
            color : new Array(pointLen).fill([0, 0, 0]),
            radius : new Array(pointLen).fill(radius),
            border : new Array(pointLen).fill(border)
        };
        scatterplot = new Scatterplot(data, splotRef.current);
        loaded = true;

    }, [props, splotRef])





    // NOTE BRUSHER Setting
    let bX = -2;    // x coordinates of the brusher  (range: -1 ~ 1)
    let bY = -2;    // y coordinates of the brusher  (range: -1 ~ 1)
    let bR =  20;    // radius of the brusher  
    let minbR = 5;
    let maxbR = 60;

    let isClicking = false;
    let isAltPressed = false;
    let isShiftPressed = false;

    let defaultOpacity = 0.2;
    let clickedOpacity = 0.5;

    let wheelSensitivity = 1;

    function updateWheelSensitivity (e) {
        wheelSensitivity = e.target.value / 25;
    }

    

    useEffect(() => {
        let brusherSvg = d3.select("#brusherSvg");
        let brusher = brusherSvg.append("circle")
                                .attr("fill", "green")
                                .attr("r", bR)
                                .attr("transform", "translate(" + 300 + "," + 300 + ")")
                                .style("opacity", 0);

        // interactuib for the circle
        splotRef.current.addEventListener("mouseover", function(e) {
            brusher.transition()
                    .duration(300)
                    .style("opacity", defaultOpacity);
        });
        splotRef.current.addEventListener("mousemove", function(e) {
            bX = e.offsetX;
            bY = e.offsetY;
            brusher.attr("transform", "translate(" + bX + "," + bY + ")")
        });
        splotRef.current.addEventListener("mouseout", function() {
            brusher.transition()
                   .duration(300)
                   .style("opacity", 0);
        });
        splotRef.current.addEventListener("wheel", e => {
            bR = bR * ((100 - e.deltaY * wheelSensitivity) / 100);
            bR = bR < minbR ? minbR : bR;
            bR = bR > maxbR ? maxbR : bR;
            brusher.attr("r", bR);
        })
        splotRef.current.addEventListener("mousedown", e => { 
            isClicking = true;  
            brusher.style("opacity", clickedOpacity);
        })
        splotRef.current.addEventListener("mouseup"  , e => { 
            isClicking = false; 
            brusher.style("opacity", defaultOpacity);
        })
        document.addEventListener("keydown", e => {
            if (e.key === "Alt") {
                if (isShiftPressed) return;
                brusher.attr("fill", "red");
                isAltPressed = true;
            };
            if (e.key === "Shift") {
                if (isAltPressed) return;
                brusher.attr("fill", "blue")
                isShiftPressed = true;
            }
        })
        document.addEventListener("keyup", e => {
            if (e.key === "Alt") {
                brusher.attr("fill", "green");
                isAltPressed = false;
            };
            if (e.key === "Shift") {
                brusher.attr("fill", "green");
                isShiftPressed = false;
            };
        })
    });



    // NOTE Contour setting

    let contourSvg , contourOffsetSvg;
    let contourPath, contourOffsetPath;
    const line = d3.line()
                   .curve(d3.curveCardinal)
                   .x(d => props.size * 0.5 * (d[0] + 1))
                   .y(d => - props.size * 0.5 * (d[1] - 1));

    useEffect(() => {
        contourSvg       = d3.select("#contourSvg").append("g");
        contourOffsetSvg = d3.select("#contourSvg").append("g");

    
        contourPath = contourSvg.append("path")
                                .attr("stroke", "red")
                                .attr("stroke-width", 3)
                                .attr("fill", "none")
                                .style("opacity", 0);

        contourOffsetPath = contourOffsetSvg.append("path")
                                            .attr("stroke", "blue")
                                            .attr("stroke-width", 3)
                                            .attr("fill", "none")
                                            .style("opacity", 0);

    },[])

 

    // NOTE EventListener for Scatterplot / Contour

    let updateExecutor = null;
    let positionUpdateExecutor = null;

    let updateInterval = 50
    let duration = updateInterval * 0.8;

    let positionUpdateWaitingTime = 500;
    let positionDuration = 1000;

    let positionUpdating = false;

    function positionUpdate(consideringPoints) {

        positionUpdating = true;
        let start = Date.now();
        
        
        axios.get(url + "positionupdate", {
            params: {
                index: { data : consideringPoints }, 
                resolution: 50,
                scale4offset: 100,
                offset : 3.5,   // ratio compared to resolution
                threshold : 0.35,
            }
        }).then(response => {

            let end = Date.now();
            // console.log(end - start)



            let contourPoints = response.data.contour;
            contourPoints.push(contourPoints[0]);

            let contourOffsetPoints = response.data.contour_offsetted;
            contourOffsetPoints.push(contourOffsetPoints[0]);
            contourPath.attr("d", line(contourPoints))
                       .transition()
                       .duration(positionDuration)
                       .style("opacity", 1);
            contourOffsetPath.attr("d", line(contourOffsetPoints))
                             .transition()
                             .duration(positionDuration)
                             .style("opacity", 1);
            
            let newPositions = response.data.new_positions;
            let newEmb = [];
            emb.forEach((d, i) => { newEmb.push([d[0], d[1]]); });
            newPositions.forEach(d => {
                newEmb[d[0]][0] = d[1];
                newEmb[d[0]][1] = d[2];
            })

            const newPositionData = {
                position: newEmb
            };
            scatterplot.update(newPositionData, positionDuration , 0);
            
        })
    }


    function update(bR, bX, bY, size, emb, isClicking) {
        if(!loaded) return;
        if(positionUpdating) return;


        bR = (bR / size) * 2;
        bX = (bX / size) * 2 - 1;
        bY = - (bY / size) * 2 + 1;

        let mouseoverPoints = getMouseoverPoints(bR, bX, bY, emb);

        if (!isShiftPressed && !isAltPressed) mouseoverPoints = mouseoverPoints.filter(idx => groups[idx] === 0)
        
        if(isClicking) {
            if (!isAltPressed) mouseoverPoints.forEach(idx => { 
                if (groups[idx] > 0) groupInfo[groups[idx] - 1] -= 1;
                groups[idx] = groupNum; 
                groupInfo[groupNum - 1] += 1;
            });
            else               mouseoverPoints.forEach(idx => { 
                if (groups[idx] === groupNum) {
                    if (originGroups[idx] > 0) {
                        groupInfo[originGroups[idx] - 1] += 1;
                        groups[idx] = originGroups[idx];
                    }
                    else {
                        groups[idx] = 0;
                    }
                    groupInfo[groupNum - 1] -= 1;
                }
                groups[idx] = originGroups[idx]; 

            });
            updateGroupText();
        }

        let groupPoints = groups.reduce((acc, cur, idx) => {
            if (cur === groupNum) acc.push(idx);
            return acc;
        }, []);

        let consideringPointsSet = new Set(groupPoints.concat(mouseoverPoints))
        let consideringPoints = [...consideringPointsSet]

        if (consideringPoints.length > 0) {
            // Start waiting for position update
            if (positionUpdateExecutor === null) {
                positionUpdateExecutor = setTimeout(() => {
                    positionUpdate(consideringPoints);
                }, positionUpdateWaitingTime);
            }

            // update similarity
            axios.get(url + "similarity", {
                params: { index: { data: consideringPoints } }
            }).then(response => {

                const sim = response.data;
                const colorlist = sim.map((s, i) => { 
                    let c = [0, 0, 0];
                    if (groups[i] > 0) c = colors[groups[i]];
                    else {
                        if (consideringPointsSet.has(i)) c = colors[groupNum];
                        else if (s > 0) c = colors[groupNum];
                    }
                    return c;
                });
                const opacitylist = sim.map((s, i) => { 
                    // opacity = 0.1;
                    let opacity;
                    if (groups[i] > 0 && groups[i] !== groupNum) {
                        if (isShiftPressed) opacity = density[i];
                        else opacity = 1;
                    }
                    else if (groups[i] === groupNum) opacity = 1;
                    else opacity = s > 0 ? s : density[i];
                    return opacity;
                });
                let radlist = new Array(pointLen).fill(radius);
                let borderlist = new Array(pointLen).fill(border);
                consideringPoints.forEach(e => {
                    borderlist[e] = borderlist[e] * 2;
                    radlist[e]    = radlist[e] * 1.4;
                });

                const data = {
                    position: emb,
                    opacity : opacitylist,
                    color   : colorlist,
                    radius  : radlist,
                    border  : borderlist
                };
                scatterplot.update(data, duration, 0);
            });
        }
        else {
            const colorlist = groups.map(gNum => colors[gNum]);
            const opacitylist = groups.map((gNum, i) => gNum > 0 ? 1 : density[i]);
            const data = {
                position: emb,
                opacity : opacitylist,
                color : colorlist,
                radius : new Array(pointLen).fill(radius),
                border : new Array(pointLen).fill(border)
            }
            scatterplot.update(data, duration, 0);
        }
    }

    useEffect(async () => {
        splotRef.current.addEventListener("mouseover", function() {
            if (!loaded) return;
            updateExecutor = setInterval(() => {
                update(bR, bX, bY, props.size, emb, isClicking);
            }, updateInterval);
        })

        splotRef.current.addEventListener("mousemove", function() {
            clearTimeout(positionUpdateExecutor);
            positionUpdateExecutor = null;
            positionUpdating = false;
            contourPath.transition().duration(100).style("opacity", 0);
            contourOffsetPath.transition().duration(100).style("opacity", 0);
        })

        splotRef.current.addEventListener("mouseout", function() {
            clearInterval(updateExecutor);
            update(0, bX, bY, props.size, emb, isClicking);
            updateExecutor = null;
        })
    }, [props, splotRef]);




    



    /*

    // FOR HEATMAP
    const resolution = 100;  // resol * resol
    let hmapData = heatmapData(resolution);


    const hmapRef = useRef(null);
    let heatmap;

    useEffect(() => {
        heatmap = new Heatmap({
            resolution: resolution,
            pixelValue: hmapData
        }, hmapRef.current);
    }, [hmapRef]);
    

    function updateHeatmap() {
        let newPixelValue = heatmapData(resolution);
        heatmap.update({
            pixelValue: newPixelValue
        }, 1000, 0);
    }



    */
        
    


    return (
        <div>
            {/* For Hyperparameter change */}
            <div style={{position: "absolute", top: 10, left: 10, display: "flex"}}>
                <div style={{width: 205}}>
                    Wheel sensitivity
                </div>
                <input 
                    type="range"
                    min={1} 
                    max={50}
                    defaultValue={25} 
                    onChange={updateWheelSensitivity}
                    className="slider"
                />
            </div>
            <div style={{position: "absolute", top: 30}}>
                {/* <canvas
                    ref={hmapRef}
                    width={props.size}
                    height={props.size}
                    style={{
                        border: "1px black solid",
                        margin: "10px",
                        width: props.size,
                        height: props.size,
                        position: "absolute"
                    }}
                /> */}
                <canvas 
                    ref={splotRef}
                    width={props.size * 2}
                    height={props.size * 2}
                    style={{
                        border: "1px black solid",
                        margin: "10px",
                        width: props.size,
                        height: props.size,
                        position: "absolute"
                    }}
                />
                <svg
                    id={"brusherSvg"}
                    width={props.size}
                    height={props.size}
                    style={{
                        border: "1px black solid",
                        margin: "10px",
                        width: props.size,
                        height: props.size,
                        position: "absolute",
                        pointerEvents: "none"
                    }}
                />
                <svg
                    id={"contourSvg"}
                    width={props.size}
                    height={props.size}
                    style={{
                        border: "1px black solid",
                        margin: "10px",
                        width: props.size,
                        height: props.size,
                        position: "absolute",
                        pointerEvents: "none"
                    }}
                />
            </div>
            <div style={{position: "absolute", top: 540, margin: 10}}>
                <svg id="groupButtons"></svg>
                <button onClick={addGroup}>Click to Add Groups</button>
            </div>
            {/* For Fake Data generation */}
            <div >
                {/* <button onClick={updateHeatmap}>Click to update Heatmap</button> */}
            </div>
        </div>
    );
}

export default Brushing;