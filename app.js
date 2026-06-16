const STORAGE_KEY = "lifequest_ai_save_v1";

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

const assessmentSteps = [
  [
    {
      id: "areas",
      label: "What areas of life feel stuck, flowing, or unclear?",
      helper: "Name the domains: study, career, health, money, relationships, identity, creativity, spirituality.",
      placeholder: "Example: Career feels unclear, gym is flowing, friendships feel neglected..."
    },
    {
      id: "energy",
      label: "What activities currently energize you vs. drain you?",
      helper: "Look for Adlerian clues: where do you feel useful, courageous, connected, or avoidant?",
      placeholder: "Energize: building projects, training, deep talks. Drain: vague tasks, doomscrolling..."
    }
  ],
  [
    {
      id: "avoid",
      label: "What future outcome would you fight to avoid?",
      helper: "This is your negative vision: the future that becomes likely if nothing changes.",
      placeholder: "Example: Becoming passive, financially dependent, unhealthy, and disconnected..."
    },
    {
      id: "spark",
      label: "What new information, people, or experiences recently sparked your interest?",
      helper: "Greek philosophy clue: what seems worth contemplating and practicing?",
      placeholder: "Example: startups, investing, AI agents, boxing, a professor, a book..."
    }
  ],
  [
    {
      id: "curiosity",
      label: "What are you genuinely curious about even when no one rewards you?",
      helper: "Flow clue: curiosity survives without grades, likes, or applause.",
      placeholder: "Example: markets, software systems, human behavior, strength training..."
    },
    {
      id: "skills",
      label: "Which skills do you enjoy developing?",
      helper: "Think of abilities you would train even when you are still bad at them.",
      placeholder: "Example: coding, financial modeling, public speaking, writing, discipline..."
    }
  ],
  [
    {
      id: "impact",
      label: "What meaningful impact would make this journey feel worthwhile?",
      helper: "Adlerian clue: contribution, usefulness, courage, and belonging.",
      placeholder: "Example: Build tools that help people make better financial decisions..."
    },
    {
      id: "environment",
      label: "In what environments do you thrive?",
      helper: "Include places, people, time of day, pressure level, structure, and rituals.",
      placeholder: "Example: Quiet mornings, ambitious peers, clear deadlines, gym after study..."
    }
  ],
  [
    {
      id: "boundaries",
      label: "What boundaries or values must your game never violate?",
      helper: "These become game rules. They protect the player from false quests.",
      placeholder: "Example: No sacrificing health for grades. No pretending to want what I don't want..."
    },
    {
      id: "reward",
      label: "What rewards feel meaningful without corrupting the mission?",
      helper: "Use rewards that reinforce identity: mastery, recovery, connection, beauty, adventure.",
      placeholder: "Example: A café workday, a long walk, new book, trip, social dinner..."
    }
  ]
];

const defaultState = {
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  playerName: "Player",
  assessmentStep: 0,
  assessment: {},
  phase: "Unknown",
  xp: 0,
  level: 1,
  streak: 0,
  lastCheckinDate: null,
  stats: [
    { id: makeId(), name: "Clarity", value: 1, description: "Knowing the next meaningful move." },
    { id: makeId(), name: "Courage", value: 1, description: "Acting before certainty arrives." },
    { id: makeId(), name: "Discipline", value: 1, description: "Keeping promises to your future self." },
    { id: makeId(), name: "Connection", value: 1, description: "Building belonging and contribution." }
  ],
  game: {
    mainQuest: "",
    negativeVision: "",
    impact: "",
    rules: "",
    rewards: "",
    environment: "",
    sideQuests: [
      { id: makeId(), title: "Body: build a reliable training rhythm", domain: "Body" },
      { id: makeId(), title: "Mind: protect deep work blocks", domain: "Mind" },
      { id: makeId(), title: "Relationships: invest in high-quality allies", domain: "Relationships" }
    ]
  },
  quests: [],
  checkins: []
};

