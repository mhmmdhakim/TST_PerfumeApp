# Gunakan image Python
FROM python:3.12-slim

# Tambahkan dependencies untuk mongorestore
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
    && echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/5.0 main" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org-tools

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin file requirements.txt ke dalam container
COPY requirements.txt /app/requirements.txt

# Pastikan pip diperbarui sebelum instalasi
RUN pip install --no-cache-dir --upgrade pip

# Instal dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Salin semua kode aplikasi ke dalam container
COPY . /app

COPY ./backend/backup /app/backup

# Salin skrip init-mongo.sh ke dalam container
COPY ./backend/init-mongo.sh /app/init-mongo.sh

# Pastikan skrip bisa dieksekusi
RUN chmod +x /app/init-mongo.sh

# Pastikan container menggunakan port yang sama dengan aplikasi backend
EXPOSE 8000

# Jalankan restore MongoDB terlebih dahulu, lalu aplikasi menggunakan uvicorn
CMD ["bash", "-c", "/app/init-mongo.sh && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
