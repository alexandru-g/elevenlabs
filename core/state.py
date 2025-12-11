from typing import TypedDict, List, Optional, Any, Dict
from langchain_core.messages import BaseMessage

class PipelineState(TypedDict):
    scenario: Dict[str, Any]
    voice_definition: Optional[Dict[str, Any]]
    current_text: Optional[str]
    audio_history: List[str]
    final_audio: Optional[str]
    messages: List[BaseMessage]
