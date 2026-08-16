import { readFileSync } from "node:fs";
import { analyzeExpenses } from "../../ruleEngine.ts";
import type { Expense, Vendor } from "../../types.ts";

const getArgValue = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log([
    "Usage:",
    "  npm run analyze -- --expenses path/to/expenses.csv --vendors path/to/vendors.csv",
    "",
    "Options:",
    "  --expenses   Path to expenses CSV",
    "  --vendors    Path to vendors CSV",
    "  -h, --help   Show this help message",
  ].join("\n"));
  process.exit(0);
}

const expensesPath = getArgValue("--expenses");
const vendorsPath = getArgValue("--vendors");

if (!expensesPath || !vendorsPath) {
  console.error("Usage: npm run analyze -- --expenses path/to/expenses.csv --vendors path/to/vendors.csv");
  process.exit(1);
}

const parseBool = (value: string) => value === "true";
const parseVatAmount = (value: string) => (value === "" ? "" : Number(value));

const parseCsv = (csv: string) => {
  const [headerLine, ...lines] = csv.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) =>
    Object.fromEntries(
      headers.map((header, index) => [header, line.split(",")[index] ?? ""]),
    ),
  );
};

const expenses = parseCsv(readFileSync(expensesPath, "utf8")).map((row) => ({
  expense_id: row.expense_id,
  date: row.date,
  entity: row.entity,
  country: row.country,
  amount: Number(row.amount),
  currency: row.currency,
  merchant_name: row.merchant_name,
  vendor_id: row.vendor_id,
  category: row.category,
  is_card: parseBool(row.is_card),
  tax_code: row.tax_code,
  vat_amount: parseVatAmount(row.vat_amount),
})) as Expense[];

const vendors = parseCsv(readFileSync(vendorsPath, "utf8")).map((row) => ({
  vendor_id: row.vendor_id,
  name: row.name,
  country: row.country,
  state: row.state,
  type: row.type,
  category: row.category,
  w9_on_file: parseBool(row.w9_on_file),
  w8_on_file: parseBool(row.w8_on_file),
})) as Vendor[];

const result = analyzeExpenses(expenses, vendors);

console.log(JSON.stringify(result.summary, null, 2));
