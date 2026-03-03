import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / 'IELTS Word List.txt'
DST = BASE / 'wordlist.js'

line_re = re.compile(r"^([A-Za-z][A-Za-z*'\- ]*[A-Za-z*'])\s{2,}(.+)$")
word_re = re.compile(r"^[A-Za-z][A-Za-z'\- ]+$")
pos_re = re.compile(r"\b(?:n|v|vi|vt|adj|a|ad|adv|conj|pron|prep|excl|num|int)\.(?:\s*/\s*(?:n|v|vi|vt|adj|a|ad|adv|conj|pron|prep|excl|num|int)\.)*", flags=re.I)

entries = []
seen = set()

for raw in SRC.read_text(encoding='utf-8', errors='ignore').splitlines():
    line = raw.strip()
    if not line:
        continue
    if line.startswith('Word List') or line.startswith('README'):
        continue

    m = line_re.match(line)
    if not m:
        continue

    word = m.group(1).replace('*', '').strip()
    word = re.sub(r'\s+', ' ', word)
    if not word_re.match(word):
        continue

    rest = m.group(2)
    raw_rest = rest

    phonetic_match = re.search(r"/[^/]+/", raw_rest) or re.search(r"\[[^\]]+\]", raw_rest) or re.search(r"\{[^\}]+\}", raw_rest)
    phonetic = phonetic_match.group(0).strip() if phonetic_match else ''

    pos_hits = pos_re.findall(raw_rest)
    pos_parts = []
    for hit in pos_hits:
        cleaned = re.sub(r'\s+', '', hit.lower())
        if cleaned and cleaned not in pos_parts:
            pos_parts.append(cleaned)
    pos = ' / '.join(pos_parts)

    rest = re.sub(r"/[^/]+/", ' ', rest)
    rest = re.sub(r"\[[^\]]+\]", ' ', rest)
    rest = re.sub(r"\{[^\}]+\}", ' ', rest)
    rest = pos_re.sub(' ', rest)
    rest = re.sub(r'\s+', ' ', rest).strip(' ；;，,。')

    chinese_match = re.search(r'[\u4e00-\u9fff].*', rest)
    meaning = chinese_match.group(0).strip() if chinese_match else ''
    meaning = re.sub(r'\s+', ' ', meaning)

    if not meaning:
        continue

    key = word.lower()
    if key in seen:
        continue
    seen.add(key)
    entries.append({'word': word, 'meaning': meaning, 'phonetic': phonetic, 'pos': pos})

entries.sort(key=lambda x: x['word'].lower())

content = 'window.WORD_BANK = ' + json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + ';\n'
DST.write_text(content, encoding='utf-8')

print(f'Parsed entries: {len(entries)}')
