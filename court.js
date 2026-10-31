// The walk into the court: a courthouse rises out of the dark, the scroll climbs its steps, the doors open,
// and inside, on the red-lit back wall of the hall, the TRUSTED logo waits. No gavel.
// Courthouse geometry and materials come from v2/world.js. Frames are drawn only while something moves.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

export function start({ canvas, logoSrc = 'img/trusted-light.png' }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const BG = 0x0c0908;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 16, 44);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 900);
  scene.add(new THREE.HemisphereLight(0x3a2220, 0x070404, 0.55));
  const key = new THREE.DirectionalLight(0xfff0e0, 1.2); key.position.set(3, 8, 6); scene.add(key);

  // ── materials ──
  const woodMap = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#5c0f13'; g.fillRect(0, 0, 512, 512);
    let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 170; i++) {
      const y = r() * 512; g.strokeStyle = `rgba(${18 + r() * 34},0,${4 + r() * 8},${0.12 + r() * 0.26})`; g.lineWidth = 1 + r() * 3;
      g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 6); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  const wood = new THREE.MeshPhysicalMaterial({ map: woodMap, color: 0xb0303a, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
  const stone = new THREE.MeshPhysicalMaterial({ color: 0x8a827a, roughness: 0.42, clearcoat: 0.25 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x1d1716, roughness: 0.7 });
  const lathe = (pts, segs = 96) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x110a09, roughness: 0.45, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // ── the courthouse: steps, six columns, entablature, pediment; doors that open onto a red hall ──
  const court = new THREE.Group(); court.position.z = -16; court.scale.setScalar(1.18); scene.add(court);
  const steps = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new RoundedBoxGeometry(9 - i * 0.35, 0.18, 4.6 - i * 0.3, 2, 0.02), stone); s.position.set(0, 0.09 + i * 0.18, 0.15 * i); court.add(s); steps.push(s); }
  const TOP = 0.9, columns = [];
  const shaft = (() => {
    const g = new THREE.CylinderGeometry(0.235, 0.26, 2.86, 72, 24, true); const v = g.attributes.position, FL = 20;
    for (let i = 0; i < v.count; i++) { const x = v.getX(i), z = v.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z), k = 1 - 0.07 * Math.max(0, Math.cos(a * FL)) ** 0.6; v.setX(i, Math.cos(a) * r * k); v.setZ(i, Math.sin(a) * r * k); }
    g.computeVertexNormals(); g.translate(0, 0.2 + 1.43, 0); return g;
  })();
  const base = lathe([[0, 0], [0.36, 0], [0.36, 0.06], [0.31, 0.1], [0.33, 0.14], [0.27, 0.2], [0, 0.2]], 48);
  const cap = lathe([[0, 3.06], [0.24, 3.06], [0.3, 3.12], [0.35, 3.18], [0.33, 3.22], [0, 3.22]], 48);
  const abacus = new RoundedBoxGeometry(0.82, 0.12, 0.82, 2, 0.015); abacus.translate(0, 3.28, 0);
  const plinth = new RoundedBoxGeometry(0.8, 0.1, 0.8, 2, 0.015); plinth.translate(0, -0.05, 0);
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group(); for (const g of [shaft, base, cap, abacus, plinth]) c.add(new THREE.Mesh(g, stone));
    c.position.set(-3.5 + i * 1.4, TOP + 0.05, 1.6); court.add(c); columns.push(c);
  }
  for (const [w, x] of [[3.35, -2.2], [3.35, 2.2]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 3.3, 0.3), darkStone); m.position.set(x, TOP + 1.65, 0.1); court.add(m); }
  { const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.3), darkStone); m.position.set(0, TOP + 2.7, 0.1); court.add(m); }
  const leaves = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(side * 0.55, TOP + 1.05, 0.25); court.add(pivot);
    const leaf = new THREE.Mesh(new RoundedBoxGeometry(0.55, 2.1, 0.06, 2, 0.01), wood); leaf.position.x = -side * 0.275; pivot.add(leaf);
    pivot.userData.side = side; leaves.push(pivot);
  }
  const ent = [[8.6, 0.32, TOP + 3.5, 1], [8.9, 0.16, TOP + 3.74, 1.05]].map(([w, h, y, z]) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, 3.3, 2, 0.02), stone); b.position.set(0, y, z); court.add(b); return b; });
  const tri = new THREE.Shape(); tri.moveTo(-4.45, 0); tri.lineTo(4.45, 0); tri.lineTo(0, 1.25); tri.closePath();
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.2, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }), stone);
  ped.position.set(0, TOP + 3.82, -0.6); court.add(ped);
  const facadeKey = new THREE.SpotLight(0xffe6cc, 0, 0, 0.55, 0.5, 1.2); facadeKey.position.set(0, 10, 8); facadeKey.target.position.set(0, 3, 0); court.add(facadeKey, facadeKey.target);
  const colRims = [-3.6, 0, 3.6].map(x => { const l = new THREE.PointLight(0xe3392c, 0, 0, 2); l.position.set(x, TOP + 2.2, 0.9); court.add(l); return l; });
  const roofRed = new THREE.PointLight(0xff3b2e, 0, 0, 2); roofRed.position.set(0, TOP + 4.6, 2.6); court.add(roofRed);
  // the hall behind the doors: dark, lit red from within, two red light strips flanking the logo
  const hall = new THREE.Mesh(new THREE.BoxGeometry(9, 5.5, 8), new THREE.MeshStandardMaterial({ color: 0x070404, roughness: 0.9, side: THREE.BackSide }));
  hall.position.set(0, TOP + 2.75 - 0.9, -3.9); court.add(hall);
  for (const x of [-3.4, 3.4]) { const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 3.6), new THREE.MeshBasicMaterial({ color: 0xe3392c })); strip.position.set(x, TOP + 1.9, -7.85); court.add(strip); }
  const hallLight = new THREE.PointLight(0xe3392c, 0, 0, 2); hallLight.position.set(0, TOP + 2.6, -3); court.add(hallLight);
  const doorGlow = new THREE.PointLight(0xe3392c, 0, 0, 2); doorGlow.position.set(0, TOP + 1.2, -0.6); court.add(doorGlow);

  // ── the logo on the hall's back wall, with a soft red glow behind it ──
  const LOGO_W = 4.6, LOGO_Y = TOP + 2.0, WALL_Z = -7.8;
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(227,57,44,.9)'); r.addColorStop(0.45, 'rgba(227,57,44,.25)'); r.addColorStop(1, 'rgba(227,57,44,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.position.set(0, LOGO_Y, WALL_Z - 0.01); court.add(glow);
  const logoMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), logoMat);
  logo.position.set(0, LOGO_Y, WALL_Z); court.add(logo);
  let logoAspect = 2;
  const useTex = t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); logoMat.map = t; logoMat.needsUpdate = true; logoAspect = t.image.width / t.image.height; kick(); };
  // until the real logo file is there: the word, in the logo's colours
  const stand = () => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    g.font = 'italic 900 210px Heebo, Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    const w1 = g.measureText('TRUST').width, w2 = g.measureText('ED').width, x0 = (1024 - w1 - w2) / 2;
    g.fillStyle = '#f3efe8'; g.fillText('TRUST', x0, 200); g.fillStyle = '#e3192f'; g.fillText('ED', x0 + w1, 200);
    g.strokeStyle = '#f3efe8'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(170, 380); g.bezierCurveTo(260, 300, 330, 470, 430, 360); g.bezierCurveTo(520, 300, 640, 420, 860, 350); g.stroke();
    useTex(new THREE.CanvasTexture(c));
  };
  new THREE.TextureLoader().load(logoSrc, useTex, undefined, stand);

  // ── the camera's path, by scroll progress (world coordinates) ──
  const K = [
    [0.00, [0, 2.6, 4.0], [0, 3.6, -16]],
    [0.25, [0, 1.6, -4.5], [0, 3.8, -16]],
    [0.50, [0, 2.3, -10.6], [0, 2.6, -16]],
    [0.66, [0, 2.4, -13.2], [0, 2.6, -18]],
    [0.82, [0, 2.9, -15.6], [0, 3.2, -22]],
    [1.00, [0, 3.25, -18.9], [0, 3.42, -25.2]],
  ];
  const posCurve = new THREE.CatmullRomCurve3(K.map(k => new THREE.Vector3(...k[1])), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(K.map(k => new THREE.Vector3(...k[2])), false, 'centripetal');
  const seg = p => { for (let i = 0; i < K.length - 1; i++) if (p <= K[i + 1][0]) return (i + (p - K[i][0]) / (K[i + 1][0] - K[i][0])) / (K.length - 1); return 1; };
  const tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();

  const st = { target: 0, cur: 0, vel: 0, visible: true, fit: 1, portrait: false, w: 1, h: 1, doors: 0, logo: 0 };
  const SK = (2 * Math.PI / 0.55) ** 2, SCD = 2 * Math.sqrt(SK);

  function pose(p) {
    // the courthouse rises out of the dark: steps, then columns from the middle out, then the roof
    const rise = smooth(0, 0.2, p);
    steps.forEach((s, i) => { s.scale.y = clamp(rise * 1.6 - i * 0.12, 0.001, 1); });
    columns.forEach((c, i) => { c.scale.y = clamp(rise * 1.8 - 0.4 - Math.abs(i - 2.5) * 0.08, 0.001, 1); });
    const roof = smooth(0.12, 0.26, p); ent.concat(ped).forEach(m => { m.visible = roof > 0.01; m.scale.set(1, roof || 0.001, 1); });
    const lit = smooth(0.02, 0.22, p) * (1 - smooth(0.78, 0.92, p));
    facadeKey.intensity = 160 * lit; colRims.forEach(l => { l.intensity = 30 * lit; }); roofRed.intensity = 40 * lit;
    // the doors swing inward as the camera reaches them; red light spills out of the hall
    st.doors = smooth(0.5, 0.64, p);
    leaves.forEach(l => { l.rotation.y = -l.userData.side * st.doors * 1.9; });
    doorGlow.intensity = 6 + 18 * smooth(0.45, 0.7, p) * (1 - smooth(0.82, 0.95, p));
    hallLight.intensity = 22 * smooth(0.62, 0.86, p);
    // the logo comes up on the back wall as we step in
    st.logo = smooth(0.7, 0.92, p);
    const lw = LOGO_W * st.logoScale * mix(0.94, 1, st.logo);
    logo.scale.set(lw, lw / logoAspect, 1); logoMat.opacity = st.logo;
    glow.scale.set(lw * 1.9, lw * 1.2, 1); glow.material.opacity = 0.55 * st.logo;
    // the camera along its path; a phone screen stands further back for the facade
    posCurve.getPoint(seg(p), tmpP); lookCurve.getPoint(seg(p), tmpL);
    const near = 1 - smooth(0.3, 0.55, p);
    if (st.fit !== 1 && near > 0) tmpP.sub(tmpL).multiplyScalar(mix(1, st.fit, near)).add(tmpL);
    camera.position.copy(tmpP); camera.lookAt(tmpL);
    // keep the scene clear of the reading panel: right of a wide screen (RTL start), bottom of a phone
    if (st.portrait) camera.setViewOffset(st.w, st.h, 0, st.h * 0.16, st.w, st.h);
    else camera.setViewOffset(st.w, st.h, st.w * 0.2, 0, st.w, st.h);
  }

  function fit() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; st.w = w; st.h = h;
    st.portrait = camera.aspect < 0.85;
    st.fit = st.portrait ? clamp(0.95 / camera.aspect, 1, 2.3) : 1;
    // at the end of the walk the logo fills most of a phone's width, and on a wide screen the part the reading panel leaves free
    const dist = 25.2 - 18.9, hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    st.logoScale = clamp(((st.portrait ? 0.72 : 0.44) * 2 * dist * Math.tan(hfov / 2)) / (LOGO_W * 1.18), 0.3, 1);
    camera.updateProjectionMatrix();
  }

  let raf = 0, last = 0;
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    st.vel += (SK * (st.target - st.cur) - SCD * st.vel) * dt; st.cur += st.vel * dt;
    if (Math.abs(st.target - st.cur) < 1e-4 && Math.abs(st.vel) < 1e-4) { st.cur = st.target; st.vel = 0; }
    pose(st.cur);
    renderer.render(scene, camera);
    if (st.visible && st.cur !== st.target) kick(); else last = 0;
  }
  function kick() { if (!raf && st.visible) raf = requestAnimationFrame(frame); }

  addEventListener('resize', () => { fit(); kick(); });
  document.addEventListener('visibilitychange', () => { st.visible = document.visibilityState === 'visible'; kick(); });
  fit(); pose(0); renderer.render(scene, camera);

  const api = {
    ready: true,
    setProgress(p) { p = clamp(p); if (p !== st.target) { st.target = p; kick(); } },
    pause(on) { st.visible = !on; if (!on) kick(); },
    state: () => ({ progress: st.cur, doors: st.doors, logo: st.logo, gavel: false }),
  };
  window.WORLD = api;
  return api;
}
