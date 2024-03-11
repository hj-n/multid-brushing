# Multid-Brushing

Multid-Brushing is a React NPM package designed to assist with visualizing and exploring multidimensional data. It is part of a suite of tools located in the directory, which includes `dabrush-preprocessing` for data preprocessing and `multid-brush-demo` for demonstrating usage.

## Installation

```sh
npm install multid-brushing
```

## Usage

```javascript
import MultiDBrushing from "multid-brush";

new MultiDBrushing(
  preprocessed,
  canvasDom,
  canvasSize,
  statusUpdateCallback,
  pointRenderingStyle,
  techniqueStyle,
  maxBrushNum,
  showDensity,
  frameRate,
  maxOpacity,
  minOpacity
);
```

## MultiDBrushing Class

The `MultiDBrushing` class is used to create an instance of MultiDBrushing. The constructor of this class accepts the following parameters:

### `preprocessed` : array-like of shape (n_samples, n_features), default=None

<div style="margin-left: 20px;">
  An object representing the preprocessed data. This parameter is **required**.
</div>

### `canvasDom` : HTMLElement, default=None

<div style="margin-left: 20px;">
  An HTMLElement representing the canvas DOM element. This parameter is **required**.
</div>

### `canvasSize` : int, default=None

<div style="margin-left: 20px;">
  A number representing the size of the canvas. This parameter is **required**.
</div>

### `statusUpdateCallback` : callable, default=None

<div style="margin-left: 20px;">
  A function serving as the callback for status updates. This parameter is **required**.
</div>

### `pointRenderingStyle` : dict, default=None

<div style="margin-left: 20px;">
  An object representing the style for rendering points. This parameter is **required**.
</div>

### `techniqueStyle` : dict, default={'technique': 'dab', 'painterColor': 'green', 'erasingPainterColor': 'red', 'initialPainterRadius': 35, 'initialRelocationThreshold': 600, 'initialRelocationDuration': 700, 'relocationInterval': 1000, 'relocationUpdateDuration': 350, 'showLens': true, 'lensStyle': {'color': 'red', 'strokeWidth': 3}}

<div style="margin-left: 20px;">
  An object representing the style for the brushing technique. This object can include style information such as the color and size of the brush.
</div>

### `maxBrushNum` : int, default=10

<div style="margin-left: 20px;">
  A number representing the maximum number of brushes. This value determines the maximum number of brushes that can be displayed on the screen at the same time.
</div>

### `showDensity` : bool, default=True

<div style="margin-left: 20px;">
  A boolean flag determining whether to show the HD density of the points. If this value is `true`, the density of the points is displayed.
</div>

### `frameRate` : int, default=20

<div style="margin-left: 20px;">
  A number representing the frame rate for rendering. This value determines the number of frames per second.
</div>

### `maxOpacity` : float, default=1.0

<div style="margin-left: 20px;">
  A number representing the maximum opacity. This value determines the maximum opacity of the points.
</div>

### `minOpacity` : float, default=0.05

<div style="margin-left: 20px;">
  A number representing the minimum opacity. This value determines the minimum opacity of the points.
</div>

## Key Functions

- [`constructor`](index.js#L9): Sets the initial state of the component. This is where you define the initial state of your component.

- [`unMount`](index.js#L570): Invoked immediately before a component is unmounted and destroyed. Perform any necessary cleanup in this method.

- [`addNewBrush`](index.js#L580): Adds a new brush. This function is used when you want to add a new brush to your visualization.

- [`changeBrush`](index.js#L590): Changes an existing brush. Use this function when you want to modify the properties of an existing brush.

- [`removeBrush`](index.js#L594): Removes a specific brush. Use this function when you want to remove a specific brush from your visualization.

- [`getEntireBrushingStatus`](index.js#L598): Returns the entire brushing status. This function is used when you want to get the status of all brushes in your visualization.

- [`getCurrentBrushIdx`](index.js#L615): Returns the index of the currently selected brush. Use this function when you want to know which brush is currently selected.

- [`getBrushingColor`](index.js#L619): Returns the color of a specific brush. Use this function when you want to get the color of a specific brush.

- [`temproralReconstructIntiialScatterplot`](index.js#L647): Temporally reconstructs the initial scatterplot. Use this function when you want to perform a temporal reconstruction of your scatterplot.

- [`cancelTemproalReconstruction`](index.js#L662): Cancels the temporal reconstruction. Use this function when you want to cancel the temporal reconstruction of your scatterplot.

## Data Preprocessing

You can preprocess your data appropriately using the `dabrush-preprocessing` package. For more details, refer to dabrush-preprocessing.

## Demo

You can check out examples of this package's usage in `multid-brush-demo`. For more details, refer to multid-brush-demo.
