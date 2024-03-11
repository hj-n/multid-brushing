# Multid-Brushing

Multid-Brushing is a React NPM package designed to assist with visualizing and exploring multidimensional data. It is part of a suite of tools located in the directory, which includes `dabrush-preprocessing` for data preprocessing and `multid-brush-demo` for demonstrating usage.

## Installation

```sh
#Todo npm install multid-brushing
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
  techniqueStyle = {
    technique: "dab",
    painterColor: "green",
    erasingPainterColor: "red",
    initialPainterRadius: 35,
    initialRelocationThreshold: 600, // ms
    initialRelocationDuration: 700, // ms
    relocationInterval: 1000, // ms
    relocationUpdateDuration: 350, // ms
    showLens: true,
    lensStyle: {
      color: "red",
      strokeWidth: 3,
    },
  },
  maxBrushNum = 10,
  showDensity = true,
  frameRate = 20, // ms,
  maxOpacity = 1,
  minOpacity = 0.05
);
```

## MultiDBrushing Class

The `MultiDBrushing` class is used to create an instance of MultiDBrushing. The constructor of this class accepts the following parameters:

#### `preprocessed` : array-like of shape (n_samples, n_features) 

An object representing the preprocessed data. This parameter is **required**.

#### `canvasDom` : HTMLElement 

An HTMLElement representing the canvas DOM element. This parameter is **required**.

#### `canvasSize` : int 

A number representing the size of the canvas. This parameter is **required**.

#### `statusUpdateCallback` : callable 

A function serving as the callback for status updates. This parameter is **required**.

#### `pointRenderingStyle` : dict 

An object representing the style for rendering points. This parameter is **required**.

#### `techniqueStyle` : dict, default=

```
{'technique': 'dab',
  'painterColor': 'green',
  'erasingPainterColor': 'red',
  'initialPainterRadius': 35,
  'initialRelocationThreshold': 600,
  'initialRelocationDuration': 700,
  'relocationInterval': 1000,
  'relocationUpdateDuration': 350,
  'showLens': true,
  'lensStyle': {
    'color': 'red',
    'strokeWidth': 3
    }
 }
```

An object representing the style for the brushing technique. This object can include style information such as the color and size of the brush.

#### `maxBrushNum` : int, default=10

A number representing the maximum number of brushes. This value determines the maximum number of brushes that can be displayed on the screen at the same time.

#### `showDensity` : bool, default=True

A boolean flag determining whether to show the HD density of the points. If this value is `true`, the density of the points is displayed.

#### `frameRate` : int, default=20

A number representing the frame rate for rendering. This value determines the number of frames per second.

#### `maxOpacity` : float, default=1.0

A number representing the maximum opacity. This value determines the maximum opacity of the points.

#### `minOpacity` : float, default=0.05

A number representing the minimum opacity. This value determines the minimum opacity of the points.

## Key Functions

The `MultiDBrushing` class is designed for handling multiple brushing techniques in a data visualization context, particularly for scatterplots. It provides functionalities for adding, changing, and removing brushes, as well as managing brushing status and rendering updates.

### <u>[constructor](index.js#L53)</u>

Initializes a new instance of the MultiDBrushing visualization component. This constructor sets up the initial environment for the component, including the setup of the canvas where the visualization will be drawn, preprocessing of the data to be visualized, and configuration of various visualization and interaction settings.
<details>
<summary><b>Parameters</b></summary>

  - `preprocessed`: Preprocessed data necessary for visualization.

  - `canvasDom`: The DOM element of the canvas where the visualization will be rendered.

  - `canvasSize`: The size of the canvas in pixels.

  - `statusUpdateCallback`: A callback function that updates the status of the brushing.
  - `pointRenderingStyle`: An object defining how points should be rendered.
  - `techniqueStyle`: An object defining the style and parameters for the brushing technique.
  - `maxBrushNum`: The maximum number of brushes allowed.
  - `showDensity`: A boolean indicating whether to show the density of points.
  - `frameRate`: The frame rate for animations.
  - `maxOpacity`: The maximum opacity for points.
  - `minOpacity`: The minimum opacity for points.
</details>


### <u>[unMount()](index.js#L570)</u>

Cleans up event listeners and other resources to prevent memory leaks and ensure the component can be safely removed or replaced. This method is essential for maintaining performance and avoiding issues related to excessive resource consumption.

### <u>[addNewBrush()](index.js#L580)</u>

Creates a new brush action within the visualization. This function increments the number of active brushes and sets up the necessary state for a user to perform a new brushing action. It's essential for interactive visualizations where the user needs to highlight or select multiple data points or regions simultaneously.
- **Additional Details**: Updates the current brush index and initializes the new brush's status. This method enforces the maximum number of brushes.

### <u>[changeBrush(brushIdx: number)](index.js#L586)</u>

Switches the current brush action to another existing brush, based on the specified brush index. This allows users to modify or delete previous brushes or further interact with selected data points within those brushes.

**Parameters**:
  - `brushIdx`: The index of the brush to switch to.

### <u>[removeBrush(brushIdx: number)](index.js#L594)</u>

Removes a specific brush from the visualization. This function deletes the brush specified by the index, along with any visual indicators or effects it had on the visualization.

**Parameters**:
  - `brushIdx`: The index of the brush to be removed.

### <u>[getEntireBrushingStatus()](index.js#L598)</u>

Retrieves a comprehensive snapshot of the current brushing state, including details on all active brushes. This overview is instrumental for external analyses or for synchronizing the visualization state with other components or data views.

### <u>[getCurrentBrushIdx()](index.js#L615)</u>

Returns the index of the currently active brush, aiding in the identification and manipulation of the brush currently in focus.

### <u>[getBrushingColor(brushIdx: number)](index.js#L619)</u>

Retrieves the color of a specific brush, allowing for the extraction of color information for further processing or analysis.

**Parameters**:
  - `brushIdx`: The index of the brush whose color is to be retrieved.

### <u>[temporalReconstructInitialScatterplot()](index.js#L647)</u>

Initiates a process to temporally reconstruct the scatterplot to its initial state. This can be part of an animation or interaction where the visualization transitions back to its original form, often used in dynamic visualizations to show changes over time or to reset the visualization to a baseline state.

**Additional Details**: This function triggers the temporal reconstruction process, which involves animating the visualization back to its initial state.

### <u>[cancelTemporalReconstruction()](index.js#L662)</u>

Cancels any ongoing temporal reconstruction of the scatterplot, effectively halting the animation or process that was reverting the visualization back to its initial state. This function allows for user interruptions or changes in interaction that necessitate stopping the reconstruction process.


## Data Preprocessing

You can preprocess your data appropriately using the [dabrush-preprocessing](https://github.com/hj-n/dabrush-preprocessing.git) package. For more details, please refer to the dabrush-preprocessing documentation.

## Demo

You can check out examples of this package's usage in [multid-brush-demo](https://github.com/hj-n/multid-brush-demo.git). For more details, refer to multid-brush-demo.