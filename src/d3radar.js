import * as d3 from "d3";
import { findCityData, computeSuggestedMaxForCity, labels } from "./data.js";
import { d3Container } from "./dom.js";
import { visibility, COLORS } from "./state.js";

let d3State = { svg: null, group: null, radius: 0, angleSlice: 0, maxValue: 0 };

export function drawD3Base(maxValue) {
    d3.select(d3Container).selectAll("*").remove();

    const wrapCard = d3Container.closest(".chart-card");
    if (wrapCard && wrapCard.clientHeight < 200) wrapCard.style.minHeight = "320px";

    const rect = d3Container.getBoundingClientRect();
    const width = Math.max(280, rect.width || 320);
    const height = Math.max(280, rect.height || 320);
    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const radius = Math.min(w, h) / 2;

    const svg = d3
        .select(d3Container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%");

    const group = svg
        .append("g")
        .attr("transform", `translate(${margin.left + w / 2},${margin.top + h / 2})`);

    // groups for z-ordering (grid -> axes -> polygons -> points)
    const gridG = group.append("g").attr("class", "grid-wrapper");
    const axisG = group.append("g").attr("class", "axis-wrapper");
    const polyG = group.append("g").attr("class", "polygons");
    const ptsG = group.append("g").attr("class", "points");

    const angleSlice = labels.length > 0 ? (Math.PI * 2) / labels.length : 0;

    const levels = 6;
    for (let lvl = levels; lvl >= 1; lvl--) {
        const r = (radius / levels) * lvl;
        const pts = [];
        for (let i = 0; i < labels.length; i++) {
            const a = i * angleSlice;
            const x = Math.sin(a) * r;
            const y = -Math.cos(a) * r;
            pts.push(`${x},${y}`);
        }
        gridG
            .append("polygon")
            .attr("class", `grid-polygon level-${lvl}`)
            .attr("points", pts.join(" "))
            .attr("fill", "none")
            .attr("stroke", "#c0c0c0")
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("style", "display:block; visibility:visible;")
            .attr("pointer-events", "none");
    }

    labels.forEach((lbl, i) => {
        const angle = i * angleSlice;
        const outerX = Math.sin(angle) * radius;
        const outerY = -Math.cos(angle) * radius;

        axisG.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", outerX)
            .attr("y2", outerY)
            .attr("stroke", "#c0c0c0")
            .attr("stroke-width", 1);

        const labelX = Math.sin(angle) * (radius + 12);
        const labelY = -Math.cos(angle) * (radius + 12);

        axisG.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("dy", "0.35em")
            .style("font-size", ".75rem")
            .style("fill", "#3f3f3f")
            .style("text-anchor", Math.abs(labelX) < 6 ? "middle" : labelX > 0 ? "start" : "end")
            .text(lbl);
    });

    // store groups in d3State so updateD3Chart can rely on them and you can inspect them easily
    d3State = { svg, group, gridG, axisG, polyG, ptsG, radius, angleSlice, maxValue };
}

function pointsFromValues(values, radius, angleSlice, maxValue) {
    const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
    return (values || []).map((v, i) => {
        const angle = i * angleSlice;
        const r = rScale(v);
        const x = Math.sin(angle) * r;
        const y = -Math.cos(angle) * r;
        return { x, y, v, i };
    });
}

export function updateD3Chart(cityName) {
    const city = findCityData(cityName);
    if (!city) return;

    const maxValue = computeSuggestedMaxForCity(city);
    if (!d3State.svg || d3State.maxValue !== maxValue) drawD3Base(maxValue);
    d3State.maxValue = maxValue;

    const entries = [
        {
            key: "global",
            label: "Global",
            values: city.global_data,
            color: COLORS.global,
            border: COLORS.globalBorder
        },
        {
            key: "region",
            label: city.region,
            values: city.region_data,
            color: COLORS.region,
            border: COLORS.regionBorder
        },
        {
            key: "city",
            label: city.city_name,
            values: city.city_data,
            color: COLORS.city,
            border: COLORS.cityBorder
        },
    ];

    const polyG = d3State.group.select(".polygons");
    const ptsG = d3State.group.select(".points");

    entries.forEach((entry) => {
        const pts = pointsFromValues(entry.values, d3State.radius, d3State.angleSlice, d3State.maxValue);
        const polygonPoints = pts.map((p) => `${p.x},${p.y}`).join(" ");

        let poly = polyG.select(`polygon.poly-${entry.key}`);
        if (poly.empty()) {
            poly = polyG.append("polygon")
                .attr("class", `poly-${entry.key}`)
                .attr("fill", entry.color)
                .attr("stroke", entry.border)
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("fill-opacity", 0.5);
        }

        poly.attr("points", polygonPoints)
            .style("display", visibility[entry.key] ? null : "none")
            .attr("aria-hidden", String(!visibility[entry.key]));

        let gpts = ptsG.select(`g.pts-${entry.key}`);
        if (gpts.empty()) gpts = ptsG.append("g").attr("class", `pts-${entry.key}`);

        const sel = gpts.selectAll("circle").data(pts);
        sel.exit().remove();
        sel.enter()
            .append("circle")
            .attr("r", 4)
            .attr("fill", entry.border)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .merge(sel)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .style("display", visibility[entry.key] ? null : "none");

        gpts.selectAll("circle")
            .on("mouseenter", function (event, d) {
                d3.select(d3Container).selectAll(".d3-tooltip").remove();
                const rect = d3Container.getBoundingClientRect();
                const left = event.clientX - rect.left;
                const top = event.clientY - rect.top;

                d3.select(d3Container)
                    .append("div")
                    .attr("class", "d3-tooltip")
                    .style("position", "absolute")
                    .style("left", `${left + 10}px`)
                    .style("top", `${top + 10}px`)
                    .style("pointer-events", "none")
                    .style("padding", "6px 8px")
                    .style("background", "rgba(17,24,39,0.9)")
                    .style("color", "#fff")
                    .style("font-size", "12px")
                    .style("border-radius", "6px")
                    .text(String(d.v));
            })
            .on("mouseleave", () => {
                d3.select(d3Container).selectAll(".d3-tooltip").remove();
            });
    });
}
