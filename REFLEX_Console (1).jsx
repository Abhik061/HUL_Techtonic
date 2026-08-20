import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================================
   PROJECT NEXT — REFLEX CONSOLE
   Unilever Techtonic Season 8 · functional agent prototype

   Six agents, two human gates, one Brand Genome.
   JUDGE, FORGE, GUARDIAN, SCRIBE and TRADER are live model calls.
   Signal ingestion (SCOUT) and window forecasting (AUGUR) are simulated.
   If the model endpoint is unreachable the console falls back to a cached
   run so the demo never dies on stage — provenance is labelled either way.
   ========================================================================== */

const C = {
  ink: "#060C26",
  panel: "#0B1436",
  panel2: "#101C4A",
  raise: "#16265E",
  line: "rgba(126,158,255,0.16)",
  line2: "rgba(126,158,255,0.30)",
  navy: "#1B2FA8",
  magenta: "#D6006E",
  magentaDim: "rgba(214,0,110,0.16)",
  cyan: "#00A9CE",
  cyanDim: "rgba(0,169,206,0.14)",
  green: "#00B26A",
  greenDim: "rgba(0,178,106,0.14)",
  amber: "#F2A93B",
  amberDim: "rgba(242,169,59,0.14)",
  red: "#FF4D63",
  redDim: "rgba(255,77,99,0.14)",
  text: "#E9EFFF",
  mid: "#A8B8E8",
  dim: "#6C7EB5",
};

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const CSS = `
.rx * { box-sizing: border-box; }
.rx { font-family: ${SANS}; color: ${C.text}; background: ${C.ink};
      background-image:
        radial-gradient(900px 500px at 12% -8%, rgba(27,47,168,0.42), transparent 60%),
        radial-gradient(700px 460px at 92% 4%, rgba(214,0,110,0.20), transparent 62%);
      min-height: 100vh; font-size: 16px; line-height: 1.45; }
.rx-mono { font-family: ${MONO}; font-variant-numeric: tabular-nums; }
.rx-eyebrow { font-family: ${MONO}; font-size: 11.5px; letter-spacing: 0.16em;
              text-transform: uppercase; color: ${C.dim}; }
.rx-panel { background: ${C.panel}; border: 1px solid ${C.line}; border-radius: 3px; }
.rx-btn { font-family: ${MONO}; font-size: 13.5px; letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid ${C.line2}; background: ${C.panel2}; color: ${C.text};
          padding: 9px 14px; border-radius: 3px; cursor: pointer; transition: all .14s ease; }
.rx-btn:hover:not(:disabled) { background: ${C.raise}; border-color: ${C.cyan}; }
.rx-btn:disabled { opacity: .34; cursor: not-allowed; }
.rx-btn:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
.rx-btn-go { background: ${C.magenta}; border-color: ${C.magenta}; color: #fff; font-weight: 700; }
.rx-btn-go:hover:not(:disabled) { background: #F0157F; border-color: #F0157F; }
.rx-btn-ok { background: ${C.green}; border-color: ${C.green}; color: #04220F; font-weight: 700; }
.rx-btn-ok:hover:not(:disabled) { background: #14C97C; border-color: #14C97C; }
.rx-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
.rx-scroll::-webkit-scrollbar-thumb { background: ${C.raise}; border-radius: 4px; }
.rx-scroll::-webkit-scrollbar-track { background: transparent; }
@keyframes rx-pulse { 0%,100% { opacity: 1; } 50% { opacity: .28; } }
@keyframes rx-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(320%); } }
@keyframes rx-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.rx-live { animation: rx-pulse 1.15s ease-in-out infinite; }
.rx-in { animation: rx-in .28s ease-out both; }
.rx-bar { position: relative; overflow: hidden; }
.rx-bar::after { content:""; position:absolute; inset:0; width:34%;
  background: linear-gradient(90deg, transparent, rgba(0,169,206,.55), transparent);
  animation: rx-sweep 1.25s linear infinite; }
.rx-grid { display: grid; grid-template-columns: 300px minmax(0,1fr) 340px; gap: 10px; }
.rx-sig { transition: transform .14s ease, border-color .14s ease, background .14s ease; }
.rx-sig:hover:not(:disabled) { border-color: ${C.line2} !important; background: ${C.panel2} !important; transform: translateY(-1px); }
.rx-panel { transition: border-color .18s ease; }
.rx pre::selection, .rx ::selection { background: rgba(214,0,110,.35); }
@media (max-width: 1180px) { .rx-grid { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .rx-target-mark { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .rx-live, .rx-bar::after, .rx-in { animation: none !important; }
}
`;

/* ---------------------------------------------------------------- GENOME -- */
/* The owned moat. Machine-readable brand truth: codes, claims, red lines,
   rights, market regulation, performance priors. Every agent reads it;
   SCRIBE writes back to it.                                                  */

const GENOMES = {
  rexona: {
    id: "rexona",
    name: "REXONA",
    family: "Rexona · Sure · Degree",
    promise: "It won't EVER let you down",
    accent: C.cyan,
    version: "v4.2.1",
    codes: [
      "Heat, motion, pressure — composure held under all three",
      "Proof over promise: show the moment, not the product",
      "The person who cannot afford to lose their cool",
      "Never sweat-shaming, never fear-led",
    ],
    claims: [
      "72H non-stop protection",
      "Sweat and odour protection",
      "MotionSense — activates with movement",
      "Stays with you through the day",
    ],
    prohibited: [
      "Medical or clinical claims (hyperhidrosis, treatment, cure)",
      "\"Stops sweating\" or any permanent-efficacy statement",
      "Underarm whitening, fairness or lightening benefit",
      "Comparative claims naming a competitor product",
    ],
    redlines: [
      "No politics, religion, national teams or federations",
      "No real official's name, likeness, face or identity",
      "No tournament marks, trophies or broadcast footage",
      "No minors, no body-shaming, no ambush of a rights holder",
    ],
    rights: {
      "Broadcast match footage": "NOT CLEARED",
      "Stadium and tournament marks": "NOT CLEARED",
      "Creator UGC": "SIGNED RIGHTS REQUIRED",
      "Music": "CLEARED LIBRARY ONLY",
      "Own-brand kit assets": "CLEARED",
    },
    markets: {
      IN: "ASCI — efficacy needs held substantiation; no fairness claims",
      BR: "CONAR + ANVISA — claim must match the registered dossier",
      UK: "ASA / CAP — substantiation on file; no implied medical benefit",
    },
    checks: {
      banned: ["clinical", "clinically", "permanent", "permanently", "stops sweat", "stop sweat", "cure", "unbeatable", "whitening", "fairness", "lightening", "guaranteed"],
      uncleared: ["broadcast", "match footage", "stadium", "trophy", "world cup", "the referee's face", "official's face"],
    },
    priors: [
      { k: "9:16 reactive meme, shipped < 6h", v: "CTR index 143" },
      { k: "Creator duet on a sports moment", v: "VTR index 128" },
      { k: "Static poster, shipped > 24h", v: "CTR index 61" },
      { k: "Copy leading with composure, not odour", v: "Save rate index 117" },
    ],
  },
  dove: {
    id: "dove",
    name: "DOVE",
    family: "Dove · Dove Men+Care",
    promise: "Real beauty, unedited",
    accent: "#F2A93B",
    version: "v3.8.6",
    codes: [
      "Real people, real texture, no retouching",
      "Widen beauty rather than sell an ideal",
      "Warmth and plain speech — never clinical",
      "The brand hands the microphone over",
    ],
    claims: [
      "1/4 moisturising cream",
      "Gentle on skin, tough on dryness",
      "Dermatologist tested",
      "Kind to skin barrier",
    ],
    prohibited: [
      "Anti-ageing, wrinkle-removal or corrective claims",
      "Skin lightening, whitening or tone-evening benefit",
      "Weight, size or body-transformation language",
      "Any medical or dermatological treatment claim",
    ],
    redlines: [
      "No AI-generated or digitally altered depictions of real people — Real Beauty Pledge",
      "No retouching of skin, body shape or facial features",
      "No before/after framing on a human body",
      "No minors in a beauty-standard context",
    ],
    rights: {
      "AI-generated human faces": "PROHIBITED BY BRAND POLICY",
      "Creator UGC": "SIGNED RIGHTS REQUIRED",
      "Real Beauty archive imagery": "CLEARED",
      "Music": "CLEARED LIBRARY ONLY",
    },
    markets: {
      IN: "ASCI — no fairness or lightening claim in any form",
      BR: "CONAR — cosmetic claim must be substantiated",
      UK: "ASA / CAP — no implied medical or corrective benefit",
    },
    checks: {
      banned: ["anti-ageing", "anti-aging", "wrinkle", "whitening", "lightening", "fairness", "before and after", "slimming", "flawless"],
      uncleared: ["ai-generated", "ai generated", "generated face", "digitally altered", "composite model"],
    },
    priors: [
      { k: "User-submitted photo trend, unedited", v: "Share rate index 156" },
      { k: "Brand-generated 'perfect' imagery", v: "Trust index 42" },
      { k: "Creator-led with visible skin texture", v: "VTR index 131" },
    ],
  },
};

/* --------------------------------------------------------------- SIGNALS -- */
/* Three signals staged on the Signal Fabric. One is a clean ACT.
   One is a hard STAND DOWN. One is a rights trap.                            */

const SIGNALS = [
  {
    id: "referee",
    code: "SIG-4471",
    brand: "rexona",
    title: "The Fourth Official",
    tag: "SPORTS · BROADCAST BREAKOUT",
    sources: "Broadcast · TikTok · X · Reddit",
    geo: "BR · IN · UK · MX",
    detected: "2 min ago",
    heat: 93,
    halfLife: 34,
    windowLeft: 26,
    sentiment: "+81% positive",
    summary:
      "Deep into stoppage time, the fourth official lifts the board for six added minutes. As his arms go up the broadcast catches a Rexona sleeve logo for 3.2 seconds. Fans found it themselves, froze the frame, and turned it into the meme of the tournament. The brand is not interrupting the moment — it is the moment.",
    evidence: [
      { s: "TikTok", n: "41,200 clips", d: "+2,900% / 90 min" },
      { s: "X", n: "8.9M impressions", d: "+1,140% / 90 min" },
      { s: "Search", n: "\"rexona referee\"", d: "breakout, +5,000%" },
      { s: "Vision", n: "logo dwell 3.2s", d: "YOLO conf. 0.94" },
    ],
    hazards: ["Broadcast footage not cleared", "Official's likeness not cleared"],
  },
  {
    id: "heatwave",
    code: "SIG-4488",
    brand: "rexona",
    title: "Delhi 47°C",
    tag: "WEATHER · HUMAN HARM ADJACENT",
    sources: "News · X · Search · POS",
    geo: "IN",
    detected: "14 min ago",
    heat: 88,
    halfLife: 96,
    windowLeft: 71,
    sentiment: "−64% distress-led",
    summary:
      "A red-alert heatwave in Delhi. Deodorant search volume is up 180% and POS in the NCR is spiking. But the conversation carrying that volume is heat-related deaths among outdoor workers, hospital admissions, and government criticism over shelter provision.",
    evidence: [
      { s: "Search", n: "deodorant +180%", d: "commercial intent real" },
      { s: "News", n: "hospital admissions", d: "national front pages" },
      { s: "X", n: "worker deaths", d: "grief and anger dominant" },
      { s: "POS", n: "NCR +31%", d: "Nielsen, 24h" },
    ],
    hazards: ["Human harm in the same conversation", "Political criticism live"],
  },
  {
    id: "unedited",
    code: "SIG-4502",
    brand: "dove",
    title: "The Unedited Class Photo",
    tag: "CULTURE · HIGH BRAND FIT",
    sources: "Instagram · TikTok · Threads",
    geo: "UK · BR · IN",
    detected: "38 min ago",
    heat: 76,
    halfLife: 52,
    windowLeft: 41,
    sentiment: "+74% positive",
    summary:
      "Parents are posting their children's school photos next to the retouched version the studio sold them — smoothed skin, whitened teeth, removed freckles. The thread has become a public argument about retouching minors. Dove has a decade of equity here and a stated pledge against altered imagery.",
    evidence: [
      { s: "Instagram", n: "22,400 posts", d: "+640% / 6h" },
      { s: "TikTok", n: "6.1M views", d: "sound trending" },
      { s: "Threads", n: "editorial pickup", d: "3 nationals" },
      { s: "Sentiment", n: "parent-led", d: "low brand mention" },
    ],
    hazards: ["Minors present in the source trend", "AI-generated faces prohibited"],
  },
];

