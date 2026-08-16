export const TAX_DEFAULTS: Record<string, Record<string, string>> = {
  US: {
    software: "US_STANDARD",
    professional_services: "US_USE_TAX",
    meal: "US_STANDARD",
    travel: "US_EXEMPT",
    office_supplies: "US_STANDARD",
  },
  UK: {
    software: "UK_STANDARD_20",
    professional_services: "UK_STANDARD_20",
    meal: "UK_STANDARD_20",
    travel: "UK_ZERO_RATED",
  },
  CH: {
    professional_services: "CH_STANDARD_81",
    rent: "CH_REDUCED_26",
    software: "CH_STANDARD_81",
  },
  CA: {
    professional_services: "CA_GST_5",
    software: "CA_GST_5",
    office_supplies: "CA_HST_13",
  },
  SE: {
    meal: "SE_MEAL_BUSINESS",
    benefit: "SE_MEAL_BENEFIT",
  },
};

