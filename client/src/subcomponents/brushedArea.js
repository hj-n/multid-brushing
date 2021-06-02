// Subcomponent code for managing brusher area (a.k.a. contour)

const LINE = d3.line()
               .curve(d3.curveCardinal)
               .x(d => props.size * 0.5 * (d[0] + 1))
               .y(d => - props.size * 0.5 * (d[1] - 1));


let contourSvg , contourOffsetSvg;
let contourPath, contourOffsetPath;

function initializeContour () {

}

