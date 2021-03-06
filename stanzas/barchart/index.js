import vegaEmbed from "vega-embed";
import loadData from "@/lib/load-data";
import { appendDlButton } from "@/lib/metastanza_utils.js";

export default async function barchart(stanza, params) {
  function css(key) {
    return getComputedStyle(stanza.root.host).getPropertyValue(key);
  }
  const chartType = params["chart-type"];

  //width,height,padding
  const width = params["width"];
  const height = params["height"];
  const padding = params["padding"];

  //data
  const labelVariable = params["category"]; //x
  const valueVariable = params["value"]; //y
  const groupVariable = params["group-by"] ? params["group-by"] : "none"; //z

  const values = await loadData(params["data-url"], params["data-type"]);

  function constructData(chartType) {
    switch (chartType) {
      case "grouped":
        return [
          {
            name: "table",
            values,
          },
        ];
      case "stacked":
        return [
          {
            name: "table",
            values,
            transform: [
              {
                type: "stack",
                field: valueVariable,
                groupby: [labelVariable],
                sort: { field: groupVariable },
              },
            ],
          },
        ];
    }
  }

  const getTitle = function (
    stackedParamsTitle,
    stackedDefaultTitle,
    groupedParamsTitle,
    groupedDefaultTitle
  ) {
    switch (chartType) {
      case "stacked":
        return stackedParamsTitle === ""
          ? stackedDefaultTitle
          : stackedParamsTitle;
      case "grouped":
        return groupedParamsTitle === ""
          ? groupedDefaultTitle
          : groupedParamsTitle;
    }
  };

  const axes = [
    {
      scale: "xscale",
      orient: params["xaxis-placement"],
      domainColor: "var(--togostanza-axis-color)",
      domainWidth: css("--togostanza-axis-width"),
      grid: params["xgrid"] === "true",
      gridColor: "var(--togostanza-grid-color)",
      gridDash: css("--togostanza-grid-dash-length"),
      gridOpacity: css("--togostanza-grid-opacity"),
      gridWidth: css("--togostanza-grid-width"),
      ticks: params["xtick"] === "true",
      tickColor: "var(--togostanza-tick-color)",
      tickSize: css("--togostanza-tick-length"),
      tickWidth: css("--togostanza-tick-width"),
      title: getTitle(
        params["category-title"],
        labelVariable,
        params["value-title"],
        valueVariable
      ),
      titleColor: "var(--togostanza-title-font-color)",
      titleFont: css("--togostanza-font-family"),
      titleFontSize: css("--togostanza-title-font-size"),
      titleFontWeight: css("--togostanza-title-font-weight"),
      titlePadding: params["xtitle-padding"],
      labelPadding: params["xlabel-padding"],
      labelAlign: params["xlabel-alignment"],
      labelLimit: params["xlabel-max-width"],
      encode: {
        labels: {
          interactive: true,
          update: {
            angle: { value: params["xlabel-angle"] },
            fill: { value: "var(--togostanza-label-font-color)" },
            font: { value: css("--togostanza-font-family") },
            fontSize: { value: css("--togostanza-label-font-size") },
          },
        },
      },
    },
    {
      scale: "yscale",
      orient: params["yaxis-placement"],
      domainColor: "var(--togostanza-axis-color)",
      domainWidth: css("--togostanza-axis-width"),
      grid: params["ygrid"] === "true",
      gridColor: "var(--togostanza-grid-color)",
      gridDash: css("--togostanza-grid-dash-length"),
      gridOpacity: css("--togostanza-grid-opacity"),
      gridWidth: css("--togostanza-grid-width"),
      ticks: params["ytick"] === "true",
      tickColor: "var(--togostanza-tick-color)",
      tickSize: css("--togostanza-tick-length"),
      tickWidth: css("--togostanza-tick-width"),
      title: getTitle(
        params["value-title"],
        valueVariable,
        params["category-title"],
        labelVariable
      ),
      titleColor: "var(--togostanza-title-font-color)",
      titleFont: css("--togostanza-font-family"),
      titleFontSize: css("--togostanza-title-font-size"),
      titleFontWeight: css("--togostanza-title-font-weight"),
      titlePadding: params["ytitle-padding"],
      labelPadding: params["ylabel-padding"],
      labelAlign: params["ylabel-alignment"],
      labelLimit: params["ylabel-max-width"],
      zindex: 0,
      encode: {
        labels: {
          interactive: true,
          update: {
            angle: { value: params["ylabel-angle"] },
            fill: { value: "var(--togostanza-label-font-color)" },
            font: {
              value: css("--togostanza-font-family"),
            },
            fontSize: { value: css("--togostanza-label-font-size") },
          },
        },
      },
    },
  ];

  // legend
  const legends = [
    {
      fill: "color",
      orient: "none",
      legendX: params["legend-padding"]
        ? width + params["legend-padding"]
        : width + 18,
      title: getTitle(
        params["legend-title"],
        groupVariable,
        params["legend-title"],
        groupVariable
      ),
      titleColor: "var(--togostanza-title-font-color)",
      titleFont: css("--togostanza-font-family"),
      titleFontSize: css("--togostanza-title-font-size"),
      titleFontWeight: css("--togostanza-title-font-weight"),
      labelColor: "var(--togostanza-label-font-color)",
      labelFont: css("--togostanza-font-family"),
      labelFontSize: css("--togostanza-label-font-size"),
      symbolStrokeColor: css("--togostanza-border-color"),
      symbolStrokeWidth: css("--togostanza-border-width"),
      symbolLimit: "2000",
    },
  ];

  const colorScale = {
    name: "color",
    type: "ordinal",
    domain: { data: "table", field: groupVariable },
    range: [
      "var(--togostanza-series-0-color)",
      "var(--togostanza-series-1-color)",
      "var(--togostanza-series-2-color)",
      "var(--togostanza-series-3-color)",
      "var(--togostanza-series-4-color)",
      "var(--togostanza-series-5-color)",
    ],
  };

  function constructScale(chartType) {
    switch (chartType) {
      case "grouped":
        return [
          colorScale,
          {
            name: "xscale",
            type: "linear",
            domain: { data: "table", field: valueVariable },
            range: "width",
          },
          {
            name: "yscale",
            type: "band",
            domain: { data: "table", field: labelVariable },
            range: "height",
            padding: 0.2,
            paddingInner: params["padding-inner"],
            paddingOuter: params["padding-outer"],
          },
        ];
      case "stacked":
        return [
          colorScale,
          {
            name: "xscale",
            type: "band",
            range: "width",
            domain: { data: "table", field: labelVariable },
            paddingInner: params["padding-inner"],
            paddingOuter: params["padding-outer"],
          },
          {
            name: "yscale",
            type: "linear",
            range: "height",
            nice: true,
            zero: true,
            domain: { data: "table", field: "y1" },
          },
        ];
    }
  }

  function constructMark(chartType) {
    switch (chartType) {
      case "grouped":
        return [
          {
            type: "group",
            from: {
              facet: {
                data: "table",
                name: "facet",
                groupby: labelVariable,
              },
            },
            encode: {
              enter: {
                y: { scale: "yscale", field: labelVariable },
              },
            },
            signals: [{ name: "height", update: "bandwidth('yscale')" }],
            scales: [
              {
                name: "pos",
                type: "band",
                range: "height",
                domain: { data: "facet", field: groupVariable },
              },
            ],
            marks: [
              {
                name: "bars",
                from: { data: "facet" },
                type: "rect",
                encode: {
                  enter: {
                    y: { scale: "pos", field: groupVariable },
                    height: { scale: "pos", band: 1 },
                    x: { scale: "xscale", field: valueVariable },
                    x2: { scale: "xscale", value: 0 },
                    fill: { scale: "color", field: groupVariable },
                    stroke: { value: "var(--togostanza-border-color)" },
                    strokeWidth: { value: css("--togostanza-border-width") },
                  },
                },
              },
            ],
          },
        ];
      case "stacked":
        return [
          {
            type: "group",
            from: { data: "table" },
            encode: {
              enter: {
                x: { scale: "xscale", field: labelVariable },
                width: { scale: "xscale", band: params["bar-width"] },
                y: { scale: "yscale", field: "y0" },
                y2: { scale: "yscale", field: "y1" },
                fill: { scale: "color", field: groupVariable },
                stroke: { value: "var(--togostanza-border-color)" },
                strokeWidth: { value: css("--togostanza-border-width") },
              },
            },
          },
        ];
    }
  }

  const spec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    width,
    height,
    padding,
    data: constructData(chartType),
    scales: constructScale(chartType),
    axes,
    legends: params["legend"] === "true" && params["group-by"] ? legends : [],
    marks: constructMark(chartType),
  };

  const el = stanza.root.querySelector("main");
  const opts = {
    renderer: "svg",
  };
  await vegaEmbed(el, spec, opts);

  //menu button placement
  appendDlButton(
    stanza.root.querySelector(".chart-wrapper"),
    stanza.root.querySelector("svg"),
    "barchart",
    stanza
  );

  const menuButton = stanza.root.querySelector("#dl_button");
  const menuList = stanza.root.querySelector("#dl_list");
  switch (params["metastanza-menu-placement"]) {
    case "top-left":
      menuButton.setAttribute("class", "dl-top-left");
      menuList.setAttribute("class", "dl-top-left");
      break;
    case "top-right":
      menuButton.setAttribute("class", "dl-top-right");
      menuList.setAttribute("class", "dl-top-right");
      break;
    case "bottom-left":
      menuButton.setAttribute("class", "dl-bottom-left");
      menuList.setAttribute("class", "dl-bottom-left");
      break;
    case "bottom-right":
      menuButton.setAttribute("class", "dl-bottom-right");
      menuList.setAttribute("class", "dl-bottom-right");
      break;
    case "none":
      menuButton.setAttribute("class", "dl-none");
      menuList.setAttribute("class", "dl-none");
      break;
  }
}
