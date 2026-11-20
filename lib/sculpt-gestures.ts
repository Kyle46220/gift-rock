export type RockMode = 'orbit' | 'push' | 'pull';

export function modeForTab(tab: string, previous: RockMode): RockMode {
  return tab === 'sculpt' ? (previous === 'pull' ? 'pull' : 'push') : 'orbit';
}

// Run these listeners in the host's capture phase, before OrbitControls sees
// events on the canvas. Only the finger that began a brush stroke can paint.
export function sculptGestureHandlers(
  canvas: Pick<HTMLElement, 'setPointerCapture' | 'hasPointerCapture' | 'releasePointerCapture'>,
  getMode: () => RockMode,
  dab: (event: PointerEvent) => void,
) {
  let pointer: number | null = null;
  const consume = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const release = () => {
    const id = pointer;
    pointer = null;
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  };
  return {
    start(event: PointerEvent) {
      if (getMode() === 'orbit') { release(); return; }
      consume(event);
      if (pointer !== null || !event.isPrimary || event.button !== 0) return;
      pointer = event.pointerId;
      canvas.setPointerCapture(pointer);
      dab(event);
    },
    move(event: PointerEvent) {
      if (getMode() === 'orbit') { release(); return; }
      consume(event);
      if (event.pointerId === pointer) dab(event);
    },
    end(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      consume(event);
      release();
    },
    release,
  };
}
