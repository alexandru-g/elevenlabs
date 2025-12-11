
from core.state import PipelineState
from elevenlabs.client import ElevenLabs
import os

elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

def tts_node(state: PipelineState):
    print("DEBUG: Generating TTS")
    
    voice_def = state.get("voice_definition")
    if voice_def and "voice_id" in voice_def:
        voice_id = voice_def["voice_id"]
    else:
        
        print("WARNING: Using default voice (Rachel)")
        voice_id = "21m00Tcm4TlvDq8ikWAM" 

    text_to_speak = state.get("current_text", "I am silent.")
    if not text_to_speak:
        text_to_speak = "..."

    try:
        audio_generator = elevenlabs.text_to_speech.convert(
            voice_id=voice_id,
            text=text_to_speak,
            model_id="eleven_multilingual_v2"
        )
        
        audio_bytes = b"".join(audio_generator)
        with open("temp_voice.mp3", "wb") as f:
            f.write(audio_bytes)
            
        return {"audio_history": state["audio_history"] + ["temp_voice.mp3"]}

    except Exception as e:
        print(f"ERROR: TTS Failed: {e}")
        return {}