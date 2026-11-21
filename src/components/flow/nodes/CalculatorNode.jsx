import React from "react";
import NodeResizeControls from "./NodeResizeControls";
import Handles from "./Handles";

// Tamanho nativo do embed da calculadora (API) e margens do node ao redor dele.
const FRAME_WIDTH = 219;
const FRAME_HEIGHT = 302;
const FRAME_MARGIN_X = 8;
const FRAME_MARGIN_Y = 44;
const CALCULATOR_WIDTH = FRAME_WIDTH + FRAME_MARGIN_X;
const CALCULATOR_HEIGHT = FRAME_HEIGHT + FRAME_MARGIN_Y;

export default function CalculatorNode({ id, data }) {
  const editing = !!data.editing;
  const width = Number(data.width) || CALCULATOR_WIDTH;
  const height = Number(data.height) || Math.round(width * CALCULATOR_HEIGHT / CALCULATOR_WIDTH);
  const scale = Math.min((width - FRAME_MARGIN_X) / FRAME_WIDTH, (height - FRAME_MARGIN_Y) / FRAME_HEIGHT);
  const frameLeft = FRAME_MARGIN_X / 2 + ((width - FRAME_MARGIN_X) - FRAME_WIDTH * scale) / 2;

  return (
    <div
      className="bw-node bw-calculator-node"
      style={{ width, height, padding: 0, background: "var(--bw-accent,#48abb3)" }}
    >
      {editing && (
        <NodeResizeControls id={id} data={data} width={width} height={height} minWidth={140} minHeight={213} keepAspectRatio />
      )}
      <Handles />
      <div className="node-drag-handle bw-node-dragbar bw-calculator-drag-top">editar</div>
      <iframe
        title="Calculadora"
        src="https://calculator-1.com/outdoor/?f=dedede&r=ffffff"
        scrolling="no"
        frameBorder="0"
        style={{ left: frameLeft, transform: `scale(${scale})` }}
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