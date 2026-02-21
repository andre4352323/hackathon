# UniBite Merged Project

This folder contains:

- `frontend/` (Html + CSS + React + Vite)
- `backend/` (Spring Boot + REST API + SQLite)

## Run backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`.

## Run frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and calls backend using `VITE_API_BASE_URL`.