let state = loadState();
let currentQuestFilter = "active";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneState(defaultState);
    const parsed = JSON.parse(raw);
    return mergeState(cloneState(defaultState), parsed);
  } catch (error) {
    console.warn("Could not load save. Starting fresh.", error);
    return cloneState(defaultState);
  }
}

function mergeState(base, incoming) {
  return {
    ...base,
    ...incoming,
    assessment: { ...base.assessment, ...(incoming.assessment || {}) },
    game: { ...base.game, ...(incoming.game || {}) },
    stats: incoming.stats || base.stats,
    quests: incoming.quests || base.quests,
    checkins: incoming.checkins || base.checkins
  };
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
  const indicator = document.getElementById("saveIndicator");
  indicator.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  indicator.classList.add("flash");
  setTimeout(() => indicator.classList.remove("flash"), 800);
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === viewId));
  if (viewId === "assessment") renderAssessment();
  if (viewId === "gameDesign") renderGameDesign();
  if (viewId === "quests") renderQuestLog();
  renderDashboard();
}

function words(text = "") {
  return String(text).toLowerCase();
}

function scorePhase() {
  const all = Object.values(state.assessment).join(" ").toLowerCase();
  const scores = { Limbo: 0, Vision: 0, Flow: 0, Resistance: 0 };

  const limboTerms = ["unclear", "confused", "lost", "stuck", "directionless", "don't know", "dont know", "unsure", "vague"];
  const visionTerms = ["interested", "curious", "spark", "want", "building", "learn", "explore", "future", "goal"];
  const flowTerms = ["flow", "energize", "momentum", "focused", "deep work", "progress", "alive", "excited"];
  const resistanceTerms = ["plateau", "bored", "avoid", "clinging", "past", "comfortable", "same", "stagnant"];

  limboTerms.forEach(t => { if (all.includes(t)) scores.Limbo += 2; });
  visionTerms.forEach(t => { if (all.includes(t)) scores.Vision += 1.5; });
  flowTerms.forEach(t => { if (all.includes(t)) scores.Flow += 2; });
  resistanceTerms.forEach(t => { if (all.includes(t)) scores.Resistance += 2; });

  if (state.assessment.areas && state.assessment.energy) scores.Vision += 1;
  if (state.assessment.spark && state.assessment.curiosity) scores.Vision += 2;
  if (state.assessment.energy && words(state.assessment.energy).includes("energ")) scores.Flow += 1;
  if (state.assessment.avoid && words(state.assessment.avoid).length > 30) scores.Vision += 1;

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!all.trim()) return { phase: "Unknown", scores };
  if (winner[1] === 0) return { phase: "Limbo", scores };
  return { phase: winner[0], scores };
}

function phaseDescription(phase) {
  const descriptions = {
    Unknown: "Answer the assessment to reveal your current phase.",
    Limbo: "You are in the fog stage: uncertainty is high, but the quest is not to force certainty. The quest is to collect signals.",
    Vision: "A direction is emerging. Your job is to turn sparks into structured experiments and avoid overplanning.",
    Flow: "You have momentum. Protect the conditions that create deep engagement and increase challenge carefully.",
    Resistance: "A previous strategy may have expired. The quest is to release old identity armor and test a new edge."
  };
  return descriptions[phase] || descriptions.Unknown;
}

function renderAssessment() {
  const form = document.getElementById("assessmentForm");
  const step = assessmentSteps[state.assessmentStep];
  form.innerHTML = step.map(q => `
    <div class="question-card">
      <label for="assessment-${q.id}">${q.label}</label>
      <p>${q.helper}</p>
      <textarea id="assessment-${q.id}" data-assessment-id="${q.id}" placeholder="${q.placeholder}">${state.assessment[q.id] || ""}</textarea>
    </div>
  `).join("");

  form.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      state.assessment[event.target.dataset.assessmentId] = event.target.value;
      const result = scorePhase();
      state.phase = result.phase;
      saveState();
      renderPhaseAnalysis(result);
      renderDashboard();
    });
  });

  const total = assessmentSteps.length;
  document.getElementById("stepCounter").textContent = `Step ${state.assessmentStep + 1} / ${total}`;
  document.getElementById("wizardProgressBar").style.width = `${((state.assessmentStep + 1) / total) * 100}%`;
  document.getElementById("prevStepBtn").disabled = state.assessmentStep === 0;
  document.getElementById("nextStepBtn").textContent = state.assessmentStep === total - 1 ? "Finish assessment" : "Next";
  renderPhaseAnalysis(scorePhase());
}

