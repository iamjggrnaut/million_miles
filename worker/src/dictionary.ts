/**
 * Japanese -> English/Russian normalization for CarSensor data
 */
export const brandMap: Record<string, string> = {
  'トヨタ': 'Toyota',
  '日産': 'Nissan',
  'ホンダ': 'Honda',
  'マツダ': 'Mazda',
  'スバル': 'Subaru',
  '三菱': 'Mitsubishi',
  'ダイハツ': 'Daihatsu',
  'スズキ': 'Suzuki',
  'レクサス': 'Lexus',
  'ＢＭＷ': 'BMW',
  'メルセデス・ベンツ': 'Mercedes-Benz',
  'ベンツ': 'Mercedes-Benz',
  'フォルクスワーゲン': 'Volkswagen',
  'アウディ': 'Audi',
  'ポルシェ': 'Porsche',
  'ボルボ': 'Volvo',
  'ミニ': 'MINI',
  'ランドローバー': 'Land Rover',
  'プジョー': 'Peugeot',
  'ジャガー': 'Jaguar',
  'フィアット': 'Fiat',
  'アルファロメオ': 'Alfa Romeo',
  'ジープ': 'Jeep',
  'キャデラック': 'Cadillac',
  'シボレー': 'Chevrolet',
  'フォード': 'Ford',
  'いすゞ': 'Isuzu',
  'UDトラックス': 'UD Trucks',
  'ヒノ': 'Hino',
  '日野': 'Hino',
};

export const bodyTypeMap: Record<string, string> = {
  'セダン': 'Sedan',
  'ミニバン': 'Minivan',
  'SUV・クロカン': 'SUV',
  'クロカン・ＳＵＶ': 'SUV',
  'ステーションワゴン': 'Station Wagon',
  'ワゴン': 'Station Wagon',
  'ハッチバック': 'Hatchback',
  'コンパクトカー': 'Compact',
  '軽自動車': 'Kei Car',
  'クーペ': 'Coupe',
  'オープンカー': 'Convertible',
  'トラック': 'Truck',
  'ピックアップトラック': 'Pickup',
  '商用車・バン': 'Van',
  'その他': 'Other',
};

export const transmissionMap: Record<string, string> = {
  'AT': 'AT',
  'MT': 'MT',
  'CVT': 'CVT',
  'インパネ6AT': '6AT',
  'インパネMTモード付6AT': '6AT',
  '6AT': '6AT',
  '5AT': '5AT',
  '4AT': '4AT',
  '8AT': '8AT',
  '7AT': '7AT',
  'DCT': 'DCT',
  'eCVT': 'eCVT',
};

export const fuelTypeMap: Record<string, string> = {
  'ガソリン': 'Gasoline',
  'ディーゼル': 'Diesel',
  'ハイブリッド': 'Hybrid',
  '電気': 'Electric',
  'PHV': 'PHEV',
  'プラグインハイブリッド': 'PHEV',
};

export const driveTypeMap: Record<string, string> = {
  '4WD': '4WD',
  '2WD': '2WD',
  'FF': 'FF',
  'FR': 'FR',
  'MR': 'MR',
  'RR': 'RR',
};

export const colorMap: Record<string, string> = {
  '白': 'White',
  '黒': 'Black',
  'シルバー': 'Silver',
  'グレー': 'Gray',
  '青': 'Blue',
  '赤': 'Red',
  '黄': 'Yellow',
  '緑': 'Green',
  'ベージュ': 'Beige',
  '茶': 'Brown',
  '金': 'Gold',
  'オレンジ': 'Orange',
  'パープル': 'Purple',
  '真珠白': 'Pearl White',
  '薄緑': 'Light Green',
  'その他': 'Other',
};

function normalizeByMap(value: string | undefined, map: Record<string, string>): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  for (const [ja, en] of Object.entries(map)) {
    if (trimmed.includes(ja) || trimmed === ja) return en;
  }
  return trimmed;
}

export function normalizeBrand(ja: string | undefined): string {
  return normalizeByMap(ja, brandMap) ?? ja ?? 'Unknown';
}

export function normalizeBodyType(ja: string | undefined): string | null {
  return normalizeByMap(ja, bodyTypeMap);
}

export function normalizeTransmission(ja: string | undefined): string | null {
  return normalizeByMap(ja, transmissionMap);
}

export function normalizeFuelType(ja: string | undefined): string | null {
  return normalizeByMap(ja, fuelTypeMap);
}

export function normalizeDriveType(ja: string | undefined): string | null {
  return normalizeByMap(ja, driveTypeMap);
}

export function normalizeColor(ja: string | undefined): string | null {
  return normalizeByMap(ja, colorMap);
}

/** Parse Japanese price like "130.8万円" or "474.4 万円" -> number (yen) */
export function parsePriceYen(text: string | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\s/g, '');
  const match = cleaned.match(/([\d.,]+)\s*万?円?/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  const isMan = cleaned.includes('万');
  return isMan ? Math.round(num * 10000) : Math.round(num);
}

/** Parse mileage like "0.5万km", "1.1万km", "9km" -> number (km) */
export function parseMileageKm(text: string | undefined): number | null {
  if (!text) return null;
  const t = text.replace(/\s/g, '').replace('万', '0000');
  const match = t.match(/([\d.]+)\s*km?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return Number.isNaN(num) ? null : Math.round(num);
}

/** Parse year like "2026(R08)年", "2025(R07)年" -> number */
export function parseYear(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.match(/(\d{4})/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  return y >= 1990 && y <= 2030 ? y : null;
}
