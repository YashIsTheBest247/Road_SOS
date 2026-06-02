export interface EmergencyNumbers {
  /** ISO 3166-1 alpha-2 country code */
  code: string;
  country: string;
  /** Universal / general emergency number (e.g. 112, 911) */
  general?: string;
  police?: string;
  ambulance?: string;
  fire?: string;
}

// Keyed by ISO alpha-2 code (uppercase).
export const EMERGENCY_NUMBERS: Record<string, EmergencyNumbers> = {
  IN: { code: "IN", country: "India", general: "112", police: "100", ambulance: "108", fire: "101" },
  US: { code: "US", country: "United States", general: "911", police: "911", ambulance: "911", fire: "911" },
  GB: { code: "GB", country: "United Kingdom", general: "999", police: "999", ambulance: "999", fire: "999" },
  CA: { code: "CA", country: "Canada", general: "911", police: "911", ambulance: "911", fire: "911" },
  AU: { code: "AU", country: "Australia", general: "000", police: "000", ambulance: "000", fire: "000" },
  NZ: { code: "NZ", country: "New Zealand", general: "111", police: "111", ambulance: "111", fire: "111" },
  IE: { code: "IE", country: "Ireland", general: "112", police: "999", ambulance: "112", fire: "112" },
  DE: { code: "DE", country: "Germany", general: "112", police: "110", ambulance: "112", fire: "112" },
  FR: { code: "FR", country: "France", general: "112", police: "17", ambulance: "15", fire: "18" },
  IT: { code: "IT", country: "Italy", general: "112", police: "113", ambulance: "118", fire: "115" },
  ES: { code: "ES", country: "Spain", general: "112", police: "091", ambulance: "112", fire: "080" },
  PT: { code: "PT", country: "Portugal", general: "112", police: "112", ambulance: "112", fire: "112" },
  NL: { code: "NL", country: "Netherlands", general: "112", police: "112", ambulance: "112", fire: "112" },
  BE: { code: "BE", country: "Belgium", general: "112", police: "101", ambulance: "112", fire: "112" },
  CH: { code: "CH", country: "Switzerland", general: "112", police: "117", ambulance: "144", fire: "118" },
  AT: { code: "AT", country: "Austria", general: "112", police: "133", ambulance: "144", fire: "122" },
  SE: { code: "SE", country: "Sweden", general: "112", police: "112", ambulance: "112", fire: "112" },
  NO: { code: "NO", country: "Norway", general: "112", police: "112", ambulance: "113", fire: "110" },
  DK: { code: "DK", country: "Denmark", general: "112", police: "114", ambulance: "112", fire: "112" },
  FI: { code: "FI", country: "Finland", general: "112", police: "112", ambulance: "112", fire: "112" },
  PL: { code: "PL", country: "Poland", general: "112", police: "997", ambulance: "999", fire: "998" },
  CZ: { code: "CZ", country: "Czechia", general: "112", police: "158", ambulance: "155", fire: "150" },
  GR: { code: "GR", country: "Greece", general: "112", police: "100", ambulance: "166", fire: "199" },
  RU: { code: "RU", country: "Russia", general: "112", police: "102", ambulance: "103", fire: "101" },
  UA: { code: "UA", country: "Ukraine", general: "112", police: "102", ambulance: "103", fire: "101" },
  TR: { code: "TR", country: "Turkey", general: "112", police: "155", ambulance: "112", fire: "110" },
  CN: { code: "CN", country: "China", general: "110", police: "110", ambulance: "120", fire: "119" },
  JP: { code: "JP", country: "Japan", general: "110", police: "110", ambulance: "119", fire: "119" },
  KR: { code: "KR", country: "South Korea", general: "112", police: "112", ambulance: "119", fire: "119" },
  SG: { code: "SG", country: "Singapore", general: "999", police: "999", ambulance: "995", fire: "995" },
  MY: { code: "MY", country: "Malaysia", general: "999", police: "999", ambulance: "999", fire: "994" },
  TH: { code: "TH", country: "Thailand", general: "191", police: "191", ambulance: "1669", fire: "199" },
  ID: { code: "ID", country: "Indonesia", general: "112", police: "110", ambulance: "118", fire: "113" },
  PH: { code: "PH", country: "Philippines", general: "911", police: "911", ambulance: "911", fire: "911" },
  VN: { code: "VN", country: "Vietnam", general: "112", police: "113", ambulance: "115", fire: "114" },
  PK: { code: "PK", country: "Pakistan", general: "112", police: "15", ambulance: "1122", fire: "16" },
  BD: { code: "BD", country: "Bangladesh", general: "999", police: "999", ambulance: "999", fire: "999" },
  LK: { code: "LK", country: "Sri Lanka", general: "119", police: "119", ambulance: "1990", fire: "110" },
  NP: { code: "NP", country: "Nepal", general: "112", police: "100", ambulance: "102", fire: "101" },
  AE: { code: "AE", country: "United Arab Emirates", general: "999", police: "999", ambulance: "998", fire: "997" },
  SA: { code: "SA", country: "Saudi Arabia", general: "911", police: "999", ambulance: "997", fire: "998" },
  QA: { code: "QA", country: "Qatar", general: "999", police: "999", ambulance: "999", fire: "999" },
  IL: { code: "IL", country: "Israel", general: "112", police: "100", ambulance: "101", fire: "102" },
  ZA: { code: "ZA", country: "South Africa", general: "112", police: "10111", ambulance: "10177", fire: "10177" },
  NG: { code: "NG", country: "Nigeria", general: "112", police: "112", ambulance: "112", fire: "112" },
  KE: { code: "KE", country: "Kenya", general: "999", police: "999", ambulance: "999", fire: "999" },
  EG: { code: "EG", country: "Egypt", general: "123", police: "122", ambulance: "123", fire: "180" },
  BR: { code: "BR", country: "Brazil", general: "190", police: "190", ambulance: "192", fire: "193" },
  AR: { code: "AR", country: "Argentina", general: "911", police: "911", ambulance: "107", fire: "100" },
  MX: { code: "MX", country: "Mexico", general: "911", police: "911", ambulance: "911", fire: "911" },
  CL: { code: "CL", country: "Chile", general: "133", police: "133", ambulance: "131", fire: "132" },
  CO: { code: "CO", country: "Colombia", general: "123", police: "123", ambulance: "125", fire: "119" },
};

// EU + many other countries fall back to 112; the absolute global fallback is 112.
export const UNIVERSAL_EMERGENCY = "112";

export function getEmergencyNumbers(countryCode?: string | null): EmergencyNumbers {
  if (countryCode) {
    const hit = EMERGENCY_NUMBERS[countryCode.toUpperCase()];
    if (hit) return hit;
  }
  return {
    code: countryCode?.toUpperCase() ?? "??",
    country: "Unknown location",
    general: UNIVERSAL_EMERGENCY,
    police: UNIVERSAL_EMERGENCY,
    ambulance: UNIVERSAL_EMERGENCY,
    fire: UNIVERSAL_EMERGENCY,
  };
}
