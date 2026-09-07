# F1 Fantasy League Dashboard

Візуалізація приватної ліги [12834205](https://fantasy.formula1.com/en/leagues/leaderboard/private/12834205)
на fantasy.formula1.com.

## Як це працює

1. `scripts/fetch_leaderboard.py` тягне публічний feed сезонного тоталу ліги
   (`.../list_1_12834205_0_1.json`) і дописує новий знімок у `data/history.json`,
   якщо дані змінилися.
2. `scripts/fetch_gp_history.py` тягне feed з очками за кожен окремий
   Гран-прі (`.../list_2_12834205_{gp_id}_1.json`, де `gp_id` — порядковий
   номер туру в сезоні: 1, 2, 3...) і зберігає всі тури в `data/gp_history.json`.
   Назви турів (id → назва) лежать окремо в `data/gp_names.json`, бо сам feed
   назв не віддає — онови цей файл вручну, коли з'являється новий Гран-прі.
3. GitHub Actions (`.github/workflows/fetch-data.yml`) запускає обидва скрипти
   кожні 6 годин і комітить оновлені дані у `main`.
4. Кожен пуш у `main` тригерить `.github/workflows/deploy-pages.yml`, який
   копіює `data/*.json` у `web/public/data/`, білдить React-застосунок (Vite)
   і публікує його на GitHub Pages.
5. Фронтенд (`web/`) читає ці JSON-файли й малює графік очок за сезон, графік
   очок за кожен Гран-прі, турнірну таблицю та кілька stat-tiles.

## Локальний запуск

```bash
# оновити дані вручну
python3 scripts/fetch_leaderboard.py
python3 scripts/fetch_gp_history.py

# скопіювати їх у фронтенд і підняти dev-сервер
mkdir -p web/public/data
cp data/history.json data/gp_history.json data/gp_names.json web/public/data/
cd web
npm install
npm run dev
```

## Деплой на GitHub Pages

1. Створи репозиторій на GitHub і запуш цей проєкт.
2. У Settings → Pages встанови Source = **GitHub Actions**.
3. Якщо назва репозиторію відрізняється від `f1-fantasy-dashboard`, онови
   `base` у `web/vite.config.ts` на `/<назва-репо>/`.
4. Перший запуск `deploy-pages.yml` можна тригернути вручну
   (Actions → Deploy dashboard to GitHub Pages → Run workflow).

## Відомі обмеження / що можна додати далі

- `roster` в кожному записі — це ID гонщиків/бустерів зі статичного довідника
  F1 Fantasy, а не імена. Щоб показувати реальні склади команд, потрібно
  знайти ще один feed зі списком гравців (ID → ім'я) і додати мапінг.
- Дані оновлюються не в реальному часі, а раз на 6 годин через cron —
  цього достатньо для фентезі-ліги, де очки змінюються після гонок.
