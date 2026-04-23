const csvFile = "database.csv";

let rawData = [];
let filteredData = [];
let currentSelectedOccurrenceID = null;

const visibleColumns = [
  "occurrenceID",
  "Bottle_Box_No",
  "sex",
  "lifeStage",
  "country",
  "stateProvince",
  "locality",
  "decimalLatitude",
  "decimalLongtitude",
  "family",
  "genus",
  "specificEpithet",
  "typeStatus",
  "eventDate",
  "day",
  "month",
  "year"
];

const allDetailOrder = [
  "occurrenceID",
  "Bottle_Box_No",
  "Data_Recorder",
  "associatedID",
  "sex",
  "lifeStage",
  "LocalityLabel",
  "country",
  "stateProvince",
  "locality",
  "[(DMS) Latitude & Longitude]",
  "elevation",
  "decimalLatitude",
  "decimalLongtitude",
  "georeferenceVerificationStatus",
  "family",
  "genus",
  "specificEpithet",
  "identificationQualifier",
  "typeStatus",
  "eventDate",
  "day",
  "month",
  "year",
  "recordedBy",
  "Remark"
];

const inputs = {
  quickSearch: document.getElementById("quickSearch"),
  numberSearch: document.getElementById("numberSearch"),
  localitySearch: document.getElementById("localitySearch"),
  eventSearch: document.getElementById("eventSearch"),
  taxonomySearch: document.getElementById("taxonomySearch"),
  sexSearch: document.getElementById("sexSearch"),
  lifeStageSearch: document.getElementById("lifeStageSearch"),
  recordedBySearch: document.getElementById("recordedBySearch"),
  remarksSearch: document.getElementById("remarksSearch")
};

const rowsPerPageSelect = document.getElementById("rowsPerPage");
const tableHeadRow = document.getElementById("tableHeadRow");
const tableBody = document.getElementById("tableBody");
const recordCount = document.getElementById("recordCount");
const detailsContent = document.getElementById("detailsContent");
const tableWrapper = document.getElementById("tableWrapper");
const tableScrollTop = document.getElementById("tableScrollTop");
const tableScrollBottom = document.getElementById("tableScrollBottom");
const tableScrollTopInner = document.getElementById("tableScrollTopInner");
const tableScrollBottomInner = document.getElementById("tableScrollBottomInner");

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function splitTerms(text) {
  return normalizeValue(text)
    .split(/\s+/)
    .filter(Boolean);
}

function fieldContainsAllTerms(value, query) {
  const text = normalizeValue(value);
  const terms = splitTerms(query);
  return terms.every(term => text.includes(term));
}

function anyFieldContainsAllTerms(row, fields, query) {
  const terms = splitTerms(query);
  if (terms.length === 0) return true;

  const combined = fields
    .map(field => normalizeValue(row[field]))
    .join(" ");

  return terms.every(term => combined.includes(term));
}

function globalSearchMatch(row, query) {
  const terms = splitTerms(query);
  if (terms.length === 0) return true;

  const combined = Object.values(row)
    .map(v => normalizeValue(v))
    .join(" ");

  return terms.every(term => combined.includes(term));
}

function buildTableHeader() {
  tableHeadRow.innerHTML = "";

  visibleColumns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    tableHeadRow.appendChild(th);
  });
}

