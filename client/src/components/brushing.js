import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";
import { heatmapData } from "../helpers/heatmapData";
import { Heatmap } from '../helpers/heatmap';

import * as d3 from "d3";
import { transition } from 'd3';

const Brushing = (props) => {

    // FOR SCATTERPLOT 
    const size = 10000;
    const radius = 5;

    // data
    let randomData = new RandomData(size);
    let data = randomData.emb;
    let opacity = randomData.opacity;
    let color = randomData.color;
    let radiusArr = Array(size).fill(radius);
    

    // reference to the canvas
    const splotRef = useRef(null);
    let scatterplot;

    useEffect(() => {
        scatterplot = new Scatterplot({
            position: data,
            opacity: opacity,
            color: color,
            radius: radiusArr
        }, splotRef.current);

    }, [splotRef]);

    function updateScatterPlot() {
        let newRandomData = new RandomData(size);
        let newData = newRandomData.emb;
        let newOpacity = newRandomData.opacity;
        let newColor = newRandomData.color;
        let newRadius = Array(size).fill(radius * Math.random() * 3);

        scatterplot.update({
            position: newData,
            opacity: newOpacity,
            color: newColor,
            radius: newRadius
        }, 1000, 0);
    }



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

    // FOR BRUSHER
    let bX = -2;    // x coordinates of the brusher  (range: -1 ~ 1)
    let bY = -2;    // y coordinates of the brusher  (range: -1 ~ 1)
    let bR =  20;    // radius of the brusher  
    let minbR = 5;
    let maxbR = 60;


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
        splotRef.current.addEventListener("mouseover", function() {
            brusher.transition()
                    .duration(300)
                    .style("opacity", 0.4);
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
        
    }, [])


    return (
        <div>
            <div>
                <canvas
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
                />
                <canvas 
                    ref={splotRef}
                    width={props.size}
                    height={props.size}
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
            {/* For Hyperparameter change */}
            <div style={{position: "absolute", top: 530, left: 10}}>
                Wheel sensitivity
                <input 
                    type="range"
                    min={1} 
                    max={50}
                    defaultValue={25} 
                    onChange={updateWheelSensitivity}/>
            </div>
            {/* For Fake Data generation */}
            <div style={{position: "absolute", top: 630}}>
                <button onClick={updateScatterPlot}>Click to update Scatterplot</button>
                <button onClick={updateHeatmap}>Click to update Heatmap</button>
            </div>
        </div>
    );
}

export default Brushing;