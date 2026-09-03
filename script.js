const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const photos = [
  'WhatsApp Image 2026-09-03 at 03.39.22.jpeg',
  'WhatsApp Image 2026-09-03 at 03.39.22 (1).jpeg',
  'WhatsApp Image 2026-09-03 at 03.39.22 (2).jpeg',
  'WhatsApp Image 2026-09-03 at 03.39.22 (3).jpeg',
  'WhatsApp Image 2026-09-03 at 03.39.22 (4).jpeg',
  'WhatsApp Image 2026-09-03 at 03.39.23.jpeg'
];

const characters = {
  inci: {
    name: 'İNCİ', ability: 'SEZGİ', icon: '✦', avatar: '22% 35%',
    role: 'SEZGİ UZMANI',
    story: 'Zaman Yarığı anıların arasına görünmez izler bıraktı. Senin görevin, kimsenin fark etmediği ayrıntıları yakalamak ve parçalanan altı evreni yeniden birbirine bağlamak.',
    finale: 'İnci, görünmeyeni görerek bütün anı parçalarını buldu. Zaman Hatası bile onun sezgisinden kaçamadı. Evren yeniden akıyor; üstelik bu kez bütün güzel kareleri yanında taşıyor.',
    orders: [['☕','🍰','🥤','🍓'], ['🍓','☕','🥤','🍰','☕'], ['🥤','🍰','🍓','☕','🍰','🥤']],
    sequence: ['scan','trace','decode','sync','seal']
  },
  bugra: {
    name: 'BUĞRA', ability: 'CESARET', icon: '⚡', avatar: '78% 34%',
    role: 'ZAMAN KOŞUCUSU',
    story: 'Zaman Yarığı her saniye daha da büyüyor. Senin görevin, riskli geçitlere dalmak, zamanı doğru anda bükmek ve altı evreni tamamen silinmeden önce kurtarmak.',
    finale: 'Buğra, zamanın üzerine doğru koştu ve hiçbir yarığın onu durdurmasına izin vermedi. Son kritik hamleyle bütün evrenleri yeniden başlattı. Şimdi sayaç değil, macera ilerliyor.',
    orders: [['🥤','☕','🍓','🍰'], ['☕','🥤','☕','🍰','🍓'], ['🍰','🍓','🥤','☕','🍓','🥤']],
    sequence: ['jump','charge','break','anchor','launch']
  }
};

const levelMeta = [
  ['EVREN 01', 'YARIK AVI', 'Fotoğrafa saklanan 5 enerji yarığını süre dolmadan bul.'],
  ['EVREN 02', 'AKIŞ ŞİFRESİ', 'Kartlara dokunarak iki tanesini yer değiştir; doğru akışı kur.'],
  ['EVREN 03', 'KRONOLABİRENT', 'İki kristali topla ve sarı çıkış portalına ulaş.'],
  ['EVREN 04', 'HAFIZA MATRİSİ', 'Bütün fotoğraf çiftlerini en az hamlede eşleştir.'],
  ['EVREN 05', 'SİPARİŞ PROTOKOLÜ', 'Ekrandaki diziyi izle ve aynı sırayla tekrar et.'],
  ['EVREN 06', 'FOTOĞRAF PARADOKSU', 'Kareleri boşluğa kaydır ve bozulan fotoğrafı tamamla.']
];

const state = {
  player: null, currentLevel: 0, unlocked: 0, completed: new Set(), score: 0,
  levelScore: 0, timeLeft: 0, timerId: null, abilityUsed: false, timeouts: [],
  sequenceCards: [], sequenceSelected: null, maze: null, memory: null,
  order: null, puzzle: null, bossHits: 0, bossLocked: false
};

const screens = $$('.screen');
const music = $('#music');
let musicPlaying = false;

function later(fn, delay) {
  const id = window.setTimeout(fn, delay);
  state.timeouts.push(id);
  return id;
}

function clearTransient() {
  window.clearInterval(state.timerId);
  state.timerId = null;
  state.timeouts.forEach(window.clearTimeout);
  state.timeouts = [];
  document.removeEventListener('keydown', handleMazeKeys);
}

