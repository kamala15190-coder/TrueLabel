// ============================================================
// Statische Wissensbasis der Scoring-Engine.
// Regelbasiert = 0 € KI-Kosten pro Scan, deterministisch, erklärbar.
// ============================================================

export interface CategoryInfo {
  label: string;
  emoji: string;
  /** grobe CO₂-Schätzung in kg CO₂e pro kg Produkt (Größenordnung Agribalyse/Poore & Nemecek) */
  co2: number;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  cereals: { label: "Müsli & Cerealien", emoji: "🥣", co2: 1.0 },
  bread: { label: "Backwaren", emoji: "🥖", co2: 1.3 },
  pasta: { label: "Nudeln & Reis", emoji: "🍝", co2: 1.6 },
  milk: { label: "Milch", emoji: "🥛", co2: 3.0 },
  yogurt: { label: "Joghurt & Quark", emoji: "🥛", co2: 3.3 },
  cheese: { label: "Käse", emoji: "🧀", co2: 12 },
  "plant-drink": { label: "Pflanzendrinks", emoji: "🌾", co2: 0.9 },
  chocolate: { label: "Schokolade", emoji: "🍫", co2: 19 },
  sweets: { label: "Süßwaren", emoji: "🍬", co2: 4 },
  snacks: { label: "Snacks & Chips", emoji: "🍿", co2: 3 },
  beverages: { label: "Getränke", emoji: "🥤", co2: 0.7 },
  juice: { label: "Säfte", emoji: "🧃", co2: 1.1 },
  coffee: { label: "Kaffee", emoji: "☕", co2: 17 },
  frozen: { label: "Tiefkühl", emoji: "🧊", co2: 4 },
  meat: { label: "Fleisch", emoji: "🥩", co2: 15 },
  sausage: { label: "Wurstwaren", emoji: "🌭", co2: 8 },
  fish: { label: "Fisch", emoji: "🐟", co2: 6 },
  eggs: { label: "Eier", emoji: "🥚", co2: 4.5 },
  spreads: { label: "Aufstriche", emoji: "🥜", co2: 3 },
  oils: { label: "Öle & Fette", emoji: "🫒", co2: 6 },
  fruit: { label: "Obst", emoji: "🍎", co2: 0.4 },
  vegetables: { label: "Gemüse", emoji: "🥦", co2: 0.5 },
  legumes: { label: "Hülsenfrüchte", emoji: "🫘", co2: 0.8 },
  other: { label: "Sonstiges", emoji: "🛒", co2: 3 },
};

/** OpenFoodFacts-Kategorie-Tags → unsere Kategorie-Keys (spezifischste zuerst prüfen). */
export const OFF_CATEGORY_MAP: [string, string][] = [
  ["en:oat-flakes", "cereals"],
  ["en:breakfast-cereals", "cereals"],
  ["en:mueslis", "cereals"],
  ["en:flakes", "cereals"],
  ["en:cereals-and-potatoes", "cereals"],
  ["en:breads", "bread"],
  ["en:bakery-products", "bread"],
  ["en:pastas", "pasta"],
  ["en:rices", "pasta"],
  ["en:milks", "milk"],
  ["en:yogurts", "yogurt"],
  ["en:quarks", "yogurt"],
  ["en:cheeses", "cheese"],
  ["en:plant-based-milk-alternatives", "plant-drink"],
  ["en:plant-milks", "plant-drink"],
  ["en:oat-milks", "plant-drink"],
  ["en:chocolates", "chocolate"],
  ["en:chocolate-bars", "chocolate"],
  ["en:candies", "sweets"],
  ["en:confectioneries", "sweets"],
  ["en:biscuits-and-cakes", "sweets"],
  ["en:crisps", "snacks"],
  ["en:salty-snacks", "snacks"],
  ["en:snacks", "snacks"],
  ["en:sodas", "beverages"],
  ["en:carbonated-drinks", "beverages"],
  ["en:waters", "beverages"],
  ["en:beverages", "beverages"],
  ["en:fruit-juices", "juice"],
  ["en:juices-and-nectars", "juice"],
  ["en:coffees", "coffee"],
  ["en:frozen-foods", "frozen"],
  ["en:meats", "meat"],
  ["en:poultries", "meat"],
  ["en:sausages", "sausage"],
  ["en:charcuteries", "sausage"],
  ["en:fishes", "fish"],
  ["en:seafood", "fish"],
  ["en:eggs", "eggs"],
  ["en:nut-butters", "spreads"],
  ["en:spreads", "spreads"],
  ["en:vegetable-oils", "oils"],
  ["en:fats", "oils"],
  ["en:fruits", "fruit"],
  ["en:vegetables", "vegetables"],
  ["en:legumes", "legumes"],
];

