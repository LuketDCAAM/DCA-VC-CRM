
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageSize } from '@/hooks/deals/useDealsPagination';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const startItem = pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    if (totalPages <= 1) return [];
    
    const delta = 2;
    const range = [];
    
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }

    return range;
  };

  if (pageSize === 'all') {
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Showing all {totalItems} deals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(value as PageSize)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">per page</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalItems} deals
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(value as PageSize)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">per page</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {getVisiblePages().map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
