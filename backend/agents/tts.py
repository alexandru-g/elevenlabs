import base64
from core.state import PipelineState
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import os

load_dotenv()

elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)

def tts_node(state: PipelineState):
    print("DEBUG: Generating TTS")
    audio_generator = elevenlabs.text_to_speech.convert(
        voice_id=state["voice_definition"]["voice_id"],
        text=state["current_text"],
        model_id="eleven_turbo_v2_5"
    )
    
    audio_bytes = b"".join(audio_generator)
    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

    return {
        "final_audio": audio_base64,
        "audio_history": state["audio_history"]
    }
