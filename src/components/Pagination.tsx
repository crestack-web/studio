'use client';

import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  showPageNumbers?: boolean;
  maxPageButtons?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  showPageNumbers = true,
  maxPageButtons = 5,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={styles.pagination}>
      {totalItems && itemsPerPage && (
        <div className={styles.info}>
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
      )}

      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.navButton}`}
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>

        {showPageNumbers && (
          <div className={styles.pageNumbers}>
            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={index}
                  className={`${styles.button} ${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className={styles.ellipsis}>
                  {page}
                </span>
              )
            ))}
          </div>
        )}

        <button
          className={`${styles.button} ${styles.navButton}`}
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
