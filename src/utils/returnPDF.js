import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GREEN  = [5,  150, 105];
const DARK   = [15,  23,  42];
const GRAY   = [100, 116, 139];
const LIGHT  = [248, 250, 252];
const AMBER  = [255, 251, 235];

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

export function generateReturnPDF({ returnedAssets, assigneeName, assigneeId, returnedByName, conditionIn }) {
  const doc   = new jsPDF('p', 'mm', 'a4');
  const W     = doc.internal.pageSize.getWidth();
  const H     = doc.internal.pageSize.getHeight();
  const M     = 18;
  const docId = `ARC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const dateStr = fmt(new Date().toISOString());

  // ── HEADER ──────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSET RETURN CERTIFICATE', M, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document No: ${docId}`, M, 22);
  doc.text(`Return Date: ${dateStr}`, W - M, 22, { align: 'right' });
  doc.text(`Total Assets Returned: ${returnedAssets.length}`, W - M, 28, { align: 'right' });

  // ── RETURNEE + PROCESSED BY ──────────────────────────────
  let y = 44;

  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RETURNED BY', M, y);
  doc.text('PROCESSED BY', W / 2 + 8, y);

  y += 2;

  const boxH = 28;
  const half = W / 2 - M - 6;

  doc.setFillColor(...LIGHT);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(M, y, half, boxH, 2, 2, 'FD');
  doc.roundedRect(W / 2 + 8, y, half, boxH, 2, 2, 'FD');

  // Returnee
  doc.setTextColor(...DARK);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(assigneeName || '—', M + 4, y + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  if (assigneeId) doc.text(`Employee ID: ${assigneeId}`, M + 4, y + 17);
  doc.text(`Condition at Return: ${conditionIn || 'Not specified'}`, M + 4, y + 23);

  // Processed by
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(returnedByName || 'System', W / 2 + 12, y + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Date: ${dateStr}`, W / 2 + 12, y + 17);
  doc.text(`Assets returned: ${returnedAssets.length}`, W / 2 + 12, y + 23);

  y += boxH + 10;

  // ── RETURNED ASSETS TABLE ─────────────────────────────────
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RETURNED ASSETS', M, y);

  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Asset No.', 'Asset Name', 'Category', 'Type', 'Condition In', 'Return Date']],
    body: returnedAssets.map((a, i) => [
      i + 1,
      a.asset_no   || `#${a.asset_id || a.id}`,
      a.name       || a.asset_name   || '—',
      a.category   || '—',
      a.asset_type || '—',
      conditionIn  || '—',
      dateStr,
    ]),
    styles:          { fontSize: 8.5, cellPadding: 3.5 },
    headStyles:      { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 48 },
      3: { cellWidth: 28 },
      4: { cellWidth: 24 },
      5: { cellWidth: 20 },
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── CIA NOTE ─────────────────────────────────────────────
  if (y > H - 80) { doc.addPage(); y = 20; }

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(M, y, W - M * 2, 14, 2, 2, 'FD');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ℹ  CIA Levels Unchanged — Asset security classification is preserved as-is upon return.', M + 4, y + 9);

  y += 22;

  // ── TERMS ─────────────────────────────────────────────────
  if (y > H - 70) { doc.addPage(); y = 20; }

  doc.setFillColor(...AMBER);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(M, y, W - M * 2, 28, 2, 2, 'FD');

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ACKNOWLEDGMENT', M + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  [
    '1. The above assets have been returned in the condition stated.',
    '2. The asset manager confirms receipt and inspection of all returned items.',
    '3. Any outstanding damage will be noted separately and reported.',
  ].forEach((t, i) => {
    doc.text(t, M + 4, y + 14 + i * 5, { maxWidth: W - M * 2 - 8 });
  });

  y += 36;

  // ── SIGNATURES ────────────────────────────────────────────
  if (y > H - 45) { doc.addPage(); y = 20; }

  const sigW = W / 2 - M - 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  [[M, assigneeName || '', 'Returnee Signature'], [W / 2 + 8, returnedByName || '', 'Received By']]
    .forEach(([x, name, label]) => {
      doc.line(x, y + 12, x + sigW, y + 12);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${name}`, x, y + 24);
      doc.text('Date: _________________________', x, y + 30);
    });

  // ── FOOTER ───────────────────────────────────────────────
  const fY = H - 10;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.line(M, fY - 5, W - M, fY - 5);
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.text(`Doc: ${docId}  ·  ${dateStr}  ·  ${returnedAssets.length} asset(s) returned`, M, fY);
  doc.text('CONFIDENTIAL — For official use only', W - M, fY, { align: 'right' });

  return { doc, docId };
}
