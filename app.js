(function() {
  'use strict';

  // ─── Constants & Configuration ───
  const STORAGE_PREFIX = 'kids-week-planner-v1-';
  const CONFIG_STORAGE_KEY = 'kids-week-planner-config-v1';
  const BACKUP_ID = 'kids-week-planner-backup';
  const BACKUP_VERSION = '1.1';

  let SLOTS_PER_KID = 3;
  const STATUS_SEQUENCE = ['unset', 'todo', 'pending', 'done'];
  const STATUS_LABELS = {
    unset: '未設定',
    todo: 'やる！',
    pending: '確認してね',
    done: 'できた！'
  };

  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const DEFAULT_KID_COLORS = ['#8363ff', '#22c1e5', '#ff6b6b', '#ffd93d', '#6bcb77'];

  const CHARACTERS = {
    cloudon: { name: 'クラウドん', img: 'characters/char_cloudon.png?v=13', quotes: { none: 'いっしょにお金の勉強をしよう！', start: '今日もお手伝いがんばろう☁️', mid: 'その調子！応援しているよ☁️', done: 'コンプリート！すごいね☁️✨' } },
    kakeru: { name: 'カケル', img: 'characters/char_kakeru.png?v=13', quotes: { none: 'ボクといっしょに冒険だ！', start: 'さあ、クエスト開始だよ！', mid: 'あと少し！あきらめるな！', done: 'やったね！最強のヒーローだ！' } },
    logico: { name: 'ロジコ', img: 'characters/char_logico.png?v=13', quotes: { none: '計画的に進めるのがコツだよ。', start: 'まずは今日の予定を確認しよう。', mid: '半分クリア。順調だね。', done: '素晴らしい。完璧な仕事だよ。' } },
    kirara: { name: 'キララ', img: 'characters/char_kirara.png?v=13', quotes: { none: 'キラキラな毎日にしよう♪', start: '今日もハッピーにお手伝♪', mid: 'がんばり屋さんなキミが好き！', done: 'キラキラ！全部達成だね♪' } }
  };

  const REWARD_TIERS = [
    { points: 0, title: 'はじめての冒険', reward: 'まずはスターを10個集めよう！', hint: '家族で最初のごほうびを相談してね' },
    { points: 50, title: '見習い商人', reward: 'お菓子1個ランクアップ！', hint: '好きなアイスが選べるかも？' },
    { points: 150, title: 'お金の達人', reward: '特別な週末のお出かけ', hint: '行きたい場所をリクエストしよう！' }
  ];

  const CELEBRATION_EMOJIS = ['✨', '🌟', '💎', '🎨', '🚀', '🌈', '🍭', '🍕'];
  const REWARD_IDEAS = [
    '「{starsDone}個もスターをゲットしたね！ごほうびまであと{remaining}個だよ！」',
    '「わぁ！{emoji} 今日の頑張りは、パパもママも見てるよ！」',
    '「貯金箱にチャリン！とお金が貯まる音が聞こえるね♪」'
  ];
  const FAMILY_CHALLENGES = [
    '「目標のアイテムをゲットしたら、何から使うか決めてる？{emoji}」',
    '「こつこつ貯めるのは、魔法の力（複利）を味方につける第一歩だよ！」',
    '「お手伝いはお金だけじゃない、ありがとうの気持ちも貯まってるよ！」'
  ];

  const ADVENTURE_LANDMARKS = [
    { id: 'start', name: 'はじまりの村', progress: 0, msg: 'さあ、冒険の始まりだ！一歩ずつ進んでいこう。', icon: '🏡', x: 30, y: 88 },
    { id: 'cave', name: 'きらめき洞窟', progress: 0.25, msg: '洞窟の中にはお宝がいっぱい！最初のチケットゲット！', icon: '💎', x: 75, y: 85 },
    { id: 'forest', name: '大樹の森', progress: 0.5, msg: '半分まで来たね！巨大な木が君の頑張りを応援しているよ。', icon: '🌲', x: 70, y: 55 },
    { id: 'mountain', name: '勇者の雪山', progress: 0.75, msg: '険しい雪山も君なら越えられる！お城まであと少しだ！', icon: '⛰️', x: 25, y: 45 },
    { id: 'castle', name: '夢のお城', progress: 1.0, msg: 'おめでとう！夢のお城に到着だ！真のヒーローの証拠だね✨', icon: '🏰', x: 50, y: 15 }
  ];

  // ガチャ景品マスターデータ (男女ともに楽しめるラインナップ)
  const GACHA_ITEMS = [
    // --- Normal (出やすい) ---
    { id: 'g001', name: 'スライムバッジ', rarity: 'normal', icon: '💧', desc: 'ぷるぷるのスライム。冒険の第一歩！' },
    { id: 'g002', name: '木の剣', rarity: 'normal', icon: '🗡️', desc: '少し心強い、基本の武器。' },
    { id: 'g003', name: 'お花の冠', rarity: 'normal', icon: '🌸', desc: '可愛いお花で編んだカンムリ。' },
    { id: 'g004', name: '薬草', rarity: 'normal', icon: '🌿', desc: '元気が回復する不思議な葉っぱ。' },
    { id: 'g005', name: '星のステッキ', rarity: 'normal', icon: '🪄', desc: '振ると星が飛び出す可愛いステッキ！' },
    { id: 'g006', name: 'ガラスの靴', rarity: 'normal', icon: '👠', desc: 'キラキラ光る、まるでお姫様の靴。' },

    // --- Rare (ちょっとめずらしい) ---
    { id: 'g007', name: '魔法の石', rarity: 'rare', icon: '🔮', desc: 'ぼんやり光る魔法の石。ちょっとレア。' },
    { id: 'g008', name: '炎の盾', rarity: 'rare', icon: '🛡️', desc: '熱を跳ね返すカッコイイ赤い盾。' },
    { id: 'g009', name: 'マーメイドのパール', rarity: 'rare', icon: '💎', desc: '海のように青く輝く美しい宝石。' },
    { id: 'g010', name: 'ユニコーンのぬいぐるみ', rarity: 'rare', icon: '🦄', desc: 'もふもふでカラフルな大人気アイテム！' },
    { id: 'g011', name: 'おやつ+1追加券', rarity: 'rare', icon: '🍪', desc: '親に見せると、おやつが1個追加される魔法のクーポン！' },

    // --- Epic (超激レア！) ---
    { id: 'g012', name: '伝説の聖剣', rarity: 'epic', icon: '✨🗡️✨', desc: '選ばれし勇者だけが持てる伝説の武器！' },
    { id: 'g013', name: 'プリンセスのティアラ', rarity: 'epic', icon: '👑✨', desc: '誰もが憧れる、最高にキラキラなお姫様の冠！' },
    { id: 'g014', name: 'ゲーム15分延長券', rarity: 'epic', icon: '🎮', desc: '親に見せると、ゲームが15分延長できる超レアクーポン！' },
    { id: 'g015', name: '好きな夕食リクエスト券', rarity: 'epic', icon: '🍛', desc: '今日の夜ご飯を、キミが自由に決められる魔法のチケット！' }
  ];

  // ─── Application State ───
  let kids = [
    { id: 'kid-kakeru', name: 'カケル', color: '#3b82f6', bank: 0, goal: 'おもちゃ', goalAmount: 1000, characterId: 'kakeru', gachaTickets: 0, gachaItems: [] },
    { id: 'kid-kirara', name: 'キララ', color: '#ec4899', bank: 0, goal: 'えほん', goalAmount: 800, characterId: 'kirara', gachaTickets: 0, gachaItems: [] }
  ];
  const QUEST_EMOJIS = ['⭐', '🧹', '🧺', '🧼', '🛁', '🍽️', '🍳', '🍴', '🪴', '🌻', '🐕', '🐈', '🗑️', '📚', '🧸', '👟', '👞', '🥛', '👔', '👕', '🦷', '🚗', '🚲', '🍎', '💪', '🏠'];

  let tasks = [
    { id: 'task-dishes', label: 'おさらをはこぶ', icon: '🍽️', reward: 30 },
    { id: 'task-shoes', label: 'くつをそろえる', icon: '👟', reward: 20 },
    { id: 'task-plants', label: 'おはなのみずやり', icon: '🌻', reward: 50 }
  ];

  let taskMap = new Map();
  let validTaskIds = new Set();
  const calendarWeekCache = new Map();
  const storageAvailable = (function() {
    try {
      const x = '__sttest__';
      localStorage.setItem(x, x);
      localStorage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  })();

  const state = {
    weekStart: null,
    weekKey: '',
    weekOffset: 0,
    weekData: null,
    editMode: false,
    controlCollapsed: true,
    controlSelection: {
      dayIndex: 0,
      kidId: 'kid-kakeru',
      slotIndex: 0,
      taskId: ''
    },
    calendarMonth: new Date(),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    currentTab: 'today',
    familyId: null
  };

  let elements = {};
  let deferredInstallPrompt = null;

  // ─── Initialization ───
  function init() {
    cacheElements();
    loadConfig();
    refreshTaskLookup();
    state.calendarMonth = startOfMonth(new Date());
    
    bindEvents();
    setupPWAInstall();
    
    // 現在の週を表示
    goToWeek(0); 
    
    // PWAメッセージ初期化
    if (state.isStandalone) {
      updateFooterControls();
    }

    // 昼夜テーマ判定
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 17) {
      document.documentElement.setAttribute('data-theme', 'day');
    }
  }

  function cacheElements() {
    elements = {
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),
      weekLabel: document.getElementById('weekLabel'),
      starsEarned: document.getElementById('starsEarned'),
      starsTarget: document.getElementById('starsTarget'),
      progressPercent: document.getElementById('progressPercent'),
      progressBar: document.getElementById('progressBar'),
      calendarLabel: document.getElementById('calendarLabel'),
      calendarGrid: document.getElementById('calendarGrid'),
      boardTitle: document.getElementById('boardTitle'),
      boardSubtitle: document.getElementById('boardSubtitle'),
      specialSection: document.querySelector('.special-content'),
      specialMessage: document.getElementById('specialMessage'),
      specialProgress: document.getElementById('specialProgress'),
      specialReward: document.getElementById('specialReward'),
      specialChallenge: document.getElementById('specialChallenge'),
      cardsContainer: document.getElementById('cardsContainer'),
      editToggle: document.getElementById('editToggle'),
      editStateLabel: document.getElementById('editStateLabel'),
      editModeHint: document.getElementById('editModeHint'),
      controlPanel: document.getElementById('editControlPanel'),
      controlPanelBody: document.getElementById('controlPanelBody'),
      controlCollapse: document.getElementById('controlCollapse'),
      totalBank: document.getElementById('totalBank'),
      kidBankStatus: document.getElementById('kidBankStatus'),
      headerProgress: document.getElementById('headerProgress'),
      todayDone: document.getElementById('todayDone'),
      todayRemaining: document.getElementById('todayRemaining'),
      todayTotalReward: document.getElementById('todayTotalReward'),
      adventureRoadmap: document.getElementById('adventureRoadmap'),
      weeklyPlanner: document.getElementById('weeklyPlanner'),
      controlAutoDistribute: document.getElementById('controlAutoDistribute'),
      controlClearWeek: document.getElementById('controlClearWeek'),
      taskPickerModal: document.getElementById('taskPickerModal'),
      taskPickerGrid: document.getElementById('taskPickerGrid'),
      closeTaskPicker: document.getElementById('closeTaskPicker'),
      kidManager: document.getElementById('kidManager'),
      addKid: document.getElementById('addKid'),
      taskManager: document.getElementById('taskManager'),
      addTask: document.getElementById('addTask'),
      resetAll: document.getElementById('resetAll'),
      taskLibrary: document.getElementById('taskLibrary'),
      exportData: document.getElementById('exportData'),
      importData: document.getElementById('importData'),
      importFile: document.getElementById('importFile'),
      installApp: document.getElementById('installApp'),
      footerNote: document.getElementById('footerNote'),
      settingSlotsPerKid: document.getElementById('settingSlotsPerKid'),
      eventModal: document.getElementById('eventModal'),
      eventModalBody: document.getElementById('eventModalBody'),
      closeEventModal: document.getElementById('closeEventModal'),
      syncFamilyId: document.getElementById('syncFamilyId'),
      btnStartSync: document.getElementById('btnStartSync'),
      syncStatus: document.getElementById('syncStatus')
    };
  }

  // ─── Navigation & Flow ───
  function goToWeek(offset) {
    state.weekOffset = offset;
    const pivot = new Date();
    pivot.setHours(0, 0, 0, 0);
    pivot.setDate(pivot.getDate() + offset * 7);
    state.weekStart = startOfWeek(pivot);
    state.weekKey = buildWeekKey(state.weekStart);
    state.weekData = loadWeekData(state.weekKey, state.weekStart);
    ensureControlSelectionValid();
    render();
  }

  function goToWeekSpecific(pivotDate, forcedDayIndex = null) {
    state.weekStart = startOfWeek(pivotDate);
    state.weekKey = buildWeekKey(state.weekStart);
    
    // 現在の日付からのオフセットを概算
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.floor((state.weekStart - startOfWeek(today)) / (1000 * 60 * 60 * 24 * 7));
    state.weekOffset = diff;

    state.weekData = loadWeekData(state.weekKey, state.weekStart);
    
    if (forcedDayIndex !== null) {
      state.controlSelection.dayIndex = forcedDayIndex;
    }

    ensureControlSelectionValid();
    render();
  }

  function switchTab(tabId) {
    state.currentTab = tabId;
    elements.tabBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tabId);
    });
    elements.tabContents.forEach(content => {
      content.classList.toggle('is-active', content.id === `tab-${tabId}`);
    });
    if (tabId === 'setup') {
      activateEditMode();
    } else {
      // 準備タブ以外では、描画を更新
      render();
    }
  }

  // ─── Core Rendering ───
  function render() {
    if (!state.weekData) return;
    const kidsSynced = syncWeekDataWithKids();
    const tasksCleaned = cleanupSlotsForMissingTasks();
    
    updateWeekLabel();
    renderCards();
    updateSummary();
    updateEditState();
    renderKidManager();
    renderTaskManager();
    renderTaskLibrary();
    renderCalendar();
    renderAdventureRoadmap();
    renderGachaArea();
    renderWeeklyPlanner();
    updateFooterControls();
    
    if (kidsSynced || tasksCleaned) saveWeekData();
  }

  function updateWeekLabel() {
    if (!elements.weekLabel) return;
    const start = new Date(state.weekStart);
    const end = new Date(state.weekStart);
    end.setDate(end.getDate() + 6);
    elements.weekLabel.textContent = formatJapaneseDate(start) + ' 〜 ' + formatJapaneseDate(end);
  }

  function renderCards() {
    if (!elements.cardsContainer || !state.weekData) return;
    elements.cardsContainer.innerHTML = '';
    const day = state.weekData.days[state.controlSelection.dayIndex];
    if (!day) return;
    
    updateBoardHeading(day);
    updateSpecialContent(day);
    elements.cardsContainer.appendChild(createDayCard(day, state.controlSelection.dayIndex));
  }

  function createDayCard(day, dayIndex) {
    const dayDate = parseISO(day.dateISO);
    const summary = summarizeDay(day);
    const card = document.createElement('article');
    card.className = 'day-card';
    card.innerHTML = `
      <header class="day-card__header">
        <div>
          <h3 class="day-card__title">${formatShortDate(dayDate)}（${DAY_NAMES[dayDate.getDay()]}）</h3>
          <p class="day-card__meta">${summary.total ? 'スター ' + summary.done + ' / ' + summary.total : 'スター 0 / 0'}</p>
        </div>
        <span class="day-card__percent">${summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%</span>
      </header>
      <div class="day-card__body">
        <div class="kid-grid">
          ${kids.map(kid => createKidBlockHtml(day, dayIndex, kid)).join('')}
        </div>
      </div>
    `;
    
    // イベント委譲のため、後でバインド
    return card;
  }

  function createKidBlockHtml(day, dayIndex, kid) {
    const char = CHARACTERS[kid.characterId] || CHARACTERS.logico;
    const kidSlots = day.slots[kid.id] || [];
    
    let dailyMoney = 0;
    kidSlots.forEach(s => {
      if (s.taskId && s.status === 'done') {
        const t = taskMap.get(s.taskId);
        if (t) dailyMoney += (t.reward || 0);
      }
    });

    return `
      <section class="kid-block" style="--kid-color: ${kid.color}">
        <div class="kid-block__header">
          <div class="hero-identity">
            <div class="kid-avatar-hero"><img src="${char.img}" alt="${kid.name}"></div>
            <div class="hero-naming">
              <span class="hero-label">HERO</span>
              <h4 class="kid-name">${escapeHtml(kid.name)}</h4>
            </div>
          </div>
          <div class="hero-stats">
            <span class="kid-summary">今日のごほうび: <span class="reward-yen">¥${dailyMoney}</span></span>
          </div>
        </div>
        
        <div class="chore-list">
          ${kidSlots.map((slot, slotIndex) => {
            const task = slot.taskId ? taskMap.get(slot.taskId) : null;
            if (!task && !state.editMode) return '';
            
            let btnText = STATUS_LABELS[slot.status] || '未設定';
            let btnClass = slot.status === 'done' ? 'success' : 'secondary';
            let extraClass = '';
            
            if (slot.status === 'pending') {
              if (state.editMode) {
                btnText = '承認する';
                btnClass = 'warning';
                extraClass = 'is-pulse';
              } else {
                btnText = '確認中...';
                btnClass = 'secondary';
                extraClass = 'is-muted';
              }
            }
            
            return `
              <div class="slot" data-day-index="${dayIndex}" data-kid-id="${kid.id}" data-slot-index="${slotIndex}" data-status="${slot.status}">
                <div class="slot-content">
                  <span class="slot-title">${task ? (task.icon + ' ' + task.label) : '<span class="planner-empty">未設定</span>'}</span>
                  <span class="slot-reward">${task ? '¥' + task.reward : '-'}</span>
                </div>
                <button class="slot-status ${btnClass} ${extraClass}" data-action="cycle-status">
                  ${btnText}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  function updateSummary() {
    if (!state.weekData) return;
    const summary = summarizeWeek();
    const percent = summary.total ? Math.round((summary.done / summary.total) * 100) : 0;
    
    if (elements.starsEarned) elements.starsEarned.textContent = String(summary.done);
    if (elements.starsTarget) elements.starsTarget.textContent = String(summary.total);
    if (elements.progressPercent) elements.progressPercent.textContent = percent + '%';
    if (elements.headerProgress) elements.headerProgress.textContent = percent + '%';
    if (elements.progressBar) elements.progressBar.style.width = percent + '%';

    // 貯金箱の合計
    const totalBank = kids.reduce((sum, k) => sum + (k.bank || 0), 0);
    if (elements.totalBank) elements.totalBank.textContent = totalBank.toLocaleString();

    if (elements.kidBankStatus) {
      elements.kidBankStatus.innerHTML = kids.map(kid => {
        const char = CHARACTERS[kid.characterId] || CHARACTERS.logico;
        const progress = kid.goalAmount ? Math.min(100, Math.round((kid.bank / kid.goalAmount) * 100)) : 0;
        return `
          <div class="kid-bank-item" style="--kid-color: ${kid.color}">
            <div class="kid-bank-item__top">
              <div class="kid-bank-item__avatar"><img src="${char.img}" alt="${kid.name}"></div>
              <div class="kid-bank-item__info">
                <span class="kid-bank-item__name">${escapeHtml(kid.name)}</span>
                <span class="kid-bank-item__money">¥${(kid.bank || 0).toLocaleString()}</span>
              </div>
            </div>
            <div class="goal-gauge"><div class="goal-gauge__fill" style="width: ${progress}%"></div></div>
            <span class="goal-label">目標: ${escapeHtml(kid.goal)} (${progress}%)</span>
          </div>
          </div>
        `;
      }).join('');
    }
    
    // トランザクション履歴の描画
    const txList = document.getElementById('transactionList');
    if (txList) {
      if (state.weekData && state.weekData.transactions && state.weekData.transactions.length > 0) {
        txList.innerHTML = state.weekData.transactions.map(tx => {
          const date = new Date(tx.time);
          const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
          return `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--panel-soft); border-radius: var(--radius-lg); border: 1px solid var(--border);">
              <div>
                <span style="font-size: 0.75rem; color: var(--muted);">${timeStr}</span>
                <div style="font-weight: 600; font-size: 0.9rem; color: var(--text);">${escapeHtml(tx.kidName)}: ${escapeHtml(tx.taskName)}</div>
              </div>
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 1.1rem;">+¥${tx.amount}</div>
            </li>
          `;
        }).join('');
      } else {
        txList.innerHTML = '<li style="color: var(--muted); font-size: 0.85rem; padding: 12px; text-align: center;">まだきろくがありません</li>';
      }
    }

    // Chart.js の描画
    const chartCtx = document.getElementById('savingsChart');
    if (chartCtx && window.Chart) {
      const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
      const dailyTotals = Array(7).fill(0);
      
      if (state.weekData) {
        state.weekData.days.forEach(day => {
          const d = parseISO(day.dateISO);
          const dayOfWeek = d.getDay();
          let dailyYen = 0;
          Object.values(day.slots).forEach(slots => {
            slots.forEach(s => {
              if (s.taskId && s.status === 'done') {
                const t = taskMap.get(s.taskId);
                if (t) dailyYen += (t.reward || 0);
              }
            });
          });
          dailyTotals[dayOfWeek] = dailyYen;
        });
      }

      const isDayTheme = document.documentElement.getAttribute('data-theme') === 'day';
      const gridColor = isDayTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      const textColor = isDayTheme ? '#475569' : '#94a3b8';

      if (window.savingsChartInstance) {
        window.savingsChartInstance.data.datasets[0].data = dailyTotals;
        window.savingsChartInstance.options.scales.y.grid.color = gridColor;
        window.savingsChartInstance.options.scales.y.ticks.color = textColor;
        window.savingsChartInstance.options.scales.x.ticks.color = textColor;
        window.savingsChartInstance.update();
      } else {
        window.savingsChartInstance = new Chart(chartCtx, {
          type: 'bar',
          data: {
            labels: dayLabels,
            datasets: [{
              label: '獲得金額',
              data: dailyTotals,
              backgroundColor: '#3b82f6',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { 
                beginAtZero: true, 
                grid: { color: gridColor, drawBorder: false },
                ticks: { color: textColor }
              },
              x: { 
                grid: { display: false, drawBorder: false },
                ticks: { color: textColor }
              }
            }
          }
        });
      }
    }
  }

  function renderAdventureRoadmap() {
    if (!elements.adventureRoadmap) return;
    const summary = summarizeWeek();
    const totalProgress = summary.total ? (summary.done / summary.total) : 0;
    
    // イベントチェック
    checkLandmarkEvents(totalProgress);

    const getPos = (p) => {
      if (p <= 0) return { x: ADVENTURE_LANDMARKS[0].x, y: ADVENTURE_LANDMARKS[0].y };
      if (p >= 1) return { x: ADVENTURE_LANDMARKS[4].x, y: ADVENTURE_LANDMARKS[4].y };
      const segmentIdx = Math.floor(p * 4);
      const segmentProgress = (p * 4) % 1;
      const start = ADVENTURE_LANDMARKS[segmentIdx];
      const end = ADVENTURE_LANDMARKS[segmentIdx + 1];
      return {
        x: start.x + (end.x - start.x) * segmentProgress,
        y: start.y + (end.y - start.y) * segmentProgress
      };
    };

    let d = `M ${ADVENTURE_LANDMARKS[0].x} ${ADVENTURE_LANDMARKS[0].y} `;
    for (let i = 1; i < ADVENTURE_LANDMARKS.length; i++) {
      d += `L ${ADVENTURE_LANDMARKS[i].x} ${ADVENTURE_LANDMARKS[i].y} `;
    }

    let html = `
      <svg class="roadmap-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="roadmap-path-bg" d="${d}" fill="none" />
        <path class="roadmap-path-active" d="${d}" fill="none" style="stroke-dasharray: 1000; stroke-dashoffset: ${1000 - totalProgress * 1000}" />
      </svg>
    `;

    // ランドマーク（島）
    html += ADVENTURE_LANDMARKS.map(lm => {
      const isReached = totalProgress >= lm.progress;
      return `
        <div class="roadmap-island ${isReached ? 'is-reached' : ''}" style="top: ${lm.y}%; left: ${lm.x}%">
          <div class="roadmap-island__base">
            <span class="roadmap-island__icon">${lm.icon}</span>
            ${isReached ? '<div class="island-check">✅</div>' : ''}
          </div>
          <span class="roadmap-island__label">${lm.name}</span>
        </div>
      `;
    }).join('');

    // ヒーロー
    kids.forEach((kid, idx) => {
      const pos = getPos(totalProgress);
      // 複数ヒーローがいる場合の微調整
      const offset = (idx - (kids.length - 1) / 2) * 15;
      const char = CHARACTERS[kid.characterId] || CHARACTERS.kakeru;
      html += `
        <div class="roadmap-hero" style="left: calc(${pos.x}% + ${offset}px); top: ${pos.y}%; transform: translate(-50%, -50%); --kid-color: ${kid.color};">
          <img src="${char.img}" alt="${kid.name}">
          <div class="hero-name-tag" style="background: ${kid.color}">${kid.name}</div>
        </div>
      `;
    });

    elements.adventureRoadmap.innerHTML = html;
  }

  function checkLandmarkEvents(progress) {
    if (!state.weekData) return;
    if (state.weekData.lastSeenProgress === undefined) {
      state.weekData.lastSeenProgress = 0;
    }
    const lastSeen = state.weekData.lastSeenProgress;
    
    // 進行度が戻った場合（クエストのキャンセルなど）は更新だけして終了
    if (progress < lastSeen) {
      state.weekData.lastSeenProgress = progress;
      saveWeekData();
      return;
    }
    if (progress === lastSeen) return;

    const newLandmark = ADVENTURE_LANDMARKS.find(lm => progress >= lm.progress && lastSeen < lm.progress);
    if (newLandmark && newLandmark.progress > 0) {
      showEventModal(newLandmark);
      // ガチャチケット付与
      kids.forEach(kid => {
        kid.gachaTickets = (kid.gachaTickets || 0) + 1;
      });
      saveConfig();
      // 少し遅らせて再描画（モーダルアニメーションと被らないように）
      setTimeout(() => render(), 100); 
    }
    
    state.weekData.lastSeenProgress = progress;
    saveWeekData();
    // 旧バージョンのゴミデータを削除
    localStorage.removeItem('last_seen_progress');
  }

  function showEventModal(landmark) {
    if (!elements.eventModal || !elements.eventModalBody) return;
    
    elements.eventModalBody.innerHTML = `
      <div class="event-popup">
        <div class="event-icon-large">${landmark.icon}</div>
        <h2 class="event-title">${landmark.name} にとうちゃく！</h2>
        <div class="event-cloudon">
          <img src="characters/char_cloudon.png?v=13" alt="クラウドん先生">
          <div class="event-bubble">
            <p>${landmark.msg}</p>
          </div>
        </div>
        <button class="button primary" style="width:100%; margin-top:20px;" onclick="document.getElementById('eventModal').classList.remove('is-active')">ぼうけんをつづける！</button>
      </div>
    `;
    elements.eventModal.classList.add('is-active');
  }

  // ─── Data Management ───
  function loadConfig() {
    if (!storageAvailable) return;
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload.kids) {
        kids = normalizeKids(payload.kids);
        // ガチャデータの初期化担保
        kids.forEach(k => {
          k.gachaTickets = k.gachaTickets || 0;
          k.gachaItems = k.gachaItems || [];
        });
      }
      if (payload.tasks) tasks = normalizeTasks(payload.tasks);
      if (payload.slotsPerKid) {
        SLOTS_PER_KID = parseInt(payload.slotsPerKid) || 3;
        if (elements.settingSlotsPerKid) elements.settingSlotsPerKid.value = SLOTS_PER_KID;
      }
      if (payload.familyId) {
        state.familyId = payload.familyId;
        if (elements.syncFamilyId) elements.syncFamilyId.value = state.familyId;
        setTimeout(() => loadFromCloud(true), 500);
      }
    } catch (e) {
      console.warn('Config load failed', e);
    }
  }

  function saveConfig() {
    if (!storageAvailable) return;
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ kids, tasks, slotsPerKid: SLOTS_PER_KID, familyId: state.familyId }));
    if (state.familyId) saveToCloud();
  }

  function loadWeekData(weekKey, weekStart) {
    const baseline = createEmptyWeekData(weekStart);
    if (!storageAvailable) return baseline;
    const raw = localStorage.getItem(STORAGE_PREFIX + weekKey);
    if (!raw) return baseline;
    try {
      const payload = JSON.parse(raw);
      payload.days.forEach((storedDay, idx) => {
        if (!storedDay) return;
        const day = baseline.days[idx];
        kids.forEach(kid => {
          const storedSlots = storedDay.slots && storedDay.slots[kid.id] ? storedDay.slots[kid.id] : [];
          if (day.slots[kid.id]) {
            day.slots[kid.id] = day.slots[kid.id].map((slot, sIdx) => {
              const src = storedSlots[sIdx];
              if (!src) return slot;
              const taskId = src.taskId && validTaskIds.has(src.taskId) ? src.taskId : null;
              return { taskId, status: taskId ? (src.status || 'todo') : 'unset' };
            });
          }
        });
      });
      return baseline;
    } catch (e) {
      return baseline;
    }
  }

  function saveWeekData() {
    if (!storageAvailable || !state.weekData || !state.weekKey) return;
    localStorage.setItem(STORAGE_PREFIX + state.weekKey, JSON.stringify(state.weekData));
    if (state.familyId) saveToCloud();
  }

  // ─── Cloud Sync ───
  async function saveToCloud() {
    if (!state.familyId) return;
    try {
      const allData = {
        config: { kids, tasks, slotsPerKid: SLOTS_PER_KID },
        weekKey: state.weekKey,
        weekData: state.weekData
      };
      await fetch(`/api/sync/${state.familyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: allData })
      });
      updateSyncUI('online');
    } catch (e) {
      console.warn('Cloud save failed', e);
      updateSyncUI('error');
    }
  }

  async function loadFromCloud(isInitial = false) {
    if (!state.familyId) return;
    try {
      const res = await fetch(`/api/sync/${state.familyId}`);
      const result = await res.json();
      if (result.data) {
        const cloud = result.data;
        
        // 設定の同期
        if (cloud.config) {
          kids = normalizeKids(cloud.config.kids);
          tasks = normalizeTasks(cloud.config.tasks);
          SLOTS_PER_KID = cloud.config.slotsPerKid || 3;
        }

        // 週データの同期
        if (cloud.weekKey === state.weekKey && cloud.weekData) {
          state.weekData = cloud.weekData;
        }
        
        if (isInitial) {
          saveConfig();
          saveWeekData();
          render();
        } else {
          render();
        }
        updateSyncUI('online');
      }
    } catch (e) {
      console.warn('Cloud load failed', e);
      updateSyncUI('error');
    }
  }

  function updateSyncUI(status) {
    if (!elements.syncStatus) return;
    const dot = elements.syncStatus.querySelector('.status-dot');
    const text = elements.syncStatus.querySelector('.status-text');
    
    elements.syncStatus.classList.remove('is-online', 'is-error');
    
    if (status === 'online') {
      elements.syncStatus.classList.add('is-online');
      text.textContent = 'クラウド同期中';
    } else if (status === 'error') {
      elements.syncStatus.classList.add('is-error');
      text.textContent = '同期エラー';
    } else {
      text.textContent = 'オフラインモード';
    }
  }

  function createEmptyWeekData(weekStart) {
    return {
      days: Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + offset);
        const slots = {};
        kids.forEach(k => {
          slots[k.id] = Array.from({ length: SLOTS_PER_KID }, () => ({ taskId: null, status: 'unset' }));
        });
        return { dateISO: toISO(date), slots };
      })
    };
  }

  // ─── Event Bindings ───
  function bindEvents() {
    // タブ切り替え
    elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // 週変更
    document.querySelectorAll('[data-week-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.weekNav;
        if (mode === 'prev') goToWeek(state.weekOffset - 1);
        else if (mode === 'next') goToWeek(state.weekOffset + 1);
        else goToWeek(0);
      });
    });

    // 今日の画面：ステータス変更 or タスク変更
    if (elements.cardsContainer) {
      elements.cardsContainer.addEventListener('click', event => {
        const slotEl = event.target.closest('.slot');
        if (!slotEl) return;
        
        const dayIndex = parseInt(slotEl.dataset.dayIndex);
        const kidId = slotEl.dataset.kidId;
        const slotIndex = parseInt(slotEl.dataset.slotIndex);
        
        // ステータス変更
        if (event.target.dataset.action === 'cycle-status' || event.target.closest('.slot-status')) {
          cycleStatus(dayIndex, kidId, slotIndex);
          return;
        }

        // 編集モード中ならタスク選択を開く
        if (state.editMode) {
          openTaskPicker(taskId => {
            assignSlot(dayIndex, kidId, slotIndex, taskId);
            render();
          });
        }
      });
    }

    // 準備画面：ウィークリープランナーのセルクリック
    if (elements.weeklyPlanner) {
      elements.weeklyPlanner.addEventListener('click', e => {
        const target = e.target.closest('.planner-task') || e.target.closest('.planner-cell');
        if (!target) return;
        
        const dayIndex = parseInt(target.dataset.dayIndex);
        const kidId = target.dataset.kidId;
        const slotIndex = parseInt(target.dataset.slotIndex);
        
        openTaskPicker(taskId => {
          assignSlot(dayIndex, kidId, slotIndex, taskId);
          render();
        });
      });
    }

    // モーダルイベント
    if (elements.closeTaskPicker) {
      elements.closeTaskPicker.addEventListener('click', closeTaskPicker);
    }
    if (elements.taskPickerModal) {
      elements.taskPickerModal.addEventListener('click', e => {
        if (e.target === elements.taskPickerModal) closeTaskPicker();
      });
    }

    // 設定画面：追加ボタン
    if (elements.addKid) elements.addKid.addEventListener('click', () => addKid());
    if (elements.addTask) elements.addTask.addEventListener('click', () => addTask());

    // 設定画面：一括操作
    if (elements.controlAutoDistribute) {
      elements.controlAutoDistribute.addEventListener('click', () => {
        if (confirm('週全体のクエストをおまかせ配分で埋めますか？')) {
          autoDistributeWeek();
          render();
        }
      });
    }
    if (elements.controlClearWeek) {
      elements.controlClearWeek.addEventListener('click', () => {
        if (confirm('今週のすべての設定をリセットしますか？')) {
          state.weekData = createEmptyWeekData(state.weekStart);
          saveWeekData();
          render();
        }
      });
    }

    // 設定画面：マネージャー入力（委譲）
    if (elements.kidManager) {
       elements.kidManager.addEventListener('change', handleKidManagerChange);
       elements.kidManager.addEventListener('click', handleKidManagerClick);
    }
    if (elements.taskManager) {
       elements.taskManager.addEventListener('change', handleTaskManagerChange);
       elements.taskManager.addEventListener('click', handleTaskManagerClick);
    }

    // カレンダー：月移動
    document.querySelectorAll('[data-calendar-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.calendarNav;
        const newMonth = new Date(state.calendarMonth);
        if (mode === 'prev') newMonth.setMonth(newMonth.getMonth() - 1);
        else if (mode === 'next') newMonth.setMonth(newMonth.getMonth() + 1);
        state.calendarMonth = newMonth;
        renderCalendar();
      });
    });

    // カレンダー：日付クリック
    if (elements.calendarGrid) {
      elements.calendarGrid.addEventListener('click', e => {
        const cell = e.target.closest('.calendar-cell');
        if (!cell || !cell.dataset.date) return;
        const clickedDate = parseISO(cell.dataset.date);
        const dayIndex = (clickedDate.getDay() + 6) % 7;
        const pivot = new Date(clickedDate);
        goToWeekSpecific(pivot, dayIndex);
        switchTab('today');
      });
    }

    // 編集モードトグル
    if (elements.editToggle) elements.editToggle.addEventListener('click', toggleEditMode);
    
    if (elements.controlCollapse) elements.controlCollapse.addEventListener('click', () => {
      state.controlCollapsed = !state.controlCollapsed;
      updateControlPanelCollapse();
    });

    // バックアップ/PWA
    if (elements.exportData) elements.exportData.addEventListener('click', handleBackupExport);
    if (elements.importData) elements.importData.addEventListener('click', () => elements.importFile.click());
    if (elements.importFile) elements.importFile.addEventListener('change', handleBackupFileChange);
    
    // 全体設定
    if (elements.settingSlotsPerKid) {
      elements.settingSlotsPerKid.addEventListener('change', e => {
        const val = parseInt(e.target.value);
        if (val >= 1 && val <= 20) {
          SLOTS_PER_KID = val;
          saveConfig();
          render();
        }
      });
    }
    
    // ガチャ・図鑑
    const btnOpenCollection = document.getElementById('btnOpenCollection');
    if (btnOpenCollection) {
      btnOpenCollection.addEventListener('click', window.openCollectionModal);
    }
    
    // クラウド同期
    if (elements.btnStartSync) {
      elements.btnStartSync.addEventListener('click', () => {
        const fid = elements.syncFamilyId.value.trim();
        if (!fid) {
          alert('合言葉を入力してください');
          return;
        }
        state.familyId = fid;
        saveConfig();
        loadFromCloud(true);
        alert('同期を開始しました！他のデバイスでも同じ合言葉を入力してください。');
      });
    }
    
    if (elements.resetAll) elements.resetAll.addEventListener('click', () => {
      if (!confirm('週全体のすべてのステータス（できた！等）をリセットしますか？')) return;
      state.weekData.days.forEach(day => {
        Object.values(day.slots).forEach(slots => {
          slots.forEach(s => { if (s.taskId) s.status = 'todo'; });
        });
      });
      saveWeekData();
      render();
    });
  }

  // ─── Sound Effects ───
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  function playTone(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCoinSound() {
    playTone(987.77, 'sine', 0.1, 0.3); // B5
    setTimeout(() => playTone(1318.51, 'sine', 0.2, 0.3), 80); // E6
  }

  function playFanfare() {
    const vol = 0.3;
    playTone(523.25, 'square', 0.15, vol); // C5
    setTimeout(() => playTone(523.25, 'square', 0.15, vol), 150);
    setTimeout(() => playTone(523.25, 'square', 0.15, vol), 300);
    setTimeout(() => playTone(659.25, 'square', 0.4, vol), 450); // E5
  }

  // ─── Helpers ───
  function cycleStatus(dayIndex, kidId, slotIndex) {
    const slot = getSlot(dayIndex, kidId, slotIndex);
    if (!slot || !slot.taskId) return;
    const task = taskMap.get(slot.taskId);
    const kid = kids.find(k => k.id === kidId);
    if (!kid || !task) return;

    const prevStatus = slot.status;
    let nextStatus = prevStatus;

    if (state.editMode) {
      // 編集モード（親）: 自由に遷移可能。pending -> done で報酬加算
      const idx = STATUS_SEQUENCE.indexOf(prevStatus);
      nextStatus = STATUS_SEQUENCE[(idx + 1) % STATUS_SEQUENCE.length];
      
      // 報酬の計算
      if (nextStatus === 'done' && prevStatus !== 'done') {
        kid.bank += (task.reward || 0);
      } else if (prevStatus === 'done' && nextStatus !== 'done') {
        kid.bank = Math.max(0, kid.bank - (task.reward || 0));
      }
    } else {
      // 子供モード: todo -> pending のみに制限（または pending のまま）
      if (prevStatus === 'todo') {
        nextStatus = 'pending';
      } else if (prevStatus === 'pending') {
        // すでに確認中なら何もしない（または親の承認を待つメッセージ）
        return;
      } else if (prevStatus === 'done') {
        // すでに完了済みなら変更不可
        return;
      }
    }
    
    if (nextStatus !== prevStatus) {
      slot.status = nextStatus;
      if (nextStatus === 'done') {
        playCoinSound();
        
        // トランザクション記録
        if (!state.weekData.transactions) state.weekData.transactions = [];
        state.weekData.transactions.unshift({
          id: Date.now(),
          kidId: kid.id,
          kidName: kid.name,
          taskName: task ? task.label : 'クエスト',
          amount: task ? (task.reward || 0) : 0,
          time: new Date().toISOString()
        });
        if (state.weekData.transactions.length > 50) state.weekData.transactions.pop();
      }
      
      saveConfig();
      saveWeekData();
      
      // 100%達成チェック
      const day = state.weekData.days[dayIndex];
      const summary = summarizeDay(day);
      if (nextStatus === 'done' && summary.done === summary.total && summary.total > 0) {
        if (!day.celebrated) {
          day.celebrated = true;
          setTimeout(() => {
            playFanfare();
            if (window.confetti) {
              window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 3000 });
            }
          }, 300);
        }
      } else if (summary.done < summary.total) {
        day.celebrated = false;
      }
      
      render();
    }
  }

  function handleTaskChange(dayIndex, kidId, slotIndex, newTaskId) {
    const slot = getSlot(dayIndex, kidId, slotIndex);
    if (!slot) return;
    slot.taskId = validTaskIds.has(newTaskId) ? newTaskId : null;
    slot.status = slot.taskId ? 'todo' : 'unset';
    saveWeekData();
    render();
  }

  function handleControlAssign() {
    const { dayIndex, kidId, slotIndex } = state.controlSelection;
    const tId = elements.controlTask.value;
    if (assignSlot(dayIndex, kidId, slotIndex, tId || null)) {
      saveWeekData();
      render();
    }
  }

  function handleControlClearSlot() {
    const { dayIndex, kidId, slotIndex } = state.controlSelection;
    if (assignSlot(dayIndex, kidId, slotIndex, null)) {
      saveWeekData();
      render();
    }
  }

  function handleControlClearDay() {
    const { dayIndex } = state.controlSelection;
    if (!confirm('本日のすべてのヒーローのタスクをリセットしますか？')) return;
    kids.forEach(kid => {
      for (let i = 0; i < SLOTS_PER_KID; i++) {
        assignSlot(dayIndex, kid.id, i, null);
      }
    });
    saveWeekData();
    render();
  }

  function handleControlCopyPrev() {
    const { dayIndex } = state.controlSelection;
    if (dayIndex === 0) return alert('週の初日はコピーできません');
    const prevDay = state.weekData.days[dayIndex - 1];
    const currDay = state.weekData.days[dayIndex];
    
    kids.forEach(kid => {
      const prevSlots = prevDay.slots[kid.id];
      currDay.slots[kid.id] = prevSlots.map(s => ({ taskId: s.taskId, status: s.taskId ? 'todo' : 'unset' }));
    });
    saveWeekData();
    render();
  }

  function handleControlAutoFill() {
    const { dayIndex } = state.controlSelection;
    const day = state.weekData.days[dayIndex];
    if (!tasks.length) return;
    
    kids.forEach((kid, kIdx) => {
      for (let sIdx = 0; sIdx < SLOTS_PER_KID; sIdx++) {
        // 適当に分散させるロジック
        const tIdx = (dayIndex + kIdx + sIdx) % tasks.length;
        assignSlot(dayIndex, kid.id, sIdx, tasks[tIdx].id);
      }
    });
    saveWeekData();
    render();
  }

  function handleControlAutoDistribute() {
    if (!confirm('1週間のタスクを自動でバランスよく配分しますか？')) return;
    autoDistributeWeek();
    saveWeekData();
    render();
  }

  function autoDistributeWeek() {
    if (!state.weekData || !tasks.length) return;
    const countMap = new Map();
    tasks.forEach(t => countMap.set(t.id, 0));

    state.weekData.days.forEach((day, dIdx) => {
      kids.forEach((kid, kIdx) => {
        const usedToday = new Set();
        for (let sIdx = 0; sIdx < SLOTS_PER_KID; sIdx++) {
          const offset = (dIdx + kIdx + sIdx) % tasks.length;
          // 最も使われていないタスクを探す
          const sortedTasks = [...tasks].sort((a, b) => {
            const diff = countMap.get(a.id) - countMap.get(b.id);
            if (diff !== 0) return diff;
            return tasks.indexOf(a) - tasks.indexOf(b);
          });
          
          let selected = sortedTasks.find(t => !usedToday.has(t.id)) || sortedTasks[0];
          day.slots[kid.id][sIdx] = { taskId: selected.id, status: 'todo' };
          countMap.set(selected.id, countMap.get(selected.id) + 1);
          usedToday.add(selected.id);
        }
      });
    });
  }

  function handleKidManagerChange(e) {
    const field = e.target.dataset.kidField;
    const kidId = e.target.closest('[data-kid-id]').dataset.kidId;
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;
    if (field === 'goalAmount') kid[field] = parseInt(e.target.value) || 0;
    else kid[field] = e.target.value;
    saveConfig();
    render();
  }

  function handleKidManagerClick(e) {
    if (e.target.dataset.action === 'remove-kid') {
      const kidId = e.target.closest('[data-kid-id]').dataset.kidId;
      if (kids.length <= 1) return alert('最低1人は必要です');
      if (!confirm('削除しますか？')) return;
      kids = kids.filter(k => k.id !== kidId);
      saveConfig();
      render();
    }
  }

  function handleTaskManagerChange(e) {
    const field = e.target.dataset.taskField;
    const taskId = e.target.closest('[data-task-id]').dataset.taskId;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (field === 'reward') task[field] = parseInt(e.target.value) || 0;
    else task[field] = e.target.value;
    refreshTaskLookup();
    saveConfig();
    render();
  }

  function handleTaskManagerClick(e) {
    if (e.target.dataset.action === 'remove-task') {
      const taskId = e.target.closest('[data-task-id]').dataset.taskId;
      if (tasks.length <= 1) return alert('最低1つは必要です');
      if (!confirm('削除しますか？')) return;
      tasks = tasks.filter(t => t.id !== taskId);
      refreshTaskLookup();
      saveConfig();
      render();
    }
  }

  function addKid() {
    const newKid = {
      id: generateId('kid'),
      name: `ヒーロー${kids.length + 1}`,
      color: DEFAULT_KID_COLORS[kids.length % DEFAULT_KID_COLORS.length],
      bank: 0,
      goal: '目標',
      goalAmount: 1000,
      characterId: 'kakeru'
    };
    kids.push(newKid);
    saveConfig();
    render();
  }

  function addTask() {
    const newTask = {
      id: generateId('task'),
      label: `新しいクエスト${tasks.length + 1}`,
      icon: '⭐',
      reward: 20
    };
    tasks.push(newTask);
    refreshTaskLookup();
    saveConfig();
    render();
  }

  // ─── Gacha & Collection ───
  function renderGachaArea() {
    const area = document.getElementById('gachaArea');
    if (!area) return;
    
    area.innerHTML = kids.map(kid => {
      const tickets = kid.gachaTickets || 0;
      const char = CHARACTERS[kid.characterId] || CHARACTERS.kakeru;
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--panel-soft); padding: 12px 16px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${char.img}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${kid.color};">
            <div>
              <div style="font-weight: 800; color: var(--text);">${escapeHtml(kid.name)}</div>
              <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">🎫 チケット: ${tickets}枚</div>
            </div>
          </div>
          <button class="button primary" onclick="window.drawGacha('${kid.id}')" ${tickets <= 0 ? 'disabled' : ''}>ガチャを引く！</button>
        </div>
      `;
    }).join('');
  }

  window.drawGacha = function(kidId) {
    const kid = kids.find(k => k.id === kidId);
    if (!kid || !kid.gachaTickets || kid.gachaTickets <= 0) return;
    
    kid.gachaTickets -= 1;
    saveConfig();
    
    const rand = Math.random();
    let rarity = 'normal';
    if (rand > 0.9) rarity = 'epic';
    else if (rand > 0.6) rarity = 'rare';
    
    const candidates = GACHA_ITEMS.filter(i => i.rarity === rarity);
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    
    kid.gachaItems = kid.gachaItems || [];
    kid.gachaItems.push(item.id);
    saveConfig();
    render();
    
    showGachaAnimation(item);
  };

  function showGachaAnimation(item) {
    const modal = document.getElementById('gachaModal');
    const chest = document.getElementById('gachaChest');
    const result = document.getElementById('gachaResult');
    if(!modal || !chest || !result) return;
    
    modal.classList.add('is-active');
    chest.style.display = 'block';
    result.style.display = 'none';
    
    chest.classList.add('shake');
    
    setTimeout(() => {
      chest.classList.remove('shake');
      chest.style.display = 'none';
      result.style.display = 'block';
      
      document.getElementById('gachaResultIcon').textContent = item.icon;
      document.getElementById('gachaResultName').textContent = item.name;
      document.getElementById('gachaResultDesc').textContent = item.desc;
      
      playFanfare();
      if (window.confetti) {
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 3000 });
      }
    }, 1500);
  }

  window.openCollectionModal = function() {
    const modal = document.getElementById('collectionModal');
    if(!modal) return;
    modal.classList.add('is-active');
    if (kids.length > 0) {
      window.renderCollectionTab(kids[0].id);
    }
  };

  window.renderCollectionTab = function(kidId) {
    const tabsArea = document.getElementById('collectionTabs');
    const gridArea = document.getElementById('collectionGrid');
    if (!tabsArea || !gridArea) return;
    
    tabsArea.innerHTML = kids.map(k => `
      <button class="button ${k.id === kidId ? 'primary' : 'secondary'} small" onclick="window.renderCollectionTab('${k.id}')">
        ${escapeHtml(k.name)}
      </button>
    `).join('');
    
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;
    
    gridArea.innerHTML = GACHA_ITEMS.map(item => {
      const hasItem = (kid.gachaItems || []).includes(item.id);
      return `
        <div class="collection-item ${hasItem ? '' : 'is-empty'}">
          <span class="icon">${hasItem ? item.icon : '❓'}</span>
          <span class="name">${hasItem ? item.name : '???'}</span>
        </div>
      `;
    }).join('');
  };

  // ─── Utils & Domestic Helpers ───
  function refreshTaskLookup() {
    taskMap = new Map(tasks.map(t => [t.id, t]));
    validTaskIds = new Set(tasks.map(t => t.id));
  }

  function normalizeKids(list) {
    return list.map((k, i) => ({
      id: k.id || generateId('kid'),
      name: k.name || `ヒーロー${i+1}`,
      color: k.color || DEFAULT_KID_COLORS[i % DEFAULT_KID_COLORS.length],
      bank: k.bank || 0,
      goal: k.goal || '目標',
      goalAmount: k.goalAmount || 1000,
      characterId: k.characterId || 'kakeru'
    }));
  }

  function normalizeTasks(list) {
    return list.map((t, i) => ({
      id: t.id || generateId('task'),
      label: t.label || `クエスト${i+1}`,
      icon: t.icon || '⭐',
      reward: t.reward || 20
    }));
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function startOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  }

  function startOfMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatShortDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function formatJapaneseDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${DAY_NAMES[date.getDay()]}）`;
  }

  function buildWeekKey(date) {
    return toISO(date);
  }

  function generateId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getSlot(dIdx, kId, sIdx) {
    if (!state.weekData) return null;
    const day = state.weekData.days[dIdx];
    if (!day || !day.slots[kId]) return null;
    return day.slots[kId][sIdx];
  }

  function assignSlot(dIdx, kId, sIdx, tId) {
    const slot = getSlot(dIdx, kId, sIdx);
    if (!slot) return false;
    slot.taskId = tId;
    slot.status = tId ? 'todo' : 'unset';
    return true;
  }

  function summarizeDay(day) {
    let done = 0, total = 0;
    Object.values(day.slots).forEach(slots => {
      slots.forEach(s => {
        if (s.taskId) {
          total++;
          if (s.status === 'done') done++;
        }
      });
    });
    return { done, total };
  }

  function summarizeWeek() {
    let done = 0, total = 0;
    state.weekData.days.forEach(d => {
      const s = summarizeDay(d);
      done += s.done;
      total += s.total;
    });
    return { done, total };
  }

  function syncWeekDataWithKids() {
    let changed = false;
    if (!state.weekData) return false;

    state.weekData.days.forEach(day => {
      kids.forEach(kid => {
        if (!day.slots[kid.id]) {
          day.slots[kid.id] = Array.from({ length: SLOTS_PER_KID }, () => ({ taskId: null, status: 'unset' }));
          changed = true;
        } else if (day.slots[kid.id].length !== SLOTS_PER_KID) {
          // スロット数が変更された場合
          const currentSlots = day.slots[kid.id];
          if (currentSlots.length < SLOTS_PER_KID) {
            // 足りない分を追加
            const diff = SLOTS_PER_KID - currentSlots.length;
            for (let i = 0; i < diff; i++) {
              currentSlots.push({ taskId: null, status: 'unset' });
            }
          } else {
            // 多い分を削除（データ保護のため、設定済みのタスクがない末尾から削るのが理想だが、シンプルに slice）
            day.slots[kid.id] = currentSlots.slice(0, SLOTS_PER_KID);
          }
          changed = true;
        }
      });
    });
    return changed;
  }

  function cleanupSlotsForMissingTasks() {
    let changed = false;
    state.weekData.days.forEach(day => {
      Object.keys(day.slots).forEach(kId => {
        day.slots[kId].forEach(s => {
          if (s.taskId && !validTaskIds.has(s.taskId)) {
            s.taskId = null;
            s.status = 'unset';
            changed = true;
          }
        });
      });
    });
    return changed;
  }

  function ensureControlSelectionValid() {
    if (!kids.some(k => k.id === state.controlSelection.kidId)) {
      state.controlSelection.kidId = kids[0] ? kids[0].id : '';
    }
  }

  // ─── UI Updates ───
  function updateBoardHeading(day) {
    const date = parseISO(day.dateISO);
    if (elements.boardSubtitle) elements.boardSubtitle.textContent = `${formatJapaneseDate(date)} のクエスト`;
  }

  function updateSpecialContent(day) {
    if (!elements.specialMessage) return;
    const summary = summarizeDay(day);
    
    // 全員の合計ごほうびを計算
    let totalYen = 0;
    Object.values(day.slots).forEach(slots => {
      slots.forEach(s => {
        if (s.taskId && s.status === 'done') {
          const task = taskMap.get(s.taskId);
          if (task) totalYen += (task.reward || 0);
        }
      });
    });

    if (elements.todayTotalReward) {
      elements.todayTotalReward.textContent = `¥${totalYen.toLocaleString()}`;
    }

    if (elements.todayDone) elements.todayDone.textContent = summary.done;
    if (elements.todayRemaining) elements.todayRemaining.textContent = summary.total - summary.done;

    const dayProgress = summary.total ? (summary.done / summary.total) : 0;
    if (elements.headerProgress) {
      elements.headerProgress.textContent = `${Math.round(dayProgress * 100)}%`;
    }

    let msg = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
    
    if (dayProgress === 1 && summary.total > 0) {
      msg += ' オールクリア！完璧な冒険だったね！';
    } else if (dayProgress > 0.5) {
      msg += ' あと少し！応援しているよ。';
    } else {
      msg += ' 今日も一歩ずつ進もう！';
    }
    
    elements.specialMessage.textContent = msg;
  }

  function activateEditMode() {
    state.editMode = true;
    updateEditState();
    render();
  }

  function deactivateEditMode() {
    state.editMode = false;
    updateEditState();
    render();
  }

  function toggleEditMode() {
    state.editMode = !state.editMode;
    updateEditState();
    render();
  }

  function updateEditState() {
    document.body.classList.toggle('is-edit', state.editMode);
    
    // editStateLabel は index.html から削除したため処理不要
    
    if (elements.editToggle) {
      elements.editToggle.innerHTML = state.editMode ? '🔒 おとなモードを終わる' : '👨‍👩‍👧 おとなモード（承認）にする';
      
      if (state.editMode) {
        elements.editToggle.className = 'button primary';
        elements.editToggle.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
        elements.editToggle.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
        elements.editToggle.style.borderColor = 'transparent';
      } else {
        elements.editToggle.className = 'button secondary';
        elements.editToggle.style.background = '';
        elements.editToggle.style.boxShadow = '';
        elements.editToggle.style.borderColor = 'rgba(255,255,255,0.2)';
      }
    }
  }

  function renderControlPanel() {
    if (!elements.controlPanel) return;
    
    // 日付 options
    if (elements.controlDay && state.weekData) {
      elements.controlDay.innerHTML = state.weekData.days.map((d, i) => {
        const date = parseISO(d.dateISO);
        return `<option value="${i}" ${i === state.controlSelection.dayIndex ? 'selected' : ''}>${formatShortDate(date)}（${DAY_NAMES[date.getDay()]}）</option>`;
      }).join('');
    }

    // ヒーロー options
    if (elements.controlKid) {
      elements.controlKid.innerHTML = kids.map(k => `<option value="${k.id}" ${k.id === state.controlSelection.kidId ? 'selected' : ''}>${escapeHtml(k.name)}</option>`).join('');
    }

    // スロット options
    if (elements.controlSlot) {
      let lotHtml = '';
      for (let i = 0; i < SLOTS_PER_KID; i++) {
        lotHtml += `<option value="${i}" ${i === state.controlSelection.slotIndex ? 'selected' : ''}>SLOT ${('0' + (i + 1)).slice(-2)}</option>`;
      }
      elements.controlSlot.innerHTML = lotHtml;
    }

    // タスク options
    if (elements.controlTask) {
      elements.controlTask.innerHTML = '<option value="">タスクを選択</option>' + tasks.map(t => `<option value="${t.id}" ${t.id === state.controlSelection.taskId ? 'selected' : ''}>${t.icon || '⭐'} ${escapeHtml(t.label)}</option>`).join('');
    }

    // 現在の状態表示
    if (elements.controlCurrentStatus) {
      const { dayIndex, kidId, slotIndex } = state.controlSelection;
      const kid = kids.find(k => k.id === kidId);
      const slot = getSlot(dayIndex, kidId, slotIndex);
      const task = slot && slot.taskId ? taskMap.get(slot.taskId) : null;
      elements.controlCurrentStatus.innerHTML = `
        <p><strong>${kid ? escapeHtml(kid.name) : '---'}</strong> の <strong>SLOT ${('0' + (slotIndex + 1)).slice(-2)}</strong></p>
        <p>現状: ${task ? (task.icon + ' ' + task.label) : '未設定'}</p>
      `;
    }
  }

  function renderKidManager() {
    if (!elements.kidManager) return;
    elements.kidManager.innerHTML = kids.map(kid => `
      <li class="manager-item" data-kid-id="${kid.id}">
        <div class="manager-item__row">
          <div class="manager-field">
            <label>なまえ</label>
            <input type="text" value="${escapeHtml(kid.name)}" data-kid-field="name" class="manager-input">
          </div>
          <div class="manager-field">
            <label>キャラ</label>
            <select data-kid-field="characterId" class="manager-select">
              ${Object.entries(CHARACTERS).map(([id, c]) => `<option value="${id}" ${id === kid.characterId ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="manager-item__row">
          <div class="manager-field">
            <label>めあて</label>
            <input type="text" value="${escapeHtml(kid.goal)}" data-kid-field="goal" class="manager-input">
          </div>
          <div class="manager-field">
            <label>目標(円)</label>
            <input type="number" value="${kid.goalAmount}" data-kid-field="goalAmount" class="manager-input">
          </div>
        </div>
        <div class="manager-item__footer">
          <input type="color" value="${kid.color || '#3b82f6'}" data-kid-field="color" class="manager-color">
          <button type="button" class="button danger small" data-action="remove-kid">削除</button>
        </div>
      </li>
    `).join('');
  }

  function renderTaskManager() {
    if (!elements.taskManager) return;
    elements.taskManager.innerHTML = tasks.map(task => `
      <li class="manager-item" data-task-id="${task.id}">
        <div class="manager-item__row">
          <div class="manager-field manager-field--icon">
            <label>絵文字</label>
            <select data-task-field="icon" class="manager-select center">
              ${QUEST_EMOJIS.map(emoji => `
                <option value="${emoji}" ${task.icon === emoji ? 'selected' : ''}>${emoji}</option>
              `).join('')}
              ${!QUEST_EMOJIS.includes(task.icon) && task.icon ? `<option value="${escapeHtml(task.icon)}" selected>${escapeHtml(task.icon)}</option>` : ''}
            </select>
          </div>
          <div class="manager-field flex-1">
            <label>クエスト名</label>
            <input type="text" value="${escapeHtml(task.label)}" data-task-field="label" class="manager-input">
          </div>
          <div class="manager-field">
            <label>報酬(円)</label>
            <input type="number" value="${task.reward}" data-task-field="reward" class="manager-input">
          </div>
          <div class="manager-field no-label">
            <button type="button" class="button danger small" data-action="remove-task">削除</button>
          </div>
        </div>
      </li>
    `).join('');
  }

  function updateControlPanelCollapse() {
    if (elements.controlPanelBody) elements.controlPanelBody.style.display = state.controlCollapsed ? 'none' : 'grid';
    if (elements.controlCollapse) elements.controlCollapse.textContent = state.controlCollapsed ? '▼ パネルを開く' : '▲ パネルを閉じる';
  }

  function renderCalendar() {
    if (!elements.calendarGrid) return;
    const month = state.calendarMonth;
    if (elements.calendarLabel) elements.calendarLabel.textContent = `${month.getFullYear()}年${month.getMonth() + 1}月`;
    
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - end.getDay()));
    
    let html = '';
    const temp = new Date(start);
    while (temp <= end) {
      const iso = toISO(temp);
      const isToday = iso === toISO(new Date());
      const isCurrentMonth = temp.getMonth() === month.getMonth();
      
      const weekStartForDay = startOfWeek(temp);
      const weekKeyForDay = buildWeekKey(weekStartForDay);
      const weekDataForDay = (weekKeyForDay === state.weekKey) ? state.weekData : loadWeekData(weekKeyForDay, weekStartForDay);
      const dayData = weekDataForDay.days.find(d => d.dateISO === iso);
      const summary = dayData ? summarizeDay(dayData) : { done: 0, total: 0 };
      
      let starsHtml = '';
      if (summary.total > 0) {
        const starCount = Math.ceil((summary.done / summary.total) * 3); // 最大3つ
        for(let i=0; i<starCount; i++) starsHtml += '<span class="calendar-star">⭐</span>';
      }

      html += `
        <div class="calendar-cell ${!isCurrentMonth ? 'calendar-cell--muted' : ''} ${isToday ? 'calendar-cell--today' : ''}" data-date="${iso}">
          <span class="calendar-cell__date">${temp.getDate()}</span>
          <div class="calendar-star-grid">${starsHtml}</div>
        </div>
      `;
      temp.setDate(temp.getDate() + 1);
    }
    elements.calendarGrid.innerHTML = html;
  }

  function renderWeeklyPlanner() {
    if (!elements.weeklyPlanner || !state.weekData) return;
    
    const days = state.weekData.days;
    let html = `
      <table class="planner-table">
        <thead>
          <tr>
            <th class="kid-col">ヒーロー</th>
            ${days.map(d => {
              const date = parseISO(d.dateISO);
              return `<th>${date.getDate()}(${DAY_NAMES[date.getDay()]})</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    kids.forEach(kid => {
      html += `<tr><td class="kid-col">${escapeHtml(kid.name)}</td>`;
      days.forEach((day, dayIndex) => {
        const slots = day.slots[kid.id] || [];
        html += `
          <td class="planner-cell" data-day-index="${dayIndex}" data-kid-id="${kid.id}" data-slot-index="0">
            <div class="planner-task-list">
              ${slots.map((s, sIdx) => {
                const task = s.taskId ? taskMap.get(s.taskId) : null;
                return `
                  <div class="planner-task" data-day-index="${dayIndex}" data-kid-id="${kid.id}" data-slot-index="${sIdx}">
                    ${task ? `<span class="icon">${task.icon}</span><span class="label">${task.label}</span>` : '<span class="planner-empty">未設定</span>'}
                  </div>
                `;
              }).join('<hr style="opacity:0.1; margin:4px 0">')}
            </div>
          </td>
        `;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    elements.weeklyPlanner.innerHTML = html;
  }

  function openTaskPicker(callback) {
    if (!elements.taskPickerModal || !elements.taskPickerGrid) return;
    
    elements.taskPickerGrid.innerHTML = `
      <div class="task-option" data-task-id="">
        <span class="icon">❌</span>
        <span class="label">未設定に戻す</span>
      </div>
    ` + tasks.map(t => `
      <div class="task-option" data-task-id="${t.id}">
        <span class="icon">${t.icon || '⭐'}</span>
        <span class="label">${escapeHtml(t.label)}</span>
      </div>
    `).join('');

    elements.taskPickerModal.classList.add('is-active');

    const handlePick = e => {
      const option = e.target.closest('.task-option');
      if (!option) return;
      const taskId = option.dataset.taskId || null;
      callback(taskId);
      closeTaskPicker();
    };

    elements.taskPickerGrid.onclick = handlePick;
    state._modalCallback = handlePick; // 後で解除するため
  }

  function closeTaskPicker() {
    elements.taskPickerModal.classList.remove('is-active');
    elements.taskPickerGrid.onclick = null;
  }

  function renderTaskLibrary() {
    if (!elements.taskLibrary) return;
    elements.taskLibrary.innerHTML = tasks.map(t => `
      <button type="button" class="task-pill" data-task-id="${t.id}">
        <span class="task-pill__icon">${t.icon || '⭐'}</span>
        <span>${escapeHtml(t.label)}</span>
      </button>
    `).join('');
  }

  function updateFooterControls() {
    if (elements.footerNote) {
      elements.footerNote.textContent = state.isStandalone 
        ? 'アプリとして起動中☁️ オフラインでも一部機能が使えます。'
        : 'ブラウザで表示中。右上のメニューから「ホーム画面に追加」ができるよ！';
    }
  }

  function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (elements.installApp) elements.installApp.hidden = false;
    });

    if (elements.installApp) {
      elements.installApp.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          elements.installApp.hidden = true;
        }
        deferredInstallPrompt = null;
      });
    }
  }

  function handleBackupExport() {
    const backup = {
      id: BACKUP_ID,
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      config: { kids, tasks },
      weeks: {}
    };

    // localStorageから全週データを取得
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          backup.weeks[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudon-money-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleBackupFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        if (backup.id !== BACKUP_ID) throw new Error('Invalid backup file');

        if (!confirm('データを復元しますか？現在のデータは上書きされます。')) return;

        // 設定の復元
        if (backup.config) {
          kids = normalizeKids(backup.config.kids || []);
          tasks = normalizeTasks(backup.config.tasks || []);
          saveConfig();
        }

        // 週データの復元
        if (backup.weeks) {
          Object.entries(backup.weeks).forEach(([key, data]) => {
            localStorage.setItem(key, JSON.stringify(data));
          });
        }

        alert('復元が完了しました。ページを再読み込みします。');
        window.location.reload();
      } catch (err) {
        alert('復元に失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // 定期的な同期（30秒おき）
  setInterval(() => {
    if (state.familyId && !state.editMode) {
      loadFromCloud();
    }
  }, 30000);

  // ─── Boot ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
