import { describe, expect, it } from 'vitest';
import { formatPrice, sizeLabel } from '../../src/api/order/format';

// Mirrors frontend formatBoardSize / formatStandardSize / formatPrice (frontend/src/__tests__/lib/strapi/sizes.test.ts).
describe('sizeLabel (AC1, AC16)', () => {
  it.each([
    [{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4 }, `6'0" · 29.4L`],
    [{ LengthFt: 5, LengthInches: 10, VolumeL: 27.6 }, `5'10" · 27.6L`],
    [{ LengthFt: 9, LengthInches: 11, VolumeL: 82 }, `9'11" · 82L`],
    [{ LengthFt: 7, LengthInches: 6, VolumeL: 44 }, `7'6" · 44L`],
    [{ LengthFt: '6', LengthInches: '2', VolumeL: '31.0' }, `6'2" · 31L`],
  ])('labels board %j as %s', (size, label) => expect(sizeLabel(size as never)).toBe(label));

  it('shows a standard size as-is and OneSize as "One Size"', () => {
    expect(sizeLabel({ Size: 'M' })).toBe('M');
    expect(sizeLabel({ Size: 'XL' })).toBe('XL');
    expect(sizeLabel({ Size: 'OneSize' })).toBe('One Size');
  });
});

describe('formatPrice (AC16)', () => {
  it('drops cents on whole dollars and keeps two decimals otherwise', () => {
    expect(formatPrice(829)).toBe('$829');
    expect(formatPrice(12.5)).toBe('$12.50');
    expect(formatPrice(0)).toBe('$0');
    expect(formatPrice(1234)).toBe('$1,234');
  });
});