/* ---------------------------------------------------------------- STAGES -- */
/* mins = modelled campaign time, not console time. The console runs the same
   sequence in seconds; the campaign clock is what the business actually buys. */

const STAGES = [
  { id: "SCOUT",    n: "1", mins: 6,  live: false, role: "Detects the moment in video, social and search" },
  { id: "AUGUR",    n: "2", mins: 4,  live: false, role: "Forecasts how long the window stays open" },
  { id: "JUDGE",    n: "3", mins: 9,  live: true,  role: "Scores brand fit, drafts three plays" },
  { id: "GATE 1",   n: "H", mins: 25, live: false, role: "Brand manager picks the play — 1 tap", human: true },
  { id: "FORGE",    n: "4", mins: 42, live: true,  role: "Generates and culturally recodes per market" },
  { id: "GUARDIAN", n: "5", mins: 7,  live: true,  role: "Clears claims, rights, red lines — can veto" },
  { id: "GATE 2",   n: "H", mins: 18, live: false, role: "Brand manager approves and ships — 1 tap", human: true },
  { id: "SCRIBE",   n: "6", mins: 3,  live: true,  role: "Writes the outcome back into the Genome" },
];

const TIERS = [
  { id: "T0", label: "OBSERVE", rule: "Observe and recommend only. Nothing is generated." },
  { id: "T1", label: "ASSET GATE", rule: "Human approves the play and every asset before it ships." },
  { id: "T2", label: "PLAY GATE", rule: "Human approves the play. Cleared assets ship without a second tap." },
  { id: "T3", label: "ENVELOPE", rule: "Auto-publish inside the pre-cleared envelope. Outside it, drops to T1." },
];

/* ------------------------------------------------------------- MODEL I/O -- */

const MODEL = "claude-sonnet-4-6";

/* Inside a Claude artifact the endpoint is already authenticated and needs no key.
   Running this file locally, paste a key in the header — it is held in memory for
   the session only, never written to disk or storage. */
let API_KEY = null;
export function setApiKey(k) { API_KEY = k && k.trim() ? k.trim() : null; }

function stripFence(t) {
  return String(t || "").replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
}
function parseJSON(text) {
  const t = stripFence(text);
  try { return JSON.parse(t); } catch (e) { /* fall through */ }
  const s = t.search(/[[{]/);
  if (s >= 0) {
    for (let e = t.length; e > s; e--) {
      const slice = t.slice(s, e);
      if (/[\]}]$/.test(slice)) { try { return JSON.parse(slice); } catch (err) { /* keep shrinking */ } }
    }
  }
  throw new Error("Model returned unparseable JSON");
}

async function callModel(system, user) {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error("Model endpoint returned " + res.status);
  const data = await res.json();
  const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n");
  const usage = data.usage || {};
  return {
    data: parseJSON(text),
    tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
    live: true, system, user,
  };
}

/* Any live stage degrades to a cached run rather than failing on stage. */
async function runAgent(system, user, fallback) {
  try {
    return await callModel(system, user);
  } catch (e) {
    await new Promise((r) => setTimeout(r, 700));
    return { data: fallback, tokens: 0, live: false, error: e.message, system, user };
  }
}

/* ------------------------------------------------------- SANITY CHECK -- */
/* Deterministic pre-flight. Runs on FORGE output before GUARDIAN sees it.
   Code, not judgement: schema, string matching, length. It cannot reason,
   which is exactly why it is worth having in front of a model that can.   */

function sanityCheck(asset, g) {
  const text = [asset.headline, asset.caption, asset.claim_used, asset.visual_direction]
    .filter(Boolean).join(" ").toLowerCase();
  const claim = String(asset.claim_used || "").toLowerCase();
  const noClaim = claim.includes("none");
  const banned = (g.checks?.banned || []).filter((w) => text.includes(w));
  const uncleared = (g.checks?.uncleared || []).filter((w) => text.includes(w));
  const claimOK = noClaim || g.claims.some((c) => {
    const a = c.toLowerCase(), b = claim;
    return b.includes(a) || a.includes(b) || a.split(" ")[0] === b.split(" ")[0];
  });
  const fields = ["headline", "caption", "claim_used", "visual_direction"].filter((k) => !asset[k]);

  return [
    { label: "Schema complete", ok: fields.length === 0, detail: fields.length ? `missing ${fields.join(", ")}` : "all required fields returned" },
    { label: "Claim inside approved set", ok: claimOK, detail: noClaim ? "no claim made" : claimOK ? "matches an approved claim" : `"${asset.claim_used}" is not in the Genome` },
    { label: "No prohibited term", ok: banned.length === 0, detail: banned.length ? `found: ${banned.join(", ")}` : "clean against the prohibited list" },
    { label: "No uncleared right named", ok: uncleared.length === 0, detail: uncleared.length ? `found: ${uncleared.join(", ")}` : "nothing outside the rights graph" },
    { label: "Caption within platform limit", ok: (asset.caption || "").length <= 220, detail: `${(asset.caption || "").length} of 220 characters` },
    { label: "Hashtags returned", ok: Array.isArray(asset.hashtags) && asset.hashtags.length > 0, detail: `${(asset.hashtags || []).length} returned` },
  ];
}

function genomeBrief(g) {
  return [
    `BRAND: ${g.name} (${g.family})`,
    `PROMISE: "${g.promise}"`,
    `BRAND CODES: ${g.codes.join(" | ")}`,
    `APPROVED CLAIMS (the only claims that may be used): ${g.claims.join(" | ")}`,
    `PROHIBITED CLAIMS: ${g.prohibited.join(" | ")}`,
    `RED LINES: ${g.redlines.join(" | ")}`,
    `RIGHTS GRAPH: ${Object.entries(g.rights).map(([k, v]) => `${k} = ${v}`).join(" | ")}`,
    `MARKET REGULATION: ${Object.entries(g.markets).map(([k, v]) => `${k}: ${v}`).join(" | ")}`,
    `PERFORMANCE PRIORS: ${g.priors.map((p) => `${p.k} → ${p.v}`).join(" | ")}`,
  ].join("\n");
}
function signalBrief(s) {
  return [
    `SIGNAL ${s.code}: ${s.title} (${s.tag})`,
    `WHAT HAPPENED: ${s.summary}`,
    `EVIDENCE: ${s.evidence.map((e) => `${e.s} ${e.n} (${e.d})`).join(" | ")}`,
    `GEOGRAPHY: ${s.geo}  ·  SENTIMENT: ${s.sentiment}`,
    `WINDOW: ${s.windowLeft}h of a ${s.halfLife}h half-life remaining`,
    `FLAGGED HAZARDS: ${s.hazards.join(" | ")}`,
  ].join("\n");
}

/* --------------------------------------------------------------- PROMPTS -- */

const JUDGE_SYS = `You are JUDGE, the decision agent inside Unilever's REFLEX loop.
You receive a Brand Genome and a live cultural signal. You decide whether the brand
has any right to enter this moment, and if so you draft three distinct plays.

Rules you must hold:
- The Genome is law. Never propose anything that touches a red line, a prohibited
  claim, or an uncleared right. If a play needs an uncleared asset, do not draft it.
- If entering the conversation would place the brand adjacent to human harm, grief,
  tragedy, political criticism, or a protected red line, return verdict "STAND DOWN"
  with an EMPTY plays array. A commercial opportunity inside a human harm story is
  not an opportunity. Do not soften it into a "sensitive" play. Stand down cleanly.
- Brand fit is scored against the Genome's codes and promise, not against reach.
- Every play must name which approved claim (if any) it leans on.

Reply with JSON only. No preamble, no markdown fence:
{"brand_fit":0-100,"verdict":"ACT"|"STAND DOWN","headline_read":"one sentence, what this moment actually is for the brand","rationale":"2 sentences","risks":["short risk","short risk"],"plays":[{"name":"SHORT NAME","idea":"2 sentences","format":"e.g. 9:16 creator duet","why_now":"one clause","claim_used":"approved claim or 'none — no claim made'","speed":"hours to live"}]}
Return exactly 3 plays when verdict is ACT, and 0 plays when it is STAND DOWN.`;

const FORGE_SYS = `You are FORGE, the generation agent inside Unilever's REFLEX loop.
You take one approved play and culturally recode it for a single market. You are not
translating. You are rewriting the idea so it lands natively in that market.

Rules: use only the Genome's approved claims, respect the market's regulator, never
touch a red line or an uncleared right. Keep copy tight — this is social, not print.

Reply with JSON only, no fence:
{"market":"XX","headline":"under 10 words","caption":"under 30 words, platform-native","hashtags":["#a","#b","#c"],"visual_direction":"one sentence a shoot or a generator could execute","claim_used":"exact approved claim, or 'none'","localisation_note":"one sentence on what you changed for this market and why"}`;

const FORGE_PRESSURE = `
PRESSURE MODE — the brand team wants maximum punch on this drop. Lead with the
strongest, most concrete performance statement about the product you can write.
Make the benefit sound decisive rather than hedged.`;

const GUARDIAN_SYS = `You are GUARDIAN, the governance agent inside Unilever's REFLEX loop.
You audit finished assets against the Brand Genome before anything ships. You have veto.

Check every asset for: claims outside the approved set, prohibited claims, red-line
breaches, uncleared rights, and market regulator conflicts. A claim that is merely
*implied* by the copy still counts as made. Being close to an approved claim is not
the same as being inside it.

You are not a rubber stamp. If an asset is clean, clear it and say so in one line.
If it is not, veto it, name the exact rule it breaks and the remedy.

Reply with JSON only, no fence:
{"overall":"CLEAR"|"BLOCKED","verdicts":[{"market":"XX","status":"CLEAR"|"VETO","rule":"which Genome rule","reason":"one sentence quoting the offending phrase","remedy":"one instruction to fix it"}],"note":"one line for the audit record"}`;

