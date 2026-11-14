// Generates the demo catalog illustrations (public/catalog/*.webp) used by the seed.
// Each design has a "lit" (night) render and a "day" render. Replace with real photos from the admin.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT = resolve("public/catalog");
const W = 1200;
const H = 1500;
const CX = 600;


function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + amt * 255))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function frame(inner, { lit, color, glowY = 760, glowR = 520 }) {
  const bgA = lit ? "#1d1611" : "#f3ece2";
  const bgB = lit ? "#0b0907" : "#e2d6c6";
  const glow = lit
    ? `<circle cx="${CX}" cy="${glowY}" r="${glowR}" fill="url(#glow)"/>`
    : `<circle cx="${CX}" cy="${glowY}" r="${glowR}" fill="url(#dayglow)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/><stop offset=".45" stop-color="#e89a4a" stop-opacity=".16"/><stop offset="1" stop-color="#e89a4a" stop-opacity="0"/></radialGradient>
  <radialGradient id="dayglow"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <radialGradient id="inner"><stop offset="0" stop-color="#fff6e0"/><stop offset=".5" stop-color="#ffd08a"/><stop offset="1" stop-color="#e08a3c"/></radialGradient>
  <linearGradient id="mat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(color, -0.18)}"/><stop offset=".45" stop-color="${lit ? shade(color, 0.12) : shade(color, 0.06)}"/><stop offset="1" stop-color="${shade(color, -0.26)}"/></linearGradient>
  <linearGradient id="matv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 0.08)}"/><stop offset="1" stop-color="${shade(color, -0.22)}"/></linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${glow}
<ellipse cx="${CX}" cy="1290" rx="330" ry="34" fill="#000" opacity="${lit ? 0.55 : 0.18}" filter="url(#soft)"/>
${inner}
</svg>`;
}

const base = (lit, color, y = 1240, w = 150) =>
  `<ellipse cx="${CX}" cy="${y}" rx="${w}" ry="26" fill="${shade(color, -0.3)}"/><rect x="${CX - w}" y="${y - 30}" width="${w * 2}" height="30" fill="url(#mat)"/><ellipse cx="${CX}" cy="${y - 30}" rx="${w}" ry="26" fill="${shade(color, lit ? 0.05 : 0.1)}"/>`;

