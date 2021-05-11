import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";

const Brushing = (props) => {
    

    // data
    let randomData = new RandomData(10000);
    let data = randomData.emb;
    let opacity = randomData.opacity;



    const radius = 2;

    // reference to the canvas
    const splotRef = useRef(null);

    useEffect(() => {
        const scatterplot = new Scatterplot(data, opacity, radius, splotRef.current);

        let newRandomData = new RandomData(10000);
        let newData = newRandomData.emb;
        let newOpacity = newRandomData.opacity;

        scatterplot.update(newData, newOpacity, 500, 1000);
    
    }, [splotRef])



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
        </div>
    );
}

export default Brushing;