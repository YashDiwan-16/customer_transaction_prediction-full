"""
FastAPI Backend - /predict route to store data and / health check
"""

import os
import logging
import traceback
# from typing import List, Dict, Any
from datetime import datetime
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
# from pymongo.errors import PyMongoError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "customer_transaction")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "customer_risk_classifications")
MODEL_PATH = os.getenv("MODEL_PATH", "risk_classification_model.pkl")

# Pydantic models
class PredictionResponse(BaseModel):
    success: bool
    message: str
    total_records: int
    processed_at: datetime

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    model_loaded: bool
    database_connected: bool

# Global variables
model = None
mongo_client = None
db = None
collection = None

app = FastAPI(title="Risk Classification API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load model and connect to MongoDB on startup"""
    global model, mongo_client, db, collection
    
    try:
        # Load model
        model = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully")
        
        # Connect to MongoDB
        mongo_client = MongoClient(MONGODB_URI)
        db = mongo_client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        logger.info("Connected to MongoDB")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

def preprocess_features(data: pd.DataFrame) -> pd.DataFrame:
    """Preprocess raw data into aggregated features"""
    try:
        # Fix negatives by clipping to zero
        numeric_cols = data.select_dtypes(include=np.number).columns
        data[numeric_cols] = data[numeric_cols].clip(lower=0)
        
        # Create customer_id
        data['customer_id'] = (
            data['sold_to_customer_legacy_format_customer_base_number'].astype(str) + 
            '_' + 
            data['sold_to_customer_legacy_format_customer_company_code'].astype(str)
        )
        
        # Aggregate features
        agg_features = data.groupby('customer_id').agg({
            'invoice_net_budget_rate_amount': ['sum', 'mean', 'std', 'count'],
            'past due > 30 days': ['sum', 'mean', 'max'],
            'total past due amount': ['sum', 'mean', 'max'],
            '% Past Due > 30 Days': ['mean', 'max', 'std'],
            '% Past Due': ['mean', 'max', 'std']
        })
        
        # Flatten MultiIndex columns
        agg_features.columns = ['_'.join(col) for col in agg_features.columns]
        agg_features.reset_index(inplace=True)
        agg_features.fillna(0, inplace=True)
        
        return agg_features
        
    except Exception as e:
        logger.error(f"Preprocessing error: {e}")
        raise ValueError(f"Data preprocessing failed: {str(e)}")

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        model_loaded=model is not None,
        database_connected=collection is not None
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict_and_store(file: UploadFile = File(...)):
    """Process file, make predictions, and store in MongoDB"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.csv', '.xlsx', '.xls']:
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Read file
        content = await file.read()
        
        # Parse file
        if file_extension == '.csv':
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Preprocess data
        processed_features = preprocess_features(df)
        
        # Make predictions
        customer_ids = processed_features['customer_id'].tolist()
        features_for_prediction = processed_features.drop('customer_id', axis=1)
        
        predictions = model.predict(features_for_prediction)
        risk_levels = {0: 'Low Risk', 1: 'Medium Risk', 2: 'High Risk'}
        predicted_risk = [risk_levels[pred] for pred in predictions]
        
        # Format results for MongoDB storage
        records = []
        for i, customer_id in enumerate(customer_ids):
            record = {
                'customer_id': customer_id,
                'risk_category_label': predicted_risk[i],
                'invoice_net_budget_rate_amount_sum': float(processed_features.iloc[i]['invoice_net_budget_rate_amount_sum']),
                '% Past Due > 30 Days_mean': float(processed_features.iloc[i]['% Past Due > 30 Days_mean']),
                '% Past Due_mean': float(processed_features.iloc[i]['% Past Due_mean']),
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            records.append(record)
        
        # Store in MongoDB
        if collection is not None:
            collection.insert_many(records)
            logger.info(f"Stored {len(records)} predictions in MongoDB")
        else:
            raise HTTPException(status_code=500, detail="Database not connected")
        
        return PredictionResponse(
            success=True,
            message=f"Successfully processed and stored {len(records)} customer records",
            total_records=len(records),
            processed_at=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Processing failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)