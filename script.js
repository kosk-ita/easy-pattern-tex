// script.js - EasyPatternTex v0.6 (色選択ロジック + type属性分類 完全統合版)

const canvas = document.getElementById("patternCanvas");
canvas.width = 120;
canvas.height = 120;
const ctx = canvas.getContext("2d");

const patternType = document.getElementById("patternType");
const fgColorPreset = document.getElementById("fgColorPreset");
const fgCustom = document.getElementById("fgCustom");
const bgColorPreset = document.getElementById("bgColorPreset");
const bgCustom = document.getElementById("bgCustom");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");

const fgR = document.getElementById("fgR");
const fgG = document.getElementById("fgG");
const fgB = document.getElementById("fgB");
const fgHex = document.getElementById("fgHex");
const fgPicker = document.getElementById("fgPicker");
const bgR = document.getElementById("bgR");
const bgG = document.getElementById("bgG");
const bgB = document.getElementById("bgB");
const bgHex = document.getElementById("bgHex");
const bgPicker = document.getElementById("bgPicker");

let patternList = [];

const fgColorOptions = [
  { name: "ブラック", rgb: [0, 0, 0] },
  { name: "レッド", rgb: [220, 20, 60] },
  { name: "ブルー", rgb: [0, 0, 255] },
  { name: "オレンジ", rgb: [255, 140, 0] },
  { name: "カスタム指定", rgb: null }
];

const bgColorOptions = [
  { name: "ホワイト", rgb: [255, 255, 255] },
  { name: "グレー", rgb: [200, 200, 200] },
  { name: "ベージュ", rgb: [245, 245, 220] },
  { name: "水色", rgb: [173, 216, 230] },
  { name: "カスタム指定", rgb: null }
];

function populateColorSelect(selectElement, options) {
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.name;
    option.textContent = `${opt.name} ${opt.rgb ? `(${opt.rgb.join(",")})` : ""}`;
    selectElement.appendChild(option);
  });
}

function getColor(selectElement, rInput, gInput, bInput, hexInput, options) {
  const selected = selectElement.value;
  if (selected === "カスタム指定") {
    if (hexInput.value) {
      return hexInput.value;
    } else {
      return `rgb(${rInput.value}, ${gInput.value}, ${bInput.value})`;
    }
  } else {
    const color = options.find(opt => opt.name === selected);
    return `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
  }
}

function hexToRGB(hex) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return { r, g, b };
}

function handleColorSelect(selectElement, customDiv) {
  selectElement.addEventListener("change", () => {
    if (selectElement.value === "カスタム指定") {
      customDiv.style.display = "block";
    } else {
      customDiv.style.display = "none";
      drawPattern();
    }
  });
}

function setupColorPicker(picker, hexInput, rInput, gInput, bInput) {
  picker.addEventListener("input", () => {
    const hex = picker.value;
    hexInput.value = hex;
    const { r, g, b } = hexToRGB(hex);
    rInput.value = r;
    gInput.value = g;
    bInput.value = b;
    drawPattern();
  });
}

function loadPatternConfig() {
  return fetch("patterns.xml")
    .then((res) => res.text())
    .then((xmlStr) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlStr, "application/xml");
      const patterns = xml.getElementsByTagName("pattern");
      for (let p of patterns) {
        const name = p.getAttribute("name");
        const type = p.getAttribute("type");
        const settings = {};
        for (let child of p.children) {
          settings[child.tagName] = parseFloat(child.textContent);
        }
        patternList.push({ name, type, settings });
      }

      patternList.forEach(p => {
        const option = document.createElement("option");
        option.value = p.name;
        option.textContent = `${p.name}`;
        patternType.appendChild(option);
      });
    });
}

function clearCanvas() {
  ctx.fillStyle = getColor(bgColorPreset, bgR, bgG, bgB, bgHex, bgColorOptions);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPattern() {
  const selectedName = patternType.value;
  const entry = patternList.find(p => p.name === selectedName);
  if (!entry) return;
  const type = entry.type;
  const settings = entry.settings;

  clearCanvas();

  ctx.strokeStyle = getColor(fgColorPreset, fgR, fgG, fgB, fgHex, fgColorOptions);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = settings.lineWidth || 1;

  if (type === "dot") {
    for (let x = 0; x < canvas.width; x += settings.spacing) {
      for (let y = 0; y < canvas.height; y += settings.spacing) {
        ctx.beginPath();
        ctx.arc(x + settings.spacing / 2, y + settings.spacing / 2, settings.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === "stripe") {
    const angle = (settings.angle * Math.PI) / 180;
    const dx = settings.spacing * Math.cos(angle);
    const dy = settings.spacing * Math.sin(angle);
    for (let i = -canvas.width - settings.spacing; i < canvas.width * 2 + settings.spacing; i += settings.spacing) {
      ctx.beginPath();
      ctx.moveTo(i, -settings.spacing/2);
      ctx.lineTo(i + dx * canvas.height, dy * canvas.height);
      ctx.stroke();
    }
  } else if (type === "grid") {
        for (let x = 0; x < canvas.width; x += settings.spacing) {
          for (let y = 0; y < canvas.height; y += settings.spacing) {
            ctx.fillRect(x, y, settings.size, settings.size);
          }
        }
  } else if (type === "check") {
    for (let x = 0; x < canvas.width; x += settings.spacing) {
      for (let y = 0; y < canvas.height; y += settings.spacing) {
        const col = x / settings.spacing;
        const row = y / settings.spacing;
        if ((col + row) % 2 === 0) {
          ctx.fillRect(x, y, settings.size, settings.size);
        }
      }
    }
  } else if (type === "diacheck") {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 4); // 45度回転

    const s = settings.spacing;
    const sz = settings.size;
    for (let x = -canvas.width; x < canvas.width; x += s) {
      for (let y = -canvas.height; y < canvas.height; y += s) {
        const col = Math.floor(x / s);
        const row = Math.floor(y / s);
        if ((col + row) % 2 === 0) {
          ctx.fillRect(x, y, sz, sz);
        }
      }
    }
  } else if (type === "vertical") {
    for (let x = 0 + settings.spacing/2; x < canvas.width +1; x += settings.spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  } else if (type === "horizontal") {
    for (let y = 0 + settings.spacing/2; y < canvas.height +1; y += settings.spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
}

function downloadPNG() {
  const link = document.createElement("a");
  link.download = "pattern.png";
  link.href = canvas.toDataURL();
  link.click();
}

function copyToClipboard() {
  canvas.toBlob((blob) => {
    const item = new ClipboardItem({ "image/png": blob });
    navigator.clipboard.write([item]);
  });
}

[patternType].forEach(el => el.addEventListener("change", drawPattern));
[fgR, fgG, fgB, fgHex, bgR, bgG, bgB, bgHex].forEach(el => el.addEventListener("input", drawPattern));

setupColorPicker(fgPicker, fgHex, fgR, fgG, fgB);
setupColorPicker(bgPicker, bgHex, bgR, bgG, bgB);

handleColorSelect(fgColorPreset, fgCustom);
handleColorSelect(bgColorPreset, bgCustom);

populateColorSelect(fgColorPreset, fgColorOptions);
populateColorSelect(bgColorPreset, bgColorOptions);

loadPatternConfig().then(drawPattern);
