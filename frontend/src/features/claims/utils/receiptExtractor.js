/**
 * Smart Bill / Receipt Text Extractor
 * Parses raw OCR text to auto-fill expense claim fields
 */

const MONTH_MAP = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

/**
 * Normalizes date string to YYYY-MM-DD
 */
function normalizeDate(day, month, year) {
  let d = parseInt(day, 10);
  let y = parseInt(year, 10);
  if (y < 100) y = 2000 + y;

  let m = month;
  if (isNaN(m)) {
    const key = String(month).toLowerCase().slice(0, 3);
    m = MONTH_MAP[key] || '01';
  } else {
    m = String(parseInt(month, 10)).padStart(2, '0');
  }

  const dStr = String(d).padStart(2, '0');
  // Check validity
  if (y >= 2000 && y <= 2035 && d >= 1 && d <= 31) {
    return `${y}-${m}-${dStr}`;
  }
  return null;
}

export function extractDetailsFromOcr(text) {
  if (!text || typeof text !== 'string') {
    return {
      amount: '',
      taxAmount: '',
      date: '',
      merchantName: '',
      invoiceNumber: '',
      gstNumber: '',
      category: 'OTHER',
      rawText: '',
      confidenceItems: {},
    };
  }

  const cleanText = text.replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lowerText = cleanText.toLowerCase();

  // 1. EXTRACT GSTIN
  let gstNumber = '';
  const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/i;
  const gstMatch = cleanText.match(gstinRegex);
  if (gstMatch) {
    gstNumber = gstMatch[0].toUpperCase();
  }

  // 2. EXTRACT INVOICE / BILL NUMBER
  let invoiceNumber = '';
  const invoicePatterns = [
    /(?:invoice|bill|receipt|tax\s*inv|memo|inv|order|trip|booking)\s*(?:no|num|number|#|id)?\s*[:\-\.]?\s*([A-Za-z0-9\-\/]{3,30})/i,
    /(?:inv|bill|rcpt)\s*#\s*([A-Za-z0-9\-\/]{3,30})/i,
    /#\s*([A-Za-z0-9\-\/]{4,25})/,
  ];
  for (const pattern of invoicePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (!/^(date|time|total|amount|cash|card|gst|gstin)$/i.test(candidate)) {
        invoiceNumber = candidate;
        break;
      }
    }
  }

  // 3. EXTRACT DATE
  let date = '';
  const datePatterns = [
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    /\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](20\d\d|\d\d)\b/,
    // YYYY-MM-DD or YYYY/MM/DD
    /\b(20\d\d)[\/\-\.](0?[1-9]|1[012])[\/\-\.](0?[1-9]|[12][0-9]|3[01])\b/,
    // DD Mon YYYY (e.g. 15 Jan 2026, 04-Aug-2025)
    /\b(0?[1-9]|[12][0-9]|3[01])[\s\-\.](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\.](20\d\d|\d\d)\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      if (pattern.source.startsWith('\\b(20\\d\\d)')) {
        // YYYY-MM-DD format
        date = normalizeDate(match[3], match[2], match[1]);
      } else {
        // DD-MM-YYYY or DD Mon YYYY
        date = normalizeDate(match[1], match[2], match[3]);
      }
      if (date) break;
    }
  }

  // 4. EXTRACT TOTAL AMOUNT & TAX
  let amount = '';
  let taxAmount = '';

  const amountNumberCleaner = (str) => {
    if (!str) return null;
    const clean = str.replace(/[^\d\.]/g, '').trim();
    const parsed = parseFloat(clean);
    return !isNaN(parsed) && parsed > 0 && parsed < 10000000 ? parsed : null;
  };

  // High priority keywords for Grand Total
  const totalRegexes = [
    /(?:grand\s*total|net\s*amount|final\s*amount|total\s*payable|amount\s*payable|amount\s*due|total\s*amount|total\s*bill|total\s*inr|balance\s*due)\s*[:\-\.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/i,
    /(?:total|amount)\s*[:\-\.]?\s*(?:rs\.?|inr|₹)\s*([0-9,]+\.?[0-9]*)/i,
    /(?:rs\.?|inr|₹)\s*([0-9,]+\.?[0-9]*)\s*(?:total|only)?/i,
  ];

  for (const pattern of totalRegexes) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const parsed = amountNumberCleaner(match[1]);
      if (parsed) {
        amount = parsed.toFixed(2);
        break;
      }
    }
  }

  // Fallback: search line-by-line for lines containing 'total'
  if (!amount) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/total/i.test(line) && !/sub\s*total/i.test(line)) {
        const nums = line.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g);
        if (nums && nums.length > 0) {
          const lastNum = amountNumberCleaner(nums[nums.length - 1]);
          if (lastNum) {
            amount = lastNum.toFixed(2);
            break;
          }
        }
      }
    }
  }

  // Tax amount search
  const taxPatterns = [
    /(?:gst|cgst\s*\+\s*sgst|igst|tax\s*amount|total\s*tax|vat)\s*[:\-\.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/i,
  ];
  for (const pattern of taxPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const parsed = amountNumberCleaner(match[1]);
      if (parsed) {
        taxAmount = parsed.toFixed(2);
        break;
      }
    }
  }

  // 5. EXTRACT MERCHANT / VENDOR NAME
  let merchantName = '';
  // Check known brands first
  const knownMerchants = [
    { name: 'Uber India', match: /\buber\b/i },
    { name: 'Ola Cabs', match: /\bola\s*(?:cabs)?\b/i },
    { name: 'Rapido', match: /\brapido\b/i },
    { name: 'Swiggy', match: /\bswiggy\b/i },
    { name: 'Zomato', match: /\bzomato\b/i },
    { name: 'MakeMyTrip', match: /\bmakemytrip\b/i },
    { name: 'IRCTC', match: /\birctc\b/i },
    { name: 'IndiGo Airlines', match: /\bindigo\b/i },
    { name: 'Air India', match: /\bair\s*india\b/i },
    { name: 'Indian Oil Petrol Pump', match: /\bindian\s*oil|ioc|iocl\b/i },
    { name: 'Bharat Petroleum (BPCL)', match: /\bbpcl|bharat\s*petroleum\b/i },
    { name: 'HPCL Fuel Station', match: /\bhpcl|hindustan\s*petroleum\b/i },
    { name: 'Shell Petrol Pump', match: /\bshell\b/i },
    { name: 'Taj Hotels', match: /\btaj\s*hotel/i },
    { name: 'OYO Rooms', match: /\boyo\b/i },
    { name: 'Starbucks Coffee', match: /\bstarbucks\b/i },
    { name: 'McDonalds', match: /\bmcdonald/i },
    { name: 'Dominos Pizza', match: /\bdomino/i },
    { name: 'Airtel Broadband/Mobile', match: /\bairtel\b/i },
    { name: 'Reliance Jio', match: /\bjio\b/i },
    { name: 'Blue Dart Express', match: /\bblue\s*dart\b/i },
    { name: 'DTDC Courier', match: /\bdtdc\b/i },
    { name: 'Amazon', match: /\bamazon\b/i },
    { name: 'Apollo Pharmacy', match: /\bapollo\s*pharmacy/i },
  ];

  for (const m of knownMerchants) {
    if (m.match.test(cleanText)) {
      merchantName = m.name;
      break;
    }
  }

  // If no known merchant, pick the most plausible top header line
  if (!merchantName) {
    const ignoredHeaderWords = [
      'tax invoice',
      'cash memo',
      'retail invoice',
      'bill of supply',
      'invoice',
      'receipt',
      'welcome',
      'customer copy',
      'merchant copy',
      'original for recipient',
      'duplicate for supplier',
      'tel:',
      'phone:',
      'gstin:',
      'gst:',
    ];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      const isIgnored = ignoredHeaderWords.some((w) =>
        line.toLowerCase().includes(w),
      );
      if (!isIgnored && line.length >= 3 && line.length <= 60) {
        // Strip non-alphanumeric noise at start
        const cleanedLine = line.replace(/^[^a-zA-Z0-9]+/, '').trim();
        if (cleanedLine.length >= 3) {
          merchantName = cleanedLine;
          break;
        }
      }
    }
  }

  // 6. CATEGORY AUTO-CLASSIFICATION
  let category = 'OTHER';
  if (/petrol|diesel|fuel|cng|hpcl|bpcl|ioc|iocl|shell|speed|filling\s*station|fuel\s*pump/i.test(lowerText)) {
    category = 'FUEL';
  } else if (/uber|ola|rapido|taxi|cab|flight|airline|indigo|air\s*india|irctc|train|bus|redbus|toll|fastag|auto\s*fare|fare|travel|boarding\s*pass/i.test(lowerText)) {
    category = 'TRAVEL';
  } else if (/hotel|lodge|resort|inn|oyo|stay|room\s*rent|accommodation|check\s*in|check\s*out|guest\s*house/i.test(lowerText)) {
    category = 'HOTEL';
  } else if (/swiggy|zomato|restaurant|cafe|food|meal|dining|lunch|dinner|breakfast|snack|burger|pizza|coffee|tea|chai|bakery|bar\b|beverage/i.test(lowerText)) {
    category = 'FOOD';
  } else if (/stationery|print|photocopy|xerox|paper|pen|notebook|courier|blue\s*dart|dtdc|dhl|cartridge|toner/i.test(lowerText)) {
    category = 'OFFICE_SUPPLIES';
  } else if (/client|entertainment|gift|guest\s*lunch|client\s*meeting/i.test(lowerText)) {
    category = 'CLIENT_ENTERTAINMENT';
  } else if (/airtel|jio|vodafone|vi\b|broadband|internet|mobile\s*recharge|wifi|telecom|phone\s*bill/i.test(lowerText)) {
    category = 'INTERNET_PHONE';
  } else if (/pharmacy|chemist|medicine|hospital|clinic|doctor|medical|lab\s*test/i.test(lowerText)) {
    category = 'MEDICAL';
  }

  return {
    amount: amount || '',
    taxAmount: taxAmount || '',
    date: date || '',
    merchantName: merchantName || '',
    invoiceNumber: invoiceNumber || '',
    gstNumber: gstNumber || '',
    category,
    rawText: cleanText,
    confidenceItems: {
      hasAmount: !!amount,
      hasDate: !!date,
      hasMerchant: !!merchantName,
      hasInvoice: !!invoiceNumber,
      hasGst: !!gstNumber,
    },
  };
}
