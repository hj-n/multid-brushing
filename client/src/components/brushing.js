import React, { useRef, useEffect, useState } from 'react';
import * as d3 from "d3";
import axios from 'axios';

import { Scatterplot } from "../subcomponents/scatterplot";
import { heatmapData } from "../subcomponents/heatmapData";
import { Heatmap } from '../subcomponents/heatmap';
import { updateSelectionButtons, updateSelectionText } from "../subcomponents/selectionStatus";
import { eraseBrushedArea, initializeBrushedArea, updateBrushedArea } from "../subcomponents/brushedArea";
import { initializeBrusher, addSplotEventListener, documentEventListener } from '../subcomponents/brusher';
import { initialSplotRendering } from "../subcomponents/renderingScatterplot";
import { getConsideringPoints, getSimilarity, getUpdatedPosition, restoreOrigin } from "../subcomponents/serverDataManagement";

import { scatterplotStyle, widthMarginStyle, sizeMarginStyle } from "../helpers/styles";
import { initialSplotAxiosParam } from '../helpers/axiosHandler';
import { updatePosition, updateSim } from "../helpers/executor";

import { Mode, Step } from "../helpers/status";


import "../css/Brushing.css";
import { checkMoved, deepcopyArr, getMouseoverPoints } from '../helpers/utils';
import { setPosUpdatingFlag } from '../helpers/flagManagement';


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
    const bStop = {bX: -2, bY: -2};
    const status = { 
        click: false, alt: false, shift: false, 
        mode: Mode.NORMAL, 
        step: Step.NOTBRUSHING 
    }; 
    const updateExecutor = { pos: null, sim: null };            //  animation executor
    const flag = { loaded: false, posUpdating: false, brushing: false};
    
    // CONSTANT Paremeters for position update query
    const scale4offset = 100;
    const offset       = 5;
    const kdeThreshold = 0.35;
    let   simThreshold = 0.9;

    // CONSTANT DATA 
    let emb;             // positions
    let initialEmb;
    let originEmb;       // original positions
    let density;         // initial snn density of points
    let pointLen;        // number of points
    let currSelections;          // grouping status for all points(currently [0, 0, ....])
    let prevSelections;    // previous grouping status for all points (for undo operation with Alt)
    let selectionInfo = [0];  // selection info per group
    let currSelectionNum = 1; // current number (index) of brushing selection

    let selectionStatusDiv;

    // CONSTANT Scatterplot / Brushing Management
    const splotRef = useRef(null);

    const simUpdateInterval = 40
    const simUpdateDuration = simUpdateInterval * 0.8;
    const positionUpdateWaitingTime = 500;
    const positionDuration = 400;

    // CONSTANT Functions for adjusting constant parameters

    function updateWheelSensitivity (e) { b.wheelSensitivity = e.target.value / 25; }
    function updateSimThreshold(e) { simThreshold = e.target.value / 100; }

    /* NOTE Selection Info Initialization */
    useEffect(() => {
        selectionStatusDiv = d3.select("#selectionStatus");
        updateSelectionButtons(selectionStatusDiv, selectionInfo, props.buttonSize, props.margin, props.colors);
        updateSelectionText(selectionStatusDiv, selectionInfo);
    }, []);
 
    /* NOTE Adding new Selection */
    function addSelection(e) {
        if (currSelectionNum == maxSelection) { alert("Cannot add more selections!!"); return; }

        currSelectionNum += 1;
        selectionInfo.push(0);
        prevSelections = currSelections.map(d => d);

        updateSim({bR: 0, bX: 2, bY: 2}, flag, status, props.size, emb, false, density, pointLen, currSelections)
        updateSelectionButtons(selectionStatusDiv, selectionInfo, props.buttonSize, props.margin, props.colors);
        updateSelectionText(selectionStatusDiv, selectionInfo);
        eraseBrushedArea(500);

        flag.posUpdating = false; flag.brushing = false;
        originEmb = emb;
    }

    /* NOTE SCATTERPLOT Initialization */
    useEffect(async () => {
        await axios.get(url + "init", initialSplotAxiosParam(dataset, method, sample_rate)).then(response => {
            emb        = response.data.emb;
            initialEmb = JSON.parse(JSON.stringify(emb))
            originEmb  = JSON.parse(JSON.stringify(emb))
            density    = response.data.density;
            pointLen   = density.length;
            currSelections = new Array(pointLen).fill(0); // grouping info (currently [0, 0, ....])
            prevSelections = new Array(pointLen).fill(0);
        })
        initialSplotRendering(emb, density, pointLen, radius, border, splotRef);
        flag.loaded = true;
    }, [props, splotRef])

    /* NOTE Brusher / Brushed Area Interaction Setting */
    useEffect(() => {        
        initializeBrusher(b);
        addSplotEventListener(splotRef.current, b, status, updateExecutor);
        documentEventListener(status);
        initializeBrushedArea(props.size);
    }, []);

 

    let groupPoints, consideringPoints;
    let overlay = false;


    /* NOTE  Updating Similarity */

    /*
    function updateSim(b, size, emb, isClicking, colors) {
        if(!flag.loaded) return;  // return if not loaded

        // find the points which are "overed" by the mouse
        let mouseoverPoints = getMouseoverPoints(b, size, emb);
        let mouseoverUnfilteredPoints = Array.from(mouseoverPoints);
        if (status.mode === Mode.NORMAL) 
            mouseoverPoints = mouseoverPoints.filter(idx => currSelections[idx] === 0);

        // 
        if(isClicking) {
            if (!status.alt) mouseoverPoints.forEach(idx => { 
                if (currSelections[idx] > 0) selectionInfo[currSelections[idx] - 1] -= 1;
                currSelections[idx] = currSelectionNum; 
                selectionInfo[currSelectionNum - 1] += 1;
            });
            else               mouseoverPoints.forEach(idx => { 
                if (currSelections[idx] === currSelectionNum) {
                    if (prevSelections[idx] > 0) {
                        selectionInfo[prevSelections[idx] - 1] += 1;
                        currSelections[idx] = prevSelections[idx];
                    }
                    else {
                        currSelections[idx] = 0;
                    }
                    selectionInfo[currSelectionNum - 1] -= 1;
                }
                currSelections[idx] = prevSelections[idx]; 

            });
            updateSelectionText(selectionStatusDiv, selectionInfo);
        }

        groupPoints = currSelections.reduce((acc, cur, idx) => {
            if (cur === currSelectionNum) acc.push(idx);
            return acc;
        }, []);

        let consideringPointsSet = new Set(groupPoints.concat(mouseoverPoints))
        consideringPoints = [...consideringPointsSet]


        // console.log(consideringPointsSet.size)
        // console.log(groupPoints.length, mouseoverUnfilteredPoints.length)
        if(consideringPointsSet.size < groupPoints.length + mouseoverUnfilteredPoints.length 
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

            // console.log(flag.posUpdating, status.click, updateExecutor.pos)

            if (!flag.posUpdating && !status.click) { // default) 
                if (updateExecutor.pos === null) {
                    updateExecutor.pos = setTimeout(() => {
                        if (overlay) positionUpdate(consideringPoints, groupPoints);
                        // updateExecutor.pos = null;
                    }, positionUpdateWaitingTime);
                }
            }
            if (flag.posUpdating && !status.click) {
                // if (updateExecutor.pos === null) {
                //     updateExecutor.pos = setTimeout(() => {
                //         positionUpdate(consideringPoints, groupPoints);
                //         updateExecutor.pos = null;
                //     }, positionUpdateWaitingTime); 
                // }

            }
            if (!flag.posUpdating && status.click) {

            }
            if (flag.posUpdating && status.click) {
                
                if (updateExecutor.pos === null) {
                    updateExecutor.pos = setInterval(() => {
                        if (overlay) positionUpdate(consideringPoints, groupPoints);
                    }, positionUpdateWaitingTime);
                    flag.brushing = true;
                }

                
            }
            // else if (flag.posUpdating && )  {

            // }
            // if(flag.posUpdating) {
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
                        if (consideringPointsSet.has(i)) c = colors[currSelectionNum];
                        else if (s > 0) c = colors[currSelectionNum];
                    }
                    return c;
                });
                const opacitylist = sim.map((s, i) => { 
                    // opacity = 0.1;
                    let opacity;
                    if (currSelections[i] > 0 && currSelections[i] !== currSelectionNum) {
                        if (status.shift) opacity = density[i];
                        else opacity = 1;
                    }
                    else if (currSelections[i] === currSelectionNum) opacity = 1;
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
                        if (currSelections[i] === currSelectionNum) c = [0, 0, 0];
                        else c = colors[currSelections[i]];
                    }
                    else {
                        if (consideringPointsSet.has(i)) c = colors[currSelectionNum];
                        if (s > 0) c = colors[currSelectionNum];
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
                scatterplot.update(data, flag.brushing? positionDuration : simUpdateDuration, 0);
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
            scatterplot.update(data, simUpdateDuration, 0);
        }
    }

    


    // NOTE EventListener for Scatterplot / Contour 

    
    function positionUpdate(consideringPoints, groupPoints) {

        
        if (consideringPoints.length === 0) return;

        flag.posUpdating = true;
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

    */

    function initiateSimExecutorInterval() {
        status.step = Step.SKIMMING;
        updateExecutor.sim = setInterval(async () => {
            if (flag.posUpdating) return;
            const mouseoverPoints   = getMouseoverPoints(b, props.size, emb);
            const [consideringPoints, _, __] = getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum);
            const sim = await getSimilarity(url, consideringPoints);
            updateSim (
                flag, status, colors, density, pointLen, radius, border, simUpdateDuration, 
                currSelections, mouseoverPoints, currSelectionNum, sim
            );
        }, simUpdateInterval);
    }

    function clearSimExecutorInterval() {
        clearInterval(updateExecutor.sim);
        status.step = Step.NOTBRUSHING;
        updateSim(
            flag, status, colors, density, pointLen, radius, border, simUpdateDuration, 
            currSelections, [], currSelectionNum, null
        );
        updateExecutor.sim = null;
    }

    function initiatePosExecutorTimeout() {
        updateExecutor.pos = setTimeout(async () => {
            bStop.bX = b.bX;
            bStop.bY = b.bY;
            const mouseoverPoints = getMouseoverPoints(b, props.size, emb);
            const [consideringPoints, prevSelectedPoints, pointSetIntersection] = getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum);
            if (
                mouseoverPoints.length !== 0 && 
               (pointSetIntersection.length !== 0 || 
                mouseoverPoints.length === consideringPoints.length)
            ) {
                status.step = Step.INITIALIZING; // should be fixed after adding brushing functionality
                const newEmb = await getUpdatedPosition (
                    url, emb, consideringPoints, prevSelectedPoints, resolution,
                    scale4offset, offset, kdeThreshold, simThreshold
                );
                updatePosition(status, newEmb, positionDuration);
                setPosUpdatingFlag(flag, positionDuration);
                emb = newEmb;
            }
        }, positionUpdateWaitingTime);
    }
    
    function clearPosExecutorTimeout() {
        clearTimeout(updateExecutor.pos);
        updateExecutor.pos = null;
    }

    function cancelPosInitialization() {
        status.step = Step.SKIMMING;
        emb = deepcopyArr(originEmb);

        updatePosition(status, emb, positionDuration);
        restoreOrigin(url, flag);
    }

    function clearExecutors() {
        clearSimExecutorInterval();
        clearPosExecutorTimeout();
        setTimeout(() => { cancelPosInitialization(); }, positionDuration);
        setPosUpdatingFlag(flag, positionDuration * 2)
        b.bX = -props.size; b.bY = -props.size; 
        bStop.bX = -props.size; bStop.bY = -props.size;
        status.step = Step.NOTBRUSHING;
    }

    useEffect(() => {

        splotRef.current.addEventListener("mouseover", () => {
            if (!flag.loaded) return;
            initiateSimExecutorInterval();
        });

        splotRef.current.addEventListener("mousemove", (e) => {
            if (!flag.loaded) return;
            if (updateExecutor.sim === null)   initiateSimExecutorInterval();
            if (updateExecutor.pos !== null)   clearPosExecutorTimeout();     
            if (status.step === Step.SKIMMING) initiatePosExecutorTimeout();
            if (status.step === Step.INITIALIZING && !flag.posUpdating && checkMoved(bStop, e))
                cancelPosInitialization();
        });

        splotRef.current.addEventListener("mouseout", () => { 
            clearExecutors();
        });

        // splotRef.current.addEventListener("mousemove", function(e) {
        //     if (!flag.loaded) return;
        //     if (updateExecutor.sim == null) {
        //         updateExecutor.sim = setInterval(() => {
        //             updateSim(b, props.size, emb, status.click, colors);
        //         }, simUpdateInterval);
        //     }

        //     if(!status.click) {
        //         clearTimeout(updateExecutor.pos);
        //         updateExecutor.pos = null;
        //     }

        //     if (flag.posUpdating) {
        //         if (!status.click) {
        //             if (Math.abs(b.bX - e.offsetX) + Math.abs(b.bY - e.offsetY) < 30) return;
        //             const t = positionDuration * 0.6
        //             // contourPath.transition().duration(t).style("opacity", 0);
        //             // contourOffsetPath.transition().duration(t).style("opacity", 0);
        //             eraseBrushedArea(t);
        //             if (!flag.brushing) {
        //                 emb = originEmb;
        //             }
        //             const data = {
        //                 position: emb
        //             };
        //             scatterplot.update(data, t, 0)
        //             setTimeout(() => {
        //                 flag.posUpdating = false;
        //             }, positionDuration * 0.5);
        //         }
        //     }

        // });
        // splotRef.current.addEventListener("mouseout", function() {
        //    
        // });
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
                    width={props.size * 4}
                    height={props.size * 4}
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
                <button className={"selection"} onClick={addSelection}>Click to Add New Selections</button>
            </div>
            <div id="selectionStatus" style={{display: 'flex'}}></div>
        </div>
    );
}

export default Brushing;