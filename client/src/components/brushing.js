import React, { useRef, useEffect } from 'react';
import * as d3 from "d3";
import axios from 'axios';

import { RandomData } from '../subcomponents/data';
import { Scatterplot } from "../subcomponents/scatterplot";
import { heatmapData } from "../subcomponents/heatmapData";
import { Heatmap } from '../subcomponents/heatmap';
import { getMouseoverPoints} from "../helpers/update";

const Brushing = (props) => {

    // CONSTANT METADATA    
    const dataset     = props.dataset;
    const method      = props.method;
    const sample_rate = props.sample;
    const url = props.url;

    // CONSTANT DATA 
    let emb,             // positions
        density,         // initial snn density of points
        pointLen,        // number of points
        groups,          // grouping info (currently [0, 0, ....])
        originGroups,    // original Groups info (for undo operation with Alt)
        groupNum         // current No. of brushed group
    let loaded = false;


    // CONSTANT SCATTERPLOT_DATA
    const splotRef = useRef(null);
    let scatterplot;
    let radius = 15;

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
            groups   = new Array(pointLen).fill(0);
            originGroups = new Array(pointLen).fill(0);
            groupNum = 1;
        })

        // rendering
        const data = {
            position: emb,
            opacity: density,
            color : new Array(pointLen).fill([0, 0, 0]),
            radius : new Array(pointLen).fill(radius)
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
            if (e.code === "AltLeft") {
                brusher.attr("fill", "red");
                isAltPressed = true;
            };
        })
        document.addEventListener("keyup", e => {
            if (e.code === "AltLeft") {
                brusher.attr("fill", "green");
                isAltPressed = false;
            };
        })
    });



    // NOTE EventListener for Scatterplot
    let updateExecutor = null;

    let updateInterval = 100
    let duration = updateInterval * 0.8;

    async function update(bR, bX, bY, size, emb, isClicking) {
        if(!loaded) return;

        bR = (bR / size) * 2;
        bX = (bX / size) * 2 - 1;
        bY = - (bY / size) * 2 + 1;

        let mouseoverPoints = getMouseoverPoints(bR, bX, bY, emb);

        if(isClicking) {
            if (!isAltPressed) mouseoverPoints.forEach(idx => { groups[idx] = groupNum; });
            else               mouseoverPoints.forEach(idx => { groups[idx] = originGroups[idx]; });
        }

        let groupPoints = groups.reduce((acc, cur, idx) => {
            if (cur === groupNum) acc.push(cur);
            return acc;
        }, []);

        let consideringPoints = [...new Set(groupPoints.concat(mouseoverPoints))]

        if (consideringPoints.length > 0) {
            await axios.get(url + "similarity", {
                params: { index: { data: consideringPoints } }
            }).then(response => {
                const sim = response.data;
                const color = sim.map((s, i) => { 
                    return groups[i] === groupNum ? [255, 0, 0] : (s > 0 ? [255, 0, 0] : [0, 0, 0] )
                });
                const opacitylist = sim.map((s, i) => { 
                    return groups[i] === groupNum ? 1 : (s > 0 ? s : density[i])
                });
                let radlist = new Array(pointLen).fill(radius);
                consideringPoints.forEach(e => radlist[e] = radlist[e] * 1.3);
                const data = {
                    position: emb,
                    opacity : opacitylist,
                    color   : color,
                    radius  : radlist
                };
                scatterplot.update(data, duration, 0);
            });
        }
        else {
            const data = {
                position: emb,
                opacity : density,
                color : new Array(pointLen).fill([0, 0, 0]),
                radius : new Array(pointLen).fill(radius)
            }
            scatterplot.update(data, duration, 0);
        }
       
    }

    useEffect(async () => {
        splotRef.current.addEventListener("mouseover", function() {
            if (!loaded) return;
            updateExecutor = setInterval(() => {
                update(bR, bX, bY, props.size, emb, isClicking)
            }, updateInterval);
        })

        splotRef.current.addEventListener("mouseout", function() {
            clearInterval(updateExecutor);
            update(0, bX, bY, props.size, emb, isClicking)
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
                    class="slider"
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
               
            </div>
            {/* For Fake Data generation */}
            <div style={{position: "absolute", top: 630}}>
                {/* <button onClick={updateHeatmap}>Click to update Heatmap</button> */}
            </div>
        </div>
    );
}

export default Brushing;