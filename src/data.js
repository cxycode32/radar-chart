import dataset from "./data/dataset.json";

export const labels = dataset?.chartConfig?.[0]?.labels || [];

export function findCityData(cityName) {
    if (!cityName) return null;
    return (dataset?.chartData || []).find(
        (d) => String(d.city_name).toLowerCase() === String(cityName).toLowerCase()
    ) || null;
}

export function allCityNames() {
    return (dataset?.chartData || []).map((d) => d.city_name);
}

export function computeSuggestedMaxForCity(cityEntry) {
    if (!cityEntry) return 100;
    const arr = [
        ...(cityEntry.global_data || []),
        ...(cityEntry.region_data || []),
        ...(cityEntry.city_data || []),
    ];
    const numeric = arr.filter((v) => typeof v === "number" && Number.isFinite(v));
    const max = numeric.length ? Math.max(...numeric) : 20;
    return Math.ceil((Math.max(max, 20) + 5) / 20) * 20;
}
