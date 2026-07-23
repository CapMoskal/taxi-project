# CLAUDE.md

Витрина такси-приложения (не клон Яндекс Такси). Заказчик — Миша, показывает
кому-то как демо; сам будет донастраивать дальше. Фронт должен выглядеть дорого
и убедительно работать — без реального бэкенда.

## Стек

Vite + React + TypeScript + Redux Toolkit (RTK Query) + MSW + XState + Tailwind
v4 + shadcn/ui + Motion (ex-Framer Motion) + MapLibre GL + vite-plugin-pwa.

## Команды

```
npm run dev      # dev-сервер
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # прод-сборка локально
```

## Жёсткие правила

1. **Нет бэкенда.** «Работает» = MSW перехватывает сеть и имитирует поведение
   (задержки, статусы заказа, геопозицию). Компоненты не знают, что бэкенда нет.
   MSW работает **во всех средах, включая прод** (демо хостится на Vercel,
   автодеплой из `main`) — не возвращать dev-гейт (`.claude/rules/msw-mocking.md`).
2. **Mobile-first.** Десктоп — бонус, не наоборот. Смотреть в мобильном
   вьюпорте.
3. **Plan mode перед нетривиальной задачей.** Один пункт `docs/roadmap.md` —
   одна `feature/<slug>` ветка (см. `.claude/rules/git-workflow.md`).
   **Модель по ролям:** планирует всегда Opus, код по готовому плану пишет
   Sonnet. После презентации плана — остановиться и попросить Eugene
   переключить модель на Sonnet и написать «продолжай», не начинать
   реализацию на Opus.
4. **XState — источник истины для флоу заказа**, RTK Query — источник истины
   для серверных (мокнутых) данных. Не дублировать один в другом.
5. **Дизайн-токены — только через CSS-переменные** в `src/index.css`, не
   хардкодить цвета/радиусы в компонентах (см. `.claude/rules/design-tokens.md`).
6. **Архитектурные решения — в `docs/decisions.md`**, не устно и не только в
   коммите.
7. Перед коммитом — `npm run build` и `npm run lint` зелёные
   (`.claude/rules/testing.md`).

## Глубокие доки

- `docs/architecture.md` — слои (app/entities/features/screens/shared), как
  стыкуются RTK Query / XState / MSW / MapLibre.
- `docs/decisions.md` — ADR-лог по фичам. Грабли скаффолда (Vite 8→6, shadcn
  alias-баг и т.п.) — в `docs/_archive/decisions-scaffold.md`.
- `docs/roadmap.md` — фича-за-фичей план, меняется по ходу. Подробности по
  завершённым пунктам — `docs/_archive/roadmap-done.md`.
- `.claude/rules/design-tokens.md` — «светлый минимализм», изумрудный
  `--primary` (зафиксировано), скругления/шрифт — дефолт preset shadcn/ui.
- `.claude/rules/git-workflow.md` — ветки, коммиты.
- `.claude/rules/msw-mocking.md` — конвенции моков.
- `.claude/rules/testing.md` — что гонять перед коммитом.
