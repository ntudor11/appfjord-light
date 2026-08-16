import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { analyzeExpenses } from "../../ruleEngine.js";
import type { Expense, Vendor } from "../../types.js";

const upload = multer({ storage: multer.memoryStorage() });
export const analyzeRouter = Router();

const parseBoolean = (value: string) => value === "true";
const parseNumber = (value: string) => (value === "" ? "" : Number(value));

const validateRequiredHeaders = (headers: string[], required: string[]) => {
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return `Missing required CSV columns: ${missing.join(", ")}`;
  }
  return null;
};

const parseExpenses = (buffer: Buffer): Expense[] => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length === 0) return [];
  const headers = Object.keys(records[0]);
  const headerError = validateRequiredHeaders(headers, [
    "expense_id",
    "date",
    "entity",
    "country",
    "amount",
    "currency",
    "merchant_name",
    "vendor_id",
    "category",
    "is_card",
    "tax_code",
    "vat_amount",
  ]);
  if (headerError) throw new Error(headerError);

  return records.map((row) => ({
    expense_id: row.expense_id ?? "",
    date: row.date ?? "",
    entity: row.entity ?? "",
    country: row.country ?? "",
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? "",
    merchant_name: row.merchant_name ?? "",
    vendor_id: row.vendor_id ?? "",
    category: row.category ?? "",
    is_card: parseBoolean(row.is_card ?? "false"),
    tax_code: row.tax_code ?? "",
    vat_amount: parseNumber(row.vat_amount ?? ""),
  }));
};

const parseVendors = (buffer: Buffer): Vendor[] => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length === 0) return [];
  const headers = Object.keys(records[0]);
  const headerError = validateRequiredHeaders(headers, [
    "vendor_id",
    "name",
    "country",
    "state",
    "type",
    "category",
    "w9_on_file",
    "w8_on_file",
  ]);
  if (headerError) throw new Error(headerError);

  return records.map((row) => ({
    vendor_id: row.vendor_id ?? "",
    name: row.name ?? "",
    country: row.country ?? "",
    state: row.state ?? "",
    type: row.type ?? "",
    category: row.category ?? "",
    w9_on_file: parseBoolean(row.w9_on_file ?? "false"),
    w8_on_file: parseBoolean(row.w8_on_file ?? "false"),
  }));
};

analyzeRouter.post(
  "/analyze",
  upload.fields([
    { name: "expensesFile", maxCount: 1 },
    { name: "vendorsFile", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[] | undefined>;
      const expensesFile = files.expensesFile?.[0];
      const vendorsFile = files.vendorsFile?.[0];

      if (!expensesFile || !vendorsFile) {
        res.status(400).json({ message: "Both expensesFile and vendorsFile are required." });
        return;
      }

      const expenses = parseExpenses(expensesFile.buffer);
      const vendors = parseVendors(vendorsFile.buffer);
      const result = analyzeExpenses(expenses, vendors);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to analyze uploaded CSV files.";
      res.status(400).json({ message });
    }
  },
);
