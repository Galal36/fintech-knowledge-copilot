FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f /app/requirements.txt ]; then pip install --no-cache-dir -r /app/requirements.txt; fi

COPY . /app

CMD ["python", "-m", "app.main"]
