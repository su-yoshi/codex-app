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
    todo: 'できたら報告',
    pending: '確認待ち',
    done: 'できた！'
  };

  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const DEFAULT_KID_COLORS = ['#8363ff', '#22c1e5', '#ff6b6b', '#ffd93d', '#6bcb77'];

  const CHARACTERS = {
    cloudon: { name: 'クラウドん', img: 'characters/ip_cloudon.png?v=1', quotes: { none: 'いっしょにお金の勉強をしよう！', start: '今日もお手伝いがんばろう☁️', mid: 'その調子！応援しているよ☁️', done: 'コンプリート！すごいね☁️✨' } },
    kakeru: { name: 'カケル', img: 'characters/ip_kakeru.png?v=1', quotes: { none: '今日のお手伝いを見てみよう。', start: '上から順番にやってみよう。', mid: 'あと少し。いいペースだよ。', done: '今日のお手伝い、全部できたね。' } },
    logico: { name: 'ロジコ', img: 'characters/ip_logico.png?v=1', quotes: { none: '計画的に進めるのがコツだよ。', start: 'まずは今日の予定を確認しよう。', mid: '半分クリア。順調だね。', done: '素晴らしい。完璧な仕事だよ。' } },
    kirara: { name: 'キララ', img: 'characters/ip_kirara.png?v=1', quotes: { none: 'キラキラな毎日にしよう♪', start: '今日もハッピーにお手伝♪', mid: 'がんばり屋さんなキミが好き！', done: 'キラキラ！全部達成だね♪' } }
  };
  const FAMILY_IMAGE_SRC = 'characters/ip_family.jpg?v=1';

  const REWARD_TIERS = [
    { points: 0, title: 'はじめての目標', reward: 'まずはお手伝いを10個やってみよう！', hint: '家族で最初のごほうびを相談してね' },
    { points: 50, title: '見習い商人', reward: 'お菓子1個ランクアップ！', hint: '好きなアイスが選べるかも？' },
    { points: 150, title: 'お金の達人', reward: '特別な週末のお出かけ', hint: '行きたい場所をリクエストしよう！' }
  ];

  const CELEBRATION_EMOJIS = ['✨', '🌟', '💎', '🎨', '🚀', '🌈', '🍭', '🍕'];
  const REWARD_IDEAS = [
    '「{starsDone}個もお手伝いできたね！ごほうびまであと{remaining}個だよ！」',
    '「わぁ！{emoji} 今日の頑張りは、パパもママも見てるよ！」',
    '「貯金箱にチャリン！とお金が貯まる音が聞こえるね♪」'
  ];
  const FAMILY_CHALLENGES = [
    '「目標のアイテムをゲットしたら、何から使うか決めてる？{emoji}」',
    '「こつこつ貯めるのは、魔法の力（複利）を味方につける第一歩だよ！」',
    '「お手伝いはお金だけじゃない、ありがとうの気持ちも貯まってるよ！」'
  ];

  const ADVENTURE_LANDMARKS = [
    { id: 'start', name: '作戦スタート', progress: 0, msg: 'ほしいものに向けて、今日のお手伝いから始めよう。', icon: '🏁', x: 30, y: 88 },
    { id: 'quarter', name: '25%達成', progress: 0.25, msg: '目標に少し近づきました。こつこつ貯める力が育っています。', icon: '✨', x: 75, y: 85 },
    { id: 'half', name: '半分達成', progress: 0.5, msg: '半分まで来ました。あと少しずつ続ければ届きます。', icon: '🌟', x: 70, y: 55 },
    { id: 'almost', name: 'もうすぐ', progress: 0.75, msg: '目標が見えてきました。次のお手伝いでまた近づけます。', icon: '🎯', x: 25, y: 45 },
    { id: 'complete', name: '目標達成', progress: 1.0, msg: 'おめでとう。貯めて選ぶ力がつきました。次の目標も相談しよう。', icon: '🎉', x: 50, y: 15 }
  ];

  // ガチャ景品マスターデータ (男女ともに楽しめるラインナップ)
  const GACHA_ITEMS = [
    { id: 'g001', name: '近道カード', rarity: 'normal', icon: '🛤️', effect: 'shortcut', desc: '作戦ボードの進む演出が少し大きくなるカード。お金は増えません。' },
    { id: 'g002', name: '応援ベル', rarity: 'normal', icon: '🔔', effect: 'cheer', desc: 'おうちの人から応援されている気持ちになれるカード。' },
    { id: 'g003', name: 'もう1こチャレンジ', rarity: 'normal', icon: '➕', effect: 'extra-mission', desc: '今日もう1つできそうなお手伝いを探すきっかけカード。' },
    { id: 'g004', name: '作戦メモ', rarity: 'normal', icon: '📝', effect: 'cheer', desc: 'ほしいもののために、次に何をするか考えるカード。' },
    { id: 'g005', name: 'ラッキーマス', rarity: 'normal', icon: '✨', effect: 'board-event', desc: '次に承認された時、作戦ボードを少し楽しく見るカード。' },
    { id: 'g006', name: 'ありがとうカード', rarity: 'normal', icon: '💌', effect: 'cheer', desc: 'お手伝いで家族が助かったことを思い出すカード。' },

    { id: 'g007', name: '家族ミッション', rarity: 'rare', icon: '👨‍👩‍👧‍👦', effect: 'family-mission', desc: '家族みんなであと3つお手伝いを目指すカード。' },
    { id: 'g008', name: '連続チャレンジ', rarity: 'rare', icon: '🔥', effect: 'extra-mission', desc: '明日も続けてお手伝いしたくなるカード。' },
    { id: 'g009', name: '応援メッセージ', rarity: 'rare', icon: '📣', effect: 'cheer', desc: '作戦ボードに前向きなメッセージが残るカード。' },
    { id: 'g010', name: '作戦会議カード', rarity: 'rare', icon: '🗣️', effect: 'family-mission', desc: '家族で次のごほうびや目標を話すカード。' },
    { id: 'g011', name: '寄り道イベント', rarity: 'rare', icon: '🎲', effect: 'board-event', desc: '少し寄り道気分で、作戦ボードに小さなイベントが出るカード。' },

    { id: 'g012', name: 'スーパー近道', rarity: 'epic', icon: '🚀', effect: 'shortcut', desc: '作戦ボードの演出が一番大きくなるレアカード。お金は増えません。' },
    { id: 'g013', name: '家族スペシャルミッション', rarity: 'epic', icon: '🏆', effect: 'family-mission', desc: '家族で今週の大きな目標を決める特別カード。' },
    { id: 'g014', name: '親子作戦会議', rarity: 'epic', icon: '🌟', effect: 'cheer', desc: 'ほしいものと貯め方を親子で話す特別カード。' },
    { id: 'g015', name: '次の目標ひらめき', rarity: 'epic', icon: '💡', effect: 'board-event', desc: '目標達成後の次のほしいものを考えるカード。' }
  ];

  const DEFAULT_REWARD_SETTINGS = {
    gachaEnabled: true,
    ticketCondition: 'daily-complete',
    ticketEvery: 3,
    rewardTitle: '今週のごほうび',
    rewardBody: '家族で決めたごほうびを目指して、お手伝いを続けよう。',
    familyMission: {
      enabled: true,
      title: '今週のファミリーミッション',
      reward: '週末に家族で好きな時間を作る',
      conditionType: 'done-count',
      target: 20
    },
    rewardShopItems: [
      { id: 'reward-snack', name: '好きなおやつ', type: 'money', cost: 100, enabled: true },
      { id: 'reward-gacha', name: 'ガチャ1回', type: 'money', cost: 300, enabled: true },
      { id: 'reward-family-game', name: '家族ゲーム時間', type: 'ticket', cost: 3, enabled: true }
    ]
  };

  const GOAL_EVENT_VISIBLE_MS = 12000;

  // ─── Application State ───
  let kids = [
    { id: 'kid-kakeru', name: 'カケル', color: '#3b82f6', bank: 0, goal: 'おもちゃ', goalAmount: 1000, goalImageDataUrl: '', goalHistory: [], lastGoalEvent: null, itemEvents: [], activeItemEvent: null, characterId: 'kakeru', avatarDataUrl: '', gachaTickets: 0, gachaItems: [] },
    { id: 'kid-kirara', name: 'キララ', color: '#ec4899', bank: 0, goal: 'えほん', goalAmount: 800, goalImageDataUrl: '', goalHistory: [], lastGoalEvent: null, itemEvents: [], activeItemEvent: null, characterId: 'kirara', avatarDataUrl: '', gachaTickets: 0, gachaItems: [] }
  ];
  const QUEST_EMOJIS = ['⭐', '🧹', '🧺', '🧼', '🛁', '🍽️', '🍳', '🍴', '🪴', '🌻', '🐕', '🐈', '🗑️', '📚', '🧸', '👟', '👞', '🥛', '👔', '👕', '🦷', '🚗', '🚲', '🍎', '💪', '🏠'];

  let tasks = [
    { id: 'task-dishes', label: 'おさらをはこぶ', icon: '🍽️', reward: 30 },
    { id: 'task-shoes', label: 'くつをそろえる', icon: '👟', reward: 20 },
    { id: 'task-plants', label: 'おはなのみずやり', icon: '🌻', reward: 50 },
    { id: 'task-table', label: 'テーブルをふく', icon: '🧼', reward: 30 },
    { id: 'task-laundry', label: 'せんたくものをたたむ', icon: '🧺', reward: 60 },
    { id: 'task-books', label: '本とおもちゃを片づける', icon: '📚', reward: 40 }
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
    activeKidId: 'kid-kakeru',
    calendarMonth: new Date(),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    currentTab: 'today',
    appMode: 'child',
    familyId: null,
    kidPlanTemplates: {},
    activeBankKidId: 'all',
    activeAlbumKidId: 'all',
    rewardSettings: { ...DEFAULT_REWARD_SETTINGS }
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
      childNav: document.getElementById('childNav'),
      parentNav: document.getElementById('parentNav'),
      enterParentMode: document.getElementById('enterParentMode'),
      exitParentMode: document.getElementById('exitParentMode'),
      approvalSummaryText: document.getElementById('approvalSummaryText'),
      approvalList: document.getElementById('approvalList'),
      approveAllParent: document.getElementById('approveAllParent'),
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
      kidQuickSwitch: document.getElementById('kidQuickSwitch'),
      dayQuickSwitch: document.getElementById('dayQuickSwitch'),
      parentActionPanel: document.getElementById('parentActionPanel'),
      bottomAdultToggle: document.getElementById('bottomAdultToggle'),
      editStateLabel: document.getElementById('editStateLabel'),
      editModeHint: document.getElementById('editModeHint'),
      controlPanel: document.getElementById('editControlPanel'),
      controlPanelBody: document.getElementById('controlPanelBody'),
      controlCollapse: document.getElementById('controlCollapse'),
      totalBank: document.getElementById('totalBank'),
      kidBankStatus: document.getElementById('kidBankStatus'),
      bankbookTabs: document.getElementById('bankbookTabs'),
      bankbookSummary: document.getElementById('bankbookSummary'),
      growthAlbumTabs: document.getElementById('growthAlbumTabs'),
      growthAlbumSummary: document.getElementById('growthAlbumSummary'),
      growthAlbumList: document.getElementById('growthAlbumList'),
      headerProgress: document.getElementById('headerProgress'),
      todayDone: document.getElementById('todayDone'),
      todayRemaining: document.getElementById('todayRemaining'),
      todayTotalReward: document.getElementById('todayTotalReward'),
      adventureRoadmap: document.getElementById('adventureRoadmap'),
      weeklyPlanner: document.getElementById('weeklyPlanner'),
      planTemplatePanel: document.getElementById('planTemplatePanel'),
      planTemplateHint: document.getElementById('planTemplateHint'),
      planUnsetSummary: document.getElementById('planUnsetSummary'),
      kidTemplateList: document.getElementById('kidTemplateList'),
      rewardSettingsPanel: document.getElementById('rewardSettingsPanel'),
      rewardPageLead: document.getElementById('rewardPageLead'),
      rewardPromise: document.getElementById('rewardPromise'),
      controlAutoDistribute: document.getElementById('controlAutoDistribute'),
      controlClearWeek: document.getElementById('controlClearWeek'),
      taskPickerModal: document.getElementById('taskPickerModal'),
      taskPickerGrid: document.getElementById('taskPickerGrid'),
      closeTaskPicker: document.getElementById('closeTaskPicker'),
      quickReportModal: document.getElementById('quickReportModal'),
      quickReportGrid: document.getElementById('quickReportGrid'),
      quickReportSubtitle: document.getElementById('quickReportSubtitle'),
      closeQuickReport: document.getElementById('closeQuickReport'),
      confirmQuickReport: document.getElementById('confirmQuickReport'),
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
    state.controlSelection.dayIndex = getDefaultDayIndexForWeek(state.weekStart);
    ensureWeekHasPlan();
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
    ensureWeekHasPlan();
    
    if (forcedDayIndex !== null) {
      state.controlSelection.dayIndex = forcedDayIndex;
    }

    ensureControlSelectionValid();
    render();
  }

  function switchTab(tabId) {
    if (!tabId) return;
    if (state.appMode === 'child' && tabId === 'bank' && state.activeBankKidId === 'all') {
      const activeKid = getActiveKid();
      if (activeKid) state.activeBankKidId = activeKid.id;
    }
    if (state.appMode === 'child' && tabId === 'album' && state.activeAlbumKidId === 'all') {
      const activeKid = getActiveKid();
      if (activeKid) state.activeAlbumKidId = activeKid.id;
    }
    state.currentTab = tabId;
    elements.tabBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tabId);
    });
    elements.tabContents.forEach(content => {
      content.classList.toggle('is-active', content.id === `tab-${tabId}`);
    });
    requestAnimationFrame(resetViewportScroll);
    if (state.appMode === 'parent' && (tabId === 'setup' || tabId === 'approval' || tabId === 'log' || tabId === 'bank' || tabId === 'data')) {
      state.controlCollapsed = false;
      activateEditMode();
    } else {
      deactivateEditMode();
      // 準備タブ以外では、描画を更新
      render();
    }
    setTimeout(resetViewportScroll, 0);
  }

  function resetViewportScroll() {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  }

  function enterParentMode() {
    state.appMode = 'parent';
    state.editMode = true;
    updateAppMode();
    switchTab('approval');
  }

  function exitParentMode() {
    state.appMode = 'child';
    state.editMode = false;
    updateAppMode();
    switchTab('today');
  }

  function updateAppMode() {
    document.body.classList.toggle('is-parent-mode', state.appMode === 'parent');
    document.body.classList.toggle('is-child-mode', state.appMode !== 'parent');
    if (elements.childNav) elements.childNav.hidden = state.appMode === 'parent';
    if (elements.parentNav) elements.parentNav.hidden = state.appMode !== 'parent';
  }

  // ─── Core Rendering ───
  function render() {
    if (!state.weekData) return;
    const kidsSynced = syncWeekDataWithKids();
    const tasksCleaned = cleanupInvalidTaskReferences();
    ensureControlSelectionValid();
    
    updateWeekLabel();
    renderKidQuickSwitch();
    renderCards();
    renderDayQuickSwitch();
    renderParentActionPanel();
    renderApprovalCenter();
    updateSummary();
    updateEditState();
    updateAppMode();
    renderKidManager();
    renderTaskManager();
    renderTaskLibrary();
    renderCalendar();
    renderAdventureRoadmap();
    renderGrowthAlbum();
    renderGachaArea();
    renderRewardSettingsPanel();
    renderPlanTemplatePanel();
    renderWeeklyPlanner();
    updateFooterControls();
    updateControlPanelCollapse();
    
    if (tasksCleaned) saveConfig();
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
    if (state.appMode === 'child') {
      elements.cardsContainer.appendChild(createFamilyHero(day));
    }
    elements.cardsContainer.appendChild(createDayCard(day, state.controlSelection.dayIndex));
  }

  function createFamilyHero(day) {
    const hero = document.createElement('section');
    const activeKid = getActiveKid();
    const summary = activeKid ? summarizeKidDay(day, activeKid.id) : summarizeDayDetailed(day);
    const char = CHARACTERS[activeKid && activeKid.characterId] || CHARACTERS.cloudon;
    const kidName = activeKid ? activeKid.name : 'みんな';
    const lead = summary.todo > 0
      ? `あと${summary.todo}こ。上から1つずつ進めよう。`
      : summary.pending > 0
        ? 'おうちの人の確認を待とう。承認されたら貯金に入るよ。'
        : summary.total > 0
          ? '今日のぶんは完了。できたことを家族で見返そう。'
          : '今日は予定がありません。できたお手伝いがあれば報告できます。';
    hero.className = 'ip-family-hero';
    hero.innerHTML = `
      <div class="ip-family-hero__photo">
        <img src="${FAMILY_IMAGE_SRC}" alt="クラウドんファミリー">
      </div>
      <div class="ip-family-hero__body">
        <span class="ip-family-hero__eyebrow">クラウドんファミリー</span>
        <h2>${escapeHtml(kidName)}の作戦ボード</h2>
        <p>${escapeHtml(lead)}</p>
        <div class="ip-family-hero__guide">
          <span class="ip-family-hero__avatar"><img src="${char.img}" alt="${escapeHtml(char.name)}"></span>
          <span>${escapeHtml(char.name)}が今日のお手伝いを見守っているよ</span>
        </div>
      </div>
    `;
    return hero;
  }

  function renderDayQuickSwitch() {
    if (!elements.dayQuickSwitch || !state.weekData) return;
    const todayISO = toISO(new Date());
    elements.dayQuickSwitch.innerHTML = state.weekData.days.map((day, dayIndex) => {
      const date = parseISO(day.dateISO);
      const summary = summarizeDayDetailed(day);
      const isSelected = dayIndex === state.controlSelection.dayIndex;
      const isToday = day.dateISO === todayISO;
      return `
        <button type="button" class="day-chip ${isSelected ? 'is-active' : ''} ${isToday ? 'is-today' : ''}" data-day-index="${dayIndex}">
          <span class="day-chip__name">${isToday ? '今日' : DAY_NAMES[date.getDay()]}</span>
          <span class="day-chip__date">${date.getMonth() + 1}/${date.getDate()}</span>
          <span class="day-chip__meta">${summary.done}/${summary.total}</span>
          ${summary.pending ? `<span class="day-chip__badge">${summary.pending}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  function renderKidQuickSwitch() {
    if (!elements.kidQuickSwitch) return;
    const activeKid = getActiveKid();
    if (!kids.length || !activeKid) {
      elements.kidQuickSwitch.innerHTML = '';
      return;
    }

    const day = state.weekData ? state.weekData.days[state.controlSelection.dayIndex] : null;
    elements.kidQuickSwitch.innerHTML = kids.map(kid => {
      const avatarSrc = getKidAvatarSrc(kid);
      const summary = day ? summarizeKidDay(day, kid.id) : { done: 0, total: 0, pending: 0 };
      const isActive = kid.id === activeKid.id;
      const meta = summary.total ? `あと ${summary.todo}こ` : '今日はなし';
      return `
        <button type="button" class="kid-choice ${isActive ? 'is-active' : ''}" data-kid-id="${kid.id}" style="--kid-color:${kid.color}">
          <span class="kid-choice__avatar"><img src="${avatarSrc}" alt="${escapeHtml(kid.name)}"></span>
          <span class="kid-choice__main">
            <span class="kid-choice__name">${escapeHtml(kid.name)}</span>
            <span class="kid-choice__meta">今日 ${meta}${summary.pending ? '・待つ ' + summary.pending : ''}</span>
          </span>
        </button>
      `;
    }).join('');
  }

  function renderParentActionPanel() {
    if (!elements.parentActionPanel || !state.weekData) return;
    const day = state.weekData.days[state.controlSelection.dayIndex];
    if (!day) return;
    const pendingItems = getPendingItemsForDay(day, state.controlSelection.dayIndex);
    const summary = summarizeDayDetailed(day);
    const hasParentWork = state.editMode && pendingItems.length > 0;

    elements.parentActionPanel.hidden = !hasParentWork;
    if (!hasParentWork) {
      elements.parentActionPanel.innerHTML = '';
      return;
    }

    elements.parentActionPanel.innerHTML = `
      <div class="parent-action-panel__main">
        <span class="parent-action-panel__eyebrow">保護者の確認</span>
        <h3>承認待ちが ${pendingItems.length} 件あります</h3>
        <p>${summary.done}/${summary.total} 完了。承認した分だけ貯金箱に反映されます。</p>
      </div>
      <div class="parent-action-panel__list">
        ${pendingItems.slice(0, 3).map(item => `
          <div class="approval-mini" style="--kid-color:${item.kid.color}">
            <span class="approval-mini__kid">${escapeHtml(item.kid.name)}</span>
            <span class="approval-mini__task">${item.task.icon} ${escapeHtml(item.task.label)}</span>
            <span class="approval-mini__yen">¥${item.task.reward}</span>
          </div>
        `).join('')}
      </div>
      <button type="button" id="approveAllToday" class="button primary">まとめて承認</button>
    `;
  }

  function renderApprovalCenter() {
    if (!elements.approvalList || !state.weekData) return;
    const pendingItems = getPendingItemsForWeekSorted();
    const todayISO = toISO(new Date());
    const todayPendingItems = pendingItems.filter(item => item.day.dateISO === todayISO);
    const otherPendingItems = pendingItems.filter(item => item.day.dateISO !== todayISO);
    const rewardRequests = getRewardExchangeRequests().filter(req => req.status === 'pending');
    const approvedItems = getRecentlyApprovedItemsForWeek(3);
    const cancelledItems = getRecentlyCancelledItemsForWeek();
    const weekSummary = summarizeWeek();
    const pendingAmount = pendingItems.reduce((sum, item) => sum + (item.task.reward || 0), 0);
    const todayAmount = todayPendingItems.reduce((sum, item) => sum + (item.task.reward || 0), 0);
    const totalPendingCount = pendingItems.length + rewardRequests.length;

    if (elements.approvalSummaryText) {
      elements.approvalSummaryText.textContent = totalPendingCount
        ? `今日 ${todayPendingItems.length} 件、交換 ${rewardRequests.length} 件。完了 ${weekSummary.done}/${weekSummary.total}`
        : '確認する報告はありません。子どもが報告するとここに表示されます。';
    }
    if (elements.approveAllParent) {
      elements.approveAllParent.disabled = pendingItems.length === 0;
      elements.approveAllParent.textContent = pendingItems.length ? `お手伝い${pendingItems.length}件を承認` : 'お手伝い承認なし';
    }

    const summaryHtml = `
      <div class="approval-dashboard" aria-label="承認待ちの概要">
        <div class="approval-metric approval-metric--primary">
          <span>承認待ち</span>
          <strong>${totalPendingCount}</strong>
          <small>お手伝い ${pendingAmount.toLocaleString()}円 / 交換 ${rewardRequests.length}件</small>
        </div>
        <div class="approval-metric">
          <span>今日</span>
          <strong>${todayPendingItems.length}</strong>
          <small>${todayAmount.toLocaleString()}円</small>
        </div>
        <div class="approval-metric">
          <span>完了</span>
          <strong>${weekSummary.done}</strong>
          <small>今週 ${weekSummary.total} 件中</small>
        </div>
      </div>
    `;

    const renderApprovalItem = item => {
      const day = item.day;
      const date = parseISO(day.dateISO);
      const reportTime = formatApprovalDateTime(item.slot.reportedAt, date);
      const isToday = day.dateISO === todayISO;
      return `
        <article class="approval-item ${isToday ? 'is-today' : ''}" data-approval-item data-day-index="${item.dayIndex}" data-kid-id="${item.kid.id}" data-slot-index="${item.slotIndex}" style="--kid-color:${item.kid.color}">
          <div class="approval-item__date">
            <span>${isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}（${DAY_NAMES[date.getDay()]}）`}</span>
            <small>${reportTime}</small>
          </div>
          <div class="approval-item__main">
            <strong>${escapeHtml(item.kid.name)}</strong>
            <span>${item.task.icon} ${escapeHtml(item.task.label)}</span>
          </div>
          <div class="approval-item__amount">¥${item.task.reward}</div>
          <div class="approval-item__actions" aria-label="承認操作">
            <button type="button" class="button ghost small approval-return" data-approval-action="return">報告を戻す</button>
            <button type="button" class="button primary small approval-approve" data-approval-action="approve">承認</button>
          </div>
        </article>
      `;
    };

    const rewardRequestsHtml = rewardRequests.length ? `
      <section class="approval-section approval-section--reward">
        <div class="approval-section__header">
          <h3>ごほうび交換申請</h3>
          <span>${rewardRequests.length}件</span>
        </div>
        <div class="approval-pending-list">
          ${rewardRequests.map(req => `
            <article class="approval-item approval-item--reward" data-reward-exchange-id="${escapeHtml(req.id)}" style="--kid-color:${escapeHtml((kids.find(k => k.id === req.kidId)?.color) || '#94a3b8')}">
              <div class="approval-item__date">
                <span>交換</span>
                <small>${formatApprovalDateTime(req.requestedAt)}</small>
              </div>
              <div class="approval-item__main">
                <strong>${escapeHtml(req.kidName || getKidName(req.kidId))}</strong>
                <span>🎁 ${escapeHtml(req.rewardName)}</span>
                <small>${escapeHtml(formatRewardCost(req))} を使います</small>
              </div>
              <div class="approval-item__amount">${escapeHtml(formatRewardCost(req))}</div>
              <div class="approval-item__actions" aria-label="交換操作">
                <button type="button" class="button ghost small approval-return" data-reward-exchange-action="return-reward">戻す</button>
                <button type="button" class="button primary small approval-approve" data-reward-exchange-action="approve-reward">承認</button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    ` : '';

    const pendingHtml = !pendingItems.length && !rewardRequests.length ? `
        <div class="empty-state">
          <div class="empty-state__icon">✅</div>
          <h3>確認する報告はありません</h3>
          <p>お手伝い報告やごほうび交換申請があると、ここに表示されます。</p>
        </div>
      ` : `
        ${rewardRequestsHtml}
        ${todayPendingItems.length ? `
          <section class="approval-section approval-section--today">
            <div class="approval-section__header">
              <h3>今日の承認待ち</h3>
              <button type="button" id="approveAllTodayFromTop" class="button primary small">今日の${todayPendingItems.length}件を承認</button>
            </div>
            <div class="approval-pending-list">${todayPendingItems.map(renderApprovalItem).join('')}</div>
          </section>
        ` : ''}
        ${otherPendingItems.length ? `
          <section class="approval-section">
            <div class="approval-section__header">
              <h3>今日以外の承認待ち</h3>
              <span>${otherPendingItems.length}件</span>
            </div>
            <div class="approval-pending-list">${otherPendingItems.map(renderApprovalItem).join('')}</div>
          </section>
        ` : ''}
      `;

    const approvedHtml = approvedItems.length ? `
      <section class="approval-recent approval-recent--approved" aria-label="直近の承認">
        <h3>直近の承認</h3>
        <div class="approval-recent__list">
          ${approvedItems.map(item => `
            <article class="approval-recent-item" data-approval-item data-day-index="${item.dayIndex}" data-kid-id="${item.kid.id}" data-slot-index="${item.slotIndex}" style="--kid-color:${item.kid.color}">
              <div class="approval-recent-item__main">
                <strong>${escapeHtml(item.kid.name)}</strong>
                <span>${item.task.icon} ${escapeHtml(item.task.label)}</span>
                <small>承認 ${formatApprovalDateTime(item.slot.approvedAt || item.transaction?.time, parseISO(item.day.dateISO))}</small>
              </div>
              <div class="approval-recent-item__amount">+¥${item.task.reward}</div>
              <button type="button" class="button ghost small" data-approval-action="undo-approval">取り消す</button>
            </article>
          `).join('')}
        </div>
      </section>
    ` : '';

    const cancelledHtml = cancelledItems.length ? `
      <section class="approval-recent approval-recent--cancelled" aria-label="最近取り消した履歴">
        <h3>最近取り消した履歴</h3>
        <div class="approval-recent__list">
          ${cancelledItems.map(item => `
            <article class="approval-recent-item is-cancelled" style="--kid-color:${item.kid.color}">
              <div class="approval-recent-item__main">
                <strong>${escapeHtml(item.kid.name)}</strong>
                <span>${escapeHtml(item.taskName)}</span>
                <small>${formatApprovalDateTime(item.time)}</small>
              </div>
              <div class="approval-recent-item__amount">-${Math.abs(item.amount).toLocaleString()}円</div>
            </article>
          `).join('')}
        </div>
      </section>
    ` : '';

    elements.approvalList.innerHTML = `
      ${summaryHtml}
      ${pendingHtml}
      ${approvedHtml}
      ${cancelledHtml}
    `;
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
          <p class="day-card__meta">${summary.total ? '完了 ' + summary.done + ' / ' + summary.total : '完了 0 / 0'}</p>
        </div>
        <span class="day-card__percent">${summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%</span>
      </header>
      <div class="day-card__body">
        <div class="kid-grid">
          ${getVisibleKidsForToday().map(kid => createKidBlockHtml(day, dayIndex, kid)).join('')}
        </div>
      </div>
    `;
    
    // イベント委譲のため、後でバインド
    return card;
  }

  function createKidBlockHtml(day, dayIndex, kid) {
    const avatarSrc = getKidAvatarSrc(kid);
    const kidSlots = day.slots[kid.id] || [];
    const kidSummary = summarizeKidDay(day, kid.id);
    const sortedSlots = kidSlots
      .map((slot, slotIndex) => ({ slot, slotIndex }))
      .filter(item => item.slot.taskId || state.editMode)
      .sort((a, b) => {
        if (state.editMode) return a.slotIndex - b.slotIndex;
        return getChildSlotPriority(a.slot) - getChildSlotPriority(b.slot);
      });
    
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
            <div class="kid-avatar-hero"><img src="${avatarSrc}" alt="${escapeHtml(kid.name)}"></div>
            <div class="hero-naming">
              <span class="hero-label">きょうの画面</span>
              <h4 class="kid-name">${escapeHtml(kid.name)}</h4>
              <span class="kid-next-line">${kidSummary.total ? (kidSummary.todo ? `あと ${kidSummary.todo}こ やろう` : kidSummary.pending ? 'おうちの人の確認待ち' : '今日のお手伝いクリア') : '今日は予定がありません'}</span>
            </div>
          </div>
          <div class="hero-stats">
            <span class="kid-remaining-badge">${kidSummary.todo ? `のこり ${kidSummary.todo}` : 'のこり 0'}</span>
            <span class="kid-summary">今日のごほうび: <span class="reward-yen">¥${dailyMoney}</span></span>
          </div>
        </div>
        
        ${!state.editMode ? `
          <div class="quick-report-card">
            <div>
              <strong>予定にないお手伝いも記録できます</strong>
              <span>やったものをまとめて選んで、おうちの人に報告しよう。</span>
            </div>
            <button class="quick-report-button" type="button" data-action="open-quick-report" data-kid-id="${kid.id}">
              おてつだいしたよ！
            </button>
          </div>
        ` : ''}

        <div class="chore-list">
          ${sortedSlots.length ? sortedSlots.map(({ slot, slotIndex }) => {
            const task = slot.taskId ? taskMap.get(slot.taskId) : null;
            if (!task && !state.editMode) return '';
            const stateText = slot.status === 'done' ? 'できた' : slot.status === 'pending' ? 'まってる' : slot.status === 'todo' ? 'つぎにやる' : '未設定';
            const helpText = !state.editMode && slot.status === 'pending'
              ? 'おうちの人を待とう'
              : !state.editMode && slot.status === 'done'
                ? 'もうできたよ'
                : !state.editMode && slot.status === 'todo'
                  ? 'できたら報告ボタンを押そう'
                  : '';
            
            let btnText = STATUS_LABELS[slot.status] || '未設定';
            let btnClass = slot.status === 'done' ? 'success' : 'secondary';
            let extraClass = '';

            if (slot.status === 'todo' && !state.editMode) {
              btnText = 'できた！報告';
              btnClass = 'primary';
              extraClass = 'is-main-action';
            }
            
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

            if (slot.status === 'done' && !state.editMode) {
              extraClass = 'is-complete';
            }
            
            return `
              <div class="slot" data-day-index="${dayIndex}" data-kid-id="${kid.id}" data-slot-index="${slotIndex}" data-status="${slot.status}">
                <div class="slot-content">
                  <span class="slot-state-label slot-state-label--${slot.status}">${stateText}</span>
                  <span class="slot-title">${task ? (task.icon + ' ' + task.label) : '<span class="planner-empty">未設定</span>'}</span>
                  <span class="slot-reward">${task ? 'ごほうび ¥' + task.reward : '-'}</span>
                  ${helpText ? `<span class="slot-help">${helpText}</span>` : ''}
                </div>
                <button class="slot-status ${btnClass} ${extraClass}" data-action="cycle-status">
                  ${btnText}
                </button>
              </div>
            `;
          }).join('') : `
            <div class="kid-empty-today">
              <strong>今日は予定がありません</strong>
              <span>おうちの人が予定を作ると、ここに表示されます。</span>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function updateSummary() {
    if (!state.weekData) return;
    const summary = summarizeWeek();
    const percent = summary.total ? Math.round((summary.done / summary.total) * 100) : 0;
    const today = state.weekData.days[state.controlSelection.dayIndex];
    const todayStats = today ? summarizeDayDetailed(today) : { pending: 0, totalReward: 0 };
    
    if (elements.starsEarned) elements.starsEarned.textContent = String(summary.done);
    if (elements.starsTarget) elements.starsTarget.textContent = String(summary.total);
    if (elements.progressPercent) elements.progressPercent.textContent = percent + '%';
    if (elements.progressBar) elements.progressBar.style.width = percent + '%';

    // 貯金箱の合計
    const totalBank = kids.reduce((sum, k) => sum + (k.bank || 0), 0);
    if (elements.totalBank) elements.totalBank.textContent = totalBank.toLocaleString();

    if (elements.kidBankStatus) {
      elements.kidBankStatus.innerHTML = kids.map(kid => {
        const avatarSrc = getKidAvatarSrc(kid);
        const progress = kid.goalAmount ? Math.min(100, Math.round((kid.bank / kid.goalAmount) * 100)) : 0;
        return `
          <div class="kid-bank-item" style="--kid-color: ${kid.color}">
            <div class="kid-bank-item__top">
              <div class="kid-bank-item__avatar"><img src="${avatarSrc}" alt="${escapeHtml(kid.name)}"></div>
              <div class="kid-bank-item__info">
                <span class="kid-bank-item__name">${escapeHtml(kid.name)}</span>
                <span class="kid-bank-item__money">¥${(kid.bank || 0).toLocaleString()}</span>
              </div>
          </div>
            <div class="kid-bank-item__numbers">
              <span>今週 ¥${getKidWeekEarnings(kid.id).toLocaleString()}</span>
              <span>あと ¥${Math.max(0, (kid.goalAmount || 0) - (kid.bank || 0)).toLocaleString()}</span>
            </div>
            <div class="goal-gauge"><div class="goal-gauge__fill" style="width: ${progress}%"></div></div>
            <span class="goal-label">目標: ${escapeHtml(kid.goal)} (${progress}%)</span>
          </div>
        `;
      }).join('');
    }
    
    renderBankbook();

    const statusPill = document.querySelector('.header-status-pill');
    if (statusPill) {
      statusPill.innerHTML = `
        今日のがんばり: <span id="headerProgress" style="font-weight: 800; color: var(--text);">${Math.round(((todayStats.done || 0) / Math.max(1, todayStats.total || 0)) * 100)}%</span>
        ${todayStats.pending ? `<span class="approval-count">${todayStats.pending}件 承認待ち</span>` : ''}
      `;
      elements.headerProgress = document.getElementById('headerProgress');
    }

    // 最近のがんばり推移
    const chartCtx = document.getElementById('savingsChart');
    if (chartCtx) {
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

      if (window.Chart && window.savingsChartInstance) {
        window.savingsChartInstance.data.datasets[0].data = dailyTotals;
        window.savingsChartInstance.options.scales.y.grid.color = gridColor;
        window.savingsChartInstance.options.scales.y.ticks.color = textColor;
        window.savingsChartInstance.options.scales.x.ticks.color = textColor;
        window.savingsChartInstance.update();
      } else if (window.Chart) {
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
      } else {
        drawSavingsChart(chartCtx, dayLabels, dailyTotals, { gridColor, textColor });
      }
    }
  }

  function renderBankbook() {
    const txList = document.getElementById('transactionList');
    if (!txList || !state.weekData) return;
    ensureActiveBankKidValid();
    const selectedKid = kids.find(kid => kid.id === state.activeBankKidId);
    const isParentBankView = state.appMode === 'parent';
    const allTransactions = getAllStoredTransactions();
    const visibleTransactions = selectedKid
      ? allTransactions.filter(tx => tx.kidId === selectedKid.id)
      : allTransactions;
    const scopedKids = selectedKid ? [selectedKid] : kids;
    const totals = calculateBankbookTotals(visibleTransactions, scopedKids);
    const earnTransactions = visibleTransactions.filter(tx => Number(tx.amount || 0) > 0 && tx.type !== 'undo' && tx.type !== 'exchange');
    const spendTransactions = visibleTransactions.filter(tx => tx.type === 'exchange');
    const undoTransactions = visibleTransactions.filter(tx => tx.type === 'undo');
    const ledgerTotal = visibleTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const balanceDiff = totals.bank - ledgerTotal;

    if (elements.bankbookTabs) {
      elements.bankbookTabs.innerHTML = `
        ${isParentBankView ? `<button type="button" class="bankbook-tab ${state.activeBankKidId === 'all' ? 'is-active' : ''}" data-bank-kid-id="all">
          <span class="bankbook-tab__name">全員</span>
          <span class="bankbook-tab__amount">¥${kids.reduce((sum, kid) => sum + (kid.bank || 0), 0).toLocaleString()}</span>
        </button>` : ''}
        ${kids.map(kid => `
          <button type="button" class="bankbook-tab ${state.activeBankKidId === kid.id ? 'is-active' : ''}" data-bank-kid-id="${kid.id}" style="--kid-color:${kid.color}">
            <span class="bankbook-tab__name">${escapeHtml(kid.name)}</span>
            <span class="bankbook-tab__amount">¥${(kid.bank || 0).toLocaleString()}</span>
          </button>
        `).join('')}
      `;
    }

    if (elements.bankbookSummary) {
      const remaining = selectedKid ? Math.max(0, (selectedKid.goalAmount || 0) - (selectedKid.bank || 0)) : null;
      const goalProgress = selectedKid && selectedKid.goalAmount
        ? Math.min(100, Math.round(((selectedKid.bank || 0) / selectedKid.goalAmount) * 100))
        : null;
      const avatarSrc = selectedKid ? getKidAvatarSrc(selectedKid) : '';
      elements.bankbookSummary.innerHTML = `
        ${selectedKid ? `
          <section class="bankbook-goal-card" style="--kid-color:${selectedKid.color}">
            <div class="bankbook-goal-card__profile">
              <img src="${avatarSrc}" alt="${escapeHtml(selectedKid.name)}">
              <div>
                <span>${escapeHtml(selectedKid.name)}の目標</span>
                <strong>${escapeHtml(selectedKid.goal || '目標')}</strong>
              </div>
            </div>
            <div class="bankbook-goal-card__money">
              <strong>あと ¥${remaining.toLocaleString()}</strong>
              <span>いま ¥${(selectedKid.bank || 0).toLocaleString()} / ¥${(selectedKid.goalAmount || 0).toLocaleString()}</span>
            </div>
            <div class="bankbook-goal-progress" aria-label="目標までの進捗">
              <div class="bankbook-goal-progress__fill" style="width:${goalProgress}%"></div>
            </div>
            <small>${goalProgress}% まで進んでいます</small>
          </section>
        ` : `
          <section class="bankbook-goal-card bankbook-goal-card--all">
            <div>
              <span>家族の通帳</span>
              <strong>全員の合計を確認</strong>
            </div>
            <div class="bankbook-goal-card__money">
              <strong>合計 ¥${totals.bank.toLocaleString()}</strong>
              <span>子供ごとのタブで目標までの進捗を確認できます</span>
            </div>
          </section>
        `}
        <div class="bankbook-stat-grid">
          <div class="bankbook-stat">
            <span>今週</span>
            <strong>${formatSignedYen(totals.week)}</strong>
          </div>
          <div class="bankbook-stat">
            <span>今月</span>
            <strong>${formatSignedYen(totals.month)}</strong>
          </div>
          <div class="bankbook-stat">
            <span>累計残高</span>
            <strong>¥${totals.bank.toLocaleString()}</strong>
          </div>
          <div class="bankbook-stat ${selectedKid ? '' : 'is-muted'}">
            <span>目標まで</span>
            <strong>${selectedKid ? `¥${remaining.toLocaleString()}` : '-'}</strong>
          </div>
        </div>
        ${isParentBankView ? `<div class="bankbook-integrity ${balanceDiff === 0 ? 'is-ok' : 'is-warning'}">
          <span>親向け確認</span>
          <strong>${balanceDiff === 0 ? '残高と通帳が一致' : `差額 ${formatSignedYen(balanceDiff)}`}</strong>
          <small>通帳合計 ${formatSignedYen(ledgerTotal)} / 現在残高 ¥${totals.bank.toLocaleString()}</small>
        </div>` : ''}
      `;
    }

    if (!visibleTransactions.length) {
      txList.innerHTML = '<li class="bankbook-empty">まだ通帳の記録がありません。お手伝いが承認されると、理由つきで残ります。</li>';
      return;
    }

    const renderTransactionRows = list => list.map(tx => {
      const date = new Date(tx.time);
      const isUndo = tx.amount < 0 || tx.type === 'undo';
      const isExchange = tx.type === 'exchange';
      const status = isExchange ? '交換' : isUndo ? '取消' : '獲得';
      const kidName = escapeHtml(tx.kidName || getKidName(tx.kidId));
      const taskName = escapeHtml(tx.taskName || 'お手伝い');
      const childReason = isExchange
        ? `${kidName}が「${taskName.replace('ごほうび交換: ', '')}」と交換したので、${Math.abs(tx.amount || 0).toLocaleString()}円つかいました。`
        : isUndo
        ? `${kidName}の「${taskName.replace('（取消）', '')}」は承認を取り消したので、${Math.abs(tx.amount || 0).toLocaleString()}円へりました。`
        : `${kidName}が「${taskName}」をしたので、${Math.abs(tx.amount || 0).toLocaleString()}円ふえました。`;
      return `
        <li class="bankbook-row ${isUndo ? 'is-undo' : 'is-earn'}">
          <div class="bankbook-row__date">
            <strong>${date.getMonth() + 1}/${date.getDate()}</strong>
            <span>${DAY_NAMES[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}</span>
          </div>
          <div class="bankbook-row__main">
            <span class="bankbook-row__kid">${kidName}</span>
            <strong>${taskName}</strong>
            <small class="bankbook-row__child-reason">${childReason}</small>
            ${isParentBankView ? `<small class="bankbook-row__parent-note">取引ID: ${escapeHtml(String(tx.id || '').slice(0, 12))}${tx.originalTxId ? ` / 元: ${escapeHtml(String(tx.originalTxId).slice(0, 12))}` : ''}</small>` : ''}
          </div>
          <div class="bankbook-row__status">${status}</div>
          <div class="bankbook-row__amount">${formatSignedYen(tx.amount || 0)}</div>
        </li>
      `;
    }).join('');

    txList.innerHTML = `
      ${earnTransactions.length ? `
        <li class="bankbook-group-title bankbook-group-title--earn">
          <span>獲得</span>
          <strong>${earnTransactions.length}件</strong>
        </li>
        ${renderTransactionRows(earnTransactions)}
      ` : ''}
      ${undoTransactions.length ? `
        <li class="bankbook-group-title bankbook-group-title--undo">
          <span>取消</span>
          <strong>${undoTransactions.length}件</strong>
        </li>
        ${renderTransactionRows(undoTransactions)}
      ` : ''}
      ${spendTransactions.length ? `
        <li class="bankbook-group-title bankbook-group-title--undo">
          <span>交換</span>
          <strong>${spendTransactions.length}件</strong>
        </li>
        ${renderTransactionRows(spendTransactions)}
      ` : ''}
    `;
  }

  function ensureActiveBankKidValid() {
    if (state.appMode === 'child' && state.activeBankKidId === 'all') {
      const activeKid = getActiveKid();
      state.activeBankKidId = activeKid ? activeKid.id : 'all';
      return;
    }
    if (state.activeBankKidId === 'all') return;
    if (!kids.some(kid => kid.id === state.activeBankKidId)) {
      state.activeBankKidId = kids[0] ? kids[0].id : 'all';
    }
  }

  function getAllStoredTransactions() {
    const txs = [];
    const seen = new Set();
    if (storageAvailable) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
        try {
          const week = JSON.parse(localStorage.getItem(key));
          (week.transactions || []).forEach(tx => {
            if (tx && tx.id && !seen.has(tx.id)) {
              seen.add(tx.id);
              txs.push(tx);
            }
          });
        } catch (e) {}
      }
    }
    (state.weekData.transactions || []).forEach(tx => {
      if (tx && tx.id && !seen.has(tx.id)) {
        seen.add(tx.id);
        txs.push(tx);
      }
    });
    return txs.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  function calculateBankbookTotals(transactions, scopedKids) {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const scopedKidIds = new Set(scopedKids.map(kid => kid.id));
    return transactions.reduce((totals, tx) => {
      if (scopedKidIds.size && !scopedKidIds.has(tx.kidId)) return totals;
      const date = new Date(tx.time);
      const amount = Number(tx.amount || 0);
      if (date >= weekStart) totals.week += amount;
      if (date >= monthStart) totals.month += amount;
      return totals;
    }, {
      week: 0,
      month: 0,
      bank: scopedKids.reduce((sum, kid) => sum + (kid.bank || 0), 0)
    });
  }

  function formatSignedYen(amount) {
    const value = Number(amount || 0);
    if (value < 0) return `-¥${Math.abs(value).toLocaleString()}`;
    return `+¥${value.toLocaleString()}`;
  }

  function getKidName(kidId) {
    return kids.find(kid => kid.id === kidId)?.name || 'こども';
  }

  function getKidAvatarSrc(kid) {
    if (kid && kid.avatarDataUrl) return kid.avatarDataUrl;
    const char = CHARACTERS[kid && kid.characterId] || CHARACTERS.logico;
    return char.img;
  }

  function renderGrowthAlbum() {
    if (!elements.growthAlbumList || !state.weekData) return;
    ensureActiveAlbumKidValid();
    const selectedKid = kids.find(kid => kid.id === state.activeAlbumKidId);
    const isParentView = state.appMode === 'parent';
    const allEntries = getAllGrowthAlbumEntries();
    const visibleEntries = selectedKid ? allEntries.filter(entry => entry.kidId === selectedKid.id) : allEntries;
    const activeEntries = visibleEntries.filter(entry => entry.status !== 'canceled');
    const totalAmount = activeEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    if (elements.growthAlbumTabs) {
      elements.growthAlbumTabs.innerHTML = `
        ${isParentView ? `<button type="button" class="growth-album-tab ${state.activeAlbumKidId === 'all' ? 'is-active' : ''}" data-album-kid-id="all">
          <span>全員</span>
          <strong>${allEntries.filter(entry => entry.status !== 'canceled').length}件</strong>
        </button>` : ''}
        ${kids.map(kid => {
          const count = allEntries.filter(entry => entry.kidId === kid.id && entry.status !== 'canceled').length;
          return `
            <button type="button" class="growth-album-tab ${state.activeAlbumKidId === kid.id ? 'is-active' : ''}" data-album-kid-id="${kid.id}" style="--kid-color:${kid.color}">
              <span>${escapeHtml(kid.name)}</span>
              <strong>${count}件</strong>
            </button>
          `;
        }).join('')}
      `;
    }

    if (elements.growthAlbumSummary) {
      const title = selectedKid ? `${selectedKid.name}の成長記録` : '家族の成長記録';
      const lead = activeEntries.length
        ? `${activeEntries.length}件のお手伝いと、¥${totalAmount.toLocaleString()}分のがんばりが残っています。`
        : '承認されたお手伝いが、ここに成長の記録として残ります。';
      elements.growthAlbumSummary.innerHTML = `
        <section class="growth-album-hero ${selectedKid ? '' : 'is-family'}" style="${selectedKid ? `--kid-color:${selectedKid.color}` : ''}">
          ${selectedKid ? `<img src="${getKidAvatarSrc(selectedKid)}" alt="${escapeHtml(selectedKid.name)}">` : '<div class="growth-album-hero__family">家族</div>'}
          <div>
            <span>通帳とは別の思い出</span>
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(lead)}</p>
          </div>
        </section>
      `;
    }

    if (!visibleEntries.length) {
      elements.growthAlbumList.innerHTML = `
        <div class="growth-album-empty">
          <strong>まだ成長アルバムはありません</strong>
          <span>お手伝いを承認すると、日付・内容・金額つきで自動保存されます。</span>
        </div>
      `;
      return;
    }

    elements.growthAlbumList.innerHTML = visibleEntries.map(entry => {
      const date = new Date(entry.time || entry.dateISO);
      const kid = kids.find(item => item.id === entry.kidId);
      const color = kid?.color || entry.kidColor || '#3b82f6';
      const avatarSrc = kid ? getKidAvatarSrc(kid) : CHARACTERS.cloudon.img;
      const isCanceled = entry.status === 'canceled';
      return `
        <article class="growth-album-card ${isCanceled ? 'is-canceled' : ''}" data-growth-entry-id="${escapeHtml(entry.id)}" data-growth-week-key="${escapeHtml(entry.weekKey || state.weekKey)}" style="--kid-color:${color}">
          <div class="growth-album-card__date">
            <strong>${date.getMonth() + 1}/${date.getDate()}</strong>
            <span>${DAY_NAMES[date.getDay()]}</span>
          </div>
          <div class="growth-album-card__main">
            <div class="growth-album-card__profile">
              <img src="${avatarSrc}" alt="${escapeHtml(entry.kidName || getKidName(entry.kidId))}">
              <div>
                <span>${escapeHtml(entry.kidName || getKidName(entry.kidId))}</span>
                <strong>${escapeHtml(entry.taskIcon || '⭐')} ${escapeHtml(entry.taskName || 'お手伝い')}</strong>
              </div>
            </div>
            <p class="growth-album-card__story">${escapeHtml(buildGrowthStory(entry))}</p>
            ${isParentView ? `
              <label class="growth-album-comment">
                <span>親のひとこと</span>
                <textarea class="manager-input" data-growth-comment rows="2" placeholder="例: 自分から気づいて動けたね。">${escapeHtml(entry.parentComment || '')}</textarea>
              </label>
            ` : `
              <div class="growth-album-comment-view">
                <span>おうちの人から</span>
                <strong>${escapeHtml(entry.parentComment || 'まだコメントはありません。')}</strong>
              </div>
            `}
          </div>
          <div class="growth-album-card__amount">
            <span>${isCanceled ? '取消済み' : '承認済み'}</span>
            <strong>+¥${Number(entry.amount || 0).toLocaleString()}</strong>
          </div>
        </article>
      `;
    }).join('');
  }

  function ensureActiveAlbumKidValid() {
    if (state.appMode === 'child' && state.activeAlbumKidId === 'all') {
      const activeKid = getActiveKid();
      state.activeAlbumKidId = activeKid ? activeKid.id : 'all';
      return;
    }
    if (state.activeAlbumKidId === 'all') return;
    if (!kids.some(kid => kid.id === state.activeAlbumKidId)) {
      state.activeAlbumKidId = kids[0] ? kids[0].id : 'all';
    }
  }

  function getAllGrowthAlbumEntries() {
    const entries = [];
    const seen = new Set();
    if (storageAvailable) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
        try {
          const week = JSON.parse(localStorage.getItem(key));
          (week.growthAlbum || []).forEach(entry => {
            if (entry && entry.id && !seen.has(entry.id)) {
              seen.add(entry.id);
              entries.push({ ...entry, weekKey: entry.weekKey || key.replace(STORAGE_PREFIX, '') });
            }
          });
        } catch (e) {}
      }
    }
    (state.weekData.growthAlbum || []).forEach(entry => {
      if (entry && entry.id && !seen.has(entry.id)) {
        seen.add(entry.id);
        entries.push({ ...entry, weekKey: entry.weekKey || state.weekKey });
      }
    });
    return entries.sort((a, b) => new Date(b.time || b.dateISO) - new Date(a.time || a.dateISO));
  }

  function hydrateGrowthAlbumFromTransactions(albumEntries, transactions, weekKey) {
    const entries = Array.isArray(albumEntries) ? [...albumEntries] : [];
    const transactionIds = new Set(entries.map(entry => entry.transactionId).filter(Boolean));
    (transactions || []).forEach(tx => {
      if (!tx || tx.type !== 'earn' || Number(tx.amount || 0) <= 0 || transactionIds.has(tx.id)) return;
      const kid = kids.find(item => item.id === tx.kidId);
      entries.push({
        id: `growth-${tx.id}`,
        weekKey,
        kidId: tx.kidId,
        kidName: tx.kidName || kid?.name || 'こども',
        kidColor: kid?.color || '#3b82f6',
        taskName: tx.taskName || 'お手伝い',
        taskIcon: '⭐',
        amount: tx.amount || 0,
        transactionId: tx.id,
        dateISO: toISO(new Date(tx.time)),
        time: tx.time,
        parentComment: '',
        status: 'active'
      });
      transactionIds.add(tx.id);
    });
    return entries.slice(0, 120);
  }

  function buildGrowthStory(entry) {
    const kidName = entry.kidName || getKidName(entry.kidId);
    const taskName = entry.taskName || 'お手伝い';
    if (entry.status === 'canceled') return `${kidName}の「${taskName}」は承認を見直しました。記録として残しています。`;
    return `${kidName}が「${taskName}」をやりきりました。お金だけでなく、家族を助けた成長の記録です。`;
  }

  function updateGrowthAlbumComment(entryId, weekKey, comment) {
    if (!entryId || !weekKey) return;
    const trimmed = String(comment || '').slice(0, 180);
    if (weekKey === state.weekKey) {
      const entry = (state.weekData.growthAlbum || []).find(item => item.id === entryId);
      if (entry) {
        entry.parentComment = trimmed;
        entry.updatedAt = new Date().toISOString();
        saveWeekData();
        return;
      }
    }
    if (!storageAvailable) return;
    const key = STORAGE_PREFIX + weekKey;
    try {
      const week = JSON.parse(localStorage.getItem(key));
      const entry = (week.growthAlbum || []).find(item => item.id === entryId);
      if (!entry) return;
      entry.parentComment = trimmed;
      entry.updatedAt = new Date().toISOString();
      week.updatedAt = entry.updatedAt;
      localStorage.setItem(key, JSON.stringify(week));
      if (state.familyId) saveToCloud();
    } catch (e) {}
  }

  function resizeImageFile(file, size = 320) {
    return new Promise((resolve, reject) => {
      if (!file.type || !file.type.startsWith('image/')) {
        reject(new Error('Invalid image'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Read failed'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image decode failed'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const minSide = Math.min(img.width, img.height);
          const sx = Math.max(0, (img.width - minSide) / 2);
          const sy = Math.max(0, (img.height - minSide) / 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function drawSavingsChart(canvas, labels, values, theme) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width || canvas.parentElement.clientWidth || 320));
    const height = Math.max(1, Math.floor(rect.height || 180));
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 14, right: 10, bottom: 28, left: 36 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const maxValue = Math.max(100, ...values);

    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (chartH / 3) * i;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
    }
    ctx.stroke();

    const gap = 8;
    const barW = Math.max(10, (chartW - gap * (values.length - 1)) / values.length);
    values.forEach((value, index) => {
      const x = pad.left + index * (barW + gap);
      const barH = value ? Math.max(8, (value / maxValue) * chartH) : 4;
      const y = pad.top + chartH - barH;
      const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      roundRect(ctx, x, y, barW, barH, 6);
      ctx.fill();

      ctx.fillStyle = theme.textColor;
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + barW / 2, height - 8);
    });
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function renderAdventureRoadmap() {
    if (!elements.adventureRoadmap) return;
    const visibleKids = state.appMode === 'child'
      ? [getActiveKid()].filter(Boolean)
      : kids;
    const summary = summarizeWeek();
    const totalProgress = summary.total ? (summary.done / summary.total) : 0;

    checkLandmarkEvents(totalProgress);

    elements.adventureRoadmap.innerHTML = `
      <div class="goal-board">
        <header class="goal-board__header">
          <div>
            <p class="goal-board__eyebrow">ほしいもの作戦ボード</p>
            <h3>${state.appMode === 'child' ? '何のために貯める？' : '子供ごとの目標'}</h3>
          </div>
          <span class="goal-board__count">${visibleKids.length}件</span>
        </header>
        <div class="goal-board__grid">
          ${visibleKids.map(kid => createGoalBoardCard(kid)).join('')}
        </div>
      </div>
    `;
  }

  function createGoalBoardCard(kid) {
    const bank = Math.max(0, kid.bank || 0);
    const goalAmount = Math.max(0, kid.goalAmount || 0);
    const remaining = Math.max(0, goalAmount - bank);
    const progress = goalAmount ? Math.min(100, Math.round((bank / goalAmount) * 100)) : 0;
    const goalName = kid.goal || 'ほしいもの';
    const imageSrc = getKidGoalImageSrc(kid);
    const isComplete = goalAmount > 0 && bank >= goalAmount;
    const lastEvent = getVisibleGoalEvent(kid);
    const history = Array.isArray(kid.goalHistory) ? kid.goalHistory : [];
    const activeItemEvent = getActiveItemEvent(kid);
    const itemEvents = Array.isArray(kid.itemEvents) ? kid.itemEvents : [];
    const childLine = isComplete
      ? `${goalName}に届きました。次の目標をおうちの人と決めよう。`
      : `あと ${remaining.toLocaleString()}円で ${goalName}`;

    return `
      <article class="goal-card ${isComplete ? 'is-complete' : ''} ${lastEvent ? 'is-just-updated' : ''}" style="--kid-color:${kid.color}">
        <div class="goal-card__image">
          ${imageSrc ? `<img src="${imageSrc}" alt="${escapeHtml(goalName)}">` : `<span>${escapeHtml(getGoalInitial(goalName))}</span>`}
          ${lastEvent ? `<div class="goal-card__gain">+¥${(lastEvent.amount || 0).toLocaleString()}</div>` : ''}
        </div>
        <div class="goal-card__body">
          <div class="goal-card__profile">
            <img src="${getKidAvatarSrc(kid)}" alt="${escapeHtml(kid.name)}">
            <span>${escapeHtml(kid.name)}の目標</span>
          </div>
          <h4>${escapeHtml(goalName)}</h4>
          <p>${escapeHtml(childLine)}</p>
          <div class="goal-card__money">
            <strong>¥${bank.toLocaleString()}</strong>
            <span>/ ¥${goalAmount.toLocaleString()}</span>
          </div>
          <div class="goal-card__bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
            <div class="goal-card__fill" style="width:${progress}%"></div>
          </div>
          <div class="goal-card__footer">
            <span>${progress}%</span>
            <span>${isComplete ? '達成' : `あと ¥${remaining.toLocaleString()}`}</span>
          </div>
          ${activeItemEvent ? `
            <div class="goal-item-event goal-item-event--${escapeHtml(activeItemEvent.effect || 'board-event')}">
              <span class="goal-item-event__icon">${escapeHtml(activeItemEvent.icon || '✨')}</span>
              <div>
                <strong>${escapeHtml(activeItemEvent.name || '作戦アイテム')}</strong>
                <span>${escapeHtml(activeItemEvent.message || '作戦ボードにイベントが起きました。')}</span>
              </div>
            </div>
          ` : ''}
          ${isComplete ? `
            <div class="goal-card__next">
              <strong>目標達成！</strong>
              <span>保護者設定で次のほしいものを選ぼう。</span>
            </div>
          ` : ''}
          ${history.length ? `
            <details class="goal-history">
              <summary>達成した目標 ${history.length}件</summary>
              <ul>
                ${history.slice(0, 5).map(item => `
                  <li>
                    <span>${escapeHtml(item.goal || '目標')}</span>
                    <small>${formatGoalHistoryDate(item.completedAt)} / ¥${(item.goalAmount || 0).toLocaleString()}</small>
                  </li>
                `).join('')}
              </ul>
            </details>
          ` : ''}
          ${itemEvents.length ? `
            <details class="goal-item-history">
              <summary>アイテムイベント ${itemEvents.length}件</summary>
              <ul>
                ${itemEvents.slice(0, 5).map(event => `
                  <li>
                    <span>${escapeHtml(event.icon || '✨')} ${escapeHtml(event.name || 'アイテム')}</span>
                    <small>${escapeHtml(getItemEffectLabel(event.effect))} / ${formatGoalHistoryDate(event.time)}</small>
                  </li>
                `).join('')}
              </ul>
            </details>
          ` : ''}
        </div>
      </article>
    `;
  }

  function getActiveItemEvent(kid) {
    if (!kid || !kid.activeItemEvent) return null;
    const elapsed = Date.now() - new Date(kid.activeItemEvent.time || 0).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 1000 * 60 * 60 * 24 * 3) return null;
    return kid.activeItemEvent;
  }

  function getVisibleGoalEvent(kid) {
    if (!kid || !kid.lastGoalEvent) return null;
    const elapsed = Date.now() - new Date(kid.lastGoalEvent.time || 0).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > GOAL_EVENT_VISIBLE_MS) return null;
    return kid.lastGoalEvent;
  }

  function formatGoalHistoryDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function getKidGoalImageSrc(kid) {
    if (kid && kid.goalImageDataUrl) return kid.goalImageDataUrl;
    return '';
  }

  function getGoalInitial(goalName) {
    const text = String(goalName || '目標').trim();
    return text ? text.slice(0, 1) : '目';
  }

  function checkLandmarkEvents(progress) {
    if (!state.weekData) return;
    if (state.weekData.lastSeenProgress === undefined) {
      state.weekData.lastSeenProgress = 0;
    }
    const lastSeen = state.weekData.lastSeenProgress;
    
    // 進行度が戻った場合（承認取消など）は更新だけして終了
    if (progress < lastSeen) {
      state.weekData.lastSeenProgress = progress;
      saveWeekData();
      return;
    }
    if (progress === lastSeen) return;

    const newLandmark = ADVENTURE_LANDMARKS.find(lm => progress >= lm.progress && lastSeen < lm.progress);
    if (newLandmark && newLandmark.progress > 0) {
      awardGachaTickets('landmark');
      if (state.appMode === 'child') showGoalToast(newLandmark.msg, newLandmark.progress >= 1);
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
        <h2 class="event-title">${landmark.name}</h2>
        <div class="event-cloudon">
          <img src="characters/ip_cloudon.png?v=1" alt="クラウドん先生">
          <div class="event-bubble">
            <p>${landmark.msg}</p>
          </div>
        </div>
        <button class="button primary" style="width:100%; margin-top:20px;" onclick="document.getElementById('eventModal').classList.remove('is-active')">作戦ボードに戻る</button>
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
      state.kidPlanTemplates = payload.kidPlanTemplates || {};
      state.rewardSettings = normalizeRewardSettings(payload.rewardSettings);
    } catch (e) {
      console.warn('Config load failed', e);
    }
  }

  function saveConfig() {
    if (!storageAvailable) return;
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ kids, tasks, slotsPerKid: SLOTS_PER_KID, familyId: state.familyId, kidPlanTemplates: state.kidPlanTemplates, rewardSettings: state.rewardSettings }));
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
        if (storedDay.celebrated) day.celebrated = true;
        kids.forEach(kid => {
          const storedSlots = storedDay.slots && storedDay.slots[kid.id] ? storedDay.slots[kid.id] : [];
          if (day.slots[kid.id]) {
            day.slots[kid.id] = day.slots[kid.id].map((slot, sIdx) => {
              const src = storedSlots[sIdx];
              if (!src) return slot;
              const taskId = src.taskId && validTaskIds.has(src.taskId) ? src.taskId : null;
              return {
                taskId,
                status: taskId ? (src.status || 'todo') : 'unset',
                earnedTxId: src.earnedTxId || null,
                growthAlbumId: src.growthAlbumId || null,
                reportedAt: src.reportedAt || null,
                approvedAt: src.approvedAt || null
              };
            });
          }
        });
      });
      baseline.transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
      baseline.rewardExchanges = Array.isArray(payload.rewardExchanges) ? payload.rewardExchanges : [];
      baseline.growthAlbum = Array.isArray(payload.growthAlbum) ? payload.growthAlbum : [];
      baseline.growthAlbum = hydrateGrowthAlbumFromTransactions(baseline.growthAlbum, baseline.transactions, weekKey);
      baseline.familyMissionCelebrated = payload.familyMissionCelebrated === true;
      baseline.lastSeenProgress = typeof payload.lastSeenProgress === 'number' ? payload.lastSeenProgress : 0;
      return baseline;
    } catch (e) {
      return baseline;
    }
  }

  function saveWeekData() {
    if (!storageAvailable || !state.weekData || !state.weekKey) return;
    state.weekData.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_PREFIX + state.weekKey, JSON.stringify(state.weekData));
    if (state.familyId) saveToCloud();
  }

  // ─── Cloud Sync ───
  async function saveToCloud() {
    if (!state.familyId) return;
    try {
      const allData = buildSyncSnapshot();
      const res = await fetch(`/api/sync/${encodeURIComponent(state.familyId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: allData })
      });
      if (!res.ok) throw new Error(`Sync save failed: ${res.status}`);
      updateSyncUI('online');
      return true;
    } catch (e) {
      console.warn('Cloud save failed', e);
      updateSyncUI('error');
      return false;
    }
  }

  async function loadFromCloud(isInitial = false) {
    if (!state.familyId) return false;
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(state.familyId)}`);
      if (!res.ok) throw new Error(`Sync load failed: ${res.status}`);
      const result = await res.json();
      if (result.data) {
        const cloud = result.data;
        
        // 設定の同期
        if (cloud.config) {
          kids = normalizeKids(cloud.config.kids);
          tasks = normalizeTasks(cloud.config.tasks);
          refreshTaskLookup();
          SLOTS_PER_KID = cloud.config.slotsPerKid || 3;
          state.kidPlanTemplates = cloud.config.kidPlanTemplates || {};
          state.rewardSettings = normalizeRewardSettings(cloud.config.rewardSettings);
        }

        const weekMerged = restoreSyncedWeeks(cloud);
        const cleaned = cleanupInvalidTaskReferences();
        if (weekMerged || cleaned) {
          state.weekData = loadWeekData(state.weekKey, state.weekStart);
        }
        
        if (isInitial) {
          saveConfig();
          saveWeekData();
          render();
        } else {
          if (cleaned) {
            saveConfig();
            saveWeekData();
          }
          render();
        }
        updateSyncUI('online');
        return true;
      }
      updateSyncUI('online');
      return true;
    } catch (e) {
      console.warn('Cloud load failed', e);
      updateSyncUI('error');
      return false;
    }
  }

  function buildSyncSnapshot() {
    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      config: {
        kids,
        tasks,
        slotsPerKid: SLOTS_PER_KID,
        familyId: state.familyId,
        kidPlanTemplates: state.kidPlanTemplates,
        rewardSettings: state.rewardSettings
      },
      currentWeekKey: state.weekKey,
      weeks: collectStoredWeeksForSync()
    };
  }

  function collectStoredWeeksForSync() {
    const weeks = {};
    if (!storageAvailable) return weeks;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      try {
        const week = JSON.parse(localStorage.getItem(key));
        if (week) weeks[key] = normalizeWeekForSync(week);
      } catch (e) {}
    }

    if (state.weekKey && state.weekData) {
      weeks[STORAGE_PREFIX + state.weekKey] = normalizeWeekForSync(state.weekData);
    }

    return weeks;
  }

  function normalizeWeekForSync(week) {
    const normalized = { ...(week || {}) };
    if (!normalized.updatedAt) normalized.updatedAt = new Date().toISOString();
    return normalized;
  }

  function restoreSyncedWeeks(cloud) {
    if (!storageAvailable || !cloud) return false;
    let changed = false;

    const cloudWeeks = cloud.weeks && typeof cloud.weeks === 'object'
      ? cloud.weeks
      : cloud.weekKey && cloud.weekData
        ? { [STORAGE_PREFIX + cloud.weekKey]: cloud.weekData }
        : {};

    Object.entries(cloudWeeks).forEach(([rawKey, cloudWeek]) => {
      if (!cloudWeek) return;
      const key = normalizeWeekStorageKey(rawKey);
      if (!key) return;

      const cloudUpdatedAt = getWeekUpdatedAt(cloudWeek);
      let localWeek = null;
      try {
        const rawLocal = localStorage.getItem(key);
        if (rawLocal) localWeek = JSON.parse(rawLocal);
      } catch (e) {}

      const localUpdatedAt = getWeekUpdatedAt(localWeek);
      if (!localWeek || cloudUpdatedAt >= localUpdatedAt) {
        localStorage.setItem(key, JSON.stringify(normalizeWeekForSync(cloudWeek)));
        changed = true;
      }
    });

    return changed;
  }

  function normalizeWeekStorageKey(key) {
    const raw = String(key || '').trim();
    if (!raw) return '';
    return raw.startsWith(STORAGE_PREFIX) ? raw : STORAGE_PREFIX + raw.replace(STORAGE_PREFIX, '');
  }

  function getWeekUpdatedAt(week) {
    if (!week) return 0;
    const value = week.updatedAt || week.modifiedAt || week.timestamp || '';
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  function updateSyncUI(status) {
    if (!elements.syncStatus) return;
    const dot = elements.syncStatus.querySelector('.status-dot');
    const text = elements.syncStatus.querySelector('.status-text');
    
    elements.syncStatus.classList.remove('is-online', 'is-error');
    
    if (status === 'online') {
      elements.syncStatus.classList.add('is-online');
      text.textContent = '家族ログイン中';
    } else if (status === 'connecting') {
      text.textContent = 'ログイン確認中...';
    } else if (status === 'error') {
      elements.syncStatus.classList.add('is-error');
      text.textContent = 'ログインエラー';
    } else {
      text.textContent = 'オフラインモード';
    }
  }

  function createEmptyWeekData(weekStart) {
    return {
      transactions: [],
      rewardExchanges: [],
      growthAlbum: [],
      familyMissionCelebrated: false,
      lastSeenProgress: 0,
      days: Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + offset);
        const slots = {};
        kids.forEach(k => {
          slots[k.id] = Array.from({ length: SLOTS_PER_KID }, () => ({ taskId: null, status: 'unset', earnedTxId: null }));
        });
        return { dateISO: toISO(date), slots };
      })
    };
  }

  function getDefaultRewardShopItems() {
    return DEFAULT_REWARD_SETTINGS.rewardShopItems.map(item => ({ ...item }));
  }

  function getFamilyMissionProgress() {
    const mission = state.rewardSettings.familyMission || DEFAULT_REWARD_SETTINGS.familyMission;
    const target = Math.max(1, parseInt(mission.target) || 1);
    const contributions = kids.map(kid => ({
      kidId: kid.id,
      name: kid.name,
      color: kid.color,
      avatarSrc: getKidAvatarSrc(kid),
      done: 0,
      amount: 0
    }));
    let totalDone = 0;
    let totalAmount = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    (state.weekData?.days || []).forEach(day => {
      let dayDone = 0;
      contributions.forEach(entry => {
        const slots = day.slots?.[entry.kidId] || [];
        slots.forEach(slot => {
          if (slot.status !== 'done' || !slot.taskId) return;
          const task = taskMap.get(slot.taskId);
          const reward = task ? task.reward || 0 : 0;
          entry.done += 1;
          entry.amount += reward;
          totalDone += 1;
          totalAmount += reward;
          dayDone += 1;
        });
      });
      if (dayDone > 0) {
        currentStreak += 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    const conditionType = getValidFamilyMissionCondition(mission.conditionType);
    const current = conditionType === 'total-money' ? totalAmount : conditionType === 'streak-days' ? maxStreak : totalDone;
    const percent = Math.min(100, Math.round((current / target) * 100));
    return {
      ...mission,
      conditionType,
      target,
      current,
      percent,
      achieved: current >= target,
      unit: getFamilyMissionUnit(conditionType),
      conditionLabel: getFamilyMissionConditionLabel(conditionType),
      totalDone,
      totalAmount,
      maxStreak,
      contributions
    };
  }

  function getValidFamilyMissionCondition(value) {
    return ['done-count', 'total-money', 'streak-days'].includes(value) ? value : 'done-count';
  }

  function getFamilyMissionUnit(type) {
    if (type === 'total-money') return '円';
    if (type === 'streak-days') return '日';
    return 'こ';
  }

  function getFamilyMissionConditionLabel(type) {
    if (type === 'total-money') return '今週の合計金額';
    if (type === 'streak-days') return '連続でできた日数';
    return '今週できたお手伝い';
  }

  function formatFamilyMissionValue(value, type) {
    if (type === 'total-money') return `¥${(value || 0).toLocaleString()}`;
    return `${value || 0}${getFamilyMissionUnit(type)}`;
  }

  // ─── Event Bindings ───
  function bindEvents() {
    // タブ切り替え
    elements.tabBtns.forEach(btn => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) btn.addEventListener('click', () => switchTab(tabId));
    });

    if (elements.enterParentMode) {
      elements.enterParentMode.addEventListener('click', enterParentMode);
    }
    if (elements.exitParentMode) {
      elements.exitParentMode.addEventListener('click', exitParentMode);
    }
    if (elements.approveAllParent) {
      elements.approveAllParent.addEventListener('click', approveAllPendingForWeek);
    }
    if (elements.approvalList) {
      elements.approvalList.addEventListener('click', event => {
        if (event.target.closest('#approveAllTodayFromTop')) {
          approveAllPendingForToday();
          return;
        }
        const rewardAction = event.target.closest('[data-reward-exchange-action]');
        if (rewardAction) {
          const exchangeItem = event.target.closest('[data-reward-exchange-id]');
          if (!exchangeItem) return;
          handleRewardExchangeAction(rewardAction.dataset.rewardExchangeAction, exchangeItem.dataset.rewardExchangeId);
          return;
        }
        const action = event.target.closest('[data-approval-action]');
        if (!action) return;
        const item = event.target.closest('[data-approval-item]');
        if (!item) return;
        if (action.dataset.approvalAction === 'undo-approval') {
          undoApproval(
            parseInt(item.dataset.dayIndex),
            item.dataset.kidId,
            parseInt(item.dataset.slotIndex)
          );
          return;
        }
        handleApprovalAction(
          action.dataset.approvalAction,
          parseInt(item.dataset.dayIndex),
          item.dataset.kidId,
          parseInt(item.dataset.slotIndex)
        );
      });
    }

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
    if (elements.kidQuickSwitch) {
      elements.kidQuickSwitch.addEventListener('click', event => {
        const button = event.target.closest('.kid-choice');
        if (!button) return;
        state.activeKidId = button.dataset.kidId;
        state.controlSelection.kidId = state.activeKidId;
        render();
      });
    }

    if (elements.dayQuickSwitch) {
      elements.dayQuickSwitch.addEventListener('click', event => {
        const button = event.target.closest('.day-chip');
        if (!button) return;
        state.controlSelection.dayIndex = parseInt(button.dataset.dayIndex);
        render();
      });
    }

    if (elements.parentActionPanel) {
      elements.parentActionPanel.addEventListener('click', event => {
        if (event.target.closest('#approveAllToday')) {
          approveAllPendingForSelectedDay();
        }
      });
    }

    if (elements.growthAlbumTabs) {
      elements.growthAlbumTabs.addEventListener('click', event => {
        const button = event.target.closest('[data-album-kid-id]');
        if (!button) return;
        state.activeAlbumKidId = button.dataset.albumKidId;
        renderGrowthAlbum();
      });
    }

    if (elements.growthAlbumList) {
      elements.growthAlbumList.addEventListener('input', event => {
        if (!event.target.matches('[data-growth-comment]')) return;
        const card = event.target.closest('[data-growth-entry-id]');
        if (!card) return;
        updateGrowthAlbumComment(card.dataset.growthEntryId, card.dataset.growthWeekKey, event.target.value);
      });
    }

    if (elements.cardsContainer) {
      elements.cardsContainer.addEventListener('click', event => {
        const quickReportButton = event.target.closest('[data-action="open-quick-report"]');
        if (quickReportButton) {
          openQuickReportModal(quickReportButton.dataset.kidId);
          return;
        }

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
        const dayHeader = e.target.closest('.planner-day-panel summary');
        if (dayHeader) {
          const panel = dayHeader.closest('.planner-day-panel');
          if (panel) {
            state.controlSelection.dayIndex = parseInt(panel.dataset.dayIndex);
            renderPlanTemplatePanel();
          }
          return;
        }
        const target = e.target.closest('.planner-task-item') || e.target.closest('.planner-task') || e.target.closest('.planner-cell');
        if (!target) return;
        
        const dayIndex = parseInt(target.dataset.dayIndex);
        const kidId = target.dataset.kidId;
        const slotIndex = parseInt(target.dataset.slotIndex);
        state.controlSelection.dayIndex = dayIndex;
        state.controlSelection.kidId = kidId;
        state.controlSelection.slotIndex = slotIndex;
        
        openTaskPicker(taskId => {
          assignSlot(dayIndex, kidId, slotIndex, taskId);
          render();
        });
      });
    }

    if (elements.planTemplatePanel) {
      elements.planTemplatePanel.addEventListener('click', event => {
        const templateAction = event.target.closest('[data-plan-template-action]');
        if (templateAction) {
          handlePlanTemplateAction(templateAction.dataset.planTemplateAction);
          return;
        }
        const kidAction = event.target.closest('[data-kid-template-action]');
        if (kidAction) {
          handleKidTemplateAction(kidAction.dataset.kidTemplateAction, kidAction.dataset.kidId);
        }
      });
    }

    if (elements.bankbookTabs) {
      elements.bankbookTabs.addEventListener('click', event => {
        const button = event.target.closest('[data-bank-kid-id]');
        if (!button) return;
        state.activeBankKidId = button.dataset.bankKidId;
        renderBankbook();
      });
    }

    if (elements.rewardSettingsPanel) {
      elements.rewardSettingsPanel.addEventListener('change', handleRewardSettingsChange);
      elements.rewardSettingsPanel.addEventListener('input', handleRewardSettingsChange);
      elements.rewardSettingsPanel.addEventListener('click', handleRewardShopClick);
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
    if (elements.closeQuickReport) {
      elements.closeQuickReport.addEventListener('click', closeQuickReportModal);
    }
    if (elements.quickReportModal) {
      elements.quickReportModal.addEventListener('click', e => {
        if (e.target === elements.quickReportModal) closeQuickReportModal();
      });
    }
    if (elements.confirmQuickReport) {
      elements.confirmQuickReport.addEventListener('click', confirmQuickReport);
    }

    // 設定画面：追加ボタン
    if (elements.addKid) elements.addKid.addEventListener('click', () => addKid());
    if (elements.addTask) elements.addTask.addEventListener('click', () => addTask());

    // 設定画面：一括操作
    if (elements.controlAutoDistribute) {
      elements.controlAutoDistribute.addEventListener('click', () => {
        if (confirm('週全体のお手伝い予定をおまかせで作成しますか？')) {
          resetCompletedRewardsForWeek();
          autoDistributeWeek();
          saveConfig();
          saveWeekData();
          render();
        }
      });
    }
    if (elements.controlClearWeek) {
      elements.controlClearWeek.addEventListener('click', () => {
        if (confirm('今週のすべての設定をリセットしますか？')) {
          resetCompletedRewardsForWeek();
          state.weekData = createEmptyWeekData(state.weekStart);
          saveConfig();
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
        showCalendarDetail(cell.dataset.date);
      });
    }

    // 編集モードトグル
    if (elements.bottomAdultToggle) elements.bottomAdultToggle.addEventListener('click', toggleEditMode);
    
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
    const gachaArea = document.getElementById('gachaArea');
    if (gachaArea) {
      gachaArea.addEventListener('click', event => {
        const requestButton = event.target.closest('[data-reward-request]');
        if (!requestButton) return;
        requestRewardExchange(requestButton.dataset.rewardRequest);
      });
    }
    
    // クラウド同期
    if (elements.btnStartSync) {
      elements.btnStartSync.addEventListener('click', async () => {
        const fid = normalizeFamilyId(elements.syncFamilyId.value);
        if (!fid) {
          alert('家族の合言葉を入力してください。使える文字は、英数字・ハイフン・アンダーバーです。');
          return;
        }
        elements.syncFamilyId.value = fid;
        state.familyId = fid;
        updateSyncUI('connecting');
        saveConfig();
        const connected = await loadFromCloud(true);
        if (connected) {
          alert('家族ログインできました。他のデバイスでも同じ合言葉を入力してください。');
        } else {
          state.familyId = null;
          saveConfig();
          alert('ログインできませんでした。python server.py でアプリを起動してから、もう一度お試しください。');
        }
      });
    }
    
    if (elements.resetAll) elements.resetAll.addEventListener('click', () => {
      if (!confirm('週全体のすべてのステータス（できた！等）をリセットしますか？')) return;
      resetCompletedRewardsForWeek();
      state.weekData.days.forEach(day => {
        Object.values(day.slots).forEach(slots => {
          slots.forEach(s => {
            if (s.taskId) {
              s.status = 'todo';
              s.earnedTxId = null;
            }
          });
        });
      });
      saveConfig();
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

  function showChildReportFeedback(kid, task) {
    document.querySelectorAll('.child-report-toast').forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = 'child-report-toast';
    toast.innerHTML = `
      <span class="child-report-toast__icon">✓</span>
      <span><strong>${escapeHtml(kid.name)}</strong> ${escapeHtml(task.label)}を報告したよ</span>
    `;
    document.body.appendChild(toast);
    playTone(659.25, 'sine', 0.12, 0.18);
    setTimeout(() => playTone(783.99, 'sine', 0.12, 0.16), 110);
    setTimeout(() => toast.classList.add('is-leaving'), 1200);
    setTimeout(() => toast.remove(), 1550);
  }

  function handleGoalProgressAfterEarn(kid, task, previousBank) {
    if (!kid || !task) return;
    const amount = task.reward || 0;
    const goalAmount = Math.max(0, kid.goalAmount || 0);
    const currentBank = Math.max(0, kid.bank || 0);
    const fromProgress = goalAmount ? Math.min(100, Math.round((Math.max(0, previousBank || 0) / goalAmount) * 100)) : 0;
    const toProgress = goalAmount ? Math.min(100, Math.round((currentBank / goalAmount) * 100)) : 0;
    const completed = goalAmount > 0 && (previousBank || 0) < goalAmount && currentBank >= goalAmount;

    kid.lastGoalEvent = {
      amount,
      fromProgress,
      toProgress,
      completed,
      goal: kid.goal || '目標',
      time: new Date().toISOString()
    };

    if (completed) {
      recordGoalCompletion(kid);
      showGoalCompleteFeedback(kid);
    } else {
      showGoalProgressFeedback(kid, amount);
    }
  }

  function recordGoalCompletion(kid) {
    if (!kid) return;
    const goalName = kid.goal || '目標';
    const goalAmount = Math.max(0, kid.goalAmount || 0);
    kid.goalHistory = Array.isArray(kid.goalHistory) ? kid.goalHistory : [];
    const alreadyRecorded = kid.goalHistory.some(item =>
      item.goal === goalName &&
      Number(item.goalAmount || 0) === goalAmount &&
      item.completedAt &&
      Math.abs(new Date(item.completedAt).getTime() - Date.now()) < 5000
    );
    if (alreadyRecorded) return;

    kid.goalHistory.unshift({
      id: generateId('goal'),
      goal: goalName,
      goalAmount,
      bankAt: Math.max(0, kid.bank || 0),
      completedAt: new Date().toISOString()
    });
    if (kid.goalHistory.length > 12) kid.goalHistory = kid.goalHistory.slice(0, 12);
  }

  function showGoalProgressFeedback(kid, amount) {
    if (!kid || state.appMode === 'parent') return;
    showGoalToast(`${kid.name}の目標に +¥${amount.toLocaleString()} 近づいたよ`, false);
  }

  function showGoalCompleteFeedback(kid) {
    showGoalToast(`${kid.name}の「${kid.goal || '目標'}」に届いたよ`, true);
    setTimeout(() => {
      playFanfare();
      if (window.confetti) {
        window.confetti({ particleCount: 42, spread: 44, origin: { y: 0.72 }, zIndex: 3000 });
      }
    }, 140);
  }

  function showGoalToast(message, complete) {
    document.querySelectorAll('.goal-progress-toast').forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = `goal-progress-toast ${complete ? 'is-complete' : ''}`;
    toast.innerHTML = `
      <span class="goal-progress-toast__icon">${complete ? '🎉' : '¥'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('is-leaving'), complete ? 1600 : 1100);
    setTimeout(() => toast.remove(), complete ? 1950 : 1400);
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
        const previousBank = kid.bank || 0;
        kid.bank += (task.reward || 0);
        handleGoalProgressAfterEarn(kid, task, previousBank);
      } else if (prevStatus === 'done' && nextStatus !== 'done') {
        kid.bank = Math.max(0, kid.bank - (task.reward || 0));
      }
    } else {
      // 子供モード: todo -> pending のみに制限（または pending のまま）
      if (prevStatus === 'todo') {
        nextStatus = 'pending';
        slot.reportedAt = new Date().toISOString();
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
        recordTransaction(slot, kid, task, 'earn');
        handleTicketAwardOnApproval(kid, dayIndex);
      } else if (prevStatus === 'done' && nextStatus !== 'done') {
        recordTransaction(slot, kid, task, 'undo');
      }
      
      saveConfig();
      saveWeekData();
      if (!state.editMode && prevStatus === 'todo' && nextStatus === 'pending') {
        showChildReportFeedback(kid, task);
      }
      
      // 100%達成チェック
      const day = state.weekData.days[dayIndex];
      const summary = summarizeDay(day);
      if (nextStatus === 'done' && summary.done === summary.total && summary.total > 0) {
        if (!day.celebrated) {
          day.celebrated = true;
          setTimeout(() => {
            playFanfare();
            if (window.confetti) {
              window.confetti({ particleCount: 45, spread: 50, origin: { y: 0.7 }, zIndex: 3000 });
            }
          }, 180);
        }
      } else if (summary.done < summary.total) {
        day.celebrated = false;
      }
      
      render();
    }
  }

  function recordTransaction(slot, kid, task, type) {
    if (!state.weekData.transactions) state.weekData.transactions = [];

    if (type === 'earn') {
      if (slot.earnedTxId) return;
      const tx = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kidId: kid.id,
        kidName: kid.name,
        taskName: task ? task.label : 'お手伝い',
        amount: task ? (task.reward || 0) : 0,
        type: 'earn',
        time: new Date().toISOString()
      };
      slot.earnedTxId = tx.id;
      state.weekData.transactions.unshift(tx);
      recordGrowthAlbumEntry(slot, kid, task, tx);
    }

    if (type === 'undo' && slot.earnedTxId) {
      state.weekData.transactions.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kidId: kid.id,
        kidName: kid.name,
        taskName: task ? `${task.label}（取消）` : 'お手伝い（取消）',
        amount: -(task ? (task.reward || 0) : 0),
        type: 'undo',
        originalTxId: slot.earnedTxId,
        time: new Date().toISOString()
      });
      markGrowthAlbumEntryCanceled(slot.growthAlbumId);
      slot.earnedTxId = null;
    }

    if (state.weekData.transactions.length > 80) {
      state.weekData.transactions = state.weekData.transactions.slice(0, 80);
    }
  }

  function recordGrowthAlbumEntry(slot, kid, task, transaction) {
    if (!slot || !kid || !transaction) return;
    if (!state.weekData.growthAlbum) state.weekData.growthAlbum = [];
    if (slot.growthAlbumId && state.weekData.growthAlbum.some(entry => entry.id === slot.growthAlbumId)) return;
    const entry = {
      id: generateId('growth'),
      weekKey: state.weekKey,
      kidId: kid.id,
      kidName: kid.name,
      kidColor: kid.color,
      taskName: task ? task.label : 'お手伝い',
      taskIcon: task ? task.icon || '⭐' : '⭐',
      amount: task ? task.reward || 0 : 0,
      transactionId: transaction.id,
      dateISO: toISO(new Date(transaction.time)),
      time: transaction.time,
      parentComment: '',
      status: 'active'
    };
    slot.growthAlbumId = entry.id;
    state.weekData.growthAlbum.unshift(entry);
    if (state.weekData.growthAlbum.length > 120) state.weekData.growthAlbum = state.weekData.growthAlbum.slice(0, 120);
  }

  function markGrowthAlbumEntryCanceled(entryId) {
    if (!entryId || !state.weekData.growthAlbum) return;
    const entry = state.weekData.growthAlbum.find(item => item.id === entryId);
    if (!entry) return;
    entry.status = 'canceled';
    entry.canceledAt = new Date().toISOString();
  }

  function approveAllPendingForSelectedDay() {
    if (!state.editMode || !state.weekData) return;
    const dayIndex = state.controlSelection.dayIndex;
    const day = state.weekData.days[dayIndex];
    const pendingItems = getPendingItemsForDay(day, dayIndex);
    if (!pendingItems.length) return;

    pendingItems.forEach(item => {
      item.slot.status = 'done';
      item.slot.approvedAt = new Date().toISOString();
      const previousBank = item.kid.bank || 0;
      item.kid.bank += (item.task.reward || 0);
      recordTransaction(item.slot, item.kid, item.task, 'earn');
      handleTicketAwardOnApproval(item.kid, item.dayIndex);
      handleGoalProgressAfterEarn(item.kid, item.task, previousBank);
    });

    saveConfig();
    saveWeekData();
    render();
  }

  function approveAllPendingForToday() {
    if (state.appMode !== 'parent' || !state.weekData) return;
    const todayISO = toISO(new Date());
    const dayIndex = state.weekData.days.findIndex(day => day.dateISO === todayISO);
    if (dayIndex < 0) return;
    const pendingItems = getPendingItemsForDay(state.weekData.days[dayIndex], dayIndex);
    if (!pendingItems.length) return;

    pendingItems.forEach(item => {
      item.slot.status = 'done';
      item.slot.approvedAt = new Date().toISOString();
      const previousBank = item.kid.bank || 0;
      item.kid.bank += (item.task.reward || 0);
      recordTransaction(item.slot, item.kid, item.task, 'earn');
      handleTicketAwardOnApproval(item.kid, item.dayIndex);
      handleGoalProgressAfterEarn(item.kid, item.task, previousBank);
    });

    saveConfig();
    saveWeekData();
    render();
  }

  function approveAllPendingForWeek() {
    if (state.appMode !== 'parent' || !state.weekData) return;
    const pendingItems = getPendingItemsForWeek();
    if (!pendingItems.length) return;

    pendingItems.forEach(item => {
      item.slot.status = 'done';
      item.slot.approvedAt = new Date().toISOString();
      const previousBank = item.kid.bank || 0;
      item.kid.bank += (item.task.reward || 0);
      recordTransaction(item.slot, item.kid, item.task, 'earn');
      handleTicketAwardOnApproval(item.kid, item.dayIndex);
      handleGoalProgressAfterEarn(item.kid, item.task, previousBank);
    });

    saveConfig();
    saveWeekData();
    render();
  }

  function handleApprovalAction(action, dayIndex, kidId, slotIndex) {
    if (state.appMode !== 'parent') return;
    const slot = getSlot(dayIndex, kidId, slotIndex);
    if (!slot || slot.status !== 'pending' || !slot.taskId) return;
    const kid = kids.find(k => k.id === kidId);
    const task = taskMap.get(slot.taskId);
    if (!kid || !task) return;

    if (action === 'approve') {
      slot.status = 'done';
      slot.approvedAt = new Date().toISOString();
      const previousBank = kid.bank || 0;
      kid.bank += (task.reward || 0);
      recordTransaction(slot, kid, task, 'earn');
      handleTicketAwardOnApproval(kid, dayIndex);
      handleGoalProgressAfterEarn(kid, task, previousBank);
      playCoinSound();
    } else if (action === 'return') {
      slot.status = 'todo';
      slot.reportedAt = null;
      slot.approvedAt = null;
    }

    saveConfig();
    saveWeekData();
    render();
  }

  function undoApproval(dayIndex, kidId, slotIndex) {
    if (state.appMode !== 'parent') return;
    const slot = getSlot(dayIndex, kidId, slotIndex);
    if (!slot || slot.status !== 'done' || !slot.taskId || !slot.earnedTxId) return;
    const kid = kids.find(k => k.id === kidId);
    const task = taskMap.get(slot.taskId);
    if (!kid || !task) return;

    kid.bank = Math.max(0, (kid.bank || 0) - (task.reward || 0));
    recordTransaction(slot, kid, task, 'undo');
    slot.status = 'pending';
    slot.approvedAt = null;

    saveConfig();
    saveWeekData();
    render();
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

  function handlePlanTemplateAction(action) {
    if (!state.weekData) return;
    if (action === 'copy-last-week') {
      copyPreviousWeekPlan();
    } else if (action === 'copy-weekday') {
      copyDayPlanToDays(0, [1, 2, 3, 4]);
    } else if (action === 'copy-weekend') {
      copyDayPlanToDays(5, [6]);
    } else if (action === 'copy-everyday') {
      copyDayPlanToDays(state.controlSelection.dayIndex, [0, 1, 2, 3, 4, 5, 6].filter(i => i !== state.controlSelection.dayIndex));
    }
    saveConfig();
    saveWeekData();
    render();
  }

  function handleKidTemplateAction(action, kidId) {
    if (!kidId || !state.weekData) return;
    if (action === 'save') {
      state.kidPlanTemplates[kidId] = state.weekData.days.map(day => {
        const slots = day.slots[kidId] || [];
        return slots.map(slot => slot.taskId || null);
      });
    } else if (action === 'apply') {
      const template = state.kidPlanTemplates[kidId];
      if (!template) return;
      state.weekData.days.forEach((day, dayIndex) => {
        const pattern = template[dayIndex] || [];
        for (let slotIndex = 0; slotIndex < SLOTS_PER_KID; slotIndex++) {
          assignSlot(dayIndex, kidId, slotIndex, pattern[slotIndex] || null);
        }
      });
    } else if (action === 'clear') {
      delete state.kidPlanTemplates[kidId];
    }
    saveConfig();
    saveWeekData();
    render();
  }

  function copyPreviousWeekPlan() {
    if (!state.weekStart) return;
    const prevStart = new Date(state.weekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevWeek = loadWeekData(buildWeekKey(prevStart), prevStart);
    state.weekData.days.forEach((day, dayIndex) => {
      kids.forEach(kid => {
        const sourceSlots = (prevWeek.days[dayIndex] && prevWeek.days[dayIndex].slots[kid.id]) || [];
        for (let slotIndex = 0; slotIndex < SLOTS_PER_KID; slotIndex++) {
          assignSlot(dayIndex, kid.id, slotIndex, sourceSlots[slotIndex]?.taskId || null);
        }
      });
    });
  }

  function copyDayPlanToDays(sourceDayIndex, targetDayIndexes) {
    const sourceDay = state.weekData.days[sourceDayIndex];
    if (!sourceDay) return;
    targetDayIndexes.forEach(dayIndex => {
      kids.forEach(kid => {
        const sourceSlots = sourceDay.slots[kid.id] || [];
        for (let slotIndex = 0; slotIndex < SLOTS_PER_KID; slotIndex++) {
          assignSlot(dayIndex, kid.id, slotIndex, sourceSlots[slotIndex]?.taskId || null);
        }
      });
    });
  }

  function autoDistributeWeek() {
    if (!state.weekData || !tasks.length) return;
    const taskPool = [...tasks];
    const globalCount = new Map(taskPool.map(t => [t.id, 0]));
    const kidTaskCount = new Map(kids.map(kid => [kid.id, new Map(taskPool.map(t => [t.id, 0]))]));
    const kidPrevDayTasks = new Map(kids.map(kid => [kid.id, new Set()]));
    const kidSlotLastTask = new Map(kids.map(kid => [kid.id, Array(SLOTS_PER_KID).fill(null)]));
    const kidSlotTaskCount = new Map(kids.map(kid => [kid.id, Array.from({ length: SLOTS_PER_KID }, () => new Map(taskPool.map(t => [t.id, 0])))]));
    const kidPastRows = new Map(kids.map(kid => [kid.id, new Set()]));

    state.weekData.days.forEach((day, dIdx) => {
      const familyUsedToday = new Set();
      const kidTodayTasks = new Map(kids.map(kid => [kid.id, new Set()]));
      const kidTodayRows = new Map(kids.map(kid => [kid.id, []]));
      const kidOrder = rotateArray(kids, dIdx % Math.max(1, kids.length));

      kids.forEach((kid, kIdx) => {
        const orderedKid = kidOrder[kIdx] || kid;
        const prevDayTasks = kidPrevDayTasks.get(orderedKid.id) || new Set();
        const slotLastTasks = kidSlotLastTask.get(orderedKid.id) || [];
        const todayTasks = kidTodayTasks.get(orderedKid.id) || new Set();
        const todayRow = kidTodayRows.get(orderedKid.id) || [];
        const pastRows = kidPastRows.get(orderedKid.id) || new Set();
        const personalCount = kidTaskCount.get(orderedKid.id) || new Map();
        const slotCounts = kidSlotTaskCount.get(orderedKid.id) || [];

        for (let sIdx = 0; sIdx < SLOTS_PER_KID; sIdx++) {
          const selected = pickBalancedTask({
            taskPool,
            dayIndex: dIdx,
            kidIndex: kIdx,
            slotIndex: sIdx,
            kid: orderedKid,
            todayTasks,
            todayRow,
            pastRows,
            prevDayTasks,
            slotLastTask: slotLastTasks[sIdx],
            slotTaskCount: slotCounts[sIdx],
            familyUsedToday,
            globalCount,
            personalCount
          });

          assignSlot(dIdx, orderedKid.id, sIdx, selected.id);
          globalCount.set(selected.id, (globalCount.get(selected.id) || 0) + 1);
          personalCount.set(selected.id, (personalCount.get(selected.id) || 0) + 1);
          if (slotCounts[sIdx]) slotCounts[sIdx].set(selected.id, (slotCounts[sIdx].get(selected.id) || 0) + 1);
          todayTasks.add(selected.id);
          todayRow[sIdx] = selected.id;
          familyUsedToday.add(selected.id);
          slotLastTasks[sIdx] = selected.id;
        }
      });

      kids.forEach(kid => {
        kidPrevDayTasks.set(kid.id, new Set(kidTodayTasks.get(kid.id) || []));
        const row = kidTodayRows.get(kid.id) || [];
        if (row.length) kidPastRows.get(kid.id).add(row.join('|'));
      });
    });
  }

  function pickBalancedTask(context) {
    const {
      taskPool,
      dayIndex,
      kidIndex,
      slotIndex,
      kid,
      todayTasks,
      todayRow,
      pastRows,
      prevDayTasks,
      slotLastTask,
      slotTaskCount,
      familyUsedToday,
      globalCount,
      personalCount
    } = context;

    return [...taskPool].sort((a, b) => {
      const aScore = scoreTaskForAutoPlan(a);
      const bScore = scoreTaskForAutoPlan(b);
      if (aScore !== bScore) return aScore - bScore;
      return seededTaskOrder(a.id, dayIndex, kid.id, slotIndex) - seededTaskOrder(b.id, dayIndex, kid.id, slotIndex);
    })[0];

    function scoreTaskForAutoPlan(task) {
      let score = 0;
      score += (globalCount.get(task.id) || 0) * 8;
      score += (personalCount.get(task.id) || 0) * 12;
      if (todayTasks.has(task.id) && taskPool.length > todayTasks.size) score += 260;
      if (prevDayTasks.has(task.id) && taskPool.length > SLOTS_PER_KID) score += 120;
      if (slotLastTask === task.id && taskPool.length > 1) score += 170;
      score += (slotTaskCount?.get(task.id) || 0) * 28;
      if (slotIndex === SLOTS_PER_KID - 1) {
        const candidateRow = [...todayRow.slice(0, slotIndex), task.id].join('|');
        if (pastRows.has(candidateRow)) score += 240;
      }
      if (familyUsedToday.has(task.id) && taskPool.length > kids.length) score += 18;
      score += ((dayIndex + 1) * 3 + (kidIndex + 1) * 5 + (slotIndex + 1) * 7 + taskPool.indexOf(task)) % 11;
      return score;
    }
  }

  function seededTaskOrder(taskId, dayIndex, kidId, slotIndex) {
    const seed = `${state.weekKey}|${taskId}|${kidId}|${dayIndex}|${slotIndex}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  function rotateArray(list, offset) {
    if (!list.length) return [];
    return list.map((_, index) => list[(index + offset) % list.length]);
  }

  function resetCompletedRewardsForWeek() {
    if (!state.weekData) return;
    state.weekData.days.forEach(day => {
      kids.forEach(kid => {
        const slots = day.slots[kid.id] || [];
        slots.forEach(slot => {
          if (slot.taskId && slot.status === 'done') {
            const task = taskMap.get(slot.taskId);
            if (task) {
              kid.bank = Math.max(0, (kid.bank || 0) - (task.reward || 0));
              recordTransaction(slot, kid, task, 'undo');
            }
          }
        });
      });
      day.celebrated = false;
    });
  }

  function ensureWeekHasPlan() {
    return;
  }

  function hasAnyAssignedTask(weekData) {
    return weekData.days.some(day => {
      return Object.values(day.slots).some(slots => slots.some(slot => slot.taskId));
    });
  }

  function getKidWeekEarnings(kidId) {
    if (!state.weekData) return 0;
    return state.weekData.days.reduce((sum, day) => {
      const slots = day.slots[kidId] || [];
      return sum + slots.reduce((slotSum, slot) => {
        if (slot.taskId && slot.status === 'done') {
          const task = taskMap.get(slot.taskId);
          return slotSum + (task ? (task.reward || 0) : 0);
        }
        return slotSum;
      }, 0);
    }, 0);
  }

  async function handleKidManagerChange(e) {
    const field = e.target.dataset.kidField;
    const kidId = e.target.closest('[data-kid-id]').dataset.kidId;
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;
    if (field === 'avatarFile') {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        kid.avatarDataUrl = await resizeImageFile(file, 320);
        saveConfig();
        render();
      } catch (error) {
        alert('画像の読み込みに失敗しました。別の画像でお試しください。');
      }
      return;
    }
    if (field === 'goalImageFile') {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        kid.goalImageDataUrl = await resizeImageFile(file, 640);
        saveConfig();
        render();
      } catch (error) {
        alert('目標画像の読み込みに失敗しました。別の画像でお試しください。');
      }
      return;
    }
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
    } else if (e.target.dataset.action === 'remove-avatar') {
      const kidId = e.target.closest('[data-kid-id]').dataset.kidId;
      const kid = kids.find(k => k.id === kidId);
      if (!kid) return;
      kid.avatarDataUrl = '';
      saveConfig();
      render();
    } else if (e.target.dataset.action === 'remove-goal-image') {
      const kidId = e.target.closest('[data-kid-id]').dataset.kidId;
      const kid = kids.find(k => k.id === kidId);
      if (!kid) return;
      kid.goalImageDataUrl = '';
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
      cleanupInvalidTaskReferences();
      saveConfig();
      saveWeekData();
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
      goalImageDataUrl: '',
      characterId: 'kakeru',
      avatarDataUrl: '',
      gachaTickets: 0,
      gachaItems: [],
      itemEvents: [],
      activeItemEvent: null,
      ticketProgress: 0
    };
    kids.push(newKid);
    saveConfig();
    render();
  }

  function addTask() {
    const newTask = {
      id: generateId('task'),
      label: `新しいお手伝い${tasks.length + 1}`,
      icon: '⭐',
      reward: 20
    };
    tasks.push(newTask);
    refreshTaskLookup();
    saveConfig();
    render();
  }

  function getRewardExchangeRequests() {
    if (!state.weekData) return [];
    if (!Array.isArray(state.weekData.rewardExchanges)) state.weekData.rewardExchanges = [];
    return state.weekData.rewardExchanges;
  }

  function getRewardExchangeHistory(limit = 8) {
    return getRewardExchangeRequests()
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.requestedAt || 0) - new Date(a.updatedAt || a.requestedAt || 0))
      .slice(0, limit);
  }

  function getRewardShopItem(rewardId) {
    return (state.rewardSettings.rewardShopItems || []).find(item => item.id === rewardId) || null;
  }

  function requestRewardExchange(rewardId) {
    const kid = getActiveKid();
    const item = getRewardShopItem(rewardId);
    if (!kid || !item || item.enabled === false) return;
    if (!canKidAffordReward(kid, item)) {
      showGoalToast(item.type === 'ticket' ? 'チケットが足りません。' : 'まだお金が足りません。', false);
      return;
    }
    const requests = getRewardExchangeRequests();
    const hasPending = requests.some(req => req.status === 'pending' && req.kidId === kid.id && req.rewardId === item.id);
    if (hasPending) {
      showGoalToast('このごほうびは申請中です。', false);
      return;
    }
    requests.unshift({
      id: generateId('exchange'),
      kidId: kid.id,
      kidName: kid.name,
      rewardId: item.id,
      rewardName: item.name,
      type: item.type,
      cost: item.cost,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    saveWeekData();
    renderGachaArea();
    showGoalToast(`${item.name}をおうちの人にお願いしました。`, false);
  }

  function handleRewardExchangeAction(action, exchangeId) {
    if (state.appMode !== 'parent') return;
    const request = getRewardExchangeRequests().find(req => req.id === exchangeId);
    if (!request || request.status !== 'pending') return;
    const kid = kids.find(k => k.id === request.kidId);
    if (!kid) return;
    if (action === 'approve-reward') {
      if (!canKidAffordReward(kid, request)) {
        alert('残高またはチケットが足りないため承認できません。');
        return;
      }
      if (request.type === 'ticket') {
        kid.gachaTickets = Math.max(0, (kid.gachaTickets || 0) - (request.cost || 0));
      } else {
        kid.bank = Math.max(0, (kid.bank || 0) - (request.cost || 0));
        recordRewardExchangeTransaction(request, kid);
      }
      request.status = 'approved';
      request.approvedAt = new Date().toISOString();
      request.updatedAt = request.approvedAt;
      request.parentNote = '承認済み';
      showGoalToast(`${kid.name}のごほうび交換を承認しました。`, false);
    } else if (action === 'return-reward') {
      request.status = 'returned';
      request.returnedAt = new Date().toISOString();
      request.updatedAt = request.returnedAt;
      request.parentNote = '戻しました';
    }
    saveConfig();
    saveWeekData();
    render();
  }

  function recordRewardExchangeTransaction(request, kid) {
    if (!state.weekData.transactions) state.weekData.transactions = [];
    state.weekData.transactions.unshift({
      id: generateId('tx'),
      kidId: kid.id,
      kidName: kid.name,
      taskName: `ごほうび交換: ${request.rewardName}`,
      amount: -(request.cost || 0),
      type: 'exchange',
      exchangeId: request.id,
      time: new Date().toISOString()
    });
    if (state.weekData.transactions.length > 80) {
      state.weekData.transactions = state.weekData.transactions.slice(0, 80);
    }
  }

  function getRewardExchangeStatusLabel(status) {
    if (status === 'approved') return '交換済み';
    if (status === 'returned') return '戻し';
    return '申請中';
  }

  function awardGachaTickets(reason, kid = null, dayIndex = null) {
    if (!state.rewardSettings.gachaEnabled) return false;
    const settings = state.rewardSettings;
    if (reason === 'landmark' && settings.ticketCondition !== 'landmark') return false;
    const targetKids = kid ? [kid] : kids;
    targetKids.forEach(targetKid => {
      targetKid.gachaTickets = (targetKid.gachaTickets || 0) + 1;
    });
    saveConfig();
    return true;
  }

  function handleTicketAwardOnApproval(kid, dayIndex) {
    if (!kid || !state.rewardSettings.gachaEnabled) return;
    const condition = state.rewardSettings.ticketCondition;
    if (condition === 'approvals') {
      kid.ticketProgress = (kid.ticketProgress || 0) + 1;
      const threshold = Math.max(1, state.rewardSettings.ticketEvery || 3);
      if (kid.ticketProgress >= threshold) {
        kid.ticketProgress = 0;
        awardGachaTickets('approvals', kid, dayIndex);
      }
      saveConfig();
      return;
    }

    if (condition === 'daily-complete') {
      const day = state.weekData && state.weekData.days[dayIndex];
      if (!day) return;
      const summary = summarizeKidDay(day, kid.id);
      if (!summary.total || summary.done < summary.total) return;
      if (!state.weekData.ticketAwards) state.weekData.ticketAwards = {};
      const awardKey = `daily-complete:${day.dateISO}:${kid.id}`;
      if (state.weekData.ticketAwards[awardKey]) return;
      state.weekData.ticketAwards[awardKey] = new Date().toISOString();
      awardGachaTickets('daily-complete', kid, dayIndex);
      saveWeekData();
    }
  }

  // ─── Gacha & Collection ───
  function renderGachaArea() {
    const area = document.getElementById('gachaArea');
    if (!area) return;
    if (elements.rewardPageLead) {
      elements.rewardPageLead.textContent = state.rewardSettings.gachaEnabled
        ? '家族のごほうびが主役。チケットはおまけです。'
        : 'ガチャはお休み中。家族で決めたごほうびを目指そう。';
    }
    if (elements.rewardPromise) {
      elements.rewardPromise.innerHTML = `
        <div class="reward-promise__main">
          <span class="reward-promise__label">えらべるごほうび</span>
          <strong>${escapeHtml(state.rewardSettings.rewardTitle)}</strong>
          <p>${escapeHtml(state.rewardSettings.rewardBody)}</p>
          <small>貯めたお金やチケットで交換を申請できます。交換はおうちの人が確認します。</small>
        </div>
      `;
    }
    const collectionButton = document.getElementById('btnOpenCollection');
    if (collectionButton) {
      collectionButton.hidden = !state.rewardSettings.gachaEnabled;
      collectionButton.textContent = '図鑑';
    }

    const missionHtml = renderFamilyMissionArea();
    const shopHtml = renderRewardShopArea();
    if (!state.rewardSettings.gachaEnabled) {
      area.innerHTML = `
        ${missionHtml}
        ${shopHtml}
        <div class="gacha-off-note">
          <strong>ガチャはお休み中</strong>
          <span>今日は家族のごほうびだけを見ながら進めよう。</span>
        </div>
      `;
      handleFamilyMissionAchievement();
      return;
    }
    
    area.innerHTML = `
      ${missionHtml}
      ${shopHtml}
      <section class="gacha-mini-panel" aria-label="おまけのガチャ">
        <div class="gacha-mini-panel__header">
          <div>
            <span>おまけ</span>
            <strong>チケットガチャ</strong>
          </div>
          <small>${escapeHtml(getTicketConditionText())}</small>
        </div>
        <div class="gacha-mini-list">
          ${kids.map(kid => {
            const tickets = kid.gachaTickets || 0;
            const avatarSrc = getKidAvatarSrc(kid);
            const latestItemEvent = Array.isArray(kid.itemEvents) ? kid.itemEvents[0] : null;
            return `
              <div class="gacha-kid-card" style="--kid-color:${kid.color}">
                <div class="gacha-kid-card__profile">
                  <img src="${avatarSrc}" alt="${escapeHtml(kid.name)}">
                  <div>
                    <strong>${escapeHtml(kid.name)}</strong>
                    <span>チケット ${tickets}枚</span>
                    ${latestItemEvent ? `<small>${escapeHtml(latestItemEvent.icon || '✨')} ${escapeHtml(getItemEffectLabel(latestItemEvent.effect))}: ${escapeHtml(latestItemEvent.name)}</small>` : ''}
                  </div>
                </div>
                <button class="button primary small" onclick="window.drawGacha('${kid.id}')" ${tickets <= 0 ? 'disabled' : ''}>引く</button>
              </div>
            `;
          }).join('')}
        </div>
        <div class="item-event-ledger">
          <div class="item-event-ledger__header">
            <strong>アイテム履歴</strong>
            <span>お金は増減しない、作戦ボード用のイベントです。</span>
          </div>
          ${kids.map(kid => {
            const events = Array.isArray(kid.itemEvents) ? kid.itemEvents.slice(0, 3) : [];
            if (!events.length) {
              return `
                <div class="item-event-ledger__empty" style="--kid-color:${kid.color}">
                  <strong>${escapeHtml(kid.name)}</strong>
                  <span>まだアイテムイベントはありません。</span>
                </div>
              `;
            }
            return `
              <div class="item-event-ledger__kid" style="--kid-color:${kid.color}">
                <strong>${escapeHtml(kid.name)}</strong>
                <ul>
                  ${events.map(event => `
                    <li>
                      <span>${escapeHtml(event.icon || '✨')} ${escapeHtml(event.name || 'アイテム')}</span>
                      <small>${escapeHtml(getItemEffectLabel(event.effect))} / お金の変更なし</small>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
    handleFamilyMissionAchievement();
  }

  function renderFamilyMissionArea() {
    const mission = getFamilyMissionProgress();
    if (!mission.enabled) return '';
    const topContribution = [...mission.contributions].sort((a, b) => b.done - a.done || b.amount - a.amount)[0];
    const statusText = mission.achieved
      ? `達成！家族ごほうび: ${mission.reward}`
      : `あと ${formatFamilyMissionValue(Math.max(0, mission.target - mission.current), mission.conditionType)}`;
    return `
      <section class="family-mission-panel ${mission.achieved ? 'is-achieved' : ''}" aria-label="家族ミッション">
        <div class="family-mission-panel__header">
          <div>
            <span>家族ミッション</span>
            <strong>${escapeHtml(mission.title)}</strong>
          </div>
          <em>${escapeHtml(statusText)}</em>
        </div>
        <div class="family-mission-panel__progress">
          <div class="family-mission-panel__bar">
            <span style="width:${mission.percent}%"></span>
          </div>
          <p>${escapeHtml(mission.conditionLabel)}: ${escapeHtml(formatFamilyMissionValue(mission.current, mission.conditionType))} / ${escapeHtml(formatFamilyMissionValue(mission.target, mission.conditionType))}</p>
        </div>
        <div class="family-mission-panel__reward">
          <strong>${mission.achieved ? '今週の家族ごほうび' : '達成したら'}</strong>
          <span>${escapeHtml(mission.reward)}</span>
        </div>
        <div class="family-mission-contribution" aria-label="子供ごとの貢献">
          ${mission.contributions.map(entry => {
            const contributionPercent = mission.totalDone ? Math.round((entry.done / mission.totalDone) * 100) : 0;
            return `
              <div class="family-mission-contribution__row" style="--kid-color:${entry.color}">
                <img src="${entry.avatarSrc}" alt="${escapeHtml(entry.name)}">
                <div>
                  <strong>${escapeHtml(entry.name)}</strong>
                  <span>${entry.done}こ完了 / ¥${entry.amount.toLocaleString()}</span>
                </div>
                <small>${contributionPercent}%</small>
              </div>
            `;
          }).join('')}
        </div>
        ${topContribution && topContribution.done > 0 ? `<p class="family-mission-panel__note">今日は競争ではなく、家族みんなで進める作戦です。</p>` : `<p class="family-mission-panel__note">最初のお手伝いが終わると、ここに家族の進み具合が出ます。</p>`}
      </section>
    `;
  }

  function handleFamilyMissionAchievement() {
    if (!state.weekData) return;
    const mission = getFamilyMissionProgress();
    if (!mission.enabled) {
      if (state.weekData.familyMissionCelebrated) {
        state.weekData.familyMissionCelebrated = false;
        saveWeekData();
      }
      return;
    }
    if (mission.achieved && !state.weekData.familyMissionCelebrated) {
      state.weekData.familyMissionCelebrated = true;
      saveWeekData();
      showGoalToast(`ファミリーミッション達成！ ${mission.reward}`, true);
      if (window.confetti) {
        window.confetti({ particleCount: 24, spread: 44, origin: { y: 0.72 }, zIndex: 3000 });
      }
    } else if (!mission.achieved && state.weekData.familyMissionCelebrated) {
      state.weekData.familyMissionCelebrated = false;
      saveWeekData();
    }
  }

  function renderRewardShopArea() {
    const items = (state.rewardSettings.rewardShopItems || []).filter(item => item.enabled);
    const activeKid = getActiveKid() || kids[0];
    const requests = getRewardExchangeRequests();
    const history = getRewardExchangeHistory(6);
    if (!items.length) {
      return `
        <section class="reward-shop-panel">
          <div class="reward-shop-panel__header">
            <div>
              <span>ショップ</span>
              <strong>交換できるごほうびはありません</strong>
            </div>
          </div>
          <p class="small-text">おうちの人がごほうびを登録すると、ここに表示されます。</p>
        </section>
      `;
    }
    return `
      <section class="reward-shop-panel" aria-label="えらべるごほうびショップ">
        <div class="reward-shop-panel__header">
          <div>
            <span>ショップ</span>
            <strong>えらべるごほうび</strong>
          </div>
          ${activeKid ? `<small>${escapeHtml(activeKid.name)}: ¥${(activeKid.bank || 0).toLocaleString()} / チケット ${activeKid.gachaTickets || 0}枚</small>` : ''}
        </div>
        <div class="reward-shop-grid">
          ${items.map(item => renderRewardShopItem(item, activeKid, requests)).join('')}
        </div>
        <div class="reward-exchange-history">
          <div class="reward-exchange-history__header">
            <strong>交換履歴</strong>
            <span>申請、承認、戻しまで残ります。</span>
          </div>
          ${history.length ? `
            <ul>
              ${history.map(entry => `
                <li class="reward-exchange-history__row is-${escapeHtml(entry.status)}">
                  <span>${escapeHtml(entry.kidName || getKidName(entry.kidId))}</span>
                  <strong>${escapeHtml(entry.rewardName)}</strong>
                  <small>${escapeHtml(getRewardExchangeStatusLabel(entry.status))} / ${escapeHtml(formatRewardCost(entry))}</small>
                </li>
              `).join('')}
            </ul>
          ` : `<p class="small-text">まだ交換履歴はありません。</p>`}
        </div>
      </section>
    `;
  }

  function renderRewardShopItem(item, kid, requests) {
    const pending = kid && requests.some(req => req.status === 'pending' && req.kidId === kid.id && req.rewardId === item.id);
    const canAfford = kid ? canKidAffordReward(kid, item) : false;
    const disabled = !kid || pending || !canAfford;
    const reason = pending ? '申請中' : canAfford ? '交換申請' : item.type === 'ticket' ? 'チケット不足' : 'お金が足りません';
    return `
      <article class="reward-shop-item">
        <div>
          <span class="reward-shop-item__type">${item.type === 'ticket' ? 'チケット' : 'お金'}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(formatRewardCost(item))}</p>
        </div>
        <button type="button" class="button primary small" data-reward-request="${escapeHtml(item.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(reason)}</button>
      </article>
    `;
  }

  function canKidAffordReward(kid, item) {
    if (!kid || !item) return false;
    if (item.type === 'ticket') return (kid.gachaTickets || 0) >= (item.cost || 0);
    return (kid.bank || 0) >= (item.cost || 0);
  }

  function formatRewardCost(item) {
    if (!item) return '';
    if (item.type === 'ticket') return `チケット ${item.cost || 0}枚`;
    return `¥${(item.cost || 0).toLocaleString()}`;
  }

  function getTicketConditionText() {
    const settings = state.rewardSettings;
    if (!settings.gachaEnabled) return 'ガチャはお休み中です。';
    if (settings.ticketCondition === 'daily-complete') return '今日のお手伝いを全部できたら、チケットがもらえます。';
    if (settings.ticketCondition === 'approvals') return `${settings.ticketEvery || 1}回承認されたら、チケットが1枚もらえます。`;
    if (settings.ticketCondition === 'landmark') return '目標に近づく節目で、チケットがもらえます。';
    return 'お手伝いを続けると、チケットがもらえます。';
  }

  window.drawGacha = function(kidId) {
    const kid = kids.find(k => k.id === kidId);
    if (!state.rewardSettings.gachaEnabled) return;
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
    applyGachaItemEffect(kid, item);
    saveConfig();
    showGachaAnimation(item);
    render();
  };

  function applyGachaItemEffect(kid, item) {
    if (!kid || !item) return;
    const event = {
      id: generateId('item'),
      itemId: item.id,
      name: item.name,
      icon: item.icon,
      effect: item.effect || 'board-event',
      message: getItemEffectMessage(item, kid),
      moneyChanged: false,
      time: new Date().toISOString()
    };
    kid.itemEvents = Array.isArray(kid.itemEvents) ? kid.itemEvents : [];
    kid.itemEvents.unshift(event);
    if (kid.itemEvents.length > 20) kid.itemEvents = kid.itemEvents.slice(0, 20);
    kid.activeItemEvent = event;
    showGoalToast(`${item.name}: ${event.message}`, false);
  }

  function getItemEffectMessage(item, kid) {
    const goalName = kid?.goal || 'ほしいもの';
    switch (item.effect) {
      case 'shortcut':
        return `${goalName}に近づく演出が出ます。お金は増えません。`;
      case 'cheer':
        return 'おうちの人に見せて、応援のひとことをもらおう。';
      case 'extra-mission':
        return '今日もう1つできそうなお手伝いを探してみよう。';
      case 'family-mission':
        return '家族であと3つお手伝いできるか相談してみよう。';
      default:
        return '作戦ボードに小さなイベントが起きました。お金は増えません。';
    }
  }

  function getItemEffectLabel(effect) {
    if (effect === 'shortcut') return '近道';
    if (effect === 'cheer') return '応援';
    if (effect === 'extra-mission') return '追加ミッション';
    if (effect === 'family-mission') return '家族ミッション';
    return 'イベント';
  }

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
      document.getElementById('gachaResultDesc').textContent = `${item.desc} ${getItemEffectLabel(item.effect)}イベントとして作戦ボードに残ります。`;
      
      playCoinSound();
      if (window.confetti) {
        window.confetti({ particleCount: 18, spread: 38, origin: { y: 0.72 }, zIndex: 3000 });
      }
    }, 260);
  }

  window.openCollectionModal = function() {
    if (!state.rewardSettings.gachaEnabled) return;
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
          <small>${hasItem ? escapeHtml(getItemEffectLabel(item.effect)) : '未発見'}</small>
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
      goalImageDataUrl: typeof k.goalImageDataUrl === 'string' ? k.goalImageDataUrl : '',
      goalHistory: Array.isArray(k.goalHistory) ? k.goalHistory.slice(0, 12) : [],
      lastGoalEvent: k.lastGoalEvent && typeof k.lastGoalEvent === 'object' ? k.lastGoalEvent : null,
      itemEvents: Array.isArray(k.itemEvents) ? k.itemEvents.slice(0, 20) : [],
      activeItemEvent: k.activeItemEvent && typeof k.activeItemEvent === 'object' ? k.activeItemEvent : null,
      characterId: k.characterId || 'kakeru',
      avatarDataUrl: typeof k.avatarDataUrl === 'string' ? k.avatarDataUrl : '',
      gachaTickets: k.gachaTickets || 0,
      gachaItems: Array.isArray(k.gachaItems) ? k.gachaItems : [],
      ticketProgress: k.ticketProgress || 0
    }));
  }

  function normalizeRewardSettings(settings) {
    const merged = { ...DEFAULT_REWARD_SETTINGS, ...(settings || {}) };
    const validConditions = new Set(['daily-complete', 'approvals', 'landmark']);
    if (!validConditions.has(merged.ticketCondition)) merged.ticketCondition = DEFAULT_REWARD_SETTINGS.ticketCondition;
    merged.ticketEvery = Math.max(1, Math.min(20, parseInt(merged.ticketEvery) || DEFAULT_REWARD_SETTINGS.ticketEvery));
    merged.gachaEnabled = Boolean(merged.gachaEnabled);
    merged.rewardTitle = String(merged.rewardTitle || DEFAULT_REWARD_SETTINGS.rewardTitle).slice(0, 80);
    merged.rewardBody = String(merged.rewardBody || DEFAULT_REWARD_SETTINGS.rewardBody).slice(0, 240);
    merged.familyMission = normalizeFamilyMissionSettings(merged.familyMission);
    merged.rewardShopItems = normalizeRewardShopItems(merged.rewardShopItems);
    return merged;
  }

  function normalizeFamilyMissionSettings(settings) {
    const source = { ...DEFAULT_REWARD_SETTINGS.familyMission, ...(settings || {}) };
    return {
      enabled: source.enabled !== false,
      title: String(source.title || DEFAULT_REWARD_SETTINGS.familyMission.title).slice(0, 70),
      reward: String(source.reward || DEFAULT_REWARD_SETTINGS.familyMission.reward).slice(0, 90),
      conditionType: getValidFamilyMissionCondition(source.conditionType),
      target: Math.max(1, Math.min(99999, parseInt(source.target) || DEFAULT_REWARD_SETTINGS.familyMission.target))
    };
  }

  function normalizeRewardShopItems(items) {
    const source = Array.isArray(items) && items.length ? items : getDefaultRewardShopItems();
    return source.map((item, index) => ({
      id: item.id || generateId('reward'),
      name: String(item.name || `ごほうび${index + 1}`).slice(0, 60),
      type: item.type === 'ticket' ? 'ticket' : 'money',
      cost: Math.max(1, Math.min(99999, parseInt(item.cost) || 1)),
      enabled: item.enabled !== false
    })).slice(0, 20);
  }

  function normalizeTasks(list) {
    return list.map((t, i) => ({
      id: t.id || generateId('task'),
      label: t.label || `お手伝い${i+1}`,
      icon: t.icon || '⭐',
      reward: t.reward || 20
    }));
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str ?? '').replace(/[&<>"']/g, m => map[m]);
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

  function formatApprovalDateTime(value, fallbackDate = null) {
    const date = value ? new Date(value) : fallbackDate;
    if (!date || Number.isNaN(date.getTime())) return '日時未記録';
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
  }

  function buildWeekKey(date) {
    return toISO(date);
  }

  function generateId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getDefaultDayIndexForWeek(weekStart) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const diff = Math.round((today - start) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < 7 ? diff : 0;
  }

  function normalizeFamilyId(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80);
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
    if (slot.status === 'done' && slot.taskId) {
      const kid = kids.find(k => k.id === kId);
      const task = taskMap.get(slot.taskId);
      if (kid && task) {
        kid.bank = Math.max(0, (kid.bank || 0) - (task.reward || 0));
        recordTransaction(slot, kid, task, 'undo');
        saveConfig();
      }
    }
    slot.taskId = tId;
    slot.status = tId ? 'todo' : 'unset';
    slot.earnedTxId = null;
    slot.reportedAt = null;
    slot.approvedAt = null;
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

  function summarizeDayDetailed(day) {
    let done = 0, total = 0, pending = 0, totalReward = 0;
    Object.values(day.slots).forEach(slots => {
      slots.forEach(s => {
        if (!s.taskId) return;
        total++;
        if (s.status === 'pending') pending++;
        if (s.status === 'done') {
          done++;
          const task = taskMap.get(s.taskId);
          if (task) totalReward += (task.reward || 0);
        }
      });
    });
    return { done, total, pending, totalReward };
  }

  function summarizeKidDay(day, kidId) {
    const slots = (day && day.slots[kidId]) || [];
    let done = 0, total = 0, pending = 0, todo = 0, totalReward = 0;
    slots.forEach(s => {
      if (!s.taskId) return;
      total++;
      if (s.status === 'pending') pending++;
      if (s.status === 'todo') todo++;
      if (s.status === 'done') {
        done++;
        const task = taskMap.get(s.taskId);
        if (task) totalReward += (task.reward || 0);
      }
    });
    return { done, total, pending, todo, totalReward };
  }

  function getChildSlotPriority(slot) {
    if (!slot || !slot.taskId) return 3;
    if (slot.status === 'todo') return 0;
    if (slot.status === 'pending') return 1;
    if (slot.status === 'done') return 2;
    return 3;
  }

  function summarizePlanDay(day) {
    let assigned = 0;
    const total = kids.length * SLOTS_PER_KID;
    kids.forEach(kid => {
      const slots = (day && day.slots[kid.id]) || [];
      slots.forEach(slot => {
        if (slot.taskId) assigned++;
      });
    });
    return { assigned, total };
  }

  function getActiveKid() {
    return kids.find(kid => kid.id === state.activeKidId) || kids[0] || null;
  }

  function getVisibleKidsForToday() {
    if (state.appMode !== 'child') return kids;
    const activeKid = getActiveKid();
    return activeKid ? [activeKid] : [];
  }

  function getPendingItemsForDay(day, dayIndex) {
    if (!day) return [];
    const items = [];
    kids.forEach(kid => {
      const slots = day.slots[kid.id] || [];
      slots.forEach((slot, slotIndex) => {
        if (slot.status !== 'pending' || !slot.taskId) return;
        const task = taskMap.get(slot.taskId);
        if (!task) return;
        items.push({ day, dayIndex, kid, task, slot, slotIndex });
      });
    });
    return items;
  }

  function getPendingItemsForWeek() {
    if (!state.weekData) return [];
    return state.weekData.days.flatMap((day, dayIndex) => getPendingItemsForDay(day, dayIndex));
  }

  function getPendingItemsForWeekSorted() {
    const todayISO = toISO(new Date());
    return getPendingItemsForWeek().sort((a, b) => {
      const aToday = a.day.dateISO === todayISO ? 0 : 1;
      const bToday = b.day.dateISO === todayISO ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      const dateDiff = new Date(a.day.dateISO) - new Date(b.day.dateISO);
      if (dateDiff !== 0) return dateDiff;
      return new Date(a.slot.reportedAt || a.day.dateISO) - new Date(b.slot.reportedAt || b.day.dateISO);
    });
  }

  function getRecentlyCancelledItemsForWeek(limit = 4) {
    if (!state.weekData) return [];
    return (state.weekData.transactions || [])
      .filter(tx => tx.type === 'undo' || tx.amount < 0)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit)
      .map(tx => ({
        kid: kids.find(kid => kid.id === tx.kidId) || { id: tx.kidId, name: tx.kidName || 'こども', color: '#94a3b8' },
        taskName: tx.taskName || 'お手伝い（取消）',
        amount: tx.amount || 0,
        time: tx.time
      }));
  }

  function getRecentlyApprovedItemsForWeek(limit = 5) {
    if (!state.weekData) return [];
    const txById = new Map((state.weekData.transactions || []).map(tx => [tx.id, tx]));
    const items = [];
    state.weekData.days.forEach((day, dayIndex) => {
      kids.forEach(kid => {
        const slots = day.slots[kid.id] || [];
        slots.forEach((slot, slotIndex) => {
          if (slot.status !== 'done' || !slot.taskId || !slot.earnedTxId) return;
          const task = taskMap.get(slot.taskId);
          if (!task) return;
          items.push({ day, dayIndex, kid, task, slot, slotIndex, transaction: txById.get(slot.earnedTxId) });
        });
      });
    });
    return items
      .sort((a, b) => new Date(b.slot.approvedAt || b.transaction?.time || b.day.dateISO) - new Date(a.slot.approvedAt || a.transaction?.time || a.day.dateISO))
      .slice(0, limit);
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
          day.slots[kid.id] = Array.from({ length: SLOTS_PER_KID }, () => ({ taskId: null, status: 'unset', earnedTxId: null }));
          changed = true;
        } else if (day.slots[kid.id].length < SLOTS_PER_KID) {
          // スロット数が変更された場合
          const currentSlots = day.slots[kid.id];
          // 足りない分を追加。予定外報告で増えたスロットは履歴保護のため削らない。
          const diff = SLOTS_PER_KID - currentSlots.length;
          for (let i = 0; i < diff; i++) {
            currentSlots.push({ taskId: null, status: 'unset', earnedTxId: null });
          }
          changed = true;
        }
      });
    });
    return changed;
  }

  function cleanupSlotsForMissingTasks() {
    let changed = false;
    if (!state.weekData || !Array.isArray(state.weekData.days)) return false;
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

  function cleanupInvalidTaskReferences() {
    let changed = false;
    if (cleanupSlotsForMissingTasks()) changed = true;
    if (cleanupKidPlanTemplatesForMissingTasks()) changed = true;
    return changed;
  }

  function cleanupKidPlanTemplatesForMissingTasks() {
    let changed = false;
    const templates = state.kidPlanTemplates || {};
    Object.keys(templates).forEach(kidId => {
      const template = templates[kidId];
      if (!Array.isArray(template)) {
        delete templates[kidId];
        changed = true;
        return;
      }
      template.forEach((daySlots, dayIndex) => {
        if (!Array.isArray(daySlots)) {
          template[dayIndex] = [];
          changed = true;
          return;
        }
        daySlots.forEach((taskId, slotIndex) => {
          if (taskId && !validTaskIds.has(taskId)) {
            daySlots[slotIndex] = null;
            changed = true;
          }
        });
      });
    });
    state.kidPlanTemplates = templates;
    return changed;
  }

  function ensureControlSelectionValid() {
    if (!kids.some(k => k.id === state.controlSelection.kidId)) {
      state.controlSelection.kidId = kids[0] ? kids[0].id : '';
    }
    if (!kids.some(k => k.id === state.activeKidId)) {
      state.activeKidId = state.controlSelection.kidId || (kids[0] ? kids[0].id : '');
    }
    if (state.appMode === 'child' && state.activeKidId) {
      state.controlSelection.kidId = state.activeKidId;
    }
  }

  // ─── UI Updates ───
  function updateBoardHeading(day) {
    const date = parseISO(day.dateISO);
    const todayISO = toISO(new Date());
    const activeKid = getActiveKid();
    const isToday = day.dateISO === todayISO;
    if (elements.boardTitle) {
      if (state.appMode === 'child') {
        elements.boardTitle.textContent = activeKid
          ? `${activeKid.name}の${isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`}やること`
          : '今日やること';
      } else {
        elements.boardTitle.textContent = isToday ? '今日の予定' : `${date.getMonth() + 1}/${date.getDate()}の予定`;
      }
    }
    if (elements.boardSubtitle) {
      if (state.appMode === 'child' && activeKid) {
        const summary = summarizeKidDay(day, activeKid.id);
        elements.boardSubtitle.textContent = summary.total
          ? `あと ${summary.todo}こ。上から順番にやろう。${summary.pending ? `確認待ち ${summary.pending}こ。` : ''}`
          : '今日は予定がありません。';
      } else {
        elements.boardSubtitle.textContent = `${formatJapaneseDate(date)} のお手伝い`;
      }
    }
  }

  function updateSpecialContent(day) {
    if (!elements.specialMessage) return;
    const activeKid = getActiveKid();
    const isChildView = state.appMode === 'child' && activeKid;
    const summary = isChildView ? summarizeKidDay(day, activeKid.id) : summarizeDay(day);
    
    let totalYen = 0;
    const slotGroups = isChildView ? [day.slots[activeKid.id] || []] : Object.values(day.slots);
    slotGroups.forEach(slots => {
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
    const rewardLabel = document.querySelector('.total-reward-label');
    if (rewardLabel) {
      rewardLabel.textContent = isChildView ? `${activeKid.name}の今日のごほうび` : '今日のみんなのごほうび合計';
    }

    if (elements.todayDone) elements.todayDone.textContent = summary.done;
    if (elements.todayRemaining) elements.todayRemaining.textContent = isChildView ? summary.todo : summary.total - summary.done;

    const dayProgress = summary.total ? (summary.done / summary.total) : 0;
    if (elements.headerProgress) {
      elements.headerProgress.textContent = `${Math.round(dayProgress * 100)}%`;
    }

    let msg = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
    
    if (isChildView && summary.todo > 0) {
      msg += ` 上から順番に進めよう。あと${summary.todo}こ。`;
    } else if (isChildView && summary.pending > 0) {
      msg += ' 報告できました。おうちの人の確認を待とう。';
    } else if (dayProgress === 1 && summary.total > 0) {
      msg += ' 今日のお手伝いは全部できました。';
    } else if (dayProgress > 0.5) {
      msg += ' あと少し。いいペースです。';
    } else {
      msg += ' 上から順番に進めよう。';
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
    if (!state.editMode && !confirm('大人モードに切り替えます。報酬の承認や設定変更を行いますか？')) {
      return;
    }
    state.editMode = !state.editMode;
    updateEditState();
    render();
  }

  function updateEditState() {
    document.body.classList.toggle('is-edit', state.editMode);
    
    if (elements.bottomAdultToggle) {
      elements.bottomAdultToggle.classList.toggle('is-active', state.editMode);
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
    elements.kidManager.innerHTML = kids.map(kid => {
      const avatarSrc = getKidAvatarSrc(kid);
      const goalImageSrc = getKidGoalImageSrc(kid);
      return `
      <li class="manager-item manager-item--kid" data-kid-id="${kid.id}">
        <div class="kid-avatar-setting">
          <div class="kid-avatar-setting__preview" style="--kid-color:${kid.color}">
            <img src="${avatarSrc}" alt="${escapeHtml(kid.name)}">
          </div>
          <div class="kid-avatar-setting__body">
            <strong>プロフィール画像</strong>
            <span>子供の顔写真や好きな画像を設定できます。</span>
            <div class="kid-avatar-setting__actions">
              <label class="button secondary small">
                画像を選ぶ
                <input type="file" accept="image/*" data-kid-field="avatarFile" class="visually-hidden">
              </label>
              <button type="button" class="button ghost small" data-action="remove-avatar" ${kid.avatarDataUrl ? '' : 'disabled'}>画像を戻す</button>
            </div>
          </div>
        </div>
        <div class="goal-image-setting">
          <div class="goal-image-setting__preview" style="--kid-color:${kid.color}">
            ${goalImageSrc ? `<img src="${goalImageSrc}" alt="${escapeHtml(kid.goal || '目標')}">` : `<span>${escapeHtml(getGoalInitial(kid.goal))}</span>`}
          </div>
          <div class="goal-image-setting__body">
            <strong>ほしいもの作戦ボード</strong>
            <span>目標名、必要な金額、写真を設定すると子供画面に大きく表示されます。</span>
            <div class="goal-image-setting__actions">
              <label class="button secondary small">
                目標画像を選ぶ
                <input type="file" accept="image/*" data-kid-field="goalImageFile" class="visually-hidden">
              </label>
              <button type="button" class="button ghost small" data-action="remove-goal-image" ${kid.goalImageDataUrl ? '' : 'disabled'}>画像を戻す</button>
            </div>
          </div>
        </div>
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
            <label>ほしいもの・目標</label>
            <input type="text" value="${escapeHtml(kid.goal)}" data-kid-field="goal" class="manager-input">
          </div>
          <div class="manager-field">
            <label>必要な金額(円)</label>
            <input type="number" value="${kid.goalAmount}" data-kid-field="goalAmount" class="manager-input">
          </div>
        </div>
        <div class="manager-item__footer">
          <input type="color" value="${kid.color || '#3b82f6'}" data-kid-field="color" class="manager-color">
          <button type="button" class="button danger small" data-action="remove-kid">削除</button>
        </div>
      </li>
    `;
    }).join('');
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
            <label>お手伝い名</label>
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

  function renderRewardSettingsPanel() {
    if (!elements.rewardSettingsPanel) return;
    const settings = state.rewardSettings;
    const mission = settings.familyMission || DEFAULT_REWARD_SETTINGS.familyMission;
    elements.rewardSettingsPanel.innerHTML = `
      <div class="reward-settings-grid">
        <label class="setting-toggle">
          <input type="checkbox" data-reward-setting="gachaEnabled" ${settings.gachaEnabled ? 'checked' : ''}>
          <span>ガチャを使う</span>
        </label>
        <label class="manager-field">
          <span class="setting-label">チケット付与条件</span>
          <select class="manager-select" data-reward-setting="ticketCondition" ${settings.gachaEnabled ? '' : 'disabled'}>
            <option value="daily-complete" ${settings.ticketCondition === 'daily-complete' ? 'selected' : ''}>その子の今日の予定を全部承認</option>
            <option value="approvals" ${settings.ticketCondition === 'approvals' ? 'selected' : ''}>承認数ごと</option>
            <option value="landmark" ${settings.ticketCondition === 'landmark' ? 'selected' : ''}>週間進捗の節目</option>
          </select>
        </label>
        <label class="manager-field">
          <span class="setting-label">承認何回で1枚</span>
          <input type="number" min="1" max="20" class="manager-input" data-reward-setting="ticketEvery" value="${settings.ticketEvery}" ${settings.gachaEnabled && settings.ticketCondition === 'approvals' ? '' : 'disabled'}>
        </label>
      </div>
      <div class="reward-settings-grid reward-settings-grid--text">
        <label class="manager-field">
          <span class="setting-label">ごほうび名</span>
          <input type="text" class="manager-input" data-reward-setting="rewardTitle" value="${escapeHtml(settings.rewardTitle)}">
        </label>
        <label class="manager-field">
          <span class="setting-label">子供に見せる内容</span>
          <textarea class="manager-input reward-settings-textarea" data-reward-setting="rewardBody">${escapeHtml(settings.rewardBody)}</textarea>
        </label>
      </div>
      <div class="family-mission-settings">
        <div class="family-mission-settings__header">
          <div>
            <strong>家族ミッション</strong>
            <span>兄弟で競争させず、家族全体の協力目標として表示します。</span>
          </div>
          <label class="setting-toggle">
            <input type="checkbox" data-family-mission-field="enabled" ${mission.enabled ? 'checked' : ''}>
            <span>表示</span>
          </label>
        </div>
        <div class="family-mission-settings__grid">
          <label class="manager-field">
            <span class="setting-label">ミッション名</span>
            <input type="text" class="manager-input" data-family-mission-field="title" value="${escapeHtml(mission.title)}">
          </label>
          <label class="manager-field">
            <span class="setting-label">家族ごほうび</span>
            <input type="text" class="manager-input" data-family-mission-field="reward" value="${escapeHtml(mission.reward)}">
          </label>
          <label class="manager-field">
            <span class="setting-label">条件</span>
            <select class="manager-select" data-family-mission-field="conditionType">
              <option value="done-count" ${mission.conditionType === 'done-count' ? 'selected' : ''}>今週できたお手伝い数</option>
              <option value="total-money" ${mission.conditionType === 'total-money' ? 'selected' : ''}>今週の合計金額</option>
              <option value="streak-days" ${mission.conditionType === 'streak-days' ? 'selected' : ''}>連続でできた日数</option>
            </select>
          </label>
          <label class="manager-field">
            <span class="setting-label">目標値</span>
            <input type="number" min="1" class="manager-input" data-family-mission-field="target" value="${mission.target}">
          </label>
        </div>
      </div>
      <div class="reward-shop-settings">
        <div class="reward-shop-settings__header">
          <div>
            <strong>えらべるごほうびショップ</strong>
            <span>子供が申請できるごほうびを登録します。</span>
          </div>
          <button type="button" class="button primary small" data-reward-shop-action="add">＋ 追加</button>
        </div>
        <div class="reward-shop-settings__list">
          ${(settings.rewardShopItems || []).map(item => `
            <div class="reward-shop-setting-item" data-reward-shop-id="${escapeHtml(item.id)}">
              <label>
                <span>ごほうび名</span>
                <input type="text" class="manager-input" data-reward-shop-field="name" value="${escapeHtml(item.name)}">
              </label>
              <label>
                <span>条件</span>
                <select class="manager-select" data-reward-shop-field="type">
                  <option value="money" ${item.type === 'money' ? 'selected' : ''}>お金</option>
                  <option value="ticket" ${item.type === 'ticket' ? 'selected' : ''}>チケット</option>
                </select>
              </label>
              <label>
                <span>${item.type === 'ticket' ? '枚数' : '金額'}</span>
                <input type="number" min="1" class="manager-input" data-reward-shop-field="cost" value="${item.cost}">
              </label>
              <label class="reward-shop-setting-item__toggle">
                <input type="checkbox" data-reward-shop-field="enabled" ${item.enabled ? 'checked' : ''}>
                <span>表示</span>
              </label>
              <button type="button" class="button danger small" data-reward-shop-action="remove">削除</button>
            </div>
          `).join('')}
        </div>
      </div>
      <p class="small-text">ガチャをOFFにすると、子供画面ではチケットとガチャボタンを表示しません。ごほうび内容だけ残ります。</p>
    `;
  }

  function handleRewardSettingsChange(event) {
    const familyMissionField = event.target.dataset.familyMissionField;
    if (familyMissionField) {
      handleFamilyMissionFieldChange(event, familyMissionField);
      return;
    }
    const shopField = event.target.dataset.rewardShopField;
    if (shopField) {
      handleRewardShopFieldChange(event, shopField);
      return;
    }
    const field = event.target.dataset.rewardSetting;
    if (!field) return;
    if (event.type === 'input' && !['rewardTitle', 'rewardBody', 'ticketEvery'].includes(field)) return;
    if (field === 'gachaEnabled') {
      state.rewardSettings.gachaEnabled = event.target.checked;
    } else if (field === 'ticketEvery') {
      state.rewardSettings.ticketEvery = Math.max(1, Math.min(20, parseInt(event.target.value) || 1));
    } else {
      state.rewardSettings[field] = event.target.value;
    }
    state.rewardSettings = normalizeRewardSettings(state.rewardSettings);
    saveConfig();
    renderGachaArea();
    if (event.type === 'change' && ['gachaEnabled', 'ticketCondition'].includes(field)) renderRewardSettingsPanel();
  }

  function handleFamilyMissionFieldChange(event, field) {
    if (event.type === 'input' && !['title', 'reward', 'target'].includes(field)) return;
    const mission = { ...(state.rewardSettings.familyMission || DEFAULT_REWARD_SETTINGS.familyMission) };
    if (field === 'enabled') mission.enabled = event.target.checked;
    else if (field === 'target') mission.target = Math.max(1, Math.min(99999, parseInt(event.target.value) || 1));
    else if (field === 'conditionType') mission.conditionType = getValidFamilyMissionCondition(event.target.value);
    else mission[field] = event.target.value;
    state.rewardSettings.familyMission = mission;
    state.rewardSettings = normalizeRewardSettings(state.rewardSettings);
    saveConfig();
    renderGachaArea();
    if (event.type === 'change' && ['enabled', 'conditionType'].includes(field)) renderRewardSettingsPanel();
  }

  function handleRewardShopFieldChange(event, field) {
    const row = event.target.closest('[data-reward-shop-id]');
    if (!row) return;
    const item = (state.rewardSettings.rewardShopItems || []).find(entry => entry.id === row.dataset.rewardShopId);
    if (!item) return;
    if (event.type === 'input' && !['name', 'cost'].includes(field)) return;
    if (field === 'cost') item.cost = Math.max(1, Math.min(99999, parseInt(event.target.value) || 1));
    else if (field === 'enabled') item.enabled = event.target.checked;
    else if (field === 'type') item.type = event.target.value === 'ticket' ? 'ticket' : 'money';
    else item[field] = event.target.value;
    state.rewardSettings = normalizeRewardSettings(state.rewardSettings);
    saveConfig();
    renderGachaArea();
    if (event.type === 'change' && ['type', 'enabled'].includes(field)) renderRewardSettingsPanel();
  }

  function handleRewardShopClick(event) {
    const action = event.target.closest('[data-reward-shop-action]');
    if (!action) return;
    const list = state.rewardSettings.rewardShopItems || [];
    if (action.dataset.rewardShopAction === 'add') {
      list.push({
        id: generateId('reward'),
        name: `新しいごほうび${list.length + 1}`,
        type: 'money',
        cost: 100,
        enabled: true
      });
    } else if (action.dataset.rewardShopAction === 'remove') {
      const row = action.closest('[data-reward-shop-id]');
      if (!row) return;
      state.rewardSettings.rewardShopItems = list.filter(item => item.id !== row.dataset.rewardShopId);
    }
    state.rewardSettings = normalizeRewardSettings(state.rewardSettings);
    saveConfig();
    renderRewardSettingsPanel();
    renderGachaArea();
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

  function showCalendarDetail(dateISO) {
    const detailPanel = document.getElementById('calendarDetail');
    if (!detailPanel) return;
    
    // 選択されたセルのハイライト
    document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('is-selected'));
    const cell = document.querySelector(`.calendar-cell[data-date="${dateISO}"]`);
    if (cell) cell.classList.add('is-selected');

    const clickedDate = parseISO(dateISO);
    const weekStartForDay = startOfWeek(clickedDate);
    const weekKeyForDay = buildWeekKey(weekStartForDay);
    const weekDataForDay = (weekKeyForDay === state.weekKey) ? state.weekData : loadWeekData(weekKeyForDay, weekStartForDay);
    
    const dayData = weekDataForDay.days.find(d => d.dateISO === dateISO);
    if (!dayData) {
      detailPanel.style.display = 'none';
      return;
    }

    let detailHtml = `
      <div class="detail-header">${clickedDate.getMonth() + 1}月${clickedDate.getDate()}日のきろく</div>
      <div class="detail-list">
    `;

    let hasDoneTasks = false;

    kids.forEach(kid => {
      const slots = dayData.slots[kid.id] || [];
      slots.forEach(s => {
        if (s.taskId && s.status === 'done') {
          const task = taskMap.get(s.taskId);
          if (task) {
            hasDoneTasks = true;
            detailHtml += `
              <div class="detail-item" style="--kid-color: ${kid.color}">
                <div class="detail-kid-name">${escapeHtml(kid.name)}</div>
                <div class="detail-task-info">
                  <span class="icon">${task.icon}</span>
                  <span class="label">${escapeHtml(task.label)}</span>
                </div>
                <div class="detail-reward">+¥${task.reward}</div>
              </div>
            `;
          }
        }
      });
    });

    if (!hasDoneTasks) {
      detailHtml += `<div style="text-align: center; color: var(--muted); padding: 12px 0; font-size: 0.9rem;">この日に完了したお手伝いはありません</div>`;
    }

    detailHtml += `</div>`;
    detailPanel.innerHTML = detailHtml;
    detailPanel.style.display = 'block';
  }

  function renderPlanTemplatePanel() {
    if (!elements.planTemplatePanel || !state.weekData) return;
    const selectedDay = state.weekData.days[state.controlSelection.dayIndex] || state.weekData.days[0];
    const selectedDate = selectedDay ? parseISO(selectedDay.dateISO) : null;
    const unsetDays = state.weekData.days
      .map((day, dayIndex) => ({ day, dayIndex, summary: summarizePlanDay(day) }))
      .filter(item => item.summary.assigned < item.summary.total);

    if (elements.planTemplateHint && selectedDate) {
      elements.planTemplateHint.textContent = `コピー元: ${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（${DAY_NAMES[selectedDate.getDay()]}）。下の予定をタップするとコピー元の日が切り替わります。`;
    }
    if (elements.planUnsetSummary) {
      elements.planUnsetSummary.textContent = unsetDays.length
        ? `未設定 ${unsetDays.length}日`
        : '1週間すべて設定済み';
      elements.planUnsetSummary.classList.toggle('is-complete', unsetDays.length === 0);
    }
    if (elements.kidTemplateList) {
      elements.kidTemplateList.innerHTML = kids.map(kid => {
        const hasTemplate = Array.isArray(state.kidPlanTemplates[kid.id]);
        return `
          <div class="kid-template-item" style="--kid-color:${kid.color}">
            <div>
              <strong>${escapeHtml(kid.name)}</strong>
              <span>${hasTemplate ? '保存済みテンプレートあり' : 'テンプレート未保存'}</span>
            </div>
            <div class="kid-template-item__actions">
              <button type="button" class="button secondary small" data-kid-template-action="save" data-kid-id="${kid.id}">保存</button>
              <button type="button" class="button primary small" data-kid-template-action="apply" data-kid-id="${kid.id}" ${hasTemplate ? '' : 'disabled'}>適用</button>
              <button type="button" class="button ghost small" data-kid-template-action="clear" data-kid-id="${kid.id}" ${hasTemplate ? '' : 'disabled'}>削除</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function renderWeeklyPlanner() {
    if (!elements.weeklyPlanner || !state.weekData) return;
    
    const days = state.weekData.days;
    let html = '<div class="planner-accordion">';

    days.forEach((day, dayIndex) => {
      const date = parseISO(day.dateISO);
      const isToday = day.dateISO === toISO(new Date());
      const planSummary = summarizePlanDay(day);
      const isSelected = dayIndex === state.controlSelection.dayIndex;
      const hasUnset = planSummary.assigned < planSummary.total;
      // 今日ならデフォルトで開いておく
      html += `
        <details class="planner-day-panel ${isSelected ? 'is-selected' : ''} ${hasUnset ? 'has-unset' : 'is-complete'}" data-day-index="${dayIndex}" ${isToday || hasUnset ? 'open' : ''}>
          <summary>
            <span>${date.getDate()}日（${DAY_NAMES[date.getDay()]}）</span>
            <span class="planner-day-status">${hasUnset ? `未設定 ${planSummary.total - planSummary.assigned}` : '設定済み'}</span>
          </summary>
          <div class="planner-day-content">
      `;
      
      kids.forEach(kid => {
        const slots = day.slots[kid.id] || [];
        html += `
            <div class="planner-kid-row">
              <div class="planner-kid-name" style="background: ${kid.color}">${escapeHtml(kid.name)}</div>
              <div class="planner-task-list">
                ${slots.map((s, sIdx) => {
                  const task = s.taskId ? taskMap.get(s.taskId) : null;
                  return `
                    <div class="planner-task-item" data-day-index="${dayIndex}" data-kid-id="${kid.id}" data-slot-index="${sIdx}">
                      ${task ? `<span class="icon">${task.icon}</span><span class="label">${task.label}</span>` : '<span class="icon">＋</span><span class="label planner-empty">未設定: タップして選ぶ</span>'}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
        `;
      });
      
      html += `
          </div>
        </details>
      `;
    });

    html += '</div>';
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

  function openQuickReportModal(kidId) {
    if (!elements.quickReportModal || !elements.quickReportGrid) return;
    const kid = kids.find(item => item.id === kidId) || getActiveKid();
    if (!kid) return;
    state.quickReportKidId = kid.id;

    if (elements.quickReportSubtitle) {
      elements.quickReportSubtitle.textContent = `${kid.name}が今日やったお手伝いを選んでください。`;
    }

    elements.quickReportGrid.innerHTML = tasks.map(task => {
      const status = getTodayTaskReportStatus(kid.id, task.id);
      const isReported = status === 'pending' || status === 'done';
      const badge = status === 'done'
        ? '承認済み'
        : status === 'pending'
          ? '確認中'
          : status === 'todo'
            ? '予定あり'
            : '未報告';
      return `
        <label class="quick-report-option ${isReported ? 'is-reported' : ''}">
          <input type="checkbox" value="${task.id}" ${isReported ? 'disabled' : ''}>
          <span class="quick-report-option__icon">${task.icon || '⭐'}</span>
          <span class="quick-report-option__main">
            <strong>${escapeHtml(task.label)}</strong>
            <small>ごほうび ¥${Number(task.reward || 0).toLocaleString()}</small>
          </span>
          <span class="quick-report-option__badge">${badge}</span>
        </label>
      `;
    }).join('');

    elements.quickReportModal.classList.add('is-active');
  }

  function closeQuickReportModal() {
    if (!elements.quickReportModal) return;
    elements.quickReportModal.classList.remove('is-active');
    state.quickReportKidId = '';
  }

  function confirmQuickReport() {
    if (!elements.quickReportGrid || !state.quickReportKidId) return;
    const selectedTaskIds = Array.from(elements.quickReportGrid.querySelectorAll('input[type="checkbox"]:checked'))
      .map(input => input.value)
      .filter(Boolean);
    if (!selectedTaskIds.length) {
      alert('報告するお手伝いを選んでください。');
      return;
    }

    const result = reportTasksForToday(state.quickReportKidId, selectedTaskIds);
    closeQuickReportModal();
    render();
    showGoalToast(`報告しました: ${result.reported}こ${result.skipped ? `（済み ${result.skipped}こ）` : ''}`, false);
  }

  function getTodayTaskReportStatus(kidId, taskId) {
    const day = state.weekData && state.weekData.days[state.controlSelection.dayIndex];
    const slots = (day && day.slots[kidId]) || [];
    const matched = slots.find(slot => slot.taskId === taskId && slot.status && slot.status !== 'unset');
    return matched ? matched.status : 'unset';
  }

  function reportTasksForToday(kidId, taskIds) {
    const day = state.weekData && state.weekData.days[state.controlSelection.dayIndex];
    if (!day || !day.slots[kidId]) return { reported: 0, skipped: taskIds.length };

    let reported = 0;
    let skipped = 0;
    taskIds.forEach(taskId => {
      const result = reportTaskForDay(day, kidId, taskId);
      if (result) reported++;
      else skipped++;
    });

    if (reported) {
      saveConfig();
      saveWeekData();
    }
    return { reported, skipped };
  }

  function reportTaskForDay(day, kidId, taskId) {
    if (!validTaskIds.has(taskId)) return false;
    const slots = day.slots[kidId] || [];
    let slot = slots.find(item => item.taskId === taskId && item.status !== 'done' && item.status !== 'pending');
    if (!slot) {
      const existingReported = slots.find(item => item.taskId === taskId && (item.status === 'done' || item.status === 'pending'));
      if (existingReported) return false;
      slot = slots.find(item => !item.taskId || item.status === 'unset');
    }
    if (!slot) {
      slot = { taskId: null, status: 'unset', earnedTxId: null, growthAlbumId: null, reportedAt: null, approvedAt: null };
      slots.push(slot);
      day.slots[kidId] = slots;
    }

    slot.taskId = taskId;
    slot.status = 'pending';
    slot.earnedTxId = null;
    slot.growthAlbumId = null;
    slot.reportedAt = new Date().toISOString();
    slot.approvedAt = null;
    return true;
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
      config: { kids, tasks, slotsPerKid: SLOTS_PER_KID, familyId: state.familyId, kidPlanTemplates: state.kidPlanTemplates, rewardSettings: state.rewardSettings },
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
          SLOTS_PER_KID = backup.config.slotsPerKid || SLOTS_PER_KID;
          state.familyId = backup.config.familyId || state.familyId;
          state.kidPlanTemplates = backup.config.kidPlanTemplates || {};
          state.rewardSettings = normalizeRewardSettings(backup.config.rewardSettings);
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