function showScreen(id, transition = false) {
  const swap = () => {
    screens.forEach(screen => screen.classList.toggle('is-active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (!transition) return swap();
  const veil = $('#transitionVeil');
  veil.classList.remove('is-active');
  void veil.offsetWidth;
  veil.classList.add('is-active');
  later(swap, 270);
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('is-visible');
  later(() => node.classList.remove('is-visible'), 1900);
}

function formatScore(value) { return String(Math.max(0, value)).padStart(4, '0'); }

function readMeta() {
  try { return JSON.parse(localStorage.getItem('zamanYarigiMeta')) || {}; }
  catch (_) { return {}; }
}

function writeMeta(meta) {
  try { localStorage.setItem('zamanYarigiMeta', JSON.stringify(meta)); } catch (_) {}
}

function updateSelectionStatus() {
  const meta = readMeta();
  const finished = ['inci','bugra'].filter(key => meta[key]?.finished);
  $('#saveStatus').innerHTML = finished.length
    ? `<span class="status-light"></span><span>TAMAMLANAN ROTALAR: ${finished.map(key => characters[key].name).join(' + ')}</span>`
    : '<span class="status-light"></span><span>İKİ ROTA • ALTI EVREN • BİR GİZLİ FİNAL</span>';
}

function selectCharacter(key) {
  clearTransient();
  const character = characters[key];
  state.player = key;
  state.currentLevel = 0;
  state.unlocked = 0;
  state.completed = new Set();
  state.score = 0;
  document.body.dataset.player = key;
  $('#changePlayerButton').classList.remove('is-hidden');
  $('#briefingCharacter').textContent = `${character.name} // ${character.role}`;
  $('#briefingStory').textContent = character.story;
  $('#hudPlayerName').textContent = character.name;
  $('#hudAvatar').style.backgroundPosition = character.avatar;
  $('#abilityIcon').textContent = character.icon;
  $('#abilityName').textContent = character.ability;
  updateMap();
  showScreen('briefingScreen', true);
}

function goHome() {
  clearTransient();
  document.body.removeAttribute('data-player');
  state.player = null;
  $('#changePlayerButton').classList.add('is-hidden');
  updateSelectionStatus();
  showScreen('selectionScreen', true);
}

function updateMap() {
  $('#completedCount').textContent = state.completed.size;
  $('#hudProgressBar').style.width = `${state.completed.size / 6 * 100}%`;
  $('#timelineFill').style.width = `${state.completed.size / 6 * 100}%`;
  $('#hudScore').textContent = formatScore(state.score);
  $$('.world-node').forEach((node, index) => {
    const complete = state.completed.has(index);
    const unlocked = index <= state.unlocked;
    node.classList.toggle('is-complete', complete);
    node.classList.toggle('is-unlocked', unlocked && !complete);
    node.disabled = !unlocked;
    $('.node-state', node).textContent = complete && index === 5 && state.completed.size === 6 ? 'SON BOSS' : complete ? 'TAMAMLANDI' : unlocked ? 'AÇIK' : 'KİLİTLİ';
  });
  $('#mapHint').textContent = state.completed.size === 6
    ? 'Bütün parçalar hazır. Zaman Hatası seni bekliyor.'
    : `${characters[state.player]?.name || ''}, sıradaki açık yarığı seç.`;
}

function startTimer(seconds, onEnd) {
  window.clearInterval(state.timerId);
  state.timeLeft = seconds;
  $('#levelTimer').textContent = `${seconds}s`;
  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    $('#levelTimer').textContent = `${Math.max(0, state.timeLeft)}s`;
    if (state.timeLeft <= 0) {
      window.clearInterval(state.timerId);
      state.timerId = null;
      onEnd();
    }
  }, 1000);
}

function updateLevelScore(add = 0) {
  state.levelScore += add;
  $('#levelScore').textContent = formatScore(state.levelScore);
}

function startLevel(index) {
  clearTransient();
  state.currentLevel = index;
  state.levelScore = 0;
  state.abilityUsed = false;
  $('#levelCode').textContent = levelMeta[index][0];
  $('#levelTitle').textContent = levelMeta[index][1];
  $('#levelInstruction').textContent = levelMeta[index][2];
  $('#levelScore').textContent = '0000';
  $('#levelTimer').textContent = '--';
  $('#abilityButton').disabled = false;
  $('#abilityCharge').textContent = 'HAZIR';
  const renderers = [renderHunt, renderSequence, renderMaze, renderMemory, renderOrder, renderPuzzle];
  renderers[index]();
  showScreen('levelScreen', true);
}

function failLevel(message) {
  clearTransient();
  const stage = $('#levelStage');
  const overlay = document.createElement('div');
  overlay.className = 'level-complete';
  overlay.innerHTML = `<span class="level-complete-mark">!</span><h3>ZAMAN KOPTU</h3><p>${message}</p><button class="primary-button" type="button">TEKRAR DENE <span>↺</span></button>`;
  $('button', overlay).addEventListener('click', () => startLevel(state.currentLevel));
  stage.appendChild(overlay);
}

function completeLevel(message, baseScore = 500) {
  clearTransient();
  const wasComplete = state.completed.has(state.currentLevel);
  const timeBonus = Math.max(0, state.timeLeft) * 10;
  updateLevelScore(baseScore + timeBonus);
  if (!wasComplete) {
    state.completed.add(state.currentLevel);
    state.score += state.levelScore;
    state.unlocked = Math.max(state.unlocked, state.currentLevel + 1);
  } else {
    state.score += Math.round(state.levelScore * .25);
  }
  const isLast = state.currentLevel === 5;
  const overlay = document.createElement('div');
  overlay.className = 'level-complete';
  overlay.innerHTML = `<span class="level-complete-mark">✓</span><h3>ANI PARÇASI ALINDI</h3><p>${message}<br><b>+${state.levelScore} puan</b></p><button class="primary-button" type="button">${isLast ? 'SON YARIĞA GİT' : 'HARİTAYA DÖN'} <span>→</span></button>`;
  $('button', overlay).addEventListener('click', () => {
    if (isLast && state.completed.size === 6) startBoss();
    else { updateMap(); showScreen('mapScreen', true); }
  });
  $('#levelStage').appendChild(overlay);
}

// EVREN 01 — hidden rifts
function renderHunt() {
  const stage = $('#levelStage');
  const positions = state.player === 'inci'
    ? [[15,28],[39,19],[70,34],[55,67],[86,72]]
    : [[12,67],[31,43],[50,24],[69,64],[88,38]];
  stage.className = 'level-stage hunt-stage';
  stage.style.backgroundImage = `url("${photos[0]}")`;
  stage.innerHTML = '<div class="hunt-counter">YARIK <span>0</span>/5</div>';
  let found = 0;
  positions.forEach(([left,top], index) => {
    const target = document.createElement('button');
    target.className = 'rift-target';
    target.type = 'button';
    target.setAttribute('aria-label', `${index + 1}. enerji yarığı`);
    target.style.left = `${left}%`;
    target.style.top = `${top}%`;
    target.addEventListener('click', () => {
      if (target.classList.contains('is-found')) return;
      target.classList.add('is-found');
      found += 1;
      $('.hunt-counter span').textContent = found;
      updateLevelScore(110 + state.timeLeft * 2);
      if (found === 5) later(() => completeLevel('Kampüsteki bütün enerji izleri mühürlendi.', 420), 420);
    });
    stage.appendChild(target);
  });
  startTimer(state.player === 'inci' ? 34 : 30, () => failLevel('Yarıklar fotoğrafın içine geri saklandı. Bu kez daha hızlı ol.'));
}

// EVREN 02 — ordering puzzle
const sequenceInfo = {
  scan:['scan','TARAMA','Enerji izini tara'], trace:['trace','İZ SÜR','Kaynağı takip et'], decode:['decode','ŞİFRE ÇÖZ','Kodu görünür yap'], sync:['sync','EŞLE','Parçaları senkronla'], seal:['seal','MÜHÜRLE','Yarığı kapat'],
  jump:['jump','SIÇRA','Yarığa ilk adımı at'], charge:['charge','YÜKLE','Enerjiyi topla'], break:['break','KIR','Zaman kilidini parçala'], anchor:['anchor','SABİTLE','Akışı yerinde tut'], launch:['launch','BAŞLAT','Evreni yeniden çalıştır']
};

function renderSequence() {
  const desired = characters[state.player].sequence;
  const shuffled = state.player === 'inci' ? [desired[2],desired[4],desired[0],desired[3],desired[1]] : [desired[3],desired[0],desired[4],desired[1],desired[2]];
  state.sequenceCards = [...shuffled];
  state.sequenceSelected = null;
  drawSequence();
}

function drawSequence() {
  const stage = $('#levelStage');
  stage.className = 'level-stage sequence-stage';
  stage.innerHTML = `<h3>ZAMAN AKIŞINI SIRALA</h3><p>Önce hangi adım gelir? İki kart seçerek yerlerini değiştir.</p><div class="sequence-board"></div><div class="sequence-actions"><button class="mini-button" id="sequenceReset" type="button">SIFIRLA</button><button class="mini-button primary" id="sequenceCheck" type="button">AKIŞI DOĞRULA</button></div><p class="sequence-feedback" id="sequenceFeedback"></p>`;
  const board = $('.sequence-board', stage);
  state.sequenceCards.forEach((id, index) => {
    const info = sequenceInfo[id];
    const card = document.createElement('button');
    card.className = `sequence-card${state.sequenceSelected === index ? ' is-selected' : ''}`;
    card.type = 'button';
    card.innerHTML = `<img src="${photos[index % photos.length]}" alt=""><b>${info[1]}</b><small>${info[2]}</small>`;
    card.addEventListener('click', () => selectSequenceCard(index));
    board.appendChild(card);
  });
  $('#sequenceReset').addEventListener('click', renderSequence);
  $('#sequenceCheck').addEventListener('click', checkSequence);
}

function selectSequenceCard(index) {
  if (state.sequenceSelected === null) { state.sequenceSelected = index; drawSequence(); return; }
  if (state.sequenceSelected === index) { state.sequenceSelected = null; drawSequence(); return; }
  [state.sequenceCards[state.sequenceSelected], state.sequenceCards[index]] = [state.sequenceCards[index], state.sequenceCards[state.sequenceSelected]];
  state.sequenceSelected = null;
  updateLevelScore(15);
  drawSequence();
}

function checkSequence() {
  const desired = characters[state.player].sequence;
  if (state.sequenceCards.every((id,index) => id === desired[index])) completeLevel('Mezuniyet evreninin akışı yeniden doğru sırada.', 650);
  else $('#sequenceFeedback').textContent = 'Akış hâlâ kararsız. Adımların mantığını yeniden düşün.';
}

function correctNextSequenceCard() {
  const desired = characters[state.player].sequence;
  const wrong = state.sequenceCards.findIndex((id,index) => id !== desired[index]);
  if (wrong < 0) return checkSequence();
  const target = state.sequenceCards.indexOf(desired[wrong]);
  [state.sequenceCards[wrong],state.sequenceCards[target]] = [state.sequenceCards[target],state.sequenceCards[wrong]];
  drawSequence();
  toast(`${characters[state.player].ability}: bir adım doğru konuma sabitlendi.`);
}

// EVREN 03 — maze
const mazeLayouts = {
  inci: ['S..#..G','.#.#.#.','.#...#.','.###.#.','...#...','.#...#.','...#...'],
  bugra:['S.#...G','..#.#..','#...#..','..###..','......#','.###...','.......']
};

function renderMaze() {
  const layout = mazeLayouts[state.player];
  state.maze = {
    layout, player:[0,0], goal:[0,6], shards: state.player === 'inci' ? [[4,2],[1,4]] : [[3,1],[5,5]], collected:[]
  };
  drawMaze();
  document.addEventListener('keydown', handleMazeKeys);
  startTimer(state.player === 'inci' ? 52 : 46, () => failLevel('Labirent yeniden şekillendi. Kristalleri toplayıp çıkışa tekrar ulaş.'));
}

function drawMaze() {
  const stage = $('#levelStage');
  stage.className = 'level-stage maze-stage';
  stage.innerHTML = `<div class="maze-grid"></div><div class="maze-info"><h3>ŞATO LABİRENTİ</h3><p>Duvarların arasındaki iki zaman kristalini topla. Ardından sarı portala gir.</p><div class="maze-shards">KRİSTAL: <span>${state.maze.collected.length}</span>/2</div><div class="maze-controls"><button data-dir="up" type="button">↑</button><button data-dir="left" type="button">←</button><button data-dir="down" type="button">↓</button><button data-dir="right" type="button">→</button></div></div>`;
  const grid = $('.maze-grid', stage);
  state.maze.layout.forEach((row,r) => [...row].forEach((value,c) => {
    const cell = document.createElement('span');
    cell.className = `maze-cell${value === '#' ? ' wall' : ''}`;
    if (r === state.maze.player[0] && c === state.maze.player[1]) cell.classList.add('player');
    if (r === state.maze.goal[0] && c === state.maze.goal[1]) cell.classList.add('goal');
    if (state.maze.shards.some(([sr,sc],i) => sr === r && sc === c && !state.maze.collected.includes(i))) cell.classList.add('shard');
    grid.appendChild(cell);
  }));
  $$('[data-dir]', stage).forEach(button => button.addEventListener('click', () => moveMaze(button.dataset.dir)));
}

function handleMazeKeys(event) {
  const keys = {ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
  if (keys[event.key]) { event.preventDefault(); moveMaze(keys[event.key]); }
}

function moveMaze(direction) {
  if (!state.maze) return;
  const delta = {up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]}[direction];
  const next = [state.maze.player[0]+delta[0],state.maze.player[1]+delta[1]];
  if (next[0] < 0 || next[0] > 6 || next[1] < 0 || next[1] > 6 || state.maze.layout[next[0]][next[1]] === '#') { toast('Bu geçit kapalı.'); return; }
  state.maze.player = next;
  updateLevelScore(4);
  state.maze.shards.forEach(([r,c],i) => {
    if (r === next[0] && c === next[1] && !state.maze.collected.includes(i)) { state.maze.collected.push(i); updateLevelScore(180); toast('Zaman kristali alındı!'); }
  });
  drawMaze();
  if (next[0] === state.maze.goal[0] && next[1] === state.maze.goal[1]) {
    if (state.maze.collected.length === 2) completeLevel('Masal Şatosu’nun çıkış portalı yeniden açıldı.', 520);
    else toast('Portal için iki kristal de gerekli.');
  }
}

function teleportMaze() {
  const targetIndex = [0,1].find(i => !state.maze.collected.includes(i));
  if (targetIndex !== undefined) {
    state.maze.player = [...state.maze.shards[targetIndex]];
    state.maze.collected.push(targetIndex);
    updateLevelScore(120); drawMaze(); toast('CESARET: kristale zaman sıçraması!');
  } else { state.maze.player = [1,6]; drawMaze(); toast('CESARET: çıkışın hemen yakınına sıçradın!'); }
}

function revealMazePath() {
  $$('.maze-cell.shard,.maze-cell.goal').forEach(cell => cell.classList.add('is-hinted'));
  toast('SEZGİ: kristaller ve çıkış işaretlendi.');
}

// EVREN 04 — memory
function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i],result[j]] = [result[j],result[i]]; }
  return result;
}

