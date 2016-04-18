# vgTooltip
A tooltip plugin for Vega-Lite and Vega.

![demo image](demo.png "a tooltip for a Vega-Lite scatterplot")


## Author
The development of Vega-Lite Tooltip is led by Zening Qu, with significant help from [Kanit "Ham" Wongsuphasawat](https://twitter.com/kanitw) and [Dominik Moritz](https://twitter.com/domoritz).


## Examples
http://vega.github.io/vega-lite-tooltip/


## Run Instructions
1. In the project folder `vega-lite-tooltip`, type command `npm install`.
2. Then, type `npm start`.
3. In your browser, navigate to `http://localhost:4000/`.


## Creating Your Tooltip
**Step 1** Include the `vg-tooltip` library and its dependencies (`d3`, `vega`, `vega-lite`, `vega-embed` and `datalib`) in your HTML `<head>`.

```html
<!-- Dependencies -->
<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="https://vega.github.io/vega/vega.min.js"></script>
<script src="http://vega.github.io/vega-lite/vega-lite.min.js"></script>
<script src="http://vega.github.io/vega-editor/vendor/vega-embed.js" charset="utf-8"></script>
<script src="http://vega.github.io/datalib/datalib.min.js"></script>
<!-- Tooltip Library -->
<script src="vg-tooltip.js" charset="utf-8"></script>
<link rel="stylesheet" type="text/css" href="vg-tooltip.css">
```

**Step 2** In your HTML `<body>`, create a placeholder for your Vega-Lite or Vega visualization. Give the placeholder a unique `id`, which will be used in step 4. For example:

```html
<!-- Placeholder for my Scatter Plot -->
<div id="vis-scatter"></div>
```

**Step 3** In your HTML `<body>`, create a placeholder for the tooltip. Give the placeholder an `id` named `vis-tooltip` so that it can be recognized by our plugin. Assign `class` `vg-tooltip` to the placeholder to use our default CSS style.

```html
<!-- Placeholder for Tooltip -->
<table id="vis-tooltip" class="vg-tooltip"></table>
```

> Tip: Generally speaking you only need one tooltip placeholder per HTML page (even if you have multiple visualizations in that page) because the mouse only points at one thing at a time.

**Step 4** In your JavaScript file, create a Vega-Lite visualization using [`vg.embed`](https://github.com/vega/vega/wiki/Embed-Vega-Web-Components) or create a Vega visualization using [`vg.parse.spec`](https://github.com/vega/vega/wiki/Runtime). For example:

```js
// create a Vega-Lite example using vg.embed
vg.embed("#vis-scatter", embedSpec, function(error, result) {
    // result.view is the Vega View
});
```

or

```js
// create a Vega example using vg.parse.spec
vg.parse.spec(vgSpec, function(error, chart) {
    // view is the Vega View
    var view = chart({el:"#vis-scatter"}).update();
});
```

**Step 5** In the callback function of step 4, create your tooltip with [`Vega View`](https://github.com/vega/vega/wiki/Runtime#view-component-api). If you have a Vega-Lite visualization, use `vl.tooltip()` to create your tooltip. If you have a Vega visualization, use `vg.tooltip()` to create your tooltip. For example:

```js
// create a Vega-Lite example using vg.embed
vg.embed("#vis-scatter", embedSpec, function(error, result) {
    // result.view is the Vega View, vlSpec is the original Vega-Lite spec
    vl.tooltip(result.view, vlSpec);
});
```
or
```js
// create a Vega example using vg.parse.spec
vg.parse.spec(vgSpec, function(error, chart) {
    // view is the Vega View
    var view = chart({el:"#vis-scatter"}).update();
    vg.tooltip(view);
});
```
Congratulations! Now you should be able to see a tooltip working with your visualization.

## Customizing Your Tooltip
You can customize the look and the content of your tooltip by passing in an optional `options` parameter to `vl.tooltip()` or `vg.tooltip()`. For example:

```js
// in vg.embed callback
vl.tooltip(result.view, vlSpec, options);
```
or
```js
// in vg.parse.spec callback
vg.tooltip(view, options);
```

The complete structure of `options` looks like this:

```js
var options =
{
    colorTheme: 'light' | 'dark',
    showAllFields: true | false,
    fields: [
      {
         field: 'field1',
         title: 'Field One',
         formatType: 'time' | 'number' | 'string', 			
         format: string-specifier,
         aggregate: operation,
      },
      ...
    }]
};
```

You don't have to provide a fully-structured `options` object to customize your tooltip. In most cases, a partially filled-out `options` object should suffice.

`colorTheme`: By default, tooltip uses a `light` color theme. Tooltip also provides a `dark` color theme. To further customize, you can overwrite the `.vg-tooltip` class in your CSS.

`showAllFields`: If `showAllFields` is true, show all fields bind to the mark. The order of the fields in the tooltip is the order they are bind to the mark item. If `showAllFields` is false, only show fields specified in the `fields` array. The order of the fields in the tooltip is the same as the order specified in the `fields` array. The default of `showAllFields` is true.

`fields`: An array of objects to customize the title and format of fields. When `showAllFields` is false, only fields in this array will be shown in the tooltip. When `showAllFields` is true, the `fields` array can still provide custom titles and formats for its fields.

Each object in the `fields` array has the following properties.

`field`: The name of the field. In Vega-Lite, this is the field you provide to each encoding channel.

`title`: A custom title for the field.

`formatType`: Provide format type of a field: 'number', 'time', or 'string'.

`format`: If `formatType` is 'number', you can provide a [number format string-specifier](https://github.com/mbostock/d3/wiki/Formatting). If `formatType` is 'time', you can provide a [time format string-specifier](https://github.com/mbostock/d3/wiki/Time-Formatting). If `formatType` is `string`, there is no need to provide `format`.

`aggregate`: If your Vega-Lite visualization has multiple aggregations of the same field, you can provide a [aggregation operation](https://vega.github.io/vega-lite/docs/aggregate.html#supported-aggregation-operations) here to specify the particular aggregated field that you want to customize.


[//]: # (TODO(zening): tooltip fields order: can we recommend which fields should go first and which ones should go later? I feel that the fields that are most frequently changing as the mouse moves, as well as the field that's encoded with color should go first.)
