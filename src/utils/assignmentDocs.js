const KEY = 'asset_assignment_docs';
const MAX = 30;

export function saveAssignmentDoc({ docId, assigneeName, assetCount, assetNames, date, dataUrl }) {
  try {
    const docs = getAssignmentDocs();
    const entry = { docId, assigneeName, assetCount, assetNames, date, dataUrl };
    localStorage.setItem(KEY, JSON.stringify([entry, ...docs].slice(0, MAX)));
    return true;
  } catch (e) {
    console.warn('Could not save assignment doc to localStorage:', e);
    return false;
  }
}

export function getAssignmentDocs() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function downloadAssignmentDoc(dataUrl, docId) {
  const a = document.createElement('a');
  a.href     = dataUrl;
  a.download = `Assignment-${docId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
