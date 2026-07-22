# Архитектура

## Слои

```
src/
├── app/        store (RTK), корневой App, провайдеры, навигация
├── entities/   доменные сущности: ride-class, driver, user, ride-history (готово) — по мере роадмапа
├── features/   флоу и юзкейсы: order-flow (XState-машина + экраны состояний)
├── screens/    экраны-контейнеры: order (карта+флоу), profile, history
└── shared/
    ├── ui/     обёртки над shadcn/ui, переиспользуемые примитивы (BottomSheet, InitialsAvatar)
    ├── map/    MapLibre-обвязка (MapCanvas), интерполяция маркера по треку
    ├── geo/    чистая геометрия (LatLng, haversineDistanceMeters) — без React/карты
    ├── lib/    мелкие чистые утилиты без домена (formatCurrency.ts)
    └── mocks/  MSW handlers (ре-экспорт из entities/*/mocks.ts) + browser.ts
```

## Навигация между экранами

Роутера нет намеренно (см. `decisions.md`) — приложение держит «активный
экран» в лёгком React-контексте `app/`:
- `app/navigationContext.ts` — `NavigationContext` + хук `useNavigation()` +
  тип `Screen` (`'order' | 'profile' | 'history'`). Разбито на два файла с
  `NavigationProvider.tsx`, чтобы не мешать компонент и хук в одном модуле
  (`react(only-export-components)`).
- `app/App.tsx` — `NavigationProvider` → `OrderFlowProvider` → переключатель
  экранов. **`OrderFlowProvider` поднят сюда** (раньше был внутри
  `OrderScreen`), чтобы XState-актор жил над переключателем и не сбрасывался
  при уходе на профиль и обратно.
- Экраны читают `useNavigation()` напрямую (профиль — back-кнопка + строка в
  историю, `ProfileButton` (`screens/order/`) — аватар в профиль, история —
  back в профиль).
  Фичи (`features/order-flow`) про навигацию не знают — это ответственность
  слоя экранов.
- **Навигация плоская, без back-стека**: `screen` — одно значение, каждый
  экран хардкодит своего родителя для back (профиль→заказ, история→профиль).
  Граф пока линейный (заказ→профиль→история); если появятся несколько путей
  в один экран — добавим стек тогда, сейчас это лишняя сложность.

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
`selectingPickup → selectingDestination → selectingClass →
searchingDriver → driverAssigned → enRoute → arrived → inRide →
completed (parallel: payment/rating) → done → (RESET) → selectingPickup`.
**Нет состояния `idle`** — `selectingPickup` и есть первый экран, без
стартового гейта (см. ниже и `decisions.md`).

- `context.ts` — `createActorContext(orderFlowMachine)`, провайдер
  (`OrderFlowProvider`) заворачивает `OrderScreen`, не корень приложения.
- `types.ts` — `OrderFlowContext`/`OrderFlowEvent`. `GeoCoords` и
  `RideClassId` — **ре-экспорты**, не собственные типы (см. ниже).
  `context.userLocation` — реальный GPS («Вы здесь»), отдельно от `pickup`
  (точка подачи A): пользователь может уточнить A drag'ом, «Я» остаётся на
  реальной позиции (модель Яндекса).
