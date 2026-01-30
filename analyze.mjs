import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const inPath = process.argv[2] || "/root/.clawdbot/media/inbound/54452efa-b708-47b3-806b-971670debcd0.xlsx";
const outDir = process.argv[3] || "./public/data";
fs.mkdirSync(outDir, { recursive: true });

const wb = XLSX.readFile(inPath, { cellDates: true });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const CLOSED = [
  "1. Ваш возраст",
  "2. Ваш текущий уровень дохода в месяц",
  "3. Чем вы сейчас занимаетесь?",
  "4. Как бы вы описали свой текущий уровень работы с ИИ?",
  "5. Какие темы вам сейчас наиболее интересны?",
  "6. Рассматриваете ли вы ИИ как источник дохода?",
  "7. Какой формат заработка вам сейчас ближе? На чём, по вашему мнению, реально можно зарабатывать с помощью ИИ?",
  "8. Что вы думаете о вайб-кодинге?",
  "11. Готовы ли вы пообщаться со мной или моим маркетологом 15–20 минут в формате интервью, чтобы глубже разобрать ваш опыт, цели и ожидания?"
];

const OPEN_Q9 = "9. Для чего вы изучаете тему ИИ? Какие цели ставите перед собой?";
const OPEN_Q10 = "10. Каких результатов вы хотите достичь в работе и доходе в ближайшие 6–12 месяцев?";

const norm = (s) => (s ?? "").toString().trim();
const normLower = (s) => norm(s).toLowerCase();

