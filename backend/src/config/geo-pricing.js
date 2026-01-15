// Geo-Based Pricing Configuration
// Different pricing per country based on purchasing power and market conditions

const GEO_PRICING = {
  // Tier 1: High-income countries (Premium pricing)
  TIER_1: {
    countries: ['CH', 'NO', 'IS', 'LU', 'DK', 'SE', 'IE', 'NL', 'AT', 'FI', 'DE', 'BE', 'AU', 'CA', 'US', 'GB', 'FR', 'IT', 'ES', 'SG', 'HK', 'JP', 'KR', 'AE', 'QA'],
    pricing: {
      CH: { price: 120, currency: 'CHF', name: 'Switzerland' },      // Highest
      NO: { price: 110, currency: 'NOK', name: 'Norway' },
      IS: { price: 105, currency: 'ISK', name: 'Iceland' },
      LU: { price: 100, currency: 'EUR', name: 'Luxembourg' },
      DK: { price: 95, currency: 'DKK', name: 'Denmark' },
      SE: { price: 90, currency: 'SEK', name: 'Sweden' },
      IE: { price: 88, currency: 'EUR', name: 'Ireland' },
      NL: { price: 85, currency: 'EUR', name: 'Netherlands' },
      AT: { price: 85, currency: 'EUR', name: 'Austria' },
      FI: { price: 85, currency: 'EUR', name: 'Finland' },
      DE: { price: 82, currency: 'EUR', name: 'Germany' },
      BE: { price: 82, currency: 'EUR', name: 'Belgium' },
      AU: { price: 80, currency: 'AUD', name: 'Australia' },
      CA: { price: 80, currency: 'CAD', name: 'Canada' },
      US: { price: 78, currency: 'USD', name: 'United States' },     // Base price
      GB: { price: 78, currency: 'GBP', name: 'United Kingdom' },
      FR: { price: 78, currency: 'EUR', name: 'France' },
      IT: { price: 75, currency: 'EUR', name: 'Italy' },
      ES: { price: 72, currency: 'EUR', name: 'Spain' },
      SG: { price: 85, currency: 'SGD', name: 'Singapore' },
      HK: { price: 82, currency: 'HKD', name: 'Hong Kong' },
      JP: { price: 88, currency: 'JPY', name: 'Japan' },
      KR: { price: 80, currency: 'KRW', name: 'South Korea' },
      AE: { price: 90, currency: 'AED', name: 'UAE' },
      QA: { price: 92, currency: 'QAR', name: 'Qatar' },
    }
  },

  // Tier 2: Upper-middle income countries
  TIER_2: {
    countries: ['PT', 'GR', 'CZ', 'PL', 'HU', 'SK', 'SI', 'EE', 'LT', 'LV', 'HR', 'RO', 'BG', 'TR', 'MX', 'BR', 'AR', 'CL', 'UY', 'CR', 'PA', 'MY', 'TH', 'CN', 'RU', 'ZA', 'SA'],
    pricing: {
      PT: { price: 65, currency: 'EUR', name: 'Portugal' },
      GR: { price: 62, currency: 'EUR', name: 'Greece' },
      CZ: { price: 60, currency: 'CZK', name: 'Czech Republic' },
      PL: { price: 58, currency: 'PLN', name: 'Poland' },
      HU: { price: 55, currency: 'HUF', name: 'Hungary' },
      SK: { price: 58, currency: 'EUR', name: 'Slovakia' },
      SI: { price: 62, currency: 'EUR', name: 'Slovenia' },
      EE: { price: 60, currency: 'EUR', name: 'Estonia' },
      LT: { price: 58, currency: 'EUR', name: 'Lithuania' },
      LV: { price: 56, currency: 'EUR', name: 'Latvia' },
      HR: { price: 55, currency: 'EUR', name: 'Croatia' },
      RO: { price: 50, currency: 'RON', name: 'Romania' },
      BG: { price: 48, currency: 'BGN', name: 'Bulgaria' },
      TR: { price: 52, currency: 'TRY', name: 'Turkey' },
      MX: { price: 55, currency: 'MXN', name: 'Mexico' },
      BR: { price: 58, currency: 'BRL', name: 'Brazil' },
      AR: { price: 50, currency: 'ARS', name: 'Argentina' },
      CL: { price: 60, currency: 'CLP', name: 'Chile' },
      UY: { price: 55, currency: 'UYU', name: 'Uruguay' },
      CR: { price: 52, currency: 'CRC', name: 'Costa Rica' },
      PA: { price: 50, currency: 'PAB', name: 'Panama' },
      MY: { price: 55, currency: 'MYR', name: 'Malaysia' },
      TH: { price: 52, currency: 'THB', name: 'Thailand' },
      CN: { price: 65, currency: 'CNY', name: 'China' },
      RU: { price: 48, currency: 'RUB', name: 'Russia' },
      ZA: { price: 55, currency: 'ZAR', name: 'South Africa' },
      SA: { price: 75, currency: 'SAR', name: 'Saudi Arabia' },
    }
  },

  // Tier 3: Lower-middle income countries
  TIER_3: {
    countries: ['IN', 'PK', 'BD', 'PH', 'VN', 'ID', 'EG', 'NG', 'KE', 'GH', 'TZ', 'UG', 'CO', 'PE', 'EC', 'BO', 'PY', 'GT', 'HN', 'SV', 'NI', 'DO', 'JM', 'TT', 'UA', 'BY', 'RS', 'BA', 'MK', 'AL', 'MA', 'TN', 'DZ', 'JO', 'LB', 'IQ', 'IR', 'PK', 'LK', 'NP', 'MM', 'KH', 'LA'],
    pricing: {
      IN: { price: 35, currency: 'INR', name: 'India' },
      PK: { price: 32, currency: 'PKR', name: 'Pakistan' },
      BD: { price: 30, currency: 'BDT', name: 'Bangladesh' },
      PH: { price: 38, currency: 'PHP', name: 'Philippines' },
      VN: { price: 35, currency: 'VND', name: 'Vietnam' },
      ID: { price: 38, currency: 'IDR', name: 'Indonesia' },
      EG: { price: 35, currency: 'EGP', name: 'Egypt' },
      NG: { price: 32, currency: 'NGN', name: 'Nigeria' },
      KE: { price: 35, currency: 'KES', name: 'Kenya' },
      GH: { price: 32, currency: 'GHS', name: 'Ghana' },
      TZ: { price: 30, currency: 'TZS', name: 'Tanzania' },
      UG: { price: 28, currency: 'UGX', name: 'Uganda' },
      CO: { price: 42, currency: 'COP', name: 'Colombia' },
      PE: { price: 40, currency: 'PEN', name: 'Peru' },
      EC: { price: 38, currency: 'USD', name: 'Ecuador' },
      BO: { price: 32, currency: 'BOB', name: 'Bolivia' },
      PY: { price: 35, currency: 'PYG', name: 'Paraguay' },
      GT: { price: 35, currency: 'GTQ', name: 'Guatemala' },
      HN: { price: 32, currency: 'HNL', name: 'Honduras' },
      SV: { price: 35, currency: 'USD', name: 'El Salvador' },
      NI: { price: 30, currency: 'NIO', name: 'Nicaragua' },
      DO: { price: 38, currency: 'DOP', name: 'Dominican Republic' },
      JM: { price: 35, currency: 'JMD', name: 'Jamaica' },
      TT: { price: 40, currency: 'TTD', name: 'Trinidad and Tobago' },
      UA: { price: 35, currency: 'UAH', name: 'Ukraine' },
      BY: { price: 32, currency: 'BYN', name: 'Belarus' },
      RS: { price: 38, currency: 'RSD', name: 'Serbia' },
      BA: { price: 35, currency: 'BAM', name: 'Bosnia and Herzegovina' },
      MK: { price: 32, currency: 'MKD', name: 'North Macedonia' },
      AL: { price: 32, currency: 'ALL', name: 'Albania' },
      MA: { price: 35, currency: 'MAD', name: 'Morocco' },
      TN: { price: 32, currency: 'TND', name: 'Tunisia' },
      DZ: { price: 30, currency: 'DZD', name: 'Algeria' },
      JO: { price: 38, currency: 'JOD', name: 'Jordan' },
      LB: { price: 35, currency: 'LBP', name: 'Lebanon' },
      IQ: { price: 32, currency: 'IQD', name: 'Iraq' },
      IR: { price: 30, currency: 'IRR', name: 'Iran' },
      LK: { price: 32, currency: 'LKR', name: 'Sri Lanka' },
      NP: { price: 28, currency: 'NPR', name: 'Nepal' },
      MM: { price: 28, currency: 'MMK', name: 'Myanmar' },
      KH: { price: 30, currency: 'KHR', name: 'Cambodia' },
      LA: { price: 28, currency: 'LAK', name: 'Laos' },
    }
  },

  // Default fallback
  DEFAULT: {
    price: 78,
    currency: 'USD',
    name: 'Default'
  }
};

