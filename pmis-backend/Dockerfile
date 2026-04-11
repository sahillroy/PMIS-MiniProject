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

# Copy entrypoint and make executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 5000

# Seed on first run, then start gunicorn
ENTRYPOINT ["/entrypoint.sh"]