function countOptions(col) {
  const counts = new Map();
  let n = 0;
  for (const r of rows) {
    const v = norm(r[col]);
    if (!v) continue;
    n++;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  const options = [...counts.entries()]
    .map(([label, count]) => ({ label, count, pct: n ? (count / n) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
  return { question: col, totalAnswered: n, options };
}

// --- Open text categorization helpers
const hasAny = (text, arr) => arr.some((re) => re.test(text));

function categorizeQ9(text) {
  const t = normLower(text);
  if (!t) return { cat: "Нет ответа", bucket: "empty" };

  // order matters
  if (hasAny(t, [/смен(а|ить)/, /нов(ая|ую) професси/, /устро(ить|иться) на работ/, /найти работ/, /карьер/]))
    return { cat: "Смена профессии / работа в ИИ", bucket: "career" };

  if (hasAny(t, [/свой проект/, /стартап/, /продукт/, /сервис/, /бот/, /сайт/, /прилож/]))
    return { cat: "Свой проект / продукт", bucket: "project" };

  if (hasAny(t, [/фриланс/, /самозанят/, /заказ/, /клиент/, /услуг/]))
    return { cat: "Фриланс / услуги / клиенты", bucket: "freelance" };

  if (hasAny(t, [/контент/, /рилс/, /ютуб/, /tg/, /телеграм/, /блог/, /соцсет/, /маркетинг/]))
    return { cat: "Контент / соцсети / маркетинг", bucket: "content" };

  if (hasAny(t, [/пассив/, /инвест/, /капитал/]))
    return { cat: "Пассивный доход / инвестиции", bucket: "passive" };

  if (hasAny(t, [/автоматизац/, /оптимизац/, /ускор(ить|ение)/, /эффективн/, /рутин/]))
    return { cat: "Автоматизация текущей работы", bucket: "automation" };

  if (hasAny(t, [/заработ/, /доход/, /деньг/, /монетизац/, /бизнес/, /продаж/]))
    return { cat: "Заработок / бизнес", bucket: "money" };

  if (hasAny(t, [/саморазвит/, /интерес/, /для себя/, /хобби/, /любопыт/, /развива/]))
    return { cat: "Интерес / саморазвитие", bucket: "interest" };

  if (hasAny(t, [/уч(усь|иться)/, /обучен/, /курс/, /разобраться/, /навык/, /осво(ить|ю)/, /науч(иться|иться)/]))
    return { cat: "Учёба / освоить ИИ", bucket: "learning" };

  return { cat: "Другое / не классифицировано", bucket: "other" };
}

function parseMoneyRub(text) {
  let t = normLower(text)
    .replaceAll("₽", "")
    .replaceAll("руб", "")
    .replaceAll("рублей", "")
    .replaceAll("тыс", "k")
    .replaceAll("т.р", "k")
    .replaceAll("тр", "k")
    .replaceAll("т", "k")
    .replaceAll("млн", "m")
    .replaceAll("миллион", "m")
    .replaceAll("миллиона", "m")
    .replaceAll("миллионов", "m")
    .replaceAll("’", "")
    .replaceAll("'", "")
    .replaceAll(" ", "");

  // support 500k / 500к
  const km = t.match(/(\d{1,7})(k|к)\b/);
  if (km) return parseInt(km[1], 10) * 1000;

  // support 1m
  const mm = t.match(/(\d{1,4})m\b/);
  if (mm) return parseInt(mm[1], 10) * 1000000;

  // plain number (allow up to 9 digits)
  const m = t.match(/\b(\d{2,9})\b/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function categorizeQ10(text) {
  const t = normLower(text);
  if (!t) return { cat: "Нет ответа", bucket: "empty" };

  const rub = parseMoneyRub(t);
  if (rub) {
    // Heuristic: if someone wrote 10000000 (10m) they probably mean monthly income goal; keep in 500k+
    if (rub < 100000) return { cat: "Цель по доходу: < 100k ₽/мес", bucket: "money_lt100" };
    if (rub < 200000) return { cat: "Цель по доходу: 100–200k ₽/мес", bucket: "money_100_200" };
    if (rub < 500000) return { cat: "Цель по доходу: 200–500k ₽/мес", bucket: "money_200_500" };
    return { cat: "Цель по доходу: 500k+ ₽/мес", bucket: "money_500p" };
  }

  if (hasAny(t, [/финансов/, /свобод/, /стабил(ьн|ен)/]))
    return { cat: "Стабильность / финансовая свобода", bucket: "stability" };

  if (hasAny(t, [/найти работ/, /устро(ить|иться)/, /смен(а|ить) работ/, /офер/, /в найм/]))
    return { cat: "Найти работу / перейти в найм", bucket: "job" };

  if (hasAny(t, [/запуст(ить|ить)/, /свой проект/, /стартап/, /продукт/, /сервис/, /бот/, /сайт/]))
    return { cat: "Запустить проект / продукт", bucket: "launch" };

  if (hasAny(t, [/клиент/, /фриланс/, /заказ/, /упаковк/, /лид/, /воронк/]))
    return { cat: "Клиенты / фриланс / продажи", bucket: "clients" };

  if (hasAny(t, [/навык/, /портфолио/, /обучен/, /курс/, /сертификат/, /практик/, /кейсы/]))
    return { cat: "Прокачать навык / портфолио", bucket: "skill" };

  return { cat: "Другое / не классифицировано", bucket: "other" };
}

function summarizeOpen(question, categorizer, maxQuotes = 6) {
  const counts = new Map();
  const quotesByBucket = new Map();
  let n = 0;

  for (const r of rows) {
    const v = norm(r[question]);
    if (!v) continue;
    n++;
    const { cat, bucket } = categorizer(v);
    counts.set(cat, (counts.get(cat) || 0) + 1);
    if (!quotesByBucket.has(cat)) quotesByBucket.set(cat, []);
    const arr = quotesByBucket.get(cat);
    if (arr.length < Math.ceil(maxQuotes / 3)) arr.push(v.slice(0, 220));
  }

  const categories = [...counts.entries()]
    .map(([label, count]) => ({ label, count, pct: n ? (count / n) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);

  const quotes = categories
    .slice(0, 6)
    .flatMap((c) => (quotesByBucket.get(c.label) || []).slice(0, 2).map((q) => ({ category: c.label, text: q })));

  return { question, totalAnswered: n, categories, quotes };
}

const closedStats = CLOSED.map(countOptions);
const open9 = summarizeOpen(OPEN_Q9, categorizeQ9);
const open10 = summarizeOpen(OPEN_Q10, categorizeQ10);

const report = {
  meta: {
    generatedAt: new Date().toISOString(),
    sourceRows: rows.length,
    notes: [
      "Email and Telegram contact fields are excluded from the report.",
      "Open-text questions are grouped into categories with simple keyword rules; treat percentages as directional, not scientific."
    ]
  },
  closed: closedStats,
  open: [open9, open10]
};

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2), "utf-8");
console.log("Wrote", path.join(outDir, "report.json"));
