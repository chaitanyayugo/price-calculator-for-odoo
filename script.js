let material_master = [];
let price_sheet = [];

// Load JSON files
async function loadData() {
  material_master = await fetch('material_master.json').then(res => res.json());
  price_sheet = await fetch('price_sheet.json').then(res => res.json());
}

// 🔥 NEW: SMART CODE EXTRACTION
function extractCode(fabricPart) {
  const text = fabricPart.trim().toUpperCase();

  const sortedCodes = material_master
    .map(m => m.code.trim().toUpperCase())
    .sort((a, b) => b.length - a.length); // longest first

  for (let code of sortedCodes) {
    if (
      text === code ||
      text.startsWith(code + "-") ||
      text.startsWith(code + " ")
    ) {
      return code;
    }
  }

  return text.split("-")[0]; // fallback
}

// Parse Variant
function parseVariant(input) {
  try {
    input = input
      .replace(/\(\s*\(/g, "(")
      .replace(/\)\s*\)/g, ")");

    const brackets = input.match(/\(([^()]*)\)/g);

    if (!brackets || brackets.length < 2) {
      throw "Invalid format";
    }

    const prefix = brackets[0].replace(/[()]/g, "").trim();

    const afterPrefix = input.split(")")[1].trim();
    const modelName = afterPrefix.split(" ")[0];
    const model = `${prefix}-${modelName}`;

    const last = brackets[brackets.length - 1].replace(/[()]/g, "");

    let [fabricPart, configPart] = last.split(",");

    if (!fabricPart || !configPart) {
      throw "Invalid fabric/config format";
    }

    // 🔥 FIX: CONFIG NORMALIZATION
    configPart = configPart
      .replace(/[()]/g, "")
      .trim()
      .toUpperCase();

    // 🔥 FIX: SMART CODE
    const code = extractCode(fabricPart);

    return {
      model: model.trim(),
      code: code.trim(),
      config: configPart
    };

  } catch (err) {
    console.error("❌ Parsing failed:", input);
    throw err;
  }
}

// Get Grade
function getGrade(code) {
  const item = material_master.find(m => m.code.trim().toUpperCase() === code.trim().toUpperCase());
  if (!item) throw `Invalid Code: ${code}`;
  return item.grade;
}

// Get Price
function getFinalPrice(model, config, grade) {

  // 🔥 MULTI CONFIG
  if (config.includes("+")) {

    const parts = config.split("+").map(p => p.trim());
    let total = 0;

    for (let part of parts) {

      // 🔥 DEBUG (keep this)
      console.log("🔍 Checking:", model, part, grade);

      const item = price_sheet.find(p =>
        p.model.trim() === model.trim() &&
        p.config.trim().toUpperCase() === part &&
        p.grade.trim() === grade.trim()
      );

      if (!item) {
        console.error("❌ Missing part:", part);
        throw `Missing part price: ${part}`;
      }

      total += item.price;
    }

    return total;
  }

  // 🔹 SINGLE CONFIG
  const item = price_sheet.find(p =>
    p.model.trim() === model.trim() &&
    p.config.trim().toUpperCase() === config &&
    p.grade.trim() === grade.trim()
  );

  if (!item) {
    throw `Price not found: ${model} | ${config} | ${grade}`;
  }

  return item.price;
}

// Main Function
async function runCalculator() {
  await loadData();

  const inputText = document.getElementById("input").value;
  const lines = inputText.split("\n").filter(l => l.trim() !== "");

  let results = [];

  for (let line of lines) {
    try {
      const parsed = parseVariant(line);
      const grade = getGrade(parsed.code);
      const price = getFinalPrice(parsed.model, parsed.config, grade);

      results.push({
        ...parsed,
        grade,
        price
      });

    } catch (e) {
      console.error("❌ Error line:", line, e);
      alert(e);
    }
  }

  const basePrice = results[0]?.price || 0;

  results = results.map(r => ({
    ...r,
    extra: r.price - basePrice
  }));

  displayResults(results);
}

// Display Table
function displayResults(data) {
  const tbody = document.querySelector("#output tbody");
  tbody.innerHTML = "";

  data.forEach(d => {
    const row = `
      <tr>
        <td>${d.model}</td>
        <td>${d.code}</td>
        <td>${d.grade}</td>
        <td>${d.config}</td>
        <td>${Math.round(d.price)}</td>
        <td>${Math.round(d.extra)}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}
