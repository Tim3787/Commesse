import React, { useRef } from 'react';
import useAutoScroll from './useAutoScroll';
import './AutoScrollOverlay.css';

export default function AutoScrollWrapper({
  children,
  isDragging,
  threshold = 300,
  maxSpeed = 20,
}) {
  const containerRef = useRef(null);

  useAutoScroll(containerRef, isDragging, maxSpeed, threshold);

  return (
    <div
      ref={containerRef}
      className="auto-scroll-container"
      style={{ overflow: 'auto', position: 'relative' }}
    >
      {/* Zone visive opzionali */}
      <div className="scroll-zone top-zone" style={{ height: `${threshold}px` }} />
      <div className="scroll-zone bottom-zone" style={{ height: `${threshold}px` }} />
      <div className="scroll-zone left-zone" style={{ width: `${threshold}px` }} />
      <div className="scroll-zone right-zone" style={{ width: `${threshold}px` }} />
      {children}
    </div>
  );
}
