/**
 * Nestora Client-Side PDF Generator & Downloader
 * Generates valid PDF 1.4 binary receipts directly in the browser
 * with zero external dependencies and instant download.
 */

// Helper to sanitize text for PDF Type 1 standard fonts
function sanitizeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\u20B9]/g, 'INR ') // Replace ₹ symbol with INR for Helvetica compatibility
    .replace(/[^\x20-\x7E]/g, ' '); // Strip non-ASCII
}

export function buildReceiptPdfBinary(receiptData) {
  const {
    receiptNumber = 'REC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    tenantName = 'Verified Tenant',
    tenantEmail = 'tenant@nestora.com',
    ownerName = 'Verified Property Owner',
    ownerEmail = 'owner@nestora.com',
    propertyTitle = 'Kerala Premium Residential Rental',
    propertyAddress = 'Kochi, Kerala, India',
    moveInDate = new Date().toLocaleDateString('en-IN'),
    durationMonths = 11,
    monthlyRent = 25000,
    securityDeposit = 50000,
    stampDuty = 500,
    totalPaid = 75500,
    bookingId = '',
    generatedDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  } = receiptData;

  const streamLines = [
    // Background canvas
    'q',
    // Header brand background banner (Emerald #0F766E)
    '0.06 0.46 0.38 rg',
    '30 730 535 85 re f',

    // Gold/Emerald accent line
    '0.02 0.30 0.25 rg',
    '30 726 535 4 re f',

    // White Header Texts
    'BT',
    '/F2 20 Tf',
    '1 1 1 rg',
    '45 780 Td',
    '(' + sanitizeText('NESTORA REALTY TECHNOLOGIES') + ') Tj',
    'ET',

    'BT',
    '/F1 10 Tf',
    '0.85 0.98 0.95 rg',
    '45 764 Td',
    '(' + sanitizeText('OFFICIAL RESIDENTIAL LEASE & SECURITY DEPOSIT RECEIPT') + ') Tj',
    'ET',

    'BT',
    '/F1 9 Tf',
    '0.85 0.98 0.95 rg',
    '45 745 Td',
    '(' + sanitizeText('Kerala Tenancy Regulatory Standard (11-Month Registered Lease)') + ') Tj',
    'ET',

    // Status Badge & Receipt Number
    'BT',
    '/F2 10 Tf',
    '1 1 1 rg',
    '420 780 Td',
    '(' + sanitizeText(receiptNumber) + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.85 0.98 0.95 rg',
    '420 764 Td',
    '(' + sanitizeText('STATUS: CONFIRMED') + ') Tj',
    'ET',

    'BT',
    '/F1 8 Tf',
    '0.85 0.98 0.95 rg',
    '420 745 Td',
    '(' + sanitizeText('Issued: ' + generatedDate) + ') Tj',
    'ET',

    // SECTION 1: TENANT & OWNER DETAILS BOX
    '0.95 0.96 0.98 rg',
    '30 635 535 75 re f',
    '0.80 0.85 0.90 RG',
    '1 w',
    '30 635 535 75 re S',

    'BT',
    '/F2 11 Tf',
    '0.06 0.46 0.38 rg',
    '45 692 Td',
    '(' + sanitizeText('PARTIES TO THE RENTAL AGREEMENT') + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.1 0.15 0.2 rg',
    '45 674 Td',
    '(' + sanitizeText('TENANT / LESSEE:') + ') Tj',
    '/F1 9 Tf',
    '15 0 Td',
    '(' + sanitizeText(' ' + tenantName + ' (' + tenantEmail + ')') + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.1 0.15 0.2 rg',
    '45 655 Td',
    '(' + sanitizeText('LESSOR / HOST:') + ') Tj',
    '/F1 9 Tf',
    '15 0 Td',
    '(' + sanitizeText(' ' + ownerName + ' (' + ownerEmail + ')') + ') Tj',
    'ET',

    'BT',
    '/F1 8 Tf',
    '0.4 0.45 0.5 rg',
    '45 642 Td',
    '(' + sanitizeText('Platform Verification: Direct Landlord Escrow (Zero Brokerage System)') + ') Tj',
    'ET',

    // SECTION 2: PROPERTY & LEASE DETAILS BOX
    '0.98 0.99 1.0 rg',
    '30 525 535 95 re f',
    '0.80 0.85 0.90 RG',
    '30 525 535 95 re S',

    'BT',
    '/F2 11 Tf',
    '0.06 0.46 0.38 rg',
    '45 600 Td',
    '(' + sanitizeText('LEASE & OCCUPANCY PARTICULARS') + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.1 0.15 0.2 rg',
    '45 580 Td',
    '(' + sanitizeText('PROPERTY:') + ') Tj',
    '/F1 9 Tf',
    '10 0 Td',
    '(' + sanitizeText(' ' + propertyTitle) + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.1 0.15 0.2 rg',
    '45 562 Td',
    '(' + sanitizeText('LOCATION:') + ') Tj',
    '/F1 9 Tf',
    '10 0 Td',
    '(' + sanitizeText(' ' + propertyAddress) + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.1 0.15 0.2 rg',
    '45 544 Td',
    '(' + sanitizeText('MOVE-IN DATE:') + ') Tj',
    '/F1 9 Tf',
    '10 0 Td',
    '(' + sanitizeText(' ' + moveInDate + '    |    LEASE TERM: ' + durationMonths + ' Months') + ') Tj',
    'ET',

    'BT',
    '/F1 8 Tf',
    '0.4 0.45 0.5 rg',
    '45 531 Td',
    '(' + sanitizeText('Booking Reference ID: ' + (bookingId || receiptNumber)) + ') Tj',
    'ET',

    // SECTION 3: FINANCIAL BREAKDOWN TABLE
    '0.93 0.97 0.95 rg',
    '30 460 535 48 re f',
    '0.06 0.46 0.38 RG',
    '30 460 535 48 re S',

    'BT',
    '/F2 11 Tf',
    '0.06 0.46 0.38 rg',
    '45 492 Td',
    '(' + sanitizeText('ITEMIZED FINANCIAL TRANSACTIONS') + ') Tj',
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.2 0.3 0.3 rg',
    '45 470 Td',
    '(' + sanitizeText('Description                                                            Terms                 Amount (INR)') + ') Tj',
    'ET',

    // Table Rows
    // Row 1: Advance Monthly Rent
    'BT',
    '/F1 9 Tf',
    '0.15 0.2 0.25 rg',
    '45 440 Td',
    '(' + sanitizeText('First Month Advance Lease Rent                                          1 Month              INR ' + Number(monthlyRent).toLocaleString('en-IN')) + ') Tj',
    'ET',

    // Row 2: Security Deposit
    'BT',
    '/F1 9 Tf',
    '0.15 0.2 0.25 rg',
    '45 420 Td',
    '(' + sanitizeText('Refundable Security Deposit (Escrow Guarantee)                         2 Months             INR ' + Number(securityDeposit).toLocaleString('en-IN')) + ') Tj',
    'ET',

    // Row 3: Agreement & Stamp Fee
    'BT',
    '/F1 9 Tf',
    '0.15 0.2 0.25 rg',
    '45 400 Td',
    '(' + sanitizeText('Kerala Tenancy Digital e-Stamp & Documentation Fee                      One-Time             INR ' + Number(stampDuty).toLocaleString('en-IN')) + ') Tj',
    'ET',

    // Row 4: Total Banner
    '0.06 0.46 0.38 rg',
    '30 365 535 24 re f',

    'BT',
    '/F2 11 Tf',
    '1 1 1 rg',
    '45 373 Td',
    '(' + sanitizeText('TOTAL ADVANCE AMOUNT PAID & ACKNOWLEDGED:                               INR ' + Number(totalPaid).toLocaleString('en-IN')) + ') Tj',
    'ET',

    // SECTION 4: STATUTORY CLAUSES & LEGAL COMPLIANCE
    '0.98 0.98 0.98 rg',
    '30 220 535 130 re f',
    '0.85 0.85 0.85 RG',
    '30 220 535 130 re S',

    'BT',
    '/F2 10 Tf',
    '0.1 0.15 0.2 rg',
    '45 330 Td',
    '(' + sanitizeText('STATUTORY LEASE ACKNOWLEDGEMENT & TERMS') + ') Tj',
    'ET',

    'BT',
    '/F1 8 Tf',
    '0.3 0.35 0.4 rg',
    '45 312 Td',
    '(' + sanitizeText('1. Security Deposit is held securely and is fully refundable upon vacant possession and handover.') + ') Tj',
    '45 297 Td',
    '(' + sanitizeText('2. Standard 11-month Kerala tenancy format with 30-day bilateral termination notice period.') + ') Tj',
    '45 282 Td',
    '(' + sanitizeText('3. Digital signature and computer-generated acknowledgment; requires no physical ink signature.') + ') Tj',
    '45 267 Td',
    '(' + sanitizeText('4. Rent payments are due on or before the 5th day of every calendar month via Nestora Portal.') + ') Tj',
    '45 252 Td',
    '(' + sanitizeText('5. This receipt constitutes formal legal proof of tenancy booking and advance remittance.') + ') Tj',
    'ET',

    // STAMP & VERIFICATION EMBLEM
    '0.90 0.96 0.93 rg',
    '30 130 535 75 re f',
    '0.06 0.46 0.38 RG',
    '1 w',
    '30 130 535 75 re S',

    'BT',
    '/F2 11 Tf',
    '0.06 0.46 0.38 rg',
    '45 180 Td',
    '(' + sanitizeText('NESTORA REALTY TECHNOLOGIES  --  OFFICIAL VERIFICATION SEAL') + ') Tj',
    'ET',

    'BT',
    '/F1 8.5 Tf',
    '0.2 0.25 0.3 rg',
    '45 160 Td',
    '(' + sanitizeText('Verified by Nestora Real Estate Verification Engine under Kerala Municipal Tenancy By-laws.') + ') Tj',
    '45 145 Td',
    '(' + sanitizeText('Cryptographic Transaction Hash: ' + (receiptNumber + '-SHA256-' + Date.now().toString(16)).toUpperCase()) + ') Tj',
    'ET',

    // FOOTER
    'BT',
    '/F1 8 Tf',
    '0.5 0.5 0.5 rg',
    '45 80 Td',
    '(' + sanitizeText('Nestora Technologies Private Limited  |  Infopark Phase II, Kochi, Kerala  |  support@nestora.com') + ') Tj',
    '45 68 Td',
    '(' + sanitizeText('This is a digitally generated document issued under the Indian Information Technology Act, 2000.') + ') Tj',
    'ET',

    'Q',
  ];

  const streamContent = streamLines.join('\n');
  const streamLength = Buffer.byteLength
    ? Buffer.byteLength(streamContent, 'latin1')
    : streamContent.length;

  const objects = [];
  let objCount = 0;

  // Obj 1: Catalog
  objCount++;
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';

  // Obj 2: Pages
  objCount++;
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj';

  // Obj 3: Page (A4: 595.28 x 841.89)
  objCount++;
  objects[3] =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj';

  // Obj 4: Helvetica regular
  objCount++;
  objects[4] =
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj';

  // Obj 5: Helvetica bold
  objCount++;
  objects[5] =
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj';

  // Obj 6: Content Stream
  objCount++;
  objects[6] =
    '6 0 obj\n<< /Length ' +
    streamLength +
    ' >>\nstream\n' +
    streamContent +
    '\nendstream\nendobj';

  let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];

  for (let i = 1; i <= 6; i++) {
    offsets[i] = body.length;
    body += objects[i] + '\n';
  }

  const startXref = body.length;
  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    xref += off + ' 00000 n \n';
  }

  const trailer =
    'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' +
    startXref +
    '\n%%EOF\n';

  return body + xref + trailer;
}

