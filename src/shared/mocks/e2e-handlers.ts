import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'

// Mocks for the app's real external calls (OSRM routing, MapTiler geocoding +
// map style) — used ONLY when VITE_E2E is set (see browser.ts), i.e. only
// under the Playwright suite's dev server. Real dev/prod never sets this var,
// so OSRM/MapTiler stay genuinely real everywhere else, per CLAUDE.md.
//
// Mocked via MSW, not Playwright's page.route(): once MSW's service worker
// has claimed a page, route() can't intercept requests it passes through
// (verified empirically — visible via page.on('request'), never reaches a
// route() handler) since the fetch executes in the SW's context, a different
// CDP target than the page. MSW is already the interception layer this app
// uses, so mocking through it too — rather than fighting it with a second,
// incompatible mechanism — is the only approach that actually works.

// Long enough that `roadOrStraight()` never falls back to the 2-point
// straight line — tests assert "coords > 2" as a real regression check
// (see docs/decisions.md, 2026-07-23 straight-line bug).
const MOCK_ROUTE_COORDS: [number, number][] = [
  [37.6173, 55.7558],
  [37.615, 55.7548],
  [37.612, 55.7535],
  [37.6095, 55.7525],
  [37.6047, 55.7658],
]

const MOCK_PLACES = [
  { id: 'e2e-1', text: 'ул. Тверская, 12', place_name: 'ул. Тверская, 12, Тверской район, Москва', center: [37.6047, 55.7658] },
  { id: 'e2e-2', text: 'Красная площадь', place_name: 'Красная площадь, Москва', center: [37.6208, 55.7539] },
  { id: 'e2e-3', text: 'Парк Горького', place_name: 'Парк Горького, Главный вход, Москва', center: [37.6019, 55.7298] },
]

// No sources/layers is a valid, fully-loadable MapLibre style — the map
// fires `load` immediately, our own markers/route-line render on top, and
// MapLibre never requests tiles for sources that don't exist, so there's no
// separate tile-mocking needed.
const EMPTY_STYLE = { version: 8, sources: {}, layers: [] }

export const e2eHandlers: HttpHandler[] = [
  http.get('https://router.project-osrm.org/route/v1/driving/*', () =>
    HttpResponse.json({ code: 'Ok', routes: [{ geometry: { coordinates: MOCK_ROUTE_COORDS } }] }),
  ),
  http.get('https://api.maptiler.com/maps/basic-v2/style.json', () => HttpResponse.json(EMPTY_STYLE)),
  http.get('https://api.maptiler.com/geocoding/:query.json', ({ params }) => {
    const query = String(params.query)
    // Reverse geocode requests look like "{lng},{lat}" — forward search is
    // free text. Sniff on that rather than parsing separate routes.
    const isReverse = /^-?\d+\.\d+,-?\d+\.\d+$/.test(query)
    return HttpResponse.json({ features: isReverse ? [MOCK_PLACES[0]] : MOCK_PLACES })
  }),
]
