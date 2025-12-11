import click
import asyncio
from dotenv import load_dotenv
from core.graph import build_graph
from core.db import create_db_and_tables, upsert_scenario, get_scenario, Scenario
import pprint

load_dotenv()

@click.group()
def cli():
    create_db_and_tables()

@cli.command()
@click.option('--load-voice-id', help='Load a saved scenario by Voice ID', default=None)
def demo(load_voice_id):
    """Runs the demo flow: Scenario -> Voice -> Response -> TTS -> Effects"""
    graph = build_graph()
    
    if load_voice_id:
        scenario_record = get_scenario(load_voice_id)
        if not scenario_record:
            click.echo(f"Error: No scenario found for Voice ID: {load_voice_id}")
            return
            
        initial_state = {
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
        click.echo(f"Loaded scenario for Voice ID: {load_voice_id}")
    else:
        initial_state = {
            "scenario": None,
            "voice_definition": None,
            "current_text": None,
            "audio_history": [],
            "final_audio": None,
            "messages": []
        }
    
    final_state = initial_state.copy()
    
    click.echo("Starting CrisisLink Demo Pipeline...")
    try:
        for output in graph.stream(initial_state):
            for node_name, state_update in output.items():
                click.echo(f"Finished node: {node_name}")
                if state_update:
                    final_state.update(state_update)
                
                if node_name == "voice_designer":
                    # Save the scenario to the DB
                    current_scenario = final_state.get("scenario", {})
                    voice_def = final_state.get("voice_definition", {})
                    
                    if current_scenario and voice_def and "voice_id" in voice_def:
                        scenario_db = Scenario(
                            voice_id=voice_def["voice_id"],
                            voice_name=current_scenario.get("voice_name", "Unknown"),
                            voice_prompt=current_scenario.get("voice_prompt", ""),
                            victim_persona=current_scenario.get("victim_persona", ""),
                            description=current_scenario.get("description", "")
                        )
                        upsert_scenario(scenario_db)
                        click.echo(f"  > Saved scenario to DB with Voice ID: {voice_def['voice_id']}")

                if state_update:
                    if "current_text" in state_update:
                        click.echo(f"  > Generated Text: {state_update['current_text']}")
                    if "scenario" in state_update and state_update["scenario"]:
                         click.echo(f"  > Scenario: {state_update['scenario']}")
    except Exception as e:
        click.echo(f"Error running pipeline: {e}")
        raise

    click.echo("Pipeline finished successfully.")
    click.echo("-" * 50)
    click.echo("Final Graph State:")
    pprint.pprint(final_state)

@cli.command()
@click.argument('agent_name')
def run_agent(agent_name):
    """Runs a single agent by name with mock state."""
    
    # Mock State Setup
    mock_state = {
        "scenario": {
            "description": "Mock Scenario",
            "voice_name": "Maya (Babysitter)",
            "voice_prompt": "Young female voice, American General accent, high pitch, soft and light timbre.",
            "example_dialogue": "Shhh! You have to listen to me...",
            "victim_persona": "You are Maya..."
        },
        "voice_definition": {"voice_id": "mock_voice_id"},
        "current_text": "Help me! I'm trapped!",
        "audio_history": [],
        "final_audio": None,
        "messages": []
    }

    # Import agents
    from agents.scenario import generate_scenario_node
    from agents.scenario import generate_response_node
    from agents.voice_design import voice_design_node
    from agents.tts import tts_node
    from agents.effects import audio_effects_node
    
    agents = {
        "scenario": generate_scenario_node,
        "response": generate_response_node,
        "voice_design": voice_design_node,
        "tts": tts_node,
        "effects": audio_effects_node
    }
    
    if agent_name not in agents:
        click.echo(f"Error: Agent '{agent_name}' not found. Available agents: {', '.join(agents.keys())}")
        return

    click.echo(f"Running agent: {agent_name}")
    try:
        if agent_name == "scenario":
            mock_state["scenario"] = None
        elif agent_name == "response":
            mock_state["scenario"] = {'description': 'Generated Scenario: Madison',
              'example_dialogue': 'So, I was totally planning on just '
                                  'finishing my chem homework tonight before '
                                  'the movie started. I usually go to the '
                                  "library, but it's closed for renovations, "
                                  'so I decided to just stay in and make some '
                                  "popcorn instead. It's honestly been a "
                                  'really long week at school and I just need '
                                  'a break.',
              'victim_persona': 'You are Madison, a 19-year-old babysitter. '
                                'You are currently hiding in the master '
                                'bedroom closet at 2408 Oakwood Drive. You '
                                'heard the back sliding glass door shatter and '
                                'heavy footsteps downstairs. The parents are '
                                'out at dinner. The children, Liam (4) and '
                                'Emma (6), are asleep in the next room. Your '
                                'stress level is 9/10. You are terrified. You '
                                'are speaking in a hushed whisper to avoid '
                                'being heard. Use short, panicked sentences. '
                                'Do not agree to leave the closet. If the '
                                'dispatcher asks about the intruders, say you '
                                'hear two male voices arguing. You are afraid '
                                'they are coming up the stairs.',
              'voice_name': 'Madison',
              'voice_prompt': 'Young female voice, American Midwest accent, '
                              'medium-high pitch, clear resonance with a '
                              'slight vocal fry.'}
            
        result = agents[agent_name](mock_state)
        click.echo("Result:")
        pprint.pprint(result)
    except Exception as e:
        click.echo(f"Error running agent: {e}")

if __name__ == '__main__':
    cli()