function renderMemory() {
  state.memory = { deck: shuffled([...photos,...photos].map((photo,index) => ({photo,pair:index%photos.length,id:index}))), open:[], matched:[], moves:0, locked:false };
  drawMemory();
}

function drawMemory() {
  const stage = $('#levelStage');
  stage.className = 'level-stage memory-stage';
  stage.innerHTML = `<h3>HAFIZA MATRİSİ</h3><p>Aynı anıya ait iki kareyi bul.</p><div class="memory-grid"></div><div class="memory-meta"><span>HAMLE <b>${state.memory.moves}</b></span><span>EŞLEŞME <b>${state.memory.matched.length/2}/6</b></span></div>`;
  const grid = $('.memory-grid', stage);
  state.memory.deck.forEach((card,index) => {
    const button = document.createElement('button');
    const open = state.memory.open.includes(index) || state.memory.matched.includes(index);
    button.className = `memory-card${open ? ' is-open' : ''}${state.memory.matched.includes(index) ? ' is-matched' : ''}`;
    button.type = 'button'; button.disabled = state.memory.matched.includes(index);
    button.innerHTML = `<img src="${card.photo}" alt="Anı kartı">`;
    button.addEventListener('click', () => flipMemory(index));
    grid.appendChild(button);
  });
}

function flipMemory(index) {
  const game = state.memory;
  if (game.locked || game.open.includes(index) || game.matched.includes(index)) return;
  game.open.push(index); drawMemory();
  if (game.open.length < 2) return;
  game.moves += 1; game.locked = true;
  const [a,b] = game.open;
  if (game.deck[a].photo === game.deck[b].photo) {
    game.matched.push(a,b); game.open=[]; game.locked=false; updateLevelScore(160); drawMemory();
    if (game.matched.length === 12) completeLevel(`Bütün çiftler ${game.moves} hamlede bulundu.`, Math.max(350,900-game.moves*20));
  } else later(() => { game.open=[]; game.locked=false; drawMemory(); }, 720);
}

