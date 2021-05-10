import React, { useRef } from 'react';

const Brushing = (props) => {

    const canvas = useRef(null);
    let gl = canvas.current.getContext("webgl");
    let regl = require('regl')(gl);

    console.log(regl);

    let frameLoop = regl.frame(({time}) => {
        regl.clear({
            color: [0, 0, 0, 1],
            depth: 1,
        });

        if (frameLoop) {
            frameLoop.cancel();
        }
    });
    

    return (
        <div>
            <canvas 
                ref={canvas}
                width={props.size}
                height={props.size}
                
            />
        </div>
    );
}

export default Brushing;