- `selectingPickup` — **первый экран приложения** (нет стартового
  «Начать заказ», полная модель Яндекса — референс-скрин от Eugene,
  2026-07-23, см. `decisions.md`). Два компонента, оба монтируются только на
  этой фазе (значимо для повторного заказа, см. ниже):
  - **`PickupResolver.tsx`** — headless-сидер: через
    `shared/lib/useCurrentPosition` на сетлении шлёт `SET_USER_LOCATION` +
    `SET_PICKUP` (реальные координаты или `DEMO_PICKUP`-fallback при
    отказе/таймауте, оба события — top-level `on` машины, доступны в любом
    состоянии) и `jumpTo` к точке (не `flyTo` — mid-flight-хазард), гейтится
    по `pickup === null` — ровно один раз на заказ. Никакого UI и
    авто-`CONFIRM_PICKUP` не шлёт — переход теперь ручной.
  - **`PickupSheet.tsx`** — реальный UI: центр-пин карты **и есть** точка A
    (тот же паттерн, что `DestinationSheet` использует для Б) — драг карты
    → `moveend` → `SET_PICKUP(map.getCenter())`, без гейта на
    `originalEvent` (эта фаза не крутит камеру программно). Сверху пилюля
    «Точка подачи · адрес» (`useReverseGeocodeQuery`, до резолва —
    «Определяем местоположение…»); снизу компактный `BottomSheet` (без
    свайпа, `max-h-[45vh]` + внутренний скролл списка — **важно**: без
    капа список из 5 моковых недавних адресов растягивает шит выше
    геометрического центра экрана и закрывает центр-пин, хотя
    `map.getCenter()` продолжает репортить координату честно — баг найден
    и пофикшен в этой же фиче, см. `decisions.md`) с плейсхолдером «Куда
    едем?» (→ `CONFIRM_PICKUP`, задизейблен пока `pickup === null`) и
    списком недавних адресов (`useGetRecentPlacesQuery` — тап: `jumpTo` на
    адрес + `CONFIRM_PICKUP`, попадаем на `selectingDestination` с
    центр-пином Б уже на этом адресе, не сразу в класс). **Важный
    гард** (`isLeavingRef`): `jumpTo` при выборе недавнего адреса тоже
    шлёт `moveend` — без гарда всё ещё смонтированный listener принял бы
    его за «пользователь подвинул A» и переписал `pickup` координатами Б
    (`pickup === destination` → OSRM возвращает вырожденный маршрут из 2
    точек), см. `decisions.md`.
  - **Повторный заказ**: монтирование обоих по `isPickupPhase` (а не
    постоянное на весь `OrderScreen`) — не косметика: `useCurrentPosition`
    дергает геолокацию на mount, и если бы `PickupResolver` не
    размонтировался на время поездки, второй заказ подряд остался бы без
    геопозиции (запрос не переспросился бы). `RESET`/`CANCEL_RIDE` теперь
    ведут в `selectingPickup` (не `idle`, которого больше нет) —
    `pickup: null` в свежем контексте снова запускает `PickupResolver`.
- `demoRoute.ts` — `DEMO_PICKUP` (fallback для точки A, когда геолокация
  недоступна) + `getDriverStartPoint()` (смещение для этапа `enRoute`,
  относительно pickup, не абсолютная точка на карте).
- `useRideAutomation.ts` (переименован из `useDriverLocationSimulator.ts`) —
  единая точка автоматизации всего цикла вождения, не только rAF-трекинг
  позиции (использует `shared/map/useAnimatedPosition`, полилинии строятся
  из `context.pickup`/`context.destination` через `useMemo`): таймер
  `driverAssigned → DRIVER_EN_ROUTE` (2с) и завершение каждой ноги
  (`onComplete` от `useAnimatedPosition`) → `DRIVER_ARRIVED`/`RIDE_COMPLETED`.
  `arrived → inRide` этим хуком не триггерится — это кнопка «Начать
  поездку» в `DriverCard`, осознанное действие пассажира, не таймер.
- `PickupResolver.tsx`+`PickupSheet.tsx` / `DestinationSheet.tsx` /
  `ClassPickerSheet.tsx` / `DriverSearchPanel.tsx` — реальный UI для
  `selectingPickup`/`selectingDestination`/`selectingClass`/
  `searchingDriver`. Метки по фазам (в `OrderScreen`): «Вы здесь» dot
  (`context.userLocation`) виден с первого экрана, как только геолокация
  резолвилась, и остаётся на `selectingPickup`/`selectingDestination`;
  метка A (чёрный pin) — с `selectingDestination` (на `selectingPickup`
  фиксированного A-пина ещё нет — сам центр-пин и есть кандидат A); Б —
  красный pin; водитель — изумруд. **Центр-пин изумрудный**
  (`fill-primary`), а не чёрный — иначе камуфлировал бы чёрную метку A (был
  реальный баг «A не видно»). `showCenterPin` включён на
  `selectingPickup`**и**`selectingDestination` (центр-пин + drag карты —
  механизм выбора и A, и Б; `PickupSheet`/`DestinationSheet` добавляют
  поиск/список поверх, не заменяют). `ClassPickerSheet` шлёт `CONFIRM_CLASS`
  с `fare` выбранного класса — цена фиксируется здесь, `context.fare`
  больше не переписывается при `RIDE_COMPLETED`.
