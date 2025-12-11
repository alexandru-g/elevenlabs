from langgraph.graph import StateGraph, END
from typing import Dict, Any

from .state import PipelineState
from agents.scenario import generate_scenario_node, generate_response_node
from agents.voice_design import voice_design_node
from agents.tts import tts_node
from agents.effects import audio_effects_node
from agents.dispatcher_input import dispatcher_input_node

def build_graph():
    workflow = StateGraph(PipelineState)

    workflow.add_node("scenario_generator", generate_scenario_node)
    workflow.add_node("voice_designer", voice_design_node)
    workflow.add_node("generate_response", generate_response_node)
    workflow.add_node("tts_generator", tts_node)
    workflow.add_node("audio_effects", audio_effects_node)

    workflow.add_node("dispatcher_input", dispatcher_input_node)

    workflow.set_entry_point("scenario_generator")
    workflow.add_edge("scenario_generator", "voice_designer")
    
    workflow.add_edge("voice_designer", "generate_response")
    workflow.add_edge("generate_response", "tts_generator")
    workflow.add_edge("tts_generator", "audio_effects")
    workflow.add_edge("audio_effects", "dispatcher_input")
    
    def check_exit(state: PipelineState):
        messages = state.get("messages", [])
        if messages:
            last_message = messages[-1]
            if hasattr(last_message, 'content') and "hang up" in last_message.content.lower():
                return END
        return "scenario_generator"

    workflow.add_conditional_edges(
        "dispatcher_input",
        check_exit,
        {END: END, "scenario_generator": "scenario_generator"}
    )

    return workflow.compile()
