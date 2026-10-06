import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';

/**
 * Export data array to CSV file
 */
export function exportToCSV(data, fileName = 'ADRA_Export.csv') {
  if (!data || !data.length) {
    alert('No records available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate formatted PDF Report with ADRA branding
 */
export function exportToPDF({
  title,
  subtitle,
  columns,
  data,
  fileName = 'ADRA_Report.pdf',
  summary = null
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  // ADRA Header Banner
  doc.setFillColor(0, 107, 86); // Dark Green #006B56
  doc.rect(0, 0, 842, 65, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255); // White #FFFFFF
  doc.text('ADRA DEVELOPMENT MANAGEMENT SYSTEM', 40, 32);

  // Subtitle / Report Type
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(232, 245, 241); // Light Green #E8F5F1
  doc.text(title || 'Official Management Report', 40, 50);

  // Generation timestamp & metadata
  doc.setFontSize(9);
  doc.setTextColor(245, 247, 246); // Light Gray #F5F7F6
  doc.text(`Generated: ${new Date().toLocaleString()}`, 640, 35);
  doc.text('Confidential NGO Document', 640, 48);

  let currentY = 85;

  if (subtitle) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 40, currentY);
    currentY += 20;
  }

  // Summary KPI block if provided
  if (summary && summary.length > 0) {
    doc.setFillColor(245, 247, 246); // Light Gray #F5F7F6
    doc.roundedRect(40, currentY, 762, 35, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(28, 28, 28); // Black #1C1C1C

    let offsetX = 55;
    summary.forEach(item => {
      doc.text(`${item.label}: `, offsetX, currentY + 22);
      doc.setTextColor(0, 133, 106); // Primary #00856A
      const labelWidth = doc.getTextWidth(`${item.label}: `);
      doc.text(`${item.value}`, offsetX + labelWidth, currentY + 22);
      doc.setTextColor(28, 28, 28); // Black #1C1C1C
      offsetX += 180;
    });

    currentY += 50;
  }

  // AutoTable
  doc.autoTable({
    startY: currentY,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => {
      const val = row[c.key];
      if (c.type === 'currency') return formatCurrency(val);
      if (c.type === 'date') return formatDate(val);
      return val !== undefined && val !== null ? String(val) : '-';
    })),
    theme: 'grid',
    headStyles: {
      fillColor: [0, 133, 106], // Primary #00856A
      textColor: 255, // White #FFFFFF
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [28, 28, 28] // Black #1C1C1C
    },
    alternateRowStyles: {
      fillColor: [245, 247, 246] // Light Gray #F5F7F6
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        842 / 2,
        575,
        { align: 'center' }
      );
    }
  });

  doc.save(fileName);
}

/**
 * Generate official printable PDF Payment Voucher / Receipt
 */
