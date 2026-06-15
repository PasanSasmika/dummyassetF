import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Color Palette ───────────────────────────────────────────────────────────
const NAVY    = [15,  23,  42];
const EMRLD   = [5,  150, 105];
const EMRLD_D = [4,  120,  87];
const BLUE    = [37,  99, 235];
const AMBER   = [217, 119,   6];
const WHITE   = [255, 255, 255];
const SLATE5  = [100, 116, 139];
const SLATE4  = [148, 163, 184];
const SLATE2  = [226, 232, 240];
const SLATE1  = [248, 250, 252];
const DARK    = [15,  23,  42];
const EMRLD_BG = [236, 253, 245];
const AMBER_BG = [255, 251, 235];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export function generateReturnPDF({ returnedAssets, assigneeName, assigneeId, returnedByName, conditionIn }) {
  const doc    = new jsPDF('p', 'mm', 'a4');
  const W      = doc.internal.pageSize.getWidth();
  const H      = doc.internal.pageSize.getHeight();
  const M      = 16;
  const docId  = `ARC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const today  = fmt(new Date().toISOString());
  const half   = (W - M * 2 - 7) / 2;
  const rx     = M + half + 7;

  // ─── Footer helper ─────────────────────────────────────────────────────────
  const drawFooter = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFillColor(...EMRLD);
    doc.rect(0, H - 12, 5, 12, 'F');
    doc.setTextColor(...SLATE4);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Doc No: ${docId}  ·  Return Date: ${today}  ·  ${returnedAssets.length} Asset(s)`, M + 3, H - 4.5);
    doc.text('CONFIDENTIAL — Asset Management System', W - M, H - 4.5, { align: 'right' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────────

  // Dark base bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 52, 'F');

  // Left emerald accent
  doc.setFillColor(...EMRLD);
  doc.rect(0, 0, 5, 52, 'F');

  // Right darker block
  doc.setFillColor(...EMRLD_D);
  doc.rect(W - 60, 0, 60, 52, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(W - 60, 0, 2.5, 52, 'F');

  // Title
  doc.setTextColor(...WHITE);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSET RETURN', M + 9, 17);
  doc.setFontSize(13.5);
  doc.text('CERTIFICATE', M + 9, 27);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE4);
  doc.text('Official Asset Management Document', M + 9, 34.5);

  // Accent line
  doc.setDrawColor(...EMRLD);
  doc.setLineWidth(0.7);
  doc.line(M + 9, 37.5, M + 95, 37.5);

  // Right block — meta
  doc.setTextColor(200, 235, 215);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT ID', W - M - 7, 12, { align: 'right' });
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(docId, W - M - 7, 19.5, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 235, 215);
  doc.text(`Return Date: ${today}`, W - M - 7, 27.5, { align: 'right' });
  doc.text(`Assets: ${returnedAssets.length}`, W - M - 7, 33.5, { align: 'right' });

  // Confidential badge
  doc.setFillColor(...EMRLD);
  doc.roundedRect(W - M - 32, 39, 26, 7.5, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL', W - M - 19, 43.7, { align: 'center' });

  // ─────────────────────────────────────────────────────────────────────────
  // PARTY SECTION
  // ─────────────────────────────────────────────────────────────────────────
  let y = 65;

  // Section heading with rule
  doc.setTextColor(...SLATE5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES INVOLVED', M, y);
  doc.setDrawColor(...SLATE2);
  doc.setLineWidth(0.2);
  doc.line(M + 42, y - 2, W - M, y - 2);

  y += 5;

  const cardH = 35;

  // ── Returnee card ─────────────────────────────────────────────────────────
  doc.setFillColor(...SLATE1);
  doc.setDrawColor(...SLATE2);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, half, cardH, 2, 2, 'FD');
  // Emerald left accent
  doc.setFillColor(...EMRLD);
  doc.roundedRect(M, y, 3.5, cardH, 1, 1, 'F');
  doc.rect(M + 2, y, 1.5, cardH, 'F');

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('RETURNED BY', M + 8, y + 8);
  doc.setTextColor(...DARK);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(assigneeName || '—', M + 8, y + 15.5, { maxWidth: half - 13 });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE5);
  if (assigneeId) doc.text(`Employee ID: ${assigneeId}`, M + 8, y + 21.5);
  doc.text(`Condition at Return: ${conditionIn || 'Not specified'}`, M + 8, y + 27);

  // Condition badge
  const COND_COLORS = {
    New:     [5, 150, 105],
    Good:    [37, 99, 235],
    Fair:    [217, 119, 6],
    Poor:    [249, 115, 22],
    Damaged: [220, 38, 38],
  };
  if (conditionIn) {
    const condColor = COND_COLORS[conditionIn] || SLATE5;
    const condW = conditionIn.length * 2.6 + 9;
    doc.setFillColor(...condColor);
    doc.roundedRect(M + 8, y + 29, condW, 5.5, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(conditionIn, M + 8 + condW / 2, y + 32.5, { align: 'center' });
  }

  // ── Processed by card ─────────────────────────────────────────────────────
  doc.setFillColor(...SLATE1);
  doc.setDrawColor(...SLATE2);
  doc.roundedRect(rx, y, half, cardH, 2, 2, 'FD');
  // Blue left accent
  doc.setFillColor(...BLUE);
  doc.roundedRect(rx, y, 3.5, cardH, 1, 1, 'F');
  doc.rect(rx + 2, y, 1.5, cardH, 'F');

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIVED BY', rx + 8, y + 8);
  doc.setTextColor(...DARK);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(returnedByName || 'System', rx + 8, y + 15.5, { maxWidth: half - 13 });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE5);
  doc.text(`Return Date: ${today}`, rx + 8, y + 21.5);
  doc.text(`Assets returned: ${returnedAssets.length}`, rx + 8, y + 27);

  y += cardH + 13;

  // ─────────────────────────────────────────────────────────────────────────
  // RETURNED ASSETS TABLE
  // ─────────────────────────────────────────────────────────────────────────

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RETURNED ASSETS', M, y);
  doc.setDrawColor(...SLATE2);
  doc.setLineWidth(0.2);
  doc.line(M + 42, y - 2, W - M, y - 2);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 18 },
    head: [['#', 'Asset No.', 'Asset Name', 'Category', 'Type', 'Condition In', 'Return Date']],
    body: returnedAssets.map((a, i) => [
      i + 1,
      a.asset_no   || `#${a.asset_id || a.id}`,
      a.name       || a.asset_name   || '—',
      a.category   || '—',
      a.asset_type || '—',
      conditionIn  || '—',
      today,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3.5, right: 3.5 },
      lineColor: SLATE2,
      lineWidth: 0.15,
      textColor: DARK,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 5.5, bottom: 5.5, left: 3.5, right: 3.5 },
    },
    alternateRowStyles: { fillColor: SLATE1 },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 48 },
      3: { cellWidth: 28 },
      4: { cellWidth: 24 },
      5: { cellWidth: 20 },
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ─────────────────────────────────────────────────────────────────────────
  // CIA NOTE
  // ─────────────────────────────────────────────────────────────────────────
  if (y > H - 100) { doc.addPage(); y = 20; }

  const noteH = 18;
  doc.setFillColor(...EMRLD_BG);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(M, y, W - M * 2, noteH, 2, 2, 'FD');
  doc.setFillColor(...EMRLD);
  doc.roundedRect(M, y, 3.5, noteH, 1, 1, 'F');
  doc.rect(M + 2, y, 1.5, noteH, 'F');

  doc.setTextColor(6, 95, 70);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ℹ  CIA Levels Unchanged', M + 9, y + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Asset security classification is preserved as-is upon return.', M + 9, y + 13.5);

  y += noteH + 12;

  // ─────────────────────────────────────────────────────────────────────────
  // ACKNOWLEDGMENT
  // ─────────────────────────────────────────────────────────────────────────
  if (y > H - 88) { doc.addPage(); y = 20; }

  const ackH = 36;
  doc.setFillColor(...AMBER_BG);
  doc.setDrawColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(M, y, W - M * 2, ackH, 2, 2, 'FD');
  doc.setFillColor(...AMBER);
  doc.roundedRect(M, y, 3.5, ackH, 1, 1, 'F');
  doc.rect(M + 2, y, 1.5, ackH, 'F');

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ACKNOWLEDGMENT', M + 9, y + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  [
    '1.  The above assets have been returned in the condition stated by the returnee.',
    '2.  The asset manager confirms receipt and inspection of all returned items.',
    '3.  Any outstanding damage or discrepancies will be noted separately and reported.',
    '4.  This certificate serves as official record of the asset return transaction.',
  ].forEach((t, i) => doc.text(t, M + 9, y + 17 + i * 5.5, { maxWidth: W - M * 2 - 15 }));

  y += ackH + 14;

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNATURES
  // ─────────────────────────────────────────────────────────────────────────
  if (y > H - 58) { doc.addPage(); y = 20; }

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', M, y);
  doc.setDrawColor(...SLATE2);
  doc.setLineWidth(0.2);
  doc.line(M + 27, y - 2, W - M, y - 2);
  y += 5;

  const sigH = 31;
  [
    [M,  assigneeName || '—',   'RETURNEE SIGNATURE', EMRLD],
    [rx, returnedByName || 'System', 'RECEIVED BY',   BLUE ],
  ].forEach(([x, name, label, accent]) => {
    doc.setFillColor(...SLATE1);
    doc.setDrawColor(...SLATE2);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, half, sigH, 2, 2, 'FD');

    // Colored top accent
    doc.setFillColor(...accent);
    doc.roundedRect(x, y, half, 3, 1, 1, 'F');
    doc.rect(x, y + 1.5, half, 1.5, 'F');

    doc.setTextColor(...SLATE5);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 6, y + 11);

    doc.setDrawColor(...SLATE4);
    doc.setLineWidth(0.25);
    doc.line(x + 6, y + 21, x + half - 6, y + 21);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE5);
    doc.text(`Name: ${name}`, x + 6, y + 26.5);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER — draw on ALL pages
  // ─────────────────────────────────────────────────────────────────────────
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter();
  }

  return { doc, docId };
}
