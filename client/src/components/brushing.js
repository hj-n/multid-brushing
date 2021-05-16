import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";
import { heatmapData } from "../helpers/heatmapData";
import { Heatmap } from '../helpers/heatmap';

const Brushing = (props) => {
    


    // FOR SCATTERPLOT 
    const size = 100000;
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

    const hmapRef = useRef(null);

    let hmapData = heatmapData(resolution);

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
            </div>
            <div style={{position: "absolute", top: 540}}>
                <button onClick={updateScatterPlot}>Click to update Scatterplot</button>
                <button onClick={updateHeatmap}>Click to update Heatmap</button>
            </div>
        </div>
    );
}

export default Brushing;