import React, { useCallback, useEffect, useRef, useState } from "react";
import { NodeResizer, useReactFlow } from "reactflow";

const hasCoarsePrimaryPointer = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

export default function NodeResizeControls({
  id,
  data,
  width,
  height,
  minWidth,
  minHeight,
  keepAspectRatio = false,
  heightFromWidth
}) {
  const rf = useReactFlow();
  const [coarse] = useState(hasCoarsePrimaryPointer);
  const dataRef = useRef(data);
  dataRef.current = data;
  const drag = useRef(null);
  const latest = useRef(null);
  const frame = useRef(0);

  const flush = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    if (latest.current) {
      dataRef.current.onResize?.(id, latest.current);
      latest.current = null;
    }
  }, [id]);

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
  }, []);

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width,
      height,
      zoom: rf.getViewport().zoom || 1
    };
    dataRef.current.onResizeStart?.();
  };

  const onPointerMove = (event) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dx = (event.clientX - start.x) / start.zoom;
    const dy = (event.clientY - start.y) / start.zoom;
    let nextWidth = Math.max(minWidth, start.width + dx);
    let nextHeight = Math.max(minHeight, start.height + dy);

    if (keepAspectRatio) {
      const ratio = start.width / Math.max(1, start.height);
      nextWidth = Math.max(minWidth, start.width + (dx + dy * ratio) / 2);
      nextHeight = nextWidth / ratio;
      if (nextHeight < minHeight) {
        nextHeight = minHeight;
        nextWidth = nextHeight * ratio;
      }
    }
    if (heightFromWidth) nextHeight = heightFromWidth(nextWidth);

    latest.current = { width: Math.round(nextWidth), height: Math.round(nextHeight) };
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  };

  const finish = (event) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    flush();
    dataRef.current.onResizeEnd?.();
  };

  return (
    <>
      {!coarse && (
        <NodeResizer
          isVisible
          minWidth={minWidth}
          minHeight={minHeight}
          keepAspectRatio={keepAspectRatio}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) => {
            const nextWidth = Math.round(p.width);
            data.onResize?.(id, {
              width: nextWidth,
              height: heightFromWidth ? Math.round(heightFromWidth(nextWidth)) : Math.round(p.height)
            });
          }}
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}
      <div
        className="nodrag nopan nowheel bw-resize-grip"
        role="button"
        aria-label="redimensionar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
    </>
  );
}
