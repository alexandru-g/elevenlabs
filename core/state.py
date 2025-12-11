from typing import TypedDict, List, Optional, Any, Dict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class PipelineState(TypedDict):
    scenario: Dict[str, Any]
    voice_definition: Optional[Dict[str, Any]]
    current_text: Optional[str]
    audio_history: List[str]
    final_audio: Optional[str]
    messages: Annotated[List[BaseMessage], add_messages]
