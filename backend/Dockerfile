# Gunakan image Python
FROM python:3.12-slim

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

# Pastikan container menggunakan port yang sama dengan aplikasi backend
EXPOSE 8000

# Jalankan aplikasi menggunakan uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
