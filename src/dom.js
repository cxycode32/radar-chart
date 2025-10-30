export const cityWrapper = document.querySelector(".city-wrapper");
export const legendWrapper = document.querySelector(".legend-wrapper");

export const hiddenInput = document.getElementById("cityName");
export const canvas = document.getElementById("radarChart");
export const d3Container = document.getElementById("d3Radar");

export function ensureElementsExist() {
    if (!hiddenInput) throw new Error("Hidden input #cityName not found.");
    if (!d3Container) throw new Error("D3 container #d3Radar not found.");
    if (!canvas) throw new Error("Canvas #radarChart not found.");
}

export function getCanvasContext() {
    return canvas.getContext("2d");
}
