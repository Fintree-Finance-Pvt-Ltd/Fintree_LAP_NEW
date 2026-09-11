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

/**
 * Helper to clean and parse numeric amount strings
 */
function parseCleanAmount(str) {
  if (!str) return null;
  // Replace comma separators, keep digits and dots
  const clean = str.replace(/,/g, '').replace(/[^\d.]/g, '').trim();
  const parsed = parseFloat(clean);
  return !isNaN(parsed) && parsed > 0 && parsed < 10000000 ? parsed : null;
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
    /(?:invoice|bill|receipt|tax\s*inv|memo|inv|order|trip|booking)\s*(?:no|num|number|#|id)?\s*[:\-.]?\s*([A-Za-z0-9\-/]{3,35})/i,
    /(?:inv|bill|rcpt)\s*#\s*([A-Za-z0-9\-/]{3,35})/i,
    /#\s*([A-Za-z0-9\-/]{4,30})/,
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
    /\b(0?[1-9]|[12][0-9]|3[01])[\/\-.](0?[1-9]|1[012])[\/\-.](20\d\d|\d\d)\b/,
    // YYYY-MM-DD or YYYY/MM/DD
    /\b(20\d\d)[\/\-.](0?[1-9]|1[012])[\/\-.](0?[1-9]|[12][0-9]|3[01])\b/,
    // DD Mon YYYY (e.g. 15 Jan 2026, 04-Aug-2025)
    /\b(0?[1-9]|[12][0-9]|3[01])[\s\-.](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-.](20\d\d|\d\d)\b/i,
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

  // 4. EXTRACT TOTAL / NET AMOUNT (WITH STRICT HIERARCHICAL PRECEDENCE)
  let amount = '';

  // Tier 1 Keywords: Final Net Payable / Grand Total / Settlement Amount (Highest Priority)
  const tier1Patterns = [
    /(?:net\s*amount|net\s*amt|net\s*payable|grand\s*total|total\s*payable|amount\s*payable|final\s*amount|final\s*total|balance\s*due|total\s*due|net\s*total|settlement\s*amount|paid\s*amount|amount\s*paid|total\s*bill\s*amount|bill\s*total)\s*[:\-.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/gi,
  ];

  // Search all matches for Tier 1 across lines (if multiple, pick the last one near bottom)
  let tier1Matches = [];
  for (const pattern of tier1Patterns) {
    let m;
    while ((m = pattern.exec(cleanText)) !== null) {
      if (m[1]) {
        const val = parseCleanAmount(m[1]);
        if (val) tier1Matches.push(val);
      }
    }
  }

  // Check line-by-line for Tier 1 keywords (handles multi-column or OCR split lines)
  if (tier1Matches.length === 0) {
    const tier1Keywords = [
      'net amount',
      'net amt',
      'net payable',
      'grand total',
      'total payable',
      'amount payable',
      'final amount',
      'final total',
      'balance due',
      'total due',
      'net total',
      'settlement amount',
      'paid amount',
      'amount paid',
      'bill total',
    ];

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      if (tier1Keywords.some((kw) => lowerLine.includes(kw))) {
        // Extract numbers from this line
        const nums = line.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:\.\d{1,2})?\b/g);
        if (nums && nums.length > 0) {
          const lastNum = parseCleanAmount(nums[nums.length - 1]);
          if (lastNum) {
            tier1Matches.push(lastNum);
            break;
          }
        }
        // If no number on this line, check next line
        if (i + 1 < lines.length) {
          const nextNums = lines[i + 1].match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:\.\d{1,2})?\b/g);
          if (nextNums && nextNums.length > 0) {
            const nextNum = parseCleanAmount(nextNums[0]);
            if (nextNum) {
              tier1Matches.push(nextNum);
              break;
            }
          }
        }
      }
    }
  }

  if (tier1Matches.length > 0) {
    amount = tier1Matches[tier1Matches.length - 1].toFixed(2);
  }

  // Tier 2: Total Amount / Total Bill / Gross Amount (if no Tier 1 Net Amount found)
  if (!amount) {
    const tier2Patterns = [
      /(?:total\s*amount|total\s*bill|total\s*value|gross\s*amount|gross\s*total)\s*[:\-.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/gi,
      /(?:total|amount)\s*[:\-.]?\s*(?:rs\.?|inr|₹)\s*([0-9,]+\.?[0-9]*)/gi,
    ];

    let tier2Matches = [];
    for (const pattern of tier2Patterns) {
      let m;
      while ((m = pattern.exec(cleanText)) !== null) {
        if (m[1]) {
          const val = parseCleanAmount(m[1]);
          if (val) tier2Matches.push(val);
        }
      }
    }

    if (tier2Matches.length > 0) {
      amount = tier2Matches[tier2Matches.length - 1].toFixed(2);
    }
  }

  // Tier 3 Fallback: search line-by-line from bottom to top for lines containing 'total'
  if (!amount) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/total/i.test(line) && !/sub\s*total|items?\s*total/i.test(line)) {
        const nums = line.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:\.\d{1,2})?\b/g);
        if (nums && nums.length > 0) {
          const lastNum = parseCleanAmount(nums[nums.length - 1]);
          if (lastNum) {
            amount = lastNum.toFixed(2);
            break;
          }
        }
      }
    }
  }

  // 5. EXTRACT TAX AMOUNT (GST / CGST + SGST / IGST / VAT)
  let taxAmount = '';
  // Check for combined or specific tax lines
  const singleTaxPatterns = [
    /(?:total\s*tax|gst\s*amount|tax\s*amount|igst|vat)\s*[:\-.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/i,
  ];

  for (const pattern of singleTaxPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const parsed = parseCleanAmount(match[1]);
      if (parsed) {
        taxAmount = parsed.toFixed(2);
        break;
      }
    }
  }

  // If no single total tax line, look for SGST/CGST or State/Central GST and sum them
  if (!taxAmount) {
    let cgstVal = 0;
    let sgstVal = 0;

    const cgstMatch = cleanText.match(/(?:central\s*gst|cgst)(?:\s*@\s*[\d.]+%)?\s*[:\-.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/i);
    if (cgstMatch && cgstMatch[1]) {
      cgstVal = parseCleanAmount(cgstMatch[1]) || 0;
    }

    const sgstMatch = cleanText.match(/(?:state\s*gst|sgst)(?:\s*@\s*[\d.]+%)?\s*[:\-.]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+\.?[0-9]*)/i);
    if (sgstMatch && sgstMatch[1]) {
      sgstVal = parseCleanAmount(sgstMatch[1]) || 0;
    }

    if (cgstVal > 0 || sgstVal > 0) {
      const totalTaxVal = cgstVal + sgstVal;
      taxAmount = totalTaxVal.toFixed(2);
    }
  }

  // 6. EXTRACT MERCHANT / VENDOR NAME
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

  // 7. CATEGORY AUTO-CLASSIFICATION (USING ACCURATE WORD BOUNDARIES & PLURAL SUPPORT)
  let category = 'OTHER';
  if (/\b(?:petrol|diesel|fuel|cng|hpcl|bpcl|ioc|iocl|shell|speed|filling\s*station|fuel\s*pump)s?\b/i.test(lowerText)) {
    category = 'FUEL';
  } else if (/\b(?:uber|ola|rapido|taxi|cabs?|flight|airline|indigo|air\s*india|irctc|train|bus|redbus|toll|fastag|auto\s*fare|fare|travel|boarding\s*pass)s?\b/i.test(lowerText)) {
    category = 'TRAVEL';
  } else if (/\b(?:hotels?|lodges?|resorts?|inns?|oyo|stay|stays|room\s*rent|room\s*charges?|room|accommodation|check\s*in|check\s*out|guest\s*house)s?\b/i.test(lowerText)) {
    category = 'HOTEL';
  } else if (/\b(?:hospitality|swiggy|zomato|restaurants?|cafes?|food|meals?|dining|lunch|dinner|breakfast|snacks?|burgers?|pizzas?|coffee|tea|chai|bakery|bars?|beverages?|kot|ale|brownie|fries)\b/i.test(lowerText)) {
    category = 'FOOD';
  } else if (/\b(?:stationery|print|printing|photocopy|xerox|paper|pens?|notebooks?|courier|blue\s*dart|dtdc|dhl|cartridges?|toners?)\b/i.test(lowerText)) {
    category = 'OFFICE_SUPPLIES';
  } else if (/\b(?:client|entertainment|gifts?|guest\s*lunch|client\s*meeting)\b/i.test(lowerText)) {
    category = 'CLIENT_ENTERTAINMENT';
  } else if (/\b(?:airtel|jio|vodafone|vi|broadband|internet|mobile\s*recharge|wifi|telecom|phone\s*bills?)\b/i.test(lowerText)) {
    category = 'INTERNET_PHONE';
  } else if (/\b(?:pharmacy|chemist|medicines?|hospitals?|clinics?|doctors?|medical|lab\s*tests?)\b/i.test(lowerText)) {
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

