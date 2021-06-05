import { initialProjectionRenderingData, renderScatterplot } from "./renderingScatterplot";

const initialProjectionButtonStatus = {
  BRUSHING: "Show Initial Projection",
  INITIAL : "Return to Current Brushing"
}


export function initialProjectionExecutor(
  e, dom, initialEmb, emb, positionDuration,
  density, colors, currSelections, radius, border, pointLen, addSelectionButtonDom
) {
  if (e.target.innerText === initialProjectionButtonStatus.BRUSHING) {
    showInitialProjection(
      e, dom, initialEmb, positionDuration,
      density, colors, currSelections, radius, border, pointLen
    );
    addSelectionButtonDom.disabled = true;
  }
  else {
    returnToBrushing(
      e, dom, emb, positionDuration,
      density, colors, currSelections, radius, border, pointLen
    );
    addSelectionButtonDom.disabled = false;
    
    
  }
}

function showInitialProjection(
  e, dom, initialEmb, positionDuration,
  density, colors, currSelections, radius, border, pointLen
) {
  dom.style.pointerEvents = "none";
  renderScatterplot(
    initialProjectionRenderingData(
      initialEmb, density, colors, currSelections, radius, border, pointLen
    ), positionDuration, 0
  );
  e.target.disabled = true;
  setTimeout(() => {
    e.target.disabled = false;
    e.target.innerText = initialProjectionButtonStatus.INITIAL;
  }, positionDuration);
}

function returnToBrushing(
  e, dom, emb, positionDuration,
  density, colors, currSelections, radius, border, pointLen
) {
  dom.style.pointerEvents = "auto";
  renderScatterplot(
    initialProjectionRenderingData(
      emb, density, colors, currSelections, radius, border, pointLen
    ), positionDuration, 0
  );
  e.target.disabled = true;
  setTimeout(() => {
    e.target.disabled = false;
    e.target.innerText = initialProjectionButtonStatus.BRUSHING;
  }, positionDuration);
}