// ------------------------------------------------------------
// Zusatzstoffe: Risikoklassen (3 = bedenklich, 2 = umstritten,
// 1 = unbedenklich). Orientierung: EFSA-Bewertungen, EU-Verbote.
// ------------------------------------------------------------
export const ADDITIVE_RISK: Record<string, 1 | 2 | 3> = {
  // Azofarbstoffe & kritische Farbstoffe
  E102: 3, E104: 3, E110: 3, E122: 3, E124: 3, E129: 3,
  E150D: 3, E171: 3,
  // Nitrite / Nitrate (Pökelstoffe)
  E249: 3, E250: 3, E251: 3, E252: 3,
  // Antioxidantien BHA/BHT
  E320: 3, E321: 3,
  // Konservierer / Säuerungsmittel (umstritten)
  E210: 2, E211: 2, E212: 2, E213: 2,
  E220: 2, E221: 2, E222: 2, E223: 2, E224: 2, E226: 2, E227: 2, E228: 2,
  E338: 2, E339: 2, E340: 2, E341: 2,
  E407: 2, E450: 2, E451: 2, E452: 2,
  E621: 2, E622: 2, E623: 2, E627: 2, E631: 2,
  // Süßstoffe (umstritten, aber zugelassen)
  E950: 2, E951: 2, E952: 2, E954: 2, E955: 2,
  E150A: 1, E150B: 1, E150C: 1,
  // Unbedenkliche Standard-Zusatzstoffe
  E160A: 1, E161B: 1, E162: 1, E163: 1,
  E170: 1, E200: 1, E202: 1, E203: 1, E260: 1, E270: 1, E296: 1,
  E300: 1, E301: 1, E306: 1, E307: 1, E308: 1, E309: 1, E322: 1,
  E330: 1, E331: 1, E332: 1, E333: 1, E336: 1, E392: 1,
  E406: 1, E410: 1, E412: 1, E414: 1, E415: 1, E417: 1, E418: 1, E428: 1,
  E440: 1, E460: 1, E461: 1, E464: 1, E466: 1, E471: 1, E472E: 1,
  E500: 1, E501: 1, E503: 1, E504: 1, E509: 1, E516: 1, E524: 1, E551: 1,
  E901: 1, E903: 1, E948: 1, E967: 1, E968: 1,
};

export const ADDITIVE_NAMES: Record<string, string> = {
  E102: "Tartrazin (Azofarbstoff)",
  E104: "Chinolingelb",
  E110: "Gelborange S (Azofarbstoff)",
  E122: "Azorubin (Azofarbstoff)",
  E124: "Cochenillerot A",
  E129: "Allurarot AC",
  E150A: "Zuckerkulör",
  E150D: "Ammonsulfit-Zuckerkulör",
  E171: "Titandioxid (EU-weit als Lebensmittelzusatz verboten)",
  E210: "Benzoesäure",
  E211: "Natriumbenzoat",
  E220: "Schwefeldioxid",
  E249: "Kaliumnitrit (Pökelstoff)",
  E250: "Natriumnitrit (Pökelstoff)",
  E251: "Natriumnitrat",
  E252: "Kaliumnitrat",
  E260: "Essigsäure",
  E270: "Milchsäure",
  E300: "Ascorbinsäure (Vitamin C)",
  E306: "Tocopherol (Vitamin E)",
  E320: "Butylhydroxyanisol (BHA)",
  E321: "Butylhydroxytoluol (BHT)",
  E322: "Lecithine",
  E330: "Citronensäure",
  E338: "Phosphorsäure",
  E407: "Carrageen",
  E410: "Johannisbrotkernmehl",
  E412: "Guarkernmehl",
  E415: "Xanthan",
  E440: "Pektin",
  E450: "Diphosphate",
  E471: "Mono- und Diglyceride von Speisefettsäuren",
  E500: "Natriumcarbonate (Natron)",
  E551: "Siliciumdioxid",
  E621: "Mononatriumglutamat (Geschmacksverstärker)",
  E627: "Dinatriumguanylat",
  E631: "Dinatriuminosinat",
  E950: "Acesulfam K (Süßstoff)",
  E951: "Aspartam (Süßstoff)",
  E952: "Cyclamat (Süßstoff)",
  E954: "Saccharin (Süßstoff)",
  E955: "Sucralose (Süßstoff)",
};

