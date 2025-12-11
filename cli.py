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

if __name__ == '__main__':
    cli()
