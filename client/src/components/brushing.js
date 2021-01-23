import BrushedArea from "./brushedArea"

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';




// WHile Brushing, changes comes only from the lens position adjustment,
// computed by the server 

const Brushing = (props) => {


    let basicInfo;

    // Global variables for the hook
    const size = 740;
    const margin = 20;
    const gSize = size - margin * 2;
    let xScale;
    let yScale;
    let opacityScale;
    let url;
    
    let isSelected = false;
    let isTransition = false;

    const lensRadius = 70;
    const brusherRadius = 15;

    const [brushingStatus, setBrushingStatus] = useState(0)

    const [xRangeState, setXRange] = useState()
    const [yRangeState, setYRange] = useState()

    const [polygon, setPolygon] = useState()


    function initializeScatterplotD3(coor, density, id, isXLonger) {
        // Add Grouping for the scatterplot
        const radius = 2.7;

        const color = "black";
        const injection = new Array(density.length).fill(0);
        
        // lens radius without scaled
        const realLensRadius = isXLonger ? 
                               xScale.invert(lensRadius) - xScale.invert(0) : 
                               yScale.invert(lensRadius) - yScale.invert(0);
        
        const realBrusherRadius = isXLonger ?
                                  xScale.invert(brusherRadius) - xScale.invert(0) : 
                                  yScale.invert(brusherRadius) - yScale.invert(0);


        let circle;
        
        
        
        // svg for lens
        const lensSvg = d3.select("#" + id).append("g").attr("transform", "translate(" + margin + "," + margin + ")");
        

        // lens
        const lens = lensSvg.append("circle")
                            .attr("r", lensRadius)
                            .attr("fill", "none")
                            .style("stroke-width", 2)
                            .style("stroke", "black")
                            .style("stroke-dasharray", "3, 3")
                            .attr("cx", 350)
                            .attr("cy", 350)
                            .style("opacity", 0);
        
        // brusher
        const brusher = lensSvg.append("circle")
                               .attr("r", brusherRadius)
                               .attr("fill", "#54d1b4")
                               .style("opacity", 0.5)
                               .attr("cx", 350)
                               .attr("cy", 350)
                               .attr("visibility", "hidden");
        
        // about brushing

        //// status variables
        let isMouseDown = false;
        let isBrushing = false;
        let currentX, currentY;

        //// setInterval variable
        let brushingStatusChecker;

        //// functionalities
        d3.select("#" + id)
          .on("mousemove", function(e) {
            if(e.shiftKey) {
                currentX = e.offsetX - margin;
                currentY = e.offsetY - margin
                brusher.attr("cx", currentX)
                       .attr("cy", currentY)
                       .attr("visibility", "visible");
            }
            else {
                brusher.attr("visibility", "hidden")
                if (isBrushing) {
                    isBrushing = false;
                    clearInterval(brushingStatusChecker);
                    axios.get(url + "/brushingfinish");
                }
            }
          })
          .on("mousedown", function(e) {
            if(e.shiftKey) {
                brusher.style("opacity", 0.8)
                isMouseDown = true;
                if (!isBrushing) {
                    isBrushing = true;
                    brushingStatusChecker = setInterval(function() {
                        axios.get(url + "/brushing", {
                            params: {
                                x: xScale.invert(currentX),
                                y: yScale.invert(currentY),
                                r: realBrusherRadius
                            }
                        }).then(response => {
                            if(response.data.changed) {
                                // test
                                // console.log(response.data)
                                const selection = response.data.selection;
                                circle.transition()
                                      .duration(50)
                                      .attr("fill", function(d, i) {
                                          if (selection[i] === 0) return d3.select(this).attr("fill");
                                          else return "#0040ff";
                                      })
                                      .style("opacity", function(d, i) {
                                        if (selection[i] === 0) return d3.select(this).style("opacity");
                                        else return 1;
                                      })
                                

                                setBrushingStatus(brushingStatus => (brushingStatus + 1) % 2)
                                setPolygon(_ => response.data.polygon)
                            }
                        });
                    }, 100);
                }
            }
          })
          .on("mouseup", function(e) {
              if(e.shiftKey) {
                  brusher.style("opacity", 0.5)
                  isMouseDown = false;
                  if (isBrushing) {
                      isBrushing = false;
                      clearInterval(brushingStatusChecker);
                      axios.get(url + "/brushingfinish");
                  }
              }
              else {
                  brusher.attr("visibility", "hidden");
              }
          })

        // For scatterplot
        const svg = d3.select("#" + id)
                      .append("g")
                      .attr("id", id + "-g")
                      .attr("transform", "translate(" + margin + "," + margin + ")");

    
        

    
        circle = svg.selectAll("circle")
                    .data(injection)
                    .enter()
                    .append("circle")
                    .attr("r", radius)
                    .attr("fill", color)
                    .attr("cx", (_, i) => xScale(coor[i][0]))
                    .attr("cy", (_, i) => yScale(coor[i][1]))
                    .style("opacity", (_, i) => opacityScale(density[i]));
        
        circle.on("mouseover", function(e, d) {
               const nodes = circle.nodes();
               const i = nodes.indexOf(this);
               if (!isTransition && !e.shiftKey) {
                    axios.get(url + "/similarity", {
                        params: {index: i}
                    }).then(response => {
                        const max = response.data.max;
                        const similarity = response.data.similarity;
                
                    
                        circle.data(similarity)                                
                              .join(
                                   enter => {},
                                   update => {
                                       update.transition()
                                           .duration(300)
                                           .attr("r", (d, idx) => { 
                                                   if (d > 0 && i !== idx) return radius * 1.5;
                                                   else if (i === idx) return radius * 2.5;
                                                   else return radius;
                                           })
                                           .attr("fill", (d, idx) => { 
                                                   if (d > 0 && i !== idx) return "red";
                                                   else return "black";
                                           })
                                           .style("opacity", (d, idx) => { 
                                                   if (d > 0 && i !== idx) return d / max;
                                                   else return opacityScale(density[idx]);
                                           });
                                   }
                               );
                   });
                }
                if (!isSelected && !e.shiftKey) {
                    lens.transition()
                        .duration(300)
                        .attr("cx", xScale(coor[i][0]))
                        .attr("cy", yScale(coor[i][1]))
                        .style("opacity", 1);
                }
    
               })
               .on("mouseout", function(e) {
                    if(!isTransition && !e.shiftKey) {
                        circle.transition()
                                .duration(1500)
                                .attr("r", radius)
                                .attr("fill", color)
                                .style("opacity", (_, i) => opacityScale(density[i]));
                    }

                   if (!isSelected) {
                       lens.transition()
                           .duration(1500)
                           .style("opacity", 0);
                   }
               })
               .on("click", async function(e) {
                   if (e.shiftKey) return;
                   isSelected = true;
                   isTransition = true;
                   const nodes = circle.nodes();
                   const i = nodes.indexOf(this);
                   await axios.get(url + "/pointlens", {
                       params: {
                           index: i,
                           radius: realLensRadius
                       }
                   }).then(response => {
                       const modified_coor = response.data.modified_emb;
                       const from_outside_idx = response.data.from_outside_idx;

                       console.log(from_outside_idx)
                       circle.transition()
                             .duration(500)
                             .attr("cx", (_, idx) => xScale(modified_coor[idx][0]))
                             .attr("cy", (_, idx) => yScale(modified_coor[idx][1]));

                       lens.transition()
                           .duration(500)
                           .attr("cx", xScale(modified_coor[i][0]))
                           .attr("cy", yScale(modified_coor[i][1]))
                           .style("stroke-dasharray", "5, 0");

                       svg.selectAll("path").remove();

                       from_outside_idx.forEach(idx => {
                           svg.append("path")
                              .attr("stroke", "blue")
                              .attr("stroke-width", 5)
                              .attr("fill", "none")
                              .style("opacity", 0.5)
                              .attr("d", function() {
                                  const start = basicInfo.data.emb[idx];
                                  return d3.line()([[xScale(start[0]), yScale(start[1])], 
                                                    [xScale(start[0]), yScale(start[1])]]);

                              })
                              .transition()
                              .duration(500)
                              .attr("d", function() {
                                  const start = basicInfo.data.emb[idx];
                                  const end   = modified_coor[idx];
                                  return d3.line()([[xScale(start[0]), yScale(start[1])], 
                                                    [xScale(end[0]),   yScale(end[1])  ]]);
                              })
                              
                              
                       })
                        
                       setTimeout(() => {
                           isTransition = false;
                       }, 600);
                       
                   });
               });
               
    }


    useEffect(async () => {
        url = props.url;
        const params = {
            dataset: props.dataset,
            method:  props.method,
            sample: props.sample,
        }
        const result = await axios.get(url + "init", { params: params });
        if (result.status === 400) { alert('No such dataset exists!!'); return; }

        basicInfo = await axios.get(url + "basic", { parmas : params });
        console.log(basicInfo);

        let coor = basicInfo.data.emb;
        let density = basicInfo.data.density;

        let xCoor = coor.map(d => d[0]);
        let yCoor = coor.map(d => d[1]);

        const xDomain = [d3.min(xCoor), d3.max(xCoor)];
        const yDomain = [d3.min(yCoor), d3.max(yCoor)];
        const xDomainSize = xDomain[1] - xDomain[0];
        const yDomainSize = yDomain[1] - yDomain[0];

        let xRange, yRange;
        if (xDomainSize > yDomainSize) {
            let difference = gSize * ((xDomainSize - yDomainSize) / xDomainSize);
            xRange = [0, gSize];
            yRange = [difference, gSize - difference];
        }
        else {
            let difference = gSize * ((yDomainSize - xDomainSize) / xDomainSize);
            xRange = [difference, gSize - difference];
            yRange = [0, gSize];
        }

        setXRange(_ => xRange)
        setYRange(_ => yRange)

        xScale = d3.scaleLinear().domain(xDomain).range(xRange);
        yScale = d3.scaleLinear().domain(yDomain).range(yRange);
        opacityScale = d3.scaleLinear().domain([d3.min(density), d3.max(density)]).range([0.1, 1]);


        

        initializeScatterplotD3 (
            coor, density, "d3-brushing", xDomainSize > yDomainSize
        );

    }, []);



    return (
        <div style={{margin: "auto", width: size}}>
            <div style={{
                
                zIndex: `-1`,
                position: "absolute",
                
            }}>
                <BrushedArea
                        width={size}
                        height={size}
                        margin={margin}
                        marginTop={30}
                        status={brushingStatus}
                        xRange={xRangeState}
                        yRange={yRangeState}
                        polygon={polygon}
                />
            </div>
            <div style={{zIndex: `50`}}>
                <svg id="d3-brushing" 
                    width={size}
                    height={size}
                    style={{
                        marginTop: 30,
                        border: "1px solid black",
                    }}
                ></svg>
            </div>
            
            
        </div>
    );
}

export default Brushing;