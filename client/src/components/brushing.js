import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";

const Brushing = (props) => {
    
    const size = 100000;

    // data
    let randomData = new RandomData(size);
    let data = randomData.emb;
    let opacity = randomData.opacity;



    const radius = 2;

    // reference to the canvas
    const splotRef = useRef(null);

    let scatterplot;

    useEffect(() => {
        scatterplot = new Scatterplot(data, opacity, radius, splotRef.current);
    }, [splotRef])



    function updateScatterPlot() {
        let newRandomData = new RandomData(size);
        let newData = newRandomData.emb;
        let newOpacity = newRandomData.opacity;

        scatterplot.update(newData, newOpacity, 500, 1000);
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