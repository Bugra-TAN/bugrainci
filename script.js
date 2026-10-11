const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const music = $('#music');
const soundToggle = $('#soundToggle');
const soundLabel = $('#soundLabel');
const quizStage = $('#quizStage');
const progressBar = $('#progressBar');
const questionCount = $('#questionCount');
const restartQuiz = $('#restartQuiz');
const toastNode = $('#toast');

let questionIndex = 0;
let answers = {};
let toastTimer;
let holdTimer;
let letterOpened = false;

const questions = [
  {
    key: 'need',
    kicker: 'Önce bugünü düşünelim',
    question: 'Şu an kalbine en çok hangisi iyi gelirdi?',
    options: [
      { icon: '♡', label: 'Uzun bir sarılma', detail: 'Bir süre hiçbir şey söylemeden', value: 'uzun, sessiz bir sarılma' },
      { icon: '☁', label: 'Biraz dinlenmek', detail: 'Hiçbir şeyi çözmeye çalışmadan', value: 'acele etmeden biraz dinlenmek' },
      { icon: '↗', label: 'Gerçekten konuşmak', detail: 'Sözünü kesmeden dinlenmek', value: 'gerçekten duyulduğun bir konuşma' },
      { icon: '☺', label: 'Birlikte gülmek', detail: 'Biraz olsun hafiflemek', value: 'birlikte gülüp hafiflemek' }
    ]
  },
  {
    key: 'day',
    kicker: 'Ankara’daki ilk sıradan gün',
    question: 'Yan yana olduğumuzda ilk ne yapalım?',
    options: [
      { icon: '☕', label: 'Kahve ve uzun sohbet', detail: 'Saatin nasıl geçtiğini unutalım', value: 'kahve içip uzun uzun konuşmak' },
      { icon: '↝', label: 'Plansız bir yürüyüş', detail: 'Nereye gittiğimiz önemli olmasın', value: 'gideceğimiz yeri düşünmeden yürümek' },
      { icon: '✦', label: 'Küçük bir randevu', detail: 'Özenelim ama kasılmayalım', value: 'küçük ama özenli bir randevuya çıkmak' },
      { icon: '⌂', label: 'Sadece sakin bir gün', detail: 'Aynı yerde olmak yetiversin', value: 'hiçbir plan yapmadan aynı yerde olmak' }
    ]
  },
  {
    key: 'repair',
    kicker: 'Zor anlarda pusulamız',
    question: 'Bir tartışmadan sonra sana nasıl yaklaşmamı istersin?',
    options: [
      { icon: '◌', label: 'Önce beni dinle', detail: 'Çözümden önce anlaşılmak isterim', value: 'önce yalnızca dinlemek' },
      { icon: '…', label: 'Biraz alan ver', detail: 'Sonra sakin biçimde yanıma gel', value: 'biraz alan verip sonra sakince gelmek' },
      { icon: '♡', label: 'Sevgini hatırlat', detail: 'Kırgınken bile biz olduğumuzu söyle', value: 'kırgınlığın içinde sevgiyi hatırlatmak' },
      { icon: '☕', label: 'Yanıma gel', detail: 'Konuşmadan önce aynı yerde olalım', value: 'mümkünse yanına gelip yanında kalmak' }
    ]
  },
  {
    key: 'wish',
    kicker: 'Bu kısım yalnızca sana ait',
    question: 'Benden duymaya ya da görmeye ihtiyaç duyduğun bir şey var mı?',
    type: 'text'
  }
];

const hopeNotes = [
  '“Bugün sadece dayanman bile yeter. Her şeyi bugün çözmek zorunda değilsin.”',
  '“Hislerinin yük olması gerekmiyor. Onları benimle paylaşabilirsin.”',
  '“Uzaklık zorladı; ama sana doğru attığım adımlar gerçek.”',
  '“Kırgın olduğunda da seviliyorsun. Sessiz olduğunda da.”',
  '“Bir gün, bu bekleyişi geçmiş zamanda anlatacağız.”',
  '“Güçlü görünmek zorunda değilsin. Yanında olmam için bu yeterli değil; sen yeterlisin.”',
  '“Ankara bir son değil; daha kolay buluşabildiğimiz yeni bir başlangıç.”',
  '“Bugün umut sende azsa, kalanını ben tutuyorum.”'
];

