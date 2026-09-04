// xmb.js — comportamiento compartido en todas las páginas del portafolio

function mountXmbBackground() {
  const bg = document.createElement('div');
  bg.className = 'xmb-bg';
  document.body.prepend(bg);

  const ORB_COUNT = 13;
  const orbs = [];
  const TOTAL_FORMS = 5; 

  let currentForm = 0; 
  let nextForm = 1;
  let state = 'HOLD';
  let timeInState = 0;
  let globalAngle = 0;
  let lastTime = performance.now();
  let pathProgress = 0; 
  let currentHoldDuration = getRandomHoldTime();

  function getRandomHoldTime() {
    return 2000 + Math.random() * 4000; 
  }

  function forceChange(e) {
    if(e) e.stopPropagation();
    if (state === 'HOLD') {
      state = 'TRANSITION';
      timeInState = 0;
      nextForm = (currentForm + 1) % TOTAL_FORMS;
      currentHoldDuration = getRandomHoldTime();
    } else if (state === 'TRANSITION') {
      currentForm = nextForm;
      nextForm = (currentForm + 1) % TOTAL_FORMS;
      timeInState = 0;
    }
  }

  for (let i = 0; i < ORB_COUNT; i++) {
    const orb = document.createElement('div');
    orb.className = 'light-orb';
    orb.addEventListener('click', forceChange);
    bg.appendChild(orb);
    
    orbs.push({
      el: orb,
      currentX: window.innerWidth * 0.3,
      currentY: window.innerHeight * 0.5
    });
  }

  setTimeout(() => {
    document.querySelectorAll('.menu-item, button, a').forEach(el => {
      el.addEventListener('click', forceChange);
    });
  }, 100);

  function animate(now) {
    const dt = now - lastTime;
    lastTime = now;
    timeInState += dt;

    globalAngle += 0.008; 
    pathProgress += 0.003; 

    let blend = 0;

    if (state === 'HOLD') {
      blend = 0;
      if (timeInState > currentHoldDuration) { 
        state = 'TRANSITION';
        timeInState = 0;
        nextForm = (currentForm + 1) % TOTAL_FORMS;
        currentHoldDuration = getRandomHoldTime(); 
      }
    } else if (state === 'TRANSITION') {
      blend = timeInState / 1200; 
      if (blend >= 1) {
        blend = 0;
        currentForm = nextForm;
        state = 'HOLD';
        timeInState = 0;
      }
    }

    let easedBlend = blend < 0.5 ? 2 * blend * blend : -1 + (4 - 2 * blend) * blend;
    const centerX = window.innerWidth * 0.3;
    const centerY = window.innerHeight * 0.5;

    orbs.forEach((orb, i) => {
      const p1 = getFormation(currentForm, i, ORB_COUNT, pathProgress);
      const p2 = getFormation(nextForm, i, ORB_COUNT, pathProgress);

      const localX = p1.x + (p2.x - p1.x) * easedBlend;
      const localY = p1.y + (p2.y - p1.y) * easedBlend;

      const rotatedX = localX * Math.cos(globalAngle) - localY * Math.sin(globalAngle);
      const rotatedY = localX * Math.sin(globalAngle) + localY * Math.cos(globalAngle);

      const finalX = centerX + rotatedX;
      const finalY = centerY + rotatedY;

      orb.currentX += (finalX - orb.currentX) * 0.15;
      orb.currentY += (finalY - orb.currentY) * 0.15;

      orb.el.style.transform = `translate(calc(${orb.currentX}px - 50%), calc(${orb.currentY}px - 50%))`;
    });

    requestAnimationFrame(animate);
  }

  function getFormation(form, i, total, time) {
    let x = 0, y = 0;
    const progress = ((i / total) + time) % 1; 
    const angle = progress * Math.PI * 2; 

    switch(form) {
      case 0: 
        x = Math.cos(angle) * 126;
        y = Math.sin(angle) * 126;
        break;
      case 1: 
        x = Math.cos(angle) * 168;
        y = Math.sin(angle) * 35;
        break;
      case 2: 
        x = Math.sin(angle) * 160;
        y = Math.sin(angle * 2) * 80;
        break;
      case 3: 
        const theta = progress * Math.PI * 4; 
        const rFib = 12 * Math.exp(0.25 * theta); 
        x = Math.cos(theta) * rFib - 60; 
        y = Math.sin(theta) * rFib;
        break;
      case 4: 
        const indexOffset = i - Math.floor(total / 2);
        x = indexOffset * 22; 
        y = Math.sin(indexOffset * 0.5 - time * 15) * 70; 
        break;
    }
    return {x, y};
  }

  requestAnimationFrame(animate);
}

function mountClock(el) {
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${days[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}  ${hh}:${mm}`;
  };
  tick();
  setInterval(tick, 15000);
}

document.addEventListener('DOMContentLoaded', () => {
  mountXmbBackground();
  mountClock(document.querySelector('[data-clock]'));
});

// ==========================================
// --- SISTEMA DE AUDIO REVISADO ---
// ==========================================
window.sysAudio = {
  click: () => { 
    try { 
      const btn = window.parent.document.getElementById('audio-click');
      if (btn) { btn.currentTime = 0; btn.volume = 0.8; btn.play().catch(()=>{}); }
    } catch(e){} 
  },
  back: () => { 
    try { 
      const bck = window.parent.document.getElementById('audio-back');
      if (bck) { bck.currentTime = 0; bck.volume = 0.9; bck.play().catch(()=>{}); }
    } catch(e){} 
  },
  hover: () => {
    try {
      const hvr = window.parent.document.getElementById('audio-hover');
      if (hvr) { hvr.currentTime = 0; hvr.volume = 0.2; hvr.play().catch(()=>{}); }
    } catch(e){}
  }
};

// 1. SOLUCIÓN AL SPAM DE HOVER (Bloqueo de repetición)
let lastHovered = null;
document.addEventListener('mouseover', (e) => {
  const target = e.target.closest('.back-link, .xmb-card, .submit-btn, .menu-item, #action-enter');
  if (target) {
      if (lastHovered !== target) { 
          if(window.sysAudio) window.sysAudio.hover();
          lastHovered = target; 
      }
  } else {
      lastHovered = null; 
  }
});

// 2. SOLUCIÓN AL BOTÓN VOLVER (Retraso de navegación)
document.addEventListener('click', (e) => {
   const backLink = e.target.closest('.back-link');
   if (backLink) {
       e.preventDefault(); // ¡VITAL! Frena el salto de página instantáneo
       if(window.sysAudio) window.sysAudio.back(); // Suena el archivo back.mp3
       
       // Espera 300 milisegundos y luego cambia la página
       setTimeout(() => {
           window.location.href = backLink.getAttribute('href');
       }, 300); 
       return;
   } 
   
   const clickItem = e.target.closest('.xmb-card, .submit-btn, .menu-item, #action-enter');
   if (clickItem) {
       if(window.sysAudio) window.sysAudio.click();
   }
});