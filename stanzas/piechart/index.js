import vegaEmbed from "vega-embed";
import loadData from "@/lib/load-data";
import { appendDlButton } from "@/lib/metastanza_utils.js";

export default async function piechart(stanza, params) {
  function css(key) {
    return getComputedStyle(stanza.root.host).getPropertyValue(key);
  }

  const vegaJson = await fetch(
    "https://vega.github.io/vega/examples/pie-chart.vg.json"
  ).then((res) => res.json());

  //width,height,padding
  const width = params["width"];
  const height = params["height"];
  const padding = { left: 0, top: 0, right: 150, bottom: 0 };

  //data
  const labelVariable = params["category"];
  const valueVariable = params["value"];

  const values = await loadData(params["data-url"], params["data-type"]);

  const data = [
    {
      name: "table",
      values,
      transform: [
        {
          type: "pie",
          field: valueVariable,
          startAngle: { signal: "startAngle" },
          endAngle: { signal: "endAngle" },
          sort: { signal: "sort" },
        },
      ],
    },
  ];

  // scales(color scheme)
  const scales = [
    {
      name: "color",
      type: "ordinal",
      domain: { data: "table", field: labelVariable },
      range: [
        "var(--togostanza-series-0-color)",
        "var(--togostanza-series-1-color)",
        "var(--togostanza-series-2-color)",
        "var(--togostanza-series-3-color)",
        "var(--togostanza-series-4-color)",
        "var(--togostanza-series-5-color)",
      ],
    },
  ];

  //legend
  const legends = [
    {
      fill: "color",
      orient: "right",
      legendY: "5",
      title:
        params["legend-title"] === "" ? labelVariable : params["legend-title"],
      titleColor: "var(--togostanza-title-font-color)",
      titleFont: css("--togostanza-font-family"),
      titleFontSize: css("--togostanza-title-font-size"),
      titleFontWeight: css("--togostanza-title-font-weight"),
      labelColor: "var(--togostanza-label-font-color)",
      labelFont: css("--togostanza-font-family"),
      labelFontSize: css("--togostanza-label-font-size"),
      symbolType: params["symbol-shape"],
      symbolStrokeColor: css("--togostanza-border-color"),
      symbolStrokeWidth: css("--togostanza-border-width"),
    },
  ];

  //marks
  const marks = [
    {
      type: "arc",
      from: { data: "table" },
      encode: {
        enter: {
          fill: { scale: "color", field: labelVariable },
          x: { signal: "width / 2" },
          y: { signal: "height / 2" },
        },
        update: {
          startAngle: { field: "startAngle" },
          endAngle: { field: "endAngle" },
          padAngle: { signal: "padAngle" },
          innerRadius: { signal: "innerRadius" },
          outerRadius: { signal: "width / 2" },
          cornerRadius: { signal: "cornerRadius" },
          fill: { scale: "color", field: labelVariable },
          stroke: { value: "var(--togostanza-border-color)" },
          strokeWidth: { value: "var(--togostanza-border-width)" },
        },
      },
    },
  ];

  const spec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    width,
    height,
    padding,
    autosize: "none",
    signals: vegaJson.signals,
    data,
    scales,
    legends: params["legend"] === "false" ? [] : legends,
    marks,
  };

  //delete default controller
  for (const signal of vegaJson.signals) {
    delete signal.bind;
  }

  const el = stanza.root.querySelector("main");
  const opts = {
    renderer: "svg",
  };
  await vegaEmbed(el, spec, opts);

  const svg = stanza.root.querySelector(".marks");
  svg.style.padding = `${params["padding"]}px`;

  //menu button placement
  appendDlButton(
    stanza.root.querySelector(".chart-wrapper"),
    stanza.root.querySelector("svg"),
    "piechart",
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
