# Tax / VAT / 1099 Data Quality Prototype

This app ingests `expenses.csv` and `vendors.csv`, runs a rule-based tax/VAT/1099 review, and returns:

- an enriched CSV-shaped result with `needs_review`, `reason`, `suggested_vat_treatment`, and `confidence`
- a summary dashboard payload for Controller/Head of Tax review

## Run full stack app (frontend + backend)

In the root directory:

- `npm install`
- `npm run dev`

## Rule engine via CLI

Run the pure engine directly against any two CSV files that match the expected shape:

```bash
npm run analyze -- --expenses ./synthetic-data/expenses.csv --vendors ./synthetic-data/vendors.csv
```

This prints the summary JSON to stdout. The same engine is used by the API and the UI.

## Backend API only

Start the server:

```bash
npm --workspace server run dev
```

Then call `POST /api/analyze` with multipart form-data.

### curl

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "expensesFile=@./synthetic-data/expenses.csv" \
  -F "vendorsFile=@./synthetic-data/vendors.csv"
```

### Node fetch

```js
const formData = new FormData();
formData.append(
  "expensesFile",
  new Blob([await fs.promises.readFile("./synthetic-data/expenses.csv")]),
  "expenses.csv",
);
formData.append(
  "vendorsFile",
  new Blob([await fs.promises.readFile("./synthetic-data/vendors.csv")]),
  "vendors.csv",
);

const response = await fetch("http://localhost:3000/api/analyze", {
  method: "POST",
  body: formData,
});
const data = await response.json();
```

### axios

```js
import axios from "axios";
import FormData from "form-data";
import fs from "node:fs";

const formData = new FormData();
formData.append(
  "expensesFile",
  fs.createReadStream("./synthetic-data/expenses.csv"),
);
formData.append(
  "vendorsFile",
  fs.createReadStream("./synthetic-data/vendors.csv"),
);

const { data } = await axios.post(
  "http://localhost:3000/api/analyze",
  formData,
  {
    headers: formData.getHeaders(),
  },
);
```

## Smoke test

- `npm run smoke-test`

## Further improvements

- Replace the hard-coded `(country, category) -> tax code` lookup with a finance-editable config file.
- Add real Sphere/API lookups for default code selection.
- Persist runs so finance can compare review rates week over week.
- Add an LLM-assisted explanation draft only for ambiguous rows, not for tax determinations.
- Add role-based read access for auditor-style review of locked periods.