function toast(message) {
  clearTimeout(toastTimer);
  toastNode.textContent = message;
  toastNode.classList.add('is-visible');
  toastTimer = setTimeout(() => toastNode.classList.remove('is-visible'), 2300);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function renderQuestion() {
  const item = questions[questionIndex];
  progressBar.style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
  questionCount.textContent = `${questionIndex + 1} / ${questions.length}`;
  quizStage.style.animation = 'none';
  void quizStage.offsetWidth;
  quizStage.style.animation = '';

  if (item.type === 'text') {
    quizStage.innerHTML = `
      <p class="quiz-kicker">${item.kicker}</p>
      <h3 class="quiz-question">${item.question}</h3>
      <textarea class="quiz-textarea" id="wishInput" maxlength="280" placeholder="İstersen buraya içinden geçen bir cümle bırak…">${escapeHTML(answers.wish || '')}</textarea>
      <button class="quiz-submit" id="finishQuiz" type="button">Rotamı tamamla →</button>`;
    $('#finishQuiz').addEventListener('click', () => {
      answers.wish = $('#wishInput').value.trim();
      showResult();
    });
    return;
  }

  quizStage.innerHTML = `
    <p class="quiz-kicker">${item.kicker}</p>
    <h3 class="quiz-question">${item.question}</h3>
    <div class="answer-grid">
      ${item.options.map((option, index) => `
        <button class="answer-button" type="button" data-answer="${index}">
          <span class="answer-icon">${option.icon}</span>
          <span><b>${option.label}</b><small>${option.detail}</small></span>
        </button>`).join('')}
    </div>`;

  $$('.answer-button', quizStage).forEach(button => {
    button.addEventListener('click', () => {
      const option = item.options[Number(button.dataset.answer)];
      answers[item.key] = option;
      questionIndex += 1;
      renderQuestion();
    });
  });
}

function resultText() {
  const wishLine = answers.wish
    ? `\n\nBenden istediğin: “${answers.wish}”`
    : '';
  return `İnci'nin kalp rotası 💌\n\nŞimdi bana iyi gelecek: ${answers.need.label}.\nAnkara'daki günümüz: ${answers.day.label}.\nZor bir anda senden beklediğim: ${answers.repair.label}.${wishLine}\n\nMesafe azalıyor. Biz kalıyoruz. ♡`;
}

function showResult() {
  progressBar.style.width = '100%';
  questionCount.textContent = 'ROTAN HAZIR';
  const wish = answers.wish ? `<p>“${escapeHTML(answers.wish)}” cümleni de yanıma aldım. Onu geçiştirmeden duymak istiyorum.</p>` : '<p>Bazen söyleyecek bir şey bulamamak da bir cevaptır. Yanında sessizce kalabilirim.</p>';
  quizStage.innerHTML = `
    <div class="result-card">
      <p class="quiz-kicker">Kalbinin rotası bulundu</p>
      <h3>İnci, mesajını aldım.</h3>
      <p>Şu an sana ${answers.need.value} iyi gelir. Ankara’daki sıradan günümüzde ${answers.day.value} istiyorsun. Zorlandığımızda ise benim yapmam gereken: ${answers.repair.value}.</p>
      ${wish}
      <div class="result-summary">
        <span><b>ŞİMDİ</b>${answers.need.label}</span>
        <span><b>YAKINDA</b>${answers.day.label}</span>
        <span><b>ZOR GÜNDE</b>${answers.repair.label}</span>
      </div>
      <div class="result-actions">
        <button class="share-primary" id="shareRoute" type="button">Buğra'ya gönder</button>
        <button id="copyRoute" type="button">Cevaplarımı kopyala</button>
      </div>
    </div>`;

  try { localStorage.setItem('inciKalpRotasi', JSON.stringify(answers)); } catch (_) {}
  $('#shareRoute').addEventListener('click', shareRoute);
  $('#copyRoute').addEventListener('click', copyRoute);
}

async function shareRoute() {
  const text = resultText();
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Kalp rotam', text });
      toast('Kalp rotan paylaşılmaya hazır ♡');
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  copyRoute();
}

async function copyRoute() {
  try {
    await navigator.clipboard.writeText(resultText());
    toast('Cevapların kopyalandı; şimdi Buğra’ya gönderebilirsin.');
  } catch (_) {
    toast('Kopyalanamadı; ekran görüntüsü alabilirsin.');
  }
}

function resetQuiz() {
  questionIndex = 0;
  answers = {};
  renderQuestion();
}

restartQuiz.addEventListener('click', resetQuiz);

soundToggle.addEventListener('click', async () => {
  if (music.paused) {
    try {
      await music.play();
      soundToggle.setAttribute('aria-pressed', 'true');
      soundLabel.textContent = 'Şarkıyı durdur';
    } catch (_) {
      toast('Müzik bu tarayıcıda başlatılamadı.');
    }
  } else {
    music.pause();
    soundToggle.setAttribute('aria-pressed', 'false');
    soundLabel.textContent = 'Şarkımızı aç';
  }
});

$('#startJourney').addEventListener('click', () => $('#story').scrollIntoView({ behavior: 'smooth' }));

let lastNote = 0;
$('#drawNote').addEventListener('click', () => {
  const note = $('#hopeNote');
  let next = Math.floor(Math.random() * hopeNotes.length);
  if (next === lastNote) next = (next + 1) % hopeNotes.length;
  lastNote = next;
  note.classList.add('is-changing');
  setTimeout(() => {
    note.textContent = hopeNotes[next];
    note.classList.remove('is-changing');
  }, 220);
});

const openLetter = $('#openLetter');
const letterCard = $('#letterCard');

function revealLetter() {
  if (letterOpened) return;
  letterOpened = true;
  openLetter.classList.remove('is-holding');
  letterCard.classList.add('is-open');
  letterCard.setAttribute('aria-hidden', 'false');
  document.body.classList.add('letter-open');
  $('#closeLetter').focus();
}

function beginHold(event) {
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  if (event.repeat || openLetter.classList.contains('is-holding')) return;
  event.preventDefault();
  clearTimeout(holdTimer);
  openLetter.classList.add('is-holding');
  holdTimer = setTimeout(revealLetter, 1200);
}

function cancelHold() {
  clearTimeout(holdTimer);
  openLetter.classList.remove('is-holding');
}

openLetter.addEventListener('pointerdown', beginHold);
openLetter.addEventListener('pointerup', cancelHold);
openLetter.addEventListener('pointerleave', cancelHold);
openLetter.addEventListener('pointercancel', cancelHold);
openLetter.addEventListener('keydown', beginHold);
openLetter.addEventListener('keyup', cancelHold);

function closeLetter() {
  letterCard.classList.remove('is-open');
  letterCard.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('letter-open');
  letterOpened = false;
  openLetter.focus();
}

$('#closeLetter').addEventListener('click', closeLetter);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && letterOpened) closeLetter();
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });

$$('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
  observer.observe(element);
});

renderQuestion();
