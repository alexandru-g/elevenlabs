import os
import shutil
import tempfile
import io
import speech_recognition as sr
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
from pydub.playback import play
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

# Load env variables (Ensure ELEVENLABS_API_KEY is set in your .env)
load_dotenv()

app = FastAPI()

# Initialize ElevenLabs Client
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def transcribe_with_elevenlabs(file_path: str) -> str:
    """
    Sends an audio file to ElevenLabs Scribe model for transcription.
    """
    print(f"[ELEVENLABS] Transcribing {file_path}...")
    try:
        # Open file in binary read mode
        with open(file_path, "rb") as audio_file:
            transcription = client.speech_to_text.convert(
                file=audio_file,
                model_id="scribe_v1", # The specific STT model
                tag_audio_events=False,
                language_code="en",
                diarize=False
            )
            # The transcription object usually returns text directly or has a .text property
            # Depending on SDK version, it might return a string or an object.
            return transcription.text
            
    except Exception as e:
        print(f"[ELEVENLABS] Error: {e}")
        return "(Transcription Failed)"

def record_from_mic_and_transcribe():
    """
    1. Records audio using SpeechRecognition (for silence detection).
    2. Saves it to a temp WAV file.
    3. Sends that WAV to ElevenLabs for transcription.
    """
    recognizer = sr.Recognizer()
    mic_index = 0 # Adjust for your hardware
    
    print(f"\n[SERVER] Opening Microphone (Index {mic_index})...")
    
    try:
        with sr.Microphone(device_index=mic_index) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            print("[SERVER] LISTENING... Speak now.")
            
            # Record audio (blocks until silence is detected)
            audio_data = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("[SERVER] Processing Mic Audio...")
            
            # Save raw audio to a temp file for ElevenLabs
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                temp_wav.write(audio_data.get_wav_data())
                temp_wav_path = temp_wav.name
            
            # Transcribe using ElevenLabs
            text = transcribe_with_elevenlabs(temp_wav_path)
            
            # Clean up temp file
            os.remove(temp_wav_path)
            
            print(f"[SERVER] MIC DETECTED: {text}")
            return text

    except sr.WaitTimeoutError:
        print("[SERVER] No speech detected.")
        return None
    except Exception as e:
        print(f"[SERVER] Mic/Transcribe Error: {e}")
        return None

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    1. Receives MP3 from Frontend -> Transcribes via ElevenLabs.
    2. Plays MP3 on Server Speakers.
    3. Records User Mic -> Transcribes via ElevenLabs.
    4. Returns both texts.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        # --- 1. Save & Transcribe Uploaded MP3 ---
        mp3_path = os.path.join(temp_dir, "input.mp3")
        
        with open(mp3_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"\n[API] Received file: {file.filename}")
        
        # Transcribe the INCOMING audio (from dispatcher/tts)
        uploaded_text = transcribe_with_elevenlabs(mp3_path)
        print(f"[API] UPLOADED AUDIO SAID: {uploaded_text}")

        # --- 2. Play Audio ---
        # Convert to WAV for playback (pydub requirement usually)
        try:
            audio_segment = AudioSegment.from_mp3(mp3_path)
            print("[API] Playing audio...")
            play(audio_segment) # BLOCKS here until audio finishes
        except Exception as e:
            print(f"[API] Playback Error: {e}")

        # --- 3. Record & Transcribe Response ---
        # Starts strictly AFTER playback finishes
        mic_text = record_from_mic_and_transcribe()

        if not mic_text:
            mic_text = "..."

        return {
            "uploaded_audio_transcript": uploaded_text,
            "server_mic_transcript": mic_text,
            "status": "success"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)