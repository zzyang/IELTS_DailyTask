(() => {
  const DAILY_COUNT = 30;
  const MCQ_COUNT = 6;
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
  const STORAGE_KEY = 'ielts_task_state_v1';
  const pool = Array.isArray(window.WORD_BANK) ? window.WORD_BANK : [];

  const dateLabel = document.getElementById('dateLabel');

  const todayTabBtn = document.getElementById('todayTabBtn');
  const historyTabBtn = document.getElementById('historyTabBtn');

  const taskBoard = document.getElementById('taskBoard');
  const boardSummary = document.getElementById('boardSummary');
  const taskList = document.getElementById('taskList');
  const openHistoryBtn = document.getElementById('openHistoryBtn');

  const historyBoard = document.getElementById('historyBoard');
  const historySummary = document.getElementById('historySummary');
  const historyDateInput = document.getElementById('historyDateInput');
  const historyPendingList = document.getElementById('historyPendingList');
  const historyDoneList = document.getElementById('historyDoneList');

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
  const firstLetter = document.getElementById('firstLetter');
  const lastLetter = document.getElementById('lastLetter');
  const wordLength = document.getElementById('wordLength');

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

  function hashString(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }

  function mulberry32(seed) {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleBySeed(arr, seedText) {
    const out = arr.slice();
    const seed = hashString(seedText)();
    const rnd = mulberry32(seed);
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function normalize(word) {
    return word.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function alphaLength(word) {
    const letters = word.match(/[A-Za-z]/g);
    return letters ? letters.length : word.length;
  }

  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function escapeHTML(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function lexMeta(q) {
    const parts = [];
    if (q.phonetic) parts.push(q.phonetic);
    if (q.pos) parts.push(q.pos);
    return parts.join('  ');
  }

  function loadState() {
    const fallback = {
      schedule: {
        order: [],
        cursor: 0,
        cycle: 0,
      },
      dailySets: {},
      taskProgress: {},
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        schedule: {
          order: Array.isArray(parsed.schedule?.order) ? parsed.schedule.order : [],
          cursor: Number.isInteger(parsed.schedule?.cursor) ? parsed.schedule.cursor : 0,
          cycle: Number.isInteger(parsed.schedule?.cycle) ? parsed.schedule.cycle : 0,
        },
        dailySets: parsed.dailySets && typeof parsed.dailySets === 'object' ? parsed.dailySets : {},
        taskProgress: parsed.taskProgress && typeof parsed.taskProgress === 'object' ? parsed.taskProgress : {},
      };
    } catch (e) {
      return fallback;
    }
  }

  const state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function ensureOrder() {
    if (state.schedule.order.length === pool.length) return;
    const indexes = Array.from({ length: pool.length }, (_, i) => i);
    state.schedule.order = shuffleBySeed(indexes, `cycle-${state.schedule.cycle}`);
    state.schedule.cursor = 0;
  }

  function ensureDailySet(dateKey) {
    if (Array.isArray(state.dailySets[dateKey]) && state.dailySets[dateKey].length) {
      return state.dailySets[dateKey];
    }

    ensureOrder();
    const set = [];
    const used = new Set();

    while (set.length < Math.min(DAILY_COUNT, pool.length)) {
      if (state.schedule.cursor >= state.schedule.order.length) {
        state.schedule.cycle += 1;
        state.schedule.order = shuffleBySeed(
          Array.from({ length: pool.length }, (_, i) => i),
          `cycle-${state.schedule.cycle}`,
        );
        state.schedule.cursor = 0;
      }

      const idx = state.schedule.order[state.schedule.cursor];
      state.schedule.cursor += 1;

      if (!used.has(idx)) {
        used.add(idx);
        set.push(idx);
      }
    }

    state.dailySets[dateKey] = set;
    saveState();
    return set;
  }

  function getWordsByDate(dateKey) {
    const indexes = ensureDailySet(dateKey);
    return indexes.map((i) => pool[i]).filter(Boolean);
  }

  function buildTasksForDate(targetDateKey) {
    const tasks = [];
    const targetWords = getWordsByDate(targetDateKey);

    tasks.push({
      id: `${targetDateKey}|new|spell`,
      type: 'spell',
      sourceDate: targetDateKey,
      taskDate: targetDateKey,
      label: '新词: 中文拼英文',
      desc: '30词，给中文输入英文，含首尾字母和长度提示',
      words: targetWords,
    });

    tasks.push({
      id: `${targetDateKey}|new|choice`,
      type: 'choice',
      sourceDate: targetDateKey,
      taskDate: targetDateKey,
      label: '新词: 英文选中文',
      desc: '30词，英文题干，6选1（选项来自这30词）',
      words: targetWords,
    });

    const allDates = Object.keys(state.dailySets).filter((k) => k < targetDateKey).sort();
    allDates.forEach((sourceDate) => {
      const gap = diffDays(sourceDate, targetDateKey);
      if (!REVIEW_INTERVALS.includes(gap)) return;
      const words = getWordsByDate(sourceDate);

      tasks.push({
        id: `${targetDateKey}|review|spell|${sourceDate}`,
        type: 'spell',
        sourceDate,
        taskDate: targetDateKey,
        label: `复习(${sourceDate}): 中文拼英文`,
        desc: `遗忘曲线第 ${gap} 天复习`,
        words,
      });

      tasks.push({
        id: `${targetDateKey}|review|choice|${sourceDate}`,
        type: 'choice',
        sourceDate,
        taskDate: targetDateKey,
        label: `复习(${sourceDate}): 英文选中文`,
        desc: `遗忘曲线第 ${gap} 天复习`,
        words,
      });
    });

    return tasks;
  }

  const today = new Date();
  const todayKey = toDateKey(today);
  let activeView = 'today';
  let historyDateKey = todayKey;
  let session = null;
  let timerInterval = null;
  const lastRunOrderByTask = {};

  dateLabel.textContent = `日期：${today.toLocaleDateString('zh-CN')}`;
  historyDateInput.value = todayKey;

  if (!pool.length) {
    taskBoard.classList.remove('hidden');
    taskList.innerHTML = '<p>词库加载失败，请检查 wordlist.js。</p>';
    return;
  }

  ensureDailySet(todayKey);

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

  function renderTaskItems(listEl, tasks, emptyText, sourceView, sourceDateKey) {
    listEl.innerHTML = '';
    if (!tasks.length) {
      listEl.innerHTML = `<p class="note">${emptyText}</p>`;
      return;
    }

    tasks.forEach((task) => {
      const done = getTaskDone(task.id);
      const wrapper = document.createElement('div');
      wrapper.className = 'task-item';

      const top = document.createElement('div');
      top.className = 'task-top';

      const name = document.createElement('div');
      name.className = 'task-name';
      name.textContent = task.label;

      const tag = document.createElement('span');
      tag.className = `tag${done ? ' done' : ''}`;
      tag.textContent = done ? '已完成' : '待完成';

      top.appendChild(name);
      top.appendChild(tag);

      const meta = document.createElement('div');
      meta.className = 'task-meta';
      meta.textContent = `${task.desc} | 词数: ${task.words.length}`;

      const btnRow = document.createElement('div');
      btnRow.className = 'btn-row';

      const btn = document.createElement('button');
      btn.className = done ? 'secondary' : '';
      btn.textContent = done ? '重做任务' : '开始任务';
      btn.addEventListener('click', () => startTask(task, sourceView, sourceDateKey));
      btnRow.appendChild(btn);

      wrapper.appendChild(top);
      wrapper.appendChild(meta);
      wrapper.appendChild(btnRow);
      listEl.appendChild(wrapper);
    });
  }

  function renderTodayBoard() {
    const tasks = buildTasksForDate(todayKey);
    const doneCount = tasks.filter((t) => getTaskDone(t.id)).length;
    boardSummary.textContent = `完成 ${doneCount} / ${tasks.length}`;
    renderTaskItems(taskList, tasks, '今天暂无任务。', 'today', todayKey);
  }

  function renderHistoryBoard(dateKey) {
    const tasks = buildTasksForDate(dateKey);
    const doneTasks = tasks.filter((t) => getTaskDone(t.id));
    const pendingTasks = tasks.filter((t) => !getTaskDone(t.id));
    historySummary.textContent = `${dateKey} | 待办 ${pendingTasks.length} | 已完成 ${doneTasks.length}`;
    renderTaskItems(historyPendingList, pendingTasks, '这一天没有待办任务。', 'history', dateKey);
    renderTaskItems(historyDoneList, doneTasks, '这一天还没有已完成任务。', 'history', dateKey);
  }

  function setView(view) {
    activeView = view;
    const isToday = view === 'today';

    stopTimer();
    session = null;
    quizCard.classList.add('hidden');
    resultCard.classList.add('hidden');

    if (isToday) {
      taskBoard.classList.remove('hidden');
      historyBoard.classList.add('hidden');
      todayTabBtn.classList.remove('secondary');
      historyTabBtn.classList.add('secondary');
      renderTodayBoard();
    } else {
      taskBoard.classList.add('hidden');
      historyBoard.classList.remove('hidden');
      todayTabBtn.classList.add('secondary');
      historyTabBtn.classList.remove('secondary');
      historyDateInput.value = historyDateKey;
      renderHistoryBoard(historyDateKey);
    }
  }

  function createChoiceOptions(task, questionIndex) {
    const q = task.words[questionIndex];
    const distractors = task.words.filter((w) => w.word !== q.word);
    const shuffled = shuffleBySeed(distractors, `${task.id}|opt|${questionIndex}`).slice(0, MCQ_COUNT - 1);
    const options = shuffled.map((w) => ({ word: w.word, meaning: w.meaning, correct: false }));
    options.push({ word: q.word, meaning: q.meaning, correct: true });
    return shuffleBySeed(options, `${task.id}|ans|${questionIndex}`);
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
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
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
      const used = Date.now() - session.startedAt;
      timerText.textContent = `用时: ${formatDuration(used)}`;
    }, 1000);
  }

  function startTask(task, sourceView, sourceDateKey) {
    session = {
      task,
      returnView: sourceView,
      returnDateKey: sourceDateKey,
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
    taskMeta.textContent = `${task.desc} | 词源日期: ${task.sourceDate}`;
    timerText.textContent = '用时: 00:00';

    startTimer();
    renderQuestion();
  }

  function renderSpellQuestion(q) {
    const meta = lexMeta(q);
    if (meta) {
      promptText.innerHTML = `<span>${escapeHTML(q.meaning)}</span><div class=\"prompt-meta\">${escapeHTML(meta)}</div>`;
    } else {
      promptText.textContent = q.meaning;
    }
    spellingHints.classList.remove('hidden');
    spellingWrap.classList.remove('hidden');
    mcqWrap.classList.add('hidden');

    firstLetter.textContent = q.word[0] || '-';
    lastLetter.textContent = q.word[q.word.length - 1] || '-';
    wordLength.textContent = String(alphaLength(q.word));

    answerInput.value = '';
    answerInput.focus();
  }

  function renderChoiceQuestion(q) {
    const meta = lexMeta(q);
    if (meta) {
      promptText.innerHTML = `<span>${escapeHTML(q.word)}</span><span class=\"prompt-meta-inline\"> ${escapeHTML(meta)}</span>`;
    } else {
      promptText.textContent = q.word;
    }
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
        [...mcqOptions.children].forEach((child, i) => {
          child.classList.toggle('selected', i === idx);
        });
      });
      mcqOptions.appendChild(btn);
    });
  }

  function renderQuestion() {
    const { task, score } = session;
    if (!session.queue.length) {
      showResult();
      return;
    }

    session.currentIndex = session.queue[0];
    const q = task.words[session.currentIndex];
    const doneCount = session.completed.size;

    progressText.textContent = `已掌握: ${doneCount} / ${task.words.length} | 当前第 ${session.attemptCount + 1} 次作答`;
    scoreText.textContent = `答对次数: ${score}`;
    progressFill.style.width = `${(doneCount / task.words.length) * 100}%`;

    feedback.textContent = '';
    feedback.className = 'feedback';

    session.checked = false;
    submitBtn.disabled = false;
    nextBtn.disabled = false;

    if (task.type === 'spell') {
      renderSpellQuestion(q);
    } else {
      renderChoiceQuestion(q);
    }
  }

  function lockChoiceOptions(correctIndex, selectedIndex) {
    [...mcqOptions.children].forEach((el, idx) => {
      if (idx === correctIndex) el.classList.add('lock-correct');
      if (selectedIndex === idx && idx !== correctIndex) el.classList.add('lock-wrong');
      el.disabled = true;
    });
  }

  function checkAnswer() {
    if (!session || session.checked) return;

    const { task } = session;
    const q = task.words[session.currentIndex];
    session.attemptCount += 1;

    let isCorrect = false;
    let userAnswer = '';

    if (task.type === 'spell') {
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
      const correctIndex = session.choiceOptions.findIndex((o) => o.correct);
      lockChoiceOptions(correctIndex, session.selectedChoice);
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
      feedback.textContent = task.type === 'spell' ? `错误，正确答案：${q.word}` : `错误，正确答案：${q.meaning}`;
      feedback.className = 'feedback err';
      session.wrong.push({ ...q, userAnswer });
    }

    scoreText.textContent = `答对次数: ${session.score}`;
    progressFill.style.width = `${(session.completed.size / task.words.length) * 100}%`;
  }

  function showResult() {
    const { task, score, wrong } = session;
    stopTimer();
    session.elapsedMs = Date.now() - session.startedAt;

    markTaskDone(task.id, score, task.words.length, wrong);

    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    resultTitle.textContent = task.label;
    finalScore.textContent = `总用时：${formatDuration(session.elapsedMs)} | 答对次数：${score} | 总作答：${session.attemptCount}`;

    wrongList.innerHTML = '';
    if (!wrong.length) {
      wrongList.innerHTML = '<p>本任务全对。</p>';
    } else {
      const title = document.createElement('p');
      title.textContent = `错题记录 ${wrong.length} 条：`;
      wrongList.appendChild(title);

      wrong.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'wrong-item';
        div.textContent = `${item.word} | 你的答案: ${item.userAnswer || '(空)'} | 释义: ${item.meaning}`;
        wrongList.appendChild(div);
      });
    }

    window.alert(`恭喜完成任务：${task.label}\n总完成时间：${formatDuration(session.elapsedMs)}`);
  }

  function goNext() {
    if (!session) return;

    if (!session.checked) {
      if (session.queue.length > 1) {
        const skipped = session.queue.shift();
        session.queue.push(skipped);
        feedback.textContent = '本题已跳过，稍后会再次出现。';
        feedback.className = 'feedback';
      }
      renderQuestion();
      return;
    }

    if (!session.queue.length) {
      showResult();
      return;
    }
    renderQuestion();
  }

  function backToBoard() {
    const returnView = session?.returnView || activeView;
    const returnDateKey = session?.returnDateKey || historyDateKey;

    stopTimer();
    session = null;

    quizCard.classList.add('hidden');
    resultCard.classList.add('hidden');

    if (returnView === 'history') {
      historyDateKey = returnDateKey;
      setView('history');
    } else {
      setView('today');
    }
  }

  function resetCurrentTask() {
    if (!session) return;
    const ok = window.confirm('确认重新开始当前任务吗？当前进度将重置。');
    if (!ok) return;
    startTask(session.task, session.returnView, session.returnDateKey);
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

  function bindViewSwitch(btn, view) {
    const handler = (e) => {
      e.preventDefault();
      setView(view);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', handler, { passive: false });
  }

  bindViewSwitch(todayTabBtn, 'today');
  bindViewSwitch(historyTabBtn, 'history');
  openHistoryBtn.addEventListener('click', () => setView('history'));
  historyDateInput.addEventListener('change', () => {
    historyDateKey = historyDateInput.value || todayKey;
    renderHistoryBoard(historyDateKey);
  });

  setView('today');
})();
