from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import logging
import google.generativeai as genai
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
import sys
import os

from pprint import pprint

# Add current directory to sys.path to allow imports from core, agents, etc.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.graph import build_graph
from langgraph.checkpoint.memory import MemorySaver

from core.db import create_db_and_tables, upsert_scenario, get_scenario, Scenario

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# In-memory storage for graph state
memory = MemorySaver()
graph = build_graph(is_cli=False, checkpointer=memory)

class ChatResponse(BaseModel):
    text: Optional[str]
    audio: Optional[str] # Base64 encoded audio
    thread_id: str

@app.post("/api/chat/{thread_id}", response_model=ChatResponse)
async def chat_endpoint(thread_id: str, audio: UploadFile = File(None), text: Optional[str] = Form(None)):
    config = {"configurable": {"thread_id": thread_id}}
    
    input_text = None
    
    # 1. Handle User Input
    if audio:
        try:
            logger.info(f"Received audio for thread {thread_id}")
            audio_bytes = await audio.read()
            
            # STT using Gemini
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            prompt = "Transcribe the following audio accurately. Output ONLY the transcription."
            
            response = model.generate_content([
                prompt,
                {
                    "mime_type": audio.content_type or "audio/mp3",
                    "data": audio_bytes
                }
            ])

            pprint(response)
            
            input_text = response.text.strip()
            logger.info(f"Transcribed text: {input_text}")
            
        except Exception as e:
            logger.error(f"Error processing audio: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    elif text:
        input_text = text
        logger.info(f"Received text for thread {thread_id}: {input_text}")

    if input_text:
        # Update state with user message
        logger.info(f"Updating state for thread {thread_id} with text: {input_text}")
        graph.update_state(config, {"messages": [HumanMessage(content=input_text)]})
        input_data = None
    else:
        # First call (Start of scenario) or no input
        if not audio and not text:
            logger.info(f"Starting new session for thread {thread_id}")

            # load_voice_id = "1vv1HaZbEdPUqiY6W98r"
            load_voice_id = "TBb2DozaZQ0ev7kEXL9a"

            if load_voice_id:
                scenario_record = get_scenario(load_voice_id)
                if not scenario_record:
                    logger.info(f"Error: No scenario found for Voice ID: {load_voice_id}")
                    return
            
                input_data = {
                    "scenario": {
                        "description": scenario_record.description,
                        "voice_name": scenario_record.voice_name,
                        "voice_prompt": scenario_record.voice_prompt,
                        "victim_persona": scenario_record.victim_persona,
                        "example_dialogue": ""
                    },
                    "voice_definition": {"voice_id": scenario_record.voice_id},
                    "current_text": None,
                    "audio_history": [],
                    "final_audio": None,
                    "messages": []
                }
                logger.info(f"Loaded scenario for Voice ID: {load_voice_id}")
            else:
                input_data = {
                    "scenario": None,
                    "voice_definition": None,
                    "current_text": None,
                    "audio_history": [],
                    "final_audio": None,
                    "messages": []
                }

            #  input_data = {
            #     "scenario": None, 
            #     "voice_definition": None, 
            #     "current_text": None,
            #     "audio_history": [],
            #     "final_audio": None,
            #     "messages": []
            # }
        else:
            # Should not happen if logic is correct
            input_data = None

    # 2. Run Graph
    try:
        logger.info("Running graph")
        final_state = None
        for event in graph.stream(input_data, config=config, stream_mode="values"):
            # pprint(event)
            final_state = event
            
        if not final_state:
             raise HTTPException(status_code=500, detail="Graph execution failed to produce state")
             
        return ChatResponse(
            text=final_state.get("current_text"),
            audio=final_state.get("final_audio"),
            thread_id=thread_id
        )

    except Exception as e:
        logger.error(f"Error running graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
