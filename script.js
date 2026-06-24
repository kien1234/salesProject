const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVv8v6KZaUWogAqZNZZEGZT9MxGNrGsxeWlBpKP1tvF_a4X6Em4vTrD3cmy3cOBmmShzt8TgAtwCXD/pub?gid=0&single=true&output=csv";
const LOW_STOCK_THRESHOLD = 5;

const sampleProducts = [
  {
    code: "SP001",
    name: "Mi Hao Hao tom chua cay",
    category: "Do an",
    price: 4500,
    quantity: 120,
    note: "Thung 30 goi",
  },
  {
    code: "SP002",
    name: "Sua tuoi Vinamilk 180ml",
    category: "Do uong",
    price: 8000,
    quantity: 24,
    note: "",
  },
  {
    code: "SP003",
    name: "Nuoc mam Nam Ngu 500ml",
    category: "Gia vi",
    price: 39000,
    quantity: 4,
    note: "Sap het",
  },
];

const elements = {
  setupNotice: document.querySelector("#setupNotice"),
  reloadButton: document.querySelector("#reloadButton"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  totalProducts: document.querySelector("#totalProducts"),
  totalQuantity: document.querySelector("#totalQuantity"),
  lowStockCount: document.querySelector("#lowStockCount"),
  statusMessage: document.querySelector("#statusMessage"),
  productTableBody: document.querySelector("#productTableBody"),
};

let products = [];

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function parseNumber(value) {
  const normalized = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number.parseFloat(normalized) || 0;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

function mapCsvRowsToProducts(csvText) {
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => normalizeText(header));

  return rows.slice(1).map((row) => {
    const record = headers.reduce((result, header, index) => {
      result[header] = row[index]?.trim() ?? "";
      return result;
    }, {});

    return {
      code: record.ma || record.code || record.sku || "",
      name: record.ten || record.name || record["ten san pham"] || "",
      category: record.nhom || record.category || record["nhom hang"] || "",
      price: parseNumber(record.gia || record.price || record["gia ban"]),
      quantity: parseNumber(record.ton || record.quantity || record["ton kho"]),
      note: record["ghi chu"] || record.note || "",
    };
  });
}

function addCacheBust(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cacheBust=${Date.now()}`;
}

async function loadProducts() {
  elements.statusMessage.textContent = "Dang tai du lieu...";

  if (!SHEET_CSV_URL) {
    elements.setupNotice.classList.remove("hidden");
    products = sampleProducts;
    elements.statusMessage.textContent =
      "Dang hien thi du lieu mau. Hay cau hinh Google Sheets de dung du lieu that.";
    render();
    return;
  }

  try {
    const response = await fetch(addCacheBust(SHEET_CSV_URL));

    if (!response.ok) {
      throw new Error(`Khong tai duoc du lieu (${response.status})`);
    }

    const csvText = await response.text();
    products = mapCsvRowsToProducts(csvText).filter((product) => product.name);
    elements.setupNotice.classList.add("hidden");
    elements.statusMessage.textContent = `Da tai ${products.length} san pham.`;
    render();
  } catch (error) {
    console.error(error);
    elements.statusMessage.textContent =
      "Khong tai duoc Google Sheets. Kiem tra lai link publish CSV va quyen truy cap.";
  }
}

function updateCategoryOptions() {
  const currentValue = elements.categoryFilter.value;
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort(
    (first, second) => first.localeCompare(second, "vi"),
  );

  elements.categoryFilter.innerHTML = '<option value="">Tat ca</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.append(option);
  });

  elements.categoryFilter.value = categories.includes(currentValue) ? currentValue : "";
}

function getFilteredProducts() {
  const keyword = normalizeText(elements.searchInput.value);
  const selectedCategory = elements.categoryFilter.value;

  return products.filter((product) => {
    const searchableText = normalizeText(
      [product.code, product.name, product.category, product.note].join(" "),
    );
    const matchesKeyword = !keyword || searchableText.includes(keyword);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;

    return matchesKeyword && matchesCategory;
  });
}

function renderStats(filteredProducts) {
  const totalQuantity = filteredProducts.reduce((sum, product) => sum + product.quantity, 0);
  const lowStockCount = filteredProducts.filter(
    (product) => product.quantity <= LOW_STOCK_THRESHOLD,
  ).length;

  elements.totalProducts.textContent = formatNumber(filteredProducts.length);
  elements.totalQuantity.textContent = formatNumber(totalQuantity);
  elements.lowStockCount.textContent = formatNumber(lowStockCount);
}

function renderTable(filteredProducts) {
  elements.productTableBody.innerHTML = "";

  if (filteredProducts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.className = "empty";
    cell.colSpan = 5;
    cell.textContent = "Khong tim thay san pham phu hop.";
    row.append(cell);
    elements.productTableBody.append(row);
    return;
  }

  filteredProducts.forEach((product) => {
    const row = document.createElement("tr");
    const isLowStock = product.quantity <= LOW_STOCK_THRESHOLD;

    row.innerHTML = `
      <td data-label="Mã">${escapeHtml(product.code)}</td>
      <td data-label="Tên" class="productName">
        <span>${escapeHtml(product.name)}</span>
        <strong class="productPrice">${formatCurrency(product.price)}</strong>
      </td>
      <td data-label="Nhóm">${escapeHtml(product.category)}</td>
      <td data-label="Tồn kho" class="number ${isLowStock ? "lowStock" : ""}">${formatNumber(product.quantity)}</td>
      <td data-label="Ghi chú">${escapeHtml(product.note)}</td>
    `;

    elements.productTableBody.append(row);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function render() {
  updateCategoryOptions();
  const filteredProducts = getFilteredProducts();
  renderStats(filteredProducts);
  renderTable(filteredProducts);
}

elements.reloadButton.addEventListener("click", loadProducts);
elements.searchInput.addEventListener("input", render);
elements.categoryFilter.addEventListener("change", render);

loadProducts();