function memoryAbility() {
  const game = state.memory;
  if (state.player === 'inci') {
    const original = [...game.open];
    game.open = game.deck.map((_,i)=>i).filter(i=>!game.matched.includes(i)); drawMemory();
    later(() => { game.open = original; drawMemory(); }, 1700);
    toast('SEZGİ: bütün açık anılar kısa süreliğine göründü.');
  } else {
    const remaining = game.deck.map((card,i)=>({card,i})).filter(({i})=>!game.matched.includes(i));
    const first = remaining[0]; const second = remaining.find(item => item.card.photo === first.card.photo && item.i !== first.i);
    game.matched.push(first.i,second.i); game.open=[]; updateLevelScore(100); drawMemory();
    toast('CESARET: bir çift doğrudan sabitlendi.');
    if (game.matched.length === 12) later(() => completeLevel('Bütün anı çiftleri yeniden bağlandı.', 500), 400);
  }
}

// EVREN 05 — Simon-like order protocol
const orderItems = ['☕','🍰','🥤','🍓','🥐','🧃'];

function renderOrder() {
  state.order = { round:0, input:[], showing:false, shield:false };
  drawOrder(true);
}

function drawOrder(start = false) {
  const stage = $('#levelStage');
  const sequence = characters[state.player].orders[state.order.round];
  stage.className = 'level-stage order-stage';
  stage.innerHTML = `<h3>SİPARİŞ PROTOKOLÜ</h3><p>Üç turun dizisini izle, sonra aynı sırayla dokun.</p><div class="order-display" id="orderDisplay">${start ? '<button class="mini-button primary" id="startOrder" type="button">PROTOKOLÜ BAŞLAT</button>' : ''}</div><div class="order-buttons">${orderItems.map(item=>`<button class="order-item" type="button" data-item="${item}" ${start?'disabled':''}>${item}</button>`).join('')}</div><div class="order-progress">${sequence.map((_,i)=>`<i class="${i<state.order.input.length?'done':''}"></i>`).join('')}</div><p class="order-status" id="orderStatus">${start ? 'Hazır olduğunda başlat.' : `TUR ${state.order.round+1}/3`}</p>`;
  if (start) $('#startOrder').addEventListener('click', playOrderSequence);
  $$('[data-item]', stage).forEach(button => button.addEventListener('click', () => orderInput(button.dataset.item)));
}

