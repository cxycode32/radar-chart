import { ensureElementsExist, hiddenInput } from "./dom.js";
import { allCityNames, findCityData, computeSuggestedMaxForCity } from "./data.js";
import { createOrUpdateChartJS } from "./chartjs.js";
import { drawD3Base, updateD3Chart } from "./d3radar.js";
import {
    renderCityList,
    renderSharedLegend,
    wireResizeHandlers,
} from "./ui.js";
import "./styles/styles.css";

ensureElementsExist();
wireResizeHandlers();

function init() {
    renderCityList();

    const initialCity = hiddenInput.value || allCityNames()[0];
    hiddenInput.value = initialCity;

    createOrUpdateChartJS(initialCity);

    const baseMax = computeSuggestedMaxForCity(findCityData(initialCity));
    drawD3Base(baseMax);
    updateD3Chart(initialCity);

    renderSharedLegend(initialCity);
}

init();
