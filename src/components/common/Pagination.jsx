export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-brand-cream/60 bg-white">

      {/* Info */}
      <p className="text-sm text-brand-dark/40">
        Page <span className="font-semibold text-brand-dark">{currentPage}</span> of{' '}
        <span className="font-semibold text-brand-dark">{totalPages}</span>
      </p>

      {/* Buttons */}
      <div className="flex items-center gap-1">

        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                     text-brand-dark/50 hover:bg-brand-cream/40 disabled:opacity-30
                     disabled:cursor-not-allowed transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        {/* Page numbers */}
        {pages.map(page => {
          const show =
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1;

          const showDotsBefore = page === currentPage - 2 && currentPage > 3;
          const showDotsAfter  = page === currentPage + 2 && currentPage < totalPages - 2;

          if (showDotsBefore || showDotsAfter) {
            return (
              <span key={page} className="px-2 text-brand-dark/20 text-sm select-none">
                •••
              </span>
            );
          }

          if (!show) return null;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors duration-150
                ${currentPage === page
                  ? 'bg-brand-green text-brand-cream-light shadow-sm'
                  : 'text-brand-dark/50 hover:bg-brand-cream/40'
                }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                     text-brand-dark/50 hover:bg-brand-cream/40 disabled:opacity-30
                     disabled:cursor-not-allowed transition-colors duration-150"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  );
}
