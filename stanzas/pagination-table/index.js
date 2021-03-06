import { createApp } from "vue";
import App from "./app.vue";

export default async function paginationTable(stanza, params) {
  const main = stanza.root.querySelector("main");
  main.parentNode.style.backgroundColor = "var(--togostanza-background-color)";
  main.parentNode.style.padding = params["padding"];
  createApp(App, params).mount(main);
}
