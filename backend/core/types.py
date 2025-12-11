from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

class AgentInputType(Enum):
    TEXT = "text"
    AUDIO = "audio"
    PROMPT = "prompt"
    SCENARIO = "scenario"
    NONE = "none"

@dataclass
class AgentOutput:
    data: Any
    type: AgentInputType
    metadata: Dict[str, Any] = field(default_factory=dict)
