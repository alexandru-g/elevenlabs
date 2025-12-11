from core.state import PipelineState
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play
import os

load_dotenv()

elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)

def tts_node(state: PipelineState):
    audio = elevenlabs.text_to_dialogue.convert(
        inputs=[
            {
                "text": state["current_text"],
                "voice_id": state["voice_definition"]["voice_id"],
            }
        ]
    )
    print("DEBUG: Generating TTS")

    play(audio)

    return {"audio_history": state["audio_history"] + ["mock_audio.mp3"]}
