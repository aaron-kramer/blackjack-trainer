(function () {
  const { ACTION_INFO, ACTION_REASON, UPCARDS, upcardLabel, describeScenario, resolveAction } = window.Strategy;
  const { UNITS, ALL_LESSONS, buildQuestions } = window.Lessons;

  const els = {
    views: {
      path: document.getElementById('view-path'),
      lesson: document.getElementById('view-lesson'),
      complete: document.getElementById('view-complete'),
      failed: document.getElementById('view-failed'),
      chart: document.getElementById('view-chart'),
      stats: document.getElementById('view-stats'),
    },
    bottomNav: document.getElementById('bottom-nav'),
    statStreak: document.getElementById('stat-streak'),
    statXp: document.getElementById('stat-xp'),
    pathScroll: document.getElementById('path-scroll'),

    overlayIntro: document.getElementById('overlay-intro'),
    introIcon: document.getElementById('intro-icon'),
    introTitle: document.getElementById('intro-title'),
    introBlurb: document.getElementById('intro-blurb'),
    introMeta: document.getElementById('intro-meta'),
    introStart: document.getElementById('intro-start'),
    introCancel: document.getElementById('intro-cancel'),

    lessonQuit: document.getElementById('lesson-quit'),
    lessonProgressFill: document.getElementById('lesson-progress-fill'),
    lessonHearts: document.getElementById('lesson-hearts'),
    dealerCards: document.getElementById('dealer-cards'),
    playerCards: document.getElementById('player-cards'),
    playerTotalLabel: document.getElementById('player-total-label'),
    feedbackBanner: document.getElementById('feedback-banner'),
    feedbackText: document.getElementById('feedback-text'),
    actionButtons: document.getElementById('action-buttons'),
    lessonContinue: document.getElementById('lesson-continue'),

    completeAccuracy: document.getElementById('complete-accuracy'),
    completeXp: document.getElementById('complete-xp'),
    completeContinue: document.getElementById('complete-continue'),

    failedRetry: document.getElementById('failed-retry'),
    failedHome: document.getElementById('failed-home'),

    chartScroll: document.getElementById('chart-scroll'),

    statsStreak: document.getElementById('stats-streak'),
    statsXp: document.getElementById('stats-xp'),
    statsLessons: document.getElementById('stats-lessons'),
    statsReset: document.getElementById('stats-reset'),
  };

  const state = {
    progress: window.Storage.loadProgress(),
    pendingLesson: null,
    currentLesson: null,
    questions: [],
    qIndex: 0,
    hearts: 5,
    correctCount: 0,
    xpEarned: 0,
    locked: false,
  };

  const MAX_HEARTS = 5;
  const ACTION_ORDER = ['H', 'S', 'D', 'P', 'R'];
  const DISPLAY_SUITS = [
    { symbol: '♠', color: 'black' },
    { symbol: '♥', color: 'red' },
    { symbol: '♦', color: 'red' },
    { symbol: '♣', color: 'black' },
  ];
  const randomDisplaySuit = () => DISPLAY_SUITS[Math.floor(Math.random() * DISPLAY_SUITS.length)];

  function showView(name) {
    Object.entries(els.views).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== name);
    });
    els.bottomNav.style.display = ['path', 'chart', 'stats'].includes(name) ? 'flex' : 'none';
    document.querySelectorAll('.nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === name);
    });
  }

  function refreshHeaderStats() {
    els.statStreak.textContent = state.progress.streak;
    els.statXp.textContent = state.progress.xp;
  }

  // ---------------- PATH VIEW ----------------
  function renderPath() {
    refreshHeaderStats();
    els.pathScroll.innerHTML = '';
    let firstIncompleteFound = false;

    UNITS.forEach((unit) => {
      const banner = document.createElement('div');
      banner.className = 'unit-banner';
      banner.innerHTML = `<span class="unit-icon">${unit.icon}</span><span class="unit-title">${unit.title}</span>`;
      els.pathScroll.appendChild(banner);

      unit.lessons.forEach((lesson, i) => {
        const row = document.createElement('div');
        const offsetClass = i % 3 === 0 ? '' : i % 3 === 1 ? 'offset-left' : 'offset-right';
        row.className = `lesson-row ${offsetClass}`;

        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';

        const unlocked = window.Storage.isLessonUnlocked(state.progress, lesson.id, ALL_LESSONS);
        const completed = state.progress.completedLessons.includes(lesson.id);
        const isCurrent = unlocked && !completed && !firstIncompleteFound;
        if (isCurrent) firstIncompleteFound = true;

        const node = document.createElement('button');
        node.className = 'lesson-node';
        if (!unlocked) node.classList.add('locked');
        else if (completed) node.classList.add('completed');
        if (isCurrent) node.classList.add('current');
        node.textContent = !unlocked ? '\u{1F512}' : completed ? '✓' : '\u{1F0CF}';
        node.addEventListener('click', () => {
          if (!unlocked) {
            node.classList.remove('shake');
            void node.offsetWidth;
            node.classList.add('shake');
            return;
          }
          openIntro(lesson);
        });

        const label = document.createElement('div');
        label.className = 'lesson-label';
        label.textContent = lesson.title;

        wrap.appendChild(node);
        wrap.appendChild(label);
        row.appendChild(wrap);
        els.pathScroll.appendChild(row);
      });
    });
  }

  function openIntro(lesson) {
    state.pendingLesson = lesson;
    els.introTitle.textContent = lesson.title;
    els.introBlurb.textContent = lesson.blurb;
    els.introMeta.textContent = `${lesson.count} questions · ${lesson.unitTitle}`;
    els.overlayIntro.classList.remove('hidden');
  }

  els.introCancel.addEventListener('click', () => els.overlayIntro.classList.add('hidden'));
  els.introStart.addEventListener('click', () => {
    els.overlayIntro.classList.add('hidden');
    startLesson(state.pendingLesson);
  });

  // ---------------- LESSON VIEW ----------------
  function startLesson(lesson) {
    state.currentLesson = lesson;
    state.questions = buildQuestions(lesson);
    state.qIndex = 0;
    state.hearts = MAX_HEARTS;
    state.correctCount = 0;
    state.xpEarned = 0;
    showView('lesson');
    renderHearts();
    renderQuestion();
  }

  function renderHearts() {
    els.lessonHearts.innerHTML = '';
    for (let i = 0; i < MAX_HEARTS; i++) {
      const span = document.createElement('span');
      span.textContent = i < state.hearts ? '❤️' : '\u{1F5A4}';
      span.style.opacity = i < state.hearts ? '1' : '0.25';
      els.lessonHearts.appendChild(span);
    }
  }

  function cardNode(card) {
    const div = document.createElement('div');
    div.className = `card ${card.color}`;
    div.innerHTML = `<div>${card.rank}</div><div class="suit">${card.suit}</div>`;
    return div;
  }

  function faceDownNode() {
    const div = document.createElement('div');
    div.className = 'card black';
    div.style.background = 'repeating-linear-gradient(45deg, #0b3d2e, #0b3d2e 6px, #14603f 6px, #14603f 12px)';
    div.style.border = '2px solid #fff';
    return div;
  }

  function renderQuestion() {
    els.lessonContinue.classList.add('hidden');
    els.feedbackBanner.classList.add('hidden');
    state.locked = false;

    const total = state.questions.length;
    els.lessonProgressFill.style.width = `${(state.qIndex / total) * 100}%`;

    const q = state.questions[state.qIndex];

    const dealerSuit = randomDisplaySuit();
    els.dealerCards.innerHTML = '';
    els.dealerCards.appendChild(cardNode({ rank: upcardLabel(q.upcard), suit: dealerSuit.symbol, color: dealerSuit.color }));
    els.dealerCards.appendChild(faceDownNode());

    els.playerCards.innerHTML = '';
    q.hand.forEach((c) => els.playerCards.appendChild(cardNode(c)));
    els.playerTotalLabel.textContent = describeScenario(q);

    const actions = ACTION_ORDER.filter((a) => state.currentLesson.allowedActions.includes(a));
    els.actionButtons.className = `action-buttons cols-${actions.length}`;
    els.actionButtons.innerHTML = '';
    actions.forEach((code) => {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.style.background = ACTION_INFO[code].color;
      btn.textContent = ACTION_INFO[code].label;
      btn.dataset.code = code;
      btn.addEventListener('click', () => handleAnswer(code, btn));
      els.actionButtons.appendChild(btn);
    });
  }

  function handleAnswer(code, btnEl) {
    if (state.locked) return;
    state.locked = true;
    const q = state.questions[state.qIndex];
    const correct = code === q.correctAction;

    Array.from(els.actionButtons.children).forEach((b) => { b.disabled = true; });

    if (correct) {
      state.correctCount += 1;
      state.xpEarned += 10;
      btnEl.classList.add('correct-flash');
      els.feedbackBanner.className = 'feedback-banner correct';
      els.feedbackText.textContent = 'Correct! ' + ACTION_REASON[q.correctAction];
      els.feedbackBanner.classList.remove('hidden');
      setTimeout(advance, 900);
    } else {
      state.hearts = Math.max(0, state.hearts - 1);
      renderHearts();
      btnEl.classList.add('wrong-flash');
      const correctBtn = Array.from(els.actionButtons.children).find((b) => b.dataset.code === q.correctAction);
      if (correctBtn) correctBtn.classList.add('correct-flash');
      els.feedbackBanner.className = 'feedback-banner wrong';
      els.feedbackText.textContent = ACTION_REASON[q.correctAction];
      els.feedbackBanner.classList.remove('hidden');
      els.lessonContinue.textContent = state.hearts <= 0 ? 'See Results' : 'Continue';
      els.lessonContinue.classList.remove('hidden');
    }
  }

  function advance() {
    if (state.hearts <= 0) {
      finishLesson(false);
      return;
    }
    state.qIndex += 1;
    if (state.qIndex >= state.questions.length) {
      finishLesson(true);
    } else {
      renderQuestion();
    }
  }

  els.lessonContinue.addEventListener('click', advance);

  els.lessonQuit.addEventListener('click', () => {
    if (confirm('Quit this lesson? Your progress on it will be lost.')) {
      showView('path');
      renderPath();
    }
  });

  function finishLesson(success) {
    if (!success) {
      showView('failed');
      return;
    }
    const total = state.questions.length;
    const accuracy = Math.round((state.correctCount / total) * 100);
    let xp = state.xpEarned;
    if (accuracy === 100) xp += 20;

    state.progress = window.Storage.completeLesson(
      state.progress,
      state.currentLesson.id,
      state.correctCount,
      total,
      xp
    );

    els.completeAccuracy.textContent = `${accuracy}%`;
    els.completeXp.textContent = `+${xp}`;
    showView('complete');
  }

  els.completeContinue.addEventListener('click', () => {
    showView('path');
    renderPath();
  });

  els.failedRetry.addEventListener('click', () => startLesson(state.currentLesson));
  els.failedHome.addEventListener('click', () => {
    showView('path');
    renderPath();
  });

  // ---------------- CHART VIEW ----------------
  function actionBadge(code) {
    const info = ACTION_INFO[code];
    const span = document.createElement('span');
    span.textContent = code;
    span.style.display = 'inline-block';
    span.style.width = '22px';
    span.style.height = '22px';
    span.style.lineHeight = '22px';
    span.style.borderRadius = '5px';
    span.style.color = '#fff';
    span.style.background = info.color;
    return span;
  }

  function buildTable(title, rowLabels, rowKeyToData) {
    const section = document.createElement('div');
    section.className = 'chart-section';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    section.appendChild(h3);

    const wrap = document.createElement('div');
    wrap.className = 'chart-table-wrap';
    const table = document.createElement('table');
    table.className = 'chart-table';

    const thead = document.createElement('tr');
    thead.innerHTML = '<th></th>' + UPCARDS.map((u) => `<th>${upcardLabel(u)}</th>`).join('');
    table.appendChild(thead);

    rowLabels.forEach((label) => {
      const tr = document.createElement('tr');
      const th = document.createElement('td');
      th.textContent = label.display;
      tr.appendChild(th);
      UPCARDS.forEach((u) => {
        const raw = rowKeyToData(label.key, u);
        const resolved = resolveAction(raw, ACTION_ORDER);
        const td = document.createElement('td');
        td.appendChild(actionBadge(resolved));
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
  }

  function renderChart() {
    els.chartScroll.innerHTML = '';

    const legend = document.createElement('div');
    legend.className = 'legend';
    ACTION_ORDER.forEach((code) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-swatch" style="background:${ACTION_INFO[code].color}"></span>${ACTION_INFO[code].label}`;
      legend.appendChild(item);
    });
    els.chartScroll.appendChild(legend);

    const { HARD, SOFT, PAIRS } = window.Strategy;

    const hardRows = Object.keys(HARD).map(Number).sort((a, b) => a - b).map((t) => ({ key: t, display: String(t) }));
    els.chartScroll.appendChild(buildTable('Hard Totals', hardRows, (key, u) => {
      const idx = UPCARDS.indexOf(u);
      return HARD[key][idx];
    }));

    const softRows = Object.keys(SOFT).map(Number).sort((a, b) => a - b).map((t) => ({ key: t, display: `A,${t - 11}` }));
    els.chartScroll.appendChild(buildTable('Soft Totals', softRows, (key, u) => {
      const idx = UPCARDS.indexOf(u);
      return SOFT[key][idx];
    }));

    const pairOrder = ['A', 2, 3, 4, 5, 6, 7, 8, 9, '10'];
    const pairRows = pairOrder.map((k) => ({ key: k, display: k === 'A' ? 'A,A' : `${k},${k}` }));
    els.chartScroll.appendChild(buildTable('Pairs', pairRows, (key, u) => {
      const idx = UPCARDS.indexOf(u);
      return PAIRS[key][idx];
    }));
  }

  // ---------------- STATS VIEW ----------------
  function renderStats() {
    els.statsStreak.textContent = state.progress.streak;
    els.statsXp.textContent = state.progress.xp;
    els.statsLessons.textContent = `${state.progress.completedLessons.length} / ${ALL_LESSONS.length}`;
  }

  els.statsReset.addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      state.progress = window.Storage.resetProgress();
      renderStats();
      renderPath();
    }
  });

  // ---------------- NAV ----------------
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      showView(view);
      if (view === 'path') renderPath();
      if (view === 'chart') renderChart();
      if (view === 'stats') renderStats();
    });
  });

  // ---------------- INIT ----------------
  renderPath();
  showView('path');

  // Minimal read-only hook for automated smoke testing (scripts/smoke-test.js).
  window.__bjTrainerDebug = { state };
})();
