const fmtPct = (x) => `${x.toFixed(1)}%`;

function topOption(stat) {
  return stat.options?.[0] || null;
}

function makeCard(label, value, hint = '') {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="label">${label}</div>
    <div class="value">${value}</div>
    <div class="hint">${hint}</div>
  `;
  return div;
}

function renderClosed(container, stats) {
  container.innerHTML = '';
  let chartId = 0;

  for (const st of stats) {
    const q = document.createElement('div');
    q.className = 'q';
    q.innerHTML = `
      <h3>${st.question}</h3>
      <div class="grid">
        <div>
          <table class="table">
            <thead><tr><th>Ответ</th><th>Доля</th><th class="small">Кол-во</th></tr></thead>
            <tbody></tbody>
          </table>
          <div class="small">Ответили: <strong>${st.totalAnswered}</strong></div>
        </div>
        <div>
          <canvas id="c${chartId}" height="220"></canvas>
        </div>
      </div>
    `;

    const tbody = q.querySelector('tbody');
    for (const opt of st.options) {
      const tr = document.createElement('tr');
      const w = Math.max(0, Math.min(100, opt.pct));
      tr.innerHTML = `
        <td>${opt.label}</td>
        <td>
          <span class="pill">
            <span class="bar"><i style="width:${w}%"></i></span>
            <span>${fmtPct(opt.pct)}</span>
          </span>
        </td>
        <td class="small">${opt.count}</td>
      `;
      tbody.appendChild(tr);
    }

    container.appendChild(q);

    const labels = st.options.map(o => o.label);
    const data = st.options.map(o => Math.round(o.pct * 10) / 10);

    const ctx = q.querySelector(`#c${chartId}`).getContext('2d');
    new Chart(ctx, {
      type: labels.length <= 3 ? 'doughnut' : 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Доля, %',
          data,
          borderWidth: 0,
          backgroundColor: [
            '#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#fb7185','#22c55e','#38bdf8'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: labels.length <= 3, labels: { color: '#e5e7eb' } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed}%` } }
        },
        scales: labels.length <= 3 ? {} : {
          x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(36,48,68,.35)' } },
          y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(36,48,68,.35)' }, beginAtZero: true, max: 100 }
        }
      }
    });

    chartId++;
  }
}

function renderOpen(container, blocks) {
  container.innerHTML = '';
  let chartId = 1000;

  for (const b of blocks) {
    const q = document.createElement('div');
    q.className = 'q';

    q.innerHTML = `
      <h3>${b.question}</h3>
      <div class="grid">
        <div>
          <table class="table">
            <thead><tr><th>Сегмент (категория)</th><th>Доля</th><th class="small">Кол-во</th></tr></thead>
            <tbody></tbody>
          </table>
          <div class="small">Ответили: <strong>${b.totalAnswered}</strong></div>
        </div>
        <div>
          <canvas id="oc${chartId}" height="240"></canvas>
        </div>
      </div>
      <div class="quotes"></div>
    `;

    const tbody = q.querySelector('tbody');
    for (const c of b.categories) {
      const tr = document.createElement('tr');
      const w = Math.max(0, Math.min(100, c.pct));
      tr.innerHTML = `
        <td>${c.label}</td>
        <td>
          <span class="pill">
            <span class="bar"><i style="width:${w}%"></i></span>
            <span>${fmtPct(c.pct)}</span>
          </span>
        </td>
        <td class="small">${c.count}</td>
      `;
      tbody.appendChild(tr);
    }

    const quotes = q.querySelector('.quotes');
    for (const qu of (b.quotes || []).slice(0, 10)) {
      const d = document.createElement('div');
      d.className = 'quote';
      d.innerHTML = `<div class="cat">${qu.category}</div><div class="txt">${qu.text}</div>`;
      quotes.appendChild(d);
    }

    container.appendChild(q);

    const top = b.categories.slice(0, 6);
    const labels = top.map(x => x.label);
    const data = top.map(x => Math.round(x.pct * 10) / 10);

    const ctx = q.querySelector(`#oc${chartId}`).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Доля, % (топ-6)',
          data,
          borderWidth: 0,
          backgroundColor: '#60a5fa'
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(36,48,68,.35)' }, beginAtZero: true, max: 100 },
          y: { ticks: { color: '#e5e7eb' }, grid: { display: false } }
        }
      }
    });

    chartId++;
  }
}

