import React from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";

const CALCULATOR_WIDTH = 210;
const CALCULATOR_HEIGHT = 309;

export default function CalculatorNode({ id, data }) {
  const editing = !!data.editing;
  const width = Number(data.width) || CALCULATOR_WIDTH;
  const height = Number(data.height) || Math.round(width * CALCULATOR_HEIGHT / CALCULATOR_WIDTH);

  return (
    <div
      className="bw-node bw-calculator-node"
      style={{ width, height, padding: 0, background: "var(--bw-accent,#48abb3)" }}
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
      <div className="node-drag-handle bw-node-dragbar bw-calculator-drag-top">editar</div>
      <iframe
        title="Calculadora"
        src="https://calculator-1.com/outdoor/?f=dedede&r=ffffff"
        scrolling="no"
        frameBorder="0"
      />
      <div className="bw-calculator-drag-bottom" />
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
