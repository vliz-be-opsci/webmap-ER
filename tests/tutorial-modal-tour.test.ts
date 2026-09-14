// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createTutorialModal } from '../src/ui/components/tutorial-modal';

describe('Interactive 5-Step Guided Tour Modal', () => {
  it('should render step dots and jumpstart preset launch button', () => {
    let presetLaunched = false;
    const modal = createTutorialModal(() => {}, () => { presetLaunched = true; });

    expect(modal.querySelectorAll('.tour-step-dot').length).toBe(5);
    const jumpstartBtn = modal.querySelector('#btn-launch-preset') as HTMLButtonElement;
    expect(jumpstartBtn).not.toBeNull();
    jumpstartBtn.click();
    expect(presetLaunched).toBe(true);
  });
});
