# Smart Personal Finance Assistant (SPFA)

## Overview

Smart Personal Finance Assistant (SPFA) is a web-based personal finance management system designed to help users track income and expenses, upload transaction data, view financial summaries, and receive AI-powered budgeting insights. The system focuses on improving financial awareness by analysing user transactions and presenting spending patterns, smart budget suggestions, and financial guidance through an AI budgeting assistant.

The project was developed as a final-year software technology project using a FastAPI backend, MySQL database, and React frontend.

## Main Features

* User registration and login
* JWT-based authentication
* Role-based access for normal users and administrators
* Manual transaction management
* CSV transaction import
* Financial summary dashboard
* Spending category analysis
* Smart budget suggestions
* AI-generated budgeting advice
* AI financial coach chat
* Previous insight history
* Admin dashboard for user and system monitoring
* Simple read-only investments market viewer

## Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* MySQL
* PyMySQL
* Alembic
* Pydantic
* JWT authentication
* OpenAI API
* Alpha Vantage API

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router
* Recharts

## Project Structure

```text
SPFA/
├── backend/
│   ├── app/
│   │   ├── AI/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── alembic/
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── utils/
│   ├── package.json
│   └── README.md
│
└── README.md
```

## Environment Variables

Create a `.env` file inside the `backend/` folder.

```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/spfa_db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini

MARKET_API_PROVIDER=alpha_vantage
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

Do not push `.env` files to GitHub.

## Backend Setup

Open a terminal in the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open a terminal in the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## Main User Pages

* Dashboard
* Transactions
* AI Budgeting Insights
* Investments

## Admin Features

The admin dashboard allows administrators to monitor users, view system activity, review import batches, and manage user profiles.

## Notes

This project is intended for educational and academic purposes. SPFA provides financial tracking and AI-based budgeting support, but it does not perform banking operations, investment transactions, or professional financial advisory services.

## Author

Musab Irfan
BSc Computer Science – Software Technology
Middle East College, Oman
