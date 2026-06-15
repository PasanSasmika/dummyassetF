// pages/documents/DocumentViewer.jsx
// ─────────────────────────────────────────────────────────
// Opens a document (PDF / image) served from the backend in
// a full-page viewer. Reached via:
//   /documents/view?path=<encoded_file_path>&name=<doc_name>&type=pdf|image
// ─────────────────────────────────────────────────────────
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { FiArrowLeft, FiDownload, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import { TbFileText } from 'react-icons/tb';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function DocumentViewer() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const [errored, setErrored] = useState(false);

  const filePath   = params.get('path')  || '';
  const docName    = params.get('name')  || 'Document';
  const docType    = params.get('type')  || 'pdf';   // 'pdf' | 'image'
  const backTo     = params.get('back')  || '-1';    // URL or '-1' for history back

  // Build the public URL — assumes your express serves uploads as static
  // e.g.  app.use('/uploads', express.static('uploads'))
  // filePath stored as  "uploads/assign-docs/12/assign-doc-12-1234.pdf"
  const fileUrl = filePath.startsWith('http')
    ? filePath
    : `${BASE_URL}/${filePath.replace(/^\//, '')}`;

  const isImage = docType === 'image' ||
    /\.(png|jpg|jpeg|gif|webp)$/i.test(filePath);

  const handleBack = () => {
    if (backTo === '-1') navigate(-1);
    else navigate(backTo);
  };

  return (
    <MainLayout title="Document Viewer" subtitle={docName}>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border
            border-slate-200 text-sm font-semibold text-slate-600
            hover:bg-slate-50 transition">
          <FiArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          {/* Open in new tab */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border
              border-slate-200 text-sm font-semibold text-slate-600
              hover:bg-slate-50 transition">
            <FiExternalLink size={14} /> Open in new tab
          </a>

          {/* Download */}
          <a
            href={fileUrl}
            download={docName}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white text-sm
              font-semibold transition">
            <FiDownload size={14} /> Download
          </a>
        </div>
      </div>

      {/* ── Viewer ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm
        overflow-hidden" style={{ minHeight: '80vh' }}>

        {!filePath ? (
          <div className="flex flex-col items-center justify-center h-96">
            <FiAlertCircle size={40} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No document path provided.</p>
          </div>
        ) : errored ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <TbFileText size={48} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">
              Could not load the document.
            </p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
              <FiExternalLink size={14} /> Try opening directly
            </a>
          </div>
        ) : isImage ? (
          <div className="flex items-center justify-center p-6 bg-slate-50 min-h-96">
            <img
              src={fileUrl}
              alt={docName}
              onError={() => setErrored(true)}
              className="max-w-full max-h-[75vh] rounded-xl shadow-lg object-contain"
            />
          </div>
        ) : (
          /* PDF — use native browser <object> for best compatibility */
          <object
            data={fileUrl}
            type="application/pdf"
            className="w-full"
            style={{ height: '82vh' }}
            onError={() => setErrored(true)}
          >
            {/* Fallback iframe if <object> is not supported */}
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1`}
              title={docName}
              className="w-full"
              style={{ height: '82vh', border: 'none' }}
              onError={() => setErrored(true)}
            />
          </object>
        )}
      </div>
    </MainLayout>
  );
}
