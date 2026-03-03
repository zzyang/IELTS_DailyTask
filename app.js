(() => {
  const MCQ_COUNT = 6;
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
  const STORAGE_KEY = 'ielts_task_state_v2';
  const pool = Array.isArray(window.WORD_BANK) ? window.WORD_BANK : [];
  const listIds = [...new Set(pool.map((x) => Number(x.list_no)).filter((x) => Number.isInteger(x)))].sort((a, b) => a - b);

  const dateLabel = document.getElementById('dateLabel');
  const todayTabBtn = document.getElementById('todayTabBtn');
  const historyTabBtn = document.getElementById('historyTabBtn');
  const statsTabBtn = document.getElementById('statsTabBtn');

  const taskBoard = document.getElementById('taskBoard');
  const boardSummary = document.getElementById('boardSummary');
  const taskList = document.getElementById('taskList');
  const showTodayWordsBtn = document.getElementById('showTodayWordsBtn');
  const hideTodayWordsBtn = document.getElementById('hideTodayWordsBtn');
  const todayWordsPanel = document.getElementById('todayWordsPanel');
  const todayWordsList = document.getElementById('todayWordsList');

  const historyBoard = document.getElementById('historyBoard');
  const historySummary = document.getElementById('historySummary');
  const historyPendingList = document.getElementById('historyPendingList');
  const statsBoard = document.getElementById('statsBoard');
  const statsSummary = document.getElementById('statsSummary');
  const statsList = document.getElementById('statsList');
  const historyDateInput = document.getElementById('historyDateInput');
  const reviewSuggestList = document.getElementById('reviewSuggestList');

  const quizCard = document.getElementById('quizCard');
  const resultCard = document.getElementById('resultCard');

  const taskTitle = document.getElementById('taskTitle');
  const taskMeta = document.getElementById('taskMeta');
  const progressText = document.getElementById('progressText');
  const scoreText = document.getElementById('scoreText');
  const timerText = document.getElementById('timerText');
  const progressFill = document.getElementById('progressFill');
  const promptText = document.getElementById('promptText');

  const spellingHints = document.getElementById('spellingHints');
  const wordMask = document.getElementById('wordMask');
  const spellingWrap = document.getElementById('spellingWrap');
  const answerInput = document.getElementById('answerInput');
  const mcqWrap = document.getElementById('mcqWrap');
  const mcqOptions = document.getElementById('mcqOptions');

  const feedback = document.getElementById('feedback');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');
  const quitBtn = document.getElementById('quitBtn');
  const resetTaskBtn = document.getElementById('resetTaskBtn');

  const resultTitle = document.getElementById('resultTitle');
  const finalScore = document.getElementById('finalScore');
  const wrongList = document.getElementById('wrongList');
  const backBoardBtn = document.getElementById('backBoardBtn');

  function toDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function diffDays(fromKey, toKey) {
    const from = parseDateKey(fromKey);
    const to = parseDateKey(toKey);
    const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
    return Math.round(ms / 86400000);
  }

  function normalize(word) {
    return word.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function escapeHTML(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildWordMask(word) {
    if (!word || !/[A-Za-z]/.test(word)) return '-';
    return word.replace(/[A-Za-z]+/g, (seg) => {
      if (seg.length <= 2) return seg;
      return seg[0] + '_'.repeat(seg.length - 2) + seg[seg.length - 1];
    });
  }

  function lexMeta(q) {
    const parts = [];
    if (q.phonetic) parts.push(q.phonetic);
    if (q.pos) parts.push(q.pos);
    return parts.join('  ');
  }

  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function randomShuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function sameOrder(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
    return true;
  }

  function getListLabel(listId) {
    return `Word List ${String(listId).padStart(2, '0')}`;
  }

  function getWordsByList(listId) {
    return pool.filter((item) => Number(item.list_no) === Number(listId));
  }

  function loadState() {
    const fallback = { anchorDate: '', taskProgress: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        anchorDate: typeof parsed.anchorDate === 'string' ? parsed.anchorDate : '',
        taskProgress: parsed.taskProgress && typeof parsed.taskProgress === 'object' ? parsed.taskProgress : {},
      };
    } catch {
      return fallback;
    }
  }

  const state = loadState();
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  const today = new Date();
  const todayKey = toDateKey(today);
  if (!state.anchorDate) {
    state.anchorDate = todayKey;
    saveState();
  }

  function getTodayListId() {
    if (!listIds.length) return null;
    const offset = diffDays(state.anchorDate, todayKey);
    const idx = ((offset % listIds.length) + listIds.length) % listIds.length;
    return listIds[idx];
  }

  function getTaskDone(taskId) {
    return Boolean(state.taskProgress[taskId]?.done);
  }

  function markTaskDone(taskId, score, total, wrong) {
    state.taskProgress[taskId] = {
      done: true,
      score,
      total,
      wrongCount: wrong.length,
      finishedAt: new Date().toISOString(),
    };
    saveState();
  }

  function todayTasks() {
    const listId = getTodayListId();
    const label = getListLabel(listId || 0);
    const words = listId ? getWordsByList(listId) : [];
    return [
      {
        id: `${todayKey}|new|spell|${listId}`,
        type: 'spell',
        sourceDate: todayKey,
        label: '拼写测试',
        desc: `${label} | ${words.length}词`,
        words,
      },
      {
        id: `${todayKey}|new|choice|${listId}`,
        type: 'choice',
        sourceDate: todayKey,
        label: '词义测试',
        desc: `${label} | ${words.length}词，6选1`,
        words,
      },
    ];
  }

  function reviewTaskGroups() {
    return listIds.map((listId) => {
      const words = getWordsByList(listId);
      const label = getListLabel(listId);
      return {
        listId,
        label,
        words,
        spellTask: {
          id: `review|${listId}|spell`,
          type: 'spell',
          sourceDate: label,
          label: `拼写测试(${label})`,
          desc: `${label} | ${words.length}词`,
          words,
        },
        choiceTask: {
          id: `review|${listId}|choice`,
          type: 'choice',
          sourceDate: label,
          label: `词义测试(${label})`,
          desc: `${label} | ${words.length}词，6选1`,
          words,
        },
      };
    });
  }

  let activeView = 'today';
  let session = null;
  let timerInterval = null;
  let todayWordsVisible = false;
  let selectedHistoryDate = todayKey;
  const lastRunOrderByTask = {};

  dateLabel.textContent = `日期：${today.toLocaleDateString('zh-CN')}`;
  if (historyDateInput) historyDateInput.value = todayKey;

  if (!pool.length) {
    taskList.innerHTML = '<p>词库加载失败，请检查 wordlist.js。</p>';
    return;
  }
  if (!listIds.length) {
    taskList.innerHTML = '<p>词表分组加载失败，请检查 wordlist.js 是否包含 list_no。</p>';
    return;
  }

  function renderTodayWordsPanel() {
    const listId = getTodayListId();
    const words = listId ? getWordsByList(listId) : [];
    todayWordsList.innerHTML = '';
    words.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'today-word-item';
      div.innerHTML = `
        <div><span class="w">${idx + 1}. ${escapeHTML(item.word)}</span></div>
        <div class="meta">${escapeHTML(item.phonetic || '-')}  ${escapeHTML(item.pos || '-')}</div>
        <div>${escapeHTML(item.meaning)}</div>
      `;
      todayWordsList.appendChild(div);
    });
  }

  function setTodayWordsVisible(visible) {
    todayWordsVisible = visible;
    if (visible) {
      renderTodayWordsPanel();
      todayWordsPanel.classList.remove('hidden');
    } else {
      todayWordsPanel.classList.add('hidden');
    }
  }

  function renderTodayBoard() {
    const tasks = todayTasks();
    const [spellTask, choiceTask] = tasks;
    const spellDone = getTaskDone(spellTask.id);
    const choiceDone = getTaskDone(choiceTask.id);
    const listId = getTodayListId();
    const listLabel = getListLabel(listId || 0);
    boardSummary.textContent = `${listLabel} | 完成 ${(spellDone ? 1 : 0) + (choiceDone ? 1 : 0)} / 2`;

    taskList.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'task-item';

    const top = document.createElement('div');
    top.className = 'task-top';
    const name = document.createElement('div');
    name.className = 'task-name';
    name.textContent = `${listLabel} 今日任务`;
    const tag = document.createElement('span');
    tag.className = `tag${spellDone && choiceDone ? ' done' : ''}`;
    tag.textContent = spellDone && choiceDone ? '已完成' : '可练习';
    top.appendChild(name);
    top.appendChild(tag);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `${spellTask.words.length}词`;

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';

    const spellBtn = document.createElement('button');
    spellBtn.textContent = spellDone ? '重做拼写' : '拼写测试';
    spellBtn.addEventListener('click', () => startTask(spellTask, 'today'));

    const choiceBtn = document.createElement('button');
    choiceBtn.textContent = choiceDone ? '重做词义' : '词义测试';
    choiceBtn.addEventListener('click', () => startTask(choiceTask, 'today'));

    const wordsBtn = document.createElement('button');
    wordsBtn.type = 'button';
    wordsBtn.textContent = todayWordsVisible ? '收起今日单词' : '今日单词';
    wordsBtn.addEventListener('click', () => setTodayWordsVisible(!todayWordsVisible));

    btnRow.appendChild(spellBtn);
    btnRow.appendChild(choiceBtn);
    btnRow.appendChild(wordsBtn);

    wrapper.appendChild(top);
    wrapper.appendChild(meta);
    wrapper.appendChild(btnRow);
    taskList.appendChild(wrapper);
  }

  function renderReviewBoard() {
    const groups = reviewTaskGroups();
    historySummary.textContent = `可选词表任务：${groups.length} 个`;
    historyPendingList.innerHTML = '';

    groups.forEach((g) => {
      const spellDone = getTaskDone(g.spellTask.id);
      const choiceDone = getTaskDone(g.choiceTask.id);

      const wrapper = document.createElement('div');
      wrapper.className = 'task-item';

      const top = document.createElement('div');
      top.className = 'task-top';
      const name = document.createElement('div');
      name.className = 'task-name';
      name.textContent = `${g.label}`;
      const tag = document.createElement('span');
      tag.className = `tag${spellDone && choiceDone ? ' done' : ''}`;
      tag.textContent = spellDone && choiceDone ? '已完成' : '可练习';
      top.appendChild(name);
      top.appendChild(tag);

      const meta = document.createElement('div');
      meta.className = 'task-meta';
      meta.textContent = `${g.words.length}词`;

      const btnRow = document.createElement('div');
      btnRow.className = 'btn-row';

      const spellBtn = document.createElement('button');
      spellBtn.textContent = spellDone ? '重做拼写' : '拼写测试';
      spellBtn.addEventListener('click', () => startTask(g.spellTask, 'history'));

      const choiceBtn = document.createElement('button');
      choiceBtn.textContent = choiceDone ? '重做词义' : '词义测试';
      choiceBtn.addEventListener('click', () => startTask(g.choiceTask, 'history'));

      const wordsBtn = document.createElement('button');
      wordsBtn.type = 'button';
      wordsBtn.textContent = '复习单词';

      const wordsPanel = document.createElement('div');
      wordsPanel.className = 'task-words-panel hidden';
      const wordsList = document.createElement('div');
      wordsList.className = 'today-words-list';
      wordsPanel.appendChild(wordsList);

      wordsBtn.addEventListener('click', () => {
        const open = wordsPanel.classList.contains('hidden');
        if (!open) {
          wordsPanel.classList.add('hidden');
          wordsBtn.textContent = '复习单词';
          return;
        }
        wordsList.innerHTML = '';
        g.words.forEach((item, idx) => {
          const div = document.createElement('div');
          div.className = 'today-word-item';
          div.innerHTML = `
            <div><span class="w">${idx + 1}. ${escapeHTML(item.word)}</span></div>
            <div class="meta">${escapeHTML(item.phonetic || '-')}  ${escapeHTML(item.pos || '-')}</div>
            <div>${escapeHTML(item.meaning)}</div>
          `;
          wordsList.appendChild(div);
        });
        wordsPanel.classList.remove('hidden');
        wordsBtn.textContent = '收起复习单词';
      });

      btnRow.appendChild(spellBtn);
      btnRow.appendChild(choiceBtn);
      btnRow.appendChild(wordsBtn);

      wrapper.appendChild(top);
      wrapper.appendChild(meta);
      wrapper.appendChild(btnRow);
      wrapper.appendChild(wordsPanel);
      historyPendingList.appendChild(wrapper);
    });
  }

  function collectNewTaskRows() {
    const rows = {};
    Object.entries(state.taskProgress).forEach(([taskId, info]) => {
      if (!info?.done) return;
      const m = taskId.match(/^(\\d{4}-\\d{2}-\\d{2})\\|new\\|(spell|choice)\\|(\\d+)$/);
      if (!m) return;
      const [, dateKey, kind, listIdRaw] = m;
      const listId = Number(listIdRaw);
      if (!rows[dateKey]) {
        rows[dateKey] = { dateKey, listId, spell: false, choice: false };
      }
      rows[dateKey].listId = listId;
      if (kind === 'spell') rows[dateKey].spell = true;
      if (kind === 'choice') rows[dateKey].choice = true;
    });
    return rows;
  }

  function renderStatsBoard(dateKey) {
    const rows = collectNewTaskRows();
    const dayRows = Object.values(rows).filter((r) => r.dateKey === dateKey);
    const suggestRows = Object.values(rows).filter((r) => {
      if (!(r.spell && r.choice)) return false;
      const gap = diffDays(r.dateKey, dateKey);
      return REVIEW_INTERVALS.includes(gap);
    }).sort((a, b) => (a.dateKey > b.dateKey ? -1 : 1));

    if (historyDateInput) historyDateInput.value = dateKey;
    statsSummary.textContent = `${dateKey} | 完成词表 ${dayRows.length} | 建议复习 ${suggestRows.length}`;

    statsList.innerHTML = '';
    reviewSuggestList.innerHTML = '';

    if (!dayRows.length) {
      statsList.innerHTML = '<p class=\"note\">当天没有完成新词测试记录。</p>';
    } else {
      dayRows.forEach((row) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'task-item';

        const top = document.createElement('div');
        top.className = 'task-top';
        const name = document.createElement('div');
        name.className = 'task-name';
        name.textContent = `${getListLabel(row.listId)}`;
        const doneAll = row.spell && row.choice;
        const tag = document.createElement('span');
        tag.className = `tag${doneAll ? ' done' : ''}`;
        tag.textContent = doneAll ? '已完成' : '部分完成';
        top.appendChild(name);
        top.appendChild(tag);

        const meta = document.createElement('div');
        meta.className = 'task-meta';
        meta.textContent = `拼写测试: ${row.spell ? '已完成' : '未完成'} | 词义测试: ${row.choice ? '已完成' : '未完成'}`;

        wrapper.appendChild(top);
        wrapper.appendChild(meta);
        statsList.appendChild(wrapper);
      });
    }

    if (!suggestRows.length) {
      reviewSuggestList.innerHTML = '<p class=\"note\">当天无遗忘曲线建议复习词表。</p>';
    } else {
      suggestRows.forEach((row) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'task-item';
        const gap = diffDays(row.dateKey, dateKey);

        const top = document.createElement('div');
        top.className = 'task-top';
        const name = document.createElement('div');
        name.className = 'task-name';
        name.textContent = `${getListLabel(row.listId)}`;
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = `间隔 ${gap} 天`;
        top.appendChild(name);
        top.appendChild(tag);

        const meta = document.createElement('div');
        meta.className = 'task-meta';
        meta.textContent = `学习日期: ${row.dateKey}`;
        wrapper.appendChild(top);
        wrapper.appendChild(meta);
        reviewSuggestList.appendChild(wrapper);
      });
    }
  }

  function setView(view) {
    activeView = view;
    stopTimer();
    session = null;
    quizCard.classList.add('hidden');
    resultCard.classList.add('hidden');

    if (view === 'today') {
      taskBoard.classList.remove('hidden');
      historyBoard.classList.add('hidden');
      statsBoard.classList.add('hidden');
      renderTodayBoard();
      setTodayWordsVisible(todayWordsVisible);
    } else if (view === 'history') {
      taskBoard.classList.add('hidden');
      historyBoard.classList.remove('hidden');
      statsBoard.classList.add('hidden');
      setTodayWordsVisible(false);
      renderReviewBoard();
    } else {
      taskBoard.classList.add('hidden');
      historyBoard.classList.add('hidden');
      statsBoard.classList.remove('hidden');
      setTodayWordsVisible(false);
      renderStatsBoard(selectedHistoryDate);
    }
  }

  function createChoiceOptions(task, questionIndex) {
    const q = task.words[questionIndex];
    const distractors = task.words.filter((w) => w.word !== q.word);
    const shuffled = randomShuffle(distractors).slice(0, MCQ_COUNT - 1);
    const options = shuffled.map((w) => ({ meaning: w.meaning, correct: false }));
    options.push({ meaning: q.meaning, correct: true });
    return randomShuffle(options);
  }

  function buildRunQueue(task) {
    const base = task.words.map((_, i) => i);
    if (base.length <= 1) return base;
    const prev = lastRunOrderByTask[task.id];
    let next = randomShuffle(base);
    let tries = 0;
    while (sameOrder(next, prev) && tries < 5) {
      next = randomShuffle(base);
      tries += 1;
    }
    lastRunOrderByTask[task.id] = next.slice();
    return next;
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (!session) return;
      timerText.textContent = `用时: ${formatDuration(Date.now() - session.startedAt)}`;
    }, 1000);
  }

  function startTask(task, sourceView) {
    session = {
      task,
      returnView: sourceView,
      queue: buildRunQueue(task),
      currentIndex: null,
      completed: new Set(),
      attemptCount: 0,
      score: 0,
      checked: false,
      wrong: [],
      selectedChoice: null,
      choiceOptions: [],
      startedAt: Date.now(),
      elapsedMs: 0,
    };

    taskBoard.classList.add('hidden');
    historyBoard.classList.add('hidden');
    resultCard.classList.add('hidden');
    quizCard.classList.remove('hidden');

    taskTitle.textContent = task.label;
    taskMeta.textContent = task.desc;
    timerText.textContent = '用时: 00:00';
    startTimer();
    renderQuestion();
  }

  function renderSpellQuestion(q) {
    const meta = lexMeta(q);
    promptText.innerHTML = meta
      ? `<span>${escapeHTML(q.meaning)}</span><div class="prompt-meta">${escapeHTML(meta)}</div>`
      : escapeHTML(q.meaning);

    spellingHints.classList.remove('hidden');
    spellingWrap.classList.remove('hidden');
    mcqWrap.classList.add('hidden');
    wordMask.textContent = buildWordMask(q.word);
    answerInput.value = '';
    answerInput.focus();
  }

  function renderChoiceQuestion(q) {
    const meta = lexMeta(q);
    promptText.innerHTML = meta
      ? `<span>${escapeHTML(q.word)}</span><span class="prompt-meta-inline"> ${escapeHTML(meta)}</span>`
      : escapeHTML(q.word);

    spellingHints.classList.add('hidden');
    spellingWrap.classList.add('hidden');
    mcqWrap.classList.remove('hidden');

    session.choiceOptions = createChoiceOptions(session.task, session.currentIndex);
    session.selectedChoice = null;
    mcqOptions.innerHTML = '';

    session.choiceOptions.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'mcq-option';
      btn.type = 'button';
      btn.textContent = opt.meaning;
      btn.addEventListener('click', () => {
        if (session.checked) return;
        session.selectedChoice = idx;
        [...mcqOptions.children].forEach((el, i) => el.classList.toggle('selected', i === idx));
      });
      mcqOptions.appendChild(btn);
    });
  }

  function renderQuestion() {
    if (!session.queue.length) {
      showResult();
      return;
    }

    session.currentIndex = session.queue[0];
    const q = session.task.words[session.currentIndex];
    const doneCount = session.completed.size;

    progressText.textContent = `已掌握: ${doneCount} / ${session.task.words.length} | 当前第 ${session.attemptCount + 1} 次作答`;
    scoreText.textContent = `答对次数: ${session.score}`;
    progressFill.style.width = `${(doneCount / session.task.words.length) * 100}%`;

    feedback.textContent = '';
    feedback.className = 'feedback';

    session.checked = false;
    submitBtn.disabled = false;
    nextBtn.disabled = false;

    if (session.task.type === 'spell') renderSpellQuestion(q);
    else renderChoiceQuestion(q);
  }

  function lockChoiceOptions(correctIndex, selectedIndex) {
    [...mcqOptions.children].forEach((el, idx) => {
      if (idx === correctIndex) el.classList.add('lock-correct');
      if (idx === selectedIndex && idx !== correctIndex) el.classList.add('lock-wrong');
      el.disabled = true;
    });
  }

  function checkAnswer() {
    if (!session || session.checked) return;

    const q = session.task.words[session.currentIndex];
    session.attemptCount += 1;

    let isCorrect = false;
    let userAnswer = '';

    if (session.task.type === 'spell') {
      userAnswer = answerInput.value.trim();
      if (!userAnswer) {
        feedback.textContent = '请先输入拼写。';
        feedback.className = 'feedback err';
        return;
      }
      isCorrect = normalize(userAnswer) === normalize(q.word);
    } else {
      if (session.selectedChoice === null) {
        feedback.textContent = '请先选择一个中文释义。';
        feedback.className = 'feedback err';
        return;
      }
      const selected = session.choiceOptions[session.selectedChoice];
      userAnswer = selected.meaning;
      isCorrect = Boolean(selected.correct);
      lockChoiceOptions(session.choiceOptions.findIndex((o) => o.correct), session.selectedChoice);
    }

    session.checked = true;
    submitBtn.disabled = true;
    nextBtn.disabled = false;

    if (isCorrect) {
      session.score += 1;
      session.completed.add(session.currentIndex);
      session.queue.shift();
      feedback.textContent = '正确';
      feedback.className = 'feedback ok';
    } else {
      const wrongIndex = session.queue.shift();
      session.queue.push(wrongIndex);
      feedback.textContent = session.task.type === 'spell' ? `错误，正确答案：${q.word}` : `错误，正确答案：${q.meaning}`;
      feedback.className = 'feedback err';
      session.wrong.push({ ...q, userAnswer });
    }

    scoreText.textContent = `答对次数: ${session.score}`;
    progressFill.style.width = `${(session.completed.size / session.task.words.length) * 100}%`;
  }

  function showResult() {
    stopTimer();
    session.elapsedMs = Date.now() - session.startedAt;
    markTaskDone(session.task.id, session.score, session.task.words.length, session.wrong);

    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    resultTitle.textContent = session.task.label;
    finalScore.textContent = `总用时：${formatDuration(session.elapsedMs)} | 答对次数：${session.score} | 总作答：${session.attemptCount}`;

    wrongList.innerHTML = '';
    if (!session.wrong.length) {
      wrongList.innerHTML = '<p>本任务全对。</p>';
    } else {
      const title = document.createElement('p');
      title.textContent = `错题记录 ${session.wrong.length} 条：`;
      wrongList.appendChild(title);
      session.wrong.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'wrong-item';
        div.textContent = `${item.word} | 你的答案: ${item.userAnswer || '(空)'} | 释义: ${item.meaning}`;
        wrongList.appendChild(div);
      });
    }

    window.alert(`恭喜完成任务：${session.task.label}\n总完成时间：${formatDuration(session.elapsedMs)}`);
  }

  function goNext() {
    if (!session) return;
    if (!session.checked) {
      if (session.queue.length > 1) {
        const skipped = session.queue.shift();
        session.queue.push(skipped);
      }
      renderQuestion();
      return;
    }
    if (!session.queue.length) showResult();
    else renderQuestion();
  }

  function backToBoard() {
    const retView = session?.returnView || activeView;
    stopTimer();
    session = null;
    quizCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    setView(retView);
  }

  function resetCurrentTask() {
    if (!session) return;
    if (!window.confirm('确认重新开始当前任务吗？当前进度将重置。')) return;
    startTask(session.task, session.returnView);
  }

  function bindViewSwitch(btn, view) {
    const handler = (e) => {
      e.preventDefault();
      setView(view);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', handler, { passive: false });
  }

  submitBtn.addEventListener('click', checkAnswer);
  nextBtn.addEventListener('click', goNext);
  quitBtn.addEventListener('click', backToBoard);
  resetTaskBtn.addEventListener('click', resetCurrentTask);
  backBoardBtn.addEventListener('click', backToBoard);

  answerInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !session || session.task.type !== 'spell') return;
    if (session.checked) goNext();
    else checkAnswer();
  });

  if (showTodayWordsBtn && hideTodayWordsBtn) {
    showTodayWordsBtn.addEventListener('click', () => setTodayWordsVisible(!todayWordsVisible));
    hideTodayWordsBtn.addEventListener('click', () => setTodayWordsVisible(false));
  } else if (hideTodayWordsBtn) {
    hideTodayWordsBtn.addEventListener('click', () => setTodayWordsVisible(false));
  }

  bindViewSwitch(todayTabBtn, 'today');
  bindViewSwitch(historyTabBtn, 'history');
  bindViewSwitch(statsTabBtn, 'stats');
  if (historyDateInput) {
    historyDateInput.addEventListener('change', () => {
      selectedHistoryDate = historyDateInput.value || todayKey;
      renderStatsBoard(selectedHistoryDate);
    });
  }
  setView('today');
})();