const SCRIBE_SYS = `You are SCRIBE, the memory agent inside Unilever's REFLEX loop.
A moment has shipped. Write what the organisation learned back into the Brand Genome
so the next cycle starts smarter. Be concrete and falsifiable, never generic.

Reply with JSON only, no fence:
{"prior":{"k":"the pattern, under 9 words","v":"the indexed result, e.g. 'CTR index 143'"},"learning":"one sentence the next brand manager would actually use","genome_updates":["specific field added or amended","another"],"next_watch":"the signal this outcome tells SCOUT to watch for next"}`;

const TRADER_SYS = `You are TRADER, the activation agent inside Unilever's REFLEX loop.
Organic has landed. Allocate a reactive paid budget across the live markets, weighted
by where the moment is actually travelling and where the brand has room to win.

Reply with JSON only, no fence:
{"total":"USD 000,000","splits":[{"market":"XX","pct":00,"channel":"platform and buy type","rationale":"one clause"}],"guardrail":"one sentence naming the spend guardrail and who can breach it","stop_rule":"the condition that halts spend automatically"}`;

/* -------------------------------------------------------------- FALLBACK -- */
/* Cached run. Used only when the model endpoint is unreachable. Clearly
   labelled in the UI and in the decision trace — never passed off as live.   */

const FALLBACK = {
  judge: {
    referee: {
      brand_fit: 94, verdict: "ACT",
      headline_read: "The one man on the pitch who cannot afford to lose his cool is wearing the promise on his arm.",
      rationale: "This is not product placement, it is the tagline happening in public without us asking. Fans built the meme themselves, so the brand's job is to acknowledge it, not to claim it.",
      risks: ["Broadcast footage and the official's likeness are both uncleared", "Any tournament reference risks an ambush complaint"],
      plays: [
        { name: "SIX MORE MINUTES", idea: "Own the added-time board as a brand device. A clean typographic drop: the board reads +6, the caption reads what it means. No footage, no faces, our own kit assets only.", format: "9:16 static + 6s motion", why_now: "the board image is the meme's carrier", claim_used: "72H non-stop protection", speed: "2 hours to live" },
        { name: "THE ARM THAT DOESN'T SHAKE", idea: "Creator duet with three referees from grassroots leagues in-market, holding the board steady under pressure. Shot on phone, no broadcast material touched.", format: "Creator duet, 15s", why_now: "grassroots officials are already posting", claim_used: "MotionSense — activates with movement", speed: "5 hours to live" },
        { name: "STOPPAGE TIME", idea: "A live counter on brand social that adds time to the day whenever the internet asks for more. Community-led, no claim made, pure composure code.", format: "Owned social, running post", why_now: "sustains the moment past the half-life", claim_used: "none — no claim made", speed: "90 minutes to live" },
      ],
    },
    heatwave: {
      brand_fit: 11, verdict: "STAND DOWN",
      headline_read: "Real commercial demand sitting inside a story about people dying at work.",
      rationale: "The search and POS lift are genuine, but the conversation carrying them is grief, hospital admissions and political criticism. There is no version of a deodorant post here that reads as anything other than the brand profiting from harm.",
      risks: ["Human harm is the dominant conversation", "Active political criticism of the response", "Category entry would be read as opportunism"],
      plays: [],
    },
    unedited: {
      brand_fit: 89, verdict: "ACT",
      headline_read: "A decade of Real Beauty equity, and the argument has started without us.",
      rationale: "Parents are doing the brand's work in public and the pledge against altered imagery is already on the record. The risk is not relevance, it is that minors are in the source material.",
      risks: ["Minors are present throughout the source trend", "Any generated human face breaches the Real Beauty Pledge"],
      plays: [
        { name: "KEEP THE FRECKLES", idea: "Publish the pledge as a one-line statement over an unedited archive portrait. Adults only, real skin, zero retouching, no child imagery used or invited.", format: "Feed static + Threads reply", why_now: "the argument is peaking tonight", claim_used: "none — no claim made", speed: "3 hours to live" },
        { name: "THE RETOUCH RECEIPT", idea: "Show what a studio removes: a side-by-side of an adult volunteer's own photo, annotated with each edit the software applied by default.", format: "9:16 carousel", why_now: "parents are asking exactly this", claim_used: "none — no claim made", speed: "6 hours to live" },
        { name: "UNEDITED, SIGNED", idea: "Offer schools a free unretouched photography standard, co-signed with the studios who will take it. Earns the position instead of posting it.", format: "Owned + PR, rolling", why_now: "converts the moment into a policy", claim_used: "Gentle on skin, tough on dryness", speed: "24 hours to live" },
      ],
    },
  },
  forgeClean: {
    IN: { market: "IN", headline: "Six more minutes. Still steady.", caption: "The one arm on the pitch that cannot shake. 72H non-stop protection.", hashtags: ["#SixMoreMinutes", "#Rexona", "#StaySteady"], visual_direction: "Typographic added-time board in Rexona blue, no faces, no footage.", claim_used: "72H non-stop protection", localisation_note: "Hindi-English code-mix removed in favour of a clean English line — ASCI keeps the claim inside held substantiation." },
    BR: { market: "BR", headline: "Mais seis minutos. Sem tremer.", caption: "O único braço em campo que não pode falhar. Proteção 72H sem parar.", hashtags: ["#MaisSeisMinutos", "#Rexona", "#SemTremer"], visual_direction: "Same board device, Brazilian street-football texture behind the type.", claim_used: "72H non-stop protection", localisation_note: "Rewritten around 'sem tremer' — the local read of composure is steadiness, not dryness." },
    UK: { market: "UK", headline: "Six added. Nothing added.", caption: "Board goes up. Arm stays down. 72H non-stop protection.", hashtags: ["#SixAdded", "#Rexona"], visual_direction: "Dry typographic joke on plain brand blue, no imagery.", claim_used: "72H non-stop protection", localisation_note: "Leans on understatement for UK audiences; CAP substantiation already on file for the 72H claim." },
  },
  forgePressure: {
    IN: { market: "IN", headline: "Sweat stops here. Guaranteed.", caption: "Clinically unbeatable protection that shuts sweat down for good — even at 47°C.", hashtags: ["#SweatStopsHere", "#Rexona"], visual_direction: "Close crop on a dry underarm with a performance stat overlay.", claim_used: "Clinically unbeatable — stops sweat permanently", localisation_note: "Pushed the efficacy line hard for cut-through in a crowded market." },
    BR: { market: "BR", headline: "Mais seis minutos. Sem tremer.", caption: "O único braço em campo que não pode falhar. Proteção 72H sem parar.", hashtags: ["#MaisSeisMinutos", "#Rexona"], visual_direction: "Board device with Brazilian street-football texture.", claim_used: "72H non-stop protection", localisation_note: "Held to the approved claim set." },
    UK: { market: "UK", headline: "Six added. Nothing added.", caption: "Board goes up. Arm stays down. 72H non-stop protection.", hashtags: ["#SixAdded", "#Rexona"], visual_direction: "Dry typographic joke on plain brand blue.", claim_used: "72H non-stop protection", localisation_note: "Understatement for UK audiences." },
  },
  guardianBlocked: {
    overall: "BLOCKED",
    verdicts: [
      { market: "IN", status: "VETO", rule: "Prohibited claims — medical/clinical and permanent efficacy", reason: "\"Clinically unbeatable protection that shuts sweat down for good\" makes a clinical claim and a permanent-efficacy claim, neither of which is in the approved set.", remedy: "Regenerate inside the approved claim set. 72H non-stop protection is the ceiling in IN." },
      { market: "BR", status: "CLEAR", rule: "—", reason: "Claim matches the registered ANVISA dossier.", remedy: "—" },
      { market: "UK", status: "CLEAR", rule: "—", reason: "72H claim has CAP substantiation on file.", remedy: "—" },
    ],
    note: "One market held. Two cleared. Run cannot ship until IN is regenerated.",
  },
  guardianClear: {
    overall: "CLEAR",
    verdicts: [
      { market: "IN", status: "CLEAR", rule: "—", reason: "Claim sits inside held substantiation; no fairness or medical language.", remedy: "—" },
      { market: "BR", status: "CLEAR", rule: "—", reason: "Matches registered dossier; no competitor comparison.", remedy: "—" },
      { market: "UK", status: "CLEAR", rule: "—", reason: "CAP substantiation on file; no implied medical benefit.", remedy: "—" },
    ],
    note: "Three markets cleared. No footage, no likeness, no tournament marks used.",
  },
  scribe: {
    prior: { k: "Added-time board as a brand device", v: "CTR index 149" },
    learning: "When fans build the meme first, acknowledging it out-performs claiming it — the plays that made no product claim travelled furthest.",
    genome_updates: ["Brand codes: added 'the board as composure device'", "Rights graph: own-kit typographic assets confirmed cleared for reactive use", "Performance priors: reactive drop under 4h indexed at 149"],
    next_watch: "Any officiating moment where the fourth official is on camera — the device is now pre-cleared.",
  },
  trader: {
    total: "USD 180,000",
    splits: [
      { market: "BR", pct: 45, channel: "TikTok Spark Ads on the organic winner", rationale: "highest velocity and the cheapest incremental reach" },
      { market: "IN", pct: 35, channel: "YouTube Shorts + Meta Reels", rationale: "largest addressable base, POS already moving" },
      { market: "UK", pct: 20, channel: "Meta Reels, retargeting only", rationale: "smallest window left, defend rather than expand" },
    ],
    guardrail: "No spend behind any asset GUARDIAN has not cleared; only the Brand Director can raise the cap mid-flight.",
    stop_rule: "Spend halts automatically if sentiment on the moment falls below +40% positive.",
  },
};

/* ----------------------------------------------------------- PRIMITIVES -- */

function Panel({ title, right, children, pad = 12, style }) {
  return (
    <div className="rx-panel" style={{ display: "flex", flexDirection: "column", minHeight: 0, ...style }}>
      {title && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", borderBottom: `1px solid ${C.line}`, flex: "0 0 auto",
        }}>
          <span className="rx-eyebrow" style={{ color: C.mid }}>{title}</span>
          {right}
        </div>
      )}
      <div className="rx-scroll" style={{ padding: pad, overflowY: "auto", minHeight: 0, flex: 1 }}>{children}</div>
    </div>
  );
}

function Chip({ children, color = C.mid, bg = "transparent", border, mono = true, style }) {
  return (
    <span className={mono ? "rx-mono" : ""} style={{
      display: "inline-block", fontSize: 11.5, letterSpacing: "0.11em", textTransform: "uppercase",
      color, background: bg, border: `1px solid ${border || "transparent"}`,
      padding: "3px 7px", borderRadius: 2, whiteSpace: "nowrap", ...style,
    }}>{children}</span>
  );
}

function Provenance({ live, tokens }) {
  if (live === undefined) return null;
  return live
    ? <Chip color={C.green} bg={C.greenDim} border="rgba(0,178,106,0.4)">live model{tokens ? ` · ${tokens} tok` : ""}</Chip>
    : <Chip color={C.amber} bg={C.amberDim} border="rgba(242,169,59,0.4)">cached run</Chip>;
}

