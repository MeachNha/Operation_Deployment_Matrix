import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Horizontally scrollable container with:
 *  - click + drag to scroll (mouse & touch)
 *  - ← / → arrow keys (when focused or hovered)
 *  - Shift + wheel to scroll horizontally
 *  - floating ‹ › buttons that appear when overflow exists
 */
export const HScroll = ({ children, className, style }) => {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [dragging, setDragging] = useState(false);

  // drag state (kept in ref so mousemove doesn't trigger re-renders)
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // ─── Recompute scroll-button visibility ────────────
  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);

  // ─── Arrow-key scrolling ───────────────────────────
  const scrollByAmount = (delta) => {
    ref.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollByAmount(-240); }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByAmount(240); }
    if (e.key === 'Home')       { e.preventDefault(); ref.current?.scrollTo({ left: 0, behavior: 'smooth' }); }
    if (e.key === 'End') {
      e.preventDefault();
      const el = ref.current;
      el?.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
  };

  // ─── Drag-to-scroll (mouse + touch) ────────────────
  const onPointerDown = (e) => {
    // Don't hijack clicks on interactive elements inside the table
    if (e.target.closest('button, a, input, select, textarea')) return;

    const el = ref.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    setDragging(true);
    el.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    ref.current.scrollLeft = d.startScroll - dx;
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
    ref.current?.releasePointerCapture?.(e.pointerId);

    // Suppress the click that follows a drag so row links/cells don't fire
    if (d.moved) {
      const suppress = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', suppress, { capture: true, once: true });
    }
  };

  // ─── Shift + wheel → horizontal ────────────────────
  const onWheel = (e) => {
    const el = ref.current;
    if (!el) return;
    if (e.shiftKey && e.deltaY !== 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      className={`h-scroll-wrap ${dragging ? 'is-dragging' : ''} ${className || ''}`}
      style={{ position: 'relative', ...style }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={(e) => { if (drag.current.active) onPointerUp(e); }}
      onWheel={onWheel}
    >
      <div ref={ref} className="h-scroll-viewport">
        {children}
      </div>

      {canLeft && (
        <button
          type="button"
          className="h-scroll-btn h-scroll-btn-left"
          onClick={() => scrollByAmount(-360)}
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}
      {canRight && (
        <button
          type="button"
          className="h-scroll-btn h-scroll-btn-right"
          onClick={() => scrollByAmount(360)}
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  );
};