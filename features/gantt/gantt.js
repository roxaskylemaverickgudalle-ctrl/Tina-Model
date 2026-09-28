(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const STORAGE_KEY = "tina-gantt-preferences-v1";
  const templates = {
    meadow: {
      label: "Meadow",
      surface: "#f6f8ec",
      track: "#e6eddc",
      grid: "#ccd9c0",
      ink: "#263d2a",
      muted: "#546854",
      radius: 9
    },
    sky: {
      label: "Sky",
      surface: "#eef7fa",
      track: "#dcebf0",
      grid: "#b9d4dd",
      ink: "#193b4a",
      muted: "#315d6b",
      radius: 5
    },
    orchard: {
      label: "Orchard",
      surface: "#f5f1df",
      track: "#e9e1c9",
      grid: "#d2c5a3",
      ink: "#483e26",
      muted: "#625735",
      radius: 3
    }
  };
  const defaultPreferences = { template: "meadow", color: "#236b39" };

  function validColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
  }

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        template: Object.hasOwn(templates, saved.template) ? saved.template : defaultPreferences.template,
        color: validColor(saved.color, defaultPreferences.color)
      };
    } catch (error) {
      return { ...defaultPreferences };
    }
  }

  function savePreferences(preferences) {
    const next = {
      template: Object.hasOwn(templates, preferences.template) ? preferences.template : defaultPreferences.template,
      color: validColor(preferences.color, defaultPreferences.color)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
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

    const template = templates[options.template] || templates.meadow;
    const color = validColor(options.color, defaultPreferences.color);
    const width = 1200;
    const labelWidth = 300;
    const right = 36;
    const plotWidth = width - labelWidth - right;
    const top = 112;
    const rowHeight = 58;
    const height = top + model.activities.length * rowHeight + 40;
    const title = escapeXml(options.title || "Project timeline");
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
      const radius = Math.min(template.radius, barWidth / 2);
      return `<line x1="24" y1="${y + rowHeight - 4}" x2="${width - 24}" y2="${y + rowHeight - 4}" stroke="${template.grid}" opacity=".65"/><text x="24" y="${y + 22}" fill="${template.ink}" font-size="14" font-weight="600">${label}</text><text x="24" y="${y + 41}" fill="${template.muted}" font-size="11">${escapeXml(formatDate(activity.start_date, options.locale))} - ${escapeXml(formatDate(activity.due_date, options.locale))} · ${status}</text><rect x="${labelWidth}" y="${y + 9}" width="${plotWidth}" height="28" rx="${template.radius}" fill="${template.track}"/><rect x="${barX}" y="${y + 13}" width="${barWidth}" height="20" rx="${radius}" fill="${color}"/>`;
    }).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">${title} Gantt chart</title><desc id="chart-description">${model.activities.length} scheduled activities using the ${escapeXml(template.label)} template.</desc><rect width="100%" height="100%" fill="${template.surface}"/><text x="24" y="42" fill="${template.ink}" font-size="23" font-family="Arial, sans-serif" font-weight="700">${title}</text><text x="24" y="68" fill="${template.muted}" font-size="13" font-family="Arial, sans-serif">${model.activities.length} scheduled activities · ${escapeXml(template.label)} template</text>${tickSvg}${rows}</svg>`;
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
    readPreferences,
    savePreferences,
    buildTimeline,
    formatDate,
    buildSvg,
    renderPng,
    downloadSvg,
    downloadPng
  };
})();
