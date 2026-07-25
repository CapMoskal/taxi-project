export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

if (import.meta.env.DEV && !MAPTILER_KEY) {
  console.warn('[shared/map] VITE_MAPTILER_KEY не задан — карта не загрузится. Скопируй .env.example в .env.')
}

export const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`
export const MAPTILER_STYLE_URL_DARK = `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${MAPTILER_KEY}`
