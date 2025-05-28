import { useEffect, useRef } from "react";

export default function useAutoScroll(containerRef, isDragging, maxSpeed = 20, threshold = 300) {
  const animationRef = useRef(null);
  const isDraggingRef = useRef(false);
  const speedXRef = useRef(0);
  const speedYRef = useRef(0);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) {
        speedXRef.current = 0;
        speedYRef.current = 0;
        return;
      }

      const rect = container.getBoundingClientRect();
      const { clientX, clientY } = e;

      const distanceTop = clientY - rect.top;
      const distanceBottom = rect.bottom - clientY;
      const distanceLeft = clientX - rect.left;
      const distanceRight = rect.right - clientX;

      // Scroll verticale
      if (distanceTop >= 0 && distanceTop <= threshold) {
        speedYRef.current = -Math.round(((threshold - distanceTop) / threshold) * maxSpeed);
      } else if (distanceBottom >= 0 && distanceBottom <= threshold) {
        speedYRef.current = Math.round(((threshold - distanceBottom) / threshold) * maxSpeed);
      } else {
        speedYRef.current = 0;
      }

      // Scroll orizzontale
      if (distanceLeft >= 0 && distanceLeft <= threshold) {
        speedXRef.current = -Math.round(((threshold - distanceLeft) / threshold) * maxSpeed);
      } else if (distanceRight >= 0 && distanceRight <= threshold) {
        speedXRef.current = Math.round(((threshold - distanceRight) / threshold) * maxSpeed);
      } else {
        speedXRef.current = 0;
      }

      console.log("mousemove con drag attivo:", {
        speedX: speedXRef.current,
        speedY: speedYRef.current,
      });
    };

    const scroll = () => {
      if (speedXRef.current !== 0 || speedYRef.current !== 0) {
        container.scrollBy({
          top: speedYRef.current,
          left: speedXRef.current,
        });
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    document.addEventListener("mousemove", handleMouseMove);
    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [containerRef, maxSpeed, threshold]); // NOTA: non includere `isDragging`
}
