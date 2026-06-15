import { useState, useMemo } from 'react';

const ROWS_PER_PAGE = 10;

export default function usePagination(data = []) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);


  const reset = () => setCurrentPage(1);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  }, [data, currentPage]);

  return {
    paginated,      
    currentPage,
    totalPages,
    setCurrentPage,
    reset,
    totalItems: data.length,
    rowsPerPage: ROWS_PER_PAGE,
    startIndex: (currentPage - 1) * ROWS_PER_PAGE + 1,
    endIndex: Math.min(currentPage * ROWS_PER_PAGE, data.length),
  };
}