// ---------- Lamp designs ----------
const designs = {
  aurora(lit, color) {
    // Ribbed dome table lamp
    let ribs = "";
    for (let i = 1; i < 16; i++) {
      const t = i / 16;
      const x = 330 + t * 540;
      const k = (x - CX) / 270;
      ribs += `<path d="M${x},800 Q${CX + k * 200},${470 + Math.abs(k) * 90} ${CX + k * 30},440" stroke="${shade(color, -0.25)}" stroke-width="5" fill="none" opacity=".55"/>`;
    }
    const light = lit ? `<ellipse cx="${CX}" cy="805" rx="250" ry="40" fill="url(#inner)" opacity=".95"/><ellipse cx="${CX}" cy="980" rx="260" ry="200" fill="#ffc87a" opacity=".18" filter="url(#soft)"/>` : "";
    return frame(
      `${light}<rect x="${CX - 18}" y="800" width="36" height="420" fill="url(#mat)"/>${base(lit, color)}
      <path d="M330,800 C330,560 430,440 ${CX},440 C770,440 870,560 870,800 Z" fill="url(#mat)"/>${ribs}
      <ellipse cx="${CX}" cy="800" rx="270" ry="34" fill="${lit ? "#ffd59a" : shade(color, -0.35)}" opacity="${lit ? 0.9 : 0.6}"/>`,
      { lit, color, glowY: 760 },
    );
  },
  dune(lit, color) {
    // Layered wave pendant
    let layers = "";
    for (let i = 0; i < 14; i++) {
      const y = 430 + i * 30;
      const rx = 130 + Math.sin((i / 13) * Math.PI) * 230;
      const off = Math.sin(i * 0.9) * 26;
      layers += `<ellipse cx="${CX + off}" cy="${y}" rx="${rx}" ry="${rx * 0.2}" fill="${i % 2 ? shade(color, -0.08) : shade(color, 0.04)}" stroke="${shade(color, -0.28)}" stroke-width="3"/>`;
    }
    const light = lit ? `<ellipse cx="${CX}" cy="${880}" rx="190" ry="30" fill="url(#inner)"/><ellipse cx="${CX}" cy="1150" rx="320" ry="160" fill="#ffc87a" opacity=".16" filter="url(#soft)"/>` : "";
    return frame(
      `<line x1="${CX}" y1="0" x2="${CX}" y2="420" stroke="${lit ? "#4a3d31" : "#6f6255"}" stroke-width="5"/>${light}${layers}`,
      { lit, color, glowY: 700, glowR: 560 },
    );
  },
  torsade(lit, color) {
    // Twisted column table lamp
    let rings = "";
    for (let i = 0; i < 46; i++) {
      const y = 360 + i * 17;
      const w = 120 + Math.sin(i / 7) * 34;
      const off = Math.sin(i / 4.5) * 18;
      rings += `<ellipse cx="${CX + off}" cy="${y}" rx="${w}" ry="22" fill="${lit ? `url(#inner)` : shade(color, (i % 3) * 0.03)}" stroke="${shade(color, -0.3)}" stroke-width="4" opacity="${lit ? 0.92 : 1}"/>`;
    }
    const halo = lit ? `<ellipse cx="${CX}" cy="720" rx="260" ry="420" fill="#ffbe6e" opacity=".22" filter="url(#soft)"/>` : "";
    return frame(`${halo}${rings}${base(lit, color, 1240, 170)}`, { lit, color, glowY: 720, glowR: 600 });
  },
  halo(lit, color) {
    // Globe lamp with latitude rings
    let rings = "";
    for (let i = -5; i <= 5; i++) {
      const y = 700 + i * 50;
      const rx = Math.sqrt(Math.max(0, 300 ** 2 - (i * 50) ** 2));
      rings += `<ellipse cx="${CX}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="none" stroke="${shade(color, -0.3)}" stroke-width="4" opacity=".5"/>`;
    }
    const fill = lit ? `url(#inner)` : `url(#mat)`;
    return frame(
      `${lit ? `<circle cx="${CX}" cy="700" r="340" fill="#ffc77a" opacity=".25" filter="url(#soft)"/>` : ""}
      <rect x="${CX - 26}" y="990" width="52" height="220" fill="url(#mat)"/>${base(lit, color, 1240, 130)}
      <circle cx="${CX}" cy="700" r="300" fill="${fill}"/>${rings}
      <ellipse cx="${CX - 110}" cy="560" rx="70" ry="40" fill="#fff" opacity="${lit ? 0.35 : 0.25}" filter="url(#blur6)"/>`,
      { lit, color, glowY: 700 },
    );
  },
  kumo(lit, color) {
    // Mushroom lamp with scalloped cap
    let scallop = "M300,760";
    for (let i = 0; i < 10; i++) scallop += ` q30,${i % 2 ? -18 : 18} 60,0`;
    const light = lit ? `<ellipse cx="${CX}" cy="790" rx="280" ry="46" fill="url(#inner)"/><ellipse cx="${CX}" cy="1000" rx="300" ry="200" fill="#ffc87a" opacity=".18" filter="url(#soft)"/>` : "";
    return frame(
      `${light}<path d="M520,780 C500,950 470,1080 450,1215 L750,1215 C730,1080 700,950 680,780 Z" fill="url(#mat)"/>${base(lit, color, 1240, 170)}
      <path d="M300,760 C300,520 440,420 ${CX},420 C760,420 900,520 900,760 Z" fill="url(#mat)"/>
      <path d="${scallop}" stroke="${shade(color, -0.3)}" stroke-width="6" fill="none"/>
      <path d="M380,640 C420,520 500,470 ${CX},462" stroke="#fff" stroke-width="10" fill="none" opacity=".18" stroke-linecap="round"/>`,
      { lit, color, glowY: 760 },
    );
  },
  ondee(lit, color) {
    // Ripple cone pendant
    let rings = "";
    for (let i = 0; i < 18; i++) {
      const y = 420 + i * 24;
      const rx = 70 + i * 18;
      rings += `<path d="M${CX - rx},${y} Q${CX},${y + rx * 0.3} ${CX + rx},${y}" stroke="${shade(color, i % 2 ? -0.05 : -0.25)}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
    }
    const light = lit ? `<ellipse cx="${CX}" cy="900" rx="200" ry="36" fill="url(#inner)"/><ellipse cx="${CX}" cy="1150" rx="330" ry="170" fill="#ffc87a" opacity=".17" filter="url(#soft)"/>` : "";
    return frame(`<line x1="${CX}" y1="0" x2="${CX}" y2="420" stroke="${lit ? "#4a3d31" : "#6f6255"}" stroke-width="5"/>${light}${rings}`, {
      lit,
      color,
      glowY: 760,
    });
  },
  medina(lit, color) {
    // Moucharabieh-inspired lantern
    const star = (x, y, r) => {
      let d = "";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = i % 2 ? r * 0.45 : r;
        d += `${i ? "L" : "M"}${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
      }
      return `<path d="${d}Z" fill="${lit ? "url(#inner)" : shade(color, -0.32)}"/>`;
    };
    let holes = "";
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) holes += star(440 + c * 80 + (r % 2 ? 40 : 0), 560 + r * 80, 24);
    return frame(
      `${lit ? `<ellipse cx="${CX}" cy="800" rx="330" ry="460" fill="#ffbe6e" opacity=".22" filter="url(#soft)"/>` : ""}
      <path d="M${CX},300 L${CX},380" stroke="${shade(color, -0.3)}" stroke-width="10"/>
      <path d="M470,470 Q${CX},360 730,470 Z" fill="url(#mat)"/>
      <rect x="400" y="470" width="400" height="660" rx="30" fill="url(#mat)"/>${holes}
      <rect x="380" y="1120" width="440" height="40" rx="10" fill="${shade(color, -0.2)}"/>${base(lit, color, 1240, 210)}`,
      { lit, color, glowY: 800, glowR: 600 },
    );
  },
  nara(lit, color) {
    // Tall helix cylinder lamp
    let lines = "";
    for (let i = -10; i < 22; i++) {
      const x = 450 + i * 32;
      lines += `<path d="M${x},360 C${x + 120},620 ${x - 80},900 ${x + 60},1170" stroke="${shade(color, -0.3)}" stroke-width="5" fill="none" opacity=".55"/>`;
    }
    return frame(
      `${lit ? `<rect x="400" y="300" width="400" height="900" fill="#ffbe6e" opacity=".25" filter="url(#soft)"/>` : ""}
      <clipPath id="cyl"><rect x="450" y="360" width="300" height="810" rx="40"/></clipPath>
      <rect x="450" y="360" width="300" height="810" rx="40" fill="${lit ? "url(#inner)" : "url(#mat)"}"/>
      <g clip-path="url(#cyl)">${lines}</g>${base(lit, color, 1240, 190)}`,
      { lit, color, glowY: 760, glowR: 560 },
    );
  },
  // ---------- Wall art ----------
  atlas(lit, color) {
    let contours = "";
    for (let k = 8; k >= 0; k--) {
      const r = 60 + k * 36;
      let d = "";
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const rr = r * (1 + 0.13 * Math.sin(a * 3 + k) + 0.07 * Math.cos(a * 5 - k));
        d += `${i ? "L" : "M"}${(CX - 40 + Math.cos(a) * rr).toFixed(1)},${(740 + Math.sin(a) * rr * 0.9).toFixed(1)}`;
      }
      contours += `<path d="${d}Z" fill="${shade(color, -0.17 + k * 0.025)}" stroke="${shade(color, -0.35)}" stroke-width="3"/>`;
    }
    return frame(
      `<rect x="210" y="260" width="780" height="960" rx="18" fill="${shade(color, 0.08)}" stroke="${shade(color, -0.2)}" stroke-width="6"/>
       <clipPath id="panel"><rect x="230" y="280" width="740" height="920" rx="10"/></clipPath><g clip-path="url(#panel)">${contours}</g>
       ${lit ? `<rect x="210" y="1222" width="780" height="20" fill="#ffc87a" opacity=".5" filter="url(#blur6)"/>` : ""}`,
      { lit, color, glowY: 740, glowR: 620 },
    );
  },
  sidibou(lit) {
    let waves = "";
    const blues = ["#1f4e8c", "#2f67ad", "#f5f1ea", "#3f7cc4", "#e9e3d8", "#18406f"];
    for (let i = 0; i < 16; i++) {
      const y = 320 + i * 56;
      let d = `M220,${y}`;
      for (let x = 220; x <= 980; x += 95) d += ` Q${x + 47},${y + (i % 2 ? -34 : 34)} ${x + 95},${y}`;
      waves += `<path d="${d} L980,1210 L220,1210 Z" fill="${blues[i % blues.length]}" opacity=".96"/>`;
    }
    return frame(
      `<rect x="200" y="280" width="800" height="950" rx="18" fill="#f5f1ea"/><clipPath id="p2"><rect x="220" y="300" width="760" height="910" rx="10"/></clipPath><g clip-path="url(#p2)">${waves}</g>
      <rect x="200" y="280" width="800" height="950" rx="18" fill="none" stroke="#d9cfbf" stroke-width="8"/>`,
      { lit, color: "#3f7cc4", glowY: 760, glowR: 620 },
    );
  },
  geode(lit, color) {
    const hex = (x, y, r, fill) => {
      let d = "";
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        d += `${i ? "L" : "M"}${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
      }
      let facets = "";
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        facets += `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * r).toFixed(1)}" y2="${(y + Math.sin(a) * r).toFixed(1)}" stroke="${shade(color, -0.3)}" stroke-width="3" opacity=".5"/>`;
      }
      return `<path d="${d}Z" fill="${fill}" stroke="${shade(color, -0.35)}" stroke-width="5"/>${facets}`;
    };
    const cells = [
      [0, 0], [1, 0], [-1, 0], [0.5, 1], [-0.5, 1], [0.5, -1], [-0.5, -1], [1.5, 1], [-1.5, -1],
    ];
    const r = 120;
    const out = cells
      .map(([q, rr], i) => hex(CX + q * r * 1.75, 740 + rr * r * 1.52, r, i % 3 === 0 ? (lit ? "url(#inner)" : shade(color, 0.1)) : shade(color, -0.05 + (i % 2) * 0.06)))
      .join("");
    return frame(out, { lit, color, glowY: 740, glowR: 620 });
  },
  carthage(lit, color) {
    let rays = "";
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r1 = 190;
      const r2 = i % 2 ? 380 : 450;
      rays += `<path d="M${CX + Math.cos(a - 0.05) * r1},${740 + Math.sin(a - 0.05) * r1} L${CX + Math.cos(a) * r2},${740 + Math.sin(a) * r2} L${CX + Math.cos(a + 0.05) * r1},${740 + Math.sin(a + 0.05) * r1} Z" fill="${shade(color, i % 2 ? -0.1 : 0.04)}"/>`;
    }
    let rings = "";
    for (let k = 0; k < 4; k++) rings += `<circle cx="${CX}" cy="740" r="${170 - k * 38}" fill="${k % 2 ? shade(color, -0.12) : shade(color, 0.06)}"/>`;
    return frame(`${rays}${rings}${lit ? `<circle cx="${CX}" cy="740" r="60" fill="url(#inner)"/>` : ""}`, { lit, color, glowY: 740, glowR: 640 });
  },
};

export const CATALOG = [
  ["aurora", "#efe4d2"], ["dune", "#d9b98b"], ["torsade", "#f2ead9"], ["halo", "#f4ede2"],
  ["kumo", "#c9714e"], ["ondee", "#e9dfcf"], ["medina", "#b78a5a"], ["nara", "#f1e8da"],
  ["atlas", "#d8c3a2"], ["sidibou", "#3f7cc4"], ["geode", "#a9b7a0"], ["carthage", "#c79a55"],
];

await mkdir(OUT, { recursive: true });
for (const [name, color] of CATALOG) {
  for (const lit of [true, false]) {
    const svg = designs[name](lit, color);
    await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(resolve(OUT, `${name}-${lit ? "lit" : "day"}.webp`));
  }
  process.stdout.write(`${name} `);
}
// Hero background (wide, lit)
const hero = designs.torsade(true, "#f2ead9");
await sharp(Buffer.from(hero)).resize(1200, 1500).webp({ quality: 88 }).toFile(resolve(OUT, "hero.webp"));
console.log("\nCatalog images written to public/catalog");
