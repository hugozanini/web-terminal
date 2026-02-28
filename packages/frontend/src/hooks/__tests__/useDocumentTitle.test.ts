import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from '../useDocumentTitle';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document.title to "<title> - Happy Coffee"', () => {
    renderHook(() => useDocumentTitle('Datasets'));
    expect(document.title).toBe('Datasets - Happy Coffee');
  });

  it('restores the previous title on unmount', () => {
    document.title = 'Original';
    const { unmount } = renderHook(() => useDocumentTitle('Test'));
    expect(document.title).toBe('Test - Happy Coffee');
    unmount();
    expect(document.title).toBe('Original');
  });

  it('updates title when the argument changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'First' },
    });
    expect(document.title).toBe('First - Happy Coffee');
    rerender({ title: 'Second' });
    expect(document.title).toBe('Second - Happy Coffee');
  });
});