function renderPhaseAnalysis(result = scorePhase()) {
  state.phase = result.phase;
  const output = document.getElementById("phaseAnalysisOutput");
  const scores = Object.entries(result.scores)
    .map(([name, value]) => `<div class="stat"><strong>${name}</strong><small>${Number(value).toFixed(1)} signal score</small></div>`)
    .join("");

  output.innerHTML = `
    <div class="callout"><strong>Current read: ${result.phase}</strong><br>${phaseDescription(result.phase)}</div>
    <div class="stat-grid">${scores}</div>
    <p><strong>Evidence to watch:</strong> stuck/unclear language points toward Limbo; sparks and desired skills point toward Vision; energizing repetition points toward Flow; plateau, boredom, or clinging to old wins points toward Resistance.</p>
  `;
}

function generateDesignFromAssessment() {
  const a = state.assessment;
  const phase = scorePhase().phase;
  state.phase = phase;

  const curiosity = a.curiosity || a.spark || "the domains that repeatedly catch your attention";
  const skills = a.skills || "the skills you enjoy practicing";
  const impact = a.impact || "make a contribution that feels useful, courageous, and genuinely yours";
  const environment = a.environment || "environments with clear structure, strong peers, and enough challenge to create flow";

  state.game.negativeVision = a.avoid || state.game.negativeVision || "Drifting into a future built by avoidance, vague goals, and other people's expectations.";
  state.game.impact = impact;
  state.game.environment = environment;
  state.game.rules = a.boundaries || state.game.rules || "No zero-days. Do not trade long-term health for short-term approval. Choose courage over vague comfort.";
  state.game.rewards = a.reward || state.game.rewards || "Rewards should reinforce identity: recovery, mastery, connection, adventure, and beauty.";
  state.game.mainQuest = `Move from ${phase} into a self-authored life by turning ${curiosity} and ${skills} into weekly experiments that create ${impact}.`;

  const inferredSideQuests = [
    { title: `Clarity: run one small experiment around ${curiosity}`, domain: "Mind" },
    { title: `Mastery: practice ${skills} with a measurable weekly output`, domain: "Career" },
    { title: `Contribution: take one action that supports ${impact}`, domain: "Relationships" }
  ];
  state.game.sideQuests = inferredSideQuests.map(q => ({ id: makeId(), ...q }));

  seedTutorialQuests();
  saveState();
  renderGameDesign();
  renderDashboard();
}

function seedTutorialQuests() {
  if (state.quests.some(q => q.tutorial)) return;
  const today = new Date();
  const inThree = new Date(today); inThree.setDate(today.getDate() + 3);
  const inSeven = new Date(today); inSeven.setDate(today.getDate() + 7);

  state.quests.push(
    {
      id: makeId(),
      title: "Tutorial: 20-minute signal hunt",
      domain: "Mind",
      xp: 10,
      due: toDateInput(inThree),
      why: "Collect evidence: what creates energy, avoidance, courage, and curiosity?",
      completed: false,
      tutorial: true,
      createdAt: new Date().toISOString()
    },
    {
      id: makeId(),
      title: "Tutorial: one edge-of-unknown experiment",
      domain: "Career",
      xp: 25,
      due: toDateInput(inSeven),
      why: "Take one small action that tests the emerging direction without requiring life certainty.",
      completed: false,
      tutorial: true,
      createdAt: new Date().toISOString()
    }
  );
}

