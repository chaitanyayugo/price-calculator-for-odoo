let material_master = [];
let price_sheet = [];

// Load JSON files
async function loadData() {
  material_master = await fetch('material_master.json').then(res => res.json());
  price_sheet = await fetch('price_sheet.json').then(res => res.json());
}

// Parse Variant
function parseVariant(input) {
  try {
    // STEP 1: Extract ALL brackets
    const brackets = input.match(/\(([^()]*)\)/g);

    if (!brackets || brackets.length < 2) {
      throw "Invalid format";
    }

    // STEP 2: FIRST bracket = prefix (DM / NW / etc)
    const prefix = brackets[0].replace(/[()]/g, "").trim();

    // STEP 3: Extract model (text after first bracket)
    const afterPrefix = input.split(")")[1].trim();
    const modelName = afterPrefix.split(" ")[0];

    const model = `${prefix}-${modelName}`;

    // STEP 4: LAST bracket = fabric + config
    const last = brackets[brackets.length - 1].replace(/[()]/g, "");

    const [fabricPart, configPart] = last.split(",");

    if (!fabricPart || !configPart) {
      throw "Invalid fabric/config format";
    }

    // STEP 5: Extract code dynamically
    const code = fabricPart.trim().split("-")[0];

    return {
      model: model.trim(),
      code: code.trim(),
      config: configPart.trim()
    };

  } catch (err) {
    console.error("❌ Parsing failed:", input);
    throw err;
  }
}
// Get Grade
function getGrade(code) {
  const item = material_master.find(m => m.code === code);
  if (!item) throw `Invalid Code: ${code}`;
  return item.grade;
}

// Get Price
function getPrice(model, config, grade) {
  const item = price_sheet.find(p =>
    p.model === model &&
    p.config === config &&
    p.grade === grade
  );

  if (!item) throw `Price not found: ${model} | ${config} | ${grade}`;
  return item.price;
}

// Main Function
async function runCalculator() {
  await loadData();

  const inputText = document.getElementById("input").value;
  const lines = inputText.split("\n").filter(l => l.trim() !== "");

  let results = [];

  lines.forEach(line => {
    try {
      const parsed = parseVariant(line);
      const grade = getGrade(parsed.code);
      const price = getPrice(parsed.model, parsed.config, grade);

      results.push({
        ...parsed,
        grade,
        price
      });
    } catch (e) {
      alert(e);
    }
  });

  // Base price = first variant
  const basePrice = results[0]?.price || 0;

  // Calculate extras
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
        <td>${d.price}</td>
        <td>${d.extra}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}
