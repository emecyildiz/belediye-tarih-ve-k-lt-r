import { useRef } from 'react';

export default function useDragScroll(axis = 'x') {
  const ref = useRef(null);
  const gesture = useRef({ active: false, dragged: false, pointerId: null, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  const endGesture = (event) => {
    const element = ref.current;
    if (!element || !gesture.current.active) return;
    if (element.hasPointerCapture?.(gesture.current.pointerId)) element.releasePointerCapture(gesture.current.pointerId);
    gesture.current.active = false;
    element.classList.remove('is-dragging');
    if (event?.type === 'pointercancel') gesture.current.dragged = false;
  };

  return {
    ref,
    dragProps: {
      onPointerDown: (event) => {
        if (event.pointerType === 'touch' || event.button !== 0) return;
        const element = ref.current;
        if (!element || event.target.closest('button, input, select, textarea')) return;
        gesture.current = {
          active: true,
          dragged: false,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          scrollLeft: element.scrollLeft,
          scrollTop: element.scrollTop,
        };
        element.setPointerCapture?.(event.pointerId);
        element.classList.add('is-dragging');
      },
      onPointerMove: (event) => {
        if (!gesture.current.active || gesture.current.pointerId !== event.pointerId) return;
        const element = ref.current;
        if (!element) return;
        const deltaX = event.clientX - gesture.current.startX;
        const deltaY = event.clientY - gesture.current.startY;
        if (Math.abs(axis === 'x' ? deltaX : deltaY) > 5) gesture.current.dragged = true;
        if (!gesture.current.dragged) return;
        event.preventDefault();
        if (axis === 'x') element.scrollLeft = gesture.current.scrollLeft - deltaX;
        else element.scrollTop = gesture.current.scrollTop - deltaY;
      },
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
      onClickCapture: (event) => {
        if (!gesture.current.dragged) return;
        event.preventDefault();
        event.stopPropagation();
        gesture.current.dragged = false;
      },
      onDragStart: (event) => event.preventDefault(),
    },
  };
}