function renderGameDesign() {
  const mapping = [
    ["mainQuestInput", "mainQuest"],
    ["negativeVisionInput", "negativeVision"],
    ["impactInput", "impact"],
    ["rulesInput", "rules"],
    ["rewardsInput", "rewards"],
    ["environmentInput", "environment"]
  ];
  mapping.forEach(([elementId, key]) => {
    const element = document.getElementById(elementId);
    element.value = state.game[key] || "";
    element.oninput = () => {
      state.game[key] = element.value;
      saveState();
      renderDashboard();
    };
  });
  renderStatsEditor();
  renderSideQuestEditor();
}

function renderStatsEditor() {
  const container = document.getElementById("statsEditor");
  container.innerHTML = state.stats.map(stat => `
    <div class="editor-row" data-stat-id="${stat.id}">
      <div>
        <input value="${escapeHtml(stat.name)}" data-stat-name="${stat.id}" aria-label="Stat name" />
        <input value="${escapeHtml(stat.description || "")}" data-stat-description="${stat.id}" aria-label="Stat description" />
        <label>Value: <input type="range" min="1" max="10" value="${stat.value}" data-stat-value="${stat.id}" /></label>
      </div>
      <button class="tiny" data-remove-stat="${stat.id}" type="button">Remove</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-stat-name]").forEach(input => input.addEventListener("input", e => updateStat(e.target.dataset.statName, { name: e.target.value })));
  container.querySelectorAll("[data-stat-description]").forEach(input => input.addEventListener("input", e => updateStat(e.target.dataset.statDescription, { description: e.target.value })));
  container.querySelectorAll("[data-stat-value]").forEach(input => input.addEventListener("input", e => updateStat(e.target.dataset.statValue, { value: Number(e.target.value) })));
  container.querySelectorAll("[data-remove-stat]").forEach(btn => btn.addEventListener("click", e => {
    state.stats = state.stats.filter(s => s.id !== e.target.dataset.removeStat);
    saveState();
    renderGameDesign();
    renderDashboard();
  }));
}

function updateStat(id, patch) {
  state.stats = state.stats.map(stat => stat.id === id ? { ...stat, ...patch } : stat);
  saveState();
  renderDashboard();
}

function renderSideQuestEditor() {
  const container = document.getElementById("sideQuestEditor");
  container.innerHTML = state.game.sideQuests.map(q => `
    <div class="editor-row" data-side-id="${q.id}">
      <div>
        <input value="${escapeHtml(q.title)}" data-side-title="${q.id}" aria-label="Side quest title" />
        <input value="${escapeHtml(q.domain || "")}" data-side-domain="${q.id}" aria-label="Side quest domain" />
      </div>
      <button class="tiny" data-remove-side="${q.id}" type="button">Remove</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-side-title]").forEach(input => input.addEventListener("input", e => updateSideQuest(e.target.dataset.sideTitle, { title: e.target.value })));
  container.querySelectorAll("[data-side-domain]").forEach(input => input.addEventListener("input", e => updateSideQuest(e.target.dataset.sideDomain, { domain: e.target.value })));
  container.querySelectorAll("[data-remove-side]").forEach(btn => btn.addEventListener("click", e => {
    state.game.sideQuests = state.game.sideQuests.filter(q => q.id !== e.target.dataset.removeSide);
    saveState();
    renderGameDesign();
  }));
}

function updateSideQuest(id, patch) {
  state.game.sideQuests = state.game.sideQuests.map(q => q.id === id ? { ...q, ...patch } : q);
  saveState();
}

