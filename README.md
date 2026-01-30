# Audience Survey Report (HTML)

Сводный отчёт по XLSX-выгрузке с ответами аудитории.

## Что внутри
- `analyze.mjs` — парсер XLSX → агрегаты в `public/data/report.json`
- `public/index.html` — страница отчёта
- Графики: Chart.js (CDN)

## Как посмотреть отчёт
Вариант 1 (самый простой):
- Открой файл `public/index.html` двойным кликом (через `file://`) — страница работает без сервера.

Вариант 2 (GitHub Pages):
- Settings → Pages → Deploy from a branch → `master` + `/public`.

## Как пересобрать отчёт из нового XLSX
```bash
npm i
node analyze.mjs /path/to/file.xlsx
# затем (важно) обновить public/data/report.js:
node -e "import fs from 'fs'; const j=JSON.parse(fs.readFileSync('./public/data/report.json','utf-8')); fs.writeFileSync('./public/data/report.js','window.REPORT='+JSON.stringify(j)+';\n','utf-8');"
```

## Приватность
Сырой файл XLSX в репозиторий не добавляйте. Отчёт использует только агрегаты и короткие цитаты без контактов.
