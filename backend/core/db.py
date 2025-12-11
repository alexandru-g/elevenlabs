from typing import Optional
from sqlmodel import Field, Session, SQLModel, create_engine, select

class Scenario(SQLModel, table=True):
    voice_id: str = Field(primary_key=True)
    voice_name: str
    voice_prompt: str
    victim_persona: str
    description: Optional[str] = None

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def upsert_scenario(scenario: Scenario):
    with Session(engine) as session:
        session.merge(scenario)
        session.commit()

def get_scenario(voice_id: str) -> Optional[Scenario]:
    with Session(engine) as session:
        return session.get(Scenario, voice_id)
