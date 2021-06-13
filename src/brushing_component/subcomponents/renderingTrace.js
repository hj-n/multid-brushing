import { Trace } from "./trace";

let trace;


export function initializeTrace(pointLen, dom) {
	trace = new Trace(pointLen, dom);
}