export interface Expense {
  expense_id: string;
  date: string;
  entity: string;
  country: string;
  amount: number;
  currency: string;
  merchant_name: string;
  vendor_id: string;
  category: string;
  is_card: boolean;
  tax_code: string;
  vat_amount: number | "";
}

export interface Vendor {
  vendor_id: string;
  name: string;
  country: string;
  state: string;
  type: string;
  category: string;
  w9_on_file: boolean;
  w8_on_file: boolean;
}

export interface EnrichedExpense extends Expense {
  needs_review: boolean;
  reason: string;
  suggested_vat_treatment: string;
  confidence: "high" | "medium" | "low";
}

export interface Summary {
  total_expenses: number;
  missing_tax_code_pct: number;
  missing_vat_amount_pct: number;
  us_vendors_missing_state_or_type: number;
  us_vendors_missing_w9: number;
  expenses_needing_review: number;
  by_country: Record<string, { total: number; needs_review: number }>;
  by_category: Record<string, { total: number; needs_review: number }>;
}