function renderDashboard() {
  const result = scorePhase();
  state.phase = result.phase;
  document.getElementById("phasePill").textContent = `Phase: ${state.phase}`;
  document.getElementById("levelNumber").textContent = state.level;
  const xpInLevel = state.xp % 100;
  document.getElementById("xpText").textContent = `${xpInLevel} / 100 XP`;
  document.getElementById("xpBar").style.width = `${xpInLevel}%`;
  document.getElementById("streakText").textContent = `${state.streak} day streak`;
  document.getElementById("mainQuestText").textContent = state.game.mainQuest || "No main quest created yet.";
  document.getElementById("negativeVisionText").textContent = state.game.negativeVision ? `Fighting to avoid: ${state.game.negativeVision}` : "Negative vision not defined.";
  document.getElementById("heroTitle").textContent = state.game.mainQuest ? `Level ${state.level} ${state.phase} Adventurer` : "Welcome, Player.";
  document.getElementById("heroSubtitle").textContent = phaseDescription(state.phase);

  document.getElementById("statGrid").innerHTML = state.stats.map(stat => `
    <div class="stat">
      <strong>${escapeHtml(stat.name)} · ${stat.value}/10</strong>
      <div class="progress"><div style="width: ${stat.value * 10}%"></div></div>
      <small>${escapeHtml(stat.description || "")}</small>
    </div>
  `).join("");

  const today = new Date();
  const active = state.quests
    .filter(q => !q.completed)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 3);
  document.getElementById("todayQuestList").innerHTML = active.map(renderQuestCard).join("");
  attachQuestActions(document.getElementById("todayQuestList"));

  document.getElementById("recentNarrative").innerHTML = state.checkins.slice(-4).reverse().map(c => `
    <div class="timeline-item"><strong>${new Date(c.createdAt).toLocaleDateString()}</strong><br>${escapeHtml(c.narrative)}</div>
  `).join("");
}

function openQuestCreator() {
  document.getElementById("questTitle").value = "";
  document.getElementById("questDomain").value = "Mind";
  document.getElementById("questDifficulty").value = "25";
  document.getElementById("questDue").value = toDateInput(new Date());
  document.getElementById("questWhy").value = "";
  document.getElementById("questDialog").showModal();
}

function saveQuestFromForm(event) {
  event.preventDefault();
  const title = document.getElementById("questTitle").value.trim();
  if (!title) return;
  state.quests.push({
    id: makeId(),
    title,
    domain: document.getElementById("questDomain").value,
    xp: Number(document.getElementById("questDifficulty").value),
    due: document.getElementById("questDue").value,
    why: document.getElementById("questWhy").value.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveState();
  document.getElementById("questDialog").close();
  renderQuestLog();
  renderDashboard();
}

function renderQuestLog() {
  const container = document.getElementById("questLog");
  const quests = state.quests
    .filter(q => currentQuestFilter === "all" ? true : currentQuestFilter === "completed" ? q.completed : !q.completed)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.due || "9999").localeCompare(b.due || "9999"));
  container.innerHTML = quests.map(renderQuestCard).join("");
  attachQuestActions(container);
}

function renderQuestCard(q) {
  return `
    <article class="quest-card" data-quest-id="${q.id}">
      <div class="quest-top">
        <div>
          <div class="quest-title">${q.completed ? "✓ " : ""}${escapeHtml(q.title)}</div>
          <div class="quest-meta">
            <span>${escapeHtml(q.domain || "General")}</span>
            <span>${q.xp || 10} XP</span>
            ${q.due ? `<span>Due ${q.due}</span>` : ""}
            ${q.tutorial ? `<span>Tutorial</span>` : ""}
          </div>
        </div>
        <span class="pill">${q.completed ? "Completed" : "Active"}</span>
      </div>
      ${q.why ? `<p class="muted">${escapeHtml(q.why)}</p>` : ""}
      <div class="quest-actions">
        ${!q.completed ? `<button class="primary tiny" data-complete-quest="${q.id}">Complete</button>` : `<button class="secondary tiny" data-reopen-quest="${q.id}">Reopen</button>`}
        <button class="secondary tiny" data-delete-quest="${q.id}">Delete</button>
      </div>
    </article>
  `;
}

