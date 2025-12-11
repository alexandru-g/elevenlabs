# sfx.py
from core.state import PipelineState
from elevenlabs.client import ElevenLabs
import os
from dotenv import load_dotenv

load_dotenv()

elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

def generate_sfx_node(state: PipelineState):
    scenario_desc = state["scenario"].get("sfx_prompt", "alien sound waves")
    print(f"DEBUG: Generating SFX for: {scenario_desc}")

    
    result = elevenlabs.text_to_sound_effects.convert(
        text=scenario_desc,
        duration_seconds=10, #
        prompt_influence=0.5
    )

    audio_bytes = b"".join(result)
    
    with open("current_sfx.mp3", "wb") as f:
        f.write(audio_bytes)

    return {"sfx_path": "current_sfx.mp3"}