function renderInsights(report) {
  const byQ = (q) => report.closed.find(x => x.question === q);
  const age = byQ('1. Ваш возраст');
  const income = byQ('2. Ваш текущий уровень дохода в месяц');
  const occ = byQ('3. Чем вы сейчас занимаетесь?');
  const ai = byQ('4. Как бы вы описали свой текущий уровень работы с ИИ?');
  const themes = byQ('5. Какие темы вам сейчас наиболее интересны?');
  const money = byQ('6. Рассматриваете ли вы ИИ как источник дохода?');
  const format = byQ('7. Какой формат заработка вам сейчас ближе? На чём, по вашему мнению, реально можно зарабатывать с помощью ИИ?');
  const vibe = byQ('8. Что вы думаете о вайб-кодинге?');
  const interview = byQ('11. Готовы ли вы пообщаться со мной или моим маркетологом 15–20 минут в формате интервью, чтобы глубже разобрать ваш опыт, цели и ожидания?');

  const topCards = document.getElementById('topCards');
  topCards.innerHTML = '';
  topCards.appendChild(makeCard('Ответов в базе', report.meta.sourceRows, 'строк в выгрузке'));

  const topTheme = topOption(themes);
  if (topTheme) topCards.appendChild(makeCard('Топ-тема', fmtPct(topTheme.pct), topTheme.label));

  const topFormat = topOption(format);
  if (topFormat) topCards.appendChild(makeCard('Топ-формат заработка', fmtPct(topFormat.pct), topFormat.label));

  const topInterview = topOption(interview);
  if (topInterview) topCards.appendChild(makeCard('Готовы на интервью', fmtPct(topInterview.pct), 'ответ «Да»'));

  const bullets = [];
  if (age) bullets.push(`Возраст: доминирует группа «${topOption(age).label}» (${fmtPct(topOption(age).pct)}).`);
  if (income) bullets.push(`Доход: самый частый диапазон — «${topOption(income).label}» (${fmtPct(topOption(income).pct)}).`);
  if (occ) bullets.push(`Занятость: чаще всего — «${topOption(occ).label}» (${fmtPct(topOption(occ).pct)}).`);
  if (ai) bullets.push(`Уровень ИИ: пик — «${topOption(ai).label}» (${fmtPct(topOption(ai).pct)}).`);
  if (themes) bullets.push(`Интересы: «${topOption(themes).label}» встречается у ${fmtPct(topOption(themes).pct)} ответов — это явный магнит.`);
  if (money) bullets.push(`Монетизация: самый частый ответ — «${topOption(money).label}» (${fmtPct(topOption(money).pct)}).`);
  if (vibe) bullets.push(`Вайб-кодинг: топ-статус — «${topOption(vibe).label}» (${fmtPct(topOption(vibe).pct)}): люди пробуют, но им не хватает системы/результата.`);
  if (interview) bullets.push(`Интервью: «Да» сказали ${fmtPct(topOption(interview).pct)} — это много, можно быстро набрать интервью-пул.`);

  const ins = document.getElementById('insights');
  ins.innerHTML = `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
}

(() => {
  const report = window.REPORT;
  if (!report) {
    document.getElementById('metaLine').textContent = 'Не найдено report.js (window.REPORT). Проверь, что рядом лежит data/report.js.';
    return;
  }

  document.getElementById('metaLine').textContent = `Ответов: ${report.meta.sourceRows}. Сгенерировано: ${new Date(report.meta.generatedAt).toLocaleString('ru-RU')}`;
  document.getElementById('genAt').textContent = new Date(report.meta.generatedAt).toLocaleString('ru-RU');

  renderInsights(report);
  renderClosed(document.getElementById('closed'), report.closed);
  renderOpen(document.getElementById('open'), report.open);
})();
