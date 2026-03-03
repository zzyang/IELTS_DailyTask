# IELTS 每日任务训练 / IELTS Daily Task Trainer

## 中文说明

### 1. 项目简介
这是一个纯前端（HTML/CSS/JavaScript）的雅思词汇训练网页应用，支持每日任务、历史任务、遗忘曲线复习、拼写与选择两种题型。

无需安装前端依赖。下载后可直接在浏览器运行（推荐使用本地静态服务器）。

### 2. 核心功能
- 每日固定词包：每天自动分配 30 个单词。
- 今日单词按钮：在“今日任务”页可展开查看当天 30 词完整信息（单词、音标、词性、中文释义）。
- 双题型训练：
  - 中文 -> 英文拼写（使用 `a___b` 形式拼写提示，分段词会保留空格/连字符）。
  - 英文 -> 中文选择（每题 6 选 1，选项来自当前这 30 个词）。
- 音标与词性展示：
  - 中文拼英文时：在中文释义下一行显示音标 + 词性。
  - 英文选中文时：在英文后显示音标 + 词性。
- 错题回滚：答错题会进入队尾，后续再次出现，直到答对。
- 跳过机制：未作答可点“下一题”，该题回到队尾稍后再出现。
- 任务计时：任务开始即计时，全部答对后弹窗显示总完成时间。
- 任务重开：任务右上角“重新开始”可重置当前任务并重新随机顺序。
- 历史任务页：可选任意日期，查看待办/已完成任务，并可直接开始练习。
- 遗忘曲线复习：自动生成第 1/3/7/14/30 天复习任务（两种题型都生成）。

### 3. 运行方式
推荐使用 Python 本地静态服务器：

```bash
cd /path/to/IELTS_DailyTask
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开：

- http://127.0.0.1:8000

也可直接打开 `index.html`，但部分浏览器环境可能受本地文件策略影响，建议优先使用上面的方式。

### 4. 数据与存储
应用使用浏览器 `localStorage` 保存以下数据：
- 每日 30 词分配进度
- 历史词包索引
- 各任务完成状态

如果清除浏览器站点数据，以上记录会被重置。

### 5. 词库更新
- 原始词库文件：`IELTS Word List.txt`
- 前端数据文件：`wordlist.js`
- 生成脚本：`generate_wordlist.py`

替换词库文本后执行：

```bash
cd /path/to/IELTS_DailyTask
python3 generate_wordlist.py
```

然后刷新浏览器页面。

### 6. 项目结构
- `index.html`：页面结构与主容器。
- `styles.css`：Liquid Glass 风格样式。
- `app.js`：任务系统、出题逻辑、计时、历史页与复习算法。
- `wordlist.js`：词库数据（由脚本生成）。
- `generate_wordlist.py`：从 TXT 提取单词、释义、音标、词性并生成 JS 数据。

---

## English Version

### 1. Overview
This is a pure front-end IELTS vocabulary trainer (HTML/CSS/JavaScript) with daily tasks, history tasks, spaced review, and two quiz modes.

No front-end dependency is required. You can run it directly in a browser (a local static server is recommended).

### 2. Key Features
- Daily fixed set: 30 words are assigned each day.
- Today Words button: expand a panel on the Today page to view all 30 words with full metadata (word, phonetic, POS, meaning).
- Two quiz modes:
  - Chinese -> English spelling (with `a___b` style mask hints; separators like spaces/hyphens are preserved).
  - English -> Chinese multiple choice (6 options from the same 30-word set).
- Phonetic + POS display:
  - Spelling mode: shown below the Chinese meaning.
  - Multiple-choice mode: shown after the English word.
- Wrong-answer rollback: incorrect items move to the queue tail and reappear later.
- Skip support: unanswered items can be skipped via Next and will reappear later.
- Task timer: starts with task start; completion popup shows total duration.
- Task restart: top-right Restart button resets the current task and reshuffles order.
- History page: pick any date, view pending/completed tasks, and start any task directly.
- Spaced repetition review: auto-generates day 1/3/7/14/30 review tasks (both quiz modes).

### 3. How to Run
Recommended local static server:

```bash
cd /path/to/IELTS_DailyTask
python3 -m http.server 8000 --bind 127.0.0.1
```

Open in browser:

- http://127.0.0.1:8000

You may also open `index.html` directly, but some browsers may restrict local-file behavior.

### 4. Storage
The app stores progress in browser `localStorage`, including:
- daily 30-word allocation
- historical word-set mapping
- task completion states

Clearing site data resets progress.

### 5. Word List Update
- Source file: `IELTS Word List.txt`
- Runtime data: `wordlist.js`
- Generator script: `generate_wordlist.py`

After replacing the source text:

```bash
cd /path/to/IELTS_DailyTask
python3 generate_wordlist.py
```

Refresh the browser afterward.

### 6. File Structure
- `index.html`: page structure and containers.
- `styles.css`: Liquid Glass UI styles.
- `app.js`: task flow, quiz logic, timer, history, and review schedule.
- `wordlist.js`: generated vocabulary dataset.
- `generate_wordlist.py`: parses word/meaning/phonetic/POS from TXT and rebuilds JS data.
