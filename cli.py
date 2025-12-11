import click
import asyncio
from dotenv import load_dotenv
from core.graph import build_graph
import pprint

load_dotenv()

@click.group()
def cli():
    pass

@cli.command()
def demo():
    """Runs the demo flow: Scenario -> Voice -> Response -> TTS -> Effects"""
    graph = build_graph()
    initial_state = {
        "scenario": {
            "description": "Mock Scenario",
            "voice_name": "Maya",
            "voice_prompt": "Young female voice, American General accent, high pitch, soft and light timbre.",
            "victim_persona": "You are Maya, a 17-year-old babysitter. You are currently hiding in the master bedroom closet. You heard the back door glass shatter and heavy footsteps downstairs. Stress Level: 10/10.\n\n**Behavioral Instructions:**\n- WHISPER ONLY. Do not speak at a normal volume. If the dispatcher asks you to speak up, refuse and whisper, 'He'll hear me!'\n- You are hyperventilating. Take pauses to catch your breath.\n- You do not know the exact numerical address, only that it is on 'Oakwood Lane, the blue house near the park.' You need the dispatcher to guide you to find a piece of mail or use GPS location.\n- If the user pauses for more than 5 seconds, ask frantically, 'Are they coming? I hear him on the stairs.'"
        },
        "voice_definition": {"voice_id": "1vv1HaZbEdPUqiY6W98r"},
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