function attachQuestActions(container) {
  container.querySelectorAll("[data-complete-quest]").forEach(btn => btn.addEventListener("click", () => completeQuest(btn.dataset.completeQuest)));
  container.querySelectorAll("[data-reopen-quest]").forEach(btn => btn.addEventListener("click", () => reopenQuest(btn.dataset.reopenQuest)));
  container.querySelectorAll("[data-delete-quest]").forEach(btn => btn.addEventListener("click", () => deleteQuest(btn.dataset.deleteQuest)));
}

function completeQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.completed) return;
  quest.completed = true;
  quest.completedAt = new Date().toISOString();
  state.xp += quest.xp || 10;
  state.level = Math.floor(state.xp / 100) + 1;
  bumpStatForDomain(quest.domain);
  updateStreak();
  state.checkins.push({
    id: makeId(),
    createdAt: new Date().toISOString(),
    narrative: `Completed “${quest.title}.” This is evidence that the character can act before certainty is perfect.`
  });
  saveState();
  renderQuestLog();
  renderDashboard();
}

function reopenQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) return;
  quest.completed = false;
  delete quest.completedAt;
  saveState();
  renderQuestLog();
  renderDashboard();
}

function deleteQuest(id) {
  state.quests = state.quests.filter(q => q.id !== id);
  saveState();
  renderQuestLog();
  renderDashboard();
}

function bumpStatForDomain(domain = "") {
  const lower = domain.toLowerCase();
  const priorities = lower.includes("body") ? ["Discipline", "Courage"]
    : lower.includes("relationship") ? ["Connection", "Courage"]
    : lower.includes("career") || lower.includes("finance") ? ["Discipline", "Clarity"]
    : ["Clarity", "Discipline"];
  for (const name of priorities) {
    const stat = state.stats.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (stat && stat.value < 10) { stat.value += 1; return; }
  }
}

