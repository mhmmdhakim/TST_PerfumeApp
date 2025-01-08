FROM python:3.12-slim

# Install mongorestore tools
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
    && echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/5.0 main" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org-tools

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin file requirements.txt ke dalam container
COPY requirements.txt /app/requirements.txt
COPY backup /app/backup
COPY init-mongo.sh /app/init-mongo.sh

# Instal dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN chmod +x /app/init-mongo.sh

# Salin seluruh kode aplikasi
COPY . /app

# Expose port 8000
EXPOSE 8000

# Jalankan restore sebelum menjalankan uvicorn
CMD ["/bin/bash", "-c", "./init-mongo.sh && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