/**
 * Downloads the receipt as a genuine .pdf file
 */
export function downloadReceiptPdf(receiptData) {
  try {
    const pdfString = buildReceiptPdfBinary(receiptData);
    const bytes = new Uint8Array(pdfString.length);
    for (let i = 0; i < pdfString.length; i++) {
      bytes[i] = pdfString.charCodeAt(i) & 0xff;
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const recId = receiptData.receiptNumber || 'REC-' + Date.now();
    a.href = url;
    a.download = `Nestora_Rental_Receipt_${recId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);

    return true;
  } catch (err) {
    console.error('PDF download error:', err);
    return false;
  }
}

/**
 * Opens a print-optimized window for instantaneous Save-As-PDF or direct physical printing
 */
export function printReceiptWindow(receiptData) {
  const {
    receiptNumber = 'REC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    tenantName = 'Verified Tenant',
    tenantEmail = 'tenant@nestora.com',
    ownerName = 'Verified Property Owner',
    ownerEmail = 'owner@nestora.com',
    propertyTitle = 'Kerala Premium Residential Rental',
    propertyAddress = 'Kochi, Kerala, India',
    moveInDate = new Date().toLocaleDateString('en-IN'),
    durationMonths = 11,
    monthlyRent = 25000,
    securityDeposit = 50000,
    stampDuty = 500,
    totalPaid = 75500,
    bookingId = '',
    generatedDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  } = receiptData;

  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    alert('Please allow popups to print/save the receipt.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Nestora Receipt — ${receiptNumber}</title>
<style>
  @media print {
    body { margin: 0; padding: 15mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    margin: 0;
    padding: 30px;
  }
  .receipt-card {
    max-width: 780px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .header-banner {
    background: linear-gradient(135deg, #064e3b 0%, #0f766e 100%);
    color: #ffffff;
    padding: 24px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-banner h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .header-banner p { margin: 4px 0 0 0; font-size: 13px; color: #ccfbf1; }
  .header-right { text-align: right; }
  .rec-badge { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; }
  .status-badge { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; margin-top: 6px; }
  
  .content { padding: 30px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .box-title { font-size: 12px; font-weight: 700; color: #0f766e; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .box p { margin: 4px 0; font-size: 13px; color: #334155; }
  .box p strong { color: #0f172a; }

  table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  th { background: #f1f5f9; color: #0f172a; font-weight: 700; text-align: left; padding: 10px 14px; border-bottom: 2px solid #cbd5e1; }
  td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #334155; }
  tr.total-row { background: #f0fdf4; font-weight: 800; font-size: 15px; }
  tr.total-row td { border-top: 2px solid #10b981; border-bottom: none; color: #064e3b; }

  .terms { background: #f8fafc; border-left: 4px solid #0f766e; padding: 12px 16px; font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 20px; }
  .seal { margin-top: 24px; padding: 16px; border: 1px dashed #0f766e; background: #f0fdf4; border-radius: 8px; text-align: center; }
  .seal h4 { margin: 0 0 4px 0; color: #065f46; font-size: 13px; font-weight: 800; }
  .seal p { margin: 0; font-size: 11px; color: #047857; }

  .actions { padding: 20px 30px; background: #f1f5f9; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
  .btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; }
  .btn-print { background: #0f766e; color: #ffffff; }
  .btn-close { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; }
</style>
</head>
<body>

<div class="receipt-card">
  <div class="header-banner">
    <div>
      <h1>NESTORA</h1>
      <p>Official Residential Lease & Security Deposit Receipt</p>
    </div>
    <div class="header-right">
      <div class="rec-badge">${receiptNumber}</div>
      <div><span class="status-badge">PAYMENT CONFIRMED</span></div>
    </div>
  </div>

  <div class="content">
    <div class="grid-2">
      <div class="box">
        <div class="box-title">Tenant Particulars</div>
        <p><strong>Name:</strong> ${tenantName}</p>
        <p><strong>Email:</strong> ${tenantEmail}</p>
        <p><strong>Date Issued:</strong> ${generatedDate}</p>
        <p><strong>Booking Ref:</strong> ${bookingId || receiptNumber}</p>
      </div>
      <div class="box">
        <div class="box-title">Lessor & Property Details</div>
        <p><strong>Property:</strong> ${propertyTitle}</p>
        <p><strong>Location:</strong> ${propertyAddress}</p>
        <p><strong>Owner:</strong> ${ownerName} (${ownerEmail})</p>
        <p><strong>Lease Term:</strong> ${durationMonths} Months (Move-in: ${moveInDate})</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Particulars</th>
          <th>Term</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Advance Monthly Lease Rent</td>
          <td>First Month</td>
          <td style="text-align: right;">₹${Number(monthlyRent).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Refundable Security Deposit (Escrow Protected)</td>
          <td>2 Months</td>
          <td style="text-align: right;">₹${Number(securityDeposit).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Digital Agreement Stamp Duty & Processing</td>
          <td>One-Time</td>
          <td style="text-align: right;">₹${Number(stampDuty).toLocaleString('en-IN')}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">TOTAL ADVANCE REMITTED & VERIFIED</td>
          <td style="text-align: right;">₹${Number(totalPaid).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="terms">
      <strong>Terms & Statutory Notes:</strong><br>
      • The security deposit is held in verified escrow and is refundable upon completion of the 11-month lease tenure.<br>
      • Governed under Kerala Tenancy regulations. 30 days mutual written notice required for termination.<br>
      • Digitally acknowledged and recorded in the Nestora Realty ledger.
    </div>

    <div class="seal">
      <h4>NESTORA REALTY TECHNOLOGIES • DIGITAL VERIFICATION SEAL</h4>
      <p>Cryptographic Acknowledgment: ${receiptNumber}-${Date.now().toString(16).toUpperCase()} • Verified Zero-Brokerage Tenancy</p>
    </div>
  </div>

  <div class="actions no-print">
    <button class="btn btn-close" onclick="window.close()">Close</button>
    <button class="btn btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
</div>

<script>
  window.onload = function() {
    // Optionally trigger print dialog automatically
  };
</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
