// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createSpotlightTour } from '../src/ui/components/spotlight-tour';

describe('Interactive UI Spotlight Tour', () => {
  it('should render spotlight overlay with 5 steps and guidance content', () => {
    let closed = false;
    let presetLaunched = false;

    const tour = createSpotlightTour(
      () => { closed = true; },
      () => { presetLaunched = true; }
    );

    document.body.appendChild(tour);

    expect(tour.classList.contains('spotlight-tour-overlay')).toBe(true);
    expect(tour.querySelectorAll('.tour-step-dot').length).toBe(5);

    // Verify pattern applicability notice is present in step 2
    const nextBtn = tour.querySelector('#btn-spotlight-next') as HTMLButtonElement;
    expect(nextBtn).not.toBeNull();
    nextBtn.click(); // Advance to step 2

    expect(tour.innerHTML).toContain('Not every URI needs to conform');

    // Verify launch preset button
    const presetBtn = tour.querySelector('#btn-spotlight-preset') as HTMLButtonElement;
    expect(presetBtn).not.toBeNull();
    presetBtn.click();
    expect(presetLaunched).toBe(true);

    // Verify close
    const closeBtn = tour.querySelector('#btn-spotlight-close') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();
    expect(closed).toBe(true);

    tour.remove();
  });
});
