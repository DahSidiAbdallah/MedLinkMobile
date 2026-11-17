/**
 * Normalises active-substance names (French BDPM style, or English) to a lowercase
 * English INN, for drug-interaction lookups (NIH RxNorm) and allergy matching.
 * Covers the systematic French→English spelling rules plus common irregular names.
 */

const IRREGULAR: Record<string, string> = {
  paracetamol: 'acetaminophen',
  'acide acetylsalicylique': 'aspirin',
  'acetylsalicylique': 'aspirin',
  'acide clavulanique': 'clavulanic acid',
  'acide valproique': 'valproic acid',
  'acide folique': 'folic acid',
  'acide tranexamique': 'tranexamic acid',
  'acide fusidique': 'fusidic acid',
  'acide mefenamique': 'mefenamic acid',
  'acide alendronique': 'alendronic acid',
  'acide zoledronique': 'zoledronic acid',
  'acide ascorbique': 'ascorbic acid',
  'cholecalciferol': 'cholecalciferol',
  'colecalciferol': 'cholecalciferol',
  'fer': 'iron',
  'insuline': 'insulin',
  'levothyroxine sodique': 'levothyroxine',
  'phenobarbital': 'phenobarbital',
  'quinine': 'quinine',
  'artemether': 'artemether',
  'lumefantrine': 'lumefantrine',
  'salbutamol': 'albuterol',
  'glibenclamide': 'glyburide',
  'adrenaline': 'epinephrine',
  'noradrenaline': 'norepinephrine',
  'lidocaine': 'lidocaine',
  'ciclosporine': 'cyclosporine',
  'rifampicine': 'rifampin',
};

// Salt / form words that come before ("chlorhydrate de X") or after ("X sodique") the base INN.
const SALT_PREFIX = /^(chlorhydrate|dichlorhydrate|bromhydrate|sulfate|sulphate|phosphate|maleate|tartrate|bitartrate|fumarate|mesilate|mesylate|besilate|besylate|citrate|acetate|succinate|lactate|gluconate|carbonate|oxyde|hydroxyde|trihydrate|dihydrate|monohydrate|hemifumarate|valerate|propionate|dipropionate|furoate|benzoate|nitrate|potassium|sodium|calcium|magnesium)\s+(?:de\s+|d')?/;
const SALT_SUFFIX = /\s+(?:(?:de|d')\s+)?(sodique|potassique|calcique|magnesique|anhydre|(?:tri|di|mono|hemi|sesqui)?hydratee?|base|chlorhydrate|sulfate|phosphate|maleate|tartrate|fumarate|mesilate|besilate|citrate|hydrochloride|sodium|potassium|calcium|magnesium)$/;

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export function toEnglishInn(substance: string): string {
  let s = fold(substance).replace(/\(.*?\)/g, '').trim();
  if (IRREGULAR[s]) return IRREGULAR[s];
  for (let i = 0; i < 3; i++) {
    const next = s.replace(SALT_PREFIX, '').replace(SALT_SUFFIX, '').trim();
    if (next === s) break;
    s = next;
  }
  if (IRREGULAR[s]) return IRREGULAR[s];
  // Systematic French INN endings → English
  s = s
    .replace(/ine$/, 'in')      // amoxicilline → amoxicillin, metformine → metformin
    .replace(/ene$/, 'en')      // ibuprofene → ibuprofen
    .replace(/yle$/, 'yl');     // ethyle → ethyl
  // These keep the trailing "e" in English too (morphine, codeine, chloroquine…)
  if (/(morphin|codein|caffein|cocain|quinin|nicotin|atropin|ephedrin|epinephrin|dopamin|lidocain|procain|bupivacain|ketamin|cetirizin|loratadin|chloroquin|amlodipin|nifedipin|histamin)$/.test(s)) {
    s = `${s}e`;
  }
  return s;
}

/** True when an allergy entry (any language) refers to one of the substances. */
export function allergyMatches(allergy: string, substances: string[]): boolean {
  const a = fold(allergy);
  if (a.length < 3) return false;
  const aEn = toEnglishInn(allergy);
  return substances.some(sub => {
    const f = fold(sub);
    const en = toEnglishInn(sub);
    return f.includes(a) || a.includes(f) || en === aEn || en.includes(aEn) || aEn.includes(en)
      // Class allergies: "penicillin" covers amoxicillin, ampicillin…
      || (/penicill/.test(a) && /(cillin|cilline)/.test(f))
      || (/sulfa|sulfonamid/.test(a) && /sulfa/.test(f));
  });
}