// Get pricing for a country code
function getPricingForCountry(countryCode) {
  // Check Tier 1
  if (GEO_PRICING.TIER_1.pricing[countryCode]) {
    return GEO_PRICING.TIER_1.pricing[countryCode];
  }
  
  // Check Tier 2
  if (GEO_PRICING.TIER_2.pricing[countryCode]) {
    return GEO_PRICING.TIER_2.pricing[countryCode];
  }
  
  // Check Tier 3
  if (GEO_PRICING.TIER_3.pricing[countryCode]) {
    return GEO_PRICING.TIER_3.pricing[countryCode];
  }
  
  // Return default
  return GEO_PRICING.DEFAULT;
}

// Get all pricing tiers for comparison
function getAllPricingTiers() {
  return {
    tier1: GEO_PRICING.TIER_1.pricing,
    tier2: GEO_PRICING.TIER_2.pricing,
    tier3: GEO_PRICING.TIER_3.pricing,
    default: GEO_PRICING.DEFAULT
  };
}

// Detect country from IP (to be used with IP geolocation service)
async function detectCountryFromIP(ip) {
  try {
    // Use ipapi.co for geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return data.country_code || 'US';
  } catch (error) {
    console.error('IP geolocation error:', error);
    return 'US'; // Default to US
  }
}

module.exports = {
  GEO_PRICING,
  getPricingForCountry,
  getAllPricingTiers,
  detectCountryFromIP
};
