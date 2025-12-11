# mixer.py
from core.state import PipelineState
from pydub import AudioSegment
import os

def mixer_node(state: PipelineState):
    print("DEBUG: Mixing Audio (Voice + SFX)")
    
   
    if not os.path.exists("temp_voice.mp3"):
        print("ERROR: No voice file found to mix.")
        return {}
        
    voice_audio = AudioSegment.from_mp3("temp_voice.mp3")

    sfx_audio = AudioSegment.from_mp3("current_sfx.mp3")


    if len(sfx_audio) < len(voice_audio):
        loops_needed = (len(voice_audio) // len(sfx_audio)) + 1
        sfx_audio = sfx_audio * loops_needed

    sfx_audio = sfx_audio[:len(voice_audio) + 500]

    voice_audio = voice_audio + 0  
    sfx_audio = sfx_audio - 5      

    mixed_audio = voice_audio.overlay(sfx_audio)

    output_path = "final_mix_dirty.mp3"
    mixed_audio.export(output_path, format="mp3")

    return {"final_audio": output_path}