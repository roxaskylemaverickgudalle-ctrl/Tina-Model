(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const STORAGE_KEY = "tina-gantt-preferences-v1";
  const templates = {
    meadow: {
      id: "meadow",
      label: "Meadow",
      description: "Roomy horizontal planning with calm greens.",
      tag: "Popular",
      category: "academic",
      categories: ["academic"],
      layout: "gantt",
      surface: "#f6f8ec",
      track: "#e6eddc",
      grid: "#ccd9c0",
      ink: "#263d2a",
      muted: "#546854",
      accent: "#236b39",
      fontFace: "sans",
      barStyle: "rounded",
      radius: 9
    },
    sky: {
      id: "sky",
      label: "Sky",
      description: "A dense, date-led schedule for busy plans.",
      tag: "Compact",
      category: "academic",
      categories: ["academic"],
      layout: "schedule",
      surface: "#eef7fa",
      track: "#dcebf0",
      grid: "#b9d4dd",
      ink: "#193b4a",
      muted: "#315d6b",
      accent: "#236b39",
      fontFace: "sans",
      barStyle: "square",
      radius: 5
    },
    orchard: {
      id: "orchard",
      label: "Orchard",
      description: "Milestones flow down a spacious roadmap.",
      tag: "Roadmap",
      category: "academic",
      categories: ["academic"],
      layout: "roadmap",
      surface: "#f5f1df",
      track: "#e9e1c9",
      grid: "#d2c5a3",
      ink: "#483e26",
      muted: "#625735",
      accent: "#236b39",
      fontFace: "serif",
      barStyle: "outlined",
      radius: 3
    },
    cyberpunk: {
      id: "cyberpunk",
      label: "Cyberpunk",
      description: "Dark, high-contrast bars for sprint boards.",
      tag: "Dark mode",
      category: "dark",
      categories: ["dark", "agile"],
      layout: "gantt",
      surface: "#172126",
      track: "#28383e",
      grid: "#52676d",
      ink: "#f1f6f2",
      muted: "#b9c9c6",
      accent: "#b8f34a",
      fontFace: "mono",
      barStyle: "striped",
      radius: 2
    },
    minimalist: {
      id: "minimalist",
      label: "Minimalist",
      description: "A quiet, wireframe schedule with crisp labels.",
      tag: "High contrast",
      category: "high-contrast",
      categories: ["high-contrast", "academic"],
      layout: "schedule",
      surface: "#ffffff",
      track: "#f0f2f4",
      grid: "#aab2b8",
      ink: "#19252d",
      muted: "#42515b",
      accent: "#075d78",
      fontFace: "mono",
      barStyle: "wireframe",
      radius: 1
    }
  };
  const fontFaces = {
    sans: "Arial, sans-serif",
    serif: "Georgia, serif",
    mono: "'Courier New', monospace"
  };
  const allowedLayouts = new Set(["gantt", "schedule", "roadmap"]);
  const allowedBarStyles = new Set(["rounded", "square", "outlined", "striped", "wireframe"]);
  const defaultPreferences = { template: "meadow", color: "#236b39", customThemes: [] };

  function validColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
  }

  function normalizeCustomTheme(theme) {
    if (!theme || typeof theme !== "object" || typeof theme.id !== "string" || !/^custom-[a-z0-9-]{1,48}$/.test(theme.id)) return null;
    return {
      id: theme.id,
      label: String(theme.label || "Custom theme").trim().slice(0, 32) || "Custom theme",
      description: String(theme.description || "Your saved palette and chart style.").trim().slice(0, 100),
      tag: "Custom",
      category: "custom",
      categories: ["custom"],
      layout: allowedLayouts.has(theme.layout) ? theme.layout : "gantt",
      surface: validColor(theme.surface, "#ffffff"),
      track: validColor(theme.track, "#edf1f3"),
      grid: validColor(theme.grid, "#aab2b8"),
      ink: validColor(theme.ink, "#19252d"),
      muted: validColor(theme.muted, "#42515b"),
      accent: validColor(theme.accent, "#075d78"),
      fontFace: Object.hasOwn(fontFaces, theme.fontFace) ? theme.fontFace : "sans",
      barStyle: allowedBarStyles.has(theme.barStyle) ? theme.barStyle : "rounded",
      radius: allowedBarStyles.has(theme.barStyle) ? (theme.barStyle === "rounded" ? 9 : theme.barStyle === "square" ? 3 : 1) : 9
    };
  }

  function getTemplates(preferences = defaultPreferences) {
    const customThemes = Array.isArray(preferences.customThemes)
      ? preferences.customThemes.map(normalizeCustomTheme).filter(Boolean)
      : [];
    return { ...templates, ...Object.fromEntries(customThemes.map(theme => [theme.id, theme])) };
  }

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const customThemes = Array.isArray(saved.customThemes) ? saved.customThemes.map(normalizeCustomTheme).filter(Boolean) : [];
      const availableThemes = getTemplates({ customThemes });
      return {
        template: Object.hasOwn(availableThemes, saved.template) ? saved.template : defaultPreferences.template,
        color: validColor(saved.color, availableThemes[saved.template]?.accent || defaultPreferences.color),
        customThemes
      };
    } catch (error) {
      return { ...defaultPreferences };
    }
  }

  function savePreferences(preferences) {
    const customThemes = Array.isArray(preferences.customThemes) ? preferences.customThemes.map(normalizeCustomTheme).filter(Boolean) : [];
    const availableThemes = getTemplates({ customThemes });
    const next = {
      template: Object.hasOwn(availableThemes, preferences.template) ? preferences.template : defaultPreferences.template,
      color: validColor(preferences.color, availableThemes[preferences.template]?.accent || defaultPreferences.color),
      customThemes
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function saveCustomTheme(preferences, theme) {
    const id = `custom-${Date.now().toString(36)}`;
    const customTheme = normalizeCustomTheme({ ...theme, id });
    if (!customTheme) throw new Error("Could not save this theme. Check its name and colors.");
    const customThemes = [...(preferences.customThemes || []).filter(item => item.id !== id), customTheme];
    return savePreferences({ ...preferences, template: id, color: customTheme.accent, customThemes });
  }

  function utcDay(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  }

  function formatDate(date, locale) {
    return new Date(`${date}T12:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric" });
  }

  function buildTimeline(activities) {
    const scheduled = activities
      .filter(item => item.start_date && item.due_date && utcDay(item.start_date) <= utcDay(item.due_date))
      .slice()
      .sort((first, second) => first.start_date.localeCompare(second.start_date));
    if (!scheduled.length) return { activities: [], ticks: [], startDay: 0, duration: 0 };

    const startDay = Math.min(...scheduled.map(item => utcDay(item.start_date)));
    const endDay = Math.max(...scheduled.map(item => utcDay(item.due_date)));
    const duration = Math.max(1, Math.round((endDay - startDay) / DAY_MS) + 1);
    const tickCount = Math.min(5, duration);
    const ticks = Array.from({ length: tickCount }, (_, index) => {
      const offset = Math.round((duration - 1) * index / Math.max(1, tickCount - 1));
      const date = new Date(startDay + offset * DAY_MS).toISOString().slice(0, 10);
      return { date, position: duration === 1 ? 0 : offset / (duration - 1) * 100 };
    });
    const timelineActivities = scheduled.map(item => {
      const offset = (utcDay(item.start_date) - startDay) / DAY_MS;
      const length = (utcDay(item.due_date) - utcDay(item.start_date)) / DAY_MS + 1;
      return { ...item, left: offset / duration * 100, width: length / duration * 100 };
    });
    return { activities: timelineActivities, ticks, startDay, duration };
  }

  function calculateCriticalPath(activities) {
    const tasks = new Map(activities.map(activity => {
      const start = utcDay(activity.start_date);
      const finish = utcDay(activity.due_date);
      const duration = Number.isFinite(start) && Number.isFinite(finish) && finish >= start
        ? Math.round((finish - start) / DAY_MS) + 1
        : 1;
      return [String(activity.id), { ...activity, duration }];
    }));
    const earlyStart = new Map();
    const earlyFinish = new Map();
    const visiting = new Set();

    function getEarlyFinish(id) {
      if (earlyFinish.has(id)) return earlyFinish.get(id);
      if (visiting.has(id)) throw new Error("Activity dependencies contain a cycle.");
      visiting.add(id);
      const task = tasks.get(id);
      const predecessorId = task?.depends_on_id && String(task.depends_on_id);
      const start = predecessorId && tasks.has(predecessorId) ? getEarlyFinish(predecessorId) : 0;
      const finish = start + (task?.duration || 1);
      earlyStart.set(id, start);
      earlyFinish.set(id, finish);
      visiting.delete(id);
      return finish;
    }

    try {
      for (const id of tasks.keys()) getEarlyFinish(id);
    } catch (error) {
      return [];
    }

    const successors = new Map([...tasks.keys()].map(id => [id, []]));
    for (const [id, task] of tasks) {
      const predecessorId = task.depends_on_id && String(task.depends_on_id);
      if (successors.has(predecessorId)) successors.get(predecessorId).push(id);
    }
    const projectFinish = Math.max(0, ...earlyFinish.values());
    const lateStart = new Map();

    function getLateStart(id) {
      if (lateStart.has(id)) return lateStart.get(id);
      const task = tasks.get(id);
      const next = successors.get(id) || [];
      const finish = next.length
        ? Math.min(...next.map(successorId => getLateStart(successorId)))
        : projectFinish;
      const start = finish - (task?.duration || 1);
      lateStart.set(id, start);
      return start;
    }

    return [...tasks.keys()].filter(id => getLateStart(id) === earlyStart.get(id));
  }

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    })[character]);
  }

  function safeFilename(value) {
    return String(value || "project-timeline")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "project-timeline";
  }

  function buildSvg(activities, options) {
    const model = buildTimeline(activities);
    if (!model.activities.length) throw new Error("Add at least one scheduled activity before downloading the Gantt chart.");

    const template = getTemplates({ customThemes: options.customThemes })[options.template] || templates.meadow;
    const color = validColor(options.color, defaultPreferences.color);
    const criticalIds = new Set(calculateCriticalPath(model.activities));
    const title = escapeXml(options.title || "Project timeline");
    const fontFamily = fontFaces[template.fontFace] || "Arial, sans-serif";
    const header = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">${title} Gantt chart</title><desc id="chart-description">${model.activities.length} scheduled activities using the ${escapeXml(template.label)} ${escapeXml(template.description)} design.</desc><rect width="100%" height="100%" fill="${template.surface}"/><text x="28" y="42" fill="${template.ink}" font-size="23" font-family="${escapeXml(fontFamily)}" font-weight="700">${title}</text><text x="28" y="68" fill="${template.muted}" font-size="13" font-family="${escapeXml(fontFamily)}">${escapeXml(template.description)} · ${model.activities.length} activities</text>${content}</svg>`;

    if (template.layout === "roadmap") {
      const width = 900;
      const top = 112;
      const rowHeight = 104;
      const height = top + model.activities.length * rowHeight + 30;
      const axisX = 86;
      const cards = model.activities.map((activity, index) => {
        const y = top + index * rowHeight;
        const status = escapeXml(String(activity.status || "not_started").replaceAll("_", " "));
        const duration = Math.round((utcDay(activity.due_date) - utcDay(activity.start_date)) / DAY_MS) + 1;
        const progress = Math.max(0, Math.min(100, Number(activity.progress) || 0));
        const critical = criticalIds.has(String(activity.id));
        return `<circle cx="${axisX}" cy="${y + 34}" r="11" fill="${color}" stroke="${critical ? "#c4513e" : template.surface}" stroke-width="${critical ? 4 : 5}"/><rect x="128" y="${y}" width="730" height="78" rx="${template.radius + 5}" fill="${template.track}"/><text x="152" y="${y + 29}" fill="${template.ink}" font-size="16" font-family="Arial, sans-serif" font-weight="700">${escapeXml(activity.title)}</text><text x="152" y="${y + 54}" fill="${template.muted}" font-size="12" font-family="Arial, sans-serif">${escapeXml(formatDate(activity.start_date, options.locale))} - ${escapeXml(formatDate(activity.due_date, options.locale))} · ${duration} days · ${progress}% complete</text><rect x="720" y="${y + 22}" width="112" height="30" rx="${template.radius + 3}" fill="${template.surface}"/><text x="776" y="${y + 41}" fill="${template.ink}" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">${status}</text><rect x="720" y="${y + 64}" width="112" height="5" rx="2" fill="${template.surface}"/><rect x="720" y="${y + 64}" width="${112 * progress / 100}" height="5" rx="2" fill="${color}"/>`;
      }).join("");
      const axis = `<line x1="${axisX}" y1="${top + 34}" x2="${axisX}" y2="${top + (model.activities.length - 1) * rowHeight + 34}" stroke="${template.grid}" stroke-width="4" stroke-linecap="round"/>`;
      return header(width, height, axis + cards);
    }

    if (template.layout === "schedule") {
      const width = 1200;
      const top = 130;
      const rowHeight = 54;
      const plotLeft = 642;
      const plotWidth = width - plotLeft - 36;
      const height = top + model.activities.length * rowHeight + 34;
      const columnHeaders = `<text x="28" y="${top - 28}" fill="${template.muted}" font-size="11" font-family="Arial, sans-serif" font-weight="700">ACTIVITY</text><text x="350" y="${top - 28}" fill="${template.muted}" font-size="11" font-family="Arial, sans-serif" font-weight="700">START</text><text x="470" y="${top - 28}" fill="${template.muted}" font-size="11" font-family="Arial, sans-serif" font-weight="700">FINISH</text><text x="${plotLeft}" y="${top - 28}" fill="${template.muted}" font-size="11" font-family="Arial, sans-serif" font-weight="700">SCHEDULE</text>`;
      const tickLines = model.ticks.map(tick => {
        const x = plotLeft + plotWidth * tick.position / 100;
        const anchor = tick.position === 0 ? "start" : tick.position === 100 ? "end" : "middle";
        return `<line x1="${x}" y1="${top - 13}" x2="${x}" y2="${height - 20}" stroke="${template.grid}" stroke-dasharray="2 5"/><text x="${x}" y="${top - 7}" fill="${template.muted}" font-size="10" font-family="Arial, sans-serif" text-anchor="${anchor}">${escapeXml(formatDate(tick.date, options.locale))}</text>`;
      }).join("");
      const rows = model.activities.map((activity, index) => {
        const y = top + index * rowHeight;
        const barX = plotLeft + plotWidth * activity.left / 100;
        const barWidth = Math.max(8, plotWidth * activity.width / 100);
        const progress = Math.max(0, Math.min(100, Number(activity.progress) || 0));
        const critical = criticalIds.has(String(activity.id));
        const tint = index % 2 ? template.surface : template.track;
        return `<rect x="20" y="${y + 7}" width="${width - 40}" height="42" rx="${template.radius}" fill="${tint}"/><text x="28" y="${y + 33}" fill="${template.ink}" font-size="13" font-family="Arial, sans-serif" font-weight="600">${escapeXml(activity.title)}</text><text x="350" y="${y + 33}" fill="${template.muted}" font-size="12" font-family="Arial, sans-serif">${escapeXml(formatDate(activity.start_date, options.locale))}</text><text x="470" y="${y + 33}" fill="${template.muted}" font-size="12" font-family="Arial, sans-serif">${escapeXml(formatDate(activity.due_date, options.locale))}</text><rect x="${barX}" y="${y + 20}" width="${barWidth}" height="16" rx="${template.radius}" fill="${color}" stroke="${critical ? "#c4513e" : "none"}" stroke-width="2"/><rect x="${barX}" y="${y + 20}" width="${barWidth * progress / 100}" height="16" rx="${template.radius}" fill="#ffffff" opacity=".36"/>`;
      }).join("");
      return header(width, height, columnHeaders + tickLines + rows);
    }

    const width = 1200;
    const labelWidth = 300;
    const right = 36;
    const plotWidth = width - labelWidth - right;
    const top = 112;
    const rowHeight = 58;
    const height = top + model.activities.length * rowHeight + 40;
    const tickSvg = model.ticks.map(tick => {
      const x = labelWidth + plotWidth * tick.position / 100;
      const anchor = tick.position === 0 ? "start" : tick.position === 100 ? "end" : "middle";
      return `<line x1="${x}" y1="${top - 14}" x2="${x}" y2="${height - 24}" stroke="${template.grid}" stroke-dasharray="3 5"/><text x="${x}" y="${top - 30}" fill="${template.muted}" font-size="12" text-anchor="${anchor}">${escapeXml(formatDate(tick.date, options.locale))}</text>`;
    }).join("");
    const rows = model.activities.map((activity, index) => {
      const y = top + index * rowHeight;
      const label = escapeXml(activity.title);
      const status = escapeXml(String(activity.status || "not_started").replaceAll("_", " "));
      const barX = labelWidth + plotWidth * activity.left / 100;
      const barWidth = Math.max(8, plotWidth * activity.width / 100);
      const progress = Math.max(0, Math.min(100, Number(activity.progress) || 0));
      const critical = criticalIds.has(String(activity.id));
      const radius = Math.min(template.radius, barWidth / 2);
      return `<line x1="24" y1="${y + rowHeight - 4}" x2="${width - 24}" y2="${y + rowHeight - 4}" stroke="${template.grid}" opacity=".65"/><text x="24" y="${y + 22}" fill="${template.ink}" font-size="14" font-weight="600">${label}</text><text x="24" y="${y + 41}" fill="${template.muted}" font-size="11">${escapeXml(formatDate(activity.start_date, options.locale))} - ${escapeXml(formatDate(activity.due_date, options.locale))} · ${status} · ${progress}%</text><rect x="${labelWidth}" y="${y + 9}" width="${plotWidth}" height="28" rx="${template.radius}" fill="${template.track}"/><rect x="${barX}" y="${y + 13}" width="${barWidth}" height="20" rx="${radius}" fill="${color}" stroke="${critical ? "#c4513e" : "none"}" stroke-width="2"/><rect x="${barX}" y="${y + 13}" width="${barWidth * progress / 100}" height="20" rx="${radius}" fill="#ffffff" opacity=".36"/>`;
    }).join("");

    return header(width, height, tickSvg + rows);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadSvg(activities, options) {
    const svg = buildSvg(activities, options);
    triggerDownload(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${safeFilename(options.title)}-gantt.svg`);
  }

  async function renderPng(activities, options) {
    const svg = buildSvg(activities, options);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth * 2;
      canvas.height = image.naturalHeight * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create a canvas for the PNG export.");
      context.scale(2, 2);
      context.drawImage(image, 0, 0);
      return await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Could not render the PNG export.")), "image/png"));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function downloadPng(activities, options) {
    const blob = await renderPng(activities, options);
    triggerDownload(blob, `${safeFilename(options.title)}-gantt.png`);
    return blob;
  }

  window.GanttTools = {
    templates,
    getTemplates,
    readPreferences,
    savePreferences,
    saveCustomTheme,
    buildTimeline,
    calculateCriticalPath,
    formatDate,
    buildSvg,
    renderPng,
    downloadSvg,
    downloadPng
  };
})();
