from core.state import PipelineState

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

    # TODO: Implement Gemini generation
    if state.get("scenario"):
        print("DEBUG: Skipping Scenario Generation (already exists)")
        return {}
        
    print("DEBUG: Generating Scenario")
    return {
        "scenario": {
            "description": "Mock Scenario",
            "voice_name": "Maya (Babysitter)",
            "voice_prompt": "Young female voice, American General accent, high pitch, soft and light timbre.",
            "example_dialogue": "Shhh! You have to listen to me, someone just smashed the back door glass. I'm hiding in the master bedroom closet with the baby.",
            "victim_persona": "You are Maya, a 17-year-old babysitter. You are currently hiding in the master bedroom closet. You heard the back door glass shatter and heavy footsteps downstairs. Stress Level: 10/10.\n\n**Behavioral Instructions:**\n- WHISPER ONLY. Do not speak at a normal volume. If the dispatcher asks you to speak up, refuse and whisper, 'He'll hear me!'\n- You are hyperventilating. Take pauses to catch your breath.\n- You do not know the exact numerical address, only that it is on 'Oakwood Lane, the blue house near the park.' You need the dispatcher to guide you to find a piece of mail or use GPS location.\n- If the user pauses for more than 5 seconds, ask frantically, 'Are they coming? I hear him on the stairs.'"
        }
    }

def generate_response_node(state: PipelineState):
    # TODO: Implement Gemini response generation
    print("DEBUG: Generating Response")
    return {"current_text": "Help me! I'm trapped!"}
