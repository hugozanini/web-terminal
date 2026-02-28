import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TagPill, getTagVariant, getDatasetTypeVariant } from '../TagPill';

describe('TagPill', () => {
  it('renders label text', () => {
    render(<TagPill label="production" />);
    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    render(<TagPill label="test" variant="green" />);
    const el = screen.getByText('test');
    expect(el.className).toContain('emerald');
  });

  it('defaults to gray variant', () => {
    render(<TagPill label="unknown" />);
    const el = screen.getByText('unknown');
    expect(el.className).toContain('cream');
  });
});

describe('getTagVariant', () => {
  it('returns correct variant for known tags', () => {
    expect(getTagVariant('production')).toBe('green');
    expect(getTagVariant('staging')).toBe('amber');
    expect(getTagVariant('pii')).toBe('red');
    expect(getTagVariant('sla-critical')).toBe('purple');
    expect(getTagVariant('certified')).toBe('teal');
    expect(getTagVariant('deprecated')).toBe('gray');
    expect(getTagVariant('experimental')).toBe('blue');
    expect(getTagVariant('core')).toBe('green');
  });

  it('returns gray for unknown tags', () => {
    expect(getTagVariant('randomtag')).toBe('gray');
  });
});

describe('getDatasetTypeVariant', () => {
  it('returns correct variant for known types', () => {
    expect(getDatasetTypeVariant('Table')).toBe('blue');
    expect(getDatasetTypeVariant('View')).toBe('purple');
    expect(getDatasetTypeVariant('Materialized View')).toBe('teal');
    expect(getDatasetTypeVariant('External Table')).toBe('amber');
  });

  it('returns gray for unknown types', () => {
    expect(getDatasetTypeVariant('Other')).toBe('gray');
  });
});
