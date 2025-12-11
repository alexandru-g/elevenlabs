from core.state import PipelineState
from langchain_core.messages import HumanMessage

def dispatcher_input_node(state: PipelineState):
    user_input = input("Dispatcher: ")
    return {"messages": [HumanMessage(content=user_input)]}
