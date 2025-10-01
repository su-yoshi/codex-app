const STORAGE = {
  settings: 'aurora-settings-v2',
  daily: 'aurora-daily-',
  spent: 'aurora-spent-'
};

const clone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const DEFAULTS = {
  kids: [
    { id: 'kid-hikari', name: 'ひかり', color: '#a855f7', emoji: '🌟' },
    { id: 'kid-mirai', name: 'みらい', color: '#22d3ee', emoji: '🚀' }
  ],
  tasks: [
    { id: 'task-dish', name: 'おさらあらい', icon: '🍽️' },
    { id: 'task-laundry', name: 'せんたくものたたみ', icon: '🧺' },
    { id: 'task-clean', name: 'おへやのそうじ', icon: '🧹' }
  ],
  rewards: [
    { id: 'reward-snack', name: 'スペシャルおやつ', stars: 4 },
    { id: 'reward-game', name: 'ゲームタイム15分', stars: 6 }
  ],
  sound: true,
  tts: false,
  ttsVoice: '',
  ttsRate: 1
};

const App = {
  settings: clone(DEFAULTS),
  selectedDate: new Date(),
  calendar: null,
  charts: {},
  calendarStatus: {},
  ttsVoices: [],

  init() {
    this.cacheElements();
    this.loadSettings();
    this.bindEvents();
    this.initCalendar();
    this.renderAll();
  },

  cacheElements() {
    this.el = {
      hero: document.getElementById('daily-banner'),
      dateHeading: document.getElementById('selected-date-display'),
      kidsDashboard: document.getElementById('kids-dashboard'),
      monthlySummary: document.getElementById('monthly-summary'),
      settingsBtn: document.getElementById('settingsBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
      ttsBtn: document.getElementById('ttsToggleBtn'),
      ttsIcon: document.getElementById('ttsToggleIcon'),
      settingsModal: document.getElementById('settingsModal'),
      settingsContent: document.getElementById('settings-content'),
      kidTemplate: document.getElementById('kid-card-template')
    };
  },

  bindEvents() {
    this.el.settingsBtn.addEventListener('click', () => {
      this.renderSettings();
      this.el.settingsModal.showModal();
    });

    this.el.settingsModal.addEventListener('click', (event) => {
      const { action, id } = event.target.dataset;
      if (!action) return;
      this.handleSettingsAction(action, id);
    });

    this.el.settingsModal.addEventListener('input', (event) => {
      const target = event.target;
      const { category, id } = target.dataset;
      if (!category || !id) return;
      if (category === 'kid') {
        const kid = this.settings.kids.find(k => k.id === id);
        if (kid) kid[target.name] = target.value;
      } else if (category === 'task') {
        const task = this.settings.tasks.find(t => t.id === id);
        if (task) task[target.name] = target.value;
      }
      this.saveSettings();
      this.renderAll();
    });

    this.el.settingsModal.addEventListener('change', (event) => {
      if (event.target.name === 'sound-enabled') {
        this.settings.sound = event.target.checked;
      } else if (event.target.name === 'tts-enabled') {
        this.settings.tts = event.target.checked;
      } else if (event.target.name === 'tts-rate') {
        this.settings.ttsRate = Number(event.target.value) || 1;
      }
      this.saveSettings();
      this.updateTtsButton();
    });

    this.el.downloadBtn.addEventListener('click', () => this.exportMonthData());

    this.el.ttsBtn.addEventListener('click', () => {
      this.settings.tts = !this.settings.tts;
      this.saveSettings();
      this.updateTtsButton();
    });

    document.querySelector('.dashboard-tools')?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'reset-day') {
        this.resetSelectedDay();
      } else if (btn.dataset.action === 'reset-month') {
        this.resetCurrentMonth();
      }
    });

    this.el.kidsDashboard.addEventListener('click', (event) => {
      const resetBtn = event.target.closest('[data-action="reset-kid"]');
      if (resetBtn) {
        this.resetKidTasks(resetBtn.dataset.kidId);
        return;
      }
      const toggle = event.target.closest('.task-toggle-btn');
      if (!toggle) return;
      const { kidId, taskId } = toggle.dataset;
      if (kidId && taskId) this.toggleTask(kidId, taskId);
    });
  },

  initCalendar() {
    this.calendar = flatpickr('#calendar-container', {
      inline: true,
      defaultDate: this.selectedDate,
      locale: 'ja',
      onChange: (dates) => {
        this.selectedDate = dates[0];
        this.renderAll();
      },
      onDayCreate: (_dObj, _dStr, _instance, dayElem) => {
        const dateKey = this.formatDateKey(dayElem.dateObj);
        const status = this.calendarStatus[dateKey];

        dayElem.classList.remove('calendar-day--complete', 'calendar-day--partial');
        dayElem.removeAttribute('data-progress');

        const oldDots = dayElem.querySelector('.dots-container');
        if (oldDots) oldDots.remove();

        if (!status) {
          dayElem.removeAttribute('title');
          dayElem.removeAttribute('aria-label');
          return;
        }

        if (status.dots.length) {
          const dotsContainer = document.createElement('div');
          dotsContainer.className = 'dots-container';
          dotsContainer.setAttribute('aria-hidden', 'true');
          dotsContainer.innerHTML = status.dots
            .map(dot => `<span class="dot" style="background-color:${dot.color};opacity:${dot.opacity}"></span>`)
            .join('');
          dayElem.appendChild(dotsContainer);
        }

        if (status.state === 'complete') {
          dayElem.classList.add('calendar-day--complete');
        } else if (status.state === 'partial') {
          dayElem.classList.add('calendar-day--partial');
        }

        if (Number.isFinite(status.avgCompletion)) {
          dayElem.setAttribute('data-progress', String(status.avgCompletion));
        }

        if (status.tooltip) {
          dayElem.setAttribute('title', status.tooltip);
          dayElem.setAttribute('aria-label', status.tooltip);
        }
      }
    });
  },

  loadSettings() {
    const saved = this.loadData(STORAGE.settings, null);
    if (saved) {
      this.settings = Object.assign({}, DEFAULTS, saved);
      this.settings.kids = Array.isArray(saved.kids) ? saved.kids : clone(DEFAULTS.kids);
      this.settings.tasks = Array.isArray(saved.tasks) ? saved.tasks : clone(DEFAULTS.tasks);
      this.settings.rewards = Array.isArray(saved.rewards) ? saved.rewards : clone(DEFAULTS.rewards);
    } else {
      this.settings = clone(DEFAULTS);
    }
  },

  saveSettings() {
    this.saveData(STORAGE.settings, this.settings);
  },

  loadData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse storage', key, error);
      return fallback;
    }
  },

  saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  },

  formatMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  },

  getDailyData(date) {
    return this.loadData(`${STORAGE.daily}${this.formatDateKey(date)}`, {});
  },

  saveDailyData(date, data) {
    this.saveData(`${STORAGE.daily}${this.formatDateKey(date)}`, data);
  },

  toggleTask(kidId, taskId) {
    const key = `${STORAGE.daily}${this.formatDateKey(this.selectedDate)}`;
    const daily = this.loadData(key, {});
    daily[kidId] = daily[kidId] || {};
    const isDone = daily[kidId][taskId] === 'done';
    daily[kidId][taskId] = isDone ? 'todo' : 'done';
    this.saveData(key, daily);

    if (!isDone) {
      this.playSound('complete');
      const kid = this.settings.kids.find(k => k.id === kidId);
      const task = this.settings.tasks.find(t => t.id === taskId);
      this.celebrate(kid, task);
    }

    this.renderAll();
  },

  resetKidTasks(kidId) {
    if (!kidId) return;
    const key = `${STORAGE.daily}${this.formatDateKey(this.selectedDate)}`;
    const daily = this.loadData(key, {});
    if (!daily[kidId]) return;
    const date = this.selectedDate;
    if (!confirm(`${date.getMonth() + 1}月${date.getDate()}日の${this.getKidName(kidId)}の記録を消しますか？`)) return;
    delete daily[kidId];
    this.saveData(key, daily);
    this.renderAll();
  },

  resetSelectedDay() {
    const date = this.selectedDate;
    if (!confirm(`${date.getMonth() + 1}月${date.getDate()}日の記録をすべて消しますか？`)) return;
    localStorage.removeItem(`${STORAGE.daily}${this.formatDateKey(date)}`);
    this.renderAll();
  },

  resetCurrentMonth() {
    const date = this.selectedDate;
    if (!confirm(`${date.getFullYear()}年${date.getMonth() + 1}月の記録をすべて消しますか？`)) return;
    const monthKey = this.formatMonthKey(date);
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE.daily) && key.includes(monthKey))
      .forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(`${STORAGE.spent}${monthKey}`);
    this.renderAll();
  },

  getKidName(kidId) {
    return this.settings.kids.find(k => k.id === kidId)?.name || 'ヒーロー';
  },

  getDailyCompletion(kidId, date) {
    const tasks = this.settings.tasks;
    if (tasks.length === 0) return { done: 0, total: 0 };
    const daily = this.getDailyData(date);
    const kidTasks = daily[kidId] || {};
    const done = tasks.filter(task => kidTasks[task.id] === 'done').length;
    return { done, total: tasks.length };
  },

  calculateStreak(kidId) {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const { done, total } = this.getDailyCompletion(kidId, date);
      if (total === 0) continue;
      if (done === total) streak += 1; else break;
    }
    return streak;
  },

  calculateMonthlyStars(kidId) {
    const monthKey = this.formatMonthKey(this.selectedDate);
    let count = 0;
    const tasks = this.settings.tasks;
    if (tasks.length === 0) return 0;
    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith(STORAGE.daily)) return;
      const datePart = key.replace(STORAGE.daily, '');
      if (!datePart.startsWith(monthKey)) return;
      const data = this.loadData(key, {});
      const kidTasks = data[kidId] || {};
      tasks.forEach(task => {
        if (kidTasks[task.id] === 'done') count += 1;
      });
    });
    const spent = this.loadData(`${STORAGE.spent}${monthKey}`, {});
    return Math.max(0, count - (spent[kidId] || 0));
  },

  updateCalendarDecorations() {
    const tasks = this.settings.tasks;
    const kids = this.settings.kids;
    if (!tasks.length || !kids.length) {
      this.calendarStatus = {};
      this.calendar?.redraw();
      return;
    }

    const statusMap = {};
    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith(STORAGE.daily)) return;
      const dateKey = key.replace(STORAGE.daily, '');
      const entry = this.loadData(key, {});
      let kidCount = 0;
      let percentSum = 0;
      let completedKids = 0;
      let progressKids = 0;
      const dots = [];
      const tooltipParts = [];

      kids.forEach((kid) => {
        kidCount += 1;
        const kidTasks = entry[kid.id] || {};
        const done = tasks.filter(task => kidTasks[task.id] === 'done').length;
        const ratio = tasks.length > 0 ? done / tasks.length : 0;
        percentSum += ratio;
        tooltipParts.push(`${kid.name}:${done}/${tasks.length}`);

        if (done === tasks.length && tasks.length > 0) {
          dots.push({ color: kid.color, opacity: 0.95 });
          completedKids += 1;
        } else if (done > 0) {
          dots.push({ color: kid.color, opacity: 0.5 + (ratio * 0.4) });
          progressKids += 1;
        }
      });

      const avgCompletion = Math.round((percentSum / kidCount) * 100);
      const state = completedKids === kidCount
        ? 'complete'
        : progressKids > 0 ? 'partial' : 'none';

      if (state === 'none') return;

      statusMap[dateKey] = {
        dots,
        state,
        avgCompletion,
        tooltip: `${dateKey} | ${tooltipParts.join(' / ')} | 平均${avgCompletion}%`
      };
    });

    this.calendarStatus = statusMap;
    this.calendar?.redraw();
  },

  renderHero() {
    const date = this.selectedDate;
    const kids = this.settings.kids;
    const tasks = this.settings.tasks;
    const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const greeting = this.getGreeting();

    let totalDone = 0;
    let totalTasks = 0;
    let champion = null;
    kids.forEach((kid) => {
      const { done, total } = this.getDailyCompletion(kid.id, date);
      totalDone += done;
      totalTasks += total;
      const streak = this.calculateStreak(kid.id);
      const stars = this.calculateMonthlyStars(kid.id);
      if (!champion || streak > champion.streak || (streak === champion.streak && stars > champion.stars)) {
        champion = { kid, streak, stars };
      }
    });

    const completionRate = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;
    const chips = [
      `${kids.length}人のヒーロー`,
      tasks.length ? `${tasks.length}クエスト` : 'クエスト未設定',
      `今日の進捗 ${totalDone}/${totalTasks}`
    ];
    const highlight = champion
      ? `${champion.kid.name}は${champion.streak}日れんぞくチャレンジ中！`
      : '今日もみんなでがんばろう！';

    this.el.hero.innerHTML = `
      <p class="hero__greeting">${greeting}</p>
      <h1 class="hero__title">${date.getMonth() + 1}月${date.getDate()}日(${dayName}) のヒーローログ</h1>
      <p class="hero__highlight">${highlight}</p>
      <div class="hero__meta">
        <div class="hero__chips">
          ${chips.map(text => `<span class="chip">${text}</span>`).join('')}
        </div>
        <span class="hero__meter">平均達成率 ${completionRate}%</span>
      </div>
    `;
  },

  renderDashboard() {
    const date = this.selectedDate;
    const dateLabel = this.formatDateKey(date) === this.formatDateKey(new Date())
      ? '今日のおてつだい'
      : `${date.getMonth() + 1}月${date.getDate()}日のおてつだい`;
    this.el.dateHeading.textContent = dateLabel;

    const kids = this.settings.kids;
    const tasks = this.settings.tasks;

    if (!kids.length) {
      this.el.kidsDashboard.innerHTML = '<div class="empty-state">設定からヒーローを追加しよう！</div>';
      return;
    }
    if (!tasks.length) {
      this.el.kidsDashboard.innerHTML = '<div class="empty-state">クエストがまだありません。設定から追加しよう！</div>';
      return;
    }

    this.el.kidsDashboard.innerHTML = '';
    const daily = this.getDailyData(date);

    kids.forEach((kid) => {
      const fragment = this.el.kidTemplate.content.cloneNode(true);
      const card = fragment.querySelector('.kid-card');
      card.dataset.kidId = kid.id;
      fragment.querySelector('[data-role="avatar"]').textContent = kid.emoji || '🧒';
      fragment.querySelector('[data-role="name"]').textContent = kid.name;
      fragment.querySelector('[data-role="streak"]').textContent = this.formatStreak(kid.id);
      fragment.querySelector('[data-role="stars"]').textContent = this.calculateMonthlyStars(kid.id);
      fragment.querySelector('[data-action="reset-kid"]').dataset.kidId = kid.id;

      const { done, total } = this.getDailyCompletion(kid.id, date);
      fragment.querySelector('[data-role="progress"]').textContent = `${done}/${total}`;
      const percent = total ? Math.round((done / total) * 100) : 0;
      fragment.querySelector('[data-role="bar"]').style.width = `${percent}%`;

      const headline = this.createProgressHeadline(done, total);
      fragment.querySelector('[data-role="headline"]').textContent = headline.title;
      fragment.querySelector('[data-role="caption"]').textContent = headline.caption;

      const canvas = fragment.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      if (this.charts[kid.id]) this.charts[kid.id].destroy();
      this.charts[kid.id] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Done', 'Todo'],
          datasets: [{
            data: [done, Math.max(0, total - done)],
            backgroundColor: [kid.color || '#22d3ee', '#e2e8f0'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          animation: { duration: 220 },
          responsive: false,
          maintainAspectRatio: false
        }
      });

      const list = fragment.querySelector('[data-role="tasks"]');
      const kidDaily = daily[kid.id] || {};
      tasks.forEach((task) => {
        const isDone = kidDaily[task.id] === 'done';
        const li = document.createElement('li');
        li.className = `kid-task ${isDone ? 'kid-task--done' : ''}`;
        li.innerHTML = `
          <span class="kid-task__info">
            <span class="kid-task__icon">${task.icon || ''}</span>
            <span>${task.name}</span>
          </span>
          <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline'} btn-circle task-toggle-btn" data-kid-id="${kid.id}" data-task-id="${task.id}" aria-label="${kid.name}の${task.name}を${isDone ? '未完了にする' : '完了にする'}">
            ${isDone ? '✔️' : '＋'}
          </button>
        `;
        list.appendChild(li);
      });

      this.el.kidsDashboard.appendChild(fragment);
    });
  },

  renderMonthlySummary() {
    const kids = this.settings.kids;
    const tasks = this.settings.tasks;
    if (!kids.length || !tasks.length) {
      this.el.monthlySummary.innerHTML = '<div class="empty-state">ヒーローとクエストを登録するとサマリーが表示されます。</div>';
      return;
    }

    const range = this.collectMonthRange(this.selectedDate);
    this.el.monthlySummary.innerHTML = '';

    kids.forEach((kid) => {
      let doneTotal = 0;
      let taskTotal = 0;
      range.forEach(date => {
        const data = this.getDailyData(date);
        const kidData = data[kid.id] || {};
        tasks.forEach(task => {
          if (kidData[task.id] === 'done') doneTotal += 1;
          taskTotal += 1;
        });
      });
      const percent = taskTotal ? Math.round((doneTotal / taskTotal) * 100) : 0;
      const item = document.createElement('div');
      item.className = 'summary-item';
      item.innerHTML = `
        <div class="summary-item__head">
          <strong>${kid.name}</strong>
          <span>${doneTotal}/${taskTotal}</span>
        </div>
        <div class="summary-progress"><span style="width:${percent}%"></span></div>
        <p class="summary-meta">平均 ${percent}% / 今月の⭐ ${this.calculateMonthlyStars(kid.id)}</p>
      `;
      this.el.monthlySummary.appendChild(item);
    });
  },

  collectMonthRange(date) {
    const result = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const end = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= end; day += 1) {
      result.push(new Date(year, month, day));
    }
    return result;
  },

  renderSettings() {
    const kidsSection = this.settings.kids.map((kid) => `
      <div class="settings-row">
        <div class="settings-row__fields">
          <label class="form-control">
            <span class="label-text">なまえ</span>
            <input class="input input-bordered input-sm" data-category="kid" data-id="${kid.id}" name="name" value="${kid.name}" />
          </label>
          <label class="form-control">
            <span class="label-text">色</span>
            <input class="input input-bordered input-sm" type="color" data-category="kid" data-id="${kid.id}" name="color" value="${kid.color}" />
          </label>
          <label class="form-control">
            <span class="label-text">絵文字</span>
            <input class="input input-bordered input-sm" data-category="kid" data-id="${kid.id}" name="emoji" value="${kid.emoji || ''}" />
          </label>
        </div>
        <div class="settings-row__actions">
          <button type="button" class="btn btn-xs" data-action="remove-kid" data-id="${kid.id}">削除</button>
        </div>
      </div>
    `).join('');

    const tasksSection = this.settings.tasks.map((task) => `
      <div class="settings-row">
        <label class="form-control">
          <span class="label-text">クエスト名</span>
          <input class="input input-bordered input-sm" data-category="task" data-id="${task.id}" name="name" value="${task.name}" />
        </label>
        <label class="form-control">
          <span class="label-text">アイコン（絵文字）</span>
          <input class="input input-bordered input-sm" data-category="task" data-id="${task.id}" name="icon" value="${task.icon || ''}" />
        </label>
        <div class="settings-row__actions">
          <button type="button" class="btn btn-xs" data-action="remove-task" data-id="${task.id}">削除</button>
        </div>
      </div>
    `).join('');

    this.el.settingsContent.innerHTML = `
      <section class="settings-group">
        <header>
          <h4 class="section-heading">ヒーロー</h4>
          <p class="modal-caption">家族のプロフィールを編集します</p>
        </header>
        ${kidsSection || '<p class="empty-state">ヒーローがまだいません</p>'}
        <button type="button" class="btn btn-sm mt-3" data-action="add-kid">ヒーローを追加</button>
      </section>
      <section class="settings-group">
        <header>
          <h4 class="section-heading">クエスト</h4>
          <p class="modal-caption">毎日のおてつだいを登録</p>
        </header>
        ${tasksSection || '<p class="empty-state">クエストを追加してください</p>'}
        <button type="button" class="btn btn-sm mt-3" data-action="add-task">クエストを追加</button>
      </section>
      <section class="settings-group">
        <header>
          <h4 class="section-heading">サウンド / 音声</h4>
        </header>
        <label class="label cursor-pointer">
          <span class="label-text">効果音</span>
          <input type="checkbox" class="toggle" name="sound-enabled" ${this.settings.sound ? 'checked' : ''} />
        </label>
        <label class="label cursor-pointer">
          <span class="label-text">音声読み上げ</span>
          <input type="checkbox" class="toggle" name="tts-enabled" ${this.settings.tts ? 'checked' : ''} />
        </label>
        <label class="form-control">
          <span class="label-text">読み上げ速度 (${this.settings.ttsRate})</span>
          <input type="range" min="0.6" max="1.5" step="0.1" name="tts-rate" value="${this.settings.ttsRate}" />
        </label>
      </section>
    `;
  },

  handleSettingsAction(action, id) {
    if (action === 'add-kid') {
      this.settings.kids.push({
        id: `kid-${Date.now()}`,
        name: 'ななし',
        color: '#f472b6',
        emoji: '🧒'
      });
    } else if (action === 'remove-kid') {
      this.settings.kids = this.settings.kids.filter(k => k.id !== id);
    } else if (action === 'add-task') {
      this.settings.tasks.push({
        id: `task-${Date.now()}`,
        name: 'あたらしいクエスト',
        icon: '⭐'
      });
    } else if (action === 'remove-task') {
      this.settings.tasks = this.settings.tasks.filter(t => t.id !== id);
    }

    this.saveSettings();
    this.renderSettings();
    this.renderAll();
  },

  createProgressHeadline(done, total) {
    if (!total) {
      return {
        title: 'クエストはまだありません',
        caption: '設定でクエストを追加してみよう'
      };
    }
    if (done === total) {
      return {
        title: 'ぜんぶクリア！おめでとう 🎉',
        caption: '今日はもう完璧！'
      };
    }
    if (done === 0) {
      return {
        title: 'ここからスタート！',
        caption: 'まずは1つチャレンジしてみよう'
      };
    }
    return {
      title: `あと${total - done}個でコンプリート！`,
      caption: 'ペースはこのままでばっちり！'
    };
  },

  formatStreak(kidId) {
    const streak = this.calculateStreak(kidId);
    if (!streak) return '今日がスタート！';
    if (streak === 1) return '1日クリア中';
    return `${streak}日れんぞくクリア`;
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 10) return 'おはよう！今日もヒーロー活動を始めよう';
    if (hour < 18) return 'こんにちは！新しいクエストに挑戦しよう';
    return 'こんばんは！今日の振り返りをしよう';
  },

  updateTtsButton() {
    if (!this.el.ttsIcon) return;
    this.el.ttsIcon.textContent = this.settings.tts ? '🔊' : '🔈';
    this.el.ttsBtn.setAttribute('aria-pressed', this.settings.tts ? 'true' : 'false');
  },

  playSound(type) {
    if (!this.settings.sound) return;
    const audioId = type === 'complete' ? 'sound-complete' : 'sound-click';
    let audio = document.getElementById(audioId);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = audioId;
      audio.src = type === 'complete'
        ? 'https://cdn.jsdelivr.net/gh/ste-s/hosted-assets/sounds/sparkle.mp3'
        : 'https://cdn.jsdelivr.net/gh/ste-s/hosted-assets/sounds/click.mp3';
      document.body.appendChild(audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  },

  celebrate(kid, task) {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.4 },
        colors: [kid?.color || '#34d399', '#facc15', '#60a5fa']
      });
    }
    if (this.settings.tts && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(`${kid?.name || 'ヒーロー'}、${task?.name || 'おてつだい'}をクリア！`);
      utter.lang = 'ja-JP';
      utter.rate = Math.min(1.6, Math.max(0.5, this.settings.ttsRate || 1));
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  },

  exportMonthData() {
    const monthKey = this.formatMonthKey(this.selectedDate);
    const payload = {
      generatedAt: new Date().toISOString(),
      settings: this.settings,
      month: monthKey,
      entries: {}
    };

    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith(STORAGE.daily)) return;
      const dateKey = key.replace(STORAGE.daily, '');
      if (!dateKey.startsWith(monthKey)) return;
      payload.entries[dateKey] = this.loadData(key, {});
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aurora-${monthKey}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  renderAll() {
    this.updateCalendarDecorations();
    this.renderHero();
    this.renderDashboard();
    this.renderMonthlySummary();
    this.updateTtsButton();
    if (this.calendar) this.calendar.setDate(this.selectedDate, false);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
