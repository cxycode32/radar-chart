import { cityWrapper, legendWrapper, hiddenInput } from "./dom.js";
import { allCityNames, findCityData, computeSuggestedMaxForCity } from "./data.js";
import { visibility, COLORS } from "./state.js";
import { createOrUpdateChartJS, applyVisibilityToCharts, ensureChartCardSizing } from "./chartjs.js";
import { drawD3Base, updateD3Chart } from "./d3radar.js";

export function renderCityList() {
    if (!cityWrapper) return;
    const hidden = cityWrapper.querySelector("#cityName");
    cityWrapper.innerHTML = "";
    if (hidden) cityWrapper.appendChild(hidden);

    const list = document.createElement("div");
    list.className = "city-list";

    allCityNames().forEach((cityName) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "city-item";
        btn.setAttribute("data-city", cityName);
        btn.setAttribute("aria-pressed", "false");
        btn.innerHTML = `<span class="city-badge" aria-hidden="true"></span><span class="city-label">${cityName}</span>`;
        btn.addEventListener("click", () => {
            setCity(cityName);
            btn.focus();
        });
        btn.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                btn.click();
            }
        });
        list.appendChild(btn);
    });

    cityWrapper.appendChild(list);
    reflectActiveCityVisuals(hiddenInput.value);
}

export function reflectActiveCityVisuals(activeCity) {
    if (!cityWrapper) return;
    const pills = cityWrapper.querySelectorAll(".city-item");
    pills.forEach((p) => {
        const city = p.getAttribute("data-city");
        if (city && activeCity && city.toLowerCase() === String(activeCity).toLowerCase()) {
            p.classList.add("active");
            p.setAttribute("aria-pressed", "true");
        } else {
            p.classList.remove("active");
            p.setAttribute("aria-pressed", "false");
        }
    });
    if (hiddenInput) hiddenInput.value = activeCity;
}

/* Shared legend */
export function renderSharedLegend(cityName) {
    const cityEntry = findCityData(cityName) || {};
    const entries = [
        { key: "global", title: "Global", label: "Global", color: COLORS.globalBorder },
        { key: "region", title: "Region", label: cityEntry.region || "Region", color: COLORS.regionBorder },
        { key: "city", title: "City", label: cityEntry.city_name || "City", color: COLORS.cityBorder },
    ];

    const write = (container) => {
        if (!container) return;
        container.innerHTML = "";
        entries.forEach((e) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "legend-item";
            if (visibility[e.key]) btn.classList.add("active");
            btn.setAttribute("data-key", e.key);
            btn.setAttribute(
                "aria-pressed",
                String(Boolean(visibility[e.key]))
            );
            btn.innerHTML = `
                <span class="legend-swatch" aria-hidden="true" style="background:${e.color}"></span>
                <div class="legend-label-wrapper">
                    <span class="legend-subtitle">${e.title}</span>
                    <span class="legend-label">${e.label}</span>
                </div>
            `;

            btn.addEventListener("click", () => {
                visibility[e.key] = !visibility[e.key];
                renderSharedLegend(cityName);
                applyVisibilityToCharts();
                updateD3Chart(cityName);
            });

            btn.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    btn.click();
                }
            });
            container.appendChild(btn);
        });
    };

    write(legendWrapper);
}

export function setCity(cityName) {
    if (!cityName) return;
    hiddenInput.value = cityName;
    reflectActiveCityVisuals(cityName);
    onCityChange();
}

export function onCityChange() {
    const cityName = hiddenInput.value;
    createOrUpdateChartJS(cityName);
    updateD3Chart(cityName);
    renderSharedLegend(cityName);
};

let resizeTimer = null;
export function wireResizeHandlers() {
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            ensureChartCardSizing();
            if (typeof onCityChange === "function") {
                const entry = findCityData(hiddenInput.value);
                drawD3Base(computeSuggestedMaxForCity(entry));
                onCityChange();
            }
        }, 120);
    });
}
