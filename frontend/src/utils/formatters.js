/**
 * Indian Localization Formatters for Nestora
 */

// Formats number to Indian numbering format (e.g. 1,50,000) with Rupee symbol
export const formatINR = (amount, withPeriod = true) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return withPeriod ? '₹0/month' : '₹0';
  }

  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

  return withPeriod ? `₹${formatted}/month` : `₹${formatted}`;
};

// Formats date to DD-MM-YYYY
export const formatDateIndian = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return 'N/A';
  }
};

// Formats area in square feet
export const formatArea = (sqft) => {
  if (!sqft || isNaN(sqft)) return 'N/A';
  return `${Number(sqft).toLocaleString('en-IN')} sq ft`;
};

// Formats Indian phone number
export const formatPhoneIndian = (phone) => {
  if (!phone) return '+91 XXXXX XXXXX';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return phone;
};