function playOrderSequence() {
  const sequence = characters[state.player].orders[state.order.round];
  state.order.showing = true; state.order.input=[]; drawOrder(false);
  $$('[data-item]').forEach(button => button.disabled=true);
  sequence.forEach((item,index) => later(() => {
    $('#orderDisplay').innerHTML = `<span class="order-flash">${item}</span>`;
    if (index === sequence.length - 1) later(() => {
      $('#orderDisplay').textContent = 'SENİN SIRAN';
      state.order.showing=false; $$('[data-item]').forEach(button => button.disabled=false);
    }, 620);
  }, index * 760));
}

function orderInput(item) {
  if (state.order.showing) return;
  const sequence = characters[state.player].orders[state.order.round];
  const expected = sequence[state.order.input.length];
  if (item !== expected) {
    if (state.order.shield) { state.order.shield=false; toast('CESARET kalkanı hatayı sildi!'); return; }
    state.order.input=[]; updateLevelScore(-25); drawOrder(false); $('#orderStatus').textContent='Sıra karıştı. Diziyi yeniden izle.'; later(playOrderSequence,700); return;
  }
  state.order.input.push(item); updateLevelScore(55); drawOrder(false);
  if (state.order.input.length === sequence.length) {
    if (state.order.round === 2) return later(() => completeLevel('Kafe protokolünün üç turu da kusursuz tamamlandı.', 700), 450);
    state.order.round += 1; state.order.input=[]; updateLevelScore(180); toast(`TUR ${state.order.round} TAMAMLANDI`); later(playOrderSequence,700);
  }
}