function updateStreak() {
  const today = toDateInput(new Date());
  if (state.lastCheckinDate === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  state.streak = state.lastCheckinDate === toDateInput(yesterday) ? state.streak + 1 : 1;
  state.lastCheckinDate = today;
}

function generateCoaching() {
  const progress = document.getElementById("coachProgress").value.trim();
  const stateChoice = document.getElementById("coachState").value;
  const obstacle = document.getElementById("coachObstacle").value.trim();
  const phase = scorePhase().phase;

  let guidance = "";
  let calibration = "";
  let immediateQuest = null;

  if (stateChoice === "stuck") {
    guidance = "Treat this as a blocked door, not a failed story. The pattern to inspect is whether the quest is too vague, too big, or disconnected from your real desire.";
    calibration = "Lower the difficulty until the next action can be completed in 15–25 minutes.";
    immediateQuest = { title: "Obstacle scan: write the next physical action", domain: "Mind", xp: 10, why: "Turn the block into one visible move." };
  } else if (stateChoice === "progressing") {
    guidance = "You have momentum. Protect the conditions that created it before adding more ambition.";
    calibration = "Increase challenge by roughly 10–20%, not 100%. Add one edge quest, not five.";
    immediateQuest = { title: "Level-up: add one measurable output", domain: "Career", xp: 25, why: "Convert momentum into proof." };
  } else if (stateChoice === "overwhelmed") {
    guidance = "The game difficulty is too high. This is not weakness; it is bad quest design. Shrink the battlefield.";
    calibration = "Keep only one daily priority, one recovery ritual, and one optional bonus quest.";
    immediateQuest = { title: "Minimum viable day: one non-zero action", domain: "Mind", xp: 10, why: "Rebuild agency without overload." };
  } else if (stateChoice === "bored") {
    guidance = "Boredom often means the quest no longer reaches the edge of your unknown. Add novelty, stakes, or a public artifact.";
    calibration = "Choose a challenge that has a real possibility of failure but does not threaten your foundations.";
    immediateQuest = { title: "Novel edge: publish or show one small output", domain: "Career", xp: 25, why: "Make the quest vivid again." };
  }

  const narrative = `In the ${phase} chapter, the recent update suggests: ${progress || "no update given yet"}. The obstacle/opportunity is: ${obstacle || "not specified"}. ${guidance}`;
  state.checkins.push({
    id: makeId(),
    createdAt: new Date().toISOString(),
    narrative
  });

  if (immediateQuest) {
    const due = new Date(); due.setDate(due.getDate() + 1);
    state.quests.push({
      id: makeId(),
      ...immediateQuest,
      due: toDateInput(due),
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  updateStreak();
  saveState();

  document.getElementById("coachOutput").innerHTML = `
    <div class="callout"><strong>Quest Log Update</strong><br>${escapeHtml(progress || "No update recorded. Your first micro-quest is to record evidence, not judge yourself.")}</div>
    <p><strong>Character Status:</strong> Level ${state.level}, ${phase} phase, ${state.streak}-day streak.</p>
    <p><strong>Quest Guidance:</strong> ${guidance}</p>
    <p><strong>Challenge Calibration:</strong> ${calibration}</p>
    <p><strong>Narrative Development:</strong> ${escapeHtml(narrative)}</p>
    ${immediateQuest ? `<p><strong>New immediate quest added:</strong> ${escapeHtml(immediateQuest.title)}</p>` : ""}
  `;

  renderDashboard();
}

function exportSave() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lifequest-save-${toDateInput(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importSave(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = mergeState(cloneState(defaultState), imported);
      saveState();
      renderAll();
      switchView("dashboard");
      alert("Save imported successfully.");
    } catch (error) {
      alert("Import failed. Please choose a valid LifeQuest JSON save file.");
    }
  };
  reader.readAsText(file);
}

function resetGame() {
  const confirmed = confirm("Reset all LifeQuest data in this browser?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  state = cloneState(defaultState);
  saveState();
  renderAll();
  switchView("dashboard");
}

function toDateInput(date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAll() {
  renderAssessment();
  renderGameDesign();
  renderQuestLog();
  renderDashboard();
}

function init() {
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  document.querySelectorAll("[data-view-jump]").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.viewJump)));
  document.getElementById("startAssessmentBtn").addEventListener("click", () => switchView("assessment"));
  document.getElementById("quickCheckinBtn").addEventListener("click", () => switchView("coach"));
  document.getElementById("prevStepBtn").addEventListener("click", () => {
    state.assessmentStep = Math.max(0, state.assessmentStep - 1);
    saveState();
    renderAssessment();
  });
  document.getElementById("nextStepBtn").addEventListener("click", () => {
    if (state.assessmentStep < assessmentSteps.length - 1) {
      state.assessmentStep += 1;
      saveState();
      renderAssessment();
    } else {
      generateDesignFromAssessment();
      switchView("gameDesign");
    }
  });
  document.getElementById("generateDesignBtn").addEventListener("click", generateDesignFromAssessment);
  document.getElementById("addStatBtn").addEventListener("click", () => {
    state.stats.push({ id: makeId(), name: "New Stat", value: 1, description: "Describe this ability." });
    saveState();
    renderGameDesign();
    renderDashboard();
  });
  document.getElementById("addSideQuestBtn").addEventListener("click", () => {
    state.game.sideQuests.push({ id: makeId(), title: "New side quest", domain: "General" });
    saveState();
    renderGameDesign();
  });
  document.getElementById("openQuestCreatorBtn").addEventListener("click", openQuestCreator);
  document.getElementById("saveQuestBtn").addEventListener("click", saveQuestFromForm);
  document.querySelectorAll(".filter-btn").forEach(btn => btn.addEventListener("click", () => {
    currentQuestFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b === btn));
    renderQuestLog();
  }));
  document.getElementById("generateCoachingBtn").addEventListener("click", generateCoaching);
  document.getElementById("exportBtn").addEventListener("click", exportSave);
  document.getElementById("importInput").addEventListener("change", (e) => e.target.files[0] && importSave(e.target.files[0]));
  document.getElementById("resetBtn").addEventListener("click", resetGame);
  renderAll();
}

init();
