const STORAGE_KEY = "takeit-app-data";
const APP_VERSION = "1.0.0";

const ACHIEVEMENT_DEFINITIONS = [
  { id: "habit_streak_5", name: "五连击", description: "任一习惯连续打卡 5 天", type: "habitStreak", threshold: 5 },
  { id: "habit_streak_10", name: "十连击", description: "任一习惯连续打卡 10 天", type: "habitStreak", threshold: 10 },
  { id: "habit_streak_25", name: "二十五连击", description: "任一习惯连续打卡 25 天", type: "habitStreak", threshold: 25 },
  { id: "habit_streak_50", name: "五十连击", description: "任一习惯连续打卡 50 天", type: "habitStreak", threshold: 50 },
  { id: "habit_streak_100", name: "百日火力", description: "任一习惯连续打卡 100 天", type: "habitStreak", threshold: 100 },
  { id: "task_complete_1", name: "首个终点", description: "完成 1 个任务", type: "completedTasks", threshold: 1 },
  { id: "task_complete_2", name: "双重达成", description: "完成 2 个任务", type: "completedTasks", threshold: 2 },
  { id: "task_complete_3", name: "三线推进", description: "完成 3 个任务", type: "completedTasks", threshold: 3 },
  { id: "task_complete_5", name: "五项全开", description: "完成 5 个任务", type: "completedTasks", threshold: 5 },
  { id: "task_complete_10", name: "十项冲线", description: "完成 10 个任务", type: "completedTasks", threshold: 10 },
  { id: "task_daily_7", name: "七日稳定推进", description: "某一任务连续 7 天每天都有打卡", type: "taskDailyStreak", threshold: 7 },
];

const state = loadState();

const elements = {
  heroSubtitle: document.querySelector("#hero-subtitle"),
  installButton: document.querySelector("#install-button"),
  tabButtons: [...document.querySelectorAll(".tabbar__item")],
  panels: [...document.querySelectorAll(".panel")],

  habitSelect: document.querySelector("#habit-select"),
  habitAddButton: document.querySelector("#habit-add-button"),
  habitEditButton: document.querySelector("#habit-edit-button"),
  habitDeleteButton: document.querySelector("#habit-delete-button"),
  habitEmpty: document.querySelector("#habit-empty"),
  habitContent: document.querySelector("#habit-content"),
  habitTitle: document.querySelector("#habit-title"),
  habitCheckinButton: document.querySelector("#habit-checkin-button"),
  habitTodayStatus: document.querySelector("#habit-today-status"),
  habitHistory: document.querySelector("#habit-history"),
  habitMetrics: document.querySelector("#habit-metrics"),

  taskSelect: document.querySelector("#task-select"),
  taskAddButton: document.querySelector("#task-add-button"),
  taskEditButton: document.querySelector("#task-edit-button"),
  taskDeleteButton: document.querySelector("#task-delete-button"),
  taskEmpty: document.querySelector("#task-empty"),
  taskContent: document.querySelector("#task-content"),
  taskTitle: document.querySelector("#task-title"),
  taskCheckinButton: document.querySelector("#task-checkin-button"),
  taskStatus: document.querySelector("#task-status"),
  taskProgressBar: document.querySelector("#task-progress-bar"),
  taskProgressGlow: document.querySelector("#task-progress-glow"),
  taskProgressPointer: document.querySelector("#task-progress-pointer"),
  taskProgressTrack: document.querySelector("#task-progress-track"),
  taskProgressText: document.querySelector("#task-progress-text"),
  taskProgressPercent: document.querySelector("#task-progress-percent"),

  exportButton: document.querySelector("#export-button"),
  importButton: document.querySelector("#import-button"),
  importInput: document.querySelector("#import-input"),
  bestHabitName: document.querySelector("#best-habit-name"),
  bestHabitCount: document.querySelector("#best-habit-count"),
  achievementList: document.querySelector("#achievement-list"),

  entityDialog: document.querySelector("#entity-dialog"),
  entityForm: document.querySelector("#entity-form"),
  dialogKicker: document.querySelector("#dialog-kicker"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogKind: document.querySelector("#dialog-kind"),
  dialogMode: document.querySelector("#dialog-mode"),
  dialogName: document.querySelector("#dialog-name"),
  dialogTargetWrap: document.querySelector("#dialog-target-wrap"),
  dialogTarget: document.querySelector("#dialog-target"),
  dialogCancel: document.querySelector("#dialog-cancel"),

  metricTemplate: document.querySelector("#metric-template"),
  achievementTemplate: document.querySelector("#achievement-template"),
};

let installPrompt = null;

bootstrap();

function bootstrap() {
  ensureSelections();
  bindEvents();
  syncAchievements();
  render();
  registerServiceWorker();
}

function bindEvents() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  elements.habitSelect.addEventListener("change", (event) => {
    state.settings.selectedHabitId = event.target.value || "";
    persist();
    renderHabits();
  });

  elements.taskSelect.addEventListener("change", (event) => {
    state.settings.selectedTaskId = event.target.value || "";
    persist();
    renderTasks();
  });

  elements.habitAddButton.addEventListener("click", () => openEntityDialog("habit", "create"));
  elements.habitEditButton.addEventListener("click", () => openEntityDialog("habit", "edit"));
  elements.habitDeleteButton.addEventListener("click", deleteHabit);
  elements.habitCheckinButton.addEventListener("click", () => toggleHabitRecord(todayKey()));

  elements.taskAddButton.addEventListener("click", () => openEntityDialog("task", "create"));
  elements.taskEditButton.addEventListener("click", () => openEntityDialog("task", "edit"));
  elements.taskDeleteButton.addEventListener("click", deleteTask);
  elements.taskCheckinButton.addEventListener("click", incrementTask);
  elements.taskProgressTrack.addEventListener("click", editTaskProgress);

  elements.exportButton.addEventListener("click", exportData);
  elements.importButton.addEventListener("click", () => elements.importInput.click());
  elements.importInput.addEventListener("change", importData);

  elements.entityForm.addEventListener("submit", handleEntitySubmit);
  elements.dialogCancel.addEventListener("click", () => elements.entityDialog.close());

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    elements.installButton.hidden = false;
  });

  elements.installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    elements.installButton.hidden = true;
  });
}

