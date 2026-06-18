FROM python:3.11-slim

ENV PORT=5006

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE ${PORT}

CMD ["python", "run.py"]
