from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import torch
import torch.nn as nn
from torchvision.models import resnet18
from torchvision import transforms

from PIL import Image
import joblib
import pandas as pd
from datetime import datetime
import re

from xgboost import XGBRegressor


# ==========================================
# FastAPI App
# ==========================================

app = FastAPI(
    title="AI Car Price Prediction API",
    description="AI-Based Car Identification and Used Car Price Prediction",
    version="1.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Device
# ==========================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)


# ==========================================
# Load XGBoost Preprocessor
# ==========================================

preprocessor = joblib.load(
    "car_preprocessor.pkl"
)

print("Preprocessor loaded")


# ==========================================
# Load XGBoost Model
# ==========================================

xgb_model = XGBRegressor()

xgb_model.load_model(
    "car_price_xgb_model.json"
)

print("XGBoost model loaded")


# ==========================================
# Load CNN Model
# ==========================================

NUM_CLASSES = 196

cnn_model = resnet18(weights=None)

cnn_model.fc = nn.Linear(
    cnn_model.fc.in_features,
    NUM_CLASSES
)

cnn_model.load_state_dict(
    torch.load(
        "resnet18_car_classifier_epoch10.pth",
        map_location=device
    )
)

cnn_model = cnn_model.to(device)
cnn_model.eval()

print("CNN model loaded")


# ==========================================
# Load Class Names
# ==========================================

class_names = joblib.load(
    "car_class_names.pkl"
)

print("Class names loaded")


# ==========================================
# Image Transform
# ==========================================

image_transform = transforms.Compose([
    transforms.Resize((224, 224)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ==========================================
# Brand Mapping
# ==========================================

brand_mapping = {
    "Bmw": "BMW",
    "Mercedes": "Mercedes-Benz",
    "Audi": "Audi",
    "Toyota": "Toyota",
    "Honda": "Honda",
    "Hyundai": "Hyundai",
    "Volkswagen": "Volkswagen",
    "Suzuki": "Maruti",
    "Maruti": "Maruti",
    "Ford": "Ford",
    "Nissan": "Nissan",
    "Volvo": "Volvo",
    "Lexus": "Lexus",
    "Jaguar": "Jaguar",
    "Land": "Land Rover"
}


# ==========================================
# Health Check
# ==========================================

@app.get("/")
def home():

    return {
        "message": "AI Car Price Prediction API is running",
        "status": "success"
    }


# ==========================================
# Prediction API
# ==========================================

@app.post("/predict")
async def predict_car(

    image: UploadFile = File(...),

    year: int = Form(...),

    km_driven: float = Form(...),

    mileage: float = Form(...),

    engine: float = Form(...),

    max_power: float = Form(...),

    torque: float = Form(...),

    seats: int = Form(...),

    fuel: str = Form(...),

    seller_type: str = Form(...),

    transmission: str = Form(...),

    owner: str = Form(...)

):

    # ======================================
    # INPUT VALIDATION
    # ======================================

    # Dataset training year range
    if year < 1983 or year > 2026:
     raise HTTPException(
        status_code=400,
        detail="Car year must be between 1983 and 2026."
    )
    if km_driven < 0:
        raise HTTPException(
            status_code=400,
            detail="KM driven cannot be negative."
        )

    if mileage <= 0:
        raise HTTPException(
            status_code=400,
            detail="Mileage must be greater than 0."
        )

    if engine <= 0:
        raise HTTPException(
            status_code=400,
            detail="Engine capacity must be greater than 0."
        )

    if max_power <= 0:
        raise HTTPException(
            status_code=400,
            detail="Maximum power must be greater than 0."
        )

    if torque <= 0:
        raise HTTPException(
            status_code=400,
            detail="Torque must be greater than 0."
        )

    if seats < 1 or seats > 20:
        raise HTTPException(
            status_code=400,
            detail="Seats must be between 1 and 20."
        )


    # ======================================
    # READ IMAGE
    # ======================================

    try:

        img = Image.open(
            image.file
        ).convert("RGB")

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )


    # ======================================
    # CNN PREDICTION
    # ======================================

    image_tensor = image_transform(img)

    image_tensor = image_tensor.unsqueeze(0)

    image_tensor = image_tensor.to(device)


    with torch.no_grad():

        outputs = cnn_model(
            image_tensor
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

        confidence, predicted_class = torch.max(
            probabilities,
            dim=1
        )


    predicted_class = predicted_class.item()

    confidence = confidence.item() * 100


    # ======================================
    # GET FULL CNN CLASS NAME
    # ======================================

    predicted_model_full = class_names[
        predicted_class
    ]


    # ======================================
    # REMOVE YEAR FROM MODEL NAME
    # ======================================

    # Example:
    # "mclaren mp4-12c coupe 2012"
    #
    # becomes:
    # "mclaren mp4-12c coupe"

    predicted_model = re.sub(
        r"\s+\d{4}$",
        "",
        predicted_model_full
    )


    # ======================================
    # EXTRACT BRAND
    # ======================================

    raw_brand = (
        predicted_model
        .split()[0]
        .title()
    )


    brand = brand_mapping.get(
        raw_brand,
        raw_brand
    )


    # ======================================
    # FEATURE ENGINEERING
    # ======================================

    current_year = datetime.now().year

    car_age = max(
        0,
        current_year - year
    )


    km_per_year = (
        km_driven /
        (car_age + 1)
    )


    power_per_cc = (
        max_power / engine
        if engine > 0
        else 0
    )


    engine_per_seat = (
        engine / seats
        if seats > 0
        else 0
    )


    # ======================================
    # CREATE INPUT DATA
    # ======================================

    input_data = pd.DataFrame([{

        "year": year,

        "km_driven": km_driven,

        "mileage": mileage,

        "engine": engine,

        "max_power": max_power,

        "torque": torque,

        "seats": seats,

        "car_age": car_age,

        "km_per_year": km_per_year,

        "power_per_cc": power_per_cc,

        "engine_per_seat": engine_per_seat,

        "brand": brand,

        "fuel": fuel,

        "seller_type": seller_type,

        "transmission": transmission,

        "owner": owner

    }])


    # ======================================
    # PREPROCESS INPUT
    # ======================================

    processed_input = preprocessor.transform(
        input_data
    )


    # ======================================
    # XGBOOST PRICE PREDICTION
    # ======================================

    predicted_price = xgb_model.predict(
        processed_input
    )[0]


    # Prevent negative price
    predicted_price = max(
        0,
        predicted_price
    )


    # ======================================
    # CNN CONFIDENCE STATUS
    # ======================================

    if confidence >= 70:

        confidence_status = "High"

    elif confidence >= 50:

        confidence_status = "Medium"

    else:

        confidence_status = "Low"


    # ======================================
    # RESPONSE
    # ======================================

    return {

        "predicted_model": predicted_model,

        "brand": brand,

        "cnn_confidence": round(
            confidence,
            2
        ),

        "confidence_status": confidence_status,

        "predicted_price": round(
            float(predicted_price),
            2
        )

    }