function switchTab(tabId) {
  state.settings.activeTab = tabId;
  persist();

  elements.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabId);
  });

  elements.panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabId);
  });

  const subtitles = {
    habits: "习惯页聚焦今天和过去 6 天，让坚持看得见。",
    tasks: "任务页把每一次推进都推向发光的终点。",
    stats: "统计页负责备份、成就和你最硬核的纪录。",
  };
  elements.heroSubtitle.textContent = subtitles[tabId];
}

function render() {
  switchTab(state.settings.activeTab || "habits");
  renderHabits();
  renderTasks();
  renderStats();
}

function renderHabits() {
  const habits = state.habits;
  const selectedHabit = getSelectedHabit();

  elements.habitSelect.innerHTML = "";
  if (habits.length > 0) {
    habits.forEach((habit) => {
      const option = document.createElement("option");
      option.value = habit.id;
      option.textContent = habit.name;
      elements.habitSelect.append(option);
    });
    elements.habitSelect.value = selectedHabit ? selectedHabit.id : "";
  }

  const hasHabits = Boolean(selectedHabit);
  elements.habitEmpty.hidden = hasHabits;
  elements.habitContent.hidden = !hasHabits;
  elements.habitEditButton.disabled = !hasHabits;
  elements.habitDeleteButton.disabled = !hasHabits;
  elements.habitCheckinButton.disabled = !hasHabits;
  elements.habitSelect.disabled = habits.length === 0;

  if (!selectedHabit) {
    return;
  }

  const today = todayKey();
  const todayDone = Boolean(selectedHabit.records[today]);
  elements.habitTitle.textContent = selectedHabit.name;
  elements.habitTodayStatus.textContent = todayDone ? "今日已完成" : "未完成";
  elements.habitTodayStatus.classList.toggle("is-done", todayDone);
  elements.habitCheckinButton.textContent = todayDone ? "取消今日打卡" : "打卡";

  renderHabitHistory(selectedHabit);
  renderHabitMetrics(selectedHabit);
}