// EVREN 06 — sliding photo puzzle
function scramblePuzzle() {
  const tiles = [0,1,2,3,4,5,6,7,8];
  let blank = 8; let previous = -1;
  for (let turn=0; turn<70; turn+=1) {
    const row=Math.floor(blank/3), col=blank%3;
    const choices=[];
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{const r=row+dr,c=col+dc;if(r>=0&&r<3&&c>=0&&c<3){const idx=r*3+c;if(idx!==previous)choices.push(idx)}});
    const next=choices[Math.floor(Math.random()*choices.length)]; previous=blank; [tiles[blank],tiles[next]]=[tiles[next],tiles[blank]]; blank=next;
  }
  if (tiles.every((value,index)=>value===index)) [tiles[7],tiles[8]]=[tiles[8],tiles[7]];
  return tiles;
}

function renderPuzzle() {
  state.puzzle = { tiles:scramblePuzzle(), moves:0 };
  drawPuzzle();
}

function drawPuzzle() {
  const stage=$('#levelStage');
  stage.className='level-stage puzzle-stage';
  stage.innerHTML='<div class="puzzle-board"></div><div class="puzzle-info"><h3>BOZULAN KARE</h3><p>Boşluğun yanındaki karelere dokun. Fotoğrafı doğru hâline getir.</p><div class="puzzle-moves">HAMLE: <span>'+state.puzzle.moves+'</span></div><img class="puzzle-preview" src="'+photos[5]+'" alt="Tamamlanacak fotoğrafın önizlemesi"></div>';
  const board=$('.puzzle-board',stage);
  state.puzzle.tiles.forEach((value,index)=>{
    const button=document.createElement('button');button.type='button';button.className=`puzzle-tile${value===8?' blank':''}`;button.setAttribute('aria-label',value===8?'Boş alan':`Fotoğraf parçası ${value+1}`);
    if(value!==8){button.style.backgroundPosition=`${(value%3)*50}% ${Math.floor(value/3)*50}%`;button.addEventListener('click',()=>movePuzzle(index));}
    board.appendChild(button);
  });
}

