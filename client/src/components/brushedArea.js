import React, { useEffect } from 'react';

import * as d3 from 'd3'

const BrushedArea = (props) => {

    const polygon = d3.select("#brushed")
                        .append("polygon")
                        .attr("id", "brushed-polygon")
                        .style("fill", "#ffaaff");
    
    
    useEffect(() => {  
        // console.log(props.status)
        // console.log(props.polygon)
        
        // console.log(props.xRange)
        if(props.polygon === undefined) return;
        let path_str = ""
        
        props.polygon.forEach(e => {
            path_str += ((e[0] / 25) * (props.xRange[1] - props.xRange[0]) + props.xRange[0]).toString() 
                        + "," + 
                        ((e[1] / 25) * (props.yRange[1] - props.yRange[0]) + props.yRange[0]).toString()
            path_str += " "
        })

        d3.select("#brushed-polygon").attr("points", path_str)
        // console.log(path_str)
        

    }, [props.status]);

    return (
        <div>
            <svg
                id={"brushed"}
                width={props.width}
                height={props.height}
                style={{
                    top: props.marginTop,
                    position: "absolute",
                }}
            ></svg>
        </div>
    )
}

export default BrushedArea;