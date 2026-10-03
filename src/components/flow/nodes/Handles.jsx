import React from "react";
import { Handle, Position } from "reactflow";

export default function Handles() {
  const common = { className: "bw-node-handle", isConnectable: true };
  return <>
    <Handle {...common} type="target" position={Position.Left} id="left-target" />
    <Handle {...common} type="source" position={Position.Left} id="left-source" />
    <Handle {...common} type="target" position={Position.Right} id="right-target" />
    <Handle {...common} type="source" position={Position.Right} id="right-source" />
    <Handle {...common} type="target" position={Position.Top} id="top-target" />
    <Handle {...common} type="source" position={Position.Top} id="top-source" />
    <Handle {...common} type="target" position={Position.Bottom} id="bottom-target" />
    <Handle {...common} type="source" position={Position.Bottom} id="bottom-source" />
  </>;
}