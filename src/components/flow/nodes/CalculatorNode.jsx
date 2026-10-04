import React from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";

const CALCULATOR_WIDTH = 219;
const CALCULATOR_HEIGHT = 302;

export default function CalculatorNode({ id, data }) {
  const editing = !!data.editing;
  const width = Number(data.width) || 260;
  const height = Number(data.height) || Math.round(width * CALCULATOR_HEIGHT / CALCULATOR_WIDTH);

  return (
    <div
      className="bw-node bw-calculator-node"
      style={{ width, height, padding: 4, background: "var(--bw-accent,#48abb3)" }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={140}
          minHeight={194}
          keepAspectRatio
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) => data.onResize?.(id, { width: Math.round(p.width), height: Math.round(p.height) })}
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}
      <Handles />
      {editing && <div className="node-drag-handle bw-node-dragbar">arrastar</div>}
      <iframe
        title="Calculadora"
        src="https://calculator-1.com/outdoor/?f=dedede&r=ffffff"
        scrolling="no"
        frameBorder="0"
        style={{ width: "100%", height: "100%", display: "block", borderRadius: 4 }}
      />
      <a
        className="bw-calculator-link"
        href="https://calculator-1.com/"
        target="_blank"
        rel="noreferrer"
      >
        The Best Free Online Calculator - Calculator-1.com
      </a>
    </div>
  );
}