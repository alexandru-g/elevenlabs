# playback.py
from core.state import PipelineState
from pydub import AudioSegment
from pydub.playback import play as pydub_play
import os

def playback_node(state: PipelineState):
    final_audio_path = state.get("final_audio", "")
    
    if os.path.exists(final_audio_path):
        print(f"DEBUG: Playing {final_audio_path}")
        audio = AudioSegment.from_mp3(final_audio_path)
        pydub_play(audio)
    else:
        print("ERROR: No audio file found to play.")
        
    return {}