import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";
import { heatmapData } from "../helpers/heatmapData";
import { Heatmap } from '../helpers/heatmap';

import * as d3 from "d3";

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
    let bR =  0;    // radius of the brusher  

    useEffect(() => {
        let brusherSvg = d3.select("#brusherSvg");
        let brusher = brusherSvg.append("circle")
                                .attr("fill", "green")
                                .attr("r", 40)
                                .attr("transform", "translate(" + 300 + "," + 300 + ")")
                                .style("opacity", 0.4);

        // interactuib for the circle
        splotRef.current.addEventListener("mouseover", function() {
            console.log("on")
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
            <div style={{position: "absolute", top: 540}}>
                <button onClick={updateScatterPlot}>Click to update Scatterplot</button>
                <button onClick={updateHeatmap}>Click to update Heatmap</button>
            </div>
        </div>
    );
}

export default Brushing;