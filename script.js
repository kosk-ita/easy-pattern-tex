// script.js - EasyPatternTex v0.8 (色選択ロジック + type属性分類 colors.xml)

const canvas = document.getElementById("patternCanvas");
canvas.width = 120;
canvas.height = 120;
const ctx = canvas.getContext("2d");

const patternType = document.getElementById("patternType");
const baseColorPreset = document.getElementById("baseColorPreset");
const accentColorPreset = document.getElementById("accentColorPreset");
const baseCustom = document.getElementById("baseCustom");
const accentCustom = document.getElementById("accentCustom");

const basePicker = document.getElementById("basePicker");
const baseR = document.getElementById("baseR");
const baseG = document.getElementById("baseG");
const baseB = document.getElementById("baseB");
const baseHex = document.getElementById("baseHex");

const accentPicker = document.getElementById("accentPicker");
const accentR = document.getElementById("accentR");
const accentG = document.getElementById("accentG");
const accentB = document.getElementById("accentB");
const accentHex = document.getElementById("accentHex");

const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");  

// スケーリング要素の取得
const scaleSlider = document.getElementById("scaleSlider");
const scaleValue = document.getElementById("scaleValue");

// スケーラースライダーイベント
scaleSlider.addEventListener("input", () => {
  const v = parseFloat(scaleSlider.value).toFixed(2);
  scaleValue.textContent = v;
  canvas.style.transform = `scale(${v})`;  // キャンバス要素自体を拡大縮小
  drawPattern();
});

let patternList = [];
let colorOptions = { base: [], accent: [] };

function loadColorConfig() {
  return fetch("colors.xml")
    .then((res) => res.text())
    .then((xmlStr) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlStr, "application/xml");

      const baseColors = xml.querySelectorAll("base-colors color");
      const accentColors = xml.querySelectorAll("accent-colors color");

      const parseColors = (colorNodes) => {
        const colors = [];
        for (let c of colorNodes) {
          const id = c.getAttribute("id");
          const label = c.getElementsByTagName("label")[0].textContent;
          const rgb = c.getElementsByTagName("rgb")[0].textContent.split(",").map(Number);
          const hex = c.getElementsByTagName("hex")[0].textContent;
          colors.push({ id, name: label, rgb, hex });
        }
        return colors;
      };

      const baseColorOptions = parseColors(baseColors);
      // XML側の「custom」を除外してから、下で１つだけ追加
      const accentColorOptions = parseColors(accentColors).filter(c => c.id !== "custom");

      populateColorSelect(baseColorPreset, baseColorOptions);
      populateColorSelect(accentColorPreset, accentColorOptions);

      colorOptions = { base: baseColorOptions, accent: accentColorOptions };
    });
}

function populateColorSelect(selectElement, options) {
  selectElement.innerHTML = ""; // Clear existing options
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.id;
    option.textContent = `${opt.name} (${opt.rgb.join(",")})`;
    selectElement.appendChild(option);
  });
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "カスタム指定…";
  selectElement.appendChild(custom);
}

function getColor(selectElement, r, g, b, hex) {
  const selected = selectElement.value;
  if (selected === "custom") {
    return hex.value || `rgb(${r.value}, ${g.value}, ${b.value})`;
  }
  const group = selectElement === baseColorPreset ? colorOptions.base : colorOptions.accent;
  const opt = group.find(c => c.id === selected);
  return `rgb(${opt.rgb.join(",")})`;
}

function handleColorSelect(selectElement, customDiv) {
  selectElement.addEventListener("change", () => {
    if (selectElement.value === "custom") {
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
    rInput.value = parseInt(hex.substr(1, 2), 16);
    gInput.value = parseInt(hex.substr(3, 2), 16);
    bInput.value = parseInt(hex.substr(5, 2), 16);
    drawPattern();
  });
}

function loadPatternConfig() {
  return fetch("patterns.xml")
    .then(res => res.text())
    .then(xmlStr => {
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
        option.textContent = `${p.name} (${p.type})`;
        patternType.appendChild(option);
      });
    });
}

function clearCanvas(bgColor) {
  // 背景色を指定可能（ストライプ・チェックでは反転）
  ctx.fillStyle = bgColor || getColor(baseColorPreset, baseR, baseG, baseB, baseHex);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPattern() {
  const selectedName = patternType.value;
  const entry = patternList.find(p => p.name === selectedName);
  if (!entry) return;

  const { type, settings } = entry;

  // パターンに応じて色を反転
  const swapTypes = ["stripe", "vertical", "horizontal", "check"];
  const shouldSwap = swapTypes.includes(type);
  const bgColor = shouldSwap
    ? getColor(accentColorPreset, accentR, accentG, accentB, accentHex)
    : getColor(baseColorPreset, baseR, baseG, baseB, baseHex);
  const drawColor = shouldSwap
    ? getColor(baseColorPreset, baseR, baseG, baseB, baseHex)
    : getColor(accentColorPreset, accentR, accentG, accentB, accentHex);

  clearCanvas(bgColor);
  ctx.resetTransform();

  // 描画色セット
  ctx.strokeStyle = drawColor;
  ctx.fillStyle = drawColor;
  ctx.lineWidth = settings.lineWidth || 1;

  if (type === "dot") {
    // 1列ずつずらしたドット配置（端が切れないように調整）
    for (let y = 0; y < canvas.height; y += settings.spacing) {
      const row = Math.floor(y / settings.spacing);
      const offset = (row % 2) * (settings.spacing / 2);
      for (
        let x = -settings.spacing / 2 + offset;
        x < canvas.width;
        x += settings.spacing
      ) {
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
            ctx.fillRect(x, y, settings.spacing, settings.spacing);
          }
        }
  } else if (type === "check") {
    for (let x = 0; x < canvas.width; x += settings.spacing) {
      for (let y = 0; y < canvas.height; y += settings.spacing) {
        const col = x / settings.spacing;
        const row = y / settings.spacing;
        if ((col + row) % 2 === 0) {
          ctx.fillRect(x, y, settings.spacing, settings.spacing);
        }
      }
    }
  } else if (type === "diacheck") {
    // ダイヤ型で隙間なくタイル
    const s = settings.spacing;

    for (let y = -s; y < canvas.height + s; y += s) {
      for (let x = -s; x < canvas.width + s; x += s) {
        ctx.beginPath();
        ctx.moveTo(x, y + s / 2);
        ctx.lineTo(x + s / 2, y);
        ctx.lineTo(x + s, y + s / 2);
        ctx.lineTo(x + s / 2, y + s);
        ctx.closePath();
        ctx.fill();
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
  canvas.toBlob(blob => {
    const item = new ClipboardItem({ "image/png": blob });
    navigator.clipboard.write([item]);
  });
}

// イベント初期化
setupColorPicker(basePicker, baseHex, baseR, baseG, baseB);
setupColorPicker(accentPicker, accentHex, accentR, accentG, accentB);
handleColorSelect(baseColorPreset, baseCustom);
handleColorSelect(accentColorPreset, accentCustom);

[patternType].forEach(el => el.addEventListener("change", drawPattern));
[baseR, baseG, baseB, baseHex, accentR, accentG, accentB, accentHex].forEach(el => el.addEventListener("input", drawPattern));

Promise.all([
  loadColorConfig(),
  loadPatternConfig()
]).then(drawPattern);

downloadBtn.addEventListener("click", downloadPNG);
copyBtn.addEventListener("click", copyToClipboard);