export function exportVoucherPDF(item) {
  if (!item) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const voucherCode = item.finance_disbursement?.voucher_reference || item.expenditure_code || item.request_code || `PV-${Date.now().toString().slice(-6)}`;
  const txnCode = item.finance_disbursement?.transaction_ref || 'TXN-MG-VERIFIED';
  const payeeName = item.field_worker_name || item.recorded_by || 'Field Worker';
  const payeePhone = item.payout_phone || item.field_worker_phone || item.recipient_phone || 'N/A';
  const amount = Number(item.amount || 0);
  const currency = item.currency || 'SSP';
  const paymentChannel = item.finance_disbursement?.payment_method || item.preferred_payout || 'm-Gurush Mobile Money';
  const purpose = item.purpose || item.description || item.title || item.reason || 'Operational mission facilitation and transport stipend.';
  const location = item.location || (item.payam ? `${item.payam}, ${item.county || ''}` : 'Field Operations');
  const disbursedAt = new Date(item.finance_disbursement?.disbursed_at || item.expenditure_date || item.created_at || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Top Header Banner
  doc.setFillColor(0, 107, 86); // #006B56
  doc.rect(0, 0, 595, 80, 'F');

  // ADRA Emblem Badge on Left
  doc.setFillColor(4, 120, 87); // #047857
  doc.roundedRect(40, 19, 42, 42, 6, 6, 'F');
  doc.setDrawColor(52, 211, 153); // #34D399
  doc.setLineWidth(1.2);
  doc.roundedRect(40, 19, 42, 42, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('A', 53, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ADVENTIST DEVELOPMENT AND RELIEF AGENCY', 92, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(230, 245, 240);
  doc.text('ADRA South Sudan  •  Financial Control & Grants Directorate', 92, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(167, 243, 208);
  doc.text('OFFICIAL ELECTRONIC DISBURSEMENT VOUCHER RECEIPT', 92, 60);

  // Reference & Date Strip
  doc.setFillColor(245, 247, 246);
  doc.roundedRect(40, 95, 515, 45, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 95, 515, 45, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('VOUCHER REFERENCE', 55, 112);
  doc.text('PAYMENT CHANNEL', 220, 112);
  doc.text('TRANSACTION REF', 380, 112);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(voucherCode, 55, 128);
  doc.text(paymentChannel, 220, 128);
  doc.text(txnCode, 380, 128);

  // Payee & Operational Details Table
  doc.autoTable({
    startY: 150,
    head: [['FIELD BENEFICIARY / PAYEE INFORMATION', 'DETAILS']],
    body: [
      ['Payee Staff Name', payeeName],
      ['Staff Payout Phone', payeePhone],
      ['Requisition Code / Case Ref', item.request_code || item.id || 'FAC-REQ'],
      ['Operational Duty Station', location],
      ['Program / Project Affiliation', item.project_name || 'Emergency Response Program (EFSLR)'],
      ['Disbursement Date', disbursedAt],
      ['Requisition Purpose', purpose]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 107, 86],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 180, fillColor: [248, 250, 252] },
      1: { cellWidth: 335 }
    },
    margin: { left: 40, right: 40 }
  });

  let currentY = doc.lastAutoTable.finalY + 15;

  // Itemized breakdown if present
  if (item.breakdown && item.breakdown.length > 0) {
    doc.autoTable({
      startY: currentY,
      head: [['ITEM DESCRIPTION', 'CATEGORY', 'AMOUNT (SSP)']],
      body: item.breakdown.map((b, i) => [
        b.item || b.description || `Line Item #${i + 1}`,
        b.category || item.category || 'Operational Facilitation',
        `${Number(b.total || b.amount || 0).toLocaleString()} SSP`
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8.5
      },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 40, right: 40 }
    });
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // Amount Highlight Box
  doc.setFillColor(236, 253, 245); // #ECFDF5
  doc.roundedRect(40, currentY, 515, 55, 6, 6, 'F');
  doc.setDrawColor(16, 185, 129); // #10B981
  doc.setLineWidth(1.5);
  doc.roundedRect(40, currentY, 515, 55, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text('TOTAL AMOUNT DISBURSED & RECONCILED:', 55, currentY + 22);

  doc.setFontSize(18);
  doc.setTextColor(0, 107, 86);
  doc.text(`${currency} ${amount.toLocaleString()}.00`, 55, currentY + 44);

  doc.setFontSize(9);
  doc.setTextColor(4, 120, 87);
  doc.text('STATUS: PAID & SETTLED', 400, currentY + 44);

  currentY += 75;

  // Signatures & Dual Authorization Section
  doc.autoTable({
    startY: currentY,
    head: [['1. SUPERVISOR ENDORSEMENT', '2. PROGRAMME MANAGER AUTHORIZATION', '3. FINANCE OFFICER DISBURSEMENT']],
    body: [
      [
        `Endorsed By: ${item.supervisor_endorsed_by || item.supervisor_name || 'Emmanuel Adeyemi'}\nStatus: VERIFIED\nRemarks: "${item.supervisor_remarks || 'Endorsed for mission.'}"`,
        `Authorized By: ${item.pm_approved_by || 'Grace Ochieng'}\nStatus: AUTHORIZED\nRemarks: "${item.pm_remarks || 'Authorized for finance payout.'}"`,
        `Disbursed By: ${item.finance_disbursement?.disbursed_by || 'Alex Morgan'}\nStatus: DISBURSED & LOGGED\nVoucher: ${voucherCode}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    margin: { left: 40, right: 40 }
  });

  // Footer Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is an official electronic payment voucher generated by ADRA South Sudan Humanitarian ERP. Valid without physical stamp.',
    40,
    810
  );

  doc.save(`ADRA_Payment_Voucher_${voucherCode}.pdf`);
}

/**
 * Generate official Waybill / Dispatch Receipt PDF
 */
export function exportWaybillPDF(dispatch) {
  if (!dispatch) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const waybillNo = dispatch.waybill_number || 'WAYBILL-SS';
  const dispatchToken = dispatch.dispatch_token || 'WB-TOKEN';

  // 1. ADRA Green Banner Header
  doc.setFillColor(0, 107, 86); // #006B56
  doc.rect(0, 0, 595, 75, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('ADRA SOUTH SUDAN', 40, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(209, 250, 229);
  doc.text('HUMANITARIAN RELIEF DISPATCH & WAYBILL RECEIPT', 40, 54);

  // Right Header Token Badge
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(waybillNo, 555, 36, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(`Token: ${dispatchToken}  |  ${dispatch.dispatch_date || 'Today'}`, 555, 54, { align: 'right' });

  let currentY = 95;

  // 2. Logistics & Route Summary
  doc.autoTable({
    startY: currentY,
    head: [['LOGISTICS & DISPATCH METADATA', 'VALUE / DETAILS']],
    body: [
      ['Waybill Reference', `${waybillNo} (${dispatchToken})`],
      ['Dispatch Date', dispatch.dispatch_date || 'N/A'],
      ['Origin Warehouse / Depot', dispatch.origin_warehouse || 'Central Equatoria State Depot'],
      ['Destination Relief Hub', dispatch.destination || 'Field Relief Distribution Centre'],
      ['Beneficiary / Allocation', dispatch.beneficiary_name ? `${dispatch.beneficiary_name}` : 'Humanitarian Aid Relief Allocation'],
      ['Convoy Driver', dispatch.driver_name || 'Deng Bol'],
      ['Vehicle Plate / Reg No', dispatch.vehicle_reg || 'SSD-481-LOG'],
      ['Current Status', dispatch.status || 'In Transit'],
      ['Authorized Release Officer', dispatch.released_by || 'Warehouse Officer']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 160, fillColor: [248, 250, 252] },
      1: { cellWidth: 355 }
    },
    margin: { left: 40, right: 40 }
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // 3. Staged Commodities Manifest Table
  const items = dispatch.items && dispatch.items.length > 0 ? dispatch.items : [
    { item_name: 'Relief Aid Bundle', quantity: 1, unit: 'Kit' }
  ];

  doc.autoTable({
    startY: currentY,
    head: [['#', 'COMMODITY DESCRIPTION', 'QUANTITY', 'UNIT', 'STATUS']],
    body: items.map((item, idx) => [
      idx + 1,
      item.item_name || 'Humanitarian Relief Item',
      Number(item.quantity || 0).toLocaleString(),
      item.unit || 'pcs',
      'Dispatched'
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [0, 107, 86],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 285 },
      2: { cellWidth: 70, halign: 'right', fontStyle: 'bold', textColor: [0, 107, 86] },
      3: { cellWidth: 60, halign: 'center' },
      4: { cellWidth: 70, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  currentY = doc.lastAutoTable.finalY + 30;

  // 4. Sign-Off & Verification
  doc.autoTable({
    startY: currentY,
    head: [['1. DISPATCHED BY (WAREHOUSE OFFICER)', '2. RECEIVED & VERIFIED BY (FIELD OFFICER)']],
    body: [
      [
        `Officer: ${dispatch.released_by || 'Gabriel Majok'}\nRole: Inventory Manager\nStatus: DISPATCHED & VERIFIED`,
        `Receiving Officer: ${dispatch.supervisor_name || 'Field Supervisor'}\nStatus: PENDING ARRIVAL / VERIFIED`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    margin: { left: 40, right: 40 }
  });

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Electronic Waybill Manifest #${waybillNo} • ADRA South Sudan Humanitarian ERP System`,
    40,
    810
  );

  doc.save(`ADRA_Waybill_${waybillNo}.pdf`);
}


