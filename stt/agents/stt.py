# stt.py
import speech_recognition as sr
from core.state import PipelineState

def mic_input_node(state: PipelineState):
    recognizer = sr.Recognizer()
    
    # 'energy_threshold' : controls sensitiyivity
    # 300 by deafult -> higher = less sensitive ( good for noisy rooms)
    
    print("\n[LISTENING]... Speak now")
    
    try:
        with sr.Microphone(device_index=2) as source:
        
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            audio_data = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("[PROCESSING] Transcribing...")

            text = recognizer.recognize_google(audio_data)
            print(f"USER SAID: {text}")
            
            if not text:
                return {"current_text": "..."}

            return {"current_text": text}

    except sr.UnknownValueError:
        print("DEBUG: Speech was unintelligible (UnknownValueError)")
        return {"current_text": "..."} 
        
    except sr.WaitTimeoutError:
        print("DEBUG: No speech detected (Timeout)")
        return {"current_text": "..."}
        
    except sr.RequestError as e:
        print(f"ERROR: API unavailable: {e}")
        return {"current_text": "Error"}
        
    except KeyboardInterrupt:
        return None