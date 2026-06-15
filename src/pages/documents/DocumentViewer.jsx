import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiArrowLeft, FiDownload, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';
import { HiOutlineDocument, HiOutlinePhotograph } from 'react-icons/hi';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function DocumentViewer() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const [errored, setErrored] = useState(false);

  const filePath = params.get('path') || '';
  const docName  = params.get('name') || 'Document';
  const docType  = params.get('type') || 'pdf';
  const backTo   = params.get('back') || '-1';

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
    <div className="min-h-screen bg-green-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-green-100 px-6 py-3 flex items-center justify-between gap-4 flex-wrap shadow-sm">

        {/* Left: back + file info */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 text-green-800 text-sm font-semibold hover:bg-green-50 transition shrink-0"
          >
            <FiArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              {isImage
                ? <HiOutlinePhotograph className="text-green-700" size={18} />
                : <HiOutlineDocument   className="text-green-700" size={18} />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate leading-tight">{docName}</p>
              <p className="text-[11px] text-gray-400 leading-tight">
                {isImage ? 'Image' : 'PDF Document'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 text-green-800 text-sm font-semibold hover:bg-green-50 transition"
          >
            <FiExternalLink size={13} /> Open tab
          </a>
          <a
            href={fileUrl}
            download={docName}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition"
          >
            <FiDownload size={13} /> Download
          </a>
        </div>
      </div>

      {/* ── Viewer area ── */}
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden" style={{ minHeight: '82vh' }}>

          {!filePath ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <FiAlertTriangle className="text-green-400" size={26} />
              </div>
              <p className="text-sm font-semibold text-gray-500">No document path provided.</p>
            </div>

          ) : errored ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <HiOutlineDocument className="text-green-300" size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-600">Could not load the document</p>
                <p className="text-xs text-gray-400 mt-1">The file may have moved or is unavailable.</p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition"
              >
                <FiExternalLink size={13} /> Try opening directly
              </a>
            </div>

          ) : isImage ? (
            <div className="flex items-center justify-center p-8 bg-green-50/40 min-h-[82vh]">
              <img
                src={fileUrl}
                alt={docName}
                onError={() => setErrored(true)}
                className="max-w-full max-h-[78vh] rounded-xl shadow-md object-contain"
              />
            </div>

          ) : (
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full"
              style={{ height: '82vh' }}
              onError={() => setErrored(true)}
            >
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
      </div>

    </div>
  );
}
