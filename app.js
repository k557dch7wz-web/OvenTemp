const calibration = [
  { actual: 250, setting: 300 },
  { actual: 350, setting: 425 },
  { actual: 375, setting: 430 },
  { actual: 400, setting: 470 },
];

const MIN_TEMP = 200;
const MAX_TEMP = 450;
const START_ANGLE = -135;
const SWEEP = 270;

const knob = document.querySelector("#knob");
const knobValue = document.querySelector("#knob-value");
const input = document.querySelector("#temp-input");
const resultValue = document.querySelector("#result-value");
const resultInline = document.querySelector("#result-inline");
const desiredInline = document.querySelector("#desired-inline");
const exactBadge = document.querySelector("#exact-badge");
const estimateNote = document.querySelector("#estimate-note");
const tabs = [...document.querySelectorAll(".mode-button")];
const panels = [...document.querySelectorAll(".input-panel")];

let currentTemp = 350;
let dragging = false;

function ovenSettingFor(actual) {
  let lower = calibration[0];
  let upper = calibration[1];

  if (actual <= calibration[0].actual) {
    [lower, upper] = [calibration[0], calibration[1]];
  } else if (actual >= calibration.at(-1).actual) {
    [lower, upper] = [calibration.at(-2), calibration.at(-1)];
  } else {
    for (let i = 0; i < calibration.length - 1; i += 1) {
      if (actual >= calibration[i].actual && actual <= calibration[i + 1].actual) {
        [lower, upper] = [calibration[i], calibration[i + 1]];
        break;
      }
    }
  }

  const position = (actual - lower.actual) / (upper.actual - lower.actual);
  return Math.round(lower.setting + position * (upper.setting - lower.setting));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function update(temp, { syncInput = true } = {}) {
  const parsed = Number(temp);
  if (!Number.isFinite(parsed)) return;

  currentTemp = clamp(Math.round(parsed), MIN_TEMP, MAX_TEMP);
  const setting = ovenSettingFor(currentTemp);
  const progress = (currentTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  const rotation = START_ANGLE + progress * SWEEP;
  const isExact = calibration.some((point) => point.actual === currentTemp);
  const isEstimate = currentTemp < calibration[0].actual || currentTemp > calibration.at(-1).actual;

  knob.style.setProperty("--knob-rotation", `${rotation}deg`);
  knob.setAttribute("aria-valuenow", currentTemp);
  knob.setAttribute("aria-valuetext", `${currentTemp} degrees Fahrenheit`);
  knobValue.textContent = currentTemp;
  // Do not overwrite the field while the user is still entering digits.
  if (syncInput) input.value = currentTemp;
  resultValue.textContent = setting;
  resultInline.textContent = `${setting}°F`;
  desiredInline.textContent = `${currentTemp}°F`;
  exactBadge.hidden = !isExact;
  estimateNote.hidden = !isEstimate;
}

function updateFromPointer(event) {
  const rect = knob.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let angle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI + 90;
  if (angle < -180) angle += 360;
  if (angle > 180) angle -= 360;

  // The inactive 90-degree area is at the bottom. Snap to the closest endpoint.
  if (angle < START_ANGLE && angle > -180) angle = START_ANGLE;
  if (angle > 135 && angle <= 180) angle = 135;

  const progress = clamp((angle - START_ANGLE) / SWEEP, 0, 1);
  const temp = Math.round((MIN_TEMP + progress * (MAX_TEMP - MIN_TEMP)) / 5) * 5;
  update(temp);
}

knob.addEventListener("pointerdown", (event) => {
  dragging = true;
  knob.setPointerCapture(event.pointerId);
  updateFromPointer(event);
});

knob.addEventListener("pointermove", (event) => {
  if (dragging) updateFromPointer(event);
});

knob.addEventListener("pointerup", () => { dragging = false; });
knob.addEventListener("pointercancel", () => { dragging = false; });

knob.addEventListener("keydown", (event) => {
  let next = currentTemp;
  if (event.key === "ArrowUp" || event.key === "ArrowRight") next += event.shiftKey ? 25 : 5;
  else if (event.key === "ArrowDown" || event.key === "ArrowLeft") next -= event.shiftKey ? 25 : 5;
  else if (event.key === "Home") next = MIN_TEMP;
  else if (event.key === "End") next = MAX_TEMP;
  else return;
  event.preventDefault();
  update(next);
});

input.addEventListener("input", () => {
  const typedTemp = Number(input.value);

  // Wait for a complete, valid temperature before updating the result. This
  // lets someone type "375" without the first "3" being clamped to "200".
  if (Number.isFinite(typedTemp) && typedTemp >= MIN_TEMP && typedTemp <= MAX_TEMP) {
    update(typedTemp, { syncInput: false });
  }
});

input.addEventListener("blur", () => update(input.value || currentTemp));

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    update(input.value || currentTemp);
    input.select();
  }
});

document.querySelectorAll("[data-temp]").forEach((button) => {
  button.addEventListener("click", () => {
    update(button.dataset.temp);
    input.focus();
    input.select();
  });
});

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item, itemIndex) => {
      const selected = itemIndex === index;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    panels.forEach((panel, panelIndex) => {
      const selected = panelIndex === index;
      panel.classList.toggle("active", selected);
      panel.hidden = !selected;
    });
    if (index === 1) {
      input.focus();
      input.select();
    } else {
      knob.focus();
    }
  });
});

update(currentTemp);
