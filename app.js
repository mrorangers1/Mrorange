(function () {
  "use strict";

  /* =========================================================
     考研刷题 PWA · 2028 浙大单考
     单文件可运行（window.__QUESTIONS__），也可作为静态站点加载 questions.json
     ========================================================= */

  const APP_VERSION = "1.0.0";
  const STORE_KEY = "kaoyan_quiz_v1";
  const START_DATE = "2026-11-11";
  const DEFAULT_EXAM = "2027-12-25";

  const SUBJECTS = {
    math: { name: "751 数学", short: "数学", color: "#f0c674" },
    auto: { name: "899 自控", short: "自控", color: "#5eead4" },
    ethics: { name: "899 工程伦理", short: "伦理", color: "#b49cff" },
    logic: { name: "899 逻辑", short: "逻辑", color: "#7aa2ff" },
    english: { name: "243 英语", short: "英语", color: "#6ee7a8" },
    politics: { name: "111 马原", short: "马原", color: "#ff8f7a" },
    electrical: { name: "电气基础", short: "电气", color: "#f472b6" }
  };
  const SUBJECT_ORDER = ["math", "auto", "ethics", "logic", "english", "politics", "electrical"];
  const PHASES = [
    { from: 1, to: 1, name: "启动期" },
    { from: 2, to: 8, name: "基础期 I · 高数" },
    { from: 9, to: 13, name: "基础期 II · 线代+自控" },
    { from: 14, to: 21, name: "强化期 I · 660" },
    { from: 22, to: 30, name: "强化期 II · 880" },
    { from: 31, to: 38, name: "维持期 · 凶月" },
    { from: 39, to: 47, name: "冲刺期 I · 真题" },
    { from: 48, to: 52, name: "双考期 · 电气+考研" },
    { from: 53, to: 56, name: "冲刺期 II · 模拟" },
    { from: 57, to: 60, name: "初试期" }
  ];
  const WEEK_NODES = {
    0: "开营前：情报、购书、基线；先不要学新章。",
    1: "数学 1.1（三角忘了先补 0.6-0.10）· 899 伦理 1.1 / 自控 3.1 · 英语 1.1",
    2: "数学 1.3-1.6 · 899 伦理 1.3-1.5 / 逻辑 2.1-2.2 · 英语 1.2-1.3",
    3: "数学 1.7-1.8 / 2.1-2.2 · 899 伦理 1.6-1.8 / 自控 3.2-3.3 · 英语 1.4-1.5",
    4: "数学 2.3-2.6 · 899 伦理 1.9-1.10 / 逻辑 2.3-2.4 · 英语 1.6-1.7",
    5: "数学 2.7-2.8 / 3.1-3.3 · 899 伦理 1.11-1.12 / 自控 3.5 · 英语 1.8",
    6: "数学 3.5-3.8 · 899 逻辑 2.5-2.8 / 自控 3.6 · 英语 2.1",
    7: "数学 4.1-4.3 / 5.1-5.3 · 899 逻辑 2.9-2.11 / 自控 3.7 · 英语 3.2",
    8: "数学 4.4-4.6 / 5.4-5.5 + 阶段测 · 899 逻辑 2.12-2.14 / 自控 3.8",
    9: "数学 6.1-6.3 · 899 自控 3.9-3.11 / 伦理案例 · 英语 3.4",
    10: "数学 6.4-6.6 · 899 自控 3.12-3.14 · 英语真题阅读",
    11: "数学 6.7-6.8 · 899 自控 3.15-3.17 · 英语真题翻译",
    12: "数学 6.9-6.10 · 899 自控 3.18-3.20 · 英语真题套题",
    13: "线代阶段测 + 高数错题 · 899 真题（自控+伦理+逻辑）· 长难句收尾"
  };
  const PHASE_TIPS = [
    "W1 只做三件事：确认、买齐、摸底。不要开始学概率。",
    "高数一轮不碰级数/三重/曲线曲面；每天 10 道计算，练准确率。",
    "线代只到特征值；自控先建直觉，再背公式。",
    "660 一刷只做基础题；错题按 C/K/M/R 归因。",
    "880 + 751 真题 5 套；自控 5-7 章闭环。",
    "凶月砍半，只求不断线；每周 ≥11h 就算赢。",
    "真题阶段：一套题 3 小时，对答案 2 小时，别只做不复盘。",
    "电气考完立刻回考研；报名/确认/酒店单独设提醒。",
    "模拟卷看 3 次移动平均；作文模板背到能默写。",
    "全真模拟 + 准考证 + 杭州踩点；23:00 睡是红线。"
  ];

  /* ---------------- utils ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function ymd(d) {
    const x = d || new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function todayStr() { return ymd(new Date()); }
  function parseDate(s) {
    const p = String(s || "").split("-").map(Number);
    if (p.length !== 3 || p.some(isNaN)) return new Date();
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function addDays(s, n) {
    const d = parseDate(s);
    d.setDate(d.getDate() + Number(n || 0));
    return ymd(d);
  }
  function diffDays(a, b) {
    return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }
  function plural(n, unit) { return `${n}${unit}`; }
  function isStandalone() {
    return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  }

  /* ---------------- state ---------------- */
  function defaultState() {
    return {
      v: 1,
      settings: {
        examDate: DEFAULT_EXAM,
        dailyNew: 15,
        dailyReview: 30,
        autoNext: false,
        theme: "dark",
        fontSize: 17,
        commute: false
      },
      cards: {},
      log: [],
      daily: { date: todayStr(), answered: 0, correct: 0, seconds: 0, newCount: 0, reviewCount: 0 },
      streak: { last: null, days: 0, best: 0 },
      custom: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  let state = defaultState();
  let DB = null;
  let KDB = null;
  let session = null;
  let timerId = null;
  let route = "today";
  const bankFilter = { subject: "all", query: "" };
  let learnSubject = "math";
  let learnQuery = "";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      const d = defaultState();
      return {
        ...d,
        ...s,
        settings: { ...d.settings, ...(s.settings || {}) },
        daily: { ...d.daily, ...(s.daily || {}) },
        streak: { ...d.streak, ...(s.streak || {}) },
        cards: s.cards || {},
        log: Array.isArray(s.log) ? s.log : [],
        custom: Array.isArray(s.custom) ? s.custom : []
      };
    } catch (e) {
      return defaultState();
    }
  }
  function saveState() {
    state.updatedAt = Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function ensureDaily() {
    const t = todayStr();
    if (!state.daily || state.daily.date !== t) {
      state.daily = { date: t, answered: 0, correct: 0, seconds: 0, newCount: 0, reviewCount: 0 };
      saveState();
    }
  }
  function touchStreak() {
    const t = todayStr();
    if (state.streak.last === t) return;
    if (state.streak.last && diffDays(state.streak.last, t) === 1) state.streak.days += 1;
    else state.streak.days = 1;
    state.streak.last = t;
    state.streak.best = Math.max(state.streak.best || 0, state.streak.days);
  }
  function getCard(id) {
    if (!state.cards[id]) {
      state.cards[id] = {
        ease: 2.5, interval: 0, reps: 0, lapses: 0, due: null, last: null,
        seen: 0, correct: 0, wrong: 0, starred: false, lastOk: null
      };
    }
    return state.cards[id];
  }

  function normalizeQuestion(q) {
    if (!q || !q.id || !q.stem) return null;
    const subject = SUBJECTS[q.subject] ? q.subject : "math";
    let type = q.type || "choice";
    if (["choice", "multi", "short"].indexOf(type) < 0) type = "choice";
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    let answer = [];
    let answerText = "";
    if (type === "short") {
      answerText = String(q.answerText || q.answer || "").trim();
    } else {
      if (Array.isArray(q.answer)) {
        answer = q.answer.map((x) => (typeof x === "number" ? x : letterIndex(x)))
          .filter((i) => i >= 0 && i < options.length);
      } else if (typeof q.answer === "number") {
        answer = [q.answer];
      } else if (typeof q.answer === "string") {
        answer = q.answer.split(/[,\s]+/).map(letterIndex).filter((i) => i >= 0 && i < options.length);
      }
      if (!answer.length) answer = [0];
    }
    return {
      ...q,
      subject, type, options, answer, answerText,
      topic: q.topic || "未分类",
      difficulty: Number(q.difficulty) || 2,
      explain: q.explain || "",
      source: q.source || "",
      custom: !!q.custom
    };
  }
  function letterIndex(x) {
    if (typeof x === "number") return x;
    return "ABCDEF".indexOf(String(x || "").trim().toUpperCase());
  }
  function normalizeBank(raw) {
    const list = Array.isArray(raw) ? raw : (raw && raw.questions) || [];
    return {
      version: (raw && raw.version) || 1,
      generatedAt: (raw && raw.generatedAt) || "",
      questions: list.map(normalizeQuestion).filter(Boolean)
    };
  }
  async function loadQuestions() {
    if (window.__QUESTIONS__) return normalizeBank(window.__QUESTIONS__);
    const res = await fetch("questions.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return normalizeBank(await res.json());
  }
  async function loadKnowledge() {
    if (window.__KNOWLEDGE__) return window.__KNOWLEDGE__;
    const res = await fetch("knowledge.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }
  function allNodes() { return (KDB && Array.isArray(KDB.nodes)) ? KDB.nodes : []; }
  function nodeById(id) { return allNodes().find((n) => n.id === id) || null; }
  function nodeStatus(id) {
    const k = state.knowledge && state.knowledge[id];
    return k && [1, 2].indexOf(k.status) >= 0 ? k.status : 0;
  }
  function setNodeStatus(id, status) {
    if (!state.knowledge) state.knowledge = {};
    state.knowledge[id] = { status, updated: Date.now() };
    saveState();
  }
  function masteredCount(subject) {
    return allNodes().filter((n) => (!subject || n.subject === subject) && nodeStatus(n.id) === 2).length;
  }
  function learningCount(subject) {
    return allNodes().filter((n) => (!subject || n.subject === subject) && nodeStatus(n.id) === 1).length;
  }
  function nodeCount(subject) {
    return allNodes().filter((n) => !subject || n.subject === subject).length;
  }
  function allQuestions() { return (DB ? DB.questions : []).concat(state.custom || []); }
  function questionById(id) { return allQuestions().find((q) => q.id === id) || null; }
  function subjectName(s) { return (SUBJECTS[s] && SUBJECTS[s].name) || s; }
  function subjectShort(s) { return (SUBJECTS[s] && SUBJECTS[s].short) || s; }

  /* ---------------- date / plan ---------------- */
  function daysToExam() { return diffDays(todayStr(), state.settings.examDate || DEFAULT_EXAM); }
  function ddayLabel() {
    const d = daysToExam();
    if (d > 0) return "D-" + d;
    if (d === 0) return "今天";
    return "已考完";
  }
  function weekNo() {
    const d = diffDays(START_DATE, todayStr());
    if (d < 0) return 0;
    return clamp(Math.floor(d / 7) + 1, 1, 60);
  }
  function phaseIndex() {
    const w = weekNo();
    if (!w) return 0;
    for (let i = 0; i < PHASES.length; i++) {
      if (w >= PHASES[i].from && w <= PHASES[i].to) return i;
    }
    return PHASES.length - 1;
  }
  function phaseLabel() {
    const w = weekNo();
    if (!w) return "开营前";
    if (w > 60) return "初试后";
    return PHASES[phaseIndex()].name;
  }
  function phaseTip() {
    const w = weekNo();
    if (!w) return "11.6-11.10：下单、下大纲、约基线；11.11 开营。";
    return PHASE_TIPS[phaseIndex()] || PHASE_TIPS[0];
  }
  function weekNodeTip() {
    const w = weekNo();
    if (!w) return WEEK_NODES[0];
    if (w <= 13) return WEEK_NODES[w];
    return "强化/冲刺期：按《60 周路线图》本周主题，优先真题与错题。";
  }

  /* ---------------- queue / SRS ---------------- */
  function isNew(q) {
    const c = state.cards[q.id];
    return !c || !c.seen;
  }
  function isDue(q) {
    const c = state.cards[q.id];
    return !!(c && c.seen > 0 && c.due && c.due <= todayStr());
  }
  function isWrong(q) {
    const c = state.cards[q.id];
    return !!(c && c.wrong > 0 && c.lastOk !== true);
  }
  function dailyCounts() {
    let due = 0, fresh = 0, total = 0;
    for (const q of allQuestions()) {
      total++;
      if (isNew(q)) fresh++;
      else if (isDue(q)) due++;
    }
    return { due, fresh, total };
  }
  function subjectCounts(subject) {
    let due = 0, fresh = 0, seen = 0, total = 0;
    for (const q of allQuestions()) {
      if (q.subject !== subject) continue;
      total++;
      if (isNew(q)) fresh++;
      else {
        seen++;
        if (isDue(q)) due++;
      }
    }
    return { due, fresh, seen, total };
  }
  function interleave(a, b) {
    const groups = new Map();
    for (const q of a.concat(b)) {
      if (!groups.has(q.subject)) groups.set(q.subject, []);
      groups.get(q.subject).push(q);
    }
    const keys = SUBJECT_ORDER.filter((k) => groups.has(k)).concat(Array.from(groups.keys()).filter((k) => SUBJECT_ORDER.indexOf(k) < 0));
    const out = [];
    let more = true;
    while (more) {
      more = false;
      for (const k of keys) {
        const g = groups.get(k);
        if (g && g.length) {
          out.push(g.shift());
          more = true;
        }
      }
    }
    return out;
  }
  function buildQueue(opts) {
    const o = opts || {};
    const t = todayStr();
    const pool = allQuestions().filter((q) => !o.subject || q.subject === o.subject);
    const due = [];
    const fresh = [];
    for (const q of pool) {
      if (isNew(q)) fresh.push(q);
      else if (isDue(q)) due.push(q);
    }
    shuffle(due);
    shuffle(fresh);
    let qs = [];
    if (o.mode === "daily") {
      qs = interleave(
        due.slice(0, state.settings.dailyReview),
        fresh.slice(0, state.settings.dailyNew)
      );
    } else if (o.mode === "due") {
      qs = due;
    } else if (o.mode === "wrong") {
      qs = shuffle(pool.filter(isWrong));
    } else if (o.mode === "random") {
      qs = shuffle(pool);
    } else if (o.mode === "subject") {
      qs = interleave(due, fresh);
    } else {
      qs = interleave(due, fresh);
    }
    if (o.limit) qs = qs.slice(0, o.limit);
    return qs;
  }

  function updateStreakOnAnswer() {
    touchStreak();
  }

  function gradeQuestion(q, ok, opts) {
    const o = opts || {};
    const c = getCard(q.id);
    ensureDaily();
    const wasNew = c.seen === 0;
    c.seen += 1;
    c.last = todayStr();
    c.lastOk = !!ok;
    if (ok) {
      c.correct += 1;
      c.reps += 1;
      if (c.reps === 1) c.interval = 1;
      else if (c.reps === 2) c.interval = 3;
      else c.interval = Math.max(1, Math.round(c.interval * c.ease));
      if (o.hard) c.interval = Math.max(1, Math.round(c.interval * 0.6));
      if (o.easy) c.interval = Math.max(c.interval + 1, Math.round(c.interval * 1.5));
      c.ease = Math.min(2.8, Number((c.ease + 0.05).toFixed(2)));
      c.due = addDays(todayStr(), c.interval);
    } else {
      c.wrong += 1;
      c.lapses += 1;
      c.reps = 0;
      c.interval = 1;
      c.ease = Math.max(1.3, Number((c.ease - 0.2).toFixed(2)));
      c.due = addDays(todayStr(), 1);
    }
    state.daily.answered += 1;
    if (ok) state.daily.correct += 1;
    if (wasNew) state.daily.newCount += 1;
    else state.daily.reviewCount += 1;
    const elapsed = session ? Math.max(0, Math.round((Date.now() - (session.qStart || Date.now())) / 1000)) : 0;
    state.daily.seconds += elapsed;
    updateStreakOnAnswer();
    state.log.push({ t: Date.now(), id: q.id, ok: ok ? 1 : 0 });
    if (state.log.length > 6000) state.log = state.log.slice(-6000);
    saveState();
    return { wasNew, card: c };
  }

  /* ---------------- router / render ---------------- */
  function go(r) {
    route = r;
    render();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  function render() {
    ensureDaily();
    const dday = $("#dday");
    if (dday) dday.textContent = ddayLabel();
    const activeRoute = route === "bank" ? "learn" : route;
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.route === activeRoute));
    const v = $("#view");
    if (!v) return;
    try {
      if (route === "today") v.innerHTML = viewToday();
      else if (route === "learn") v.innerHTML = viewLearn();
      else if (route === "bank") v.innerHTML = viewBank();
      else if (route === "wrong") v.innerHTML = viewWrong();
      else if (route === "stats") v.innerHTML = viewStats();
      else v.innerHTML = viewMe();
    } catch (e) {
      console.error(e);
      v.innerHTML = `<div class="empty" style="margin-top:12vh"><div class="big">!</div><b>页面渲染出错</b><pre style="white-space:pre-wrap;text-align:left;font-size:10px;max-width:100%;overflow:auto">${esc(e.stack || e.message || e)}</pre></div>`;
    }
  }

  /* ---------------- today ---------------- */
  function studiedOn(date) {
    for (const l of state.log) {
      if (ymd(new Date(l.t)) === date) return true;
    }
    return false;
  }
  function streakDots() {
    let html = "";
    for (let i = 13; i >= 0; i--) {
      const d = addDays(todayStr(), -i);
      const on = studiedOn(d);
      const today = i === 0;
      html += `<i class="${on ? "on" : ""}${today ? " today" : ""}" title="${d}"></i>`;
    }
    return `<div class="streak-dots">${html}</div>`;
  }
  function viewToday() {
    const counts = dailyCounts();
    const planned = Math.min(counts.fresh, state.settings.dailyNew) + Math.min(counts.due, state.settings.dailyReview);
    const goal = Math.max(1, planned);
    const done = state.daily.answered;
    const p = Math.min(100, Math.round((done / goal) * 100));
    const headline = planned > 0
      ? `今天，先做 <em>${planned}</em> 道。`
      : `今天已清空，<em>加练</em> 一组？`;
    const startAction = planned > 0 ? "start-daily" : "start-random";
    const startLabel = planned > 0 ? "开始今日刷题" : "加练 20 道";
    const week = weekNo();
    const phase = phaseLabel();
    const subjects = SUBJECT_ORDER.map((s) => {
      const c = subjectCounts(s);
      const total = Math.max(1, c.total);
      const pctSeen = Math.round((c.seen / total) * 100);
      const left = c.due + c.fresh;
      return `<button class="subject-card" data-action="start-subject" data-subject="${s}">
        <span class="top"><span class="name"><span class="dot" style="background:${SUBJECTS[s].color}"></span> ${SUBJECTS[s].short}</span><span class="count">${left}</span></span>
        <span class="sub">${c.due} 复习 · ${c.fresh} 新</span>
        <span class="bar"><i style="width:${pctSeen}%;background:${SUBJECTS[s].color}"></i></span>
      </button>`;
    }).join("");
    return `
    <section class="hero">
      <div class="hero-top">
        <span class="pill gold">${ddayLabel()}</span>
        <span class="pill">${esc(phase)}${week ? " · W" + String(week).padStart(2, "0") : ""}</span>
      </div>
      <h1>${headline}</h1>
      <p class="hero-sub">${esc(state.settings.examDate)} 初试 · 题库 ${counts.total} 道 · 已学 ${counts.total - counts.fresh}</p>
      <div class="hero-main">
        <button class="btn primary" data-action="${startAction}">${startLabel}</button>
        <div class="ring" style="--p:${p}"><div><b>${done}</b><small>/ ${goal}</small></div></div>
      </div>
      <div class="quick-stats">
        <div class="qstat gold"><b>${counts.due}</b><span>到期复习</span></div>
        <div class="qstat teal"><b>${counts.fresh}</b><span>未做新题</span></div>
        <div class="qstat coral"><b>${state.streak.days || 0}</b><span>连续天数</span></div>
      </div>
    </section>

    <div class="card mt12">
      <div class="between"><b>本周先学</b><span class="tiny muted">W${String(week || 0).padStart(2, "0")}</span></div>
      <div class="tiny muted mt8">${esc(weekNodeTip())}</div>
      <div class="tiny faint mt8">先点亮节点，再来刷对应题；每周只挑 3-5 个；不会的题回 Obsidian 笔记。</div>
      <div class="row mt8"><button class="btn small" data-action="go-learn">去学习</button></div>
    </div>

    <div class="section">
      <div class="section-head"><h2>分科</h2><span class="more">点一科，只刷这科</span></div>
      <div class="subject-grid">${subjects}</div>
    </div>

    <div class="section commute-hide">
      <div class="section-head"><h2>今日安排</h2><span class="more">通勤 2h + 晚上主科</span></div>
      <div class="card">
        <div class="row"><span class="badge">早</span><div class="grow">单词 20min + 长难句/视频 25min + 昨日错题 15min</div></div>
        <div class="row mt8"><span class="badge">晚</span><div class="grow">刷题 30min + 错题 20min + 口述复盘 10min</div></div>
        <div class="row mt8"><span class="badge">夜</span><div class="grow">主科 1.5-2h：数学/自控，手机放另一个房间</div></div>
      </div>
    </div>

    <div class="section">
      <div class="card switch-row">
        <div class="grow"><b>通勤模式</b><div class="tiny muted">大按钮、少干扰，适合地铁单手</div></div>
        <button class="switch ${state.settings.commute ? "on" : ""}" data-action="toggle-commute" aria-label="通勤模式"></button>
      </div>
      <div class="card commute-hide">
        <div class="between"><b>最近 14 天</b><span class="tiny muted">连续 ${state.streak.days || 0} 天 · 最佳 ${state.streak.best || 0}</span></div>
        ${streakDots()}
        <div class="tiny faint mt8">断一天不归零，别断三天。</div>
      </div>
    </div>

    <div class="section commute-hide">
      <div class="card tip-card">
        <div class="ico">◎</div>
        <div><b>先学后刷</b><p>先在知识树点亮 1-3 个节点，再来做对应题；刷题是验收，不是学习。${esc(phaseTip())}</p></div>
      </div>
    </div>
    `;
  }

  /* ---------------- learn / knowledge tree ---------------- */
  function nodesOf(subject) {
    return allNodes().filter((n) => !subject || n.subject === subject);
  }
  function nodeQuestionCount(n) {
    return (n.questionIds || []).filter((id) => !!questionById(id)).length;
  }
  function nodeStatusMeta(status) {
    if (status === 2) return { cls: "s2", label: "已掌握" };
    if (status === 1) return { cls: "s1", label: "在学" };
    return { cls: "s0", label: "未学" };
  }
  function chapterList(subject) {
    const groups = [];
    const index = new Map();
    for (const n of nodesOf(subject)) {
      if (!index.has(n.chapter)) {
        index.set(n.chapter, { name: n.chapter, nodes: [] });
        groups.push(index.get(n.chapter));
      }
      index.get(n.chapter).nodes.push(n);
    }
    return groups;
  }
  function learnListHTML() {
    if (learnQuery) {
      const q = learnQuery.toLowerCase();
      const found = allNodes().filter((n) =>
        (n.title + " " + n.focus + " " + n.chapter + " " + n.num).toLowerCase().indexOf(q) >= 0
      );
      if (!found.length) return `<div class="empty"><b>没找到节点</b>换个关键词。</div>`;
      return `<div class="list">` + found.map((n) => nodeRowHTML(n, true)).join("") + `</div>`;
    }
    const chapters = chapterList(learnSubject);
    if (!chapters.length) return `<div class="empty"><b>这一科还没有节点</b>先运行 build_knowledge.py。</div>`;
    return chapters.map((ch, i) => {
      const done = ch.nodes.filter((n) => nodeStatus(n.id) === 2).length;
      const p = pct(done, ch.nodes.length);
      return `<details class="chapter" ${i === 0 ? "open" : ""}>
        <summary>
          <span class="chapter-name">${esc(ch.name)}</span>
          <span class="chapter-progress"><i style="width:${p}%"></i></span>
          <span class="chapter-num">${done}/${ch.nodes.length}</span>
        </summary>
        <div class="chapter-body">${ch.nodes.map((n) => nodeRowHTML(n)).join("")}</div>
      </details>`;
    }).join("");
  }
  function nodeRowHTML(n, showSubject) {
    const st = nodeStatusMeta(nodeStatus(n.id));
    const qc = nodeQuestionCount(n);
    return `<button class="node-row" data-action="open-node" data-id="${esc(n.id)}">
      <span class="node-dot ${st.cls}"></span>
      <span class="node-body">
        <span class="node-title">${esc(n.num)} ${esc(n.title)} ${n.hasCard ? '<span class="node-card-flag">卡</span>' : ""}</span>
        <span class="node-focus">${esc(n.focus || "")}</span>
      </span>
      <span class="node-side">${showSubject ? `<span class="badge">${esc(subjectShort(n.subject))}</span>` : ""}${qc ? `<span class="badge">${qc} 题</span>` : `<span class="badge">题待补</span>`}</span>
    </button>`;
  }
  function continueNode() {
    const pool = nodesOf(learnSubject).length ? nodesOf(learnSubject) : allNodes();
    return pool.find((n) => nodeStatus(n.id) === 1)
      || pool.find((n) => nodeStatus(n.id) === 0)
      || pool[0] || null;
  }
  function viewLearn() {
    const total = allNodes().length;
    if (!total) {
      return `<div class="empty" style="margin-top:16vh"><div class="big">树</div><b>知识树还没加载</b>先在 Mac 运行 <code>./build.sh</code>，生成 <code>knowledge.json</code>。</div>`;
    }
    const done = masteredCount();
    const doing = learningCount();
    const p = pct(done, total);
    const next = continueNode();
    const subjectCards = SUBJECT_ORDER.map((s) => {
      const n = nodeCount(s);
      if (!n) return "";
      const d = masteredCount(s);
      const r = pct(d, n);
      return `<button class="subject-card learn-subject ${learnSubject === s ? "active" : ""}" data-action="learn-subject" data-subject="${s}">
        <span class="top"><span class="name"><span class="dot" style="background:${SUBJECTS[s].color}"></span> ${SUBJECTS[s].short}</span><span class="count">${d}<small>/${n}</small></span></span>
        <span class="sub">已掌握 ${d} · 在学 ${learningCount(s)}</span>
        <span class="bar"><i style="width:${r}%;background:${SUBJECTS[s].color}"></i></span>
      </button>`;
    }).join("");
    return `
    <section class="learn-hero">
      <div class="between"><span class="eyebrow">知识树</span><span class="pill teal">已点亮 ${done} / ${total}</span></div>
      <div class="learn-hero-main">
        <div class="ring learn-ring" style="--p:${p}"><div><b>${done}</b><small>/ ${total}</small></div></div>
        <div class="grow">
          <h1 class="h1">先看知识，<br>再刷题。</h1>
          <p class="tiny muted mt8">已掌握 ${done} · 在学 ${doing} · 未学 ${Math.max(0, total - done - doing)}</p>
        </div>
      </div>
      <div class="row mt12">
        <button class="btn primary small" data-action="continue-learn">${next ? "继续：" + esc(next.title) : "开始学习"}</button>
        <button class="btn small" data-action="go-bank">题库</button>
      </div>
    </section>

    <div class="section">
      <div class="section-head"><h2>分科点亮</h2><span class="more">点一科看章节</span></div>
      <div class="subject-grid">${subjectCards}</div>
    </div>

    <div class="section">
      <div class="section-head"><h2>${learnQuery ? "搜索结果" : esc(subjectName(learnSubject))}</h2><span class="more" id="learnCount">${nodesOf(learnSubject).length} 个节点</span></div>
      <div class="search mt8">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="learnSearch" type="search" placeholder="搜知识点，如：三角、极限、举报" value="${esc(learnQuery)}" autocomplete="off">
      </div>
      <div id="learnList" class="mt12">${learnListHTML()}</div>
    </div>

    <div class="card tip-card">
      <div class="ico">◎</div>
      <div><b>点亮规则</b><p>能讲 3 分钟 + 做对 2 道变式，才点「已掌握」。只“看过”不算；每周只挑 3-5 个。</p></div>
    </div>
    `;
  }
  function renderLearnList() {
    const el = $("#learnList");
    if (!el) return;
    el.innerHTML = learnListHTML();
    const c = $("#learnCount");
    if (c) c.textContent = learnQuery ? `${allNodes().filter((n) => (n.title + " " + n.focus + " " + n.chapter).toLowerCase().indexOf(learnQuery.toLowerCase()) >= 0).length} 个节点` : `${nodesOf(learnSubject).length} 个节点`;
  }
  function openNodeSheet(id) {
    const n = nodeById(id);
    if (!n) return;
    const st = nodeStatus(n.id);
    const statusBtns = [0, 1, 2].map((s) => {
      const m = nodeStatusMeta(s);
      return `<button class="status-btn ${st === s ? "active " + m.cls : ""}" data-action="set-node-status" data-id="${esc(n.id)}" data-status="${s}">${m.label}</button>`;
    }).join("");
    const qc = nodeQuestionCount(n);
    const formulas = (n.formulas || []).map((f) => `<div class="formula">${inline(f)}</div>`).join("");
    const sheet = $("#nodeSheet");
    sheet.innerHTML = `<div class="sheet node-sheet">
      <div class="sheet-head">
        <div class="grow"><div class="eyebrow">${esc(subjectShort(n.subject))} · ${esc(n.chapter)}</div><h3>${esc(n.num)} ${esc(n.title)}</h3></div>
        <button class="icon-btn" data-action="close-node">✕</button>
      </div>
      <div class="node-status-row">${statusBtns}</div>
      <div class="node-read">
        <div class="eyebrow">先看知识</div>
        <p class="node-summary">${inline(n.summary || n.focus || "")}</p>
        ${formulas ? `<div class="formula-list">${formulas}</div>` : ""}
        ${n.example ? `<div class="node-example"><b>例</b> ${inline(n.example)}</div>` : ""}
        ${n.cardNote ? `<div class="node-tip"><b>记</b> ${inline(n.cardNote)}</div>` : ""}
        ${n.note ? `<div class="tiny faint mt12">完整笔记：${esc(n.note)}</div>` : ""}
        ${n.source ? `<div class="tiny faint">来源：${esc(n.source)}</div>` : ""}
        ${!n.hasCard ? `<div class="node-missing">这节还没有知识卡；先看 Obsidian 笔记/教材，再回来做题。</div>` : ""}
      </div>
      <div class="tiny muted mt8">前置：${esc(n.prereq || "—")} ｜ 考点：${esc(n.focus || "—")}</div>
      <div class="toolbar mt12">
        <button class="btn primary" data-action="start-node" data-id="${esc(n.id)}" ${qc ? "" : "disabled"}>做这节题（${qc}）</button>
      </div>
      <div class="tiny faint">做完题回来自评：能讲 + 做对变式，再点「已掌握」。</div>
    </div>`;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeNodeSheet() {
    const sheet = $("#nodeSheet");
    if (!sheet) return;
    sheet.hidden = true;
    sheet.innerHTML = "";
    document.body.style.overflow = "";
  }
  function refreshNodeSheet(id) {
    if ($("#nodeSheet") && !$("#nodeSheet").hidden) openNodeSheet(id);
  }
  function setNodeStatusAction(id, status) {
    setNodeStatus(id, status);
    const n = nodeById(id);
    toast(status === 2 ? `点亮：${n ? n.title : "节点"}` : status === 1 ? "标记在学" : "已回到未学");
    refreshNodeSheet(id);
    if (route === "learn") render();
  }
  function startNodeQuestions(id) {
    const n = nodeById(id);
    if (!n) return;
    const ids = (n.questionIds || []).filter((qid) => !!questionById(qid));
    if (!ids.length) { toast("这节题库还没补", true); return; }
    if (nodeStatus(id) === 0) setNodeStatus(id, 1);
    closeNodeSheet();
    startSession({ ids, mode: "node" });
  }

  /* ---------------- bank ---------------- */
  function qState(q) {
    const c = state.cards[q.id];
    if (!c || !c.seen) return { cls: "new", label: "新" };
    if (c.lastOk === false) return { cls: "bad", label: "错" };
    if (c.due && c.due <= todayStr()) return { cls: "due", label: "到期" };
    return { cls: "ok", label: "已学" };
  }
  function filteredBank() {
    let list = allQuestions();
    if (bankFilter.subject !== "all") list = list.filter((q) => q.subject === bankFilter.subject);
    if (bankFilter.query) {
      const q = bankFilter.query.toLowerCase();
      list = list.filter((x) => (x.stem + " " + x.topic + " " + x.id + " " + subjectName(x.subject)).toLowerCase().indexOf(q) >= 0);
    }
    return list.sort((a, b) => {
      const sa = SUBJECT_ORDER.indexOf(a.subject);
      const sb = SUBJECT_ORDER.indexOf(b.subject);
      if (sa !== sb) return sa - sb;
      return a.id.localeCompare(b.id);
    });
  }
  function bankListHTML() {
    const qs = filteredBank();
    if (!qs.length) return `<div class="empty"><div class="big">⌕</div><b>没找到</b>换个关键词，或清空筛选。</div>`;
    return `<div class="list">` + qs.map((q) => {
      const st = qState(q);
      return `<button class="list-item" data-action="open-question" data-id="${esc(q.id)}">
        <span class="state ${st.cls}"></span>
        <span class="body">
          <span class="stem">${inline(q.stem)}</span>
          <span class="meta"><span>${esc(subjectShort(q.subject))}</span><span>·</span><span>${esc(q.topic)}</span><span>·</span><span>${esc(q.id)}</span></span>
        </span>
        <span class="badge ${st.cls === "new" ? "new" : st.cls === "due" ? "due" : st.cls === "bad" ? "hard" : ""}">${st.label}</span>
      </button>`;
    }).join("") + `</div>`;
  }
  function viewBank() {
    const qs = filteredBank();
    const chips = [`<button class="chip ${bankFilter.subject === "all" ? "active" : ""}" data-action="filter-subject" data-subject="all">全部</button>`]
      .concat(SUBJECT_ORDER.map((s) => `<button class="chip ${bankFilter.subject === s ? "active" : ""}" data-action="filter-subject" data-subject="${s}">${SUBJECTS[s].short}</button>`))
      .join("");
    return `
    <div class="between">
      <div><div class="eyebrow">题库</div><h1 class="h1">${allQuestions().length} 道</h1></div>
      <div class="row"><button class="btn small" data-action="go-learn">知识树</button><button class="btn small" data-action="open-add">＋ 加题</button></div>
    </div>
    <div class="search mt12">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="bankSearch" type="search" placeholder="搜题干、知识点、ID" value="${esc(bankFilter.query)}" autocomplete="off">
    </div>
    <div class="seg mt12">${chips}</div>
    <div class="toolbar">
      <button class="btn small" data-action="start-random">随机 20 题</button>
      <button class="btn small" data-action="start-due">只刷到期</button>
    </div>
    <div class="between mt12"><span class="tiny muted" id="bankCount">${qs.length} 道</span><span class="tiny faint">点单题可预览/单刷</span></div>
    <div id="bankList" class="mt8">${bankListHTML()}</div>
    `;
  }
  function renderBankList() {
    const list = $("#bankList");
    if (!list) return;
    list.innerHTML = bankListHTML();
    const c = $("#bankCount");
    if (c) c.textContent = filteredBank().length + " 道";
  }

  /* ---------------- wrong ---------------- */
  function wrongQuestions() {
    return allQuestions().filter(isWrong).sort((a, b) => {
      const ca = state.cards[a.id] || {};
      const cb = state.cards[b.id] || {};
      return String(cb.last || "").localeCompare(String(ca.last || ""));
    });
  }
  function viewWrong() {
    const qs = wrongQuestions();
    if (!qs.length) {
      return `<div class="empty" style="margin-top:12vh"><div class="big">✓</div><b>错题本空了</b>答对一次后，题目会自动移出；保持这个状态。</div>`;
    }
    return `
    <div class="between">
      <div><div class="eyebrow">错题</div><h1 class="h1">${qs.length} 道待攻克</h1></div>
      <button class="btn primary small" data-action="start-wrong">重做全部</button>
    </div>
    <p class="tiny muted mt8">规则：答错 → 明天再来；答对一次 → 移出。连续错 2 次，回笔记重学。</p>
    <div class="list mt12">` + qs.map((q) => {
      const c = state.cards[q.id] || {};
      return `<button class="list-item" data-action="open-question" data-id="${esc(q.id)}">
        <span class="state bad"></span>
        <span class="body">
          <span class="stem">${inline(q.stem)}</span>
          <span class="meta"><span>${esc(subjectShort(q.subject))}</span><span>·</span><span>${esc(q.topic)}</span><span>·</span><span>错 ${c.wrong || 0} 次</span><span>·</span><span>${esc(c.last || "")}</span></span>
        </span>
      </button>`;
    }).join("") + `</div>`;
  }

  /* ---------------- stats ---------------- */
  function logCount(day) {
    let n = 0;
    for (const l of state.log) if (ymd(new Date(l.t)) === day) n++;
    return n;
  }
  function subjectAgg() {
    const m = {};
    for (const q of allQuestions()) {
      const c = state.cards[q.id];
      if (!c || !c.seen) continue;
      if (!m[q.subject]) m[q.subject] = { seen: 0, correct: 0 };
      m[q.subject].seen += c.seen;
      m[q.subject].correct += c.correct;
    }
    return m;
  }
  function topicAgg() {
    const m = {};
    for (const q of allQuestions()) {
      const c = state.cards[q.id];
      if (!c || !c.seen) continue;
      const k = q.subject + "|" + q.topic;
      if (!m[k]) m[k] = { subject: q.subject, topic: q.topic, seen: 0, correct: 0 };
      m[k].seen += c.seen;
      m[k].correct += c.correct;
    }
    return m;
  }
  function heatHTML() {
    let cells = "";
    for (let i = 59; i >= 0; i--) {
      const d = addDays(todayStr(), -i);
      const n = logCount(d);
      const lvl = n === 0 ? 0 : n < 5 ? 1 : n < 12 ? 2 : n < 25 ? 3 : 4;
      cells += `<i class="l${lvl}" title="${d} · ${n} 题"></i>`;
    }
    return `<div class="heat">${cells}</div>`;
  }
  function viewStats() {
    const cards = Object.values(state.cards);
    const seenCards = cards.filter((c) => c.seen > 0);
    const totalSeen = seenCards.reduce((a, c) => a + c.seen, 0);
    const totalCorrect = seenCards.reduce((a, c) => a + c.correct, 0);
    const acc = pct(totalCorrect, totalSeen);
    const days = new Set(state.log.map((l) => ymd(new Date(l.t)))).size;
    const days7 = [];
    for (let i = 6; i >= 0; i--) days7.push(addDays(todayStr(), -i));
    const counts7 = days7.map(logCount);
    const max7 = Math.max(10, ...counts7);
    const bars = days7.map((d, i) => {
      const n = counts7[i];
      const h = Math.max(3, Math.round((n / max7) * 88));
      const label = ["日", "一", "二", "三", "四", "五", "六"][parseDate(d).getDay()];
      return `<div class="col ${i === 6 ? "today" : ""}"><div class="bar" style="height:${h}px"></div><div class="lbl">${label}</div></div>`;
    }).join("");
    const sAgg = subjectAgg();
    const subjectBars = SUBJECT_ORDER.map((s) => {
      const a = sAgg[s] || { seen: 0, correct: 0 };
      const r = pct(a.correct, a.seen);
      return `<div class="bar-row"><span class="name">${SUBJECTS[s].short}</span><span class="track"><i style="width:${a.seen ? Math.max(3, r) : 0}%;background:${SUBJECTS[s].color}"></i></span><span class="val">${a.seen ? r + "%" : "—"}</span></div>`;
    }).join("");
    const tAgg = topicAgg();
    const weak = Object.values(tAgg)
      .filter((x) => x.seen >= 3 && pct(x.correct, x.seen) < 70)
      .sort((a, b) => pct(a.correct, a.seen) - pct(b.correct, b.seen))
      .slice(0, 6);
    const weakHTML = weak.length
      ? weak.map((x) => `<div class="weak-item"><span class="tiny">${esc(subjectShort(x.subject))} · ${esc(x.topic)}</span><span class="badge hard">${pct(x.correct, x.seen)}% · ${x.seen} 次</span></div>`).join("")
      : `<div class="tiny muted">还没有足够数据（同一知识点至少做 3 次）。</div>`;
    return `
    <div class="eyebrow">统计</div>
    <h1 class="h1">${acc}% <span class="muted" style="font-size:14px;font-family:var(--sans)">总正确率</span></h1>
    <div class="stat-hero mt12">
      <div class="big-stat"><b>${totalSeen}</b><span>累计作答 · ${seenCards.length} 道题</span></div>
      <div class="big-stat"><b>${state.streak.days || 0}</b><span>连续天数 · 最佳 ${state.streak.best || 0}</span></div>
    </div>
    <div class="card mt12">
      <div class="between"><b>近 7 天</b><span class="tiny muted">共 ${counts7.reduce((a, b) => a + b, 0)} 题</span></div>
      <div class="chart">${bars}</div>
    </div>
    <div class="card">
      <div class="between"><b>分科正确率</b><span class="tiny muted">已学 ${seenCards.length} / ${allQuestions().length}</span></div>
      <div class="mt8">${subjectBars}</div>
    </div>
    <div class="card">
      <div class="between"><b>薄弱知识点</b><span class="tiny muted">低于 70%</span></div>
      <div class="weak-list mt8">${weakHTML}</div>
    </div>
    <div class="card">
      <div class="between"><b>近 60 天</b><span class="tiny muted">${days} 天有记录</span></div>
      ${heatHTML()}
      <div class="tiny faint mt8">颜色越亮，当天刷得越多。目标不是全亮，是不断线。</div>
    </div>
    `;
  }

  /* ---------------- me ---------------- */
  function viewMe() {
    const s = state.settings;
    return `
    <div class="eyebrow">设置</div>
    <h1 class="h1">我的</h1>
    <div class="card mt12">
      <div class="set-row">
        <div class="lbl"><b>初试日期</b><span>倒计时按这个算</span></div>
        <input type="date" id="examDate" value="${esc(s.examDate)}">
      </div>
      <div class="set-row">
        <div class="lbl"><b>每日新题</b><span>通勤建议 15-20</span></div>
        <input type="range" id="dailyNew" min="5" max="40" step="5" value="${s.dailyNew}">
        <span class="num" id="dailyNewVal">${s.dailyNew}</span>
      </div>
      <div class="set-row">
        <div class="lbl"><b>每日复习上限</b><span>到期太多时先清复习</span></div>
        <input type="range" id="dailyReview" min="10" max="80" step="10" value="${s.dailyReview}">
        <span class="num" id="dailyReviewVal">${s.dailyReview}</span>
      </div>
      <div class="set-row">
        <div class="lbl"><b>自动下一题</b><span>答对后 2 秒自动走</span></div>
        <button class="switch ${s.autoNext ? "on" : ""}" data-action="toggle-auto" aria-label="自动下一题"></button>
      </div>
      <div class="set-row">
        <div class="lbl"><b>通勤模式</b><span>大字号、少干扰</span></div>
        <button class="switch ${s.commute ? "on" : ""}" data-action="toggle-commute" aria-label="通勤模式"></button>
      </div>
      <div class="set-row">
        <div class="lbl"><b>题目字号</b><span>${s.fontSize}px</span></div>
        <input type="range" id="fontSize" min="15" max="21" step="1" value="${s.fontSize}">
        <span class="num" id="fontSizeVal">${s.fontSize}</span>
      </div>
      <div class="set-row">
        <div class="lbl"><b>深色 / 浅色</b><span>当前：${s.theme === "dark" ? "深色" : "浅色"}</span></div>
        <button class="btn small" data-action="toggle-theme">切换</button>
      </div>
    </div>

    <div class="card">
      <div class="between"><b>数据</b><span class="tiny muted">只存本机</span></div>
      <div class="toolbar">
        <button class="btn small" data-action="export">导出进度</button>
        <button class="btn small" data-action="import">导入进度</button>
      </div>
      <input type="file" id="importFile" accept="application/json,.json" hidden>
      <div class="toolbar">
        <button class="btn small" data-action="open-add">＋ 手动加题</button>
        <button class="btn small" data-action="export-custom">导出加题 Markdown</button>
      </div>
      <div class="tiny muted">换手机/清缓存前，导出一份到 iCloud；新设备导入即可。</div>
    </div>

    <div class="card">
      <div class="between"><b>安装到 iPhone</b><span class="tiny muted">${isStandalone() ? "已安装" : "未安装"}</span></div>
      <div class="install mt12">
        <div class="num-badge">1</div>
        <div><b>Safari 打开部署地址</b><p>必须是 Safari，不是微信/QQ 内置浏览器。</p></div>
      </div>
      <div class="install mt8">
        <div class="num-badge">2</div>
        <div><b>点底部「分享」→ 添加到主屏幕</b><p>图标会出现在桌面，点开全屏、离线可用。</p></div>
      </div>
      <div class="install mt8">
        <div class="num-badge">3</div>
        <div><b>第一次打开后等 3 秒</b><p>让 Service Worker 缓存题目；之后地铁没信号也能刷。</p></div>
      </div>
      <div class="toolbar mt12"><button class="btn small" data-action="install-tip">我找不到分享按钮</button></div>
    </div>

    <div class="card">
      <div class="between"><b>关于</b><span class="tiny muted">v${APP_VERSION}</span></div>
      <div class="tiny muted mt8">题库 ${allQuestions().length} 道 · 构建 ${esc((DB && DB.generatedAt) || "—")}</div>
      <div class="tiny muted mt8">数据只存浏览器 localStorage，不上传服务器。换设备用「导出/导入」。</div>
      <div class="toolbar mt12">
        <button class="btn small" data-action="reset">清空进度</button>
      </div>
    </div>

    <div class="card">
      <div class="between"><b>怎么加题</b><span class="tiny muted">三种方式</span></div>
      <div class="tiny muted mt8">1. 在 Obsidian 的 <code>60-题库</code> 按格式写，Mac 上重新构建。<br>2. 把笔记 + AI 提示词丢给 DeepSeek，生成后粘回题库。<br>3. 这里「＋ 手动加题」，回 Mac 导出 Markdown 入库。</div>
      <div class="toolbar mt12"><button class="btn small" data-action="copy-ai-prompt">复制 AI 出题提示词</button></div>
    </div>
    `;
  }

  /* ---------------- practice ---------------- */
  function startSession(opts) {
    const o = opts || {};
    if (session && session.autoTimer) { clearTimeout(session.autoTimer); session.autoTimer = null; }
    let queue = [];
    if (o.ids && o.ids.length) {
      queue = o.ids.map(questionById).filter(Boolean);
    } else {
      queue = buildQueue({ subject: o.subject || null, mode: o.mode || "daily", limit: o.limit || null });
    }
    if (!queue.length) {
      toast("没有可刷的题：先加题，或把每日新题调大。", true);
      return;
    }
    session = {
      queue, index: 0, mode: o.mode || "daily", subject: o.subject || null,
      startAt: Date.now(), qStart: Date.now(), selected: [], submitted: false,
      revealed: false, lastOk: null, answered: 0, correct: 0, newCount: 0, shortText: ""
    };
    const p = $("#practice");
    p.hidden = false;
    document.body.style.overflow = "hidden";
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      const el = $("#sessionTimer");
      if (el && session) el.textContent = formatTime((Date.now() - session.startAt) / 1000);
    }, 1000);
    renderPractice();
  }
  function closePractice() {
    if (session && session.autoTimer) { clearTimeout(session.autoTimer); session.autoTimer = null; }
    const p = $("#practice");
    if (p) { p.hidden = true; p.innerHTML = ""; }
    document.body.style.overflow = "";
    if (timerId) { clearInterval(timerId); timerId = null; }
    session = null;
    render();
  }
  function currentQuestion() {
    if (!session) return null;
    return session.queue[session.index] || null;
  }
  function renderPractice() {
    const p = $("#practice");
    if (!p) return;
    if (!session) { p.hidden = true; return; }
    if (session.index >= session.queue.length) { renderFinish(); return; }
    const q = currentQuestion();
    const c = getCard(q.id);
    const total = session.queue.length;
    const num = session.index + 1;
    const headPct = Math.round(((num - 1) / total) * 100);
    const isNewQ = !c.seen;
    const st = qState(q);
    const optionsHTML = q.type === "short" ? "" : `<div class="options">` + q.options.map((o, i) => {
      let cls = "option";
      if (session.selected.indexOf(i) >= 0) cls += " sel";
      if (session.submitted) {
        if (q.answer.indexOf(i) >= 0) cls += " correct";
        else if (session.selected.indexOf(i) >= 0) cls += " wrong";
        else cls += " dim";
      }
      return `<button class="${cls}" data-action="select-option" data-i="${i}" ${session.submitted ? "disabled" : ""}>
        <span class="letter">${"ABCDEF"[i]}</span><span>${inline(o)}</span>
      </button>`;
    }).join("") + `</div>`;
    const shortHTML = q.type === "short"
      ? `<textarea class="short-input" id="shortAnswer" placeholder="先自己写关键词，再看参考答案…">${esc(session.shortText || "")}</textarea>`
      : "";
    const answerHTML = (q.type === "short" && session.revealed)
      ? `<div class="answer-box"><div class="t">参考答案</div><div class="v">${inline(q.answerText || "（暂无参考答案）")}</div></div>`
      : "";
    const resultHTML = session.submitted
      ? `<div class="result ${session.lastOk ? "ok" : "bad"}">
          <div class="mark">${session.lastOk ? "✓" : "✕"}</div>
          <div><b>${session.lastOk ? "答对了" : "答错了"}</b><span>${session.lastOk ? (c.interval > 1 ? `下次复习：${c.interval} 天后` : "明天再见一次") : "已进错题本，明天再来"}</span></div>
        </div>`
      : "";
    const explainHTML = session.submitted
      ? `<div class="explain"><div class="t">解析</div><div class="v">${inline(q.explain || "暂无解析；回笔记补一句“为什么”。")}</div>${q.source ? `<div class="tiny faint mt8">来源：${esc(q.source)}</div>` : ""}</div>`
      : "";
   let foot = "";
    if (q.type === "short") {
      if (!session.revealed) {
        foot = `<button class="btn primary" data-action="reveal-answer">看参考答案</button>`;
      } else if (!session.submitted) {
        foot = `<div class="self-grade">
          <button class="btn" data-action="self-grade" data-grade="again">没答对</button>
          <button class="btn" data-action="self-grade" data-grade="hard">基本对</button>
          <button class="btn primary" data-action="self-grade" data-grade="good">答对了</button>
        </div>`;
      } else {
        foot = `<button class="btn primary" data-action="next-question">下一题</button>`;
      }
    } else {
      foot = session.submitted
        ? `<button class="btn primary" data-action="next-question">下一题</button>`
        : `<button class="btn primary" data-action="submit-answer" ${session.selected.length ? "" : "disabled"}>提交答案</button>`;
    }
    p.innerHTML = `
      <div class="practice-head">
        <button class="icon-btn" data-action="close-practice" aria-label="关闭">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>
        </button>
        <div class="progress-wrap">
          <div class="progress-top"><span>${esc(subjectShort(q.subject))} · ${esc(q.topic)}</span><span id="sessionTimer">${formatTime((Date.now() - session.startAt) / 1000)}</span></div>
          <div class="progress"><i style="width:${headPct}%"></i></div>
        </div>
        <button class="icon-btn tts" data-action="speak" aria-label="朗读">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></svg>
        </button>
      </div>
      <div class="practice-body">
        <div class="practice-inner">
          <div class="q-meta">
            <span class="badge">${esc(subjectShort(q.subject))}</span>
            <span class="badge">${esc(q.topic)}</span>
            <span class="badge">难度 ${clamp(q.difficulty || 2, 1, 3)}</span>
            ${isNewQ ? `<span class="badge new">新题</span>` : st.cls === "due" ? `<span class="badge due">到期</span>` : ""}
            <span class="grow"></span>
            <button class="btn small q-star ${c.starred ? "on" : ""}" data-action="star">${c.starred ? "★" : "☆"}</button>
          </div>
          <div class="q-card">
            <div class="q-stem">${inline(q.stem)}</div>
            ${optionsHTML}
            ${shortHTML}
            ${answerHTML}
            ${resultHTML}
            ${explainHTML}
          </div>
          <div class="tiny faint mt12">${num} / ${total} · 点选项后提交；答错自动进错题本。</div>
        </div>
      </div>
      <div class="practice-foot"><div class="inner">${foot}</div></div>
    `;
  }
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function submitChoice() {
    if (!session || session.submitted) return;
    const q = currentQuestion();
    if (!q || !session.selected.length) return;
    const ok = arraysEqual(session.selected.slice().sort((a, b) => a - b), q.answer.slice().sort((a, b) => a - b));
    session.lastOk = ok;
    session.submitted = true;
    session.answered += 1;
    if (ok) session.correct += 1;
    const r = gradeQuestion(q, ok);
    if (r.wasNew) session.newCount += 1;
    renderPractice();
    if (ok && state.settings.autoNext) {
      session.autoTimer = setTimeout(() => {
        if (session && session.submitted) nextQuestion();
      }, 2200);
    }
  }
  function selfGrade(kind) {
    if (!session || session.submitted) return;
    const q = currentQuestion();
    if (!q) return;
    const ok = kind !== "again";
    session.lastOk = ok;
    session.submitted = true;
    session.revealed = true;
    session.answered += 1;
    if (ok) session.correct += 1;
    const r = gradeQuestion(q, ok, { hard: kind === "hard" });
    if (r.wasNew) session.newCount += 1;
    renderPractice();
  }
  function revealAnswer() {
    if (!session) return;
    session.revealed = true;
    renderPractice();
  }
  function nextQuestion() {
    if (!session) return;
    if (session.autoTimer) { clearTimeout(session.autoTimer); session.autoTimer = null; }
    session.index += 1;
    session.selected = [];
    session.submitted = false;
    session.revealed = false;
    session.lastOk = null;
    session.shortText = "";
    session.qStart = Date.now();
    renderPractice();
  }
  function renderFinish() {
    const p = $("#practice");
    const total = session.queue.length;
    const acc = pct(session.correct, session.answered || total);
    const minutes = Math.max(1, Math.round((Date.now() - session.startAt) / 60000));
    const msg = acc >= 85 ? "漂亮，保持这个手感。" : acc >= 65 ? "及格，错题再磨一遍。" : "先回笔记，别硬刷。";
    p.innerHTML = `
      <div class="practice-head">
        <button class="icon-btn" data-action="close-practice" aria-label="关闭">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>
        </button>
        <div class="progress-wrap"><div class="progress-top"><span>本组完成</span><span>${session.answered} / ${total}</span></div><div class="progress"><i style="width:100%"></i></div></div>
        <span style="width:34px"></span>
      </div>
      <div class="practice-body">
        <div class="finish">
          <div class="big-ring" style="--p:${acc}"><div><b>${acc}%</b><small>正确率</small></div></div>
          <h2>${msg}</h2>
          <p>${session.answered} 题 · ${minutes} 分钟 · 新题 ${session.newCount}</p>
          <div class="stats">
            <div><b>${session.correct}</b><span>答对</span></div>
            <div><b>${Math.max(0, session.answered - session.correct)}</b><span>答错</span></div>
            <div><b>${state.streak.days || 0}</b><span>连续天</span></div>
          </div>
          <div class="actions">
            <button class="btn" data-action="session-again">再来一组</button>
            <button class="btn primary" data-action="session-close">${session.mode === "node" ? "回知识树" : "回今日"}</button>
          </div>
          <div class="tiny faint mt12">错题已自动进「错题」；明天会再出现。</div>
        </div>
      </div>
    `;
  }
  function speakQuestion() {
    const q = currentQuestion();
    if (!q) return;
    if (!("speechSynthesis" in window)) { toast("当前浏览器不支持朗读"); return; }
    const text = q.stem + (q.options && q.options.length ? "。选项：" + q.options.map((o, i) => `${"ABCD"[i]}，${o}`).join("；") : "");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = q.subject === "english" ? "en-US" : "zh-CN";
    u.rate = 0.96;
    window.speechSynthesis.speak(u);
  }

  /* ---------------- add question sheet ---------------- */
  function openAddSheet() {
    const sheet = $("#sheet");
    const opts = SUBJECT_ORDER.map((s) => `<option value="${s}">${SUBJECTS[s].name}</option>`).join("");
    sheet.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h3>手动加题</h3><button class="icon-btn" data-action="close-sheet">✕</button></div>
        <div class="grid2">
          <div class="field"><label>科目</label><select id="addSubject">${opts}</select></div>
          <div class="field"><label>题型</label><select id="addType"><option value="choice">单选</option><option value="multi">多选</option><option value="short">简答</option></select></div>
        </div>
        <div class="field"><label>知识点</label><input id="addTopic" placeholder="如：极限 / 时域 / 辩证法"></div>
        <div class="field"><label>题干</label><textarea id="addStem" placeholder="题干，数学用 lim(x→0) 这种写法"></textarea></div>
        <div class="only-choice">
          <div class="field"><label>选项（至少 2 个）</label>
            <div class="opt-row"><span class="k">A</span><input class="add-opt" placeholder="选项 A"></div>
            <div class="opt-row"><span class="k">B</span><input class="add-opt" placeholder="选项 B"></div>
            <div class="opt-row"><span class="k">C</span><input class="add-opt" placeholder="选项 C（可空）"></div>
            <div class="opt-row"><span class="k">D</span><input class="add-opt" placeholder="选项 D（可空）"></div>
          </div>
          <div class="field"><label>答案</label><input id="addAnswer" placeholder="单选写 C；多选写 A,C"></div>
        </div>
        <div class="only-short" style="display:none">
          <div class="field"><label>参考答案</label><textarea id="addAnswerText" placeholder="2-4 行要点"></textarea></div>
        </div>
        <div class="field"><label>解析（可选）</label><textarea id="addExplain" placeholder="为什么对，其他选项错在哪"></textarea></div>
        <div class="toolbar">
          <button class="btn" data-action="close-sheet">取消</button>
          <button class="btn primary" data-action="save-custom">保存到题库</button>
        </div>
        <div class="hint">保存后只在本机；回 Mac 点「导出加题 Markdown」，粘到 Obsidian 的 <code>60-题库/</code> 即可永久入库。</div>
      </div>`;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => { const el = $("#addStem"); if (el) el.focus(); }, 50);
  }
  function closeSheet() {
    const sheet = $("#sheet");
    if (!sheet) return;
    sheet.hidden = true;
    sheet.innerHTML = "";
    document.body.style.overflow = "";
  }
  function saveCustom() {
    const subject = $("#addSubject").value;
    const type = $("#addType").value;
    const topic = ($("#addTopic").value || "").trim() || "自定义";
    const stem = ($("#addStem").value || "").trim();
    const explain = ($("#addExplain").value || "").trim();
    if (!stem) { toast("题干不能为空", true); return; }
    let options = [];
    let answer = [];
    let answerText = "";
    if (type === "short") {
      answerText = ($("#addAnswerText").value || "").trim();
      if (!answerText) { toast("简答题需要参考答案", true); return; }
    } else {
      options = $$(".add-opt").map((el) => el.value.trim()).filter(Boolean);
      if (options.length < 2) { toast("至少填 2 个选项", true); return; }
      const raw = ($("#addAnswer").value || "").toUpperCase().replace(/[^A-F]/g, "");
      const idx = Array.from(new Set(raw.split(""))).map((x) => "ABCDEF".indexOf(x))
        .filter((i) => i >= 0 && i < options.length).sort((a, b) => a - b);
      if (!idx.length) { toast("答案要填 A/B/C/D", true); return; }
      if (type === "choice" && idx.length !== 1) { toast("单选题只能有一个答案", true); return; }
      answer = idx;
    }
    const q = {
      id: "c-" + Date.now().toString(36),
      subject, topic, type, difficulty: 2, stem, options, answer, answerText, explain,
      source: "App 手动加题", custom: true
    };
    state.custom.push(q);
    saveState();
    closeSheet();
    toast("已加入题库");
    if (route === "bank") render();
  }
  function customMarkdown() {
    return state.custom.map((q) => {
      const lines = ["```quiz", `id: ${q.id}`, `topic: ${q.topic}`, `type: ${q.type}`];
      if (q.type !== "short") {
        lines.push("options:");
        q.options.forEach((o) => lines.push("  - " + o.replace(/\n/g, " ")));
        lines.push("answer: " + q.answer.map((i) => "ABCDEF"[i]).join(","));
      } else {
        lines.push("answer: |");
        String(q.answerText || "").split("\n").forEach((l) => lines.push("  " + l));
      }
      if (q.explain) {
        lines.push("explain: |");
        String(q.explain).split("\n").forEach((l) => lines.push("  " + l));
      }
      lines.push("source: App 手动加题");
      lines.push("```");
      return lines.join("\n");
    }).join("\n\n");
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制到剪贴板");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("已复制到剪贴板"); }
      catch (err) { toast("复制失败，请手动选择", true); }
      ta.remove();
    }
  }
  function exportCustom() {
    if (!state.custom.length) { toast("还没有手动加题"); return; }
    copyText(customMarkdown());
  }

  const AI_PROMPT = [
    "你是一名考研命题老师，为 2028 浙江大学工程师学院控制工程单考出题。",
    "请根据我提供的笔记，生成 5-8 道手机刷题用的题。",
    "",
    "只输出 quiz 代码块，不要解释、不要标题。格式：",
    "```quiz",
    "id: 前缀-三位数字",
    "topic: 知识点",
    "type: choice",
    "difficulty: 2",
    "stem: 题干",
    "options:",
    "  - 选项1",
    "  - 选项2",
    "  - 选项3",
    "  - 选项4",
    "answer: C",
    "explain: 为什么对，其他选项错在哪",
    "source: 来源",
    "```",
    "",
    "规则：一题一考点；选项互斥；答案 A/B/C/D 分布均衡；数学用 Unicode（lim(x→0)、∫、ζ）；",
    "不确定的题加 status: draft；不要编造官方数据/年份/人物。",
    "前缀：数学 m、自控 a、伦理 e、逻辑 l、英语 en、马原 p、电气 el。",
    "",
    "【我的笔记】",
    "（把笔记粘在这里）"
  ].join("\n");
  function copyAIPrompt() {
    copyText(AI_PROMPT);
  }

  /* ---------------- export / import ---------------- */
  function exportData() {
    const data = { ...state, exportedAt: new Date().toISOString(), app: APP_VERSION };
    const name = `考研刷题进度-${todayStr()}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let file = null;
    try { file = new File([blob], name, { type: "application/json" }); } catch (e) { /* old browser */ }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "考研刷题进度" })
        .then(() => toast("已分享：选择「存储到文件」存进 iCloud"))
        .catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast("已导出：在「文件」里存到 iCloud");
  }
  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (!data || typeof data !== "object" || !data.cards) throw new Error("bad file");
        if (!confirm("导入会覆盖当前进度，确定？")) return;
        const d = defaultState();
        state = {
          ...d, ...data,
          settings: { ...d.settings, ...(data.settings || {}) },
          daily: { ...d.daily, ...(data.daily || {}) },
          streak: { ...d.streak, ...(data.streak || {}) },
          cards: data.cards || {},
          log: Array.isArray(data.log) ? data.log : [],
          custom: Array.isArray(data.custom) ? data.custom : []
        };
        ensureDaily();
        saveState();
        applyTheme();
        go("today");
        toast("已导入");
      } catch (e) {
        toast("文件格式不对，需要导出的 JSON", true);
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- theme ---------------- */
  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme === "light" ? "light" : "dark";
    document.documentElement.dataset.commute = state.settings.commute ? "1" : "0";
    document.documentElement.style.setProperty("--q-size", (state.settings.fontSize || 17) + "px");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.settings.theme === "light" ? "#f3efe5" : "#070b14");
  }
  function toggleTheme() {
    state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
    saveState();
    applyTheme();
    render();
  }

  /* ---------------- toast ---------------- */
  let toastTimer = null;
  function toast(msg, bad) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("bad", !!bad);
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ---------------- events ---------------- */
  function onClick(e) {
    const tab = e.target.closest(".tab");
    if (tab) { go(tab.dataset.route); return; }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    switch (a) {
      case "toggle-theme": toggleTheme(); break;
      case "start-daily": startSession({ mode: "daily" }); break;
      case "start-random": startSession({ mode: "random", limit: 20 }); break;
      case "start-due": startSession({ mode: "due", limit: 40 }); break;
      case "start-wrong": startSession({ mode: "wrong" }); break;
      case "start-subject": startSession({ mode: "subject", subject: el.dataset.subject }); break;
      case "open-question": startSession({ ids: [el.dataset.id], mode: "single" }); break;
      case "open-add": openAddSheet(); break;
      case "close-sheet": closeSheet(); break;
      case "save-custom": saveCustom(); break;
      case "export-custom": exportCustom(); break;
      case "toggle-commute":
        state.settings.commute = !state.settings.commute;
        saveState();
        applyTheme();
        render();
        toast(state.settings.commute ? "通勤模式已开" : "通勤模式已关");
        break;
      case "toggle-auto":
        state.settings.autoNext = !state.settings.autoNext;
        saveState();
        render();
        break;
      case "export": exportData(); break;
      case "copy-ai-prompt": copyAIPrompt(); break;
      case "go-learn": closeNodeSheet(); go("learn"); break;
      case "go-bank": go("bank"); break;
      case "learn-subject": learnSubject = el.dataset.subject; learnQuery = ""; render(); break;
      case "open-node": openNodeSheet(el.dataset.id); break;
      case "close-node": closeNodeSheet(); break;
      case "set-node-status": setNodeStatusAction(el.dataset.id, Number(el.dataset.status)); break;
      case "start-node": startNodeQuestions(el.dataset.id); break;
      case "continue-learn": { const n = continueNode(); if (n) openNodeSheet(n.id); break; }
      case "import": { const f = $("#importFile"); if (f) f.click(); break; }
      case "reset":
        if (confirm("清空所有刷题进度？建议先导出。")) {
          localStorage.removeItem(STORE_KEY);
          state = defaultState();
          saveState();
          applyTheme();
          go("today");
          toast("已清空");
        }
        break;
      case "install-tip":
        toast(isStandalone() ? "已经安装；直接添加到主屏幕即可" : "Safari 底部中间「分享」→ 向下滑 → 添加到主屏幕");
        break;
      case "filter-subject":
        bankFilter.subject = el.dataset.subject;
        render();
        break;
      case "close-practice": closePractice(); break;
      case "select-option": {
        if (!session || session.submitted) break;
        const i = Number(el.dataset.i);
        const q = currentQuestion();
        if (!q) break;
        if (q.type === "multi") {
          const at = session.selected.indexOf(i);
          if (at >= 0) session.selected.splice(at, 1);
          else session.selected.push(i);
        } else {
          session.selected = [i];
        }
        renderPractice();
        break;
      }
      case "submit-answer": submitChoice(); break;
      case "next-question": nextQuestion(); break;
      case "reveal-answer": revealAnswer(); break;
      case "self-grade": selfGrade(el.dataset.grade); break;
      case "star": {
        const q = currentQuestion();
        if (!q) break;
        const c = getCard(q.id);
        c.starred = !c.starred;
        saveState();
        renderPractice();
        break;
      }
      case "speak": speakQuestion(); break;
      case "session-again": {
        if (session && session.mode === "node") {
          startSession({ ids: session.queue.map((q) => q.id), mode: "node" });
          break;
        }
        const mode = session && (session.mode === "single" || session.mode === "random") ? "random" : "daily";
        const subject = session ? session.subject : null;
        startSession({ mode, subject, limit: mode === "random" ? 10 : null });
        break;
      }
      case "session-close": {
        const back = session && session.mode === "node" ? "learn" : "today";
        closePractice();
        go(back);
        break;
      }
      default: break;
    }
  }
  function onInput(e) {
    const t = e.target;
    if (!t) return;
    if (t.id === "bankSearch") {
      bankFilter.query = t.value.trim();
      renderBankList();
      return;
    }
    if (t.id === "learnSearch") {
      learnQuery = t.value.trim();
      renderLearnList();
      return;
    }
    if (t.id === "dailyNew") {
      state.settings.dailyNew = Number(t.value);
      const out = $("#dailyNewVal"); if (out) out.textContent = t.value;
      saveState();
      return;
    }
    if (t.id === "dailyReview") {
      state.settings.dailyReview = Number(t.value);
      const out = $("#dailyReviewVal"); if (out) out.textContent = t.value;
      saveState();
      return;
    }
    if (t.id === "fontSize") {
      state.settings.fontSize = Number(t.value);
      const out = $("#fontSizeVal"); if (out) out.textContent = t.value;
      document.documentElement.style.setProperty("--q-size", t.value + "px");
      saveState();
      return;
    }
    if (t.id === "examDate") {
      state.settings.examDate = t.value || DEFAULT_EXAM;
      saveState();
      const d = $("#dday"); if (d) d.textContent = ddayLabel();
      return;
    }
    if (t.id === "shortAnswer") {
      if (session) session.shortText = t.value;
      return;
    }
  }
  function onChange(e) {
    const t = e.target;
    if (!t) return;
    if (t.id === "importFile") {
      const f = t.files && t.files[0];
      if (f) importData(f);
      t.value = "";
      return;
    }
    if (t.id === "addType") {
      const short = t.value === "short";
      $$(".only-short").forEach((el) => { el.style.display = short ? "" : "none"; });
      $$(".only-choice").forEach((el) => { el.style.display = short ? "none" : ""; });
    }
  }

  /* ---------------- demo (only via ?demo=) ---------------- */
  function seedDemo(kind) {
    // 防止误点 ?demo= 覆盖真实进度；测试时加 &force=1
    const hasState = !!localStorage.getItem(STORE_KEY);
    const force = new URLSearchParams(location.search).has("force");
    if (hasState && !force) return;
    state = defaultState();
    const qs = DB.questions;
    const n = Math.min(55, qs.length);
    for (let i = 0; i < n; i++) {
      const q = qs[i];
      const c = getCard(q.id);
      c.seen = 1 + (i % 5);
      c.correct = Math.max(0, c.seen - (i % 3 === 0 ? 1 : 0));
      c.wrong = i % 3 === 0 ? 1 : 0;
      c.lastOk = i % 4 !== 0;
      c.ease = 2.3 + (i % 3) * 0.1;
      c.interval = [1, 3, 7, 14][i % 4];
      c.due = addDays(todayStr(), (i % 7) - 3);
      c.last = addDays(todayStr(), -(i % 10));
      c.starred = i % 9 === 0;
    }
    for (let d = 13; d >= 0; d--) {
      const day = addDays(todayStr(), -d);
      const count = d === 0 ? 7 : (d * 3) % 14 + 2;
      for (let j = 0; j < count; j++) {
        const q = qs[(d * 5 + j) % qs.length];
        state.log.push({ t: parseDate(day).getTime() + j * 60000, id: q.id, ok: (d + j) % 4 === 0 ? 0 : 1 });
      }
    }
    state.daily = { date: todayStr(), answered: 12, correct: 9, seconds: 1680, newCount: 5, reviewCount: 7 };
    state.streak = { last: todayStr(), days: 6, best: 9 };
    state.settings.commute = true;
    saveState();
    if (["stats", "bank", "wrong"].indexOf(kind) >= 0) route = kind;
  }

  /* ---------------- service worker ---------------- */
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    const doRegister = () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    };
    // init 里的 fetch 可能晚于 load 事件；已 complete 就立即注册
    if (document.readyState === "complete") doRegister();
    else window.addEventListener("load", doRegister, { once: true });
  }

  /* ---------------- init ---------------- */
  async function init() {
    state = loadState();
    applyTheme();
    try {
      DB = await loadQuestions();
    } catch (e) {
      $("#view").innerHTML = `<div class="empty" style="margin-top:18vh"><div class="big">!</div><b>题库没加载出来</b>请通过本地服务器/部署地址打开；或使用单文件版 <code>考研刷题.html</code>。<br><span class="tiny">${esc(e.message || e)}</span></div>`;
      return;
    }
    if (!DB.questions.length) {
      $("#view").innerHTML = `<div class="empty" style="margin-top:18vh"><div class="big">0</div><b>题库为空</b>先在 Obsidian 的 <code>60-题库</code> 写题，再运行构建。</div>`;
      return;
    }
    try {
      KDB = await loadKnowledge();
    } catch (e) {
      KDB = { nodes: [], subjects: {} };
    }
    ensureDaily();
    const params = new URLSearchParams(location.search);
    const demo = params.get("demo");
    if (demo) seedDemo(demo);
    applyTheme();
    const rp = params.get("route");
    if (rp && ["today", "learn", "bank", "wrong", "stats", "me"].indexOf(rp) >= 0) route = rp;
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    go(route || "today");
    if (demo === "practice") startSession({ mode: "daily" });
    registerSW();
  }

  init();
})();
