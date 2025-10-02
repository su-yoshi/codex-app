const STORAGE_KEY = 'aurora-sprint-v1';

const DEFAULT_DATA = {
  kids: [
    { id: 'hikari', name: 'Hikari', color: '#8363ff' },
    { id: 'mirai', name: 'Mirai', color: '#22c1e5' }
  ],
  tasks: [
    { id: 'dishes', name: 'Dishes' },
    { id: 'laundry', name: 'Laundry fold' },
    { id: 'room', name: 'Room tidy' }
  ]
};

const UTIL = {
  clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  },
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
  formatMonth(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
};

const App = {
  data: UTIL.clone(DEFAULT_DATA),
  state: { log: {}, spent: {} },
  selectedDate: new Date(),
  monthDate: new Date(),

  init() {
    this.cacheDom();
    this.loadState();
    this.bindEvents();
    this.renderAll();
  },

  cacheDom() {
    this.heroEl = document.getElementById('hero');
    this.calendarEl = document.getElementById('calendar');
    this.calendarLabel = document.getElementById('calendarLabel');
    this.dashboardEl = document.getElementById('dashboard');
    this.summaryEl = document.getElementById('summary');
    this.selectedDateLabel = document.getElementById('selectedDateLabel');
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBody = document.getElementById('settingsBody');
  },

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.state = { log: {}, spent: {} };
        this.data = UTIL.clone(DEFAULT_DATA);
        this.saveState();
        return;
      }
      const payload = JSON.parse(raw);
      this.state = {
        log: payload.log || {},
        spent: payload.spent || {}
      };
      const incoming = payload.data || {};
      this.data = {
        kids: Array.isArray(incoming.kids) && incoming.kids.length ? incoming.kids : UTIL.clone(DEFAULT_DATA.kids),
        tasks: Array.isArray(incoming.tasks) && incoming.tasks.length ? incoming.tasks : UTIL.clone(DEFAULT_DATA.tasks)
      };
      this.ensureIntegrity();
    } catch (error) {
      console.warn('Failed to load state, resetting.', error);
      this.state = { log: {}, spent: {} };
      this.data = UTIL.clone(DEFAULT_DATA);
      this.saveState();
    }
  },

  saveState() {
    const payload = {
      data: this.data,
      log: this.state.log,
      spent: this.state.spent
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },

  ensureIntegrity() {
    const kidIds = new Set();
    this.data.kids = this.data.kids.map((kid, index) => {
      const safeId = kid && kid.id ? String(kid.id) : `kid-${index}`;
      kidIds.add(safeId);
      return {
        id: safeId,
        name: kid && kid.name ? String(kid.name).substring(0, 30) : `Hero ${index + 1}`,
        color: kid && kid.color ? String(kid.color) : '#6366f1'
      };
    });

    this.data.tasks = this.data.tasks.map((task, index) => ({
      id: task && task.id ? String(task.id) : `task-${index}`,
      name: task && task.name ? String(task.name).substring(0, 28) : `Task ${index + 1}`
    }));

    const validTaskIds = new Set(this.data.tasks.map(t => t.id));

    const newLog = {};
    Object.keys(this.state.log || {}).forEach(dateKey => {
      const dayRecord = this.state.log[dateKey];
      const cleanDay = {};
      Object.keys(dayRecord || {}).forEach(kidId => {
        if (!kidIds.has(kidId)) return;
        const taskRecord = dayRecord[kidId];
        const cleanTasks = {};
        Object.keys(taskRecord || {}).forEach(taskId => {
          if (validTaskIds.has(taskId)) cleanTasks[taskId] = taskRecord[taskId] === true;
        });
        cleanDay[kidId] = cleanTasks;
      });
      newLog[dateKey] = cleanDay;
    });
    this.state.log = newLog;
  },

  bindEvents() {
    document.getElementById('prevMonth').addEventListener('click', () => {
      this.monthDate = new Date(this.monthDate.getFullYear(), this.monthDate.getMonth() - 1, 1);
      this.renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      this.monthDate = new Date(this.monthDate.getFullYear(), this.monthDate.getMonth() + 1, 1);
      this.renderCalendar();
    });

    this.calendarEl.addEventListener('click', (event) => {
      const target = event.target.closest('[data-date]');
      if (!target) return;
      const selected = target.getAttribute('data-date');
      if (!selected) return;
      const parts = selected.split('-').map(Number);
      this.selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
      this.renderAll();
    });

    document.querySelector('.dashboard-panel .panel-header').addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.action === 'reset-day') {
        this.resetDay();
      } else if (button.dataset.action === 'reset-month') {
        this.resetMonth();
      }
    });

    this.dashboardEl.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-toggle-task]');
      if (!toggle) return;
      const kidId = toggle.getAttribute('data-kid');
      const taskId = toggle.getAttribute('data-task');
      if (!kidId || !taskId) return;
      this.toggleTask(kidId, taskId);
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('exportButton').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('settingsSave').addEventListener('click', () => {
      this.saveSettingsFromModal();
    });

    this.settingsModal.addEventListener('click', (event) => {
      if (event.target.dataset.close === 'settings') {
        this.closeSettings();
      }
    });
  },

  toggleTask(kidId, taskId) {
    const dateKey = UTIL.formatDate(this.selectedDate);
    if (!this.state.log[dateKey]) this.state.log[dateKey] = {};
    if (!this.state.log[dateKey][kidId]) this.state.log[dateKey][kidId] = {};
    const current = !!this.state.log[dateKey][kidId][taskId];
    this.state.log[dateKey][kidId][taskId] = !current;
    this.saveState();
    this.renderDashboard();
    this.renderSummary();
    this.renderCalendar();
  },

  resetDay() {
    const dateKey = UTIL.formatDate(this.selectedDate);
    delete this.state.log[dateKey];
    this.saveState();
    this.renderAll();
  },

  resetMonth() {
    const monthKey = UTIL.formatMonth(this.selectedDate);
    Object.keys(this.state.log).forEach(dateKey => {
      if (dateKey.startsWith(monthKey)) delete this.state.log[dateKey];
    });
    delete this.state.spent[monthKey];
    this.saveState();
    this.renderAll();
  },

  renderAll() {
    this.renderHero();
    this.renderCalendar();
    this.renderDashboard();
    this.renderSummary();
  },

  renderHero() {
    const today = new Date();
    const greeting = this.getGreeting();
    const totalTasks = this.data.tasks.length * this.data.kids.length;
    let done = 0;
    const dateKey = UTIL.formatDate(this.selectedDate);
    const dayLog = this.state.log[dateKey] || {};
    Object.keys(dayLog).forEach(kidId => {
      const kidRecord = dayLog[kidId];
      Object.keys(kidRecord).forEach(taskId => {
        if (kidRecord[taskId]) done += 1;
      });
    });
    const percent = totalTasks ? Math.round((done / totalTasks) * 100) : 0;

    this.heroEl.innerHTML = `
      <div class="hero-grid">
        <div>
          <p class="hero-sub">${greeting}</p>
          <h2>${this.describeSelectedDate()}</h2>
          <p class="hero-meta">${this.data.kids.length} heroes · ${this.data.tasks.length} quests</p>
        </div>
        <div class="hero-progress">
          <span>${percent}%</span>
          <p>of today's quests completed</p>
        </div>
      </div>
    `;
  },

  renderCalendar() {
    const workingDate = new Date(this.monthDate.getFullYear(), this.monthDate.getMonth(), 1);
    this.calendarLabel.textContent = `${workingDate.getFullYear()}-${String(workingDate.getMonth() + 1).padStart(2, '0')}`;

    const firstDay = new Date(workingDate.getFullYear(), workingDate.getMonth(), 1);
    const offset = firstDay.getDay();
    const daysInMonth = new Date(workingDate.getFullYear(), workingDate.getMonth() + 1, 0).getDate();

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fragment = document.createDocumentFragment();

    weekdays.forEach(label => {
      const cell = document.createElement('div');
      cell.className = 'weekday';
      cell.textContent = label;
      fragment.appendChild(cell);
    });

    for (let i = 0; i < offset; i += 1) {
      const empty = document.createElement('div');
      empty.className = 'day empty';
      fragment.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(workingDate.getFullYear(), workingDate.getMonth(), day);
      const dateKey = UTIL.formatDate(date);
      const isToday = UTIL.formatDate(new Date()) === dateKey;
      const isSelected = UTIL.formatDate(this.selectedDate) === dateKey;

      const doneInfo = this.getDayProgress(dateKey);

      const cell = document.createElement('div');
      cell.className = 'day';
      if (isToday) cell.classList.add('today');
      if (isSelected) cell.classList.add('selected');
      cell.setAttribute('data-date', dateKey);

      const label = document.createElement('div');
      label.className = 'number';
      label.textContent = day;
      cell.appendChild(label);

      const indicator = document.createElement('div');
      indicator.className = 'indicator';
      const fill = document.createElement('span');
      fill.style.width = `${doneInfo.percent}%`;
      fill.style.background = doneInfo.color;
      indicator.appendChild(fill);
      cell.appendChild(indicator);

      fragment.appendChild(cell);
    }

    this.calendarEl.innerHTML = '';
    this.calendarEl.appendChild(fragment);
  },

  getDayProgress(dateKey) {
    const log = this.state.log[dateKey];
    if (!log) return { percent: 0, color: 'rgba(148,163,184,0.4)' };
    let total = 0;
    let done = 0;
    Object.keys(log).forEach(kidId => {
      const kidRecord = log[kidId];
      Object.keys(kidRecord).forEach(taskId => {
        total += 1;
        if (kidRecord[taskId]) done += 1;
      });
    });
    if (!total) return { percent: 0, color: 'rgba(148,163,184,0.4)' };
    const percent = Math.round((done / total) * 100);
    let color = 'rgba(148,163,184,0.4)';
    if (percent === 100) color = 'rgba(34,197,94,0.8)';
    else if (percent > 0) color = 'rgba(249,115,22,0.8)';
    return { percent, color };
  },

  renderDashboard() {
    const dateKey = UTIL.formatDate(this.selectedDate);
    this.selectedDateLabel.textContent = this.describeSelectedDate();
    this.dashboardEl.innerHTML = '';

    const template = document.getElementById('kidTemplate');
    const log = this.state.log[dateKey] || {};

    this.data.kids.forEach(kid => {
      const clone = template.content.cloneNode(true);
      const card = clone.querySelector('.kid-card');
      const avatar = clone.querySelector('.kid-avatar');
      avatar.style.background = kid.color;
      avatar.textContent = kid.name.charAt(0).toUpperCase();
      clone.querySelector('.kid-name').textContent = kid.name;

      const streak = this.getStreak(kid.id);
      clone.querySelector('.kid-streak').textContent = streak ? `${streak} day streak` : 'Start a streak today';

      const stars = this.countStars(kid.id);
      clone.querySelector('.kid-stars .value').textContent = stars;

      const canvas = clone.querySelector('canvas');
      const ringLabel = clone.querySelector('.ring-label');
      const barFill = clone.querySelector('.progress-bar span');
      const headline = clone.querySelector('.progress-headline');
      const caption = clone.querySelector('.progress-caption');

      const tasks = this.data.tasks;
      const kidRecord = log[kid.id] || {};
      let done = 0;
      tasks.forEach(task => { if (kidRecord[task.id]) done += 1; });
      const total = tasks.length;
      const percent = total ? Math.round((done / total) * 100) : 0;

      ringLabel.textContent = total ? `${done}/${total}` : '--';
      barFill.style.width = `${percent}%`;
      this.drawRing(canvas, percent, kid.color);

      if (!total) {
        headline.textContent = 'No quests yet.';
        caption.textContent = 'Add chores in settings to start tracking.';
      } else if (done === total) {
        headline.textContent = 'Perfect day!';
        caption.textContent = 'All quests complete. Great job!';
      } else if (done === 0) {
        headline.textContent = 'Ready to begin';
        caption.textContent = 'Pick a quest to kick things off.';
      } else {
        headline.textContent = `Only ${total - done} to go.`;
        caption.textContent = 'Keep the momentum!' ;
      }

      const list = clone.querySelector('.task-list');
      tasks.forEach(task => {
        const li = document.createElement('li');
        if (kidRecord[task.id]) li.classList.add('done');
        const label = document.createElement('span');
        label.textContent = task.name;
        const btn = document.createElement('button');
        btn.textContent = kidRecord[task.id] ? 'Undo' : 'Done';
        btn.setAttribute('data-toggle-task', 'true');
        btn.setAttribute('data-kid', kid.id);
        btn.setAttribute('data-task', task.id);
        li.appendChild(label);
        li.appendChild(btn);
        list.appendChild(li);
      });

      this.dashboardEl.appendChild(clone);
    });
  },

  drawRing(canvas, percent, color) {
    const ctx = canvas.getContext('2d');
    const center = canvas.width / 2;
    const radius = center - 6;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.beginPath();
    const end = (Math.PI * 2 * percent) / 100 - Math.PI / 2;
    ctx.arc(center, center, radius, -Math.PI / 2, end, false);
    ctx.stroke();
  },

  renderSummary() {
    this.summaryEl.innerHTML = '';
    const monthKey = UTIL.formatMonth(this.monthDate);
    const monthDays = this.getMonthDates(this.monthDate);

    this.data.kids.forEach(kid => {
      let total = 0;
      let done = 0;
      monthDays.forEach(dateKey => {
        const record = this.state.log[dateKey];
        if (!record || !record[kid.id]) return;
        Object.keys(record[kid.id]).forEach(taskId => {
          total += 1;
          if (record[kid.id][taskId]) done += 1;
        });
      });
      const percent = total ? Math.round((done / total) * 100) : 0;
      const card = document.createElement('article');
      card.className = 'summary-card-item';
      card.innerHTML = `
        <h3>${kid.name}</h3>
        <div class="meta">${monthKey}</div>
        <div class="meta">${done} of ${total} quests done</div>
        <div class="meta">${percent}% completion</div>
      `;
      this.summaryEl.appendChild(card);
    });
  },

  getMonthDates(baseDate) {
    const dates = [];
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const total = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= total; day += 1) {
      dates.push(UTIL.formatDate(new Date(year, month, day)));
    }
    return dates;
  },

  describeSelectedDate() {
    const todayKey = UTIL.formatDate(new Date());
    const selectedKey = UTIL.formatDate(this.selectedDate);
    if (todayKey === selectedKey) return 'Today';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return this.selectedDate.toLocaleDateString('en-US', options);
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 10) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },

  getStreak(kidId) {
    let streak = 0;
    const today = new Date();
    for (let offset = 0; offset < 60; offset += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const dateKey = UTIL.formatDate(date);
      const record = this.state.log[dateKey];
      if (!record || !record[kidId]) break;
      const kidRecord = record[kidId];
      const totalTasks = this.data.tasks.length;
      let done = 0;
      this.data.tasks.forEach(task => { if (kidRecord[task.id]) done += 1; });
      if (totalTasks > 0 && done === totalTasks) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  },

  countStars(kidId) {
    const monthKey = UTIL.formatMonth(this.monthDate);
    let stars = 0;
    Object.keys(this.state.log).forEach(dateKey => {
      if (!dateKey.startsWith(monthKey)) return;
      const record = this.state.log[dateKey];
      if (!record || !record[kidId]) return;
      Object.keys(record[kidId]).forEach(taskId => {
        if (record[kidId][taskId]) stars += 1;
      });
    });
    const spent = this.state.spent[monthKey] && this.state.spent[monthKey][kidId] ? this.state.spent[monthKey][kidId] : 0;
    return Math.max(0, stars - spent);
  },

  openSettings() {
    this.renderSettings();
    this.settingsModal.setAttribute('aria-hidden', 'false');
  },

  closeSettings() {
    this.settingsModal.setAttribute('aria-hidden', 'true');
  },

  renderSettings() {
    const wrapper = document.createElement('div');
    wrapper.className = 'settings-grid';

    const kidsSection = document.createElement('section');
    kidsSection.className = 'settings-group';
    kidsSection.innerHTML = '<h3>Heroes</h3>';
    const kidsGrid = document.createElement('div');
    kidsGrid.className = 'settings-grid';
    this.data.kids.forEach(kid => {
      const row = document.createElement('div');
      row.className = 'settings-row';
      row.innerHTML = `
        <label>Name
          <input type="text" data-type="kid-name" data-id="${kid.id}" value="${kid.name}">
        </label>
        <label>Accent color
          <input type="text" data-type="kid-color" data-id="${kid.id}" value="${kid.color}">
        </label>
      `;
      kidsGrid.appendChild(row);
    });
    kidsSection.appendChild(kidsGrid);
    wrapper.appendChild(kidsSection);

    const tasksSection = document.createElement('section');
    tasksSection.className = 'settings-group';
    tasksSection.innerHTML = '<h3>Quests</h3>';
    const tasksGrid = document.createElement('div');
    tasksGrid.className = 'settings-grid';
    this.data.tasks.forEach(task => {
      const row = document.createElement('div');
      row.className = 'settings-row';
      row.innerHTML = `
        <label>Task name
          <input type="text" data-type="task-name" data-id="${task.id}" value="${task.name}">
        </label>
      `;
      tasksGrid.appendChild(row);
    });
    tasksSection.appendChild(tasksGrid);
    wrapper.appendChild(tasksSection);

    this.settingsBody.innerHTML = '';
    this.settingsBody.appendChild(wrapper);
  },

  saveSettingsFromModal() {
    const inputs = Array.from(this.settingsBody.querySelectorAll('input'));
    inputs.forEach(input => {
      const type = input.getAttribute('data-type');
      const id = input.getAttribute('data-id');
      if (!type || !id) return;
      const value = input.value.trim();
      if (type === 'kid-name') {
        const kid = this.data.kids.find(item => item.id === id);
        if (kid && value) kid.name = value;
      } else if (type === 'kid-color') {
        const kid = this.data.kids.find(item => item.id === id);
        if (kid && /^#[0-9a-fA-F]{6}$/.test(value)) kid.color = value;
      } else if (type === 'task-name') {
        const task = this.data.tasks.find(item => item.id === id);
        if (task && value) task.name = value;
      }
    });
    this.ensureIntegrity();
    this.saveState();
    this.closeSettings();
    this.renderAll();
  },

  exportData() {
    const payload = {
      generatedAt: new Date().toISOString(),
      data: this.data,
      log: this.state.log,
      spent: this.state.spent
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aurora-export-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

