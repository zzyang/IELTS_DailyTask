# IELTS 每日任务训练 / IELTS Daily Task Trainer

## 中文说明

### 1. 项目简介
这是一个纯前端（HTML/CSS/JavaScript）的雅思词汇训练网页应用，支持每日新词任务、历史任务查看、遗忘曲线复习、拼写与选择两种题型。

无需安装前端依赖。下载后可直接在浏览器运行（推荐使用本地静态服务器）。

### 2. 核心功能
- 每日固定词包：每天自动分配 30 个单词。
- 双题型训练：
  - 中文 -> 英文拼写（显示首字母、尾字母、长度提示）。
  - 英文 -> 中文选择（每题 6 选 1，选项来自当前这 30 个词）。
- 音标与词性展示：
  - 中文拼英文时：在中文释义下一行显示音标 + 词性。
  - 英文选中文时：在英文后显示音标 + 词性。
- 历史任务页：可选任意日期，查看“待办任务 / 已完成任务”，并可直接开始练习。
- 遗忘曲线复习：自动生成第 1/3/7/14/30 天复习任务（两种题型都生成）。

### 3. 运行方式
推荐使用 Python 本地静态服务器：

```bash
cd /path/to/ielts_spelling_test
python3 -m http.server 8000 --bind 127.0.0.1
```

打开浏览器：

- http://127.0.0.1:8000

也可直接打开 `index.html`，但部分浏览器环境可能受本地文件策略影响，建议优先使用上面的方式。

### 4. 数据与存储
应用使用浏览器 `localStorage` 保存以下数据：
- 每日 30 词分配进度
- 历史词包索引
- 各任务完成状态

如果清除浏览器站点数据，以上记录会被重置。

### 5. 词库来源与更新
- 原始词库文件：`IELTS Word List.txt`
- 前端加载文件：`wordlist.js`
- 生成脚本：`generate_wordlist.py`

当你替换词库文本后，执行：

```bash
cd /path/to/ielts_spelling_test
python3 generate_wordlist.py
```

然后刷新浏览器页面即可。

### 6. 项目结构
- `index.html`：页面结构与主要容器。
- `styles.css`：界面样式（Liquid Glass 风格）。
- `app.js`：任务系统、题目逻辑、计时、历史页与复习算法。
- `wordlist.js`：词库数据（由脚本生成）。
- `generate_wordlist.py`：从 TXT 词库提取单词、释义、音标、词性并生成 JS 数据。

---

## English Version

### 1. Overview
This is a pure front-end IELTS vocabulary training app (HTML/CSS/JavaScript).
It supports daily tasks, history view, spaced-review tasks, and two quiz modes.

No front-end dependencies are required. After download, it can run directly in a browser (a local static server is recommended).

### 2. Key Features
- Daily fixed set: 30 words are assigned each day.
- Two quiz modes:
  - Chinese -> English spelling (with first letter, last letter, and length hints).
  - English -> Chinese multiple choice (6 options, options are selected from the same 30-word set).
- Phonetic + part of speech display:
  - In spelling mode: shown on the line below the Chinese meaning.
  - In multiple-choice mode: shown after the English word.
- History page: pick any date, view pending/completed tasks, and start any task directly.
- Spaced repetition review: auto-generates review tasks for day 1/3/7/14/30 (both quiz modes).

### 3. How to Run
Recommended: run a local static server with Python:

```bash
cd /path/to/ielts_spelling_test
python3 -m http.server 8000 --bind 127.0.0.1
```

Open in browser:

- http://127.0.0.1:8000

You may also open `index.html` directly, but some browsers may restrict local-file behavior. The server method is preferred.


### 4. Storage
The app stores data in browser `localStorage`, including:
- Daily 30-word allocation progress
- Historical word-set mapping
- Task completion states

If site data is cleared, all progress is reset.

### 5. Word List Update
- Source text: `IELTS Word List.txt`
- Runtime data file: `wordlist.js`
- Generator script: `generate_wordlist.py`

After replacing the source TXT, run:

```bash
cd /path/to/ielts_spelling_test
python3 generate_wordlist.py
```

Then refresh the browser.

### 6. File Structure
- `index.html`: page structure and containers.
- `styles.css`: Liquid Glass UI styles.
- `app.js`: task logic, quiz flow, timer, history page, and review scheduling.
- `wordlist.js`: generated vocabulary data.
- `generate_wordlist.py`: parses word/meaning/phonetic/POS from TXT and rebuilds JS data.
