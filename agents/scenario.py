import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from core.state import PipelineState
from langchain_core.messages import AIMessage, HumanMessage

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_scenario_node(state: PipelineState):
    prompt = """
    You are the "Scenario Engine" for a high-fidelity 911 dispatcher training simulator. Your goal is to generate unique, realistic, and high-stress emergency scenarios.

You must output a single valid JSON object containing four distinct fields:

1.  `voice_name`: A first name for the caller.
2.  `elevenlabs_voice_prompt`: A concise, physical description of the speaker's voice for the ElevenLabs Voice Design API. Focus on age, gender, accent, and pitch. Do NOT include emotional states (like "scared") here; describe the vocal cords, not the mood.
3.  `generated_voice_sample_text`: A sample monologue for this character to say during voice generation. It must be **at least 100 characters long**. It should reflect their vocabulary and accent (e.g., slang, sentence structure) but should be relatively neutral or conversational, not screaming. This is used to "bake" the accent into the voice ID.
4.  `victim_persona`: A detailed system prompt for the LLM that will play the victim during the live call. This must include their situation, location, current stress level (1-10), and specific instructions on how to behave (e.g., "be incoherent at first," "refuse to leave the house without your cat").

**Constraints:**
* Vary the scenarios (Home invasion, medical emergency, fire, car crash, lost child).
* Vary the demographics (Child, elderly person, tourist with thick accent, teenager).
* The `elevenlabs_voice_prompt` must be under 200 characters.
* The `generated_voice_sample_text` must be > 100 characters.

**Example Output Format:**
{
  "voice_name": "Arthur",
  "elevenlabs_voice_prompt": "An elderly male voice, deep, raspy, and breathy, with a heavy Scottish accent.",
  "generated_voice_sample_text": "I've been living in this old house for nearly forty years now, and I've never seen the winters get quite this cold. The pipes rattle something fierce in the night, and the draft comes right through the floorboards like a ghost visiting for tea. It takes me a good five minutes just to get up the stairs these days.",
  "victim_persona": "You are Arthur, 82 years old. You have fallen in your kitchen and cannot get up. You smell smoke. You are terrified. Speak in short, breathless sentences. Do not give your address immediately; make the dispatcher work to calm you down first. If they ask about the smoke, say it's getting thicker."
}
"""

    if state.get("scenario"):
        print("DEBUG: Skipping Scenario Generation (already exists)")
        return {}

    print("DEBUG: Generating Scenario with Gemini...")
    model = genai.GenerativeModel("gemini-3.0-pro-preview")
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        scenario_data = json.loads(response.text)
        
        # Normalize keys if needed, but the prompt asks for specific keys. 
        # Map them to the keys expected by pipeline/graph if they differ.
        # Graph expects: 'voice_name', 'voice_prompt' (mapped from elevenlabs_voice_prompt), 'example_dialogue' (mapped from generated_voice_sample_text)
        
        normalized_scenario = {
            "description": f"Generated Scenario: {scenario_data.get('voice_name')}",
            "voice_name": scenario_data.get("voice_name"),
            "voice_prompt": scenario_data.get("elevenlabs_voice_prompt"),
            "example_dialogue": scenario_data.get("generated_voice_sample_text"),
            "victim_persona": scenario_data.get("victim_persona")
        }
        
        print(f"DEBUG: Generated Scenario: {normalized_scenario['voice_name']}")
        return {"scenario": normalized_scenario}
        
    except Exception as e:
        print(f"ERROR: Failed to generate scenario with Gemini: {e}")
        raise e

def generate_response_node(state: PipelineState):
    messages = state.get("messages", [])
    
    # If no messages, generate initial greeting (start of call)
    if not messages:
         response_text = "Help me! I'm trapped!"
         return {
             "current_text": response_text,
             "messages": [AIMessage(content=response_text)]
         }

    # Use history and last input to generate response
    # TODO: Implement actual LLM generation here using state["scenario"]["victim_persona"]
    # For now, mock a conversation flow
    
    last_message = messages[-1]
    last_content = last_message.content.lower() if hasattr(last_message, 'content') else ""

    print(f"DEBUG: Generating Response based on input: '{last_content}'")
    
    if "address" in last_content:
        response_text = "I... I don't know the number! It's the blue house on Oakwood Lane!"
    elif "coming" in last_content:
        response_text = "Please hurry! I hear him walking around upstairs!"
    elif "calm" in last_content:
        response_text = "I can't calm down! He's going to find me!"
    else:
        response_text = "Please, just send help!"

    return {
        "current_text": response_text,
        "messages": [AIMessage(content=response_text)]
    }
