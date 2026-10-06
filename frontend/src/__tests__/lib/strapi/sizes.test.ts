// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { boardLengthInches, formatBoardSize, formatStandardSize } from '@/lib/strapi/sizes';

describe('formatBoardSize', () => {
  it('builds feet/inches and litres from LengthFt/LengthInches/VolumeL (AC5)', () => {
    expect(formatBoardSize({ LengthFt: 6, LengthInches: 0, VolumeL: 29.4 })).toBe(`6'0" · 29.4L`);
  });

  it('shows inches under a foot as stored (AC5)', () => {
    expect(formatBoardSize({ LengthFt: 5, LengthInches: 10, VolumeL: 27.6 })).toBe(`5'10" · 27.6L`);
    expect(formatBoardSize({ LengthFt: 9, LengthInches: 11, VolumeL: 82 })).toBe(`9'11" · 82L`);
  });

  it('drops trailing zeros on whole volumes (AC5)', () => {
    expect(formatBoardSize({ LengthFt: 7, LengthInches: 6, VolumeL: 44 })).toBe(`7'6" · 44L`);
  });

  it('accepts numeric strings, as Strapi may send decimals (AC5)', () => {
    expect(formatBoardSize({ LengthFt: '6' as unknown as number, LengthInches: '2' as unknown as number, VolumeL: '31.0' as unknown as number })).toBe(`6'2" · 31L`);
  });
});

describe('boardLengthInches', () => {
  it.each([
    [6, 0, 72],
    [5, 10, 70],
    [9, 11, 119],
    [4, 0, 48],
    [12, 11, 155],
  ])('%s\'%s" is %s inches', (ft, inches, total) => {
    expect(boardLengthInches({ LengthFt: ft, LengthInches: inches })).toBe(total);
  });

  it('orders 5\'11" before 6\'0" (inches never outweigh a foot)', () => {
    expect(boardLengthInches({ LengthFt: 5, LengthInches: 11 })).toBeLessThan(boardLengthInches({ LengthFt: 6, LengthInches: 0 }));
  });
});

describe('formatStandardSize', () => {
  it('shows the enum value as-is (AC5)', () => {
    expect(formatStandardSize('M')).toBe('M');
    expect(formatStandardSize('XL')).toBe('XL');
  });

  it('spells OneSize as "One Size" (AC5)', () => {
    expect(formatStandardSize('OneSize')).toBe('One Size');
  });
});
