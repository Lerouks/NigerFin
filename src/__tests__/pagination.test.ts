import { describe, it, expect } from 'vitest';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

describe('parsePagination', () => {
  it('returns defaults when no params provided', () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('parses page and limit correctly', () => {
    const params = new URLSearchParams({ page: '3', limit: '50' });
    const result = parsePagination(params);
    expect(result).toEqual({ page: 3, limit: 50, offset: 100 });
  });

  it('clamps limit to max 100', () => {
    const params = new URLSearchParams({ limit: '500' });
    const result = parsePagination(params);
    expect(result.limit).toBe(100);
  });

  it('clamps page to min 1', () => {
    const params = new URLSearchParams({ page: '-5' });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('handles non-numeric values gracefully', () => {
    const params = new URLSearchParams({ page: 'abc', limit: 'xyz' });
    const result = parsePagination(params);
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('handles zero page', () => {
    const params = new URLSearchParams({ page: '0' });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
  });
});

describe('paginatedResponse', () => {
  it('builds correct response for first page', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginatedResponse(data, 50, { page: 1, limit: 20, offset: 0 });

    expect(result.data).toEqual(data);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
      hasMore: true,
    });
  });

  it('builds correct response for last page', () => {
    const data = [{ id: 41 }];
    const result = paginatedResponse(data, 41, { page: 3, limit: 20, offset: 40 });

    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('handles empty data', () => {
    const result = paginatedResponse([], 0, { page: 1, limit: 20, offset: 0 });

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });
});
