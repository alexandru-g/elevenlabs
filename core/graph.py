from langgraph.graph import StateGraph, END
from typing import Dict, Any

from .state import PipelineState
from agents.scenario import generate_scenario_node, generate_response_node
from agents.voice_design import voice_design_node
from agents.tts import tts_node
from agents.effects import audio_effects_node

def build_graph():
    workflow = StateGraph(PipelineState)

    # Add Nodes
    workflow.add_node("scenario_generator", generate_scenario_node)
    workflow.add_node("voice_designer", voice_design_node)
    workflow.add_node("generate_response", generate_response_node)
    workflow.add_node("tts_generator", tts_node)
    workflow.add_node("audio_effects", audio_effects_node)

    # Add Edges
    workflow.set_entry_point("scenario_generator")
    workflow.add_edge("scenario_generator", "voice_designer")
    
    # We need a conditional edge here or just a direct edge for the demo flow?
    # For now, let's implement the 'demo flow' sequence linearly as requested.
    # To support the re-execution loop, we might need conditional logic at 'generate_response'.
    # But strictly following the initial request:
    # "scenario_generator -> voice_designer -> generate_response -> tts_generator -> audio_effects -> END"
    
    workflow.add_edge("voice_designer", "generate_response")
    workflow.add_edge("generate_response", "tts_generator")
    workflow.add_edge("tts_generator", "audio_effects")
    workflow.add_edge("audio_effects", END)

    return workflow.compile()