function movePuzzle(index) {
  const blank=state.puzzle.tiles.indexOf(8);const r=Math.floor(index/3),c=index%3,br=Math.floor(blank/3),bc=blank%3;
  if(Math.abs(r-br)+Math.abs(c-bc)!==1){toast('Yalnızca boşluğun yanındaki kare hareket eder.');return;}
  [state.puzzle.tiles[index],state.puzzle.tiles[blank]]=[state.puzzle.tiles[blank],state.puzzle.tiles[index]];state.puzzle.moves+=1;updateLevelScore(8);drawPuzzle();
  if(state.puzzle.tiles.every((value,i)=>value===i))later(()=>completeLevel(`Son kare ${state.puzzle.moves} hamlede onarıldı.`,Math.max(450,1100-state.puzzle.moves*8)),350);
}

function puzzleAbility() {
  state.puzzle.tiles=[0,1,2,3,4,5,6,8,7];drawPuzzle();
  toast(`${characters[state.player].ability}: paradoks tek hamleye indirildi.`);
}

// Character power dispatch
function useAbility() {
  if (state.abilityUsed) return;
  state.abilityUsed=true;$('#abilityButton').disabled=true;$('#abilityCharge').textContent='KULLANILDI';
  const level=state.currentLevel;
  if(level===0){
    if(state.player==='inci'){$$('.rift-target:not(.is-found)').forEach(node=>node.classList.add('is-hinted'));later(()=>$$('.rift-target').forEach(node=>node.classList.remove('is-hinted')),2400);toast('SEZGİ: kalan yarıklar görünür oldu.');}
    else{state.timeLeft+=10;$('#levelTimer').textContent=`${state.timeLeft}s`;toast('CESARET: zamana +10 saniye eklendi.');}
  } else if(level===1) correctNextSequenceCard();
  else if(level===2) state.player==='inci'?revealMazePath():teleportMaze();
  else if(level===3) memoryAbility();
  else if(level===4){if(state.player==='inci'){playOrderSequence();toast('SEZGİ: dizi yeniden oynatılıyor.');}else{state.order.shield=true;toast('CESARET: sıradaki hata etkisiz olacak.');}}
  else if(level===5) puzzleAbility();
}

// Final boss
function makePhotoTiles(target) {
  target.innerHTML='';
  [...photos,'photo.jpg'].forEach(photo=>{const tile=document.createElement('span');tile.style.backgroundImage=`url("${photo}")`;target.appendChild(tile)});
}

function startBoss() {
  clearTransient();state.bossHits=0;state.bossLocked=false;makePhotoTiles($('#bossPhotoWall'));
  $('#bossHits').textContent='0';$('#bossHealthBar').style.width='100%';$('#bossTip').textContent='İmleç parlak alanın içindeyken vur.';
  $('#strikeButton').disabled=false;$('#timingGame').classList.add('is-running');randomizeHitZone();showScreen('bossScreen',true);
}

function randomizeHitZone() {
  const width=state.player==='inci'?22:17;const left=12+Math.random()*(76-width);$('#hitZone').style.width=`${width}%`;$('#hitZone').style.left=`${left}%`;
}

