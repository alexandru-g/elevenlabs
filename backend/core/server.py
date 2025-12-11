import os
import io
import shutil
import tempfile
import speech_recognition as sr
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
from pydub.playback import play

app = FastAPI()

# Allow CORS so your frontend can communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def record_from_mic():
    """
    Records audio from the server's default microphone and transcribes it.
    Reuses logic from your stt.py
    """
    recognizer = sr.Recognizer()
    
    # mic_index = 2 for headphones
    mic_index = 0
    
    print(f"\n[SERVER] Opening Microphone (Index {mic_index})...")
    
    try:
        with sr.Microphone(device_index=mic_index) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            print("[SERVER] LISTENING... Speak into the server mic now.")
            
            # Listen
            audio_data = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("[SERVER] Processing Mic Audio...")

            # Transcribe
            text = recognizer.recognize_google(audio_data)
            print(f"[SERVER] MIC DETECTED: {text}")
            return text

    except sr.WaitTimeoutError:
        print("[SERVER] No speech detected from mic.")
        return None
    except sr.UnknownValueError:
        print("[SERVER] Unintelligible speech.")
        return None
    except Exception as e:
        print(f"[SERVER] Mic Error: {e}")
        return None

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    1. Recieves MP3 from frontend.
    2. STT on MP3.
    3. Plays MP3 on server.
    4. Records from Server Mic.
    5. STT on Mic recording.
    6. Returns text.
    """
    
    # Create a temporary directory to handle file conversions safely
    with tempfile.TemporaryDirectory() as temp_dir:
        
        # --- 1. Save Uploaded MP3 ---
        mp3_path = os.path.join(temp_dir, "input.mp3")
        wav_path = os.path.join(temp_dir, "converted.wav")
        
        with open(mp3_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"\n[API] Received file: {file.filename}")

        # --- 2. Convert MP3 to WAV (Required for SpeechRecognition) ---
        try:
            audio_segment = AudioSegment.from_mp3(mp3_path)
            audio_segment.export(wav_path, format="wav")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to convert audio: {str(e)}")

        # --- 3. STT on Uploaded Audio ---
        recognizer = sr.Recognizer()
        uploaded_text = ""
        
        try:
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
                uploaded_text = recognizer.recognize_google(audio_data)
                print(f"[API] UPLOADED AUDIO SAID: {uploaded_text}")
        except sr.UnknownValueError:
            uploaded_text = "(Unintelligible)"
        except Exception as e:
            print(f"[API] STT Error on upload: {e}")
            uploaded_text = "(Error)"

        # --- 4. Play the Audio on Server Speakers ---
        print("[API] Playing uploaded audio on server speakers...")
        play(audio_segment)

        # --- 5 & 6. Record from Mic & STT ---
        # This will block the request until recording is done (approx 5-10 seconds)
        mic_text = record_from_mic()

        if not mic_text:
            mic_text = "No response detected."

        # --- 7. Return Response ---
        return {
            "uploaded_audio_transcript": uploaded_text,
            "server_mic_transcript": mic_text,
            "status": "success"
        }

if __name__ == "__main__":
    import uvicorn
    # Run with: python server.py
    uvicorn.run(app, host="0.0.0.0", port=8000)