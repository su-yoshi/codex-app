
const STORAGE = {
  settings: 'aurora-settings-v3',
  daily: 'aurora-daily-',
  spent: 'aurora-spent-'
};

const clone = (value) => {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
  } catch (_) {
    // ignore
  }
  return JSON.parse(JSON.stringify(value));
};

const DEFAULTS = {
  kids: [
    { id: 'kid-hikari', name: '縺ｲ縺九ｊ', color: '#a855f7', emoji: '検' },
    { id: 'kid-mirai', name: '縺ｿ繧峨＞', color: '#22d3ee', emoji: '噫' }
  ],
  tasks: [
    { id: 'task-dish', name: '縺翫＆繧峨≠繧峨＞', icon: '鎖・・ },
    { id: 'task-laundry', name: '縺帙ｓ縺溘￥繧ゅ・縺溘◆縺ｿ', icon: 'ｧｺ' },
    { id: 'task-clean', name: '縺翫∈繧・・縺昴≧縺・, icon: 'ｧｹ' }
  ],
  rewards: [
    { id: 'reward-snack', name: '繧ｹ繝壹す繝｣繝ｫ縺翫ｄ縺､', stars: 4 },
    { id: 'reward-game', name: '繧ｲ繝ｼ繝繧ｿ繧､繝15蛻・, stars: 6 }
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
  features: {},
  fallbackCalendarActive: false,

  init() {
    this.cacheElements();
    this.loadSettings();
    this.detectFeatures();
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
      kidTemplate: document.getElementById('kid-card-template'),
      calendarContainer: document.getElementById('calendar-container'),
      dashboardTools: document.querySelector('.dashboard-tools')
    };
  },

  detectFeatures() {
    this.features = {
      calendar: typeof flatpickr === 'function',
      chart: typeof Chart === 'function',
      confetti: typeof confetti === 'function',
      speech: typeof window !== 'undefined' && 'speechSynthesis' in window
    };
  },
  openModal(modal) {
    if (!modal) return;
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', 'true');
      if (modal.classList) modal.classList.add('modal--fallback-open');
    }
  },

  closeModal(modal) {
    if (!modal) return;
    if (typeof modal.close === 'function') {
      try {
        modal.close();
      } catch (_) {
        modal.removeAttribute('open');
      }
    } else {
      modal.removeAttribute('open');
    }
    if (modal.classList) modal.classList.remove('modal--fallback-open');
  },

  matchesSelector(element, selector) {
    if (!element || typeof selector !== 'string') return false;
    const proto = Element.prototype;
    const fn = proto.matches || proto.msMatchesSelector || proto.webkitMatchesSelector || proto.mozMatchesSelector;
    if (fn) {
      return fn.call(element, selector);
    }
    return false;
  },

  closestElement(element, selector) {
    let current = element;
    while (current && current.nodeType === 1) {
      if (this.matchesSelector(current, selector)) {
        return current;
      }
      current = current.parentElement || current.parentNode;
    }
    return null;
  },
  bindEvents() {
    if (this.el.settingsBtn) {
      this.el.settingsBtn.addEventListener('click', () => {
        this.renderSettings();
        this.openModal(this.el.settingsModal);
      });
    }

    if (this.el.settingsModal) {
      const modal = this.el.settingsModal;
      modal.addEventListener('click', (event) => {
        const target = event.target;
        const isModalShell = target === modal && !this.closestElement(target, '.modal-box');
        if (isModalShell) {
          this.closeModal(modal);
          return;
        }
        const valueAttr = (target && typeof target.getAttribute === 'function') ? target.getAttribute('value') : null;
        if (valueAttr === 'cancel') {
          event.preventDefault();
          this.closeModal(modal);
          this.saveSettings();
          this.renderAll();
          return;
        }
        const targetDataset = (target && target.dataset) ? target.dataset : {};
        const action = targetDataset.action || ((target && typeof target.getAttribute === 'function') ? target.getAttribute('data-action') : null);
        const id = targetDataset.id || ((target && typeof target.getAttribute === 'function') ? target.getAttribute('data-id') : null);
        if (!action) return;
        this.handleSettingsAction(action, id);
      });

      modal.addEventListener('input', (event) => {
        const target = event.target;
        const dataset = (target && target.dataset) ? target.dataset : {};
        const category = dataset.category || ((target && typeof target.getAttribute === 'function') ? target.getAttribute('data-category') : null);
        const id = dataset.id || ((target && typeof target.getAttribute === 'function') ? target.getAttribute('data-id') : null);
        if (!category || !id) return;
        if (category === 'kid') {
          const kid = this.settings.kids.find((item) => item.id === id);
          if (kid) {
            kid[target.name] = target.value;
          }
        } else if (category === 'task') {
          const task = this.settings.tasks.find((item) => item.id === id);
          if (task) {
            task[target.name] = target.value;
          }
        }
        this.ensureSettingsIntegrity();
        this.saveSettings();
        this.renderAll();
      });

      modal.addEventListener('change', (event) => {
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

      modal.addEventListener('close', () => {
        if (modal.classList) modal.classList.remove('modal--fallback-open');
        this.saveSettings();
        this.renderAll();
      });
    }

    if (this.el.downloadBtn) {
      this.el.downloadBtn.addEventListener('click', () => {
        this.exportMonthData();
      });
    }

    if (this.el.ttsBtn) {
      this.el.ttsBtn.addEventListener('click', () => {
        this.settings.tts = !this.settings.tts;
        this.saveSettings();
        this.updateTtsButton();
      });
    }

    if (this.el.dashboardTools) {
      this.el.dashboardTools.addEventListener('click', (event) => {
        const btn = this.closestElement(event.target, 'button[data-action]');
        if (!btn) return;
        const dataset = (btn && btn.dataset) ? btn.dataset : {};
        const action = dataset.action || ((btn && typeof btn.getAttribute === 'function') ? btn.getAttribute('data-action') : null);
        if (action === 'reset-day') {
          this.resetSelectedDay();
        } else if (action === 'reset-month') {
          this.resetCurrentMonth();
        }
      });
    }

    if (this.el.kidsDashboard) {
      this.el.kidsDashboard.addEventListener('click', (event) => {
        const resetBtn = this.closestElement(event.target, '[data-action="reset-kid"]');
        const resetKidId = resetBtn ? ((resetBtn.dataset && resetBtn.dataset.kidId) || (typeof resetBtn.getAttribute === 'function' ? resetBtn.getAttribute('data-kid-id') : null)) : null;
        if (resetKidId) {
          this.resetKidTasks(resetKidId);
          return;
        }
        const toggle = this.closestElement(event.target, '.task-toggle-btn');
        if (!toggle) return;
        const toggleDataset = (toggle && toggle.dataset) ? toggle.dataset : {};
        const kidId = toggleDataset.kidId || ((toggle && typeof toggle.getAttribute === 'function') ? toggle.getAttribute('data-kid-id') : null);
        const taskId = toggleDataset.taskId || ((toggle && typeof toggle.getAttribute === 'function') ? toggle.getAttribute('data-task-id') : null);
        if (kidId && taskId) {
          this.toggleTask(kidId, taskId);
        }
      });
    }
  },
  initCalendar() {
    if (!this.features.calendar || !this.el.calendarContainer) {
      this.fallbackCalendarActive = true;
      if (this.el.calendarContainer) {
        this.el.calendarContainer.classList.add('calendar-fallback');
      }
      if (this.el.calendarContainer && !this.el.calendarContainer.dataset.fallbackBound) {
        this.el.calendarContainer.addEventListener('click', (event) => {
          const nav = this.closestElement(event.target, '[data-fallback-nav]');
          if (nav) {
            const fallbackNav = (nav.dataset && nav.dataset.fallbackNav) || (typeof nav.getAttribute === 'function' ? nav.getAttribute('data-fallback-nav') : null);
            const offset = fallbackNav === 'prev' ? -1 : 1;
            this.shiftMonth(offset);
            return;
          }
          const cell = this.closestElement(event.target, '[data-date]');
          const dateAttr = cell ? ((cell.dataset && cell.dataset.date) || (typeof cell.getAttribute === 'function' ? cell.getAttribute('data-date') : null)) : null;
          if (!dateAttr) return;
          this.selectedDate = this.parseDateKey(dateAttr);
          this.renderAll();
        });
        this.el.calendarContainer.dataset.fallbackBound = 'true';
      }
      return;
    }

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
    if (saved && typeof saved === 'object') {
      this.settings = Object.assign({}, DEFAULTS, saved);
    } else {
      this.settings = clone(DEFAULTS);
    }
    this.ensureSettingsIntegrity();
    this.saveSettings();
  },

  ensureSettingsIntegrity() {
    if (!Array.isArray(this.settings.kids) || !this.settings.kids.length) {
      this.settings.kids = clone(DEFAULTS.kids);
    }
    if (!Array.isArray(this.settings.tasks) || !this.settings.tasks.length) {
      this.settings.tasks = clone(DEFAULTS.tasks);
    }
    if (!Array.isArray(this.settings.rewards) || !this.settings.rewards.length) {
      this.settings.rewards = clone(DEFAULTS.rewards);
    }

    this.settings.kids = this.settings.kids.map((kid, index) => ({
      id: kid.id || `kid-${index}-${Date.now()}`,
      name: kid.name || `繝偵・繝ｭ繝ｼ${index + 1}`,
      color: kid.color || DEFAULTS.kids[index % DEFAULTS.kids.length].color,
      emoji: kid.emoji !== undefined ? kid.emoji : 'ｧ・
    }));

    this.settings.tasks = this.settings.tasks.map((task, index) => ({
      id: task.id || `task-${index}-${Date.now()}`,
      name: task.name || `繧ｯ繧ｨ繧ｹ繝・{index + 1}`,
      icon: task.icon || '箝・
    }));

    this.settings.ttsRate = Number.isFinite(this.settings.ttsRate) ? this.settings.ttsRate : 1;
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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save storage', key, error);
    }
  },

  saveSettings() {
    this.saveData(STORAGE.settings, this.settings);
  },

  formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  },

  parseDateKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  formatMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  },

  getDailyData(date) {
    return this.loadData(`${STORAGE.daily}${this.formatDateKey(date)}`, {}) || {};
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
    if (!confirm(`${date.getMonth() + 1}譛・{date.getDate()}譌･縺ｮ${this.getKidName(kidId)}縺ｮ縺翫※縺､縺縺・ｒ繝ｪ繧ｻ繝・ヨ縺励∪縺吶°・歔)) return;
    delete daily[kidId];
    this.saveData(key, daily);
    this.renderAll();
  },

  resetSelectedDay() {
    const date = this.selectedDate;
    if (!confirm(`${date.getMonth() + 1}譛・{date.getDate()}譌･縺ｮ險倬鹸繧偵☆縺ｹ縺ｦ繝ｪ繧ｻ繝・ヨ縺励∪縺吶°・歔)) return;
    localStorage.removeItem(`${STORAGE.daily}${this.formatDateKey(date)}`);
    this.renderAll();
  },

  resetCurrentMonth() {
    const date = this.selectedDate;
    if (!confirm(`${date.getFullYear()}蟷ｴ${date.getMonth() + 1}譛医・險倬鹸繧偵☆縺ｹ縺ｦ繝ｪ繧ｻ繝・ヨ縺励∪縺吶°・歔)) return;
    const monthKey = this.formatMonthKey(date);
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE.daily) && key.includes(monthKey))
      .forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(`${STORAGE.spent}${monthKey}`);
    this.renderAll();
  },

  getKidName(kidId) {
    const kid = this.settings.kids.find(k => k.id === kidId);
    return kid ? kid.name : '繝偵・繝ｭ繝ｼ';
  },

  getDailyCompletion(kidId, date) {
    const tasks = this.settings.tasks;
    if (!tasks.length) return { done: 0, total: 0 };
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
      if (done === total) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  },

  calculateMonthlyStars(kidId) {
    const monthKey = this.formatMonthKey(this.selectedDate);
    let count = 0;
    const tasks = this.settings.tasks;
    if (!tasks.length) return 0;
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
    const spentValue = spent && spent[kidId] ? spent[kidId] : 0;
    return Math.max(0, count - spentValue);
  },

  updateCalendarDecorations() {
    const tasks = this.settings.tasks;
    const kids = this.settings.kids;
    if (!tasks.length || !kids.length) {
      this.calendarStatus = {};
      if (this.features.calendar && this.calendar) {
        this.calendar.redraw();
      } else if (this.fallbackCalendarActive) {
        this.renderFallbackCalendar();
      }
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
        const ratio = tasks.length ? done / tasks.length : 0;
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
        tooltip: `${dateKey} | ${tooltipParts.join(' / ')} | 蟷ｳ蝮・{avgCompletion}%`
      };
    });

    this.calendarStatus = statusMap;
    if (this.features.calendar && this.calendar) {
      this.calendar.redraw();
    } else if (this.fallbackCalendarActive) {
      this.renderFallbackCalendar();
    }
  },
  renderHero() {
    if (!this.el.hero) return;
    const date = this.selectedDate;
    const kids = this.settings.kids;
    const tasks = this.settings.tasks;
    const dayName = ['譌･', '譛・, '轣ｫ', '豌ｴ', '譛ｨ', '驥・, '蝨・][date.getDay()];
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
      `${kids.length}莠ｺ縺ｮ繝偵・繝ｭ繝ｼ`,
      tasks.length ? `${tasks.length}繧ｯ繧ｨ繧ｹ繝・ : '繧ｯ繧ｨ繧ｹ繝域悴險ｭ螳・,
      `莉頑律縺ｮ騾ｲ謐・${totalDone}/${totalTasks}`
    ];
    const highlight = champion
      ? `${champion.kid.name}縺ｯ${champion.streak}譌･繧後ｓ縺槭￥繝√Ε繝ｬ繝ｳ繧ｸ荳ｭ・～
      : '莉頑律繧ゅ∩繧薙↑縺ｧ縺後ｓ縺ｰ繧阪≧・・;

    this.el.hero.innerHTML = `
      <p class="hero__greeting">${greeting}</p>
      <h1 class="hero__title">${date.getMonth() + 1}譛・{date.getDate()}譌･(${dayName}) 縺ｮ繝偵・繝ｭ繝ｼ繝ｭ繧ｰ</h1>
      <p class="hero__highlight">${highlight}</p>
      <div class="hero__meta">
        <div class="hero__chips">
          ${chips.map(text => `<span class="chip">${text}</span>`).join('')}
        </div>
        <span class="hero__meter">蟷ｳ蝮・＃謌千紫 ${completionRate}%</span>
      </div>
    `;
  },

  renderDashboard() {
    if (!this.el.kidsDashboard) return;

    const date = this.selectedDate;
    const isToday = this.formatDateKey(date) === this.formatDateKey(new Date());
    const dateLabel = isToday
      ? '莉頑律縺ｮ縺翫※縺､縺縺・
      : `${date.getMonth() + 1}譛・{date.getDate()}譌･縺ｮ縺翫※縺､縺縺Я;
    if (this.el.dateHeading) {
      this.el.dateHeading.textContent = dateLabel;
    }

    const kids = this.settings.kids;
    const tasks = this.settings.tasks;

    if (!kids.length) {
      this.el.kidsDashboard.innerHTML = '<div class="empty-state">險ｭ螳壹°繧峨ヲ繝ｼ繝ｭ繝ｼ繧定ｿｽ蜉縺励ｈ縺・ｼ・/div>';
      return;
    }
    if (!tasks.length) {
      this.el.kidsDashboard.innerHTML = '<div class="empty-state">繧ｯ繧ｨ繧ｹ繝医ｒ霑ｽ蜉縺吶ｋ縺ｨ縺薙％縺ｫ陦ｨ遉ｺ縺輔ｌ縺ｾ縺吶・/div>';
      return;
    }

    this.el.kidsDashboard.innerHTML = '';
    const daily = this.getDailyData(date);

    kids.forEach((kid) => {
      const fragment = this.el.kidTemplate.content.cloneNode(true);
      const card = fragment.querySelector('.kid-card');
      card.dataset.kidId = kid.id;
      fragment.querySelector('[data-role="avatar"]').textContent = kid.emoji || 'ｧ・;
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

      const ring = fragment.querySelector('.progress-ring');
      const canvas = ring.querySelector('canvas');
      if (this.features.chart) {
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
      } else {
        canvas.remove();
        ring.classList.add('progress-ring--simple');
      }

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
          <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline'} btn-circle task-toggle-btn" data-kid-id="${kid.id}" data-task-id="${task.id}" aria-label="${kid.name}縺ｮ${task.name}繧・{isDone ? '譛ｪ螳御ｺ・↓縺吶ｋ' : '螳御ｺ・↓縺吶ｋ'}">
            ${isDone ? '笨費ｸ・ : '・・}
          </button>
        `;
        list.appendChild(li);
      });

      this.el.kidsDashboard.appendChild(fragment);
    });
  },

  renderMonthlySummary() {
    if (!this.el.monthlySummary) return;
    const kids = this.settings.kids;
    const tasks = this.settings.tasks;
    if (!kids.length || !tasks.length) {
      this.el.monthlySummary.innerHTML = '<div class="empty-state">繝偵・繝ｭ繝ｼ縺ｨ繧ｯ繧ｨ繧ｹ繝医ｒ逋ｻ骭ｲ縺吶ｋ縺ｨ繧ｵ繝槭Μ繝ｼ縺瑚｡ｨ遉ｺ縺輔ｌ縺ｾ縺吶・/div>';
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
        <p class="summary-meta">蟷ｳ蝮・${percent}% / 莉頑怦縺ｮ箝・${this.calculateMonthlyStars(kid.id)}</p>
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
    if (!this.el.settingsContent) return;
    const kidsSection = this.settings.kids.map((kid) => `
      <div class="settings-row">
        <div class="settings-row__fields">
          <label class="form-control">
            <span class="label-text">縺ｪ縺ｾ縺・/span>
            <input class="input input-bordered input-sm" data-category="kid" data-id="${kid.id}" name="name" value="${kid.name}" />
          </label>
          <label class="form-control">
            <span class="label-text">濶ｲ</span>
            <input class="input input-bordered input-sm" type="color" data-category="kid" data-id="${kid.id}" name="color" value="${kid.color}" />
          </label>
          <label class="form-control">
            <span class="label-text">邨ｵ譁・ｭ・/span>
            <input class="input input-bordered input-sm" data-category="kid" data-id="${kid.id}" name="emoji" value="${kid.emoji || ''}" />
          </label>
        </div>
        <div class="settings-row__actions">
          <button type="button" class="btn btn-xs" data-action="remove-kid" data-id="${kid.id}">蜑企勁</button>
        </div>
      </div>
    `).join('');

    const tasksSection = this.settings.tasks.map((task) => `
      <div class="settings-row">
        <label class="form-control">
          <span class="label-text">繧ｯ繧ｨ繧ｹ繝亥錐</span>
          <input class="input input-bordered input-sm" data-category="task" data-id="${task.id}" name="name" value="${task.name}" />
        </label>
        <label class="form-control">
          <span class="label-text">繧｢繧､繧ｳ繝ｳ・育ｵｵ譁・ｭ暦ｼ・/span>
          <input class="input input-bordered input-sm" data-category="task" data-id="${task.id}" name="icon" value="${task.icon || ''}" />
        </label>
        <div class="settings-row__actions">
          <button type="button" class="btn btn-xs" data-action="remove-task" data-id="${task.id}">蜑企勁</button>
        </div>
      </div>
    `).join('');

    this.el.settingsContent.innerHTML = `
      <section class="settings-group">
        <header>
          <h4 class="section-heading">繝偵・繝ｭ繝ｼ</h4>
          <p class="modal-caption">螳ｶ譌上・繝励Ο繝輔ぅ繝ｼ繝ｫ繧堤ｷｨ髮・＠縺ｾ縺・/p>
        </header>
        ${kidsSection || '<p class="empty-state">繝偵・繝ｭ繝ｼ縺後∪縺縺・∪縺帙ｓ</p>'}
        <button type="button" class="btn btn-sm mt-3" data-action="add-kid">繝偵・繝ｭ繝ｼ繧定ｿｽ蜉</button>
      </section>
      <section class="settings-group">
        <header>
          <h4 class="section-heading">繧ｯ繧ｨ繧ｹ繝・/h4>
          <p class="modal-caption">豈取律縺ｮ縺翫※縺､縺縺・ｒ逋ｻ骭ｲ</p>
        </header>
        ${tasksSection || '<p class="empty-state">繧ｯ繧ｨ繧ｹ繝医ｒ霑ｽ蜉縺励※縺上□縺輔＞</p>'}
        <button type="button" class="btn btn-sm mt-3" data-action="add-task">繧ｯ繧ｨ繧ｹ繝医ｒ霑ｽ蜉</button>
      </section>
      <section class="settings-group">
        <header>
          <h4 class="section-heading">繧ｵ繧ｦ繝ｳ繝・/ 髻ｳ螢ｰ</h4>
        </header>
        <label class="label cursor-pointer">
          <span class="label-text">蜉ｹ譫憺浹</span>
          <input type="checkbox" class="toggle" name="sound-enabled" ${this.settings.sound ? 'checked' : ''} />
        </label>
        <label class="label cursor-pointer">
          <span class="label-text">髻ｳ螢ｰ隱ｭ縺ｿ荳翫￡</span>
          <input type="checkbox" class="toggle" name="tts-enabled" ${this.settings.tts ? 'checked' : ''} />
        </label>
        <label class="form-control">
          <span class="label-text">隱ｭ縺ｿ荳翫￡騾溷ｺｦ (${this.settings.ttsRate})</span>
          <input type="range" min="0.6" max="1.5" step="0.1" name="tts-rate" value="${this.settings.ttsRate}" />
        </label>
      </section>
    `;
  },

  handleSettingsAction(action, id) {
    if (action === 'add-kid') {
      this.settings.kids.push({
        id: `kid-${Date.now()}`,
        name: '縺ｪ縺ｾ縺・,
        color: '#f472b6',
        emoji: 'ｧ・
      });
    } else if (action === 'remove-kid') {
      this.settings.kids = this.settings.kids.filter(k => k.id !== id);
    } else if (action === 'add-task') {
      this.settings.tasks.push({
        id: `task-${Date.now()}`,
        name: '縺ゅ◆繧峨＠縺・け繧ｨ繧ｹ繝・,
        icon: '箝・
      });
    } else if (action === 'remove-task') {
      this.settings.tasks = this.settings.tasks.filter(t => t.id !== id);
    }

    this.ensureSettingsIntegrity();
    this.saveSettings();
    this.renderSettings();
    this.renderAll();
  },

  createProgressHeadline(done, total) {
    if (!total) {
      return {
        title: '繧ｯ繧ｨ繧ｹ繝医・縺ｾ縺縺ゅｊ縺ｾ縺帙ｓ',
        caption: '險ｭ螳壹〒繧ｯ繧ｨ繧ｹ繝医ｒ霑ｽ蜉縺励※縺ｿ繧医≧'
      };
    }
    if (done === total) {
      return {
        title: '縺懊ｓ縺ｶ繧ｯ繝ｪ繧｢・√♀繧√〒縺ｨ縺・脂',
        caption: '莉頑律縺ｯ繧ゅ≧螳檎挑・・
      };
    }
    if (done === 0) {
      return {
        title: '縺薙％縺九ｉ繧ｹ繧ｿ繝ｼ繝茨ｼ・,
        caption: '縺ｾ縺壹・1縺､繝√Ε繝ｬ繝ｳ繧ｸ縺励※縺ｿ繧医≧'
      };
    }
    return {
      title: `縺ゅ→${total - done}蛟九〒繧ｳ繝ｳ繝励Μ繝ｼ繝茨ｼ～,
      caption: '繝壹・繧ｹ縺ｯ縺薙・縺ｾ縺ｾ縺ｧ縺ｰ縺｣縺｡繧奇ｼ・
    };
  },

  formatStreak(kidId) {
    const streak = this.calculateStreak(kidId);
    if (!streak) return '莉頑律縺後せ繧ｿ繝ｼ繝茨ｼ・;
    if (streak === 1) return '1譌･繧ｯ繝ｪ繧｢荳ｭ';
    return `${streak}譌･繧後ｓ縺槭￥繧ｯ繝ｪ繧｢`;
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 10) return '縺翫・繧医≧・∽ｻ頑律繧ゅヲ繝ｼ繝ｭ繝ｼ豢ｻ蜍輔ｒ蟋九ａ繧医≧';
    if (hour < 18) return '縺薙ｓ縺ｫ縺｡縺ｯ・∵眠縺励＞繧ｯ繧ｨ繧ｹ繝医↓謖第姶縺励ｈ縺・;
    return '縺薙ｓ縺ｰ繧薙・・∽ｻ頑律縺ｮ謖ｯ繧願ｿ斐ｊ繧偵＠繧医≧';
  },

  updateTtsButton() {
    if (!this.el.ttsIcon || !this.el.ttsBtn) return;
    this.el.ttsIcon.textContent = this.settings.tts ? '矧' : '蝿';
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
    if (this.features.confetti) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.4 },
        colors: [(kid && kid.color) || '#34d399', '#facc15', '#60a5fa']
      });
    }
    if (this.settings.tts && this.features.speech) {
      const kidName = kid && kid.name ? kid.name : '繝偵・繝ｭ繝ｼ';
      const taskName = task && task.name ? task.name : '縺翫※縺､縺縺・;
      const utter = new SpeechSynthesisUtterance(`${kidName}縲・{taskName}繧偵け繝ｪ繧｢・～);
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

  shiftMonth(offset) {
    const current = this.selectedDate;
    this.selectedDate = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.renderAll();
  },

  renderFallbackCalendar() {
    if (!this.el.calendarContainer) return;
    const container = this.el.calendarContainer;
    const date = this.selectedDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const firstDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekdayLabels = ['譌･', '譛・, '轣ｫ', '豌ｴ', '譛ｨ', '驥・, '蝨・];

    let day = 1;
    const rows = [];
    while (day <= daysInMonth) {
      const cells = [];
      for (let col = 0; col < 7; col += 1) {
        if (rows.length === 0 && col < firstDay) {
          cells.push('<td class="fallback-day is-empty"></td>');
          continue;
        }
        if (day > daysInMonth) {
          cells.push('<td class="fallback-day is-empty"></td>');
          continue;
        }
        const cellDate = new Date(year, month, day);
        const key = this.formatDateKey(cellDate);
        const status = this.calendarStatus[key];
        let classes = 'fallback-day';
        if (status) {
          classes += ` fallback-day--${status.state}`;
        }
        if (this.formatDateKey(this.selectedDate) === key) {
          classes += ' fallback-day--selected';
        }
        const dotsMarkup = status && status.dots.length
          ? `<div class="fallback-day__dots">${status.dots.map(dot => `<span class="fallback-day__dot" style="background-color:${dot.color};opacity:${dot.opacity}"></span>`).join('')}</div>`
          : '';
        const progressMarkup = status && Number.isFinite(status.avgCompletion)
          ? `<span class="fallback-day__progress">${status.avgCompletion}%</span>`
          : '';
        const tooltip = (status && status.tooltip) ? status.tooltip : '';
        cells.push(`
          <td class="${classes}" data-date="${key}" title="${tooltip}">
            <span class="fallback-day__date">${day}</span>
            ${dotsMarkup}
            ${progressMarkup}
          </td>
        `);
        day += 1;
      }
      rows.push(`<tr>${cells.join('')}</tr>`);
    }

    container.innerHTML = `
      <div class="fallback-calendar__header">
        <button type="button" class="btn btn-xs btn-ghost" data-fallback-nav="prev" aria-label="蜑阪・譛医∈">竊・/button>
        <strong>${year}蟷ｴ${month + 1}譛・/strong>
        <button type="button" class="btn btn-xs btn-ghost" data-fallback-nav="next" aria-label="谺｡縺ｮ譛医∈">竊・/button>
      </div>
      <table class="fallback-calendar" aria-label="縺翫※縺､縺縺・き繝ｬ繝ｳ繝繝ｼ">
        <thead>
          <tr>${weekdayLabels.map(label => `<th scope="col">${label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  },

  renderAll() {
    this.ensureSettingsIntegrity();
    this.saveSettings();
    this.updateCalendarDecorations();
    this.renderHero();
    this.renderDashboard();
    this.renderMonthlySummary();
    this.updateTtsButton();

    if (this.features.calendar && this.calendar) {
      this.calendar.setDate(this.selectedDate, false);
    } else if (this.fallbackCalendarActive) {
      this.renderFallbackCalendar();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

