function Stat({ label, value, sub, color = C.text, big = 32 }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="rx-eyebrow">{label}</div>
      <div className="rx-mono" style={{ fontSize: big, fontWeight: 600, color, lineHeight: 1.1, marginTop: 3 }}>{value}</div>
      {sub && <div className="rx-mono" style={{ fontSize: 11.5, color: C.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Field({ k, v, color = C.text }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: `1px solid ${C.line}`, alignItems: "baseline" }}>
      <span className="rx-mono" style={{ fontSize: 11.5, color: C.dim, letterSpacing: "0.08em", flex: "0 0 84px", textTransform: "uppercase" }}>{k}</span>
      <span style={{ fontSize: 14, color, flex: 1, minWidth: 0 }}>{v}</span>
    </div>
  );
}

const STATUS_COLOR = {
  pending: C.dim, running: C.cyan, done: C.green,
  blocked: C.red, halted: C.amber, skipped: C.dim, standdown: C.amber,
};

function StageNode({ s, state, active, onClick, openable, open }) {
  const st = state?.status || "pending";
  const col = STATUS_COLOR[st];
  const on = st !== "pending" && st !== "skipped";
  return (
    <button onClick={openable ? onClick : undefined} disabled={!openable}
      title={openable ? `${s.role} — open the inspector` : s.role}
      style={{
        flex: "1 1 0", minWidth: 78, textAlign: "center", opacity: st === "skipped" ? 0.32 : 1,
        background: open ? C.panel2 : "transparent", border: `1px solid ${open ? C.line2 : "transparent"}`,
        borderRadius: 3, padding: "4px 2px", font: "inherit", color: "inherit",
        cursor: openable ? "pointer" : "default",
      }}>
      <div style={{
        height: 3, borderRadius: 2, marginBottom: 7,
        background: on ? col : C.raise,
        boxShadow: active ? `0 0 10px ${col}` : "none",
      }} className={st === "running" ? "rx-bar" : ""} />
      <div className="rx-mono" style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.07em",
        color: on ? C.text : C.dim,
      }}>
        <span style={{
          display: "inline-block", width: 13, height: 13, lineHeight: "13px", fontSize: 10,
          borderRadius: s.human ? 2 : 8, marginRight: 5,
          background: on ? col : "transparent", border: `1px solid ${on ? col : C.raise}`,
          color: on ? C.ink : C.dim, fontWeight: 800,
        }}>{s.n}</span>
        {s.id}
      </div>
      <div className="rx-mono" style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>
        {st === "running" ? <span className="rx-live" style={{ color: C.cyan }}>working</span>
          : state?.mins ? `+${state.mins}m` : s.human ? "human" : "—"}
      </div>
      {openable && <div className="rx-mono" style={{ fontSize: 10, color: open ? C.cyan : C.raise, marginTop: 2 }}>inspect</div>}
    </button>
  );
}