function renderHabitHistory(habit) {
  elements.habitHistory.innerHTML = "";
  getRecentSevenDays().forEach((dateKey) => {
    const box = document.createElement("button");
    box.type = "button";
    box.className = "history-box";

    const isToday = dateKey === todayKey();
    const isComplete = Boolean(habit.records[dateKey]);
    if (isToday) {
      box.classList.add("is-today");
    }
    if (isComplete) {
      box.classList.add("is-complete");
    }

    const month = document.createElement("span");
    month.className = "history-box__month";
    month.textContent = formatMonthPart(dateKey);

    const date = document.createElement("strong");
    date.className = "history-box__date";
    date.textContent = formatDayPart(dateKey);

    box.append(month, date);
    box.addEventListener("click", () => toggleHabitRecord(dateKey));
    elements.habitHistory.append(box);
  });
}

function renderHabitMetrics(habit) {
  const metrics = [
    { label: "本周", value: countHabitInRange(habit, startOfWeek(), endOfToday()) },
    { label: "本月", value: countHabitInRange(habit, startOfMonth(), endOfToday()) },
    { label: "今年", value: countHabitInRange(habit, startOfYear(), endOfToday()) },
    { label: "累计", value: countHabitTotal(habit) },
  ];

  elements.habitMetrics.innerHTML = "";
  metrics.forEach((metric) => {
    const fragment = elements.metricTemplate.content.cloneNode(true);
    fragment.querySelector(".metric-card__label").textContent = metric.label;
    fragment.querySelector(".metric-card__value").textContent = metric.value;
    elements.habitMetrics.append(fragment);
  });
}

function renderTasks() {
  const tasks = state.tasks;
  const selectedTask = getSelectedTask();

  elements.taskSelect.innerHTML = "";
  if (tasks.length > 0) {
    tasks.forEach((task) => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = task.name;
      elements.taskSelect.append(option);
    });
    elements.taskSelect.value = selectedTask ? selectedTask.id : "";
  }

  const hasTasks = Boolean(selectedTask);
  elements.taskEmpty.hidden = hasTasks;
  elements.taskContent.hidden = !hasTasks;
  elements.taskEditButton.disabled = !hasTasks;
  elements.taskDeleteButton.disabled = !hasTasks;
  elements.taskCheckinButton.disabled = !hasTasks;
  elements.taskSelect.disabled = tasks.length === 0;

  if (!selectedTask) {
    return;
  }

  const current = selectedTask.currentCount;
  const target = selectedTask.targetCount;
  const rawRatio = target > 0 ? current / target : 0;
  const clampedRatio = Math.max(0, Math.min(rawRatio, 1));
  const percent = Math.round(rawRatio * 100);
  const glowStrength = Math.min(0.35 + clampedRatio * 0.8, 1.15);

  elements.taskTitle.textContent = selectedTask.name;
  elements.taskProgressText.textContent = `${current}/${target}`;
  elements.taskProgressPercent.textContent = `${percent}%`;
  elements.taskStatus.textContent = current >= target ? "已达目标" : "进行中";
  elements.taskStatus.classList.toggle("is-done", current >= target);
  elements.taskProgressBar.style.width = `${clampedRatio * 100}%`;
  elements.taskProgressGlow.style.width = `${clampedRatio * 100}%`;
  elements.taskProgressGlow.style.opacity = String(glowStrength);
  elements.taskProgressPointer.style.left = `${clampedRatio * 100}%`;
  elements.taskProgressPointer.style.borderBottomColor = current >= target ? "#da2727" : "#f54b4b";
  elements.taskProgressPointer.style.filter = `drop-shadow(0 0 ${10 + clampedRatio * 22}px rgba(245, 75, 75, ${0.3 + clampedRatio * 0.4}))`;
}

