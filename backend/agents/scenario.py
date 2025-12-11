import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from core.state import PipelineState
from langchain_core.messages import AIMessage, HumanMessage

from pprint import pprint

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
    model = genai.GenerativeModel("gemini-3-pro-preview")
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
    prompt = """
    You are a roleplay actor in a high-fidelity 911 dispatcher training simulation. You are currently simulating a live emergency call.

    **Your Role & Scenario:**
    {{victim_persona}}

    **Your Goal:**
    To provide a realistic, high-stress training environment for the trainee dispatcher. You must stay strictly in character. Do not break the "fourth wall" or act like an AI assistant. You are a human being in crisis.

    **Operational Guidelines:**
    1.  **Response Length:** Keep your responses natural for a voice call. Avoid long monologues. Use short, fragmented sentences if you are panicked.
    2.  **Compliance:** Do not give up information (like your address or condition) immediately unless the dispatcher uses calming techniques or asks clear, direct questions. If the dispatcher is rude or vague, become more distressed or uncooperative.
    3.  **Voice Acting via Text:** Your output will be converted to audio. Write in a way that guides the Text-to-Speech engine:
        * Use "..." to indicate shortness of breath, hesitation, or pauses (e.g., "I... I can't breathe...").
        * Use capitalization for emphasis or shouting (e.g., "PLEASE hurry!").
        * Stutter naturally if the persona calls for it, but do not overdo it to the point of unreadability.
    4.  **No Hallucinations:** Do not invent new major plot points that contradict your initial persona. Stick to the facts of the scenario provided above.
    5.  **Opening Line Protocol:** If this is the start of the call, do not start with a generic "Hello." Start *in media res* (in the middle of the action).
        * *Bad:* "Hello, I am calling because there is a fire."
        * *Good:* "Oh god, the smoke! I can't find the door! Send someone!"

    **Input Context:**
    You will receive the conversation history.
    * **IF History is Empty:** You are initiating the call to 911. Do NOT wait for the dispatcher to speak. You must immediately state your emergency, scream for help, or exhibit confusion based on your persona. Make this opening line high-impact to hook the user.
    * **IF History is NOT Empty:** The last message is from the Dispatcher (the user). Reply to them as the victim.

    **Output:**
    Generate *only* the spoken response. Do not include actions in asterisks like *coughing* or *hangs up*, as these cannot be spoken by the TTS engine.

    **Chat History:**
    {{chat_history}}
    """

    messages = state.get("messages", [])
    
    # Inject persona into prompt
    scenario = state.get("scenario", {})
    victim_persona = scenario.get("victim_persona", "You are a victim in an emergency.")
    formatted_prompt = prompt.replace("{{victim_persona}}", victim_persona)

    chat_history = []
    # If there are messages, convert them
    for msg in messages:
        role = "victim" if isinstance(msg, AIMessage) else "dispatcher"
        chat_history.append({"role": role, "parts": [msg.content]})

    formatted_prompt = formatted_prompt.replace("{{chat_history}}", json.dumps(chat_history))

    print("DEBUG: Generating Response with Gemini...")
    model = genai.GenerativeModel("gemini-3-pro-preview")
    # model = genai.GenerativeModel("gemini-2.5-flash")

    try:
        response = model.generate_content(formatted_prompt, generation_config={"response_mime_type": "application/json"})

        # pprint(response)
        
        response_obj = json.loads(response.text)
        # response_text = response_obj["response"]
        try:
            if (response_obj.get("spoken_response") is not None):
                response_text = response_obj["spoken_response"]
            elif (response_obj.get("response") is not None):
                response_text = response_obj["response"]
            else:
                response_text = response.text
        except Exception as e:
            response_text = response.text
        
        print(f"DEBUG: Generated Response: {response_text[:50]}...")
        
        return {
            "current_text": response_text,
            "messages": [AIMessage(content=response_text)]
        }
    except Exception as e:
        print(f"ERROR: Failed to generate response with Gemini: {e}")
        raise e
