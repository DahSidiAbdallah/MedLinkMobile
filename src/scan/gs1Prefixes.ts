/**
 * GS1 company-prefix ranges → the GS1 member organisation that issued the barcode.
 * This tells you where the brand owner registered its barcodes, NOT where the
 * medicine was manufactured.
 */
type Range = [from: number, to: number, iso: string];

const RANGES: Range[] = [
  [0, 19, 'US'], [30, 39, 'US'], [60, 139, 'US'],
  [300, 379, 'FR'], [380, 380, 'BG'], [383, 383, 'SI'], [385, 385, 'HR'], [387, 387, 'BA'], [389, 389, 'ME'],
  [400, 440, 'DE'], [450, 459, 'JP'], [490, 499, 'JP'], [460, 469, 'RU'], [470, 470, 'KG'], [471, 471, 'TW'],
  [474, 474, 'EE'], [475, 475, 'LV'], [476, 476, 'AZ'], [477, 477, 'LT'], [478, 478, 'UZ'], [479, 479, 'LK'],
  [480, 480, 'PH'], [481, 481, 'BY'], [482, 482, 'UA'], [484, 484, 'MD'], [485, 485, 'AM'], [486, 486, 'GE'],
  [487, 487, 'KZ'], [488, 488, 'TJ'], [489, 489, 'HK'],
  [500, 509, 'GB'], [520, 521, 'GR'], [528, 528, 'LB'], [529, 529, 'CY'], [530, 530, 'AL'], [531, 531, 'MK'],
  [535, 535, 'MT'], [539, 539, 'IE'], [540, 549, 'BE'], [560, 560, 'PT'], [569, 569, 'IS'], [570, 579, 'DK'],
  [590, 590, 'PL'], [594, 594, 'RO'], [599, 599, 'HU'],
  [600, 601, 'ZA'], [603, 603, 'GH'], [604, 604, 'SN'], [605, 605, 'UG'], [606, 606, 'AO'], [607, 607, 'OM'],
  [608, 608, 'BH'], [609, 609, 'MU'], [611, 611, 'MA'], [612, 612, 'SO'], [613, 613, 'DZ'], [615, 615, 'NG'],
  [616, 616, 'KE'], [617, 617, 'CM'], [618, 618, 'CI'], [619, 619, 'TN'], [620, 620, 'TZ'], [621, 621, 'SY'],
  [622, 622, 'EG'], [623, 623, 'BN'], [624, 624, 'LY'], [625, 625, 'JO'], [626, 626, 'IR'], [627, 627, 'KW'],
  [628, 628, 'SA'], [629, 629, 'AE'], [630, 630, 'QA'], [631, 631, 'NA'], [632, 632, 'RW'],
  [640, 649, 'FI'], [690, 699, 'CN'], [700, 709, 'NO'], [729, 729, 'IL'], [730, 739, 'SE'], [740, 740, 'GT'],
  [741, 741, 'SV'], [742, 742, 'HN'], [743, 743, 'NI'], [744, 744, 'CR'], [745, 745, 'PA'], [746, 746, 'DO'],
  [750, 750, 'MX'], [754, 755, 'CA'], [759, 759, 'VE'], [760, 769, 'CH'], [770, 771, 'CO'], [773, 773, 'UY'],
  [775, 775, 'PE'], [777, 777, 'BO'], [778, 779, 'AR'], [780, 780, 'CL'], [784, 784, 'PY'], [786, 786, 'EC'],
  [789, 790, 'BR'], [800, 839, 'IT'], [840, 849, 'ES'], [850, 850, 'CU'], [858, 858, 'SK'], [859, 859, 'CZ'],
  [860, 860, 'RS'], [865, 865, 'MN'], [867, 867, 'KP'], [868, 869, 'TR'], [870, 879, 'NL'], [880, 880, 'KR'],
  [884, 884, 'KH'], [885, 885, 'TH'], [888, 888, 'SG'], [890, 890, 'IN'], [893, 893, 'VN'], [896, 896, 'PK'],
  [899, 899, 'ID'], [900, 919, 'AT'], [930, 939, 'AU'], [940, 949, 'NZ'], [955, 955, 'MY'], [958, 958, 'MO'],
];

/** Ranges reserved for in-store/restricted use — not a real issuing country. */
const RESTRICTED: Array<[number, number]> = [[20, 29], [40, 49], [200, 299], [977, 979], [980, 999]];

/**
 * @param gtin13 a 13-digit GTIN (EAN-13). For a GTIN-14, pass the last 13 digits.
 * @returns ISO 3166 alpha-2 code, 'RESTRICTED' for internal-use ranges, or undefined.
 */
export function gs1Country(gtin13: string): string | undefined {
  if (!/^\d{13}$/.test(gtin13)) return undefined;
  const p = Number(gtin13.slice(0, 3));
  if (RESTRICTED.some(([a, b]) => p >= a && p <= b)) return 'RESTRICTED';
  return RANGES.find(([a, b]) => p >= a && p <= b)?.[2];
}
