# Архитектура

## Слои

```
src/
├── app/        store (RTK), корневой App, провайдеры
├── entities/   доменные сущности: ride-class, driver (готово), order/user — по мере роадмапа
├── features/   флоу и юзкейсы: order-flow (XState-машина + экраны состояний)
├── screens/    экраны-контейнеры, собирают entities+features в страницу
└── shared/
    ├── ui/     обёртки над shadcn/ui, переиспользуемые примитивы (BottomSheet)
    ├── map/    MapLibre-обвязка (MapCanvas), интерполяция маркера по треку
    ├── geo/    чистая геометрия (LatLng, haversineDistanceMeters) — без React/карты
    ├── lib/    мелкие чистые утилиты без домена (formatCurrency.ts)
    └── mocks/  MSW handlers (ре-экспорт из entities/*/mocks.ts) + browser.ts
```

`src/components/ui/` — сырые компоненты shadcn/ui (генерируются CLI,
`npx shadcn@latest add <name>`), не трогать руками напрямую — доедаем в
`shared/ui/` при необходимости кастомизации сверх токенов.

`shared/geo` вынесен из `shared/map` намеренно: геометрия (расстояние,
координаты) нужна и рендерингу карты, и MSW-хендлерам расчёта цены
(`entities/ride-class/mocks.ts`) — а mock-слой не должен зависеть от
карт-рендеринга. `shared/map` не импортируется из `entities/*`.

## `features/order-flow` — детально

Ядро приложения, всё вокруг одной XState-машины (`machine.ts`,
`orderFlowMachine`, v5 `setup().createMachine()`):
`idle → selectingDestination → selectingClass → searchingDriver →
driverAssigned → enRoute → arrived → inRide → completed (parallel:
payment/rating) → done → (RESET) → idle`.

- `context.ts` — `createActorContext(orderFlowMachine)`, провайдер
  (`OrderFlowProvider`) заворачивает `OrderScreen`, не корень приложения.
- `types.ts` — `OrderFlowContext`/`OrderFlowEvent`. `GeoCoords` и
  `RideClassId` — **ре-экспорты**, не собственные типы (см. ниже).
- `demoRoute.ts` — `DEMO_PICKUP` (фиксированная точка A, реальной геолокации
  пока нет) + `getDriverStartPoint()` (смещение для этапа `enRoute`,
  относительно pickup, не абсолютная точка на карте).
- `useRideAutomation.ts` (переименован из `useDriverLocationSimulator.ts`) —
  единая точка автоматизации всего цикла вождения, не только rAF-трекинг
  позиции (использует `shared/map/useAnimatedPosition`, полилинии строятся
  из `context.pickup`/`context.destination` через `useMemo`): таймер
  `driverAssigned → DRIVER_EN_ROUTE` (2с) и завершение каждой ноги
  (`onComplete` от `useAnimatedPosition`) → `DRIVER_ARRIVED`/`RIDE_COMPLETED`.
  `arrived → inRide` этим хуком не триггерится — это кнопка «Начать
  поездку» в `DriverCard`, осознанное действие пассажира, не таймер.
- `SelectingDestinationControls.tsx` / `ClassPickerSheet.tsx` /
  `DriverSearchPanel.tsx` — реальный UI для состояний
  `selectingDestination`/`selectingClass`/`searchingDriver` (центр-пин+drag,
  bottom-sheet с ценами, bottom-sheet с поиском водителя через
  `entities/driver`). `ClassPickerSheet` шлёт `CONFIRM_CLASS` с `fare`
  выбранного класса — цена фиксируется здесь, `context.fare` больше не
  переписывается при `RIDE_COMPLETED`.
- `DriverCard.tsx` — персистентная карточка (не bottom sheet, `absolute
  top-0`), показывается поверх карты, пока `context.driver !== null` и
  состояние — одно из `driverAssigned`/`enRoute`/`arrived`/`inRide`.
  Статус-текст под именем водителя меняется по состоянию; кнопка «Начать
  поездку» (`arrived`) и ссылка «Отменить» (`driverAssigned`/`enRoute`)
  живут здесь же, не в debug-панели.
