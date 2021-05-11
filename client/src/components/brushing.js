import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";

const Brushing = (props) => {
    
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
    }, [splotRef])



    function updateScatterPlot() {
        let newRandomData = new RandomData(size);
        let newData = newRandomData.emb;
        let newOpacity = newRandomData.opacity;
        let newColor = newRandomData.color;
        let newRadius = Array(size).fill(radius * Math.random() * 3);

        scatterplot.update({
            position: newData,
            opacity: newOpacity,
            color: color,
            radius: radiusArr
        }, 1000, 0);
    }



    return (
        <div>
            <canvas 
                ref={splotRef}
                width={props.size}
                height={props.size}
                style={{
                    border: "1px black solid",
                    margin: "10px",
                    width: props.size,
                    height: props.size
                }}
            />
            <button onClick={updateScatterPlot}>Click to update</button>
        </div>
    );
}

export default Brushing;