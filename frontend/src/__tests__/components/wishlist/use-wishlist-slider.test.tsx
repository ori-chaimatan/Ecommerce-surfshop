import { describe, expect, it } from 'vitest';
import { fitSlider } from '@/components/wishlist/use-wishlist-slider';

describe('fitSlider (wishlist AC6, design profile.html slider script)', () => {
  it('desktop: 240px cards, grid pinned to whole cards only', () => {
    expect(fitSlider(1000, false)).toEqual({ cardWidth: 240, gridWidth: 760 }); // 3 × 240 + 2 × 20
    expect(fitSlider(780, false)).toEqual({ cardWidth: 240, gridWidth: 760 });
    expect(fitSlider(759, false)).toEqual({ cardWidth: 240, gridWidth: 500 });
  });

  it('never goes below one card, and never wider than the space', () => {
    expect(fitSlider(200, false)).toEqual({ cardWidth: 240, gridWidth: 200 });
  });

  it('mobile (≤640px): one full-width card per screen', () => {
    expect(fitSlider(343, true)).toEqual({ cardWidth: 343, gridWidth: 343 });
  });

  it('nothing measured yet: no pinning', () => {
    expect(fitSlider(0, false)).toEqual({ cardWidth: 240, gridWidth: null });
  });
});
