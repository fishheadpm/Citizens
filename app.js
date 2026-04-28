let data = [];
let currentRound = null;
let currentMode = 'self';
let queue = [];
let index = 0;
let history = {};

const APP_KEY = 'civics_study';

fetch('data.json?v=2')
  .then(res => res.json())
  .then(json => {
    data = json;
    init();
  })
  .catch(err => {
    alert('data.jsonの読み込みに失敗しました。JSONの形式やファイル名を確認してください。');
    console.error(err);
  });

function init() {
  const area = document.getElementById('seriesButtons');
  area.innerHTML = '';

  data.forEach(r => {
    const btn = document.createElement('button');
    btn.textContent = r.name;
    btn.onclick = () => selectRound(r);
    area.appendChild(btn);
  });
}

function selectRound(r) {
  currentRound = r;
  document.getElementById('roundTitle').textContent = r.name;
  show('menuScreen');
}

function start(mode) {
  currentMode = mode;
  history = JSON.parse(localStorage.getItem(histKey())) || {};
  queue = shuffle(currentRound.questions.map(q => q.id));
  index = 0;
  save();
  next();
}

function continueGame(mode) {
  currentMode = mode;
  load();

  if (!queue.length || index >= queue.length) {
    queue = shuffle(currentRound.questions.map(q => q.id));
    index = 0;
    save();
  }

  next();
}

function next() {
  if (index >= queue.length) {
    save();
    alert('全問正解しました。終了です。');
    show('menuScreen');
    return;
  }

  const q = getQ();
  if (!q) {
    alert('問題データが見つかりません。idの重複や変更を確認してください。');
    show('menuScreen');
    return;
  }

  document.getElementById('progress').textContent = `${index + 1} / ${queue.length}`;
  document.getElementById('question').textContent = q.meaning;
  document.getElementById('answer').textContent = '';
  document.getElementById('answerArea').classList.add('hidden');

  const input = document.getElementById('input');
  input.value = '';
  input.style.display = currentMode === 'input' ? 'block' : 'none';

  show('quizScreen');
}

function showAnswer() {
  const q = getQ();
  document.getElementById('answer').textContent = q.term;
  document.getElementById('answerArea').classList.remove('hidden');
}

function correct() {
  index++;
  save();
  next();
}

function wrong() {
  const id = getQ().id;
  history[id] = (history[id] || 0) + 1;
  queue.push(id);
  index++;
  save();
  next();
}

function getQ() {
  return currentRound.questions.find(q => q.id === queue[index]);
}

function save() {
  localStorage.setItem(progressKey(), JSON.stringify({ queue, index }));
  localStorage.setItem(histKey(), JSON.stringify(history));
}

function load() {
  const p = JSON.parse(localStorage.getItem(progressKey())) || null;
  history = JSON.parse(localStorage.getItem(histKey())) || {};

  if (p) {
    queue = p.queue || [];
    index = p.index || 0;
  } else {
    queue = [];
    index = 0;
  }
}

function reset() {
  if (!confirm(`${currentRound.name} の進捗と間違えた履歴をリセットしますか？`)) return;

  localStorage.removeItem(`${APP_KEY}_progress_${currentRound.id}_self`);
  localStorage.removeItem(`${APP_KEY}_progress_${currentRound.id}_input`);
  localStorage.removeItem(histKey());
  history = {};
  alert('リセットしました。');
}

function showHistory() {
  history = JSON.parse(localStorage.getItem(histKey())) || {};

  let text = '';

  Object.keys(history).forEach(id => {
    const q = currentRound.questions.find(q => q.id === id);
    if (q) {
      text += `${q.term}：${history[id]}回
${q.meaning}

`;
    }
  });

  alert(text || '履歴なし');
}

function progressKey() {
  return `${APP_KEY}_progress_${currentRound.id}_${currentMode}`;
}

function histKey() {
  return `${APP_KEY}_history_${currentRound.id}`;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function show(id) {
  ['seriesScreen', 'menuScreen', 'quizScreen'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function back() {
  show('seriesScreen');
}