function renderStats() {
  const best = findBestHabit();
  elements.bestHabitName.textContent = best ? best.name : "暂无";
  elements.bestHabitCount.textContent = best ? String(countHabitTotal(best)) : "0";

  elements.achievementList.innerHTML = "";
  ACHIEVEMENT_DEFINITIONS.forEach((definition) => {
    const achievement = state.achievements[definition.id] || { unlocked: false, unlockedAt: null };
    const fragment = elements.achievementTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".achievement-card");
    const unlocked = achievement.unlocked === true;
    card.classList.toggle("is-unlocked", unlocked);
    fragment.querySelector(".achievement-card__state").textContent = unlocked ? "已解锁" : "未解锁";
    fragment.querySelector(".achievement-card__name").textContent = definition.name;
    fragment.querySelector(".achievement-card__desc").textContent = definition.description;
    fragment.querySelector(".achievement-card__time").textContent = unlocked
      ? `解锁时间 ${formatDateTime(achievement.unlockedAt)}`
      : "继续推进，等你点亮";
    elements.achievementList.append(fragment);
  });
}

function openEntityDialog(kind, mode) {
  const current = kind === "habit" ? getSelectedHabit() : getSelectedTask();
  if (mode === "edit" && !current) {
    return;
  }

  elements.dialogKind.value = kind;
  elements.dialogMode.value = mode;
  elements.dialogKicker.textContent = `${kind === "habit" ? "习惯" : "任务"}${mode === "create" ? "新增" : "修改"}`;
  elements.dialogTitle.textContent = mode === "create" ? `创建${kind === "habit" ? "习惯" : "任务"}` : `修改${kind === "habit" ? "习惯" : "任务"}`;
  elements.dialogTargetWrap.hidden = kind !== "task";
  elements.dialogName.value = current && mode === "edit" ? current.name : "";
  elements.dialogTarget.required = kind === "task";
  elements.dialogTarget.disabled = kind !== "task";
  elements.dialogTarget.value = current && kind === "task" && mode === "edit" ? String(current.targetCount) : "";
  elements.entityDialog.showModal();
}

function handleEntitySubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.entityForm);
  const kind = elements.dialogKind.value;
  const mode = elements.dialogMode.value;
  const name = String(formData.get("name") || "").trim();
  const targetRaw = String(formData.get("target") || "").trim();

  if (!name) {
    alert("名称不能为空");
    return;
  }

  if (kind === "habit") {
    saveHabit(mode, name);
  } else {
    const targetCount = Number.parseInt(targetRaw, 10);
    if (!Number.isInteger(targetCount) || targetCount <= 0) {
      alert("任务总次数必须是大于 0 的整数");
      return;
    }
    saveTask(mode, name, targetCount);
  }

  elements.entityDialog.close();
}

