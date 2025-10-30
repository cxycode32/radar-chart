import Chart from "chart.js/auto";
import { labels, findCityData, computeSuggestedMaxForCity } from "./data.js";
import { canvas, getCanvasContext } from "./dom.js";
import { visibility, COLORS } from "./state.js";

let radarChart = null;

export function ensureChartCardSizing() {
    const chartCard = canvas.closest(".chart-card");
    if (chartCard) {
        const ch = chartCard.clientHeight;
        if (!ch || ch < 200) {
            chartCard.style.minHeight = "320px";
        }
    }

    let headerH = 0;
    const chartCardHeader = canvas.closest(".chart-card")?.querySelector(".chart-header");
    if (chartCardHeader) headerH = chartCardHeader.getBoundingClientRect().height || 36;

    const cardRect = canvas.closest(".chart-card")?.getBoundingClientRect() || { width: 320, height: 320 };
    const availableH = Math.max(200, (cardRect.height || 420) - headerH - 8);

    canvas.style.width = "100%";
    canvas.style.height = `${availableH}px`;
    canvas.width = Math.max(200, Math.floor(canvas.getBoundingClientRect().width));
    canvas.height = Math.max(120, Math.floor(availableH));
}

function buildDatasetsForCity_js(cityName) {
    const c = findCityData(cityName);
    if (!c) return [];
    return [
        {
            metaKey: "global",
            label: "Global",
            data: c.global_data,
            fill: true,
            backgroundColor: COLORS.global,
            borderColor: COLORS.globalBorder,
            hidden: !visibility.global,
        },
        {
            metaKey: "region",
            label: c.region,
            data: c.region_data,
            fill: true,
            backgroundColor: COLORS.region,
            borderColor: COLORS.regionBorder,
            hidden: !visibility.region,
        },
        {
            metaKey: "city",
            label: c.city_name,
            data: c.city_data,
            fill: true,
            backgroundColor: COLORS.city,
            borderColor: COLORS.cityBorder,
            hidden: !visibility.city,
        },
    ];
}

export function createOrUpdateChartJS(cityName) {
    ensureChartCardSizing();

    const datasets = buildDatasetsForCity_js(cityName);
    if (!datasets.length) return;
    const suggestedMax = computeSuggestedMaxForCity(findCityData(cityName));

    const ctx = getCanvasContext();

    if (radarChart) {
        radarChart.destroy();
        radarChart = null;
    }

    radarChart = new Chart(ctx, {
        type: "radar",
        data: { labels, datasets },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` },
                },
            },
            scales: {
                r: {
                    beginAtZero: true,
                    suggestedMax,
                    ticks: { stepSize: 20 },
                },
            },
            interaction: { mode: "nearest", axis: "r" },
            animation: { duration: 500, easing: "easeOutQuad" },
        },
    });
}

export function applyVisibilityToCharts(radarChartInstance) {
    const chart = radarChartInstance || radarChart;
    if (chart) {
        chart.data.datasets.forEach((ds) => {
            if (ds.metaKey && typeof visibility[ds.metaKey] !== "undefined") ds.hidden = !visibility[ds.metaKey];
        });
        chart.update();
    }
}
