# Use official Python slim image as base
FROM python:3.13.3-alpine3.21 

# Set environment variables to avoid bytecode and ensure stdout/stderr logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies (optional, depending on your packages)
RUN apk add --no-cache \
    build-base

# Set working directory
WORKDIR /app

# Install Python dependencies first (to leverage Docker layer caching)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy application code and model last (so they don’t invalidate cache often)
COPY main.py .
COPY risk_classification_model.pkl .

# Expose FastAPI port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
