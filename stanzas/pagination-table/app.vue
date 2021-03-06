<template>
  <div class="wrapper">
    <div class="tableWrapper">
      <div class="tableOption">
        <input
          v-model="state.queryForAllColumns"
          type="text"
          placeholder="Search for keywords..."
          class="textSearchInput"
        />
        <p class="entries">
          Show
          <select v-model="state.pagination.perPage">
            <option v-for="size of pageSizeOption" :key="size" :value="size">
              {{ size }}
            </option>
          </select>
          entries
        </p>
        <div class="menuWrapper">
          <font-awesome-icon
            icon="ellipsis-h"
            class="menuIcon"
            @click="state.isMenuOn = true"
          />
          <ul v-if="state.isMenuOn" class="menu">
            <li v-for="url in blobUrls" :key="url.type">
              <a class="downloadBtn" :href="url.url" download="tableData">
                {{ `Download ${url.type}` }}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <table v-if="state.allRows">
        <thead>
          <tr>
            <th v-for="(column, i) in state.columns" :key="column.id">
              {{ column.label }}
              <font-awesome-icon
                v-if="state.sorting.column === column"
                :key="`sort-${
                  state.sorting.direction === 'asc' ? 'up' : 'down'
                }`"
                class="icon sort active"
                :icon="`sort-${
                  state.sorting.direction === 'asc' ? 'up' : 'down'
                }`"
                @click="setSorting(column)"
              />
              <font-awesome-icon
                v-else
                class="icon sort"
                icon="sort"
                @click="setSorting(column)"
              />

              <font-awesome-icon
                :class="[
                  'icon',
                  'search',
                  { active: column.isSearchConditionGiven },
                ]"
                icon="search"
                @click="showModal(column)"
              />
              <font-awesome-icon
                v-if="column.searchType === 'category'"
                icon="filter"
                :class="[
                  'icon',
                  'filter',
                  { isShowing: column.isFilterPopupShowing },
                  { active: column.filters.some((filter) => !filter.checked) },
                ]"
                @click="column.isFilterPopupShowing = true"
              />
              <div v-if="column.isFilterPopupShowing" class="filterWrapper">
                <div
                  :class="[
                    'filterWindow',
                    { lastCol: state.columns.length - 1 === i },
                  ]"
                >
                  <p class="filterWindowTitle">{{ column.label }}</p>
                  <ul class="filters">
                    <li v-for="filter in column.filters" :key="filter.value">
                      <label :for="filter.id">
                        <input
                          :id="filter.value"
                          v-model="filter.checked"
                          type="checkbox"
                          name="items"
                        />
                        {{ filter.value }}
                      </label>
                    </li>
                  </ul>
                  <div class="toggleAllButton">
                    <button class="selectAll" @click="setFilters(column, true)">
                      Select All
                    </button>
                    <button class="clear" @click="setFilters(column, false)">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <transition name="modal">
                <div
                  v-if="column.isSearchModalShowing"
                  class="textSearchByColumnWrapper modal"
                >
                  <p class="title">
                    <template v-if="column.searchType === 'number'">
                      {{ column.label }} range
                    </template>
                    <template v-else>
                      {{ column.label }}
                    </template>
                  </p>
                  <div v-if="column.searchType === 'number'">
                    <Slider
                      :model-value="column.range"
                      :min="column.minValue"
                      :max="column.maxValue"
                      :tooltips="false"
                      @update="column.setRange"
                    ></Slider>
                    <div class="rangeInput">
                      <div>
                        <span class="rangeInputLabel"> From </span>
                        <input
                          v-model.number="column.inputtingRangeMin"
                          type="text"
                          class="min"
                          @input="setRangeFilters(column)"
                        />
                      </div>
                      <span class="dash"></span>
                      <div>
                        <span class="rangeInputLabel"> To </span>
                        <input
                          v-model.number="column.inputtingRangeMax"
                          type="text"
                          class="max"
                          @input="setRangeFilters(column)"
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    v-else
                    v-model="column.query"
                    type="text"
                    placeholder="Search for keywords..."
                    name="queryInputByColumn"
                    class="textSearchInput"
                  />
                </div>
              </transition>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rowsInCurrentPage" :key="row.id">
            <td
              v-for="cell in row"
              :key="cell.column.id"
              :rowspan="cell.rowspanCount"
              :class="{ hide: cell.hide }"
            >
              <span v-if="cell.href">
                <a :href="cell.href" target="_blank">{{ cell.value }}</a>
              </span>
              <span v-else-if="cell.column.unescape" v-html="cell.value">
              </span>
              <span v-else>
                {{ cell.value }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <SliderPagination
      ref="sliderPagination"
      :current-page="state.pagination.currentPage"
      :total-pages="totalPages"
      :is-slider-on="state.pagination.isSliderOn"
      @updateCurrentPage="updateCurrentPage"
    />
  </div>
  <div
    v-if="isPopupOrModalShowing"
    :class="['modalBackground', { black: isModalShowing }]"
    @click="closeModal()"
  ></div>
</template>

<script>
import {
  defineComponent,
  reactive,
  ref,
  computed,
  watch,
  onMounted,
} from "vue";

import SliderPagination from "./SliderPagination.vue";

import orderBy from "lodash.orderby";
import uniq from "lodash.uniq";
import Slider from "@vueform/slider";
import loadData from "@/lib/load-data";

import metadata from "./metadata.json";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faEllipsisH,
  faFilter,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faEllipsisH, faFilter, faSearch, faSort, faSortUp, faSortDown);

export default defineComponent({
  components: {
    Slider,
    SliderPagination,
    FontAwesomeIcon,
  },

  props: metadata["stanza:parameter"].map((p) => p["stanza:key"]),

  setup(params) {
    const sliderPagination = ref();
    const pageSizeOption = params.pageSizeOption.split(",").map(Number);

    const state = reactive({
      responseJSON: null, // for download. may consume extra memory

      columns: [],
      allRows: [],

      queryForAllColumns: "",

      sorting: {
        active: null,
        direction: "desc",
      },

      pagination: {
        currentPage: 1,
        perPage: pageSizeOption[0],
        isSliderOn: params.pageSlider,
      },

      isMenuOn: false,
    });

    const filteredRows = computed(() => {
      const queryForAllColumns = state.queryForAllColumns;
      const filtered = state.allRows.filter((row) => {
        return (
          searchByAllColumns(row, queryForAllColumns) && searchByEachColumn(row)
        );
      });

      const sortColumn = state.sorting.column;

      if (sortColumn) {
        return orderBy(
          filtered,
          (cells) => {
            const cell = cells.find((cell) => cell.column === sortColumn);
            return cell.value;
          },
          [state.sorting.direction]
        );
      } else {
        return filtered;
      }
    });

    const totalPages = computed(() => {
      const totalPages = Math.ceil(
        filteredRows.value.length / state.pagination.perPage
      );
      return totalPages;
    });

    watch(
      () => totalPages.value,
      (totalPages) => {
        if (totalPages > 0 && state.pagination.currentPage > totalPages) {
          updateCurrentPage(totalPages);
          if (sliderPagination.value) {
            sliderPagination.value.inputtingCurrentPage = totalPages;
          }
        }
      }
    );

    const rowsInCurrentPage = computed(() => {
      const { currentPage, perPage } = state.pagination;

      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;

      return setRowspanState(filteredRows.value.slice(startIndex, endIndex));
    });

    const blobUrls = computed(() => {
      const json = state.responseJSON;
      if (!json) {
        return null;
      }

      const csv = json2csv(json);

      const jsonBlob = new Blob([JSON.stringify(json, null, "  ")], {
        type: "application/json",
      });
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const csvBlob = new Blob([bom, csv], { type: "text/csv" });

      return [
        {
          type: "JSON",
          url: URL.createObjectURL(jsonBlob),
        },
        {
          type: "CSV",
          url: URL.createObjectURL(csvBlob),
        },
      ];
    });

    const isModalShowing = computed(() => {
      return state.columns.some(
        ({ isSearchModalShowing }) => isSearchModalShowing
      );
    });

    const isPopupOrModalShowing = computed(() => {
      return (
        state.columns.some(
          ({ isFilterPopupShowing }) => isFilterPopupShowing
        ) ||
        isModalShowing.value ||
        state.isMenuOn
      );
    });

    function setRowspanState(rows) {
      const rowspanCount = {};
      const reversedRows = rows.reverse().map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
          if (cell.column.rowspan) {
            const aboveValue = rows[rowIndex + 1]
              ? rows[rowIndex + 1][colIndex].value
              : null;
            const colId = cell.column.id;
            if (cell.value === aboveValue) {
              cell.hide = true;
              rowspanCount[colId] = rowspanCount[colId]
                ? rowspanCount[colId] + 1
                : 1;
            } else if (rowspanCount[colId] >= 1) {
              cell.rowspanCount = rowspanCount[colId] + 1;
              delete rowspanCount[colId];
            }
          }
          return cell;
        });
      });
      return reversedRows.reverse();
    }

    function setSorting(column) {
      state.sorting.column = column;
      state.sorting.direction =
        state.sorting.direction === "asc" ? "desc" : "asc";
    }

    function setFilters(column, checked) {
      for (const filter of column.filters) {
        filter.checked = checked;
      }
    }

    function setRangeFilters(column) {
      if (
        column.inputtingRangeMin < column.minValue ||
        column.inputtingRangeMax > column.maxValue
      ) {
        return;
      }
      column.rangeMin = column.inputtingRangeMin;
      column.rangeMax = column.inputtingRangeMax;
    }

    function showModal(column) {
      column.isSearchModalShowing = true;
    }

    function closeModal() {
      for (const column of state.columns) {
        column.isFilterPopupShowing = null;
        column.isSearchModalShowing = null;
      }
      state.isMenuOn = false;
    }

    function updateCurrentPage(currentPage) {
      state.pagination.currentPage = currentPage;
    }

    async function fetchData() {
      const data = await loadData(params.dataUrl, params.dataType);

      state.responseJSON = data;
      let columns;
      if (params.columns) {
        columns = JSON.parse(params.columns);
      } else if (data.length > 0) {
        const firstRow = data[0];
        columns = Object.keys(firstRow).map((key) => {
          return {
            id: key,
            label: key,
          };
        });
      } else {
        columns = [];
      }

      state.columns = columns.map((column) => {
        const values = data.map((obj) => obj[column.id]);
        return createColumnState(column, values);
      });

      state.allRows = data.map((row) => {
        return state.columns.map((column) => {
          return {
            column,
            value: column.parseValue(row[column.id]),
            href: column.href ? row[column.href] : null,
          };
        });
      });
    }

    onMounted(fetchData);
    return {
      sliderPagination,
      pageSizeOption,
      state,
      totalPages,
      rowsInCurrentPage,
      blobUrls,
      isModalShowing,
      isPopupOrModalShowing,
      setSorting,
      setFilters,
      setRangeFilters,
      showModal,
      closeModal,
      updateCurrentPage,
    };
  },
});

function createColumnState(columnDef, values) {
  const baseProps = {
    id: columnDef.id,
    label: columnDef.label,
    searchType: columnDef.type,
    rowspan: columnDef.rowspan,
    href: columnDef.link,
    unescape: columnDef.escape === false,
  };

  if (columnDef.type === "number") {
    const nums = values.map(Number);
    const minValue = Math.min(...nums);
    const maxValue = Math.max(...nums);
    const rangeMin = ref(minValue);
    const rangeMax = ref(maxValue);
    const range = computed(() => [rangeMin.value, rangeMax.value]);
    const inputtingRangeMin = ref(rangeMin.value);
    const inputtingRangeMax = ref(rangeMax.value);

    const isSearchConditionGiven = computed(() => {
      return minValue < rangeMin.value || maxValue > rangeMax.value;
    });

    const setRange = ([min, max]) => {
      rangeMin.value = min;
      rangeMax.value = max;
      inputtingRangeMin.value = min;
      inputtingRangeMax.value = max;
    };

    return {
      ...baseProps,
      parseValue: Number,
      minValue,
      maxValue,
      rangeMin,
      rangeMax,
      range,
      setRange,
      isSearchConditionGiven,
      inputtingRangeMin,
      inputtingRangeMax,
      isSearchModalShowing: false,

      isMatch(val) {
        return val > rangeMin.value && val <= rangeMax.value;
      },
    };
  } else {
    const query = ref("");
    const isSearchConditionGiven = computed(() => query.value !== "");

    const filters =
      columnDef.type === "category"
        ? uniq(values)
            .sort()
            .map((value) => {
              return reactive({
                value,
                checked: true,
              });
            })
        : null;

    const filter = (val) => {
      const selected = filters.filter(({ checked }) => checked);
      return selected.some(({ value }) => value === val);
    };

    const search = (val) => {
      const q = query.value;
      return q ? val.includes(q) : true;
    };

    return {
      ...baseProps,
      parseValue: String,
      query,
      isSearchConditionGiven,
      filters,
      isFilterModalShowing: false,
      isSearchModalShowing: false,

      isMatch(val) {
        return columnDef.type === "category"
          ? search(val) && filter(val)
          : search(val);
      },
    };
  }
}

function searchByAllColumns(row, query) {
  if (!query) {
    return true;
  }

  return row.some(({ value }) => String(value).includes(query));
}

function searchByEachColumn(row) {
  return row.every((cell) => {
    return cell.column.isMatch(cell.value);
  });
}

function json2csv(json) {
  var header = Object.keys(json[0]).join(",") + "\n";

  var body = json
    .map(function (d) {
      return Object.keys(d)
        .map(function (key) {
          return d[key];
        })
        .join(",");
    })
    .join("\n");

  return header + body;
}
</script>
