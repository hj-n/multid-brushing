const initialProjectionButtonStatus = {
  BRUSHING: "Show Initial Projection",
  INITIAL : "Return to Current Brushing"
}


export function initialProjectionExecutor(e, dom, initialEmb, emb) {
  if (e.target.innerText === initialProjectionButtonStatus.BRUSHING) 
    showInitialProjection(e, dom, initialEmb);
  else returnToBrushing(e, dom, emb);
}

function showInitialProjection(e, dom, initialEmb) {
  e.target.innerText = initialProjectionButtonStatus.INITIAL;
  dom.style.pointerEvents = "none";


}

function returnToBrushing(e, dom, emb) {
  e.target.innerText = initialProjectionButtonStatus.BRUSHING;
  dom.style.pointerEvents = "auto";
}