function renderTable() {
  tableBody.innerHTML = "";

  const limit = parseInt(rowsPerPageSelect.value, 10);
  const toRender = filteredData.slice(0, limit);

  if (filteredData.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = visibleColumns.length;
    td.textContent = "No matching records found.";
    td.style.color = "#b8c6d9";
    td.style.fontStyle = "italic";
    tr.appendChild(td);
    tableBody.appendChild(tr);
    recordCount.textContent = "0 matching records";
    syncScrollWidths();
    return;
  }

  toRender.forEach(row => {
    const tr = document.createElement("tr");

    if (row.occurrenceID === currentSelectedOccurrenceID) {
      tr.classList.add("selected");
    }

    tr.addEventListener("click", () => {
      currentSelectedOccurrenceID = row.occurrenceID;
      showDetails(row);
      renderTable();
    });

    visibleColumns.forEach(col => {
      const td = document.createElement("td");
      td.textContent = row[col] ?? "";
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  recordCount.textContent = `${filteredData.length} matching record(s) | showing ${Math.min(limit, filteredData.length)}`;
  syncScrollWidths();
}

function showDetails(row) {
  detailsContent.innerHTML = "";

  allDetailOrder.forEach(key => {
    const wrapper = document.createElement("div");
    wrapper.className = "detail-item";

    const k = document.createElement("div");
    k.className = "detail-key";
    k.textContent = key;

    const v = document.createElement("div");
    v.className = "detail-value";
    v.textContent = row[key] ?? "";

    wrapper.appendChild(k);
    wrapper.appendChild(v);
    detailsContent.appendChild(wrapper);
  });
}

function applyFilters() {
  filteredData = rawData.filter(row => {
    const quickOk = globalSearchMatch(row, inputs.quickSearch.value);

    const numberOk = anyFieldContainsAllTerms(
      row,
      ["occurrenceID", "Bottle_Box_No", "associatedID"],
      inputs.numberSearch.value
    );

    const localityOk = anyFieldContainsAllTerms(
      row,
      ["LocalityLabel", "country", "stateProvince", "locality"],
      inputs.localitySearch.value
    );

    const eventOk = anyFieldContainsAllTerms(
      row,
      ["eventDate", "day", "month", "year"],
      inputs.eventSearch.value
    );

    const taxonomyOk = anyFieldContainsAllTerms(
      row,
      ["family", "genus", "specificEpithet", "typeStatus"],
      inputs.taxonomySearch.value
    );

    const sexOk = fieldContainsAllTerms(row["sex"], inputs.sexSearch.value);

    const lifeStageOk = fieldContainsAllTerms(row["lifeStage"], inputs.lifeStageSearch.value);

    const recordedByOk = anyFieldContainsAllTerms(
      row,
      ["recordedBy", "Data_Recorder"],
      inputs.recordedBySearch.value
    );

    const remarksOk = anyFieldContainsAllTerms(
      row,
      ["Remark", "georeferenceVerificationStatus", "identificationQualifier"],
      inputs.remarksSearch.value
    );

    return (
      quickOk &&
      numberOk &&
      localityOk &&
      eventOk &&
      taxonomyOk &&
      sexOk &&
      lifeStageOk &&
      recordedByOk &&
      remarksOk
    );
  });

  renderTable();

  if (currentSelectedOccurrenceID) {
    const selectedRow = filteredData.find(r => r.occurrenceID === currentSelectedOccurrenceID);
    if (selectedRow) {
      showDetails(selectedRow);
    } else {
      currentSelectedOccurrenceID = null;
      detailsContent.innerHTML = `<div class="empty-note">Click a record row to view all fields.</div>`;
    }
  }
}

function resetFilters() {
  Object.values(inputs).forEach(input => {
    input.value = "";
  });

  currentSelectedOccurrenceID = null;
  detailsContent.innerHTML = `<div class="empty-note">Click a record row to view all fields.</div>`;
  applyFilters();
}

function syncScrollWidths() {
  const table = document.getElementById("catalogTable");
  const width = table.scrollWidth;
  tableScrollTopInner.style.width = width + "px";
  tableScrollBottomInner.style.width = width + "px";
}

tableScrollTop.addEventListener("scroll", () => {
  tableWrapper.scrollLeft = tableScrollTop.scrollLeft;
  tableScrollBottom.scrollLeft = tableScrollTop.scrollLeft;
});

tableScrollBottom.addEventListener("scroll", () => {
  tableWrapper.scrollLeft = tableScrollBottom.scrollLeft;
  tableScrollTop.scrollLeft = tableScrollBottom.scrollLeft;
});

tableWrapper.addEventListener("scroll", () => {
  tableScrollTop.scrollLeft = tableWrapper.scrollLeft;
  tableScrollBottom.scrollLeft = tableWrapper.scrollLeft;
});

Object.values(inputs).forEach(input => {
  input.addEventListener("input", applyFilters);
});

rowsPerPageSelect.addEventListener("change", renderTable);
document.getElementById("resetBtn").addEventListener("click", resetFilters);

buildTableHeader();

Papa.parse(csvFile, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    rawData = results.data.map(row => {
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim();
        cleanRow[cleanKey] = row[key];
      });
      return cleanRow;
    });

    filteredData = [...rawData];
    renderTable();
  },
  error: function(err) {
    recordCount.textContent = "Failed to load CSV data.";
    tableBody.innerHTML = `
      <tr>
        <td colspan="${visibleColumns.length}" style="color:#ffb3b3;">
          Error loading CSV: ${err.message}
        </td>
      </tr>
    `;
  }
});

window.addEventListener("resize", syncScrollWidths);