function strikeBoss() {
  if(state.bossLocked)return;const cursor=$('#timingCursor').getBoundingClientRect();const zone=$('#hitZone').getBoundingClientRect();const center=cursor.left+cursor.width/2;
  state.bossLocked=true;
  if(center>=zone.left&&center<=zone.right){
    state.bossHits+=1;state.score+=550;$('#bossHits').textContent=state.bossHits;$('#bossHealthBar').style.width=`${100-state.bossHits/3*100}%`;$('#bossTip').textContent='KRİTİK VURUŞ! Zaman Hatası çözülüyor.';document.body.classList.add('boss-hit');later(()=>document.body.classList.remove('boss-hit'),300);
    if(state.bossHits===3){$('#timingGame').classList.remove('is-running');$('#strikeButton').disabled=true;return later(showFinale,900)}
    randomizeHitZone();later(()=>{state.bossLocked=false;$('#bossTip').textContent='Yeni hedefe odaklan. Doğru anı bekle.'},600);
  }else{
    state.score=Math.max(0,state.score-80);$('#bossTip').textContent='ISKALANDI! İmleci parlak bölgenin içinde yakala.';later(()=>{state.bossLocked=false;$('#bossTip').textContent='Ritmi izle ve yeniden dene.'},500);
  }
}

function burstConfetti() {
  for(let i=0;i<55;i+=1){const piece=document.createElement('i');piece.className='victory-particle';piece.style.left=`${Math.random()*100}%`;piece.style.setProperty('--drift',`${-100+Math.random()*200}px`);piece.style.background=['#8cffd6','#ff7194','#65a7ff','#ffd05a'][i%4];piece.style.animationDelay=`${Math.random()*.8}s`;document.body.appendChild(piece);later(()=>piece.remove(),4300)}
}

function showFinale() {
  clearTransient();makePhotoTiles($('#finalCollage'));const character=characters[state.player];const meta=readMeta();meta[state.player]={finished:true,highScore:Math.max(state.score,meta[state.player]?.highScore||0)};writeMeta(meta);
  $('#finaleMessage').textContent=character.finale;$('#finalScore').textContent=formatScore(state.score);const rank=state.score>=7800?'S':state.score>=6000?'A':state.score>=4300?'B':'C';$('#finalRank').textContent=rank;
  const both=meta.inci?.finished&&meta.bugra?.finished;$('#routeStatus').textContent=both?'İNCİ + BUĞRA ROTALARI TAMAMLANDI // GİZLİ FİNAL HAZIR':`${character.name} ROTASI TAMAMLANDI // DİĞER KARAKTER ROTASI BEKLİYOR`;
  $('#otherRouteButton').innerHTML=both?'GİZLİ FİNALİ AÇ <span>✦</span>':'DİĞER ROTAYI OYNA <span>→</span>';$('#otherRouteButton').dataset.secret=String(both);showScreen('finaleScreen',true);burstConfetti();
}

// Navigation and input
$('#soundButton').addEventListener('click',async()=>{if(musicPlaying)music.pause();else{try{await music.play()}catch(_){}}musicPlaying=!music.paused;$('#soundIcon').textContent=musicPlaying?'Ⅱ':'♪';$('#soundLabel').textContent=musicPlaying?'SES AÇIK':'SES KAPALI';$('#soundButton').setAttribute('aria-label',musicPlaying?'Müziği kapat':'Müziği aç')});
$$('[data-character]').forEach(button=>button.addEventListener('click',()=>selectCharacter(button.dataset.character)));
$('#homeButton').addEventListener('click',goHome);$('#changePlayerButton').addEventListener('click',goHome);
$('#enterMapButton').addEventListener('click',()=>{updateMap();showScreen('mapScreen',true)});
$$('.world-node').forEach(node=>node.addEventListener('click',()=>{const index=Number(node.dataset.level);if(index===5&&state.completed.size===6)startBoss();else if(index<=state.unlocked)startLevel(index)}));
$('#backToMapButton').addEventListener('click',()=>{clearTransient();updateMap();showScreen('mapScreen',true)});
$('#abilityButton').addEventListener('click',useAbility);$('#strikeButton').addEventListener('click',strikeBoss);
$('#otherRouteButton').addEventListener('click',()=>{if($('#otherRouteButton').dataset.secret==='true'){makePhotoTiles($('#finalCollage'));showScreen('secretScreen',true);burstConfetti()}else selectCharacter(state.player==='inci'?'bugra':'inci')});
$('#replayRouteButton').addEventListener('click',()=>selectCharacter(state.player));$('#secretReplayButton').addEventListener('click',goHome);

updateSelectionStatus();
