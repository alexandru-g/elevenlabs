from core.state import PipelineState
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play
import base64
import os

load_dotenv()

elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)

def voice_design_node(state: PipelineState):
    voices = elevenlabs.text_to_voice.design(
        model_id="eleven_multilingual_ttv_v2",
        voice_description=state["scenario"]["voice_prompt"],
        text=state["scenario"]["example_dialogue"],
    )

    for preview in voices.previews:
        audio_buffer = base64.b64decode(preview.audio_base_64)
        print(f"Playing preview: {preview.generated_voice_id}")
        play(audio_buffer)

    voice = elevenlabs.text_to_voice.create(
        voice_name=state["scenario"]["voice_name"],
        voice_description=state["scenario"]["voice_prompt"],
        generated_voice_id=voices.previews[0].generated_voice_id
    )
    return {"voice_definition": {"voice_id": voice.voice_id}}
