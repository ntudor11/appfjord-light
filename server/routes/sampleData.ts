import { readFileSync } from "node:fs";
import { Router } from "express";

export const sampleDataRouter = Router();

sampleDataRouter.get("/sample-data", (_req, res) => {
  const expenses = readFileSync(new URL("../../synthetic-data/expenses.csv", import.meta.url), "utf8");
  const vendors = readFileSync(new URL("../../synthetic-data/vendors.csv", import.meta.url), "utf8");

  res.json({ expenses, vendors });
});
