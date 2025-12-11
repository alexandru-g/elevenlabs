import os
import json
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_ollama import ChatOllama
from core.state import PipelineState

load_dotenv()


MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:3b") 
BASE_URL = os.getenv("BASE_URL", "http://localhost:11434")


llm_json = ChatOllama(
    model=MODEL_NAME,
    temperature=0.2,  
    base_url=BASE_URL,
    format="json"   
)

# no json
llm_chat = ChatOllama(
    model=MODEL_NAME,
    temperature=0.8,  
    base_url=BASE_URL,
)

def generate_scenario_node(state: PipelineState):
    """
    Creates the 'Victim': Name, Voice description, and Personality.
    Uses the JSON-mode LLM.
    """
    if state.get("scenario"):
        print("DEBUG: Scenario already exists.")
        return {}
    
    print(f"DEBUG: Generating New Scenario with {MODEL_NAME}...")

    system_prompt = """
    You are the "Scenario Engine" for a 911 dispatcher simulator. 
    Generate a HIGH STRESS, REALISTIC emergency scenario.
    
    Output strictly JSON with these fields:
    1. "voice_name": First name.
    2. "voice_prompt": Description for voice actor (gender, age, accent, pitch). NO emotions.
    3. "example_dialogue": A sentence they might say (used to clone the voice).
    4. "victim_persona": A system prompt instructing the AI how to act. Include: Situation, Stress Level, Hidden Info.

    **Example Output:**
    {
      "voice_name": "Arthur",
      "voice_prompt": "Elderly male voice, deep, raspy, Scottish accent.",
      "example_dialogue": "I've been living in this old house for nearly forty years now and I've never seen the winters get quite this cold.",
      "victim_persona": "You are Arthur. You have fallen. You are terrified."
    }
    """

    response = llm_json.invoke(system_prompt)
    
    try:
        content = response.content.strip()
        scenario_data = json.loads(content)
        
       
        required_keys = ["voice_name", "voice_prompt", "example_dialogue", "victim_persona"]
        if not all(key in scenario_data for key in required_keys):
            print(f"DEBUG: Got keys: {list(scenario_data.keys())}")
            raise ValueError("Missing keys in JSON generation")

        sample_text = scenario_data.get("example_dialogue", "")
        if len(sample_text) < 100:
            print(f"DEBUG: Extending sample text (Current: {len(sample_text)} chars)")
            padding = " I need you to listen to me very carefully because the situation is getting worse by the second and I don't know how much longer I can stay on this line."
            scenario_data["example_dialogue"] = sample_text + padding + padding

        return {"scenario": scenario_data}

    except Exception as e:
        print(f"ERROR: Scenario Gen Failed: {e}")
        return {
            "scenario": {
                "voice_name": "System", 
                "voice_prompt": "Generic male voice", 
                "example_dialogue": "I am a fallback voice system used because the scenario generation failed to produce valid output " * 3, 
                "victim_persona": "You are a fallback system. State that an error occurred."
            }
        }


def generate_response_node(state: PipelineState):

    print("DEBUG: Generating AI Response (Ollama)...")
    
    user_text = state.get("current_text", "...")
    history = state.get("messages", [])
    persona = state["scenario"]["victim_persona"]

    updated_history = list(history)
    updated_history.append(HumanMessage(content=user_text))

    prompt_messages = [SystemMessage(content=persona)] + updated_history

    response = llm_chat.invoke(prompt_messages)
    ai_text = response.content

    print(f"AI SAID: {ai_text}")

    return {
        "current_text": ai_text, 
        "messages": updated_history + [AIMessage(content=ai_text)]
    }