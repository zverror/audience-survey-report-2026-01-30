# Audience Survey Report (HTML)

Сводный отчёт по XLSX-выгрузке с ответами аудитории.

## Что внутри
- `analyze.mjs` — парсер XLSX → агрегаты в `public/data/report.json`
- `public/index.html` — страница отчёта
- Графики: Chart.js (CDN)

## Как запустить локально
```bash
npm i
node analyze.mjs /path/to/file.xlsx
npx http-server public -p 8080
```
Открой: http://127.0.0.1:8080

## Приватность
Сырой файл XLSX в репозиторий не добавляйте. Отчёт использует только агрегаты и короткие цитаты без контактов.
