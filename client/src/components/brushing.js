import React, { useRef, useEffect } from 'react';
import { RandomData } from '../helpers/data';
import { Scatterplot } from "../helpers/scatterplot";

const Brushing = (props) => {
    

    // data
    let randomData = new RandomData(1000);
    let data = randomData.emb;

    // reference to the canvas
    const splotRef = useRef(null);

    useEffect(() => {
        const scatterplot = new Scatterplot(data, splotRef.current)
    
    }, [splotRef])


    

    return (
        <div>
            <canvas 
                ref={splotRef}
                width={props.size}
                height={props.size}
                style={{
                    border: "1px black solid",
                    margin: "10px"
                }}
            />
        </div>
    );
}

export default Brushing;