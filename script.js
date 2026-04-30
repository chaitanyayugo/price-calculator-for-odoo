let material_master = [];
let price_sheet = [];

// Load JSON files
async function loadData() {
  material_master = await fetch('material_master.json').then(res => res.json());
  price_sheet = await fetch('price_sheet.json').then(res => res.json());
}

// Parse Variant
function parseVariant(input) {
  const modelMatch = input.match(/\(DM\)\s*([A-Z0-9-]+)/);
  const fabricMatch = input.match(/\(([^,]+),/);
  const configMatch = input.match(/,\s*([^)]+)\)/);

  const model = "DM-" + modelMatch[1];
  const fabricFull = fabricMatch[1];
  const code = fabricFull.split('-')[0].trim();
  const config = configMatch[1].trim();

  return { model, code, config };
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
