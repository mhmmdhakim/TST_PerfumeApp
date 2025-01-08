FROM python:3.12-slim

# Install mongorestore
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
    && echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/5.0 main" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org-tools

WORKDIR /app

COPY requirements.txt /app/requirements.txt
COPY backup /app/backup
COPY init-mongo.sh /app/init-mongo.sh

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN chmod +x /app/init-mongo.sh

COPY . /app

EXPOSE 8000

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]