import React, { useRef, useEffect} from 'react';
import * as d3 from "d3";
import axios from 'axios';

import { updateSelectionButtons, updateSelectionText } from "./subcomponents/selectionStatus";
import { eraseBrushedArea, initializeBrushedArea, updateBrushedArea } from "./subcomponents/brushedArea";
import { initializeBrusher, addSplotEventListener, documentEventListener } from './subcomponents/brusher';
import { initialSplotRendering} from "./subcomponents/renderingScatterplot";
import { getConsideringPoints, getSimilarity, getUpdatedPosition, restoreOrigin, updateOrigin, restoreIdx } from "./subcomponents/serverDataManagement";
import { updateSelectionInfo, restoreOtherSelections, addSpaceToSelectionInfos } from "./subcomponents/selectionManagement";
import { initialProjectionExecutor } from "./subcomponents/showPrevProjections"

import { scatterplotStyle, widthMarginStyle, sizeMarginStyle } from "../helpers/styles";
import { initialSplotAxiosParam } from '../helpers/axiosHandler';
import { updatePosition, updatePositionSim, updateSim } from "../helpers/executor";
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
        click: false, alt: false, shift: false, ctrl: false,
        mode: Mode.NORMAL, 
        step: Step.NOTBRUSHING 
    }; 
    const updateExecutor = { pos: null, sim: null, brush: null };            //  animation executor
    const flag = { loaded: false, posUpdating: false, brushing: false, mouseout: true };
    
    // CONSTANT Paremeters for position update query
    const scale4offset = 100;
    const offset       = 5;
    const kdeThreshold = 0.35;
    let   simThreshold = 0.6;

    // CONSTANT DATA 
    let emb;             // positions
    let initialEmb;      // initial positions
    let originEmb;       // original positions
    let density;         // initial snn density of points
    let pointLen;        // number of points

    // CONSTANT for managing selections
    let currSelections;          // grouping status for all points(currently [0, 0, ....])
    let prevSelections;    // previous grouping status for all points (for undo operation with Alt)
    let currSelectionNum = 1; // current number (index) of brushing selection
    let selectionStatusDiv;
    const selectionInfo = [0, 0];  // selection info per group
    const overwritedSelectionInfo = [[0, 0], [0, 0]]; // overwitied info

    // CONSTANT Scatterplot / Brushing Management
    const splotRef = useRef(null);
    const simUpdateInterval = 50
    const simUpdateDuration = simUpdateInterval * 0.35;
    const positionUpdateWaitingTime = 600;
    const positionDuration = 600;

    /* CONSTANT Functions for adjusting constant parameters */
    function updateWheelSensitivity (e) { b.wheelSensitivity = e.target.value / 25; }
    function updateSimThreshold(e) { simThreshold = e.target.value / 100; }

    /* NOTE Selection Info Initialization */
    useEffect(() => {
        selectionStatusDiv = d3.select("#selectionStatus");
        updateSelectionButtons(selectionStatusDiv, selectionInfo, props.buttonSize, props.margin, props.colors);
        updateSelectionText(selectionStatusDiv, selectionInfo);
    }, []);

    /* NOTE Button onClick Functions */
    const addSelectionButtonRef = useRef(null)
 
    /* NOTE Adding new Selection */
    function addSelection(e) {
        if (currSelectionNum === maxSelection) { alert("Cannot add more selections!!"); return; }

        currSelectionNum += 1;
        addSpaceToSelectionInfos(selectionInfo, overwritedSelectionInfo);
        prevSelections = deepcopyArr(currSelections);
        props.getSelectionInfo(selectionInfo, overwritedSelectionInfo, positionDuration);

        updateSim(
            status, colors, density, pointLen, radius, border, 0, 
            currSelections, [], currSelectionNum, null
        ) 
        updateSelectionButtons(selectionStatusDiv, selectionInfo, props.buttonSize, props.margin, props.colors);
        updateSelectionText(selectionStatusDiv, selectionInfo);
        eraseBrushedArea(500);

        flag.posUpdating = false; flag.isBrushing = false;
        originEmb = deepcopyArr(emb);
        updateOrigin(url);
    }

    /* NOTE Show / disable initial embeddings */
    function initialProjection(e) { 
        initialProjectionExecutor(
            e, splotRef.current, initialEmb, emb, positionDuration,
            density, colors, currSelections, radius, border, pointLen, 
            addSelectionButtonRef.current
        ); 
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
        addSplotEventListener(splotRef.current, b, status);
        documentEventListener(status);
        initializeBrushedArea(props.size);
    }, []);

    /*  NOTE Interaction Executors */ 
    function initiateSimExecutorInterval() {
        if (flag.mouseout) return;
        if (status.click) return;
        // if (flag.posUpdating) return;
        clearInterval(updateExecutor.sim);
        updateExecutor.sim = setInterval(async () => {
            if (status.click || flag.posUpdating) { clearInterval(updateExecutor.sim);}
            if (flag.posUpdating) return;
            const mouseoverPoints   = getMouseoverPoints(b, props.size, emb);
            const [consideringPoints, _, __] = getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum);
            const sim = await getSimilarity(url, consideringPoints);
            updateSim (
                status, colors, density, pointLen, radius, border, simUpdateDuration, 
                currSelections, mouseoverPoints, currSelectionNum, sim
            );
        }, simUpdateInterval);
    }

    function clearSimExecutorInterval() {
        clearInterval(updateExecutor.sim);
        setTimeout(() => {
            updateSim(
                status, colors, density, pointLen, radius, border, simUpdateDuration, 
                currSelections, [], currSelectionNum, null
            );
        }, simUpdateDuration * 2)

    }

    function initiatePosExecutorTimeout() {
        updateExecutor.pos = setTimeout(async () => {
            bStop.bX = b.bX;
            bStop.bY = b.bY;
            const mouseoverPoints = getMouseoverPoints(b, props.size, emb);
            const [consideringPoints, prevSelectedPoints, pointSetIntersection] = getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum);
            
            setPosUpdatingFlag(flag, positionDuration * 1.5);
            if (
                mouseoverPoints.length !== 0 && 
               (pointSetIntersection.length !== 0 || 
                mouseoverPoints.length === consideringPoints.length)
            ) {
                status.step = Step.INITIALIZING; // should be fixed after adding brushing functionality
                const [newEmb, contour, offsettedContour] = await getUpdatedPosition (
                    url, emb, consideringPoints, prevSelectedPoints, resolution,
                    scale4offset, offset, kdeThreshold, simThreshold
                );
                if (status.click) { return; }
                updatePosition(status, newEmb, positionDuration);
                updateBrushedArea(contour, offsettedContour, positionDuration);
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
        eraseBrushedArea(positionDuration);
        restoreOrigin(url, flag); 
        initiateSimExecutorInterval();
    }

    function clearExecutors() {
        b.bX = -props.size; b.bY = -props.size; 
        bStop.bX = -props.size; bStop.bY = -props.size;
        clearSimExecutorInterval();
        clearPosExecutorTimeout();
        eraseBrushedArea(positionDuration);
        if (status.step === Step.INITIALIZING) setPosUpdatingFlag(flag, positionDuration)
        if (status.step === Step.INITIALIZING || status.step === Step.SKIMMING)
            setTimeout(() => { cancelPosInitialization(); }, positionDuration);
        status.step = Step.NOTBRUSHING;
    }

    let checkTime = positionDuration;
    function initiateBrushing() {
        status.step = Step.BRUSHING;
        clearInterval(updateExecutor.sim);
        clearTimeout(updateExecutor.pos);  updateExecutor.pos = null;


        function maintainBrushingExecutor () {
            if (!status.click) return;
            clearInterval(updateExecutor.sim);  // updateExecutor.sim = null;

            if (status.mode === Mode.ERASE && status.click && selectionInfo[currSelectionNum] === 0) {
                eraseBrushedArea(positionDuration * 0.5);
                setTimeout(() => { maintainBrushingExecutor(); } , positionDuration * 0.5)
                return;
            }

            const start = Date.now();

            let mouseoverPoints = getMouseoverPoints(b, props.size, emb);
            let [consideringPoints, prevSelectedPoints, pointSetIntersection] = getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum);
            
            if (
                mouseoverPoints.length !== 0 && 
                (pointSetIntersection.length !== 0 || 
                mouseoverPoints.length === consideringPoints.length)
            ) { 
                (async () => {
                    updateSelectionInfo(status, mouseoverPoints, prevSelections, currSelections, currSelectionNum, selectionInfo, overwritedSelectionInfo);
                    updateSelectionText(selectionStatusDiv, selectionInfo);
                    props.getSelectionInfo(selectionInfo, overwritedSelectionInfo, checkTime * 0.5);
                    mouseoverPoints = getMouseoverPoints(b, props.size, emb);
                    [consideringPoints, prevSelectedPoints, pointSetIntersection] = getConsideringPoints(mouseoverPoints, currSelections, currSelectionNum);
                    const [newEmb, contour, offsettedContour] = await getUpdatedPosition (
                        url, emb, consideringPoints, prevSelectedPoints, resolution,
                        scale4offset, offset, kdeThreshold, simThreshold
                    );
                    const sim = await getSimilarity(url, consideringPoints);
                    updatePositionSim(
                        newEmb, status, colors, density, pointLen, radius, border, checkTime * 0.5, 
                        currSelections, mouseoverPoints, currSelectionNum, sim
                    )
                    updateBrushedArea(contour, offsettedContour, checkTime * 0.5);
                    setTimeout(() => { emb = newEmb; }, checkTime * 0.5);
                    setTimeout(() => { 
                        emb = newEmb; 
                        checkTime = Date.now() - start;
                        maintainBrushingExecutor();
                    }, checkTime * 0.5);
                    return;
                })();
            }
            else {
                (async () => {
                    const sim = await getSimilarity(url, prevSelectedPoints);
                    setTimeout(() => {
                        maintainBrushingExecutor();
                    }, checkTime * 0.5);

                })();
                return;
            }
        }
        if (updateExecutor.brush === null)
        updateExecutor.brush =  setTimeout(() => {
            maintainBrushingExecutor();
           }, simUpdateDuration);
        
    }

    function clearBrushing() {
        if (status.step === Step.BRUSHING && selectionInfo[currSelectionNum] === 0) {
            status.step = Step.SKIMMING;
            cancelPosInitialization();
        }
        clearTimeout(updateExecutor.brush);
        updateExecutor.brush = null;

        let erasedAll = false;
        if (selectionInfo[currSelectionNum] === 0) { 
            eraseBrushedArea(positionDuration); 
            erasedAll = true;
        }
        console.log(erasedAll);
        
        setTimeout(() => {
            const [restoringEmb, restoringIdx] = restoreOtherSelections(emb, originEmb, currSelections, currSelectionNum, erasedAll);
            restoreIdx(url, flag, restoringIdx);
            updatePosition(status, restoringEmb, positionDuration * 0.5);
            setTimeout(() => { emb = restoringEmb; initiateSimExecutorInterval(); }, positionDuration * 0.5); 
        }, checkTime * 1.5);
    }

    useEffect(() => {
        splotRef.current.addEventListener("mouseover", () => {
            if (!flag.loaded) return;
            flag.mouseout = false;
            if (selectionInfo[currSelectionNum] === 0) status.step = Step.SKIMMING;
            else                                       status.step = Step.BRUSHING;
            initiateSimExecutorInterval();
        });

        splotRef.current.addEventListener("mousemove", (e) => {
            if (!flag.loaded) return;
            flag.mouseout = false;
            if ((status.step === Step.NOTBRUSHING || status.step === Step.SKIMMING))   { 
                status.step = status.step === Step.NOTBRUSHING ? Step.SKIMMING : status.step;
                // initiateSimExecutorInterval(); 
            }
            if (updateExecutor.pos !== null && status.step === Step.SKIMMING)   clearPosExecutorTimeout(); 
            if (status.step === Step.SKIMMING) initiatePosExecutorTimeout();
            if (status.step === Step.INITIALIZING && !flag.posUpdating && checkMoved(bStop, e))
                cancelPosInitialization();
        });

        splotRef.current.addEventListener("mouseout", () => { if (!flag.loaded) return; flag.mouseout = true; clearExecutors(); });
        splotRef.current.addEventListener("mousedown", () => { if (!flag.loaded) return; initiateBrushing(); });
        splotRef.current.addEventListener("mouseup", () => {  if (!flag.loaded) return; clearBrushing(); });

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
                        defaultValue={60} 
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
            {/* Selection Status */}
            <div id="selectionStatus" style={{margin: props.margin}}></div>
            <div style={Object.assign({}, widthMarginStyle(props.size, props.margin), { height: 30 })}>
                <button 
                    ref={addSelectionButtonRef}
                    className={"brushButtons"} 
                    onClick={addSelection}
                >Click to Add New Selections</button>
                <button 
                    className={"brushButtons"} 
                    onClick={initialProjection}
                >Show Initial Projection</button>
            </div>
        </div>
    );
}

export default Brushing;