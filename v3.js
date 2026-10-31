// v3 · page motion: hero entrance, smooth scroll, reveals, the walk into the courthouse.
// Everything is readable without this file. With reduced motion (Yahli's own PC is set that way) nothing moves by itself:
// no smoothing, no looping light, fades instead of travel; the 3D still follows the reader's scroll.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = root.classList.contains('reduced');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ── hero entrance: as soon as the photo can paint ──
const heroImg = $('#hero img');
const go = () => requestAnimationFrame(() => root.classList.add('ready'));
if (heroImg.complete) go(); else { heroImg.addEventListener('load', go, { once: true }); setTimeout(go, 1200); }

// ── smooth scroll (Lenis) driving ScrollTrigger ──
const { gsap, ScrollTrigger, Lenis } = window;
let lenis = null;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (!reduced && Lenis && gsap) {
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href')); if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { duration: 1.2 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}));

// ── nav: hides while reading down, returns on the way up ──
const nav = $('.nav'); let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY, down = y > lastY;
  nav.classList.toggle('hide', down && y > innerHeight * 0.8);
  lastY = y;
}, { passive: true });

// ── reveals ──
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
$$('[data-r]').forEach(el => io.observe(el));

// ── hero photo: drifts a little slower than the page ──
if (!reduced && gsap) gsap.to('.hero-bg', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

// ── the 3D: the scroll walks up to the courthouse, the doors open, the TRUSTED logo waits inside ──
const check = $('#check'), canvas = $('#c'), cards = $$('#check .check-card');
const BEATS = [0.1, 0.36, 0.62];                      // where each of the three checks lights up along the walk
let world = null, checkP = 0;
function lightCards(p) {
  const n = BEATS.filter(b => p >= b).length;
  cards.forEach((c, i) => { c.classList.toggle('on', i < n); c.classList.toggle('now', i === n - 1); });
}
function still() {
  window.WORLD = { fallback: true };
  const img = new Image(); img.className = 'still'; img.alt = ''; img.src = 'img/court-still.jpg';
  canvas.replaceWith(img); cards.forEach(c => c.classList.add('on'));
}
// the 3D sits further down the page: it loads when its section comes within two screens
let loading = false;
async function load() {
  if (loading) return; loading = true;
  try {
    const t = document.createElement('canvas'); if (!(t.getContext('webgl2') || t.getContext('webgl'))) throw new Error('no webgl');
    const m = await import('./court.js');
    world = m.start({ canvas });
    canvas.classList.add('on');
    world.setProgress(checkP);
  } catch (err) { console.warn('3D unavailable, the page stays readable', err); still(); }
}
new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '200% 0px' }).observe(check);
if (ScrollTrigger) {
  // progress runs while the stage is pinned (sticky): 0 when the section reaches the top, 1 when it leaves
  ScrollTrigger.create({ trigger: check, start: 'top top', end: 'bottom bottom', onToggle: s => check.classList.toggle('inside', s.isActive), onUpdate: s => { checkP = s.progress; world && world.setProgress(checkP); lightCards(checkP); } });
  ScrollTrigger.create({ trigger: check, start: 'top 60%', once: true, onEnter: load });
}
new IntersectionObserver(es => es.forEach(e => world && world.pause(!e.isIntersecting))).observe(check);

// ── reading progress line ──
const bar = $('.progress-bar');
const prog = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? clamp(scrollY / h) : 0})`; };
addEventListener('scroll', prog, { passive: true }); prog();

// ── a soft red light follows the pointer on glass cards (desktop) ──
if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $$('.tile, .stat, .check-card, .final, .card').forEach(el => {
    el.classList.add('spot');
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`); });
  });
}

// ── faq: answers slide open and closed ──
$$('.faq details').forEach(d => {
  const sum = d.querySelector('summary'), body = d.querySelector('p');
  sum.addEventListener('click', e => {
    if (reduced || !body.animate) return;
    e.preventDefault();
    if (d.open) {
      const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.23,1,.32,1)' });
      a.onfinish = () => { d.open = false; };
    } else {
      d.open = true; const h = body.offsetHeight;
      body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.23,1,.32,1)' });
    }
  });
});

// ── the TV clip: plays only when tapped, with the browser's own controls from then on ──
const player = $('.player'), clip = $('.player video');
$('.player .play').addEventListener('click', () => { clip.controls = true; clip.play(); });
clip.addEventListener('play', () => player.classList.add('playing'));
clip.addEventListener('ended', () => { player.classList.remove('playing'); clip.controls = false; clip.currentTime = 0; });

// ── lead form: opens from the pill (desktop) or the dock (phone), checks name and phone, hands the details to WhatsApp ──
const lead = $('#lead'), card = $('#lead-card'), leadForm = $('#lead form'), leadErr = $('.lead-err'), leadDone = $('.lead-done');
const openers = $$('[data-lead-open]');
function leadOpen() {
  card.hidden = false; lead.classList.add('open'); leadForm.hidden = false; leadDone.hidden = true;
  openers.forEach(o => o.setAttribute('aria-expanded', 'true'));
  setTimeout(() => leadForm.querySelector('[name="name"]').focus(), 50);
}
function leadClose() {
  card.hidden = true; lead.classList.remove('open');
  openers.forEach(o => o.setAttribute('aria-expanded', 'false'));
}
openers.forEach(o => o.addEventListener('click', () => (card.hidden ? leadOpen() : leadClose())));
$('.lead-x').addEventListener('click', leadClose);
addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden) leadClose(); });
leadForm.addEventListener('submit', e => {
  e.preventDefault();
  const f = leadForm.elements, name = f.name.value.trim(), phone = f.phone.value.replace(/[\s-]/g, '');
  const badName = name.length < 2, badPhone = !/^(\+972|0)\d{8,9}$/.test(phone);
  f.name.setAttribute('aria-invalid', badName); f.phone.setAttribute('aria-invalid', badPhone);
  leadErr.hidden = !(badName || badPhone);
  if (badName || badPhone) { (badName ? f.name : f.phone).focus(); return; }
  const lines = [`שלום עו״ד דמרי, שמי ${name}`, `טלפון: ${phone}`];
  if (f.topic.value) lines.push(`נושא: ${f.topic.value}`);
  if (f.msg.value.trim()) lines.push(f.msg.value.trim());
  window.open('https://wa.me/972522649161?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  leadForm.hidden = true; leadDone.hidden = false; leadForm.reset();
});

// ── copy the address ──
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); const t = b.textContent; b.textContent = 'הכתובת הועתקה'; setTimeout(() => (b.textContent = t), 1800); } catch {}
}));
