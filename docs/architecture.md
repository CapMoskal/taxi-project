# Архитектура

## Слои

```
src/
├── app/        store (RTK), корневой App, провайдеры
├── entities/   доменные сущности: order, driver, ride, user — RTK slices/api
├── features/   флоу и юзкейсы: order-flow (XState-машина), class-picker, payment...
├── screens/    экраны-контейнеры, собирают entities+features в страницу
└── shared/
    ├── ui/     обёртки над shadcn/ui, переиспользуемые примитивы
    ├── map/    MapLibre-обвязка, интерполяция маркера по треку
    └── mocks/  MSW handlers + фикстуры данных
```

`src/components/ui/` — сырые компоненты shadcn/ui (генерируются CLI,
`npx shadcn@latest add <name>`), не трогать руками напрямую — доедаем в
`shared/ui/` при необходимости кастомизации сверх токенов.

## Как стыкуются данные

1. **RTK Query** — единственный источник сетевых данных. Компоненты не дергают
   `fetch` напрямую. Эндпоинты живут рядом с сущностью в `entities/*/api.ts`.
2. **MSW** перехватывает все запросы RTK Query на уровне Service Worker
   (`src/shared/mocks/browser.ts`, хендлеры — `src/shared/mocks/handlers.ts`).
   Включается только в dev (`import.meta.env.PROD` гейт в `main.tsx`). Фронт не
   знает, что бэкенда нет — честные loading/error state.
3. **XState** — машина состояний флоу заказа (`features/order-flow`). Триггерится
   результатами RTK Query мутаций/запросов, не дублирует их кэш — только
   оркестрирует переходы (поиск машины → назначена → едет → в поездке → завершено).
4. **MapLibre** — `shared/map` содержит обёртку над картой и хук интерполяции
   маркера по заранее заданному полилайну (`requestAnimationFrame`, без реального
   routing API — см. `decisions.md`).

## PWA / MSW gate

`vite-plugin-pwa` собирает манифест и service worker для прод-сборки.
`mockServiceWorker.js` (MSW) — отдельный SW, работает только в dev через
`enableMocking()` в `main.tsx`. В проде (`import.meta.env.PROD`) MSW не
инициализируется — бэкенд в проде отсутствует по определению проекта (см.
START_HERE/CLAUDE.md), поэтому прод-сборка сейчас — чисто демонстрационный
артефакт (npm run build работает, но живого API за ним нет).

## Алиас

`@/*` → `src/*`, настроено и в `vite.config.ts` (resolve.alias), и в
`tsconfig.app.json` + продублировано в корневом `tsconfig.json` (нужно для
корректной работы `shadcn` CLI — см. `decisions.md`).