- **`DestinationSheet.tsx`** — свайпаемая плашка выбора точки Б (в стиле
  Яндекса): инпут адреса + список (недавние адреса или live-поиск), сама
  плашка тянется пальцем (Motion `drag="y"`, снап по velocity/позиции
  между `peek`/`expanded`) и **отъезжает вниз (`retreated`)**, пока
  пользователь двигает/зумит карту (`map.on('dragstart'|'zoomstart')`,
  гейт по `e.originalEvent` — отличает жест пользователя от программного
  `jumpTo`), возвращаясь в состояние **до** взаимодействия (не всегда в
  `peek`) на `moveend`. **`moveend`-обработчик без гейта на
  `originalEvent`** (только проверка «плашка сейчас retreated») — как и в
  `useMapCameraFollow`, MapLibre шлёт финальный `moveend` после
  инерционного доторможения программно, без `originalEvent`; с гейтом
  restore не срабатывал бы на быстром флик-драге, см. `decisions.md`. Тап
  по адресу (недавнему или из поиска) — `jumpTo` карты на точку (не
  `flyTo`, тот же mid-flight-хазард, см. ниже) и сворачивает плашку в
  `peek`; подтверждение по-прежнему читает `map.getCenter()` — логика не
  изменилась, только источник координат (drag карты **или** выбор адреса,
  оба сходятся в один и тот же центр карты). Reverse-geocode адреса центра
  карты на `moveend` обновляет текст инпута (гейт по `isInputFocusedRef` —
  не перетирает то, что пользователь печатает). **Адреса не хранятся в
  XState-контексте** — только `LatLng`; текстовые адреса (A и Б) — RTK
  Query кэш (`geocodingApi`), читаются прямо в компоненте.
  **Кнопка «Подтвердить точку назначения» — отдельный слой** (`z-30`,
  `data-slot="destination-confirm-footer"`), не внутри свайпаемого
  `motion.div` (`z-20`): в `peek` плашка видна только на ~38% (translateY
  вниз на `peekY`), а кнопка была последним ребёнком — уезжала за нижний
  край экрана вместе с остальным контентом, реально видна была только в
  `expanded`. Вынесена наружу — видна всегда независимо от снапа, см.
  `decisions.md`. **Прогрев маршрута**: пока плашка открыта,
  `useGetRouteQuery({from: pickup, to: candidateDestination})` подписан на
  ту же пару координат, что подтвердит `handleConfirm` (`candidateDestination`
  обновляется на каждый `moveend`, без гейта на retreated — в отличие от
  `draggedCenter`/восстановления снапа) — к моменту тапа «Подтвердить» OSRM
  уже отдал road-геометрию, `OrderScreen`/`useRideAutomation` переиспользуют
  тот же закэшированный запрос вместо прямой линии, см. `decisions.md`.
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

Вход в поток — `screens/order/ProfileButton.tsx` (аватар-кнопка в профиль,
рендерится на `selectingPickup` рядом с `PickupSheet`), в слое экрана, а не
фичи, т.к. композирует app-навигацию. Нет отдельного «стартового» экрана —
`selectingPickup` и есть первый экран (см. выше). **Debug-панель удалена** —
весь флоу `selectingPickup → … → done` покрыт реальным UI, dev-only
скаффолд больше не нужен.

## Как стыкуются данные

1. **RTK Query** — единственный источник сетевых данных. Компоненты не дергают
   `fetch` напрямую. Эндпоинты живут рядом с сущностью в `entities/*/api.ts`
   (пример: `entities/ride-class/api.ts`, `useGetRideClassQuotesQuery`).
   **Исключение — `shared/map/routingApi.ts`**: тоже RTK Query, но с
   реальным внешним `baseUrl` (`router.project-osrm.org`), а не `/api`. Это
   не доменная сущность и не мокнутый эндпоинт (нет `mocks.ts`), а
   инфраструктура карты, как тайлы MapTiler — реальный сервис, живой и в
   dev, и в prod. RTK Query выбран ради кеша-по-аргументам и дедупа: линия
   маршрута (`OrderScreen`) и анимация водителя (`useRideAutomation`)
   запрашивают один и тот же `pickup→destination` и схлопываются в один
   сетевой запрос. См. `decisions.md`. **`shared/map/geocodingApi.ts`** —
   тот же паттерн, для MapTiler Geocoding (forward-поиск адреса +
   reverse-геокодинг), общий ключ с тайлами (`shared/map/config.ts`
   экспортирует `MAPTILER_KEY`). `entities/recent-place/` — наоборот,
   обычная mock-сущность (недавние адреса, `/api/recent-places`), не
   путать с geocoding: recent-place — «наши» данные через MSW, geocoding —
   реальный внешний сервис.
