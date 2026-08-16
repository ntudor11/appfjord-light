import { readFileSync } from "node:fs";
import { analyzeExpenses } from "../../ruleEngine.ts";
import type { Expense, Vendor } from "../../types.ts";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

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

const expenses = parseCsv(
  readFileSync(
    new URL("../../synthetic-data/expenses.csv", import.meta.url),
    "utf8",
  ),
).map((row) => ({
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

const vendors = parseCsv(
  readFileSync(
    new URL("../../synthetic-data/vendors.csv", import.meta.url),
    "utf8",
  ),
).map((row) => ({
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
const exp64 = result.enriched.find(
  (expense) => expense.expense_id === "EXP-0064",
);
const exp63 = result.enriched.find(
  (expense) => expense.expense_id === "EXP-0063",
);

assert(Boolean(exp64?.needs_review), "EXP-0064 should need review");
assert(Boolean(exp64?.reason.includes("1099")), "EXP-0064 should mention 1099");
assert(
  Boolean(exp63?.reason.includes("country mismatch")),
  "EXP-0063 should flag country mismatch",
);
assert(result.summary.total_expenses === 66, "Expected 66 expenses");
assert(
  result.summary.expenses_needing_review >= 45 &&
    result.summary.expenses_needing_review <= 55,
  "Review count out of expected range",
);

console.log("Rule engine assertions passed.");
