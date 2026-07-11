import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

const OUT = 'C:/Users/Admin/.gemini/antigravity/brain/166c9201-d61f-4f97-920c-36b495150ab2/topper_notes_preview.html';

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ExamHero/1.0' } });
    if (!res.ok) return url; // Fallback to URL
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    let mimeType = "image/png";
    if (url.includes(".svg")) mimeType = "image/svg+xml";
    if (url.includes(".jpg") || url.includes(".jpeg")) mimeType = "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    return url;
  }
}

const diagramCard = (imgSrc, alt, caption, source) => `
<div class="dgcard">
  <div class="dgh">
    <span class="dgi">📐</span>
    <span class="dgl">Diagram</span>
  </div>
  <div class="dgb">
    <img class="dgimg" src="${imgSrc}" alt="${alt}" onerror="this.style.display='none'"/>
    <p class="dgcap">${caption}<span class="dgsrc">Source Concept: ${source}</span></p>
  </div>
</div>`;

async function buildPreview() {
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Topper Notes Preview — Gravitation (with Diagrams) | ExamHero</title>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Patrick+Hand&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#0f172a;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px}
.hw{font-family:'Caveat',cursive}.hwc{font-family:'Patrick Hand',cursive}
.paper{background-color:#fbf8eb;background-image:linear-gradient(90deg,transparent 79px,#e9a6a6 79px,#e9a6a6 81px,transparent 81px),linear-gradient(#e1ded3 .1em,transparent .1em);background-size:100% 1.6em}
.hl{background:linear-gradient(104deg,rgba(255,255,0,0) 0.9%,rgba(255,255,0,.75) 2.4%,rgba(255,255,0,.65) 5.8%,rgba(255,255,0,.15) 93%,rgba(255,255,0,.8) 96%,rgba(255,255,0,0) 98%);padding:0 4px;border-radius:4px;font-weight:bold}
.steel{background:linear-gradient(90deg,#94a3b8,#cbd5e1,#64748b);box-shadow:inset 1px 1px 2px rgba(255,255,255,.4),1px 2px 3px rgba(0,0,0,.15)}
.bar{width:100%;max-width:950px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.bbtn{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:8px 16px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;cursor:pointer}
.ibtn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:10px;cursor:pointer;color:#fff}
.ibtn.blue{background:#4f46e5;border-color:#4f46e5}
.wrap{width:100%;max-width:950px;display:flex;gap:8px}
.tabs{display:flex;flex-direction:column;gap:6px;flex-shrink:0;margin-top:80px;order:2}
.tb{padding:12px 16px;border-radius:0 16px 16px 0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;border:1px solid rgba(255,255,255,.1);border-left:none;color:rgba(255,255,255,.7);background:rgba(255,255,255,.05);white-space:nowrap;text-align:left;transition:all .2s}
.tb.ar{background:#ef4444;color:#fff;border-color:transparent;transform:scale(1.05);box-shadow:0 4px 12px rgba(239,68,68,.4)}
.tb.aa{background:#f59e0b;color:#fff;border-color:transparent;transform:scale(1.05);box-shadow:0 4px 12px rgba(245,158,11,.4)}
.tb.ag{background:#10b981;color:#fff;border-color:transparent;transform:scale(1.05);box-shadow:0 4px 12px rgba(16,185,129,.4)}
.tb.ao{background:#f97316;color:#fff;border-color:transparent;transform:scale(1.05);box-shadow:0 4px 12px rgba(249,115,22,.4)}
.tb.ai{background:#4f46e5;color:#fff;border-color:transparent;transform:scale(1.05);box-shadow:0 4px 12px rgba(79,70,229,.4)}
.page{flex:1;border-radius:24px;padding:40px 48px;min-height:750px;border:1px solid #cbd5e1;position:relative;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.mline{position:absolute;left:70px;top:0;bottom:0;width:2px;background:#f87171;opacity:.3}
.rings{position:absolute;left:8px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-around;padding:32px 0;pointer-events:none}
.rw{display:flex;align-items:center;gap:6px}
.ring{width:48px;height:14px;border-radius:999px;transform:rotate(-12deg)}
.rhole{width:10px;height:10px;border-radius:50%;background:rgba(15,23,42,.85);margin-left:-12px}
.pc{padding-left:52px;flex:1;display:flex;flex-direction:column}
.ph{margin-bottom:32px;border-bottom:2px dashed rgba(100,116,139,.35);padding-bottom:16px}
.pt{font-size:32px;font-weight:900;color:#1e293b;letter-spacing:-.02em;line-height:1;margin-bottom:8px}
.pm{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.pml{font-size:10px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.1em}
.tgb{background:#e0e7ff;color:#3730a3;font-size:8px;font-weight:900;padding:3px 10px;border-radius:999px;text-transform:uppercase}
.sh2{font-size:30px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.sh2.r{color:#e11d48}.sh2.a{color:#d97706}.sh2.g{color:#059669}.sh2.o{color:#ea580c}.sh2.ii{color:#4338ca}
.sl{list-style:none;font-size:20px;line-height:1.5em;color:#1e293b;display:flex;flex-direction:column;gap:14px}
.sl li{display:flex;gap:10px;align-items:flex-start}
.chk{color:#e11d48;font-size:13px;font-weight:900;margin-top:4px;font-family:Inter,sans-serif;flex-shrink:0}
.cc{background:rgba(100,116,139,.06);border:1px solid rgba(100,116,139,.2);border-radius:16px;padding:16px;margin-bottom:8px}
.ct{font-size:22px;font-weight:700;color:#3730a3;margin-bottom:8px}
.cl{list-style:none;font-size:19px;line-height:1.5em;color:#1e293b;display:flex;flex-direction:column;gap:8px}
.cl li{display:flex;gap:8px;align-items:flex-start}
.bul{color:#94a3b8;font-size:14px;margin-top:3px;flex-shrink:0}
.dv{border:none;border-top:2px dashed rgba(100,116,139,.3);margin:24px 0}
/* DIAGRAM CARD */
.dgcard{margin:20px 0;border-radius:16px;overflow:hidden;border:2px solid #c7d2fe;background:linear-gradient(135deg,#eef2ff,#fff);box-shadow:0 4px 20px rgba(79,70,229,.15)}
.dgh{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#4f46e5}
.dgi{font-size:14px}
.dgl{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#fff;flex:1}
.dgwl{font-size:9px;font-weight:900;text-transform:uppercase;color:#c7d2fe;text-decoration:none;letter-spacing:.08em}
.dgwl:hover{color:#fff}
.dgb{display:flex;flex-direction:column;align-items:center;padding:16px 20px}
.dgimg{max-height:260px;width:auto;object-fit:contain;border-radius:12px;border:1px solid #e0e7ff;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.dgcap{margin-top:12px;text-align:center;font-size:11px;font-weight:700;color:#475569;font-style:italic;line-height:1.5;max-width:380px}
.dgsrc{display:block;font-size:9px;font-weight:900;color:#818cf8;text-transform:uppercase;letter-spacing:.1em;margin-top:4px}
.fc{background:rgba(251,191,36,.12);border:2px dashed #fcd34d;border-radius:16px;padding:16px;margin-bottom:16px}
.feq{font-size:26px;font-weight:900;color:#3730a3;background:#fff;padding:6px 14px;border-radius:10px;border:1px solid #e2e8f0;font-family:Inter,sans-serif}
.ftop{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:12px}
.eqb{font-size:8px;font-weight:900;text-transform:uppercase;color:#92400e;background:rgba(251,191,36,.3);padding:3px 8px;border-radius:999px;flex-shrink:0}
.fd{font-size:17px;color:#1e293b;line-height:1.5}.fd .lll{font-family:Inter,sans-serif;font-size:10px;font-weight:900;text-transform:uppercase;color:#64748b;letter-spacing:.08em}
.ft{font-size:17px;color:#92400e;font-style:italic;line-height:1.5;margin-top:8px}.ft .lll{font-family:Inter,sans-serif;font-size:10px;font-weight:900;text-transform:uppercase;color:#d97706;letter-spacing:.08em;font-style:normal}
.tbl{width:100%;border-collapse:collapse;font-size:11px;font-family:Inter,sans-serif}
.tbl th{background:#e2e8f0;border:1px solid #94a3b8;padding:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#1e293b;text-align:left}
.tbl td{border:1px solid #94a3b8;padding:10px;font-weight:600;color:#334155}
.tbl tr:nth-child(even) td{background:rgba(241,245,249,.5)}
.tbl tr:nth-child(odd) td{background:rgba(255,255,255,.4)}
.fbox{background:rgba(16,185,129,.08);border:1px solid #6ee7b7;border-radius:16px;padding:20px;font-size:19px;color:#064e3b;font-weight:700;white-space:pre-line;line-height:1.8}
.bst{border-left:4px solid;border-radius:0 12px 12px 0;padding:14px 16px;font-size:11px;font-family:Inter,sans-serif;margin-bottom:12px}
.bst.ind{border-color:#6366f1;background:#eef2ff}.bst.amb{border-color:#f59e0b;background:#fffbeb}.bst.ros{border-color:#f43f5e;background:#fff1f2}
.blbl{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;display:block;margin-bottom:6px}
.bst.ind .blbl{color:#4338ca}.bst.amb .blbl{color:#b45309}.bst.ros .blbl{color:#e11d48}
.blist{list-style:disc;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-weight:700}
.bst.ind .blist{color:#312e81}.bst.amb .blist{color:#78350f}.bst.ros .blist{color:#881337}
.mgrd{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:16px}
.mcd{background:rgba(254,226,226,.5);border:1px solid #fecaca;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px}
.me{font-size:11px;font-weight:700;color:#b91c1c;line-height:1.5}
.mlb{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;display:block;margin-bottom:4px}
.mlb.r{color:#dc2626}.mlb.gg{color:#16a34a}
.mc{font-size:11px;font-weight:700;color:#15803d;line-height:1.5;border-top:1px solid #fecaca;padding-top:10px}
.mng{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
.mnc{background:#fef9c3;border-left:4px solid #facc15;border-radius:0 12px 12px 0;padding:20px;box-shadow:2px 4px 10px rgba(0,0,0,.08)}
.mnc:nth-child(2){transform:rotate(-1deg)}
.mnt{font-size:20px;font-weight:700;color:#1e293b;line-height:1.4}
.ncq{background:rgba(100,116,139,.08);border-left:4px solid #6366f1;border-radius:0 14px 14px 0;padding:14px 16px;font-family:Inter,sans-serif;font-size:11px;font-weight:700;font-style:italic;color:#334155;line-height:1.6;margin-bottom:10px}
.qc{background:rgba(255,255,255,.4);border:1px solid rgba(100,116,139,.25);border-radius:16px;padding:14px;margin-bottom:14px;font-family:Inter,sans-serif;font-size:11px}
.qq{font-weight:900;color:#1e293b;margin-bottom:10px}
.qo{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.op{padding:10px 12px;border-radius:12px;border:1px solid #e2e8f0;font-weight:700;display:flex;align-items:center;gap:8px;background:#fff}
.op.ok{border-color:#22c55e;background:#f0fdf4;color:#15803d}
.oa{width:20px;height:20px;border-radius:50%;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex-shrink:0}
.qa{margin-top:10px;padding:10px 12px;background:rgba(238,242,255,.5);border-radius:10px;border:1px solid #c7d2fe;font-size:10px;font-weight:700;color:#1e1b4b}
.qal{font-size:9px;font-weight:900;text-transform:uppercase;color:#4338ca;letter-spacing:.1em;display:block;margin-bottom:4px}
.rev{background:#1e1b4b;border-radius:20px;padding:24px;box-shadow:0 12px 40px rgba(79,70,229,.3)}
.ri{display:flex;gap:8px;align-items:flex-start;font-size:11px;font-weight:700;color:#c7d2fe;line-height:1.6;margin-bottom:10px;font-family:Inter,sans-serif}
.rb{color:#fbbf24;font-size:14px;margin-top:1px;flex-shrink:0}
.pf{margin-top:48px;padding-top:16px;border-top:1px solid rgba(100,116,139,.3);display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8}
.fs{text-align:right;opacity:.4}.fs .sn{font-size:22px;font-weight:700;color:#1e293b;margin-bottom:2px;line-height:1}
.tc{display:none}.tc.active{display:block}
@media(max-width:700px){.page{padding:28px 20px}.pc{padding-left:30px}.tabs{flex-direction:row;order:0;margin-top:0;overflow-x:auto}.tb{border-radius:12px;border:1px solid rgba(255,255,255,.1)}.qo{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="bar">
  <button class="bbtn">← Select Topic</button>
  <div style="display:flex;gap:8px"><button class="ibtn blue">🖨️</button><button class="ibtn">✕</button></div>
</div>
<div class="wrap">
  <div class="tabs">
    <button class="tb ar" onclick="showTab('s1',this,'ar')">📖 Snapshot &amp; Concepts</button>
    <button class="tb" onclick="showTab('s2',this,'aa')">⚡ Formulas &amp; Tables</button>
    <button class="tb" onclick="showTab('s3',this,'ag')">🗺️ Mindmaps &amp; Booster</button>
    <button class="tb" onclick="showTab('s4',this,'ao')">❌ Mistakes &amp; Tricks</button>
    <button class="tb" onclick="showTab('s5',this,'ai')">🎯 PYQs &amp; Practice</button>
  </div>
  <div class="page paper">
    <div class="mline"></div>
    <div class="rings">
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
      <div class="rw"><div class="ring steel"></div><div class="rhole"></div></div>
    </div>
    <div class="pc">
      <div class="ph">
        <div style="display:flex;align-items:center;gap:6px;color:#4f46e5;margin-bottom:4px">
          <span style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15em">⭐ Topper's Personal Revision Log</span>
        </div>
        <h1 class="pt">Gravitation</h1>
        <div class="pm">
          <span class="pml">Physics · Class 9 · CBSE</span>
          <span class="tgb">Target: Board Exams</span>
        </div>
      </div>

      <!-- TAB 1 SNAPSHOT -->
      <div id="tab-s1" class="tc active">
        <h2 class="sh2 r hw">📝 Chapter Snapshot</h2>
        <ul class="sl hwc">
          <li><span class="chk">✓</span><span>Every object attracts every other object with <span class="hl">Gravitational Force</span>.</span></li>
          <li><span class="chk">✓</span><span>Newton's Law: F = G×m₁×m₂/r² — depends on masses and <span class="hl">distance squared</span>.</span></li>
          <li><span class="chk">✓</span><span>G = 6.674×10⁻¹¹ N m² kg⁻² — <span class="hl">Universal Gravitational Constant</span>, same everywhere.</span></li>
          <li><span class="chk">✓</span><span>g = 9.8 m/s² on Earth's surface. Weight = m×g. Mass never changes; weight does.</span></li>
          <li><span class="chk">✓</span><span><span class="hl">Free fall</span>: Only gravity acts. All bodies fall with same acceleration.</span></li>
          <li><span class="chk">✓</span><span>On Moon: g = 1.63 m/s² (= g_earth/6). Weight becomes 1/6th.</span></li>
          <li><span class="chk">✓</span><span>Pressure = Force/Area. SI unit = <span class="hl">Pascal (Pa)</span>.</span></li>
          <li><span class="chk">✓</span><span><span class="hl">Archimedes' Principle</span>: Buoyant force = weight of liquid displaced.</span></li>
        </ul>

        ${diagramCard(
          await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/NewtonsLawOfUniversalGravitation.svg/500px-NewtonsLawOfUniversalGravitation.svg.png'),
          "Newton's Law of Gravitation diagram",
          "Newton's Law of Universal Gravitation — Diagram showing two spherical masses m₁ and m₂ separated by center-to-center distance r, with equal and opposite force vectors F₁ and F₂ demonstrating mutual attraction. Mandatory Labels: Masses (m₁, m₂), Distance (r), Force Vectors (F₁, F₂).",
          "Newton's law of universal gravitation"
        )}

        <div class="dv"></div>
        <h2 class="sh2 r hw">💡 Key Concepts</h2>

        <div class="cc">
          <h3 class="ct hw">Universal Law of Gravitation</h3>
          <ul class="cl hwc">
            <li><span class="bul">•</span><span>Force ∝ product of masses (m₁ × m₂)</span></li>
            <li><span class="bul">•</span><span>Force ∝ inversely to square of distance (1/r²)</span></li>
            <li><span class="bul">•</span><span>Acts along the line joining both bodies (central force)</span></li>
            <li><span class="bul">•</span><span>Equal and opposite forces on both bodies (Newton's 3rd Law)</span></li>
          </ul>
        </div>

        <div class="cc">
          <h3 class="ct hw">Free Fall &amp; g</h3>
          <ul class="cl hwc">
            <li><span class="bul">•</span><span>All objects fall with same acceleration 'g' regardless of mass (Galileo)</span></li>
            <li><span class="bul">•</span><span>g = GM/R² where M = Earth mass, R = Earth radius</span></li>
            <li><span class="bul">•</span><span>g decreases as we go above or inside Earth's surface</span></li>
          </ul>
        </div>

        ${diagramCard(
          await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Drop_time.jpg/500px-Drop_time.jpg'),
          'Free fall diagram',
          'Free Fall under Gravity — Diagram illustrating a falling object at different time intervals accelerating downwards under constant gravity. Mandatory Labels: Initial Velocity (u = 0), Acceleration (a = g = 9.8 m/s²), height (h), and ground level.',
          'Free fall'
        )}

        <div class="cc">
          <h3 class="ct hw">Archimedes' Principle &amp; Buoyancy</h3>
          <ul class="cl hwc">
            <li><span class="bul">•</span><span>Buoyant force acts upward on any submerged object</span></li>
            <li><span class="bul">•</span><span>Object floats if density &lt; liquid density; sinks if density &gt; liquid</span></li>
          </ul>
        </div>

        ${diagramCard(
          await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Archimedes_principle.svg/500px-Archimedes_principle.svg.png'),
          "Archimedes' Principle - Buoyancy diagram",
          "Archimedes' Principle & Buoyancy — Diagram showing an object submerged in a container of liquid, displacing fluid into a side beaker. Mandatory Labels: Downward Gravitational Force (W_object), Upward Buoyant Force (F_buoyant), Displaced Liquid, Beaker.",
          "Archimedes' principle"
        )}

        <div class="pf"><span>Date: Revision Day</span><div class="fs"><p class="sn hw">ExamHero Topper</p><p>Achivox AI Study Engine</p></div></div>
      </div>

      <!-- TAB 2 FORMULAS -->
      <div id="tab-s2" class="tc">
        <h2 class="sh2 a hw">📖 Definitions &amp; Terms</h2>
        <div style="border-left:4px solid #fbbf24;padding-left:16px;margin-bottom:12px"><span class="hw" style="font-size:22px;font-weight:700;color:#1e293b;display:block">Gravitational Force</span><p class="hwc" style="font-size:19px;color:#1e293b;margin-top:4px">The mutual force of attraction between two bodies having mass, acting along the line joining their centres.</p></div>
        <div style="border-left:4px solid #fbbf24;padding-left:16px;margin-bottom:12px"><span class="hw" style="font-size:22px;font-weight:700;color:#1e293b;display:block">Free Fall</span><p class="hwc" style="font-size:19px;color:#1e293b;margin-top:4px">Motion under <span class="hl">gravity alone</span>, without air resistance or any other force.</p></div>
        <div style="border-left:4px solid #fbbf24;padding-left:16px;margin-bottom:16px"><span class="hw" style="font-size:22px;font-weight:700;color:#1e293b;display:block">Buoyancy</span><p class="hwc" style="font-size:19px;color:#1e293b;margin-top:4px">Upward force exerted by a fluid on an immersed object, equal to weight of fluid displaced.</p></div>
        <div class="dv"></div>
        <h2 class="sh2 a hw">⚙️ Formula Sheet</h2>
        <div class="fc"><div class="ftop"><span class="feq">F = G × m₁m₂ / r²</span><span class="eqb">Equation</span></div><div class="fd hwc"><p><span class="lll">Symbols: </span>F = Force, G = 6.674×10⁻¹¹ N m² kg⁻², m₁,m₂ = masses (kg), r = distance (m)</p></div><div class="ft hwc"><p><span class="lll">Topper Tip: </span>Double distance → force becomes 1/4th!</p></div></div>
        <div class="fc"><div class="ftop"><span class="feq">g = GM / R²</span><span class="eqb">Equation</span></div><div class="fd hwc"><p><span class="lll">Symbols: </span>g = 9.8 m/s², M = 6×10²⁴ kg, R = 6.4×10⁶ m</p></div><div class="ft hwc"><p><span class="lll">Topper Tip: </span>g does NOT depend on mass of falling body — MCQ trap!</p></div></div>
        <div class="fc"><div class="ftop"><span class="feq">W = m × g</span><span class="eqb">Equation</span></div><div class="fd hwc"><p><span class="lll">Symbols: </span>W = Weight (N), m = mass (kg), g = 9.8 m/s²</p></div><div class="ft hwc"><p><span class="lll">Topper Tip: </span>Weight is vector, Mass is scalar. Weight changes; mass does NOT.</p></div></div>

        ${diagramCard(
          await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Cavendish_Torsion_Balance_Diagram.svg/500px-Cavendish_Torsion_Balance_Diagram.svg.png'),
          'Cavendish experiment for measuring G',
          'Cavendish Torsion Balance Setup — Schematic diagram used to experimentally measure the Universal Gravitational Constant G. Mandatory Labels: Large Lead Spheres (M), Small Spheres (m), Torsion Fiber, Light Rod, Deflected Mirror/Laser Beam.',
          'Cavendish experiment'
        )}

        <div class="dv"></div>
        <h2 class="sh2 a hw">⚖️ Mass vs Weight</h2>
        <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Property</th><th>Mass</th><th>Weight</th></tr></thead><tbody><tr><td>Definition</td><td>Amount of matter</td><td>Gravitational force on body</td></tr><tr><td>SI Unit</td><td>Kilogram (kg)</td><td>Newton (N)</td></tr><tr><td>Type</td><td>Scalar</td><td>Vector</td></tr><tr><td>Changes with location?</td><td>❌ No</td><td>✅ Yes</td></tr><tr><td>On Moon</td><td>Same as Earth</td><td>1/6th of Earth weight</td></tr></tbody></table></div>
        <div class="pf"><span>Date: Revision Day</span><div class="fs"><p class="sn hw">ExamHero Topper</p><p>Achivox AI Study Engine</p></div></div>
      </div>

      <!-- TAB 3 VISUALS -->
      <div id="tab-s3" class="tc">
        <h2 class="sh2 g hw">🗺️ Text Flowchart / Mindmap</h2>
        <div class="fbox hwc">GRAVITATION
├── Universal Law of Gravitation
│   ├── F ∝ m₁ × m₂
│   ├── F ∝ 1/r²
│   └── F = G × m₁m₂ / r²
│
├── Acceleration due to Gravity (g)
│   ├── g = GM/R² = 9.8 m/s²
│   ├── Decreases above Earth surface
│   └── On Moon = g/6 = 1.63 m/s²
│
├── Free Fall
│   ├── Only gravitational force acts
│   └── All bodies: same acceleration g
│
└── Fluids &amp; Buoyancy
    ├── Archimedes Principle
    ├── Buoyant Force = Wt. of fluid displaced
    └── Float if density &lt; liquid density</div>

        ${diagramCard(
          await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Earth-G-force.png/500px-Earth-G-force.png'),
          "Earth's gravitational field",
          "Earth's Gravitational Force — Classic textbook diagram showing the gravitational force vector pulling an object toward the center of the Earth. Mandatory Labels: Object mass (m), Earth mass (M), Center of Earth, Gravitational force vector (F_g), Radius (R).",
          'Gravity of Earth'
        )}

        <div class="dv"></div>
        <h2 class="sh2 g hw">🚀 Exam Booster Facts</h2>
        <div class="bst ind"><span class="blbl">Frequently Asked</span><ul class="blist"><li>G = 6.674×10⁻¹¹ N m² kg⁻² (always given in 3-mark questions)</li><li>Weight of 1 kg mass on Earth = 9.8 N</li><li>Gravitational force is always attractive, never repulsive</li><li>Both bodies attract each other with equal force (Newton's 3rd Law)</li></ul></div>
        <div class="bst amb"><span class="blbl">1-Mark Keypoints</span><ul class="blist"><li>SI unit of G: N m² kg⁻²</li><li>SI unit of g: m/s²</li><li>Weight on Moon = Weight on Earth / 6</li><li>Relative density has no unit</li><li>1 Pascal = 1 N/m²</li></ul></div>
        <div class="bst ros"><span class="blbl">Examiner Favourites</span><ul class="blist"><li>Why coin and feather fall at same rate in vacuum? → Same g, no air resistance</li><li>Weight of 60 kg person on Moon → 60 × 9.8/6 = 98 N</li><li>Difference between G and g — most common 2-mark question</li></ul></div>
        <div class="pf"><span>Date: Revision Day</span><div class="fs"><p class="sn hw">ExamHero Topper</p><p>Achivox AI Study Engine</p></div></div>
      </div>

      <!-- TAB 4 MISTAKES -->
      <div id="tab-s4" class="tc">
        <h2 class="sh2 o hw">❌ Common Mistakes to Avoid</h2>
        <div class="mgrd">
          <div class="mcd"><div class="me"><span class="mlb r">Common Error:</span>"Mass and Weight are same, both change with location."</div><div class="mc"><span class="mlb gg">Correct Way:</span>Mass is constant. Only Weight (= m×g) changes because g changes.</div></div>
          <div class="mcd"><div class="me"><span class="mlb r">Common Error:</span>"Heavier objects fall faster than lighter ones."</div><div class="mc"><span class="mlb gg">Correct Way:</span>All objects fall with same g = 9.8 m/s² (no air resistance). Proved by Galileo.</div></div>
          <div class="mcd"><div class="me"><span class="mlb r">Common Error:</span>"Using diameter instead of r in F = Gm₁m₂/r²"</div><div class="mc"><span class="mlb gg">Correct Way:</span>r = distance between centres of two bodies, not diameter.</div></div>
          <div class="mcd"><div class="me"><span class="mlb r">Common Error:</span>"Buoyant force depends on object's weight."</div><div class="mc"><span class="mlb gg">Correct Way:</span>Buoyant force depends on volume of fluid displaced and density of fluid.</div></div>
        </div>

        ${diagramCard(
          await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Forces_on_an_immersed_cube.png/500px-Forces_on_an_immersed_cube.png'),
          "Archimedes principle diagram showing buoyant force",
          "Forces on an Immersed Object — Pressure difference on the upper and lower faces of an immersed cube creating buoyant force. Mandatory Labels: Fluid Density (ρ), Cube Height (h), Downward Force on top face (F_top), Upward Force on bottom face (F_bottom), Net Buoyant Force (F_buoyant).",
          "Archimedes' principle"
        )}

        <div class="dv"></div>
        <h2 class="sh2 o hw">🧠 Memory Mnemonics</h2>
        <div class="mng">
          <div class="mnc"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span>🔖</span><span style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#a16207">Mnemonic Code</span></div><p class="mnt hw"><strong>g</strong> yaad karo:<br/>"<strong>G</strong>ood <strong>M</strong>en <strong>R</strong>emain <strong>2</strong>gether"<br/>→ g = GM/R²</p></div>
          <div class="mnc"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span>🔖</span><span style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#a16207">Mnemonic Code</span></div><p class="mnt hw">"<strong>F</strong>at <strong>G</strong>uy <strong>M</strong>eets <strong>M</strong>om <strong>R</strong>unning <strong>2</strong>rees"<br/>→ F = G × m₁m₂ / r²<br/><span style="font-size:16px;color:#64748b">Formula kabhi nahi bhulogo!</span></p></div>
        </div>
        <div class="dv"></div>
        <h2 class="sh2 o hw">📚 NCERT Line Highlights</h2>
        <div class="ncq">"Every object in the universe attracts every other object with a force which is proportional to the product of their masses and inversely proportional to the square of the distance between them."</div>
        <div class="ncq">"The force of gravitation due to the earth is called gravity."</div>
        <div class="ncq">"When objects fall towards the earth under the gravitational force alone, we say that the objects are in free fall."</div>
        <div class="pf"><span>Date: Revision Day</span><div class="fs"><p class="sn hw">ExamHero Topper</p><p>Achivox AI Study Engine</p></div></div>
      </div>

      <!-- TAB 5 PYQs -->
      <div id="tab-s5" class="tc">
        <h2 class="sh2 ii hw">🎯 PYQ Style Questions</h2>
        <h3 class="hw" style="font-size:22px;font-weight:700;color:#3730a3;margin-bottom:14px">1. Multiple Choice Questions</h3>
        <div class="qc"><p class="qq">1. What happens to gravitational force if distance is doubled?</p><div class="qo"><div class="op"><span class="oa">A</span>Doubles</div><div class="op"><span class="oa">B</span>Halves</div><div class="op ok"><span class="oa">C</span>Becomes 1/4th ✓</div><div class="op"><span class="oa">D</span>Same</div></div><div class="qa"><span class="qal">Answer &amp; Explanation:</span>F ∝ 1/r². Double r → 1/(2r)² = 1/4r². Force becomes 1/4th.</div></div>
        <div class="qc"><p class="qq">2. Weight on moon = 98 N. Mass? (g_moon = 1.63 m/s²)</p><div class="qo"><div class="op"><span class="oa">A</span>10 kg</div><div class="op"><span class="oa">B</span>16.3 kg</div><div class="op"><span class="oa">C</span>9.8 kg</div><div class="op ok"><span class="oa">D</span>60.1 kg ✓</div></div><div class="qa"><span class="qal">Answer &amp; Explanation:</span>m = W/g = 98/1.63 ≈ 60.1 kg. Mass same everywhere.</div></div>
        <div class="qc"><p class="qq">3. Object thrown up at 20 m/s. Time to max height? (g=10)</p><div class="qo"><div class="op"><span class="oa">A</span>4 s</div><div class="op ok"><span class="oa">B</span>2 s ✓</div><div class="op"><span class="oa">C</span>1 s</div><div class="op"><span class="oa">D</span>10 s</div></div><div class="qa"><span class="qal">Answer &amp; Explanation:</span>v=u–gt → 0=20–10t → t=2s.</div></div>
        <div class="dv"></div>
        <h3 class="hw" style="font-size:22px;font-weight:700;color:#3730a3;margin-bottom:14px">2. Short Answer Questions</h3>
        <div class="qc"><p class="qq">Q: Difference between G and g?</p><div class="qa"><span class="qal">Topper Answer:</span>G = 6.674×10⁻¹¹ N m² kg⁻², universal constant, never changes.<br/>g = 9.8 m/s² on Earth surface, changes with location.</div></div>
        <div class="qc"><p class="qq">Q: Why do all objects fall with same acceleration in vacuum?</p><div class="qa"><span class="qal">Topper Answer:</span>In vacuum only gravity acts. From F=ma and F=mg → a=g, independent of mass.</div></div>
        <div class="dv"></div>
        <h2 class="sh2 ii hw">📑 1-Page Summary Revision Sheet</h2>
        <div class="rev">
          <div class="ri"><span class="rb">•</span><span>F = Gm₁m₂/r² | G = 6.674×10⁻¹¹ N m² kg⁻² | g = 9.8 m/s²</span></div>
          <div class="ri"><span class="rb">•</span><span>Weight = m×g (N) | Mass = constant | Weight changes with location</span></div>
          <div class="ri"><span class="rb">•</span><span>Free fall: only gravity | All objects fall with same g</span></div>
          <div class="ri"><span class="rb">•</span><span>On Moon: g = g_earth/6 | Weight on Moon = Weight on Earth/6</span></div>
          <div class="ri"><span class="rb">•</span><span>Buoyant Force = Wt. of fluid displaced</span></div>
          <div class="ri"><span class="rb">•</span><span>Float if density &lt; liquid density | Sink if density &gt; liquid</span></div>
          <div class="ri"><span class="rb">•</span><span>Pressure = Force/Area | 1 Pa = 1 N/m²</span></div>
        </div>
        <div class="pf"><span>Date: Revision Day</span><div class="fs"><p class="sn hw">ExamHero Topper</p><p>Achivox AI Study Engine</p></div></div>
      </div>
    </div>
  </div>
</div>
<script>
function showTab(id,btn,cls){
  document.querySelectorAll('.tc').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tb').forEach(b=>b.className='tb');
  document.getElementById('tab-'+id).classList.add('active');
  btn.className='tb '+cls;
}
</script>
</body>
</html>`;
  writeFileSync(OUT, html, 'utf8');
  console.log('Preview written successfully! File size:', html.length, 'bytes');
}

buildPreview();
