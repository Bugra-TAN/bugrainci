const music=document.getElementById("music");

window.onload=()=>{

music.play().catch(()=>{

document.body.addEventListener("click",()=>{

music.play();

},{once:true});

});

}

const yes=document.getElementById("yes");

const think=document.getElementById("think");

const texts=[

"🥺 Bir kez daha düşün...",

"❤️ Ben beklerim.",

"💗 Belki bir şans daha?",

"🌹 Kalbim hâlâ sende.",

"😊 Son kararın ne olursa saygı duyarım."

];

let i=0;

think.onclick=()=>{

think.style.position="absolute";

think.style.left=Math.random()*400-200+"px";

think.style.top=Math.random()*200-100+"px";

document.getElementById("message").innerHTML=texts[i%texts.length];

i++;

}

yes.onclick=()=>{

document.body.innerHTML=`

<div style="display:flex;justify-content:center;align-items:center;flex-direction:column;height:100vh;background:#ffeaf3;">

<h1 style="font-size:80px;">🎉❤️🎉</h1>

<h2 style="color:#ff2f76;font-size:55px;">

Bunu seçeceğini umuyordum ❤️

</h2>

<img src="photo.jpg"

style="width:300px;border-radius:20px;margin-top:35px;box-shadow:0 0 30px pink;">

<p style="font-size:30px;margin-top:30px;max-width:700px;padding:20px;">

Seninle yaşadığım her an benim için çok değerli.

Yeni güzel anılar biriktirmek istiyorum.

Seni çok seviyorum. ❤️

</p>

</div>

`;

}
function createHeart(){

const heart=document.createElement("div");

heart.className="heart";

heart.innerHTML=["❤️","💖","💕","💗","💞"][Math.floor(Math.random()*5)];

heart.style.left=Math.random()*100+"vw";

heart.style.fontSize=20+Math.random()*40+"px";

heart.style.animationDuration=4+Math.random()*4+"s";

document.body.appendChild(heart);

setTimeout(()=>heart.remove(),8000);

}

setInterval(createHeart,250);