import React, { useEffect } from 'react';
import axios from 'axios';
import * as d3 from 'd3';




const Brushing = (props) => {


    // Global variables for the hook
    const size = 740;
    const margin = 20;
    const gSize = size - margin * 2;
    let xScale;
    let yScale;
    let opacityScale;
    let url;
    
    let isSelected = false;





    function initializeScatterplotD3(coor, density, id, isXLonger) {
        // Add Grouping for the scatterplot
        const radius = 2.7;
        const lensRadius = 70;
        const color = "black";
        const injection = new Array(density.length).fill(0);
        
        // lens radius without scaled
        const realLensRadius = isXLonger ? 
                               xScale.invert(lensRadius) - xScale.invert(0) : 
                               yScale.invert(lensRadius) - yScale.invert(0);
        console.group(realLensRadius);
        
        // For lens
        const lensSvg = d3.select("#" + id).append("g").attr("transform", "translate(" + margin + "," + margin + ")");
    
        const lens = lensSvg.append("circle")
                            .attr("r", lensRadius)
                            .attr("fill", "none")
                            .style("stroke-width", 2)
                            .style("stroke", "black")
                            .style("stroke-dasharray", "3, 3")
                            .attr("cx", 350)
                            .attr("cy", 350)
                            .style("opacity", 0)
    
    
        // For scatterplot
        const svg = d3.select("#" + id)
                      .append("g")
                      .attr("id", id + "-g")
                      .attr("transform", "translate(" + margin + "," + margin + ")");
    
        const circle = svg.selectAll("circle")
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
               axios.get(url + "/similarity", {
                   params: {index: i}
               }).then(response => {
                   const max = response.data.max;
                   const similarity = response.data.similarity;
                   
                   circle.data(similarity)
                         .join(
                             enter => {},
                             update => {
                                 update.attr("r", (d, idx) => { 
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
               
               if (!isSelected) {
                   lens.transition()
                       .duration(300)
                       .attr("cx", xScale(coor[i][0]))
                       .attr("cy", yScale(coor[i][1]))
                       .style("opacity", 1);
               }
    
               })
               .on("mouseout", function() {
                   circle.data(injection)
                         .attr("r", radius)
                         .attr("fill", color)
                         .style("opacity", (_, i) => opacityScale(density[i]));

                   if (!isSelected) {
                       lens.transition()
                           .duration(1000)
                           .style("opacity", 0);
                   }
               })
               .on("click", function() {
                   const nodes = circle.nodes();
                   const i = nodes.indexOf(this);
                   axios.get(url + "/pointlens", {
                       params: {
                           index: i,
                           radius: realLensRadius
                       }
                   }).then(response => {
                       const modified_coor = response.data;
                       circle.transition()
                             .duration(500)
                             .attr("cx", (_, idx) => xScale(modified_coor[idx][0]))
                             .attr("cy", (_, idx) => yScale(modified_coor[idx][1]));
                       lens.transition()
                           .duration(500)
                           .attr("cx", xScale(modified_coor[i][0]))
                           .attr("cy", yScale(modified_coor[i][1]))
                           .style("stroke-dasharray", "5, 0");
                        
                        isSelected = true;
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

        const basicInfo = await axios.get(url + "basic", { parmas : params });
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


        xScale = d3.scaleLinear().domain(xDomain).range(xRange);
        yScale = d3.scaleLinear().domain(yDomain).range(yRange);
        opacityScale = d3.scaleLinear().domain([d3.min(density), d3.max(density)]).range([0.1, 1]);

        initializeScatterplotD3 (
            coor, density, "d3-brushing", xDomainSize > yDomainSize
        );

    }, []);



    return (
        <div style={{margin: "auto", width: size}}>
            <svg id="d3-brushing" 
                 width={size}
                 height={size}
                 style={{
                     marginTop: 30,
                     border: "1px solid black",
                 }}
            ></svg>
        </div>
    );
}

export default Brushing;