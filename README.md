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

## Usage of Agentic AI features:

- Used for parsing structured and unstructured data
- Used for generating slides based on analysed data and the self-identified opportunities to address
- Used for agentic development of the attached prototype with pre-defined sub-agents and skills
- NOT used for deciding opportunities based upon the analysed data (human review in this case is more valuable)
- NOT used in decision making process of assessing the work sequence for the next 60 days (again, prioritization efforts must be human-led, not agent-led).

## The Friday Message (email sent to company CFO)

Dear CFO,

I trust all is well. Here is some brief feedback after my first week in the project.

Besides sitting with your team to collect direct data points, I went through the support tickets from the last 6 weeks, and through the full feature backlog. Based on that, I found that the main topics of interest are integrations (25 tickets and 18 backlog items around Stripe, JP Morgan and bank connections) and card / expenses tickets (21 tickets and 9 backlog items). Further, there is also the Tax and controls topic, which has 8 backlog items, out of which 6 are marked as urgent.

After discussing with the rest of the team, we decided to kickstart 2 topics in parallel from next week: a Tax & VAT data quality pass on expenses and vendor records and a scoped fix for the auditor self-service, meaning to provide an on-demand audit pack, instead of addressing ad-hoc requests. The reason behind this choice is that we don’t need to wait on the Light core platform roadmap features to complete, so we can address these important topics with a lower degree of effort.

To continue, can you please point me to the right persons in your team that can offer assistance with the VAT logic and that own the auditor access decisions? It would be a relief to know these things beforehand, to prevent building a workaround that conflicts with a control you auditors currently rely on.

I’m expecting to have a working prototype by the end of week 3, but I’ll definitely reach out early if our findings bring us to other development paths.

Best,

Your new Agentic Customer Engineer
