import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Color Palette ───────────────────────────────────────────────────────────
const NAVY    = [15,  23,  42];
const BLUE    = [37,  99, 235];
const BLUE_D  = [30,  64, 175];
const EMRLD   = [5,  150, 105];
const AMBER   = [217, 119,   6];
const INDIGO  = [99,  102, 241];
const WHITE   = [255, 255, 255];
const SLATE5  = [100, 116, 139];
const SLATE4  = [148, 163, 184];
const SLATE2  = [226, 232, 240];
const SLATE1  = [248, 250, 252];
const DARK    = [15,  23,  42];
const INDIGO_BG = [238, 242, 255];
const AMBER_BG  = [255, 251, 235];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export function generateAssignmentPDF({
  selectedAssets,
  selectedUser,
  selectedDept,
  selectedDesig,
  form,
  assignedByName,
  newCIA,
}) {
  const doc    = new jsPDF('p', 'mm', 'a4');
  const W      = doc.internal.pageSize.getWidth();
  const H      = doc.internal.pageSize.getHeight();
  const M      = 16;
  const docId  = `AAC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const today  = fmt(new Date().toISOString());
  const half   = (W - M * 2 - 7) / 2;
  const rx     = M + half + 7;

  // ─── Resolve assignee ──────────────────────────────────────────────────────
  let aName = '—', aSub = '', aType = 'Employee';
  if (selectedUser) {
    aName = `${selectedUser.first_name} ${selectedUser.last_name}`;
    aSub  = selectedUser.email || '';
    aType = selectedDesig?.title || selectedUser.designation_name || 'Employee';
  } else if (selectedDept) {
    aName = selectedDept.name;
    aSub  = selectedDept.description || '';
    aType = 'Department';
  } else if (selectedDesig) {
    aName = selectedDesig.title;
    aSub  = selectedDesig.department_name || '';
    aType = 'Designation';
  }

  // ─── Footer helper ─────────────────────────────────────────────────────────
  const drawFooter = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(0, H - 12, 5, 12, 'F');
    doc.setTextColor(...SLATE4);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Doc No: ${docId}  ·  Issued: ${today}  ·  ${selectedAssets.length} Asset(s)`, M + 3, H - 4.5);
    doc.text('CONFIDENTIAL — Asset Management System', W - M, H - 4.5, { align: 'right' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────────

  // Dark base bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 52, 'F');

  // Left blue accent
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 5, 52, 'F');

  // Right darker block with subtle inner divider
  doc.setFillColor(...BLUE_D);
  doc.rect(W - 60, 0, 60, 52, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(W - 60, 0, 2.5, 52, 'F');

  // Title
  doc.setTextColor(...WHITE);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSET ASSIGNMENT', M + 9, 17);
  doc.setFontSize(13.5);
  doc.text('CERTIFICATE', M + 9, 27);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE4);
  doc.text('Official Asset Management Document', M + 9, 34.5);

  // Accent line below subtitle
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.7);
  doc.line(M + 9, 37.5, M + 95, 37.5);

  // Right block — meta
  doc.setTextColor(200, 215, 240);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT ID', W - M - 7, 12, { align: 'right' });
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(docId, W - M - 7, 19.5, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 215, 240);
  doc.text(`Issued: ${today}`, W - M - 7, 27.5, { align: 'right' });
  doc.text(`Assets: ${selectedAssets.length}`, W - M - 7, 33.5, { align: 'right' });

  // Confidential badge
  doc.setFillColor(37, 99, 235);
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

  const cardH = 33;

  // ── Assignee card ─────────────────────────────────────────────────────────
  doc.setFillColor(...SLATE1);
  doc.setDrawColor(...SLATE2);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, half, cardH, 2, 2, 'FD');
  // Blue left accent
  doc.setFillColor(...BLUE);
  doc.roundedRect(M, y, 3.5, cardH, 1, 1, 'F');
  doc.rect(M + 2, y, 1.5, cardH, 'F');

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSIGNED TO', M + 8, y + 8);
  doc.setTextColor(...DARK);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(aName, M + 8, y + 15.5, { maxWidth: half - 13 });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE5);
  if (aSub) doc.text(aSub, M + 8, y + 21.5, { maxWidth: half - 13 });

  // Type badge
  const badgeW = Math.min(aType.length * 2.4 + 9, 56);
  doc.setFillColor(...BLUE);
  doc.roundedRect(M + 8, y + 24.5, badgeW, 5.5, 1, 1, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(aType, M + 8 + badgeW / 2, y + 28, { align: 'center' });

  // ── Processed by card ─────────────────────────────────────────────────────
  doc.setFillColor(...SLATE1);
  doc.setDrawColor(...SLATE2);
  doc.roundedRect(rx, y, half, cardH, 2, 2, 'FD');
  // Emerald left accent
  doc.setFillColor(...EMRLD);
  doc.roundedRect(rx, y, 3.5, cardH, 1, 1, 'F');
  doc.rect(rx + 2, y, 1.5, cardH, 'F');

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCESSED BY', rx + 8, y + 8);
  doc.setTextColor(...DARK);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(assignedByName || 'System', rx + 8, y + 15.5, { maxWidth: half - 13 });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE5);
  doc.text(`Assigned on: ${today}`, rx + 8, y + 21.5);
  doc.text(`Total assets assigned: ${selectedAssets.length}`, rx + 8, y + 27);

  y += cardH + 13;

  // ─────────────────────────────────────────────────────────────────────────
  // ASSETS TABLE
  // ─────────────────────────────────────────────────────────────────────────

  doc.setTextColor(...SLATE5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSIGNED ASSETS', M, y);
  doc.setDrawColor(...SLATE2);
  doc.setLineWidth(0.2);
  doc.line(M + 42, y - 2, W - M, y - 2);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 18 },
    head: [['#', 'Asset No.', 'Asset Name', 'Category', 'Type', 'Condition', 'Return By']],
    body: selectedAssets.map((a, i) => [
      i + 1,
      a.asset_no   || `#${a.id}`,
      a.name       || a.asset_name || '—',
      a.category   || '—',
      a.asset_type || '—',
      form?.condition_out        || '—',
      form?.expected_return_date ? fmt(form.expected_return_date) : 'Open-ended',
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
  // CIA BOX (if provided)
  // ─────────────────────────────────────────────────────────────────────────
  if (newCIA) {
    if (y > H - 105) { doc.addPage(); y = 20; }

    const ciaH = 26;
    doc.setFillColor(...INDIGO_BG);
    doc.setDrawColor(165, 180, 252);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, W - M * 2, ciaH, 2, 2, 'FD');
    // Left accent
    doc.setFillColor(...INDIGO);
    doc.roundedRect(M, y, 3.5, ciaH, 1, 1, 'F');
    doc.rect(M + 2, y, 1.5, ciaH, 'F');

    doc.setTextColor(67, 56, 202);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CIA SECURITY LEVELS AUTO-APPLIED ON ASSIGNMENT', M + 9, y + 9);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Confidentiality: ${newCIA.confidentiality}   ·   Integrity: ${newCIA.integrity}   ·   Availability: ${newCIA.availability}   ·   Classification: ${newCIA.classification}`,
      M + 9, y + 18
    );

    y += ciaH + 12;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TERMS & ACKNOWLEDGMENT
  // ─────────────────────────────────────────────────────────────────────────
  if (y > H - 92) { doc.addPage(); y = 20; }

  const termsH = 42;
  doc.setFillColor(...AMBER_BG);
  doc.setDrawColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(M, y, W - M * 2, termsH, 2, 2, 'FD');
  doc.setFillColor(...AMBER);
  doc.roundedRect(M, y, 3.5, termsH, 1, 1, 'F');
  doc.rect(M + 2, y, 1.5, termsH, 'F');

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & ACKNOWLEDGMENT', M + 9, y + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  [
    '1.  The assignee acknowledges receipt of the above asset(s) in the stated condition.',
    '2.  The assignee agrees to return all assets by the expected return date without exception.',
    '3.  The assignee is responsible for the safe use and custody of all assigned assets.',
    '4.  Any damage, loss, or misuse must be reported immediately to the asset manager.',
  ].forEach((t, i) => doc.text(t, M + 9, y + 17.5 + i * 5.8, { maxWidth: W - M * 2 - 15 }));

  y += termsH + 14;

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
    [M,  aName,               'ASSIGNEE SIGNATURE', BLUE  ],
    [rx, assignedByName || 'System', 'AUTHORIZED BY',      EMRLD ],
  ].forEach(([x, name, label, accent]) => {
    doc.setFillColor(...SLATE1);
    doc.setDrawColor(...SLATE2);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, half, sigH, 2, 2, 'FD');

    // Colored top accent bar
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
