import React, { useRef, useEffect, useState } from 'react';
import * as d3 from "d3";
import axios from 'axios';

import { Scatterplot } from "../subcomponents/scatterplot";
import { heatmapData } from "../subcomponents/heatmapData";
import { Heatmap } from '../subcomponents/heatmap';
import { updateSelectionButtons, updateSelectionText } from "../subcomponents/selectionStatus";
import { eraseBrushedArea, initializeBrushedArea, updateBrushedArea } from "../subcomponents/brushedArea";
import { initializeBrusher, addSplotEventListener, documentEventListener } from '../subcomponents/brusher';

import { getMouseoverPoints } from "../helpers/utils";
import { scatterplotStyle, widthMarginStyle, sizeMarginStyle } from "../helpers/styles";


import "../css/Brushing.css";

const Brushing = (props) => {

    // CONSTANT METADATA    
    const dataset     = props.dataset;
    const method      = props.method;
    const sample_rate = props.sample;
    const resolution  = props.resolution;
    const url = props.url;

    const radius = props.radius;
    const border = props.border;
    const maxSelection = props.maxSelection;
    const colors = props.colors;

    // CONSTANT MAINTAINERS (Brusher info, interaction status, update executor, and Flags, etc.)

    const b = { bX: -2, bY: -2, bR: 20, wheelSensitivity: 1 };  // Brusher info maintainer
    const status = { click: false, alt: false, shift: false };
    const updateExecutor = { pos: null, sim: null };            //  animation executor
    const flag = { loaded: false, updatePos: false, brushing: false};
    
    let simThreshold = 0.9;

    // CONSTANT DATA 
    let emb;             // positions
    let initialEmb;
    let originEmb;       // original positions
    let density;         // initial snn density of points
    let pointLen;        // number of points
    let currSelections;          // grouping status for all points(currently [0, 0, ....])
    let prevSelections;    // previous grouping status for all points (for undo operation with Alt)
    let selectionInfo = [0];  // selection info per group
    let currentSelectionNum = 1; // current number (index) of brushing selection

    let selectionStatusDiv;

    // CONSTANT Scatterplot Management
    const splotRef = useRef(null);
    let scatterplot;

    // CONSTANT Functions for adjusting constant parameters

    function updateWheelSensitivity (e) { b.wheelSensitivity = e.target.value / 25; }
    function updateSimThreshold(e) { simThreshold = e.target.value / 100; }

    /* NOTE Selection Management */
    // Initialization 
    useEffect(() => {
        selectionStatusDiv = d3.select("#selectionStatus");
        updateSelectionButtons(selectionStatusDiv, selectionInfo, props.buttonSize, props.margin, props.colors);
        updateSelectionText(selectionStatusDiv, selectionInfo);
    }, []);
 
    // Adding new group
    function addGroup(e) {
        if (currentSelectionNum == maxSelection) { alert("Cannot add more selections!!"); return; }

        currentSelectionNum += 1;
        selectionInfo.push(0);
        prevSelections = currSelections.map(d => d);

        update(0, 2, 2, props.size, emb, false)
        updateSelectionButtons(selectionStatusDiv, selectionInfo, props.buttonSize, props.margin, props.colors);
        updateSelectionText(selectionStatusDiv, selectionInfo);
        eraseBrushedArea(500);

        flag.updatePos = false; flag.brushing = false;
        originEmb = emb;
    }


    // NOTE SCATTERPLOT Setting
    //// Initialization
    useEffect(async () => {
        await axios.get(url + "init", {
            params: {
                dataset: dataset,
                method : method,
                sample : sample_rate
            }
        }).then(response => {
            emb        = response.data.emb;
            initialEmb = JSON.parse(JSON.stringify(emb))
            originEmb  = JSON.parse(JSON.stringify(emb))
            density    = response.data.density;
            pointLen   = density.length;
            currSelections = new Array(pointLen).fill(0); // grouping info (currently [0, 0, ....])
            prevSelections = new Array(pointLen).fill(0);
        })

        // rendering
        const data = {
            position: emb,
            opacity: density,
            color : new Array(pointLen).fill([0, 0, 0]),
            radius : new Array(pointLen).fill(radius),
            border : new Array(pointLen).fill(border),
            borderColor : new Array(pointLen).fill([0, 0, 0])
        };
        scatterplot = new Scatterplot(data, splotRef.current);
        flag.floaded = true;

    }, [props, splotRef])



    // NOTE Brusher / Brushed Area Interaction Setting (Especially for the brushing)



    useEffect(() => {        
        initializeBrusher(b);
        addSplotEventListener(splotRef.current, b, status, updateExecutor);
        documentEventListener(status);
        initializeBrushedArea(props.size);
    }, []);

 

    // NOTE EventListener for Scatterplot / Contour

    // let updateExecutor = null;
    // let positionUpdateExecutor = null;

    let updateInterval = 100
    let duration = updateInterval * 0.8;

    let positionUpdateWaitingTime = 600;
    let positionDuration = 400;

    // let positionUpdating = false;



    function positionUpdate(consideringPoints, groupPoints) {

        
        if (consideringPoints.length === 0) return;

        flag.updatePos = true;
        let start = Date.now();
        
        axios.get(url + "positionupdate", {
            params: {
                index: { data : consideringPoints }, 
                group: { data : groupPoints },
                resolution: props.resolution,
                scale4offset: 100,
                offset : 5,   // ratio compared to resolution
                threshold : 0.35,
                simthreshold : simThreshold
            }
        }).then(response => {

            let end = Date.now();
            // console.log(end - start)

            updateBrushedArea(response.data.contour, response.data.contour_offsetted, positionDuration);
            
            let newPositions = response.data.new_positions;
            let newEmb = [];
            emb.forEach((d, i) => { newEmb.push([d[0], d[1]]); });
            newPositions.forEach(d => {
                newEmb[d[0]][0] = d[1];
                newEmb[d[0]][1] = d[2];
            });

            const newPositionData = {
                position: newEmb
            };
            scatterplot.update(newPositionData, positionDuration, 0);
            emb = newEmb;
        })
    }

    let posX, posY;

    let groupPoints, consideringPoints;
    let overlay = false;

    function update(bR, bX, bY, size, emb, isClicking) {
        if(!flag.floaded) return;

        posX = bX
        posY = bY


        bR = (bR / size) * 2;
        bX = (bX / size) * 2 - 1;
        bY = - (bY / size) * 2 + 1;

       
        
        let mouseoverPoints = getMouseoverPoints(bR, bX, bY, emb);
        let mouseoverTempPoints = Array.from(mouseoverPoints);

        if (!status.shift && !status.alt) mouseoverPoints = mouseoverPoints.filter(idx => currSelections[idx] === 0)
        
        if(isClicking) {
            if (!status.alt) mouseoverPoints.forEach(idx => { 
                if (currSelections[idx] > 0) selectionInfo[currSelections[idx] - 1] -= 1;
                currSelections[idx] = currentSelectionNum; 
                selectionInfo[currentSelectionNum - 1] += 1;
            });
            else               mouseoverPoints.forEach(idx => { 
                if (currSelections[idx] === currentSelectionNum) {
                    if (prevSelections[idx] > 0) {
                        selectionInfo[prevSelections[idx] - 1] += 1;
                        currSelections[idx] = prevSelections[idx];
                    }
                    else {
                        currSelections[idx] = 0;
                    }
                    selectionInfo[currentSelectionNum - 1] -= 1;
                }
                currSelections[idx] = prevSelections[idx]; 

            });
            updateSelectionText(selectionStatusDiv, selectionInfo);
        }

        groupPoints = currSelections.reduce((acc, cur, idx) => {
            if (cur === currentSelectionNum) acc.push(idx);
            return acc;
        }, []);

        let consideringPointsSet = new Set(groupPoints.concat(mouseoverPoints))
        consideringPoints = [...consideringPointsSet]


        // console.log(consideringPointsSet.size)
        // console.log(groupPoints.length, mouseoverTempPoints.length)
        if(consideringPointsSet.size < groupPoints.length + mouseoverTempPoints.length 
           || groupPoints.length === 0 || groupPoints.length === consideringPointsSet.size) overlay = true;
        else overlay = false;

        // console.log(overlay)
        
        if (groupPoints.length === 0) flag.brushing = false;
    

        if (consideringPoints.length > 0) {
            // Start waiting for position update

            // if (updateExecutor.pos === null) {
            //     updateExecutor.pos = setTimeout(() => {
            //         positionUpdate(consideringPoints, groupPoints);
            //     }, positionUpdateWaitingTime);
            // }

            // console.log(flag.updatePos, status.click, updateExecutor.pos)

            if (!flag.updatePos && !status.click) { // default) 
                if (updateExecutor.pos === null) {
                    updateExecutor.pos = setTimeout(() => {
                        if (overlay) positionUpdate(consideringPoints, groupPoints);
                        // updateExecutor.pos = null;
                    }, positionUpdateWaitingTime);
                }
            }
            if (flag.updatePos && !status.click) {
                // if (updateExecutor.pos === null) {
                //     updateExecutor.pos = setTimeout(() => {
                //         positionUpdate(consideringPoints, groupPoints);
                //         updateExecutor.pos = null;
                //     }, positionUpdateWaitingTime); 
                // }

            }
            if (!flag.updatePos && status.click) {

            }
            if (flag.updatePos && status.click) {
                
                if (updateExecutor.pos === null) {
                    updateExecutor.pos = setInterval(() => {
                        if (overlay) positionUpdate(consideringPoints, groupPoints);
                    }, positionUpdateWaitingTime);
                    flag.brushing = true;
                }

                
            }
            // else if (flag.updatePos && )  {

            // }
            // if(flag.updatePos) {
            //     if (!status.click) return;
            //     else {
            //         
            //     }
            // }
            // else {
                
            //     else {
            //         // clearInterval(updateExecutor.pos);
            //         // updateExecutor.pos = null;
            //     }


            // }

            // update similarity
            axios.get(url + "similarity", {
                params: { index: { data: consideringPoints } }
            }).then(response => {

                const sim = response.data;
                const colorlist = sim.map((s, i) => { 
                    let c = [0, 0, 0];
                    if (currSelections[i] > 0) c = colors[currSelections[i]];
                    else {
                        if (consideringPointsSet.has(i)) c = colors[currentSelectionNum];
                        else if (s > 0) c = colors[currentSelectionNum];
                    }
                    return c;
                });
                const opacitylist = sim.map((s, i) => { 
                    // opacity = 0.1;
                    let opacity;
                    if (currSelections[i] > 0 && currSelections[i] !== currentSelectionNum) {
                        if (status.shift) opacity = density[i];
                        else opacity = 1;
                    }
                    else if (currSelections[i] === currentSelectionNum) opacity = 1;
                    else opacity = s > 0 ? s : density[i];
                    return opacity;
                });
                let radlist = new Array(pointLen).fill(radius);
                let borderlist = new Array(pointLen).fill(border);
                consideringPoints.forEach(e => {
                    borderlist[e] = borderlist[e] * 2;
                    radlist[e]    = radlist[e] * 1.4;
                });
                let borderColorList = sim.map((s, i) => {
                    let c = [0, 0, 0];
                    if (currSelections[i] > 0) {
                        if (currSelections[i] === currentSelectionNum) c = [0, 0, 0];
                        else c = colors[currSelections[i]];
                    }
                    else {
                        if (consideringPointsSet.has(i)) c = colors[currentSelectionNum];
                        if (s > 0) c = colors[currentSelectionNum];
                    }
                    return c;
                });

                const data = {
                    position: emb,
                    opacity : opacitylist,
                    color   : colorlist,
                    radius  : radlist,
                    border  : borderlist,
                    borderColor : borderColorList
                };
                scatterplot.update(data, flag.brushing? positionDuration : duration, 0);
            });
        }
        else {
            const colorlist = currSelections.map(gNum => colors[gNum]);
            const opacitylist = currSelections.map((gNum, i) => gNum > 0 ? 1 : density[i]);
            const data = {
                position: emb,
                opacity : opacitylist,
                color : colorlist,
                radius : new Array(pointLen).fill(radius),
                border : new Array(pointLen).fill(border),
                borderColor: new Array(pointLen).fill([0, 0, 0])
            }
            scatterplot.update(data, duration, 0);
        }
    }

    useEffect(async () => {
        splotRef.current.addEventListener("mouseover", function() {
            if (!flag.floaded) return;
            updateExecutor.sim = setInterval(() => {
                update(b.bR, b.bX, b.bY, props.size, emb, status.click);
            }, updateInterval);
        });

        splotRef.current.addEventListener("mousemove", function(e) {
            if(!status.click) {
                clearTimeout(updateExecutor.pos);
                updateExecutor.pos = null;
            }


            if (updateExecutor.sim == null) {
                updateExecutor.sim = setInterval(() => {
                    update(b.bR, b.bX, b.bY, props.size, emb, status.click);
                }, updateInterval);
            }

            if (flag.updatePos) {
                if (!status.click) {
                    if (Math.abs(posX - e.offsetX) + Math.abs(posY - e.offsetY) < 30) return;
                    const t = positionDuration * 0.6
                    // contourPath.transition().duration(t).style("opacity", 0);
                    // contourOffsetPath.transition().duration(t).style("opacity", 0);
                    eraseBrushedArea(t);
                    if (!flag.brushing) {
                        emb = originEmb;
                    }
                    const data = {
                        position: emb
                    };
                    scatterplot.update(data, t, 0)
                    setTimeout(() => {
                        flag.updatePos = false;
                    }, positionDuration * 0.5);
                }
            }

        });
        splotRef.current.addEventListener("mouseout", function() {
            clearInterval(updateExecutor.sim);
            update(0, b.bX, b.bY, props.size, emb, status.click);
            updateExecutor.sim = null;
        });
    }, [props, splotRef]);



    return (
        <div>
            {/* For Hyperparameter change */}
            <div id="hparams" style={widthMarginStyle(props.size, props.margin)}>
                <div className="hparam">
                    <div className="hname">Wheel sensitivity</div>
                    <input 
                        type="range"
                        min={1} 
                        max={50}
                        defaultValue={25} 
                        onChange={updateWheelSensitivity}
                        className="slider"
                    />
                </div>
                <div className="hparam">
                    <div className="hname">Similarity Threshold</div>
                    <input 
                        type="range"
                        min={1} 
                        max={100}
                        defaultValue={90} 
                        onChange={updateSimThreshold}
                        className="slider"
                    />
                </div>
            </div>
            {/* Scatterplot and other contours */}
            <div style={sizeMarginStyle(props.size, props.margin)}>
                <canvas 
                    ref={splotRef}
                    width={props.size * 2}
                    height={props.size * 2}
                    style={scatterplotStyle(props.size)}
                />
                <svg
                    id={"brusherSvg"}
                    width={props.size}
                    height={props.size}
                    style={Object.assign({}, { pointerEvents: "none" }, scatterplotStyle(props.size))}
                />
                <svg
                    id={"contourSvg"}
                    width={props.size}
                    height={props.size}
                    style={Object.assign({}, { pointerEvents: "none" }, scatterplotStyle(props.size))}
                />
            </div>
            {/* button to add new group */}
            <div style={Object.assign({}, widthMarginStyle(props.size, props.margin), { height: 30 })}>
                <button className={"selection"} onClick={addGroup}>Click to Add New Selections</button>
            </div>
            <div id="selectionStatus" style={{display: 'flex'}}></div>
        </div>
    );
}

export default Brushing;