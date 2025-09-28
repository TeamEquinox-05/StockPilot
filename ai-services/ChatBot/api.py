import os
import uuid
import sys
import json
import traceback
import subprocess
from typing import Optional
from contextlib import asynccontextmanager


current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up one directory from ChatBot to ai-services
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Now these imports will work correctly
from reorder_point_calculator import ReorderPointCalculator, convert_to_serializable

# --- FIX: Set Matplotlib backend to Agg to prevent GUI errors ---
# This MUST be done before importing pyplot
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# --- Library Imports ---
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# --- LangChain Imports ---
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# --- CONFIGURATION ---
PERSIST_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "document_store")
EMBEDDING_MODEL = "mixedbread-ai/mxbai-embed-large-v1"
LLM_MODEL = "phi3:mini"

# --- IN-MEMORY DICTIONARIES ---
ml_models = {}
active_sessions = {}

# --- FASTAPI LIFESPAN MANAGER (for chatbot models) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- Loading chatbot models and building chains ---")
    
    # Initialize shared components for the chatbot
    llm = ChatOllama(model=LLM_MODEL)
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    retriever = vectordb.as_retriever(search_kwargs={'k': 5})

    # --- 1. The Q&A Chain for StockPilot ---
    qa_template = """### ROLE: Business Q&A Expert ###
    You are an expert AI assistant for StockPilot named PilotBot. Answer the user's question based on the business data provided in the context.
    ---
    ### CONTEXT (Business Data) ###
    {document_context}
    ---
    ### CONVERSATION HISTORY ###
    {chat_history}
    ---
    ### User's Question ###
    {question}
    ### Your Answer ###
    """
    qa_prompt = ChatPromptTemplate.from_template(qa_template)
    ml_models["qa_chain"] = ({
        "document_context": (lambda x: x["question"]) | retriever,
        "question": lambda x: x["question"],
        "chat_history": lambda x: x["chat_history"]
    } | qa_prompt | llm | StrOutputParser())

    # --- 2. The Form-Filler Chain ---
    form_filler_template = """### ROLE: Form Expert ###
    Your task is to accurately fill out a form using information from the provided text. Return ONLY the fully completed form. If a detail is not found, write "NOT MENTIONED".
    ---
    ### CONVERSATION HISTORY ###
    {chat_history}
    ---
    ### CURRENT USER MESSAGE (contains the form) ###
    {question}
    ---
    ### COMPLETED FORM ###
    """
    form_filler_prompt = ChatPromptTemplate.from_template(form_filler_template)
    ml_models["form_filler_chain"] = (form_filler_prompt | llm | StrOutputParser())

    # --- 3. The Status Update Chain for StockPilot ---
    status_update_template = """### ROLE: Status Reporter ###
    You are an AI assistant for StockPilot named PilotBot. Analyze the user's request for a status or summary and use the retrieved business data to provide a concise response.
    ---
    ### BUSINESS DATA CONTEXT ###
    {document_context}
    ---
    ### CONVERSATION HISTORY ###
    {chat_history}
    ---
    ### User's Request ###
    {question}
    ### Your Summary ###
    """
    status_update_prompt = ChatPromptTemplate.from_template(status_update_template)
    ml_models["status_update_chain"] = ({
        "document_context": (lambda x: x["question"]) | retriever,
        "question": lambda x: x["question"],
        "chat_history": lambda x: x["chat_history"]
    } | status_update_prompt | llm | StrOutputParser())

    # --- 4. The Router Chain for StockPilot ---
    router_template = """Your job is to classify the user's intent for the StockPilot system. Choose one of the following tools:

    1. "STATUS_UPDATE": If the user asks for a summary, status, or update about a customer, product, or vendor.
    2. "FORM_FILLER": If the user explicitly asks to "fill a form" and provides a form template.
    3. "QA": For general questions about specific products, customers, sales, or any other details.

    User Message: "{user_message}"
    Respond with ONLY the tool name (e.g., "STATUS_UPDATE", "FORM_FILLER", or "QA")."""
    router_prompt = ChatPromptTemplate.from_template(router_template)
    ml_models["router_chain"] = router_prompt | llm | StrOutputParser()
    
    print("--- Chatbot models loaded and ready ---")
    yield
    ml_models.clear()
    active_sessions.clear()

# --- FASTAPI APP INITIALIZATION ---
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC MODELS ---
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# --- API ENDPOINTS ---
@app.get("/")
async def read_root():
    return {"status": "StockPilot Local Backend is running"}

