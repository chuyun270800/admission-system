# 外國學生招生審查平台

這是一套外國學生招生審查平台，提供申請資料匯入、面試排程、教師評分、排名分析與錄取建議等流程。

## Required Environment

- Node.js
- Python 3.10+

## Main Features

- Excel import/export
- application management
- interview scheduling
- interview notification export
- teacher scoring
- ranking analysis
- admission recommendation

## Login Accounts

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Teacher | `teacher01` | `123456` |
| Teacher | `teacher02` | `123456` |

## Ports

- Backend port: `5006`
- Frontend URL: `http://localhost:3000`

## Install Dependencies

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Frontend:

```bash
npm install
```

## Reset Demo Users

This only creates or updates login users. It does not delete students, schedules, scores, or ranking data.

```bash
cd backend
source .venv/bin/activate
python reset_users.py
```

## Start Backend

```bash
cd backend
source .venv/bin/activate
python3 run.py
```

The backend runs at:

```text
http://127.0.0.1:5006
```

## Start Frontend

Open a second terminal:

```bash
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

## One-Command Start

Mac/Linux:

```bash
./start.sh
```

Windows:

```bat
start.bat
```

## Notes

- The frontend uses the React development proxy to call the backend on port `5006`.
- The default database is SQLite at `backend/instance/app.db`.
- Starting or resetting demo users will not delete database data.

## Deploy To Railway

This project can be deployed as one Railway web service. Flask serves both the `/api/...` backend routes and the production React build.

1. Push this project to GitHub.
2. In Railway, create a new project from the GitHub repository.
3. Railway will use `railway.json` to run:

```bash
npm install
npm run build
python3 -m pip install -r backend/requirements.txt
```

4. Railway will start the app with:

```bash
cd backend && python3 run.py
```

5. Flask reads Railway's `PORT` environment variable automatically. Locally it still defaults to port `5006`.
6. Open the public Railway URL. The website root `/` will show the React app, and API routes will continue to work under `/api/...`.

Railway login accounts:

- `admin` / `admin123`
- `teacher01` / `123456`
- `teacher02` / `123456`

Useful local production check:

```bash
npm run build
cd backend
python3 run.py
```

Then open:

```text
http://127.0.0.1:5006
```