2. **MSW** перехватывает запросы RTK Query к `/api/*` на уровне Service
   Worker (`src/shared/mocks/browser.ts`, хендлеры собираются в
   `src/shared/mocks/handlers.ts` ре-экспортом из `entities/*/mocks.ts` —
   конвенция из `.claude/rules/msw-mocking.md`). Включается только в dev
   (`import.meta.env.PROD` гейт в `main.tsx`), настроен
   `onUnhandledRequest: 'bypass'` — реальные внешние вызовы (OSRM, тайлы)
   проходят насквозь, не мокаются. Фронт не знает, что бэкенда нет —
   честные loading/error state (см. `ClassPickerSheet.tsx`).
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
   рисуется на карте: `markers` (массив `{id, position, color, variant}`,
   diff по id — user/pickup/destination/driver одновременно; `variant: 'dot'`
   — кастомный элемент `.location-dot` для «Вы здесь», иначе teardrop-pin),
   `routeLine` (GeoJSON line-слой, сплошная тёмная линия), `showCenterPin`
   (CSS-оверлей для выбора точки). Камера в `MapCanvas` **не управляется**
   — это отдельная ответственность, см. `useMapCameraFollow` ниже.
   Консьюмеры не трогают `maplibregl.Map`/`Marker` напрямую.
   **Важно:** цвета маркеров (`var(--primary)` и т.п.) резолвятся браузером
   нативно (SVG `fill`), но MapLibre `paint`-свойства слоёв (WebGL) CSS
   custom properties и `oklch()` не понимают — для линий маршрута цвет
   квантуется через `resolveCssColor()` (canvas 1×1), см. `decisions.md`.
   `routeLine` — реальная road-геометрия из `routingApi` (OSRM), не прямая
   A→Б; та же геометрия кормит анимацию маркера в `useRideAutomation`
   (`useAnimatedPosition` интерполирует по многоточечной полилинии). Обе
   ноги (подъезд водителя `enRoute` и поездка `inRide`) едут по дорогам.
   Fallback на прямую линию, если OSRM недоступен — `roadOrStraight()`.
6. **`shared/map/useMapCameraFollow`** — камера, которая следит за поездкой
   (вызывается из `OrderScreen`, не из `MapCanvas`). Throttled `fitBounds`
   (~раз в секунду, не на каждый кадр) по кадру, который зависит от фазы:
   такси + следующая точка в движении (`enRoute`: такси+A, `inRide`:
   такси+Б — не всегда Б, см. `decisions.md`), [A, Б] на выборе класса и
   ожидании водителя. Ручной drag/zoom/rotate пользователя (гейт на
   `e.originalEvent`) приостанавливает слежение; автовозврат через 4с
   бездействия (`moveend`, **без** гейта на `originalEvent` — инерция
   MapLibre после драга шлёт финальный `moveend` программно, без
   `originalEvent`, гейт бы просто не пустил автовозврат). Кнопки
   «recenter» нет. `padding` разный по фазе — под нижний шит
   (`selectingClass`/`searchingDriver`) или под `DriverCard` сверху.

## PWA / MSW gate

`vite-plugin-pwa` собирает манифест и service worker для прод-сборки.
Манифест (`vite.config.ts`): «Такси», `theme_color: #059669` (изумруд,
бренд), `background_color: #fff`, `standalone`, `portrait`, иконки
192/512/512-maskable из `public/` (изумрудный фон + белый глиф машины,
сгенерированы одноразовым скриптом; фиолетовый favicon от скаффолда заменён
на изумрудный). apple-touch-icon и apple-теги — в `index.html` (плагин их не
инжектит). Offline трёхуровневый: precache оболочки
(`workbox.navigateFallback` + `globPatterns`), runtime-кэш тайлов MapTiler
(`runtimeCaching`, StaleWhileRevalidate — уже виденные участки карты
доступны офлайн), и индикатор `shared/ui/OfflineBanner` (по
`shared/lib/useOnlineStatus`, `navigator.onLine`) поверх любого экрана.

`mockServiceWorker.js` (MSW) — отдельный SW, работает только в dev через
`enableMocking()` в `main.tsx`. В проде (`import.meta.env.PROD`) MSW не
инициализируется — бэкенд в проде отсутствует по определению проекта (см.
CLAUDE.md). PWA-SW (generateSW) — наоборот, только прод; dev-режим плагина не
включаем, так что MSW-SW и PWA-SW не пересекаются по средам. Весь флоу
заказа `selectingPickup → … → done` + профиль + история покрыты реальным UI.
**Но:** сам API живёт только на MSW, а MSW гейтится на dev — значит голый
`npm run build` даёт нерабочие запросы (профиль/классы/поиск/история
падают). Реальный демо-показ Миши поэтому идёт через `npm run dev`/`preview`
(где MSW жив) — либо на финальном пункте роадмапа снимем dev-гейт с MSW
специально для демо-сборки. Это предмет последнего пункта `roadmap.md`.

## Алиас

`@/*` → `src/*`, настроено и в `vite.config.ts` (resolve.alias), и в
`tsconfig.app.json` + продублировано в корневом `tsconfig.json` (нужно для
корректной работы `shadcn` CLI — см. `decisions.md`).
