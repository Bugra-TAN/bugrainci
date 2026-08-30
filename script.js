const music = document.getElementById("music");
const soundButton = document.getElementById("soundButton");
const soundLabel = document.getElementById("soundLabel");
const screens = [...document.querySelectorAll(".screen")];
const moveButtons = [...document.querySelectorAll(".move-button")];

const angerBar = document.getElementById("angerBar");
const excuseBar = document.getElementById("excuseBar");
const angerMeter = angerBar.parentElement;
const excuseMeter = excuseBar.parentElement;
const comboCount = document.getElementById("comboCount");
const progressText = document.getElementById("progressText");
const battleMessage = document.getElementById("battleMessage");
const speechBubble = document.getElementById("speechBubble");
const hitBurst = document.getElementById("hitBurst");
const inciFighter = document.getElementById("inciFighter");
const bugraFighter = document.getElementById("bugraFighter");

const moveData = {
  bakis: {
    hit: "EYVAH!",
    message: "O bakış, üç bahaneyi aynı anda susturdu.",
    speech: "Tamam… bu bakışı hak ettim."
  },
  yastik: {
    hit: "PİF!",
    message: "Yumuşak ama mesajı oldukça net bir kombo.",
    speech: "Yastık bile benden daha haklı şu an."
  },
  terlik: {
    hit: "ŞAAK!",
    message: "Uçan terlik hedefini buldu. Bahane kalmadı.",
    speech: "İsabetliydi. Savunmam yok."
  },
  laf: {
    hit: "KRİTİK!",
    message: "Gerçekler tam on ikiden vurdu. Kritik hasar!",
    speech: "Haklısın İnci. Seni gerçekten dinlemeliydim."
  }
};

let progress = 0;
let combo = 0;
let musicPlaying = false;
let battleLocked = false;

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === screenId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function setMusic(shouldPlay) {
  if (shouldPlay) {
    try {
      await music.play();
      musicPlaying = true;
    } catch {
      musicPlaying = false;
    }
  } else {
    music.pause();
    musicPlaying = false;
  }

  soundButton.classList.toggle("is-playing", musicPlaying);
  soundButton.setAttribute("aria-label", musicPlaying ? "Müziği kapat" : "Müziği aç");
  soundLabel.textContent = musicPlaying ? "MÜZİK: AÇIK" : "MÜZİK: KAPALI";
}

function resetBattle() {
  progress = 0;
  combo = 0;
  battleLocked = false;
  updateMeters();
  comboCount.textContent = "0x";
  battleMessage.textContent = "Bir hamle seç. Her vuruş bir bahaneyi yok eder.";
  speechBubble.textContent = "Hazırım… yani, sanırım.";
  moveButtons.forEach((button) => { button.disabled = false; });
}

function updateMeters() {
  const remaining = Math.max(0, 100 - progress);
  angerBar.style.width = `${remaining}%`;
  excuseBar.style.width = `${remaining}%`;
  angerMeter.setAttribute("aria-valuenow", String(remaining));
  excuseMeter.setAttribute("aria-valuenow", String(remaining));
  progressText.textContent = String(Math.min(progress, 100));
}

function animateHit(move) {
  const data = moveData[move];
  hitBurst.textContent = data.hit;
  hitBurst.classList.remove("is-visible");
  inciFighter.classList.remove("is-attacking");
  bugraFighter.classList.remove("is-hit");
  void hitBurst.offsetWidth;
  hitBurst.classList.add("is-visible");
  inciFighter.classList.add("is-attacking");
  bugraFighter.classList.add("is-hit");
}

function performMove(button) {
  if (battleLocked || button.disabled) return;

  const damage = Number(button.dataset.damage);
  const move = button.dataset.move;
  const data = moveData[move];

  combo += 1;
  progress = Math.min(100, progress + damage);
  comboCount.textContent = `${combo}x`;
  battleMessage.textContent = data.message;
  speechBubble.textContent = data.speech;
  updateMeters();
  animateHit(move);

  if (progress >= 100) {
    battleLocked = true;
    moveButtons.forEach((moveButton) => { moveButton.disabled = true; });
    battleMessage.textContent = "Öfke barı boşaldı! Ama arena titriyor… başka biri geliyor.";
    speechBubble.textContent = "Sanırım asıl yenmemiz gereken şeyi bulduk.";
    window.setTimeout(() => showScreen("bossScreen"), 1450);
  }
}

function createConfetti() {
  const confetti = document.getElementById("confetti");
  const colors = ["#ff4f91", "#ffdc5e", "#6ce7ef", "#a994ff", "#ffffff"];
  confetti.replaceChildren();

  for (let i = 0; i < 80; i += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${3.1 + Math.random() * 2.7}s`;
    piece.style.animationDelay = `${Math.random() * 1.8}s`;
    piece.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    confetti.appendChild(piece);
  }

  window.setTimeout(() => confetti.replaceChildren(), 6500);
}

function showResponse(type) {
  const icon = document.getElementById("responseIcon");
  const eyebrow = document.getElementById("responseEyebrow");
  const title = document.getElementById("responseTitle");
  const message = document.getElementById("responseMessage");

  if (type === "yes") {
    icon.textContent = "♥";
    eyebrow.textContent = "YENİ BÖLÜM AÇILDI";
    title.textContent = "Teşekkür ederim, İnci.";
    message.textContent = "Bu şansı çok kıymetli tutacağım. Hazır olduğunda seni dinlemeye hazırım.";
    createConfetti();
  } else {
    icon.textContent = "☾";
    eyebrow.textContent = "OYUN KAYDEDİLDİ";
    title.textContent = "Sana zaman vereceğim.";
    message.textContent = "Acele ettirmeyeceğim. Ne zaman hazır hissedersen burada olacağım ve kararına saygı duyacağım.";
  }

  showScreen("responseScreen");
}

soundButton.addEventListener("click", () => setMusic(!musicPlaying));

document.getElementById("startButton").addEventListener("click", () => {
  resetBattle();
  setMusic(true);
  showScreen("battleScreen");
});

moveButtons.forEach((button) => {
  button.addEventListener("click", () => performMove(button));
});

document.addEventListener("keydown", (event) => {
  if (!document.getElementById("battleScreen").classList.contains("is-active")) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < moveButtons.length) performMove(moveButtons[index]);
});

document.getElementById("defeatBossButton").addEventListener("click", () => {
  showScreen("finaleScreen");
  createConfetti();
});

document.getElementById("yesButton").addEventListener("click", () => showResponse("yes"));
document.getElementById("timeButton").addEventListener("click", () => showResponse("time"));
document.getElementById("replayButton").addEventListener("click", () => {
  resetBattle();
  showScreen("introScreen");
});