# --- FIX: Changed endpoint from "/api/chat" to "/chat" ---
@app.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    if "router_chain" not in ml_models:
        raise HTTPException(status_code=503, detail="Chat chains are not ready")

    session_id = request.session_id or str(uuid.uuid4())
    chat_history_list = active_sessions.get(session_id, [])
    formatted_history = "\n".join(chat_history_list)
    user_message = request.message
    
    intent = await ml_models["router_chain"].ainvoke({"user_message": user_message})
    response_text = ""
    
    if "STATUS_UPDATE" in intent:
        print("--- Routing to Status Update Chain ---")
        response_text = await ml_models["status_update_chain"].ainvoke({ "question": user_message, "chat_history": formatted_history })
    elif "FORM_FILLER" in intent:
        print("--- Routing to Form-Filler Chain ---")
        response_text = await ml_models["form_filler_chain"].ainvoke({ "question": user_message, "chat_history": formatted_history })
    else: # Default to Q&A
        print("--- Routing to Q&A Chain ---")
        response_text = await ml_models["qa_chain"].ainvoke({ "question": user_message, "chat_history": formatted_history })

    chat_history_list.append(f"User: {user_message}")
    chat_history_list.append(f"PilotBot: {response_text}")
    active_sessions[session_id] = chat_history_list
    
    return ChatResponse(response=response_text, session_id=session_id)

@app.get("/forecast")
def get_general_forecast():
    try:
        print("Training GENERAL forecasting model on latest data...")
        # Load sales and sale_items data
        sales_df = pd.read_csv(os.path.join(parent_dir, 'sales.csv'))
        sale_items_df = pd.read_csv(os.path.join(parent_dir, 'sale_items.csv'))
        # Merge sale_items with sales to get sale_date for each item
        merged = sale_items_df.merge(sales_df, left_on='sale_id', right_on='_id', how='left')
        merged = merged.dropna(subset=['sale_date'])
        merged['sale_date'] = pd.to_datetime(merged['sale_date'])
        # Aggregate to daily total quantity
        daily_sales = merged.groupby(merged['sale_date'].dt.date)['quantity'].sum().reset_index()
        daily_sales.columns = ['ds', 'y']
        daily_sales['ds'] = pd.to_datetime(daily_sales['ds'])
        # Defensive: If not enough data, return error
        if len(daily_sales) < 2:
            return JSONResponse(content={"error": "Not enough sales data to train model."}, status_code=400)
        # Train Prophet model on demand
        from prophet import Prophet
        model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
        model.fit(daily_sales)
        # Calculate average price per unit
        merged = merged.dropna(subset=['total_amount'])
        total_quantity = merged['quantity'].sum()
        total_revenue = merged['total_amount'].sum()
        avg_price_per_unit = total_revenue / total_quantity if total_quantity > 0 else 0
        # Forecast
        future = model.make_future_dataframe(periods=7)
        forecast = model.predict(future)
        result = forecast.rename(columns={'ds': 'date', 'yhat': 'predicted_sales'})
        result = result[['date', 'predicted_sales']].tail(7)
        result['date'] = result['date'].dt.strftime('%Y-%m-%d')
        result['predicted_sales'] = result['predicted_sales'].round().astype(int)
        result['predicted_price'] = (result['predicted_sales'] * avg_price_per_unit).round(2)
        return JSONResponse(content=result.to_dict('records'))
    except FileNotFoundError:
        return JSONResponse(content={"error": "Required sales data file not found."}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/forecast/{product_id}")
def get_product_forecast(product_id: str):
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        python_executable = sys.executable
        script_path = os.path.join(current_dir, "C:/Users/uday0/OneDrive/Desktop/code/HackForge/ai-services/product_forecaster.py") # Assumes script is in the same directory
        
        result = subprocess.run(
            [python_executable, script_path, product_id],
            capture_output=True, text=True, check=False
        )
        
        if result.returncode != 0:
            return JSONResponse(content={
                "error": f"Failed to generate forecast for product {product_id}",
                "details": result.stderr or result.stdout or "Unknown error in script"
            }, status_code=500)
        
        return JSONResponse(content=json.loads(result.stdout.strip()))
    except FileNotFoundError:
        return JSONResponse(content={"error": "product_forecaster.py script not found."}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# In api.py

@app.get("/reorder")
def get_all_reorder_points():
    try:
        # Create an instance of the calculator
        calculator = ReorderPointCalculator()
        # Use the instance to call the method
        results = calculator.calculate_all_reorder_points()
        
        reorder_needed_count = sum(1 for item in results if item['reorder_needed'])
        
        if 'convert_to_serializable' in globals() and results:
            results = [{k: convert_to_serializable(v) for k, v in item.items()} for item in results]
            
        return JSONResponse(content={
            "reorder_summary": {
                "total_products": len(results),
                "products_needing_reorder": reorder_needed_count
            },
            "reorder_points": results
        })
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/reorder/{product_id}")
def get_product_reorder_point(product_id: str):
    try:
        # Create an instance of the calculator
        calculator = ReorderPointCalculator()
        # Use the instance to call the method
        result = calculator.calculate_reorder_point(product_id)
        
        if 'error' in result:
            return JSONResponse(content={"error": result['error']}, status_code=400)
            
        if 'convert_to_serializable' in globals():
            result = {k: convert_to_serializable(v) for k, v in result.items()}
            
        return JSONResponse(content=result)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)