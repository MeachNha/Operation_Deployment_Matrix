import React, { useEffect, useId, useRef, useState } from 'react';

export const TableHorizontalScroll = ({ children, style }) => {
  const viewportRef = useRef(null);
  const topScrollbarRef = useRef(null);
  const viewportId = useId();
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const updateDimensions = () => {
      const nextContentWidth = viewport.scrollWidth;
      const nextViewportWidth = viewport.clientWidth;
      setContentWidth((currentWidth) =>
        currentWidth === nextContentWidth ? currentWidth : nextContentWidth
      );
      setViewportWidth((currentWidth) =>
        currentWidth === nextViewportWidth ? currentWidth : nextViewportWidth
      );
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(viewport);
    viewport.querySelectorAll('table').forEach((table) => {
      resizeObserver.observe(table);
    });
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const syncToViewport = (nextPosition) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    const boundedPosition = Math.min(Math.max(nextPosition, 0), maxScrollLeft);
    if (viewport.scrollLeft !== boundedPosition) {
      viewport.scrollLeft = boundedPosition;
    }
    setScrollLeft((currentPosition) =>
      currentPosition === boundedPosition ? currentPosition : boundedPosition
    );
  };

  const syncToScrollbar = (nextPosition) => {
    const topScrollbar = topScrollbarRef.current;
    if (topScrollbar && topScrollbar.scrollLeft !== nextPosition) {
      topScrollbar.scrollLeft = nextPosition;
    }
    setScrollLeft((currentPosition) =>
      currentPosition === nextPosition ? currentPosition : nextPosition
    );
  };

  const handleScrollbarKeyDown = (event) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let nextPosition;
    if (event.key === 'ArrowLeft') nextPosition = viewport.scrollLeft - 240;
    if (event.key === 'ArrowRight') nextPosition = viewport.scrollLeft + 240;
    if (event.key === 'Home') nextPosition = 0;
    if (event.key === 'End') nextPosition = viewport.scrollWidth;
    if (nextPosition === undefined) return;

    event.preventDefault();
    syncToViewport(nextPosition);
  };

  return (
    <div className="dashboard-table-shell" style={style}>
      {contentWidth > viewportWidth + 1 && (
        <div
          ref={topScrollbarRef}
          className="dashboard-table-top-scroll"
          role="scrollbar"
          aria-label="Scroll table horizontally"
          aria-controls={viewportId}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={contentWidth}
          aria-valuenow={scrollLeft}
          tabIndex={0}
          onScroll={(event) => syncToViewport(event.currentTarget.scrollLeft)}
          onKeyDown={handleScrollbarKeyDown}
        >
          <div style={{ width: contentWidth, height: 1 }} />
        </div>
      )}
      <div
        id={viewportId}
        ref={viewportRef}
        className="table-container dashboard-table-viewport"
        style={{ position: 'relative' }}
        onScroll={(event) => syncToScrollbar(event.currentTarget.scrollLeft)}
      >
        {children}
      </div>
    </div>
  );
};