// ------------------------------------------------------------
// Länder: Tiers für den Sozial-Score (Arbeitsrechte/Lieferketten-
// Risiko, Orientierung: ITUC Global Rights Index, grobe Klassen)
// ------------------------------------------------------------
const TIER1 = ["de","at","ch","fr","it","es","pt","nl","be","lu","dk","se","no","fi","is","ie","gb","pl","cz","sk","hu","si","hr","gr","ro","bg","ee","lv","lt","mt","cy"];
const TIER2 = ["us","ca","au","nz","jp","kr","il","cl","uy","cr","tw","sg"];
const TIER3 = ["br","ar","mx","tr","cn","th","vn","id","my","pe","co","ec","za","ma","tn","eg","in","ph","ke","lk","do","gt","hn","sn"];
const TIER4 = ["ci","gh","ng","bd","pk","mm","et","uz","tj","er","kh","la"];

export function countryTier(iso?: string): 1 | 2 | 3 | 4 | 0 {
  if (!iso || iso === "unknown") return 0;
  if (TIER1.includes(iso)) return 1;
  if (TIER2.includes(iso)) return 2;
  if (TIER3.includes(iso)) return 3;
  if (TIER4.includes(iso)) return 4;
  return 3;
}

export const COUNTRY_NAMES: Record<string, string> = {
  de: "Deutschland", at: "Österreich", ch: "Schweiz", fr: "Frankreich",
  it: "Italien", es: "Spanien", pt: "Portugal", nl: "Niederlande",
  be: "Belgien", dk: "Dänemark", se: "Schweden", no: "Norwegen",
  fi: "Finnland", ie: "Irland", gb: "Großbritannien", pl: "Polen",
  cz: "Tschechien", sk: "Slowakei", hu: "Ungarn", gr: "Griechenland",
  ro: "Rumänien", bg: "Bulgarien", hr: "Kroatien", si: "Slowenien",
  tr: "Türkei", cn: "China", in: "Indien", br: "Brasilien",
  ar: "Argentinien", mx: "Mexiko", pe: "Peru", co: "Kolumbien",
  ec: "Ecuador", gh: "Ghana", ci: "Elfenbeinküste", ng: "Nigeria",
  ke: "Kenia", et: "Äthiopien", vn: "Vietnam", th: "Thailand",
  id: "Indonesien", my: "Malaysia", lk: "Sri Lanka", bd: "Bangladesch",
  us: "USA", ca: "Kanada", au: "Australien", nz: "Neuseeland",
  jp: "Japan", kr: "Südkorea", za: "Südafrika", ma: "Marokko",
  unknown: "Unbekannt",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  de: "🇩🇪", at: "🇦🇹", ch: "🇨🇭", fr: "🇫🇷", it: "🇮🇹", es: "🇪🇸",
  nl: "🇳🇱", be: "🇧🇪", dk: "🇩🇰", se: "🇸🇪", pl: "🇵🇱", cz: "🇨🇿",
  gb: "🇬🇧", tr: "🇹🇷", cn: "🇨🇳", in: "🇮🇳", br: "🇧🇷", pe: "🇵🇪",
  co: "🇨🇴", ec: "🇪🇨", gh: "🇬🇭", ci: "🇨🇮", vn: "🇻🇳", th: "🇹🇭",
  id: "🇮🇩", us: "🇺🇸", ca: "🇨🇦", it2: "🇮🇹", gr: "🇬🇷", pt: "🇵🇹",
};

