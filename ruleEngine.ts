import { TAX_DEFAULTS } from "./config/taxDefaults.js";
import type { EnrichedExpense, Expense, Summary, Vendor } from "./types.js";

type RuleResult = {
  needsReview: boolean;
  reasons: string[];
  suggestedVatTreatment: string;
  confidence: "high" | "medium" | "low";
};

const SE_MEAL_THRESHOLD = 500;

const isMissingVatAmount = (value: Expense["vat_amount"]) => value === "" || value === undefined || value === null;

const getDefaultTaxCode = (country: string, category: string) =>
  TAX_DEFAULTS[country]?.[category] ?? `${country}_STANDARD`;

const checkMissingTaxCode = (expense: Expense): RuleResult | null => {
  if (expense.tax_code !== "") {
    return null;
  }

  return {
    needsReview: true,
    reasons: ["missing tax_code"],
    suggestedVatTreatment: getDefaultTaxCode(expense.country, expense.category),
    confidence: "medium",
  };
};

const checkCrossEntityMismatch = (expense: Expense): RuleResult | null => {
  if (expense.tax_code === "") {
    return null;
  }

  if (!expense.tax_code.startsWith(`${expense.entity}_`)) {
    return {
      needsReview: true,
      reasons: ["tax_code country mismatch (mirrors T-56 Sphere bug)"],
      suggestedVatTreatment: getDefaultTaxCode(expense.entity, expense.category),
      confidence: "high",
    };
  }

  return null;
};

const checkMealBenefitTree = (expense: Expense): RuleResult | null => {
  if (expense.country !== "SE" || (expense.category !== "meal" && expense.category !== "benefit")) {
    return null;
  }

  let suggestedVatTreatment = "SE_MEAL_BUSINESS";
  const reasons: string[] = [];
  let confidence: "high" | "medium" | "low" = "medium";

  if (expense.category === "meal") {
    const looksLikeMealVendor = /catering|meal|delivery/i.test(expense.merchant_name);
    if (!looksLikeMealVendor || expense.amount >= SE_MEAL_THRESHOLD) {
      confidence = "low";
      reasons.push("meal classification uncertain — verify headcount/purpose with employee");
    }
  } else {
    suggestedVatTreatment = "SE_MEAL_BENEFIT";
  }

  if (expense.tax_code === suggestedVatTreatment) {
    return reasons.length > 0
      ? { needsReview: true, reasons, suggestedVatTreatment, confidence }
      : null;
  }

  reasons.push("SE meal/benefit VAT treatment does not match decision tree output");
  return { needsReview: true, reasons, suggestedVatTreatment, confidence };
};

const checkMissingVat = (expense: Expense): RuleResult | null => {
  if (!isMissingVatAmount(expense.vat_amount)) {
    return null;
  }

  return {
    needsReview: true,
    reasons: ["VAT compliance data missing from card/reimbursement — mirrors LT-1038"],
    suggestedVatTreatment: expense.tax_code || getDefaultTaxCode(expense.country, expense.category),
    confidence: "low",
  };
};

const checkVendorTaxDataGap = (expense: Expense, vendors: Vendor[]): RuleResult | null => {
  if (expense.vendor_id === "") {
    return null;
  }

  const vendor = vendors.find((entry) => entry.vendor_id === expense.vendor_id);
  if (!vendor || vendor.country !== "US") {
    return null;
  }

  if (vendor.state === "" || vendor.type === "" || !vendor.w9_on_file) {
    return {
      needsReview: true,
      reasons: ["vendor missing state/type/W9 — 1099 season blocker"],
      suggestedVatTreatment: expense.tax_code || getDefaultTaxCode(expense.country, expense.category),
      confidence: "high",
    };
  }

  return null;
};

const mergeResults = (expense: Expense, results: Array<RuleResult | null>): EnrichedExpense => {
  const activeResults = results.filter((result): result is RuleResult => result !== null);
  const reasons = activeResults.flatMap((result) => result.reasons);
  const suggestedVatTreatment =
    activeResults.find((result) => result.suggestedVatTreatment !== "")?.suggestedVatTreatment ||
    expense.tax_code ||
    getDefaultTaxCode(expense.country, expense.category);
  const confidence: RuleResult["confidence"] =
    activeResults.some((result) => result.confidence === "low")
      ? "low"
      : activeResults.some((result) => result.confidence === "high")
        ? "high"
        : "medium";

  return {
    ...expense,
    needs_review: activeResults.length > 0,
    reason: reasons.join("; "),
    suggested_vat_treatment: suggestedVatTreatment,
    confidence,
  };
};

export const analyzeExpenses = (expenses: Expense[], vendors: Vendor[]) => {
  const enriched = expenses.map((expense) =>
    mergeResults(expense, [
      checkMissingTaxCode(expense),
      checkCrossEntityMismatch(expense),
      checkMealBenefitTree(expense),
      checkMissingVat(expense),
      checkVendorTaxDataGap(expense, vendors),
    ]),
  );

  const summary: Summary = {
    total_expenses: expenses.length,
    missing_tax_code_pct: Math.round(
      (expenses.filter((expense) => expense.tax_code === "").length / Math.max(expenses.length, 1)) * 100,
    ),
    missing_vat_amount_pct: Math.round(
      (expenses.filter((expense) => isMissingVatAmount(expense.vat_amount)).length / Math.max(expenses.length, 1)) * 100,
    ),
    us_vendors_missing_state_or_type: vendors.filter(
      (vendor) => vendor.country === "US" && (vendor.state === "" || vendor.type === ""),
    ).length,
    us_vendors_missing_w9: vendors.filter((vendor) => vendor.country === "US" && !vendor.w9_on_file).length,
    expenses_needing_review: enriched.filter((expense) => expense.needs_review).length,
    by_country: {},
    by_category: {},
  };

  for (const expense of enriched) {
    summary.by_country[expense.country] ??= { total: 0, needs_review: 0 };
    summary.by_country[expense.country].total += 1;
    if (expense.needs_review) summary.by_country[expense.country].needs_review += 1;

    summary.by_category[expense.category] ??= { total: 0, needs_review: 0 };
    summary.by_category[expense.category].total += 1;
    if (expense.needs_review) summary.by_category[expense.category].needs_review += 1;
  }

  return { enriched, summary };
};