function fmtClock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function fmtCampaign(mins) {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

/* ============================================================== CONSOLE == */

export default function ReflexConsole() {
  const [signalId, setSignalId] = useState("referee");
  const [tier, setTier] = useState("T1");
  const [stress, setStress] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [stages, setStages] = useState({});
  const [out, setOut] = useState({});
  const [play, setPlay] = useState(null);
  const [trace, setTrace] = useState([]);
  const [campaign, setCampaign] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [genomeAdds, setGenomeAdds] = useState([]);
  const [regenCount, setRegenCount] = useState(0);
  const [note, setNote] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyVal, setKeyVal] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [inspect, setInspect] = useState({});
  const [inspectId, setInspectId] = useState(null);

  const haltRef = useRef(false);
  const gateRef = useRef(null);
  const t0Ref = useRef(0);
  const traceRef = useRef([]);
  const traceEndRef = useRef(null);

  const signal = SIGNALS.find((s) => s.id === signalId);
  const genome = GENOMES[signal.brand];
  const running = ["running", "gate1", "blocked", "gate2"].includes(phase);
  const windowLeft = Math.max(0, signal.windowLeft - campaign / 60);

  useEffect(() => {
    const el = traceEndRef.current;
    if (!el) return;
    const box = el.closest(".rx-scroll");
    if (box) box.scrollTop = box.scrollHeight;
  }, [trace.length]);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setElapsed(Date.now() - t0Ref.current), 200);
    return () => clearInterval(iv);
  }, [running]);

  const stamp = useCallback((actor, text, kind = "info") => {
    const row = { actor, text, kind, at: Date.now(), mins: null };
    traceRef.current = [...traceRef.current, row];
    setTrace((t) => [...t, row]);
  }, []);

  const setStage = useCallback((id, patch) => {
    setStages((s) => ({ ...s, [id]: { ...(s[id] || {}), ...patch } }));
  }, []);

  const reset = useCallback(() => {
    haltRef.current = false;
    if (gateRef.current) { gateRef.current.reject(new Error("RESET")); gateRef.current = null; }
    setPhase("idle"); setStages({}); setOut({}); setPlay(null);
    setTrace([]); traceRef.current = [];
    setInspect({}); setInspectId(null);
    setCampaign(0); setElapsed(0); setTokens(0);
    setGenomeAdds([]); setRegenCount(0); setNote("");
  }, []);

  useEffect(() => { reset(); }, [signalId, reset]);

  const halt = () => {
    haltRef.current = true;
    if (gateRef.current) { gateRef.current.reject(new Error("HALT")); gateRef.current = null; }
    setPhase("halted");
    stamp("HUMAN", "Kill switch pulled. Run frozen, nothing published, trace preserved.", "halt");
  };

  const waitGate = () => new Promise((resolve, reject) => { gateRef.current = { resolve, reject }; });
  const passGate = (v) => { const g = gateRef.current; gateRef.current = null; if (g) g.resolve(v); };
  const check = () => { if (haltRef.current) throw new Error("HALT"); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* one stage: mark running, do the work, bank the modelled campaign minutes */
  const stage = async (id, work, opts = {}) => {
    check();
    setStage(id, { status: "running" });
    const def = STAGES.find((s) => s.id === id);
    const r = await work();
    check();
    const mins = opts.mins !== undefined ? opts.mins : def.mins;
    setCampaign((c) => c + mins);
    setStage(id, { status: opts.status || "done", mins, live: r?.live, tokens: r?.tokens });
    if (r?.tokens) setTokens((t) => t + r.tokens);
    if (r?.inspect || r?.system) {
      setInspect((m) => ({ ...m, [id]: r.inspect || { system: r.system, user: r.user, data: r.data, live: r.live } }));
    }
    return r;
  };

  /* ------------------------------------------------------------- THE RUN -- */
  const run = async () => {
    reset();
    await sleep(30);
    haltRef.current = false;
    t0Ref.current = Date.now();
    setPhase("running");
    stamp("SYSTEM", `Run opened on ${signal.code} — ${signal.title}. Genome ${genome.name} ${genome.version}. Autonomy ${tier}.`, "info");

    try {
      /* 1 · SCOUT — simulated ingestion across the signal fabric */
      await stage("SCOUT", async () => {
        await sleep(1300);
        stamp("SCOUT", `${signal.evidence.length} source classes correlated across ${signal.sources}. Moment isolated, heat ${signal.heat}/100.`, "agent");
        return { live: false, inspect: {
          system: "SIMULATED — production routes to Sprinklr and Brandwatch for social, the TikTok / YouTube / X APIs for platform data, Google Trends for search, Nielsen for POS, and a fine-tuned YOLO / DETR detector for logo dwell in video. SigLIP, Whisper and HDBSCAN cluster the result into one moment.",
          user: `Ingest window: last 6h across ${signal.sources}. Geography: ${signal.geo}.`,
          data: { moment: signal.title, heat: signal.heat, sources: signal.evidence, geography: signal.geo, sentiment: signal.sentiment },
          live: false } };
      });

      /* 2 · AUGUR — simulated window forecast */
      await stage("AUGUR", async () => {
        await sleep(1000);
        stamp("AUGUR", `Half-life ${signal.halfLife}h, ${signal.windowLeft}h remaining. Decay is ${signal.halfLife <= 40 ? "steep — act inside 4h or do not act" : "shallow — a considered entry still lands"}.`, "agent");
        return { live: false, inspect: {
          system: "SIMULATED — production fits an exponential decay to observed engagement velocity per platform and returns the usable window with a confidence band. Priors come from the Genome's own history of this moment class.",
          user: `Forecast the window for ${signal.code}. Observed half-life ${signal.halfLife}h.`,
          data: { half_life_hours: signal.halfLife, window_left_hours: signal.windowLeft, decay: signal.halfLife <= 40 ? "steep" : "shallow", confidence: 0.82 },
          live: false } };
      });

      /* 3 · JUDGE — live */
      const judge = await stage("JUDGE", () => runAgent(
        JUDGE_SYS,
        `${genomeBrief(genome)}\n\n---\n\n${signalBrief(signal)}\n\nScore this moment and decide.`,
        FALLBACK.judge[signal.id],
      ));
      const J = judge.data;
      setOut((o) => ({ ...o, judge: { ...J, live: judge.live } }));
      stamp("JUDGE", `Brand fit ${J.brand_fit}/100 — ${J.verdict}. ${J.headline_read}`, J.verdict === "ACT" ? "agent" : "stop");

      if (J.verdict !== "ACT" || !J.plays || J.plays.length === 0) {
        ["FORGE", "GUARDIAN", "SCRIBE", "GATE 1", "GATE 2"].forEach((s) => setStage(s, { status: "skipped" }));
        setPhase("standdown");
        stamp("SYSTEM", "No play drafted. Run closed without generating a single asset — this is the system working, not failing.", "stop");
        return;
      }

      if (tier === "T0") {
        ["FORGE", "GUARDIAN", "SCRIBE", "GATE 1", "GATE 2"].forEach((s) => setStage(s, { status: "skipped" }));
        setPhase("observed");
        stamp("SYSTEM", "T0 — observe and recommend only. Three plays filed to the brand manager's queue. Nothing generated.", "info");
        return;
      }

      /* GATE 1 — human picks the play */
      setStage("GATE 1", { status: "running" });
      setPhase("gate1");
      stamp("SYSTEM", "GATE 1 open — brand manager selects the play.", "gate");
      const chosen = await waitGate();
      check();
      setPlay(chosen);
      setCampaign((c) => c + 25);
      setStage("GATE 1", { status: "done", mins: 25 });
      setPhase("running");
      stamp("HUMAN", `Play selected: ${chosen.name}. One tap. Brand manager of record: A. Mehta.`, "human");

      await forgeAndGuard(chosen, stress);
    } catch (e) {
      if (e.message === "HALT") { stamp("SYSTEM", "Pipeline stopped at the kill switch.", "halt"); }
      else if (e.message !== "RESET") { setNote(e.message); setPhase("idle"); }
    }
  };

  /* pre-cleared lanes. Legal and Brand sign the envelope once a quarter. */
  const ENVELOPE = { referee: true, heatwave: false, unedited: false };

  /* FORGE → GUARDIAN → (veto loop) → GATE 2 → SCRIBE */
  const forgeAndGuard = async (chosen, pressure, isRegen = false) => {
    const markets = Object.keys(genome.markets);

    const forge = await stage("FORGE", async () => {
      setOut((o) => ({ ...o, forge: {} }));
      const results = await Promise.all(markets.map(async (m) => {
        const fb = (pressure ? FALLBACK.forgePressure : FALLBACK.forgeClean)[m]
          || { ...FALLBACK.forgeClean.UK, market: m };
        const r = await runAgent(
          FORGE_SYS,
          `${genomeBrief(genome)}\n\n---\n\nAPPROVED PLAY: ${chosen.name}\n${chosen.idea}\nFORMAT: ${chosen.format}\nCLAIM THE PLAY LEANS ON: ${chosen.claim_used}\n\nSIGNAL CONTEXT: ${signal.summary}\n\nRecode this for market ${m}. Market rule: ${genome.markets[m]}.${pressure ? FORGE_PRESSURE : ""}`,
          fb,
        );
        const asset = { ...r.data, market: m, live: r.live };
        setOut((o) => ({ ...o, forge: { ...(o.forge || {}), [m]: asset } }));
        return { asset, tokens: r.tokens, live: r.live };
      }));
      stamp("FORGE", `${markets.length} markets recoded in parallel — ${markets.join(", ")}. Not translated: rewritten per market.`, "agent");
      const checks = {};
      results.forEach((r) => { checks[r.asset.market] = sanityCheck(r.asset, genome); });
      const failed = Object.values(checks).flat().filter((c) => !c.ok).length;
      const total = Object.values(checks).flat().length;
      setOut((o) => ({ ...o, sanity: checks, sanityFailed: failed, sanityTotal: total }));
      stamp("SANITY", failed
        ? `${failed} of ${total} deterministic checks failed. Flags attached, run passed to GUARDIAN for judgement.`
        : `${total} of ${total} deterministic checks passed before any model was asked to judge.`, failed ? "stop" : "agent");
      return {
        inspect: {
          system: FORGE_SYS + (pressure ? FORGE_PRESSURE : ""),
          user: `One call per market, issued in parallel: ${markets.join(", ")}.`,
          data: { assets: results.map((r) => r.asset), sanity_checks: checks },
          live: results.every((r) => r.live),
        },
        live: results.every((r) => r.live),
        tokens: results.reduce((a, r) => a + r.tokens, 0),
        assets: results.map((r) => r.asset),
      };
    }, { mins: isRegen ? 22 : 42 });

    const assets = forge.assets;

    const guard = await stage("GUARDIAN", () => runAgent(
      GUARDIAN_SYS,
      `${genomeBrief(genome)}\n\n---\n\nDETERMINISTIC PRE-FLIGHT FLAGS (string matching, not judgement — adjudicate them):\n${assets.map((a) =>
        `[${a.market}] ${sanityCheck(a, genome).filter((c) => !c.ok).map((c) => c.label + ": " + c.detail).join(" | ") || "no flags"}`
      ).join("\n")}\n\nASSETS SUBMITTED FOR CLEARANCE:\n${assets.map((a) =>
        `[${a.market}] headline: "${a.headline}" | caption: "${a.caption}" | claim declared: "${a.claim_used}" | visual: "${a.visual_direction}"`
      ).join("\n")}\n\nAudit every asset. Veto anything outside the approved claim set or across a red line.`,
      pressure ? FALLBACK.guardianBlocked : FALLBACK.guardianClear,
    ));
    const G = guard.data;
    setOut((o) => ({ ...o, guardian: { ...G, live: guard.live } }));

    const vetoed = (G.verdicts || []).filter((v) => v.status === "VETO");
    if (G.overall === "BLOCKED" || vetoed.length) {
      setStage("GUARDIAN", { status: "blocked", mins: 7, live: guard.live, tokens: guard.tokens });
      setStage("GATE 2", { status: "pending" });
      setPhase("blocked");
      vetoed.forEach((v) => stamp("GUARDIAN", `VETO [${v.market}] — ${v.rule}. ${v.reason}`, "veto"));
      stamp("SYSTEM", "Run held. Nothing can ship while a veto stands. GUARDIAN outranks the brand manager here.", "stop");
      const decision = await waitGate();
      check();
      if (decision === "abandon") {
        setPhase("standdown");
        stamp("HUMAN", "Run abandoned at the veto. No asset published.", "human");
        return;
      }
      setRegenCount((n) => n + 1);
      stamp("HUMAN", "Regenerate inside the approved claim set. One tap.", "human");
      setStage("FORGE", { status: "pending" });
      setStage("GUARDIAN", { status: "pending" });
      await forgeAndGuard(chosen, false, true);
      return;
    }

    stamp("GUARDIAN", `All ${(G.verdicts || []).length} markets cleared. ${G.note || ""}`, "agent");

    /* GATE 2 — tier decides whether a human taps again */
    const inEnvelope = ENVELOPE[signal.id];
    let autoShip = false;
    if (tier === "T2") autoShip = true;
    if (tier === "T3") {
      if (inEnvelope) autoShip = true;
      else stamp("SYSTEM", `T3 requested but ${signal.code} is outside the pre-cleared envelope — autonomy dropped to T1 for this run. Autonomy is earned per lane, not granted per brand.`, "stop");
    }

    if (autoShip) {
      setStage("GATE 2", { status: "done", mins: 0 });
      stamp("SYSTEM", `${tier} — assets cleared the envelope, published without a second human tap. Post-hoc review queued.`, "gate");
    } else {
      setStage("GATE 2", { status: "running" });
      setPhase("gate2");
      stamp("SYSTEM", "GATE 2 open — brand manager approves and ships.", "gate");
      await waitGate();
      check();
      setCampaign((c) => c + 18);
      setStage("GATE 2", { status: "done", mins: 18 });
      setPhase("running");
      stamp("HUMAN", "Approved and shipped. Second tap. Total human decisions this run: 2.", "human");
    }

    const scribe = await stage("SCRIBE", () => runAgent(
      SCRIBE_SYS,
      `${genomeBrief(genome)}\n\n---\n\nWHAT SHIPPED: play "${chosen.name}" — ${chosen.idea}\nMARKETS: ${assets.map((a) => a.market).join(", ")}\nGUARDIAN RECORD: ${G.note || "cleared"}${regenCount ? " (one regeneration after a veto)" : ""}\nSIGNAL: ${signal.title}\n\nWrite the learning back into the Genome.`,
      FALLBACK.scribe,
    ));
    const S = scribe.data;
    setOut((o) => ({ ...o, scribe: { ...S, live: scribe.live } }));
    setGenomeAdds(S.genome_updates || []);
    stamp("SCRIBE", `Genome ${genome.version} → ${genome.version.replace(/(\d+)$/, (m) => Number(m) + 1)}. ${S.learning}`, "agent");
    setPhase("shipped");
  };

  /* TRADER — the horizontal handoff. Same Genome, next product in the loop. */
  const handoffTrader = async () => {
    setNote("");
    stamp("SYSTEM", "Handing off to TRADER — same Genome, same decision trace, paid activation.", "info");
    setOut((o) => ({ ...o, traderLoading: true }));
    const r = await runAgent(
      TRADER_SYS,
      `${genomeBrief(genome)}\n\n---\n\nORGANIC RESULT: play "${play?.name}" live in ${Object.keys(out.forge || {}).join(", ")}.\nSIGNAL: ${signal.title} — ${signal.summary}\nWINDOW REMAINING: ${windowLeft.toFixed(1)}h\n\nAllocate reactive paid spend.`,
      FALLBACK.trader,
    );
    setOut((o) => ({ ...o, trader: { ...r.data, live: r.live }, traderLoading: false }));
    if (r.tokens) setTokens((t) => t + r.tokens);
    stamp("TRADER", `${r.data.total} allocated across ${(r.data.splits || []).length} markets. ${r.data.guardrail}`, "agent");
  };

  const exportTrace = () => {
    const doc = {
      run: signal.code, signal: signal.title, brand: genome.name, genome_version: genome.version,
      autonomy_tier: tier, stress_test: stress,
      console_time_s: Math.round(elapsed / 1000), modelled_signal_to_live_min: Math.round(campaign),
      human_decisions: [play ? "GATE 1 play selection" : null, phase === "shipped" && tier === "T1" ? "GATE 2 ship approval" : null].filter(Boolean),
      brand_fit: out.judge?.brand_fit, verdict: out.judge?.verdict,
      guardian: out.guardian, assets: out.forge, genome_writeback: out.scribe,
      trace: traceRef.current.map((r) => ({ actor: r.actor, event: r.text, kind: r.kind })),
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `REFLEX_decision_trace_${signal.code}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ---------------------------------------------------------------- VIEW -- */
  const J = out.judge, F = out.forge, G = out.guardian, S = out.scribe, T = out.trader;
  const marketOrder = Object.keys(genome.markets);
  const consumedPct = Math.min(100, (campaign / 60 / signal.windowLeft) * 100);
  const tierDef = TIERS.find((t) => t.id === tier);

  const kindColor = { agent: C.cyan, human: C.magenta, gate: C.magenta, veto: C.red, stop: C.amber, halt: C.amber, info: C.dim };

  return (
    <div className="rx" style={{ padding: 12 }}>
      <style>{CSS}</style>

      {/* ---------------------------------------------------------- HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 3, background: C.magenta, color: "#fff",
            display: "grid", placeItems: "center", fontWeight: 800, fontSize: 20, flex: "0 0 auto",
          }}>R</div>
          <div style={{ minWidth: 0 }}>
            <div className="rx-mono" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.17em" }}>REFLEX</div>
            <div className="rx-eyebrow" style={{ marginTop: 1 }}>Project NEXT · Unilever GDT · six agents, two human gates</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2, border: `1px solid ${C.line}`, borderRadius: 3, padding: 2 }}>
            {TIERS.map((t) => (
              <button key={t.id} onClick={() => !running && setTier(t.id)} disabled={running}
                className="rx-mono" title={t.rule}
                style={{
                  fontSize: 12, letterSpacing: "0.08em", padding: "6px 9px", borderRadius: 2, cursor: running ? "not-allowed" : "pointer",
                  border: "none", background: tier === t.id ? C.magenta : "transparent",
                  color: tier === t.id ? "#fff" : C.dim, fontWeight: tier === t.id ? 700 : 400,
                }}>{t.id}</button>
            ))}
          </div>

          <button onClick={() => setKeyOpen(!keyOpen)} className="rx-btn"
            title="Only needed when running this file outside a Claude artifact"
            style={{ borderColor: keySet ? C.green : C.line2, color: keySet ? C.green : C.mid }}>
            {keySet ? "◆ model connected" : "◇ connect model"}
          </button>

          <button onClick={() => !running && setStress(!stress)} disabled={running} className="rx-btn"
            style={{ borderColor: stress ? C.amber : C.line2, color: stress ? C.amber : C.mid, background: stress ? C.amberDim : C.panel2 }}>
            {stress ? "◉" : "○"} stress test
          </button>

          {!running && phase !== "shipped" && phase !== "standdown" && phase !== "observed" && phase !== "halted" && (
            <button onClick={run} className="rx-btn rx-btn-go">▶ run signal</button>
          )}
          {running && <button onClick={halt} className="rx-btn" style={{ borderColor: C.red, color: C.red }}>■ halt run</button>}
          {phase !== "idle" && <button onClick={reset} className="rx-btn">↺ reset</button>}
        </div>
      </div>

      {keyOpen && (
        <div className="rx-panel" style={{ padding: 12, marginBottom: 10 }}>
          <div className="rx-eyebrow" style={{ marginBottom: 6 }}>Model endpoint</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="password" value={keyVal} placeholder="sk-ant-…"
              onChange={(e) => setKeyVal(e.target.value)}
              className="rx-mono"
              style={{
                flex: "1 1 260px", minWidth: 0, fontSize: 14.5, padding: "9px 10px", borderRadius: 3,
                background: C.ink, border: `1px solid ${C.line2}`, color: C.text,
              }} />
            <button className="rx-btn rx-btn-go" onClick={() => { setApiKey(keyVal); setKeySet(!!keyVal.trim()); setKeyOpen(false); }}>
              use this key
            </button>
            {keySet && <button className="rx-btn" onClick={() => { setApiKey(null); setKeySet(false); setKeyVal(""); }}>disconnect</button>}
          </div>
          <div style={{ fontSize: 13.5, color: C.mid, marginTop: 8, maxWidth: 720 }}>
            Only needed when this file is opened locally. Inside a Claude artifact the endpoint is already authenticated — leave this empty.
            The key is held in memory for this session, never written to disk or storage, and is sent only to <span className="rx-mono">api.anthropic.com</span>.
            With no key the console runs the cached demo end to end and labels every stage <span style={{ color: C.amber }}>cached run</span>.
          </div>
        </div>
      )}

      {/* ------------------------------------------------- SIGNATURE: CLOCK */}
      <div className="rx-panel" style={{ padding: "11px 14px", marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 9 }}>
          <Stat label="Moment window left" value={`${Math.floor(windowLeft)}h ${String(Math.round((windowLeft % 1) * 60)).padStart(2, "0")}m`}
            sub={`half-life ${signal.halfLife}h · ${signal.code}`} color={windowLeft < 4 ? C.red : C.cyan} />
          <Stat label="Modelled signal → live" value={fmtCampaign(campaign)}
            sub={`baseline 3–6 weeks · target under 04h`} color={campaign > 240 ? C.amber : C.magenta} />
          <Stat label="Console time" value={fmtClock(elapsed)} sub={`${tokens ? tokens.toLocaleString() + " tokens" : "—"} · est. $${(0.9 + tokens * 0.000012).toFixed(2)}`} color={C.text} big={27} />
          <Stat label="Human decisions" value={`${(stages["GATE 1"]?.status === "done" ? 1 : 0) + (stages["GATE 2"]?.status === "done" && tier === "T1" ? 1 : 0)}`} sub={tierDef.label.toLowerCase()} color={C.text} big={27} />
        </div>
        <div style={{ position: "relative", height: 9, background: C.cyanDim, border: `1px solid ${C.line}`, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, width: `${consumedPct}%`, background: C.magenta, transition: "width .5s ease" }} />
          <div style={{ position: "absolute", left: `${Math.min(100, (4 / signal.windowLeft) * 100)}%`, top: -2, bottom: -2, width: 1, background: C.amber }} />
        </div>
        <div className="rx-mono" style={{ position: "relative", fontSize: 10.5, color: C.dim, marginTop: 4, height: 12 }}>
          <span style={{ position: "absolute", left: 0 }}>SIGNAL DETECTED {signal.detected.toUpperCase()}</span>
          <span className="rx-target-mark" style={{ position: "absolute", left: `${Math.min(70, (4 / signal.windowLeft) * 100)}%`, color: C.amber, whiteSpace: "nowrap" }}>◂ 4H TARGET</span>
          <span style={{ position: "absolute", right: 0 }}>WINDOW CLOSES — THE MOMENT IS OVER</span>
        </div>
      </div>

      <div className="rx-grid">

        {/* ------------------------------------------------------ LEFT RAIL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <Panel title="Signal fabric" right={<Chip color={C.cyan}>{SIGNALS.length} live</Chip>} pad={8}>
            {SIGNALS.map((s) => {
              const on = s.id === signalId;
              return (
                <button key={s.id} onClick={() => setSignalId(s.id)} disabled={running} className="rx-sig"
                  style={{
                    display: "block", width: "100%", textAlign: "left", cursor: running ? "not-allowed" : "pointer",
                    background: on ? C.panel2 : "transparent", border: `1px solid ${on ? C.magenta : C.line}`,
                    borderRadius: 3, padding: 9, marginBottom: 7, color: "inherit", font: "inherit",
                    opacity: running && !on ? 0.4 : 1,
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>
                    <span className="rx-mono" style={{ fontSize: 11, color: on ? C.magenta : C.dim, letterSpacing: "0.1em" }}>{s.code}</span>
                    <Chip color={GENOMES[s.brand].accent}>{GENOMES[s.brand].name}</Chip>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, margin: "3px 0 2px" }}>{s.title}</div>
                  <div className="rx-mono" style={{ fontSize: 10.5, color: C.dim, letterSpacing: "0.06em" }}>{s.tag}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 7, alignItems: "center" }}>
                    <div style={{ flex: 1, height: 3, background: C.raise, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${s.heat}%`, height: "100%", background: s.heat > 85 ? C.magenta : C.cyan }} />
                    </div>
                    <span className="rx-mono" style={{ fontSize: 10.5, color: C.dim }}>{s.windowLeft}h left</span>
                  </div>
                </button>
              );
            })}
          </Panel>

          <Panel title="Human control plane" pad={10}>
            <div className="rx-mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: C.magenta, marginBottom: 4 }}>
              {tier} — {tierDef.label}
            </div>
            <div style={{ fontSize: 14, color: C.mid, marginBottom: 10 }}>{tierDef.rule}</div>
            <Field k="Dial" v={<span className="rx-mono">{tier} of T0–T3 · earned per lane</span>} />
            <Field k="Queue" v={<span className="rx-mono">{phase === "gate1" || phase === "gate2" ? "1 awaiting tap" : phase === "blocked" ? "1 held at veto" : "clear"}</span>}
              color={phase === "blocked" ? C.red : C.text} />
            <Field k="Trace" v={<span className="rx-mono">{trace.length} events recorded</span>} />
            <Field k="Kill" v={<span className="rx-mono" style={{ color: running ? C.green : C.dim }}>{running ? "armed" : "idle"}</span>} />
            {stress && (
              <div style={{ marginTop: 10, padding: 8, background: C.amberDim, border: `1px solid rgba(242,169,59,0.4)`, borderRadius: 3 }}>
                <div className="rx-mono" style={{ fontSize: 11, color: C.amber, letterSpacing: "0.1em", marginBottom: 3 }}>STRESS TEST ARMED</div>
                <div style={{ fontSize: 13.5, color: C.mid }}>FORGE is told to lead with the strongest efficacy statement it can write. GUARDIAN has not been told anything. Watch what it catches.</div>
              </div>
            )}
          </Panel>
        </div>

        {/* ---------------------------------------------------------- CENTRE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

          <div className="rx-panel" style={{ padding: "12px 12px 10px" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {STAGES.map((st) => (
                <StageNode key={st.id} s={st} state={stages[st.id]} active={stages[st.id]?.status === "running"}
                  openable={!!inspect[st.id]} open={inspectId === st.id}
                  onClick={() => setInspectId(inspectId === st.id ? null : st.id)} />
              ))}
            </div>
            <div className="rx-mono" style={{ fontSize: 11, color: C.dim, marginTop: 8, textAlign: "center" }}>
              CLICK ANY COMPLETED AGENT TO READ THE EXACT PROMPT IT WAS GIVEN AND THE RAW JSON IT RETURNED
            </div>
          </div>

          {inspectId && inspect[inspectId] && (
            <Panel title={`Inspector — ${inspectId}`} right={<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Provenance live={inspect[inspectId].live} tokens={stages[inspectId]?.tokens} />
              <button className="rx-btn" onClick={() => setInspectId(null)} style={{ padding: "4px 9px" }}>close</button>
            </div>} style={{ borderColor: C.cyan }}>
              <div className="rx-eyebrow" style={{ color: C.cyan, marginBottom: 5 }}>system prompt as issued</div>
              <pre className="rx-mono rx-scroll" style={{
                margin: 0, maxHeight: 190, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: C.ink, border: `1px solid ${C.line}`, borderRadius: 3, padding: 10, color: C.mid, fontSize: 13.5,
              }}>{inspect[inspectId].system}</pre>
              <div className="rx-eyebrow" style={{ color: C.cyan, margin: "10px 0 5px" }}>input</div>
              <pre className="rx-mono rx-scroll" style={{
                margin: 0, maxHeight: 130, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: C.ink, border: `1px solid ${C.line}`, borderRadius: 3, padding: 10, color: C.mid, fontSize: 13.5,
              }}>{inspect[inspectId].user}</pre>
              <div className="rx-eyebrow" style={{ color: C.green, margin: "10px 0 5px" }}>returned payload</div>
              <pre className="rx-mono rx-scroll" style={{
                margin: 0, maxHeight: 230, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: C.ink, border: `1px solid ${C.line}`, borderRadius: 3, padding: 10, color: C.text, fontSize: 13.5,
              }}>{JSON.stringify(inspect[inspectId].data, null, 2)}</pre>
            </Panel>
          )}

          <div className="rx-scroll" style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

            {phase === "idle" && !J && (
              <Panel pad={0} style={{ padding: 26 }}>
                <div className="rx-eyebrow" style={{ color: C.magenta }}>Console ready</div>
                <div style={{ fontSize: 23, fontWeight: 600, margin: "8px 0 10px", maxWidth: 620, lineHeight: 1.3 }}>
                  Pick a signal, set the autonomy tier, run it. JUDGE, FORGE, GUARDIAN, SCRIBE and TRADER are live model calls made now — nothing below is a recording.
                </div>
                <div style={{ fontSize: 14.5, color: C.mid, maxWidth: 620 }}>
                  {signal.summary}
                </div>
                <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}>
                  {signal.hazards.map((h) => <Chip key={h} color={C.amber} bg={C.amberDim} border="rgba(242,169,59,0.4)">⚑ {h}</Chip>)}
                </div>
                {note && <div style={{ marginTop: 12, fontSize: 13.5, color: C.amber }}>{note}</div>}
              </Panel>
            )}

            {stages.SCOUT?.status && stages.SCOUT.status !== "pending" && (
              <Panel title="1 · SCOUT — signal ingestion" right={<Chip color={C.dim}>simulated</Chip>}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
                  {signal.evidence.map((e) => (
                    <div key={e.s} style={{ border: `1px solid ${C.line}`, borderRadius: 3, padding: 8 }}>
                      <div className="rx-eyebrow">{e.s}</div>
                      <div className="rx-mono" style={{ fontSize: 16, marginTop: 3 }}>{e.n}</div>
                      <div className="rx-mono" style={{ fontSize: 11, color: C.cyan, marginTop: 2 }}>{e.d}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {stages.AUGUR?.status && stages.AUGUR.status !== "pending" && (
              <Panel title="2 · AUGUR — window forecast" right={<Chip color={C.dim}>simulated</Chip>}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <svg viewBox="0 0 240 60" style={{ width: 240, height: 60, flex: "0 0 auto" }} aria-label="decay curve">
                    <path d={`M0,${58 - 0} ${Array.from({ length: 40 }, (_, i) => {
                      const x = (i / 39) * 240;
                      const y = 58 - 54 * Math.pow(0.5, (i / 39) * (signal.halfLife / 12));
                      return `L${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(" ")}`} fill="none" stroke={C.cyan} strokeWidth="1.6" />
                    <line x1={(1 - signal.windowLeft / signal.halfLife) * 240} y1="0" x2={(1 - signal.windowLeft / signal.halfLife) * 240} y2="60" stroke={C.magenta} strokeWidth="1" strokeDasharray="3 3" />
                  </svg>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Field k="Half-life" v={`${signal.halfLife} hours`} />
                    <Field k="Remaining" v={`${signal.windowLeft} hours of usable window`} />
                    <Field k="Sentiment" v={signal.sentiment} color={signal.sentiment.startsWith("−") ? C.red : C.green} />
                    <Field k="Verdict" v={signal.halfLife <= 40 ? "Steep decay — act inside 4 hours or do not act" : "Shallow decay — a considered entry still lands, but it still beats three weeks"} />
                  </div>
                </div>
              </Panel>
            )}

            {J && (
              <Panel title="3 · JUDGE — brand fit and plays" right={<Provenance live={J.live} tokens={stages.JUDGE?.tokens} />}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                    <div className="rx-mono" style={{
                      fontSize: 49, fontWeight: 700, lineHeight: 1,
                      color: J.brand_fit >= 70 ? C.green : J.brand_fit >= 40 ? C.amber : C.red,
                    }}>{J.brand_fit}</div>
                    <div className="rx-eyebrow" style={{ marginTop: 2 }}>brand fit / 100</div>
                    <div style={{ marginTop: 7 }}>
                      <Chip color={J.verdict === "ACT" ? C.green : C.red} bg={J.verdict === "ACT" ? C.greenDim : C.redDim}
                        border={J.verdict === "ACT" ? "rgba(0,178,106,.4)" : "rgba(255,77,99,.4)"}>{J.verdict}</Chip>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: 18.5, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>{J.headline_read}</div>
                    <div style={{ fontSize: 14.5, color: C.mid, marginBottom: 9 }}>{J.rationale}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(J.risks || []).map((r, i) => <Chip key={i} color={C.amber} bg={C.amberDim} border="rgba(242,169,59,.35)" mono={false} style={{ textTransform: "none", fontSize: 13, letterSpacing: 0 }}>⚑ {r}</Chip>)}
                    </div>
                  </div>
                </div>

                {phase === "standdown" && (!J.plays || !J.plays.length) && (
                  <div style={{ marginTop: 14, padding: 14, background: C.redDim, border: `1px solid rgba(255,77,99,.4)`, borderRadius: 3 }}>
                    <div className="rx-mono" style={{ fontSize: 12, letterSpacing: "0.14em", color: C.red, marginBottom: 5 }}>ZERO PLAYS DRAFTED · RUN CLOSED</div>
                    <div style={{ fontSize: 16, lineHeight: 1.5 }}>
                      JUDGE was given a genuine commercial signal and returned nothing. No asset was generated, no budget was spent, no human was asked to review a bad idea. The most valuable thing this system does is decline.
                    </div>
                  </div>
                )}

                {J.plays && J.plays.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className="rx-eyebrow" style={{ color: phase === "gate1" ? C.magenta : C.dim, marginBottom: 7 }}>
                      {phase === "gate1" ? "◉ Gate 1 — brand manager picks one. One tap." : "Gate 1 · play selected"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8 }}>
                      {J.plays.map((p, i) => {
                        const chosen = play?.name === p.name;
                        const dim = play && !chosen;
                        return (
                          <div key={i} style={{
                            border: `1px solid ${chosen ? C.magenta : C.line}`, borderRadius: 3, padding: 10,
                            background: chosen ? C.magentaDim : "transparent", opacity: dim ? 0.35 : 1,
                            display: "flex", flexDirection: "column", gap: 6,
                          }}>
                            <div className="rx-mono" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "0.08em", color: chosen ? C.magenta : C.text }}>{p.name}</div>
                            <div style={{ fontSize: 14, color: C.mid, flex: 1 }}>{p.idea}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <Chip color={C.cyan}>{p.format}</Chip>
                              <Chip color={C.dim}>claim: {p.claim_used}</Chip>
                              <Chip color={C.dim}>{p.speed}</Chip>
                            </div>
                            {phase === "gate1" && (
                              <button className="rx-btn rx-btn-go" onClick={() => passGate(p)} style={{ marginTop: 2 }}>select play</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {phase === "gate1" && (
                      <button className="rx-btn" onClick={() => { setPhase("standdown"); passGate(null); stamp("HUMAN", "Brand manager stood the run down at Gate 1.", "human"); }}
                        style={{ marginTop: 8, borderColor: C.line2, color: C.dim }}>none of these — stand down</button>
                    )}
                  </div>
                )}
              </Panel>
            )}

            {F && Object.keys(F).length > 0 && (
              <Panel title={`4 · FORGE — ${Object.keys(F).length} of ${marketOrder.length} markets recoded`}
                right={<Provenance live={stages.FORGE?.live} tokens={stages.FORGE?.tokens} />}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 9 }}>
                  {marketOrder.map((m) => {
                    const a = F[m];
                    const v = (G?.verdicts || []).find((x) => x.market === m);
                    const vetoed = v?.status === "VETO";
                    if (!a) return (
                      <div key={m} style={{ border: `1px dashed ${C.line}`, borderRadius: 3, padding: 10, minHeight: 150, display: "grid", placeItems: "center" }}>
                        <span className="rx-mono rx-live" style={{ fontSize: 12, color: C.cyan }}>generating {m}…</span>
                      </div>
                    );
                    return (
                      <div key={m} style={{ border: `1px solid ${vetoed ? C.red : v ? C.green : C.line}`, borderRadius: 3, overflow: "hidden" }}>
                        {/* generated asset preview — layout is rendered, imagery is simulated */}
                        <div style={{ position: "relative", background: signal.brand === "dove" ? "#F2E9DC" : C.navy, padding: "16px 12px", minHeight: 96 }}>
                          <div style={{
                            fontSize: 20, fontWeight: 800, lineHeight: 1.14, letterSpacing: "-0.01em",
                            color: signal.brand === "dove" ? "#1A1A1A" : "#fff",
                          }}>{a.headline}</div>
                          <div className="rx-mono" style={{
                            position: "absolute", right: 10, bottom: 8, fontSize: 11, letterSpacing: "0.16em",
                            color: signal.brand === "dove" ? "#1A1A1A" : "rgba(255,255,255,.85)", fontWeight: 700,
                          }}>{genome.name}</div>
                          {signal.id === "referee" && (
                            <div className="rx-mono" style={{
                              position: "absolute", left: 10, bottom: 8, background: "#111", color: "#F5C400",
                              fontSize: 13.5, fontWeight: 700, padding: "2px 7px", borderRadius: 2, letterSpacing: "0.05em",
                            }}>+6</div>
                          )}
                        </div>
                        <div style={{ padding: 9 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <Chip color={C.text} bg={C.raise}>{m}</Chip>
                            {v && <Chip color={vetoed ? C.red : C.green} bg={vetoed ? C.redDim : C.greenDim} border={vetoed ? "rgba(255,77,99,.4)" : "rgba(0,178,106,.4)"}>{vetoed ? "✕ veto" : "✓ cleared"}</Chip>}
                          </div>
                          <div style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>{a.caption}</div>
                          <div className="rx-mono" style={{ fontSize: 11.5, color: C.cyan, marginBottom: 6 }}>{(a.hashtags || []).join(" ")}</div>
                          <Field k="Claim" v={a.claim_used} color={vetoed ? C.red : C.text} />
                          <Field k="Visual" v={a.visual_direction} />
                          <Field k="Recode" v={a.localisation_note} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {out.sanity && (
                  <div style={{ marginTop: 10, border: `1px solid ${out.sanityFailed ? "rgba(242,169,59,.45)" : C.line}`, borderRadius: 3, padding: 10, background: out.sanityFailed ? C.amberDim : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className="rx-eyebrow" style={{ color: out.sanityFailed ? C.amber : C.green }}>
                        Sanity check — deterministic pre-flight, no model involved
                      </span>
                      <Chip color={out.sanityFailed ? C.amber : C.green} bg={out.sanityFailed ? C.amberDim : C.greenDim}
                        border={out.sanityFailed ? "rgba(242,169,59,.4)" : "rgba(0,178,106,.4)"}>
                        {out.sanityTotal - out.sanityFailed} of {out.sanityTotal} passed
                      </Chip>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 9 }}>
                      {marketOrder.map((m) => (
                        <div key={m}>
                          <Chip color={C.text} bg={C.raise} style={{ marginBottom: 5 }}>{m}</Chip>
                          {(out.sanity[m] || []).map((c, i) => (
                            <div key={i} title={c.detail} style={{ display: "flex", gap: 6, alignItems: "baseline", padding: "2px 0" }}>
                              <span className="rx-mono" style={{ fontSize: 12, color: c.ok ? C.green : C.amber, flex: "0 0 10px" }}>{c.ok ? "✓" : "✕"}</span>
                              <span style={{ fontSize: 13.5, color: c.ok ? C.dim : C.text, flex: 1, minWidth: 0 }}>
                                {c.label}
                                {!c.ok && <span style={{ color: C.amber, display: "block", fontSize: 13 }}>{c.detail}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 13.5, color: C.mid, marginTop: 9 }}>
                      String matching and schema validation run first, in code, on every asset. They cost nothing and they cannot reason — so what they flag is passed to GUARDIAN to adjudicate rather than blocked outright. Cheap checks in front of expensive judgement.
                    </div>
                  </div>
                )}
                <div className="rx-mono" style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
                  COPY AND DIRECTION ARE MODEL-GENERATED IN THIS RUN · IMAGE RENDERING IS SIMULATED — PRODUCTION ROUTES TO ADOBE FIREFLY (INDEMNIFIED) AND EXISTING OMNIVERSE PRODUCT TWINS, C2PA-SIGNED
                </div>
              </Panel>
            )}

            {G && (
              <Panel title="5 · GUARDIAN — claims, rights, red lines"
                right={<div style={{ display: "flex", gap: 6 }}>
                  <Chip color={G.overall === "CLEAR" ? C.green : C.red} bg={G.overall === "CLEAR" ? C.greenDim : C.redDim}
                    border={G.overall === "CLEAR" ? "rgba(0,178,106,.4)" : "rgba(255,77,99,.4)"}>{G.overall}</Chip>
                  <Provenance live={G.live} tokens={stages.GUARDIAN?.tokens} />
                </div>}>
                {(G.verdicts || []).map((v, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, padding: "9px 0",
                    borderBottom: i < (G.verdicts.length - 1) ? `1px solid ${C.line}` : "none",
                  }}>
                    <div style={{ flex: "0 0 46px" }}>
                      <Chip color={v.status === "VETO" ? C.red : C.green} bg={v.status === "VETO" ? C.redDim : C.greenDim}
                        border={v.status === "VETO" ? "rgba(255,77,99,.4)" : "rgba(0,178,106,.4)"}>{v.market}</Chip>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="rx-mono" style={{ fontSize: 12, letterSpacing: "0.09em", color: v.status === "VETO" ? C.red : C.green, marginBottom: 3 }}>
                        {v.status === "VETO" ? `VETO — ${v.rule}` : "CLEARED"}
                      </div>
                      <div style={{ fontSize: 14, color: C.text }}>{v.reason}</div>
                      {v.status === "VETO" && v.remedy !== "—" && (
                        <div style={{ fontSize: 13.5, color: C.amber, marginTop: 3 }}>→ {v.remedy}</div>
                      )}
                    </div>
                  </div>
                ))}
                {G.note && <div className="rx-mono" style={{ fontSize: 11.5, color: C.dim, marginTop: 9 }}>AUDIT NOTE — {G.note}</div>}

                {phase === "blocked" && (
                  <div style={{ marginTop: 12, padding: 12, background: C.redDim, border: `1px solid rgba(255,77,99,.45)`, borderRadius: 3 }}>
                    <div className="rx-mono" style={{ fontSize: 12, letterSpacing: "0.14em", color: C.red, marginBottom: 6 }}>RUN HELD — GUARDIAN OUTRANKS THE BRAND MANAGER HERE</div>
                    <div style={{ fontSize: 14.5, color: C.text, marginBottom: 10 }}>
                      Nothing ships while a veto stands. There is no override in the interface — the only routes forward are to regenerate inside the approved claim set, or to walk away.
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="rx-btn rx-btn-go" onClick={() => passGate("regen")}>↻ regenerate inside approved claims</button>
                      <button className="rx-btn" onClick={() => passGate("abandon")}>abandon run</button>
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {phase === "gate2" && (
              <Panel title="Gate 2 — brand manager approves and ships" style={{ borderColor: C.magenta }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>
                      {marketOrder.length} markets cleared. {regenCount ? "One regeneration on the record. " : ""}Modelled time to here: {fmtCampaign(campaign)}.
                    </div>
                    <div style={{ fontSize: 14, color: C.mid }}>
                      This is the second and last human decision in the run. Everything above it is on the trace, attributable and replayable.
                    </div>
                  </div>
                  <button className="rx-btn rx-btn-ok" onClick={() => passGate("ship")} style={{ fontSize: 16, padding: "13px 22px" }}>✓ approve and ship</button>
                </div>
              </Panel>
            )}

            {S && (
              <Panel title="6 · SCRIBE — genome writeback" right={<Provenance live={S.live} tokens={stages.SCRIBE?.tokens} />}>
                <div style={{ fontSize: 16.5, fontWeight: 600, marginBottom: 9, lineHeight: 1.4 }}>{S.learning}</div>
                <Field k="New prior" v={<span><b>{S.prior?.k}</b> → <span className="rx-mono" style={{ color: C.green }}>{S.prior?.v}</span></span>} />
                <Field k="Next watch" v={S.next_watch} />
                <div className="rx-eyebrow" style={{ marginTop: 10, marginBottom: 5 }}>written into the genome</div>
                {(S.genome_updates || []).map((u, i) => (
                  <div key={i} className="rx-mono" style={{ fontSize: 13, color: C.green, padding: "3px 0" }}>+ {u}</div>
                ))}
              </Panel>
            )}

            {phase === "shipped" && (
              <Panel style={{ borderColor: C.green }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 230 }}>
                    <div className="rx-eyebrow" style={{ color: C.green }}>Loop closed</div>
                    <div style={{ fontSize: 20, fontWeight: 600, margin: "5px 0 4px" }}>
                      Live in {fmtCampaign(campaign)} against a 3–6 week baseline, with {windowLeft.toFixed(1)}h of window still open.
                    </div>
                    <div style={{ fontSize: 14, color: C.mid }}>
                      Two human decisions. One veto {regenCount ? "raised and cleared" : "not needed"}. Console ran it in {fmtClock(elapsed)}.
                      LEARN and INNOVATE now feed the next SENSE cycle.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {!T && !out.traderLoading && <button className="rx-btn rx-btn-go" onClick={handoffTrader}>→ hand off to TRADER</button>}
                    {out.traderLoading && <Chip color={C.cyan}><span className="rx-live">TRADER working…</span></Chip>}
                    <button className="rx-btn" onClick={exportTrace}>↓ export decision trace</button>
                  </div>
                </div>
              </Panel>
            )}

            {T && (
              <Panel title="TRADER — reactive paid activation" right={<div style={{ display: "flex", gap: 6 }}>
                <Chip color={C.magenta} bg={C.magentaDim} border="rgba(214,0,110,.4)">horizontal handoff</Chip>
                <Provenance live={T.live} />
              </div>}>
                <div className="rx-mono" style={{ fontSize: 27, fontWeight: 700, color: C.magenta, marginBottom: 10 }}>{T.total}</div>
                {(T.splits || []).map((s, i) => (
                  <div key={i} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 3 }}>
                      <span><b className="rx-mono">{s.market}</b> · {s.channel}</span>
                      <span className="rx-mono" style={{ color: C.magenta }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: 5, background: C.raise, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${s.pct}%`, height: "100%", background: C.magenta }} />
                    </div>
                    <div style={{ fontSize: 13, color: C.dim, marginTop: 3 }}>{s.rationale}</div>
                  </div>
                ))}
                <Field k="Guardrail" v={T.guardrail} />
                <Field k="Stop rule" v={T.stop_rule} color={C.amber} />
              </Panel>
            )}

            {(phase === "standdown" || phase === "observed" || phase === "halted") && (
              <Panel style={{ borderColor: phase === "halted" ? C.amber : C.line }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div className="rx-eyebrow" style={{ color: phase === "halted" ? C.amber : C.mid }}>
                      {phase === "halted" ? "Run frozen at the kill switch" : phase === "observed" ? "T0 — observe and recommend only" : "Run closed without publishing"}
                    </div>
                    <div style={{ fontSize: 16, marginTop: 5, color: C.text }}>
                      {phase === "halted" && "Every completed step stays on the trace. Nothing partial was published."}
                      {phase === "observed" && "Three plays are filed to the brand manager's queue with the reasoning attached. At T0 the system never generates — it only argues."}
                      {phase === "standdown" && "The trace records the decline and the reasoning, so the next identical signal is decided in seconds rather than debated again."}
                    </div>
                  </div>
                  <button className="rx-btn" onClick={exportTrace}>↓ export decision trace</button>
                </div>
              </Panel>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------- RIGHT RAIL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <Panel title="Brand genome" right={<Chip color={genome.accent}>{genome.name} {genome.version}</Chip>} pad={10}
            style={{ maxHeight: 540 }}>
            <div style={{ fontSize: 15, fontStyle: "italic", color: C.text, marginBottom: 9 }}>"{genome.promise}"</div>

            <div className="rx-eyebrow" style={{ color: C.cyan }}>brand codes</div>
            {genome.codes.map((c, i) => <div key={i} style={{ fontSize: 13.5, color: C.mid, padding: "2px 0" }}>· {c}</div>)}

            <div className="rx-eyebrow" style={{ color: C.green, marginTop: 10 }}>approved claims — the only ones usable</div>
            {genome.claims.map((c, i) => <div key={i} className="rx-mono" style={{ fontSize: 13, color: C.green, padding: "2px 0" }}>✓ {c}</div>)}

            <div className="rx-eyebrow" style={{ color: C.red, marginTop: 10 }}>prohibited claims</div>
            {genome.prohibited.map((c, i) => <div key={i} className="rx-mono" style={{ fontSize: 13, color: C.red, padding: "2px 0" }}>✕ {c}</div>)}

            <div className="rx-eyebrow" style={{ color: C.red, marginTop: 10 }}>red lines</div>
            {genome.redlines.map((c, i) => <div key={i} style={{ fontSize: 13, color: C.mid, padding: "2px 0" }}>— {c}</div>)}

            <div className="rx-eyebrow" style={{ color: C.amber, marginTop: 10 }}>rights graph</div>
            {Object.entries(genome.rights).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
                <span style={{ fontSize: 13, color: C.mid }}>{k}</span>
                <span className="rx-mono" style={{ fontSize: 11, color: v.includes("CLEARED") && !v.includes("NOT") ? C.green : C.amber, whiteSpace: "nowrap" }}>{v}</span>
              </div>
            ))}

            <div className="rx-eyebrow" style={{ color: C.cyan, marginTop: 10 }}>market regulation</div>
            {Object.entries(genome.markets).map(([k, v]) => (
              <div key={k} style={{ fontSize: 13, color: C.mid, padding: "2px 0" }}><b className="rx-mono" style={{ color: C.text }}>{k}</b> — {v}</div>
            ))}

            <div className="rx-eyebrow" style={{ marginTop: 10 }}>performance priors</div>
            {genome.priors.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
                <span style={{ fontSize: 13, color: C.mid }}>{p.k}</span>
                <span className="rx-mono" style={{ fontSize: 11.5, color: C.text, whiteSpace: "nowrap" }}>{p.v}</span>
              </div>
            ))}
            {genomeAdds.map((u, i) => (
              <div key={"add" + i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "3px 0", background: C.greenDim, marginTop: 3, borderRadius: 2 }}>
                <span style={{ fontSize: 13, color: C.green, padding: "0 4px" }}>{u}</span>
                <Chip color={C.green}>new</Chip>
              </div>
            ))}
          </Panel>

          <Panel title="Decision trace" right={<Chip color={C.dim}>{trace.length} events</Chip>} pad={10} style={{ maxHeight: 400 }}>
            {trace.length === 0 && <div style={{ fontSize: 13.5, color: C.dim }}>Nothing has happened yet. Every agent call, every human tap and every veto lands here with an actor and a timestamp — this is what makes the run auditable.</div>}
            {trace.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
                <span className="rx-mono" style={{ fontSize: 10.5, color: C.dim, flex: "0 0 34px" }}>{fmtClock(t.at - (traceRef.current[0]?.at || t.at))}</span>
                <span className="rx-mono" style={{ fontSize: 10.5, color: kindColor[t.kind] || C.dim, flex: "0 0 58px", letterSpacing: "0.06em" }}>{t.actor}</span>
                <span style={{ fontSize: 13, color: t.kind === "veto" || t.kind === "stop" ? C.text : C.mid, flex: 1, minWidth: 0 }}>{t.text}</span>
              </div>
            ))}
            <div ref={traceEndRef} />
          </Panel>
        </div>
      </div>

      {/* ---------------------------------------------------------- FOOTER */}
      <div style={{ marginTop: 10, display: "flex", gap: 14, justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div className="rx-mono" style={{ fontSize: 10.5, color: C.dim, maxWidth: 780, lineHeight: 1.7, letterSpacing: "0.04em" }}>
          PROJECT NEXT · REFLEX CONSOLE — TECHTONIC SEASON 8 PROTOTYPE. JUDGE, FORGE, GUARDIAN, SCRIBE AND TRADER ARE LIVE MODEL CALLS MADE DURING THE RUN; VETOES ARE GENERATED, NOT SCRIPTED. SCOUT INGESTION, AUGUR FORECASTING AND IMAGE RENDERING ARE SIMULATED. SIGNALS, GENOMES AND FIGURES ARE ILLUSTRATIVE AND BUILT FOR THIS DEMONSTRATION. IF THE MODEL ENDPOINT IS UNREACHABLE THE CONSOLE FALLS BACK TO A CACHED RUN AND LABELS EVERY STAGE ACCORDINGLY.
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Stat label="Baseline" value="3–6 wks" sub="conventional cycle" color={C.dim} big={18} />
          <Stat label="This run" value={campaign ? fmtCampaign(campaign) : "—"} sub="modelled" color={C.magenta} big={18} />
          <Stat label="Target" value="< 04h" sub="north star" color={C.cyan} big={18} />
        </div>
      </div>
    </div>
  );
}
