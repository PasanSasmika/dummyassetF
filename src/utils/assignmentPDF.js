import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BLUE   = [37,  99,  235];
const DARK   = [15,  23,  42];
const GRAY   = [100, 116, 139];
const LIGHT  = [248, 250, 252];
const INDIGO = [238, 242, 255];
const AMBER  = [255, 251, 235];

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

export function generateAssignmentPDF({
  selectedAssets,   // Asset[]
  selectedUser,
  selectedDept,
  selectedDesig,
  form,             // { expected_return_date, condition_out }
  assignedByName,
  newCIA,
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W   = doc.internal.pageSize.getWidth();
  const H   = doc.internal.pageSize.getHeight();
  const M   = 18;

  const docId   = `AAC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const dateStr = fmt(new Date().toISOString());

  // ── HEADER BAR ──────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSET ASSIGNMENT CERTIFICATE', M, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document No: ${docId}`, M, 22);
  doc.text(`Issue Date: ${dateStr}`, W - M, 22, { align: 'right' });
  doc.text(`Total Assets: ${selectedAssets.length}`, W - M, 28, { align: 'right' });

  // ── ASSIGNEE + PROCESSED BY ────────────────────────────
  let y = 44;

  // Labels
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSIGNED TO', M, y);
  doc.text('PROCESSED BY', W / 2 + 8, y);

  y += 2;

  const boxH  = 32;
  const half  = W / 2 - M - 6;

  doc.setFillColor(...LIGHT);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(M, y, half, boxH, 2, 2, 'FD');
  doc.roundedRect(W / 2 + 8, y, half, boxH, 2, 2, 'FD');

  // Assignee
  let aName = '—', aSub = '', aType = '';
  if (selectedUser) {
    aName = `${selectedUser.first_name} ${selectedUser.last_name}`;
    aSub  = selectedUser.email || '';
    aType = selectedDesig?.title || selectedUser.designation_name || 'Employee';
  } else if (selectedDept) {
    aName = selectedDept.name;
    aSub  = selectedDept.description || 'Department';
    aType = 'Department';
  } else if (selectedDesig) {
    aName = selectedDesig.title;
    aSub  = selectedDesig.department_name || 'Designation';
    aType = 'Designation';
  }

  doc.setTextColor(...DARK);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(aName, M + 4, y + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  if (aSub) doc.text(aSub, M + 4, y + 16, { maxWidth: half - 8 });

  // Type pill
  doc.setFillColor(...BLUE);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.roundedRect(M + 4, y + 23, 25, 5, 1, 1, 'F');
  doc.text(aType, M + 16.5, y + 26.5, { align: 'center' });

  // Processed by
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(assignedByName || 'System', W / 2 + 12, y + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Assigned on: ${dateStr}`, W / 2 + 12, y + 16);
  doc.text(`Assets assigned: ${selectedAssets.length}`, W / 2 + 12, y + 22);

  y += boxH + 10;

  // ── ASSETS TABLE ────────────────────────────────────────
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSIGNED ASSETS', M, y);

  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Asset No.', 'Asset Name', 'Category', 'Type', 'Condition', 'Return By']],
    body: selectedAssets.map((a, i) => [
      i + 1,
      a.asset_no  || `#${a.id}`,
      a.name      || a.asset_name || '—',
      a.category  || '—',
      a.asset_type || '—',
      form?.condition_out        || '—',
      form?.expected_return_date ? fmt(form.expected_return_date) : 'Open-ended',
    ]),
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    headStyles: {
      fillColor: BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
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

  // ── CIA BOX (if updated) ─────────────────────────────────
  if (newCIA) {
    if (y > H - 90) { doc.addPage(); y = 20; }

    doc.setFillColor(...INDIGO);
    doc.setDrawColor(165, 180, 252);
    doc.roundedRect(M, y, W - M * 2, 22, 2, 2, 'FD');

    doc.setTextColor(67, 56, 202);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CIA LEVELS AUTO-APPLIED', M + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Confidentiality: ${newCIA.confidentiality}   ·   Integrity: ${newCIA.integrity}   ·   Availability: ${newCIA.availability}   ·   Classification: ${newCIA.classification}`,
      M + 4, y + 15
    );

    y += 30;
  }

  // ── TERMS ────────────────────────────────────────────────
  if (y > H - 80) { doc.addPage(); y = 20; }

  doc.setFillColor(...AMBER);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(M, y, W - M * 2, 32, 2, 2, 'FD');

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & ACKNOWLEDGMENT', M + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  [
    '1. The assignee acknowledges receipt of the above asset(s) in the stated condition.',
    '2. The assignee agrees to return all assets by the expected return date.',
    '3. The assignee is responsible for the safe use and custody of all assigned assets.',
    '4. Any damage, loss, or misuse must be reported immediately to the asset manager.',
  ].forEach((t, i) => {
    doc.text(t, M + 4, y + 14 + i * 5, { maxWidth: W - M * 2 - 8 });
  });

  y += 40;

  // ── SIGNATURES ──────────────────────────────────────────
  if (y > H - 45) { doc.addPage(); y = 20; }

  const sigW = W / 2 - M - 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  [[M, aName, 'Assignee Signature'], [W / 2 + 8, assignedByName || '', 'Authorized By']]
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

  // ── FOOTER ──────────────────────────────────────────────
  const fY = H - 10;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.4);
  doc.line(M, fY - 5, W - M, fY - 5);
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.text(`Doc: ${docId}  ·  ${dateStr}  ·  ${selectedAssets.length} asset(s)`, M, fY);
  doc.text('CONFIDENTIAL — For official use only', W - M, fY, { align: 'right' });

  return { doc, docId };
}