function saveHabit(mode, name) {
  if (mode === "create") {
    const habit = {
      id: createId("habit"),
      name,
      records: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.habits.push(habit);
    state.settings.selectedHabitId = habit.id;
  } else {
    const habit = getSelectedHabit();
    if (!habit) {
      return;
    }
    habit.name = name;
    habit.updatedAt = new Date().toISOString();
  }

  syncAchievements();
  persist();
  render();
}

function saveTask(mode, name, targetCount) {
  if (mode === "create") {
    const task = {
      id: createId("task"),
      name,
      targetCount,
      currentCount: 0,
      completedLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.tasks.push(task);
    state.settings.selectedTaskId = task.id;
  } else {
    const task = getSelectedTask();
    if (!task) {
      return;
    }
    task.name = name;
    task.targetCount = targetCount;
    task.updatedAt = new Date().toISOString();
  }

  syncAchievements();
  persist();
  render();
}

function deleteHabit() {
  const habit = getSelectedHabit();
  if (!habit) {
    return;
  }

  if (!window.confirm(`删除习惯“${habit.name}”后将丢失全部记录，继续吗？`)) {
    return;
  }

  state.habits = state.habits.filter((item) => item.id !== habit.id);
  ensureSelections();
  syncAchievements();
  persist();
  render();
}

function deleteTask() {
  const task = getSelectedTask();
  if (!task) {
    return;
  }

  if (!window.confirm(`删除任务“${task.name}”后将丢失全部记录，继续吗？`)) {
    return;
  }

  state.tasks = state.tasks.filter((item) => item.id !== task.id);
  ensureSelections();
  syncAchievements();
  persist();
  render();
}

function toggleHabitRecord(dateKey) {
  const habit = getSelectedHabit();
  if (!habit) {
    return;
  }

  if (!getRecentSevenDays().includes(dateKey)) {
    alert("只能补卡今天和之前 6 天");
    return;
  }

  if (habit.records[dateKey]) {
    delete habit.records[dateKey];
  } else {
    habit.records[dateKey] = true;
  }

  habit.updatedAt = new Date().toISOString();
  syncAchievements();
  persist();
  renderHabits();
  renderStats();
}

function incrementTask() {
  const task = getSelectedTask();
  if (!task) {
    return;
  }

  task.currentCount += 1;
  task.completedLogs.push(new Date().toISOString());
  task.updatedAt = new Date().toISOString();

  syncAchievements();
  persist();
  renderTasks();
  renderStats();
}

function editTaskProgress() {
  const task = getSelectedTask();
  if (!task) {
    return;
  }

  const input = window.prompt("输入新的已完成次数", String(task.currentCount));
  if (input === null) {
    return;
  }

  const nextCount = Number.parseInt(input.trim(), 10);
  if (!Number.isInteger(nextCount) || nextCount < 0) {
    alert("已完成次数必须是大于等于 0 的整数");
    return;
  }

  task.currentCount = nextCount;
  task.updatedAt = new Date().toISOString();
  syncAchievements();
  persist();
  renderTasks();
  renderStats();
}

function exportData() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `takeit-data-${todayKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const [file] = event.target.files || [];
  event.target.value = "";

  if (!file) {
    return;
  }

  if (!window.confirm("导入会覆盖当前本地数据，是否继续？")) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const nextState = normalizeState(parsed);
      state.version = nextState.version;
      state.habits = nextState.habits;
      state.tasks = nextState.tasks;
      state.achievements = nextState.achievements;
      state.settings = nextState.settings;
      ensureSelections();
      syncAchievements();
      persist();
      render();
      alert("导入成功");
    } catch (error) {
      alert("导入失败，JSON 格式不正确或数据结构无效");
    }
  };
  reader.readAsText(file);
}

function syncAchievements() {
  ACHIEVEMENT_DEFINITIONS.forEach((definition) => {
    const unlocked = checkAchievement(definition);
    const existing = state.achievements[definition.id] || { unlocked: false, unlockedAt: null };

    if (unlocked && !existing.unlocked) {
      state.achievements[definition.id] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      return;
    }

    if (!unlocked && !existing.unlocked) {
      state.achievements[definition.id] = existing;
    }
  });
}

function checkAchievement(definition) {
  if (definition.type === "habitStreak") {
    return state.habits.some((habit) => longestHabitStreak(habit) >= definition.threshold);
  }

  if (definition.type === "completedTasks") {
    const completedCount = state.tasks.filter((task) => task.currentCount >= task.targetCount).length;
    return completedCount >= definition.threshold;
  }

  if (definition.type === "taskDailyStreak") {
    return state.tasks.some((task) => longestTaskDailyStreak(task) >= definition.threshold);
  }

  return false;
}

function longestHabitStreak(habit) {
  const keys = Object.keys(habit.records).filter((key) => habit.records[key]).sort();
  let longest = 0;
  let current = 0;
  let previous = null;

  keys.forEach((key) => {
    if (!previous) {
      current = 1;
    } else {
      const diff = daysBetween(previous, key);
      current = diff === 1 ? current + 1 : 1;
    }
    previous = key;
    longest = Math.max(longest, current);
  });

  return longest;
}

function longestTaskDailyStreak(task) {
  const uniqueDays = [...new Set(task.completedLogs.map((entry) => toLocalDateKey(new Date(entry))))].sort();
  let longest = 0;
  let current = 0;
  let previous = null;

  uniqueDays.forEach((key) => {
    if (!previous) {
      current = 1;
    } else {
      current = daysBetween(previous, key) === 1 ? current + 1 : 1;
    }
    previous = key;
    longest = Math.max(longest, current);
  });

  return longest;
}

function countHabitInRange(habit, startKey, endKey) {
  return Object.keys(habit.records).filter((key) => habit.records[key] && key >= startKey && key <= endKey).length;
}

function countHabitTotal(habit) {
  return Object.keys(habit.records).filter((key) => habit.records[key]).length;
}

function findBestHabit() {
  if (state.habits.length === 0) {
    return null;
  }

  return [...state.habits].sort((a, b) => countHabitTotal(b) - countHabitTotal(a))[0];
}

function getSelectedHabit() {
  return state.habits.find((habit) => habit.id === state.settings.selectedHabitId) || null;
}

function getSelectedTask() {
  return state.tasks.find((task) => task.id === state.settings.selectedTaskId) || null;
}

function ensureSelections() {
  if (!state.settings.activeTab) {
    state.settings.activeTab = "habits";
  }

  if (!state.habits.some((habit) => habit.id === state.settings.selectedHabitId)) {
    state.settings.selectedHabitId = state.habits[0]?.id || "";
  }

  if (!state.tasks.some((task) => task.id === state.settings.selectedTaskId)) {
    state.settings.selectedTaskId = state.tasks[0]?.id || "";
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeState({});
    }
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    return normalizeState({});
  }
}

function normalizeState(input) {
  const habits = Array.isArray(input.habits)
    ? input.habits.map((habit) => ({
        id: String(habit.id || createId("habit")),
        name: String(habit.name || "未命名习惯"),
        records: isObject(habit.records) ? habit.records : {},
        createdAt: String(habit.createdAt || new Date().toISOString()),
        updatedAt: String(habit.updatedAt || new Date().toISOString()),
      }))
    : [];

  const tasks = Array.isArray(input.tasks)
    ? input.tasks.map((task) => ({
        id: String(task.id || createId("task")),
        name: String(task.name || "未命名任务"),
        targetCount: Number.isInteger(task.targetCount) && task.targetCount > 0 ? task.targetCount : 1,
        currentCount: Number.isInteger(task.currentCount) && task.currentCount >= 0 ? task.currentCount : 0,
        completedLogs: Array.isArray(task.completedLogs) ? task.completedLogs.map(String) : [],
        createdAt: String(task.createdAt || new Date().toISOString()),
        updatedAt: String(task.updatedAt || new Date().toISOString()),
      }))
    : [];

  return {
    version: String(input.version || APP_VERSION),
    habits,
    tasks,
    achievements: isObject(input.achievements) ? input.achievements : {},
    settings: {
      activeTab: ["habits", "tasks", "stats"].includes(input.settings?.activeTab) ? input.settings.activeTab : "habits",
      selectedHabitId: String(input.settings?.selectedHabitId || ""),
      selectedTaskId: String(input.settings?.selectedTaskId || ""),
    },
  };
}

function persist() {
  ensureSelections();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function getRecentSevenDays() {
  const days = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push(toLocalDateKey(date));
  }

  return days;
}

function todayKey() {
  return toLocalDateKey(new Date());
}

function startOfWeek() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return toLocalDateKey(date);
}

function startOfMonth() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(1);
  return toLocalDateKey(date);
}

function startOfYear() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setMonth(0, 1);
  return toLocalDateKey(date);
}

function endOfToday() {
  return todayKey();
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthPart(dateKey) {
  const [, month] = dateKey.split("-");
  return `${month}月`;
}

function formatDayPart(dateKey) {
  const [, , day] = dateKey.split("-");
  return `${day}日`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function daysBetween(leftKey, rightKey) {
  const left = new Date(`${leftKey}T12:00:00`);
  const right = new Date(`${rightKey}T12:00:00`);
  const diff = right.getTime() - left.getTime();
  return Math.round(diff / 86400000);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.error("Service worker 注册失败", error);
  }
}
