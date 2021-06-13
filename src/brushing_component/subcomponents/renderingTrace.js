import { Trace } from "./trace";

let trace;


export function initializeTrace(pointLen, dom) {
	trace = new Trace(pointLen, dom);
}

export function activateTrace(
	emb, newEmb, pointsFromOutside, augmentTime
) {
	const startTime = Date.now();
	trace.updateLineData(emb, newEmb, pointsFromOutside, augmentTime, startTime)
}