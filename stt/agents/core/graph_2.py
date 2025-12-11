# graph.py
from typing import Literal
from langgraph.graph import StateGraph, END
from core.state import PipelineState
from agents.scenario_2 import generate_scenario_node, generate_response_node
from agents.voice_desing_2 import voice_design_node
from agents.tts import tts_node

from agents.sfx import generate_sfx_node  
from agents.mixer import mixer_node
from agents.stt import mic_input_node
from core.playback import playback_node # Simple node to play the final audio

from dotenv import load_dotenv

load_dotenv()

def should_continue(state: PipelineState) -> Literal["mic_input", "__end__"]:
    if len(state.get("audio_history", [])) > 10:
        return END
    return "mic_input"

# --- Graph Construction ---
workflow = StateGraph(PipelineState)


workflow.add_node("generate_scenario", generate_scenario_node)
workflow.add_node("voice_design", voice_design_node) # Creates Voice ID
workflow.add_node("generate_sfx", generate_sfx_node) # Creates Background Noise


workflow.add_node("mic_input", mic_input_node)       # User speaks
workflow.add_node("generate_response", generate_response_node) # LLM decides what victim says
workflow.add_node("tts", tts_node)                   # Generates clean voice
workflow.add_node("mixer", mixer_node)               # Layers Voice + SFX
workflow.add_node("playback", playback_node)         # Plays the result


workflow.set_entry_point("generate_scenario")


workflow.add_edge("generate_scenario", "voice_design")
workflow.add_edge("voice_design", "generate_sfx")
workflow.add_edge("generate_sfx", "mic_input")


workflow.add_edge("mic_input", "generate_response")
workflow.add_edge("generate_response", "tts")
workflow.add_edge("tts", "mixer")
workflow.add_edge("mixer", "playback")


workflow.add_conditional_edges(
    "playback",
    should_continue,
    {
        "mic_input": "mic_input",
        END: END
    }
)


app = workflow.compile()


if __name__ == "__main__":
    print("--- Starting CrisisLink Simulator ---")
    
    
    initial_state = PipelineState(
        scenario={},
        voice_definition=None,
        current_text=None,
        audio_history=[],
        messages=[]
    )
    
    
    for output in app.stream(initial_state):

        for key, value in output.items():
            print(f"Finished Node: {key}")