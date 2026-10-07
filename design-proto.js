/* html-design-proto — https://github.com/snowpact/html-design-proto
   A clickable, single-file presentation that replays real app screens to settle a product decision.
   Everything renders from one declarative call: DesignProto.init({ title, lots, scenarios }). */
(function (global) {
  "use strict";

  const LABELS = {
    fr: { prev: "Précédent", next: "Suivant", step: (i, n) => `étape ${i} sur ${n}`, now: "Actuel", new: "Nouveau", lot: (id) => `Lot ${id}`, later: "Plus tard", pros: "Pour", cons: "Contre", proto: "PROTOTYPE" },
    en: { prev: "Previous", next: "Next", step: (i, n) => `step ${i} of ${n}`, now: "Current", new: "New", lot: (id) => `Batch ${id}`, later: "Later", pros: "Pros", cons: "Cons", proto: "PROTOTYPE" },
  };

  // Lot colours: 1 green, 2 orange, 3 violet, "later" grey, "other" indigo. A lot may override with { color: {...} }.
  const LOT_COLORS = {
    1: { line: "#22c55e", bg: "#dcfce7", ink: "#047857", border: "#86efac", outline: "#16a34a" },
    2: { line: "#fb923c", bg: "#ffedd5", ink: "#c2410c", border: "#fdba74", outline: "#f97316" },
    3: { line: "#a78bfa", bg: "#ede9fe", ink: "#6d28d9", border: "#c4b5fd", outline: "#8b5cf6" },
    4: { line: "#38bdf8", bg: "#e0f2fe", ink: "#0369a1", border: "#7dd3fc", outline: "#0284c7" },
    later: { line: "#9ca3af", bg: "#e5e7eb", ink: "#4b5563", border: "#d1d5db", outline: "#9ca3af" },
    other: { line: "#818cf8", bg: "#e0e7ff", ink: "#3730a3", border: "#a5b4fc", outline: "#6366f1" },
  };

  const ICONS = {
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
  };

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (name, size = 16) => `<svg class="dp-i" viewBox="0 0 24 24" style="width:${size}px;height:${size}px">${ICONS[name] || ""}</svg>`;
  const html = (v) => (typeof v === "function" ? v() : v ?? "");
  const initials = (n) => String(n).split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  let config = null;
  const ui = { sc: 0, step: 0 };
  const L = () => Object.assign({}, LABELS[(config && config.lang) || "en"] || LABELS.en, config && config.labels);
  // Helpers may run before init() (screens built eagerly), so translated words are
  // written as placeholders and filled in at render time.
  const t = (key) => `<span data-dp-t="${key}"></span>`;
  function translate(key) {
    const l = L();
    if (key.startsWith("lot:")) return lotName(lotDef(key.slice(4)));
    return l[key] ?? key;
  }

  function lotDef(id) {
    if (id == null) return null;
    const found = ((config && config.lots) || []).find((l) => String(l.id) === String(id)) || { id };
    return Object.assign({}, found, { color: Object.assign({}, LOT_COLORS[id] || LOT_COLORS.other, found.color) });
  }
  const lotVars = (lot) => (lot ? `--dp-lot:${lot.color.outline};--dp-lot-bg:${lot.color.bg};--dp-lot-ink:${lot.color.ink};--dp-lot-border:${lot.color.border}` : "");
  const lotName = (lot) => (lot.id === "later" ? L().later : lot.id === "other" ? lot.label || "" : L().lot(lot.id));

  /* ===================== Frames ===================== */

  // One phone. `spec` is an HTML string or { html, tabBar, dark, bg, device, time, caption, tag, highlight, lot, cls }.
  function phone(spec) {
    const s = typeof spec === "string" || typeof spec === "function" ? { html: spec } : spec || {};
    const device = s.device || (config && config.device) || "ios";
    const time = s.time || (config && config.time) || "9:41";
    const lot = s.lot != null ? lotDef(s.lot) : null;
    const cls = ["dp-phone", device === "android" ? "dp-android" : "", s.highlight ? "dp-new" : "", s.cls || ""].filter(Boolean).join(" ");
    const style = [lot ? lotVars(lot) : "", s.scale ? `--dp-phone-scale:${s.scale}` : ""].filter(Boolean).join(";");
    const status = device === "android" ? "▾ ◢ ▮" : "●●● ᯤ ▮";
    const body = `<div class="${cls}"${style ? ` style="${style}"` : ""}><div class="dp-scr">
      <div class="dp-sb ${s.dark ? "dp-dark" : ""}"><span>${esc(time)}</span><span class="dp-isl"></span><span>${status}</span></div>
      <div class="dp-pbody"${s.bg ? ` style="background:${s.bg}"` : ""}>${html(s.html)}</div>${html(s.tabBar)}</div></div>`;
    if (!s.caption && !s.tag) return body;
    const tag = s.tag ? `<span class="dp-ptag ${s.tag === "new" ? "dp-is-new" : "dp-is-now"}">${t(s.tag === "new" ? "new" : "now")}</span>` : "";
    return `<div class="dp-pcol">${tag}${body}${s.caption ? `<div class="dp-cap">${s.caption}</div>` : ""}</div>`;
  }

  // Several phones side by side. Items are phone() strings or phone specs. Options: { arrows, scale, gap }.
  function phones(items, opts = {}) {
    const list = (Array.isArray(items) ? items : [items]).map((p) => (typeof p === "string" && p.includes("dp-phone") ? p : phone(p)));
    const sep = opts.arrows ? `<div class="dp-parrow">${icon("right", 26)}</div>` : "";
    const style = [opts.scale ? `--dp-phone-scale:${opts.scale}` : "", opts.gap != null ? `gap:${opts.gap}px` : ""].filter(Boolean).join(";");
    return `<div class="dp-phones"${style ? ` style="${style}"` : ""}>${list.join(sep)}</div>`;
  }

  /* ===================== Slide blocks ===================== */

  const board = (title, lead, ...blocks) => `<div class="dp-board"><h2>${title}</h2>${lead ? `<p class="dp-lead">${lead}</p>` : ""}${blocks.map(html).join("")}</div>`;
  const node = (title, text, kind = "") => `<div class="dp-node ${kind ? "dp-" + kind : ""}"><b>${title}</b><span>${text}</span></div>`;
  const arrow = () => `<div class="dp-arrow">${icon("right", 18)}</div>`;
  // flow([{ title, text, kind: "q" | "ko" }]) — a journey drawn as chips and arrows.
  const flow = (nodes) => `<div class="dp-flow">${nodes.map((n) => (typeof n === "string" ? n : node(n.title, n.text, n.kind))).join(arrow())}</div>`;
  // state("ok" | "todo" | "warn", label) — a small status pill.
  const state = (kind, label) => `<span class="dp-state dp-${kind}">${label}</span>`;
  const yes = (label) => `<span class="dp-yes">${label}</span>`;
  const no = (label) => `<span class="dp-no">${label}</span>`;
  // card({ title, tag, items, pros, cons, win, html })
  function card(c) {
    const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    const body = [
      c.items ? list(c.items) : "",
      c.pros ? `<div class="dp-plus"><b>${icon("plus", 14)} ${c.prosLabel || t("pros")}</b>${list(c.pros)}</div>` : "",
      c.cons ? `<div class="dp-minus"><b>${icon("minus", 14)} ${c.consLabel || t("cons")}</b>${list(c.cons)}</div>` : "",
      html(c.html),
    ].join("");
    return `<div class="dp-card ${c.win ? "dp-win" : ""}"><div class="dp-card-h"><h3>${c.title}</h3>${c.tag || ""}</div>${body}</div>`;
  }
  const cards = (list, opts = {}) => `<div class="dp-cards ${list.length === 3 || opts.cols === 3 ? "dp-three" : ""}"${opts.style ? ` style="${opts.style}"` : ""}>${list.map((c) => (typeof c === "string" ? c : card(c))).join("")}</div>`;
  // table(["Col", ...], [[cell, ...], ...], { rowStyle: (row, i) => css })
  const table = (head, rows, opts = {}) =>
    `<table class="dp-matrix"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r, i) => `<tr${opts.rowStyle && opts.rowStyle(r, i) ? ` style="${opts.rowStyle(r, i)}"` : ""}>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
  const verdict = (text, ic = "info") => `<div class="dp-verdict">${icon(ic, 18)}<span>${text}</span></div>`;
  // lot({ lot, num, title, state, items }) and lots([...], { cols })
  function lotCard(l) {
    const def = lotDef(l.lot);
    const chip = l.state ? `<span class="dp-lotchip" style="margin-left:auto">${l.state}</span>` : "";
    return `<div class="dp-lot ${l.lot === "later" ? "dp-dim" : ""}" style="${lotVars(def)}"><div class="dp-lot-h"><span class="dp-num">${l.num ?? l.lot}</span><b>${l.title}</b>${chip}</div><ul>${l.items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
  }
  const lots = (list, opts = {}) => `<div class="dp-lots"${opts.cols ? ` style="grid-template-columns:repeat(${opts.cols}, 1fr)"` : ""}>${list.map(lotCard).join("")}</div>`;
  // Inline "NEW" pill next to a field or a column.
  const mark = (label) => `<span class="dp-mark">${label ? esc(label) : t("new")}</span>`;
  // lotChip(id) — "Lot 2" pill in the lot's colour.
  const lotChip = (id) => {
    return `<span class="dp-lotchip" style="${lotVars(lotDef(id))}">${t("lot:" + id)}</span>`;
  };

  /* ===================== Shell ===================== */

  const scenarios = () => config.scenarios;
  const scenario = () => scenarios()[ui.sc];
  const stepDef = () => scenario().steps[ui.step];
  const isFirst = () => ui.sc === 0 && ui.step === 0;
  const isLast = () => ui.sc === scenarios().length - 1 && ui.step === scenario().steps.length - 1;

  function move(delta) {
    const list = scenarios();
    let sc = ui.sc, step = ui.step + delta;
    while (step < 0 && sc > 0) { sc -= 1; step += list[sc].steps.length; }
    while (step >= list[sc].steps.length && sc < list.length - 1) { step -= list[sc].steps.length; sc += 1; }
    ui.sc = sc;
    ui.step = Math.max(0, Math.min(list[sc].steps.length - 1, step));
  }

  function personaOf(p) {
    if (!p) return null;
    if (typeof p === "string") return (config.personas || {})[p] || { name: p };
    return p;
  }

  function stageHtml(s) {
    const tag = s.tag === "new" || s.tag === "now" ? s.tag : s.tag === "current" ? "now" : null;
    const tagHtml = tag ? `<span class="dp-screen-tag dp-is-${tag}">${esc(tag === "new" ? L().new : L().now)}</span>` : "";
    if (s.slide != null) return `<div class="dp-window dp-slide">${html(s.slide)}</div>`;
    if (s.frame === "bare") return `<div class="dp-window dp-bare"><div class="dp-content">${html(s.screen)}</div></div>`;
    const url = s.url ?? config.url ?? "";
    const ic = s.urlIcon || (s.phones ? "phone" : "lock");
    const content = s.phones ? phones(s.phones, s.phonesOptions || {}) : html(s.screen);
    return `<div class="dp-window"><div class="dp-titlebar"><div class="dp-lights"><i></i><i></i><i></i></div>
      <div class="dp-url">${icon(ic, 13)} <b>${esc(url)}</b></div>${tagHtml}</div>
      <div class="dp-content">${content}</div></div>`;
  }

  function render() {
    const s = stepDef();
    const sc = scenario();
    const l = L();
    const lot = lotDef(s.lot);
    const tabs = scenarios()
      .map((x, i) => `<button class="${i === ui.sc ? "dp-active" : ""}" data-dp="scenario:${i}">${esc(x.tab)}${x.badge ? `<span class="dp-tbadge">${esc(x.badge)}</span>` : ""}</button>`)
      .join("");
    const legend = (config.lots || []).length
      ? `<div class="dp-legend">${config.lots
          .map((x) => {
            const d = lotDef(x.id);
            const name = x.id === "later" || x.id === "other" ? x.label || lotName(d) : x.label ? `${lotName(d)} · ${x.label}` : lotName(d);
            return `<span class="dp-sw" style="--dp-lot:${d.color.line}">${esc(name)}</span>`;
          })
          .join("")}</div>`
      : "";
    const links = (config.links || []).map((a) => `<a class="dp-tool" href="${esc(a.href)}">${esc(a.label)}</a>`).join("");
    const dots = sc.steps.map((_, i) => `<button class="${i < ui.step ? "dp-done" : i === ui.step ? "dp-current" : ""}" data-dp="step:${i}"></button>`).join("");
    const p = personaOf(s.persona === undefined ? sc.persona : s.persona);
    const head = p
      ? `<div class="dp-stage-head"><div class="dp-persona"><span class="dp-avatar" style="${p.color ? `background:${p.color}` : ""}">${esc(p.initials || initials(p.name))}</span><div class="dp-who"><b>${esc(p.name)}</b><span>${esc(p.role || "")}</span></div></div></div>`
      : "";
    const kicker = `<div class="dp-kicker"${lot ? ` style="${lotVars(lot)}"` : ""}>${esc(s.kicker || sc.tab)} · ${esc(l.step(ui.step + 1, sc.steps.length))}</div>`;
    root.innerHTML = `<div class="dp-presenter">
      <div class="dp-pbar"><div class="dp-brand"><b>${esc(config.title)}</b><span class="dp-chip-proto">${esc(l.proto)}</span></div><div class="dp-tabs">${tabs}</div>${legend}${links}</div>
      <section class="dp-stage">${head}${stageHtml(s)}</section>
      <div class="dp-narration"><button class="dp-nav" data-dp="prev" ${isFirst() ? "disabled" : ""}>${icon("left")} ${esc(l.prev)}</button>
        <div class="dp-story">${kicker}<h2>${esc(s.title)}</h2><p>${esc(s.text)}</p><div class="dp-dots">${dots}</div></div>
        <button class="dp-nav dp-primary" data-dp="next" ${isLast() ? "disabled" : ""}>${esc(l.next)} ${icon("right")}</button></div></div>`;
    root.querySelectorAll("[data-dp-t]").forEach((el) => (el.textContent = translate(el.getAttribute("data-dp-t"))));
    if (s.focus) root.querySelector(s.focus)?.scrollIntoView({ block: "center" });
    if (config.onRender) config.onRender({ scenario: ui.sc, step: ui.step, def: s });
  }

  let root = null;
  function init(cfg) {
    config = Object.assign({ container: "#root", lang: "en", lots: [], scenarios: [] }, cfg);
    if (!config.scenarios.length) throw new Error("DesignProto.init: `scenarios` is empty");
    root = typeof config.container === "string" ? document.querySelector(config.container) : config.container;
    if (!root) {
      root = document.createElement("div");
      root.id = "dp-root";
      document.body.appendChild(root);
    }
    if (config.title) document.title = config.title;
    document.documentElement.lang = config.lang;
    const fromHash = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
    if (fromHash) {
      ui.sc = Math.min(Number(fromHash[1]), config.scenarios.length - 1);
      ui.step = Math.min(Number(fromHash[2] || 0), config.scenarios[ui.sc].steps.length - 1);
    }
    root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-dp]");
      if (!el) return;
      const c = el.getAttribute("data-dp");
      if (c === "next") move(1);
      else if (c === "prev") move(-1);
      else if (c.startsWith("scenario:")) { ui.sc = Number(c.slice(9)); ui.step = 0; }
      else if (c.startsWith("step:")) ui.step = Number(c.slice(5));
      else return;
      go();
    });
    document.addEventListener("keydown", (e) => {
      if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else return;
      go();
    });
    render();
  }
  // Keep the position in the URL so a link (or a reload) opens the same step.
  function go() {
    history.replaceState(null, "", `#${ui.sc}.${ui.step}`);
    render();
  }

  global.DesignProto = {
    init, render, phone, phones,
    board, flow, node, arrow, state, yes, no, card, cards, table, verdict, lots, lot: lotCard, mark, lotChip, icon, esc,
    goTo(sc, step = 0) { ui.sc = sc; ui.step = step; go(); },
    get position() { return { scenario: ui.sc, step: ui.step }; },
    version: "0.1.0",
  };
})(typeof window !== "undefined" ? window : globalThis);