/** OFF-Ländernamen (en/de, lowercase) → ISO-Kürzel */
export const COUNTRY_LOOKUP: Record<string, string> = {
  germany: "de", deutschland: "de", austria: "at", "österreich": "at",
  switzerland: "ch", schweiz: "ch", france: "fr", frankreich: "fr",
  italy: "it", italien: "it", spain: "es", spanien: "es",
  portugal: "pt", netherlands: "nl", niederlande: "nl", belgium: "be",
  belgien: "be", denmark: "dk", "dänemark": "dk", sweden: "se",
  schweden: "se", norway: "no", finland: "fi", ireland: "ie",
  "united-kingdom": "gb", "great-britain": "gb", poland: "pl", polen: "pl",
  "czech-republic": "cz", tschechien: "cz", slovakia: "sk", hungary: "hu",
  ungarn: "hu", greece: "gr", griechenland: "gr", romania: "ro",
  bulgaria: "bg", croatia: "hr", slovenia: "si", turkey: "tr",
  "türkei": "tr", china: "cn", india: "in", indien: "in",
  brazil: "br", brasilien: "br", argentina: "ar", mexico: "mx",
  peru: "pe", colombia: "co", kolumbien: "co", ecuador: "ec",
  ghana: "gh", "ivory-coast": "ci", "cote-d-ivoire": "ci",
  nigeria: "ng", kenya: "ke", ethiopia: "et", vietnam: "vn",
  thailand: "th", indonesia: "id", indonesien: "id", malaysia: "my",
  "sri-lanka": "lk", bangladesh: "bd", "united-states": "us", usa: "us",
  canada: "ca", kanada: "ca", australia: "au", "new-zealand": "nz",
  japan: "jp", "south-korea": "kr", "south-africa": "za", morocco: "ma",
};

// ------------------------------------------------------------
// Risikorohstoffe (Sozial-Score): Rohstoffe mit dokumentiertem
// Risiko für Kinderarbeit / Ausbeutung in der Lieferkette,
// sofern keine Fairtrade-/Rainforest-Zertifizierung vorliegt.
// ------------------------------------------------------------
export interface RiskIngredient {
  key: string;
  label: string;
  penalty: number;
  pattern: RegExp;
}

export const RISK_INGREDIENTS: RiskIngredient[] = [
  { key: "cocoa", label: "Kakao", penalty: -15, pattern: /\b(kakao|cocoa|schokolade|chocolate)\b/i },
  { key: "coffee", label: "Kaffee", penalty: -12, pattern: /\b(kaffee|coffee|espresso|arabica|robusta)\b/i },
  { key: "vanilla", label: "Vanille", penalty: -8, pattern: /\b(vanille|vanilla|bourbon-vanille)\b/i },
  { key: "tea", label: "Tee", penalty: -8, pattern: /\b(schwarztee|grüntee|grüner tee|black tea|green tea)\b/i },
  { key: "hazelnut", label: "Haselnüsse", penalty: -6, pattern: /\b(haselnuss|haselnüsse|hazelnut)/i },
  { key: "cane-sugar", label: "Rohrzucker", penalty: -5, pattern: /\b(rohrzucker|rohrohrzucker|cane sugar)\b/i },
];

// Wissenschaftliche & institutionelle Quellen je Dimension (Premium-Bereich)
export interface SourceLink {
  title: string;
  org: string;
  url: string;
}

export const SOURCES: Record<"health" | "eco" | "social", SourceLink[]> = {
  health: [
    { title: "Nutri-Score: wissenschaftliche Grundlagen", org: "Santé publique France", url: "https://www.santepubliquefrance.fr/en/nutri-score" },
    { title: "Bewertungen von Lebensmittelzusatzstoffen", org: "EFSA", url: "https://www.efsa.europa.eu/de/topics/topic/food-additives" },
    { title: "Referenzwerte für die Nährstoffzufuhr", org: "DGE", url: "https://www.dge.de/wissenschaft/referenzwerte/" },
    { title: "Guideline: Sugars intake for adults and children", org: "WHO", url: "https://www.who.int/publications/i/item/9789241549028" },
  ],
  eco: [
    { title: "Agribalyse: Umweltdaten für Lebensmittel", org: "ADEME", url: "https://agribalyse.ademe.fr/" },
    { title: "Reducing food's environmental impacts", org: "Poore & Nemecek, Science (2018)", url: "https://www.science.org/doi/10.1126/science.aaq0216" },
    { title: "EU-Bio-Logo und Bio-Verordnung", org: "Europäische Kommission", url: "https://agriculture.ec.europa.eu/farming/organic-farming_de" },
  ],
  social: [
    { title: "Global Rights Index", org: "ITUC / IGB", url: "https://www.ituc-csi.org/global-rights-index" },
    { title: "Fairtrade-Standards", org: "Fairtrade International", url: "https://www.fairtrade.net/standards" },
    { title: "Child Labour in Cocoa", org: "International Cocoa Initiative", url: "https://www.cocoainitiative.org/" },
  ],
};
