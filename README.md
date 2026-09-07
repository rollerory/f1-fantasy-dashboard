# F1 Fantasy League Dashboard

Візуалізація приватної ліги [12834205](https://fantasy.formula1.com/en/leagues/leaderboard/private/12834205)
на fantasy.formula1.com.

## Як це працює

1. `scripts/fetch_leaderboard.py` тягне публічний feed ліги
   (`https://fantasy.formula1.com/feeds/leaderboard/privateleague/list_1_12834205_0_1.json`)
   і дописує новий знімок у `data/history.json`, якщо дані змінилися.
2. GitHub Actions (`.github/workflows/fetch-data.yml`) запускає цей скрипт
   кожні 6 годин і комітить оновлений `data/history.json` у `main`.
3. Кожен пуш у `main` тригерить `.github/workflows/deploy-pages.yml`, який
   копіює `data/history.json` у `web/public/data/`, білдить React-застосунок
   (Vite) і публікує його на GitHub Pages.
4. Фронтенд (`web/`) читає `data/history.json` і малює графік очок у часі,
   турнірну таблицю та кілька stat-tiles.

## Локальний запуск

```bash
# оновити дані вручну
python3 scripts/fetch_leaderboard.py

# скопіювати їх у фронтенд і підняти dev-сервер
mkdir -p web/public/data
cp data/history.json web/public/data/history.json
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