- `RideCompletionSheet.tsx` — bottom sheet на `completed`. Чек (водитель,
  расстояние через `haversineDistanceMeters`, цена), затем оплата и
  рейтинг — оба читаются партиальным матчем по параллельным регионам
  (`snapshot.matches({ completed: { payment: 'pending' } })`, идиоматичный
  XState v5), каждый независимо переключается на строку-подтверждение
  после `SUBMIT_PAYMENT`/`SUBMIT_RATING`. `RideDoneCard.tsx` — bottom sheet
  на `done`, кнопка «Заказать снова» (`RESET`).
- `OrderFlowDebugPanel.tsx` — dev-only (`import.meta.env.DEV`), кнопки
  только для `idle` (кнопка «Начать заказ» — единственный вход в поток,
  реального UI для него пока нет, известный отдельный пробел). Возвращает
  `null` для всех остальных состояний — весь флоу от
  `selectingDestination` до `done` покрыт реальным UI.

## Как стыкуются данные

1. **RTK Query** — единственный источник сетевых данных. Компоненты не дергают
   `fetch` напрямую. Эндпоинты живут рядом с сущностью в `entities/*/api.ts`
   (пример: `entities/ride-class/api.ts`, `useGetRideClassQuotesQuery`).
2. **MSW** перехватывает все запросы RTK Query на уровне Service Worker
   (`src/shared/mocks/browser.ts`, хендлеры собираются в
   `src/shared/mocks/handlers.ts` ре-экспортом из `entities/*/mocks.ts` —
   конвенция из `.claude/rules/msw-mocking.md`). Включается только в dev
   (`import.meta.env.PROD` гейт в `main.tsx`). Фронт не знает, что бэкенда
   нет — честные loading/error state (см. `ClassPickerSheet.tsx`).
3. **`app/store.ts`** регистрирует reducer+middleware каждого RTK Query
   api-slice (`[api.reducerPath]: api.reducer`,
   `getDefaultMiddleware().concat(api.middleware)`) — при добавлении нового
   `entities/*/api.ts` не забыть подключить сюда.
4. **XState** — машина состояний флоу заказа (`features/order-flow`).
   Оркестрирует переходы; серверные (мокнутые) данные читает через RTK Query
   хуки в компонентах-состояниях, не дублирует их кэш в своём контексте —
   контекст хранит только то, что относится к самому флоу (pickup,
   destination, выбранный класс, водитель, geo-позиция).
5. **MapLibre** (`shared/map/MapCanvas`) — единая точка входа для всего, что
   рисуется на карте: `markers` (массив `{id, position, color}`, diff по id —
   pickup/destination/driver одновременно), `routeLine` (GeoJSON line-слой),
   `routeBounds` (камера через `fitBounds`), `showCenterPin` (CSS-оверлей для
   выбора точки). Консьюмеры не трогают `maplibregl.Map`/`Marker` напрямую.
   **Важно:** цвета маркеров (`var(--primary)` и т.п.) резолвятся браузером
   нативно (SVG `fill`), но MapLibre `paint`-свойства слоёв (WebGL) CSS
   custom properties и `oklch()` не понимают — для линий маршрута цвет
   квантуется через `resolveCssColor()` (canvas 1×1), см. `decisions.md`.

## PWA / MSW gate

`vite-plugin-pwa` собирает манифест и service worker для прод-сборки.
`mockServiceWorker.js` (MSW) — отдельный SW, работает только в dev через
`enableMocking()` в `main.tsx`. В проде (`import.meta.env.PROD`) MSW не
инициализируется — бэкенд в проде отсутствует по определению проекта (см.
CLAUDE.md), поэтому прод-сборка сейчас — чисто демонстрационный артефакт
(`npm run build` работает, но живого API за ним нет). Реальным UI сейчас
покрыто всё, кроме входа в поток: `selectingDestination` → ... → `done`
целиком, включая автоматические переходы. `idle` (кнопка «Начать заказ»)
всё ещё только через dev-only debug-панель — в проде сейчас в принципе
негде нажать «Начать заказ». Это единственный оставшийся пробел на пути к
прод-демо для Миши (см. последний пункт `roadmap.md`).

## Алиас

`@/*` → `src/*`, настроено и в `vite.config.ts` (resolve.alias), и в
`tsconfig.app.json` + продублировано в корневом `tsconfig.json` (нужно для
корректной работы `shadcn` CLI — см. `decisions.md`).
