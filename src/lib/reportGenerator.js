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
