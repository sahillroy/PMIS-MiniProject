# Base Image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (None heavily required for simple SQLite/numpy, but keeping clean)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5000

# Command to run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
