from pydantic import BaseModel
from typing import List, Dict, Any


class PositionSchema(BaseModel):
    x: float
    y: float


class FlowNodeSchema(BaseModel):
    id: str
    type: str
    position: PositionSchema
    data: Dict[str, Any]


class FlowEdgeSchema(BaseModel):
    id: str
    source: str
    target: str


class FlowSchema(BaseModel):
    nodes: List[FlowNodeSchema]
    edges: List[FlowEdgeSchema]