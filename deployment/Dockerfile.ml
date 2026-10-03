# ==========================================
# VedAI 2.0 - Python ML Emotion Microservice
# ==========================================
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MODEL_NAME=distilbert-base-multilingual-cased
ENV PORT=8001

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 vedaiml && useradd -u 1001 -g vedaiml -m vedaiml

COPY ml-services/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-services/ ./

# Pre-download and cache model weights during image build
RUN python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('$MODEL_NAME'); AutoModel.from_pretrained('$MODEL_NAME')"

RUN chown -R vedaiml:vedaiml /app
USER vedaiml

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
