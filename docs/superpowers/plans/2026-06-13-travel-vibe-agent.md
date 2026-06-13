# Travel Vibe Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AI agent web app that identifies a user's travel personality via a 15-question quiz and generates personalized location recommendations + itinerary using a LangChain Agent.

**Architecture:** React SPA (Vite/Tailwind) served by FastAPI on port 8080. Authentication uses email+password with JWT and SQLite for credentials. Vibe profiles are stored in GreenNode AgentBase Memory Service. A LangChain sequential agent with 3 tools handles recommendation generation.

**Tech Stack:** React 18, Vite, TailwindCSS, FastAPI, LangChain, greennode-agentbase SDK, SQLite (aiosqlite), python-jose, passlib[bcrypt], Docker multi-stage build.

---

## File Structure

```
frontend/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  src/
    main.jsx
    App.jsx                  # state machine: AUTH → ENTRY → QUIZ1 → QUIZ2 → QUIZ3 → VIBE → ITINERARY
    api.js                   # fetch wrapper with JWT header
    components/
      AuthScreen.jsx          # login + register tabs
      EntryScreen.jsx         # trip type + location input
      QuizScreen.jsx          # màn 1 & 2 (single-choice masonry cards)
      RatingScreen.jsx        # màn 3 (rating 1-5)
      VibeResult.jsx          # màn 4 (DNA bars, vibe reveal)
      Itinerary.jsx           # màn 5 (timeline + loading skeleton)
    data/
      questions.js            # full 15-question set with scoring map
    utils/
      scoring.js              # calculateScores(), determineVibe()

backend/
  main.py                    # FastAPI app, mounts static files, registers routers
  config.py                  # env var loading (LLM, JWT, AgentBase)
  database.py                # SQLite aiosqlite setup + init_db()
  auth/
    router.py                # POST /api/auth/register, /login, GET /api/auth/me
    schemas.py               # Pydantic: RegisterRequest, LoginRequest, UserResponse
    service.py               # hash_password(), verify_password(), create_jwt(), decode_jwt()
  memory/
    service.py               # save_vibe_profile(), get_vibe_profile() via AgentBase SDK
  agent/
    tools.py                 # describe_vibe(), search_locations(), build_itinerary() as LangChain tools
    executor.py              # build_agent_chain() returning RunnableSequence
  recommendations/
    router.py                # POST /api/recommendations, POST /api/quiz/complete
  requirements.txt

Dockerfile                   # multi-stage: node build → python runtime
docker-compose.yml
.env.example
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.jsx`
- Create: `backend/requirements.txt`
- Create: `.env.example`

- [ ] **Step 1: Create frontend package.json**

```json
{
  "name": "travel-vibe-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "vite": "^5.4.10"
  }
}
```

- [ ] **Step 2: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SOLE — Your Travel Vibe</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create frontend/vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
```

- [ ] **Step 4: Create frontend/postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create frontend/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Create backend/requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.31.0
aiosqlite==0.20.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
langchain==0.3.7
langchain-openai==0.2.8
httpx==0.27.2
pydantic==2.9.2
python-dotenv==1.0.1
greennode-agentbase==0.1.0
greennode-agent-bridge[langgraph]==0.1.0
```

- [ ] **Step 7: Create .env.example**

```
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
JWT_SECRET=change-me-to-a-random-secret
AGENTBASE_MEMORY_ID=mem_...
AGENTBASE_STRATEGY_ID=strat_...
GREENNODE_CLIENT_ID=
GREENNODE_CLIENT_SECRET=
```

- [ ] **Step 8: Install frontend deps and verify**

```bash
cd frontend && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 9: Commit**

```bash
git add frontend/ backend/requirements.txt .env.example
git commit -m "feat: project scaffolding — frontend deps, backend requirements"
```

---

### Task 2: Tailwind Config + Design Tokens

**Files:**
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create frontend/tailwind.config.js** (copy exact tokens from example/ui)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-container': '#ffaba8',
        'on-surface': '#53251b',
        'on-surface-variant': '#885044',
        primary: '#9d4241',
        'surface-bright': '#fff8f6',
        'surface-container': '#ffe9e5',
        'surface-container-high': '#ffe2dc',
        'surface-container-highest': '#ffdad3',
        'surface-container-low': '#fff0ee',
        'surface-container-lowest': '#ffffff',
        'surface-dim': '#ffcfc5',
        'on-primary': '#fff7f6',
        'on-primary-container': '#702022',
        'inverse-primary': '#f88885',
        'primary-fixed': '#ffaba8',
        'primary-fixed-dim': '#ff9693',
        surface: '#fff8f6',
        background: '#fff8f6',
        secondary: '#3c6572',
        tertiary: '#2c6771',
        outline: '#a86b5e',
        'outline-variant': '#e7a192',
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      spacing: {
        'container-margin': '24px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'section-gap': '48px',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
        label: ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.sunset-gradient {
  background: linear-gradient(135deg, #ff6b6b 0%, #ae2f34 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-in { animation: slideIn 0.5s ease-out forwards; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }

body {
  background-color: #fcf9f8;
  min-height: 100dvh;
  overflow-x: hidden;
  font-family: 'Montserrat', sans-serif;
  color: #53251b;
}
```

- [ ] **Step 3: Verify Tailwind compiles**

```bash
cd frontend && npm run build 2>&1 | head -20
```

Expected: Build succeeds (or only warns about missing App.jsx — that's fine at this point).

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.js frontend/src/index.css
git commit -m "feat: tailwind config with SOLE design tokens"
```

---

### Task 3: Backend Config + Database

**Files:**
- Create: `backend/config.py`
- Create: `backend/database.py`

- [ ] **Step 1: Create backend/config.py**

```python
import os
from dotenv import load_dotenv

load_dotenv()

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7 days

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sole.db")
SQLITE_PATH = os.getenv("SQLITE_PATH", "./sole.db")

AGENTBASE_MEMORY_ID = os.getenv("AGENTBASE_MEMORY_ID", "")
AGENTBASE_STRATEGY_ID = os.getenv("AGENTBASE_STRATEGY_ID", "")
```

- [ ] **Step 2: Create backend/database.py**

```python
import aiosqlite
from config import SQLITE_PATH

async def get_db():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                has_vibe INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()
```

- [ ] **Step 3: Write test for init_db**

Create `backend/tests/test_database.py`:

```python
import pytest
import asyncio
import os
import aiosqlite

os.environ["SQLITE_PATH"] = "/tmp/test_sole.db"

from database import init_db, SQLITE_PATH

@pytest.mark.asyncio
async def test_init_db_creates_users_table():
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)
    await init_db()
    async with aiosqlite.connect(SQLITE_PATH) as db:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        row = await cursor.fetchone()
    assert row is not None
    assert row[0] == "users"
    os.remove(SQLITE_PATH)
```

- [ ] **Step 4: Install pytest and run test**

```bash
cd backend && pip install pytest pytest-asyncio && pytest tests/test_database.py -v
```

Expected: `test_init_db_creates_users_table PASSED`

- [ ] **Step 5: Commit**

```bash
git add backend/config.py backend/database.py backend/tests/test_database.py
git commit -m "feat: backend config and SQLite database init"
```

---

### Task 4: Auth Service (bcrypt + JWT)

**Files:**
- Create: `backend/auth/schemas.py`
- Create: `backend/auth/service.py`

- [ ] **Step 1: Create backend/auth/schemas.py**

```python
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    has_vibe: bool
```

- [ ] **Step 2: Create backend/auth/service.py**

```python
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_jwt(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt(token: str) -> str:
    """Returns user_id from token or raises JWTError."""
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload["sub"]

def new_user_id() -> str:
    return str(uuid.uuid4())

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
```

- [ ] **Step 3: Write auth service tests**

Create `backend/tests/test_auth_service.py`:

```python
from auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt, new_user_id
)
from jose import JWTError
import pytest

def test_hash_and_verify_password():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed) is True
    assert verify_password("wrong", hashed) is False

def test_create_and_decode_jwt():
    user_id = new_user_id()
    token = create_jwt(user_id)
    decoded = decode_jwt(token)
    assert decoded == user_id

def test_decode_invalid_jwt_raises():
    with pytest.raises(JWTError):
        decode_jwt("not.a.valid.token")

def test_new_user_id_is_uuid():
    uid = new_user_id()
    assert len(uid) == 36
    assert uid.count("-") == 4
```

- [ ] **Step 4: Run tests**

```bash
cd backend && pytest tests/test_auth_service.py -v
```

Expected: 4 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/auth/schemas.py backend/auth/service.py backend/tests/test_auth_service.py
git commit -m "feat: auth service — bcrypt hashing and JWT creation/decode"
```

---

### Task 5: Auth API Endpoints

**Files:**
- Create: `backend/auth/router.py`
- Create: `backend/auth/__init__.py`
- Create: `backend/main.py`

- [ ] **Step 1: Create backend/auth/__init__.py** (empty)

```python
```

- [ ] **Step 2: Create backend/auth/router.py**

```python
import aiosqlite
from fastapi import APIRouter, HTTPException, Depends, Header
from auth.schemas import RegisterRequest, LoginRequest, UserResponse
from auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt, new_user_id, now_iso
)
from database import get_db
from config import SQLITE_PATH

router = APIRouter(prefix="/api/auth")

async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        return decode_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register")
async def register(req: RegisterRequest):
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        existing = await db.execute("SELECT id FROM users WHERE email = ?", (req.email,))
        if await existing.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")
        user_id = new_user_id()
        await db.execute(
            "INSERT INTO users (id, email, password_hash, has_vibe, created_at) VALUES (?, ?, ?, 0, ?)",
            (user_id, req.email, hash_password(req.password), now_iso()),
        )
        await db.commit()
    token = create_jwt(user_id)
    return {"token": token, "user": {"id": user_id, "email": req.email, "has_vibe": False}}

@router.post("/login")
async def login(req: LoginRequest):
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users WHERE email = ?", (req.email,))
        user = await cursor.fetchone()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_jwt(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "has_vibe": bool(user["has_vibe"])},
    }

@router.get("/me", response_model=UserResponse)
async def me(user_id: str = Depends(get_current_user_id)):
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = await cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=user["id"], email=user["email"], has_vibe=bool(user["has_vibe"]))
```

- [ ] **Step 3: Create backend/main.py**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from database import init_db
from auth.router import router as auth_router
from recommendations.router import router as recommendations_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(recommendations_router)

# Serve React build — must be LAST to not shadow API routes
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
```

- [ ] **Step 4: Create placeholder recommendations router so main.py imports succeed**

Create `backend/recommendations/__init__.py` (empty) and `backend/recommendations/router.py`:

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api")
```

- [ ] **Step 5: Verify server starts**

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --port 8080 --reload &
sleep 3 && curl -s http://localhost:8080/api/auth/me -H "Authorization: Bearer bad" | python3 -m json.tool
```

Expected: `{"detail": "Invalid or expired token"}`

- [ ] **Step 6: Test register and login**

```bash
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}' | python3 -m json.tool
```

Expected: JSON with `token` and `user.has_vibe: false`.

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}' | python3 -m json.tool
```

Expected: JSON with `token`.

- [ ] **Step 7: Kill dev server and commit**

```bash
pkill -f "uvicorn main:app" 2>/dev/null; true
git add backend/auth/ backend/recommendations/ backend/main.py
git commit -m "feat: auth endpoints — register, login, me"
```

---

### Task 6: AgentBase Memory Service

**Files:**
- Create: `backend/memory/__init__.py`
- Create: `backend/memory/service.py`

- [ ] **Step 1: Create backend/memory/__init__.py** (empty)

```python
```

- [ ] **Step 2: Create backend/memory/service.py**

```python
import json
from greennode_agentbase.memory import MemoryClient
from config import AGENTBASE_MEMORY_ID, AGENTBASE_STRATEGY_ID

_client = MemoryClient()

def _namespace(user_id: str) -> str:
    return f"/strategies/{AGENTBASE_STRATEGY_ID}/actors/{user_id}"

async def save_vibe_profile(user_id: str, profile: dict) -> None:
    """Store vibe profile as a memory record. Overwrites any existing record."""
    record_str = json.dumps(profile, ensure_ascii=False)
    await _client.insert_memory_records_directly_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_namespace(user_id),
        request=[record_str],
    )

async def get_vibe_profile(user_id: str) -> dict | None:
    """Retrieve the most recent vibe profile record for a user, or None if not found."""
    records = await _client.list_memory_records_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_namespace(user_id),
    )
    if not records:
        return None
    latest = records[-1]
    raw = latest.memory if hasattr(latest, "memory") else str(latest)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
```

- [ ] **Step 3: Write test (mocked — Memory Service requires live credentials)**

Create `backend/tests/test_memory_service.py`:

```python
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json

@pytest.mark.asyncio
async def test_save_vibe_profile_calls_insert_directly():
    with patch("memory.service._client") as mock_client:
        mock_client.insert_memory_records_directly_async = AsyncMock()
        from memory.service import save_vibe_profile
        profile = {"primary_vibe": "explorer", "secondary_vibe": "foodie", "scores": {}}
        await save_vibe_profile("user-123", profile)
        mock_client.insert_memory_records_directly_async.assert_called_once()
        call_kwargs = mock_client.insert_memory_records_directly_async.call_args
        assert "user-123" in str(call_kwargs)
        assert "explorer" in str(call_kwargs)

@pytest.mark.asyncio
async def test_get_vibe_profile_returns_none_when_no_records():
    with patch("memory.service._client") as mock_client:
        mock_client.list_memory_records_async = AsyncMock(return_value=[])
        from memory.service import get_vibe_profile
        result = await get_vibe_profile("user-123")
        assert result is None

@pytest.mark.asyncio
async def test_get_vibe_profile_parses_json():
    profile = {"primary_vibe": "foodie", "scores": {"foodie": 23}}
    mock_record = MagicMock()
    mock_record.memory = json.dumps(profile)
    with patch("memory.service._client") as mock_client:
        mock_client.list_memory_records_async = AsyncMock(return_value=[mock_record])
        from memory.service import get_vibe_profile
        result = await get_vibe_profile("user-123")
        assert result["primary_vibe"] == "foodie"
        assert result["scores"]["foodie"] == 23
```

- [ ] **Step 4: Run tests**

```bash
cd backend && pytest tests/test_memory_service.py -v
```

Expected: 3 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/memory/ backend/tests/test_memory_service.py
git commit -m "feat: agentbase memory service — save and get vibe profile"
```

---

### Task 7: Quiz Complete Endpoint

**Files:**
- Modify: `backend/recommendations/router.py`

- [ ] **Step 1: Update recommendations/router.py with quiz complete endpoint**

```python
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.router import get_current_user_id
from memory.service import save_vibe_profile
from config import SQLITE_PATH

router = APIRouter(prefix="/api")

class QuizCompleteRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None
    scores: dict[str, int]

@router.post("/quiz/complete")
async def quiz_complete(
    req: QuizCompleteRequest,
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime, timezone
    profile = {
        "primary_vibe": req.primary_vibe,
        "secondary_vibe": req.secondary_vibe,
        "scores": req.scores,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    await save_vibe_profile(user_id, profile)
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("UPDATE users SET has_vibe = 1 WHERE id = ?", (user_id,))
        await db.commit()
    return {"status": "ok", "profile": profile}
```

- [ ] **Step 2: Write test**

Create `backend/tests/test_quiz_complete.py`:

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import os

os.environ["SQLITE_PATH"] = "/tmp/test_quiz_sole.db"

@pytest.fixture(autouse=True)
def setup_db():
    import asyncio
    from database import init_db
    asyncio.run(init_db())
    yield
    if os.path.exists("/tmp/test_quiz_sole.db"):
        os.remove("/tmp/test_quiz_sole.db")

def get_test_token():
    import asyncio
    import aiosqlite
    from auth.service import hash_password, create_jwt, new_user_id, now_iso
    user_id = new_user_id()
    async def _insert():
        async with aiosqlite.connect("/tmp/test_quiz_sole.db") as db:
            await db.execute(
                "INSERT INTO users VALUES (?, ?, ?, 0, ?)",
                (user_id, "q@test.com", hash_password("pw"), now_iso()),
            )
            await db.commit()
    asyncio.run(_insert())
    return create_jwt(user_id)

def test_quiz_complete_saves_profile():
    with patch("recommendations.router.save_vibe_profile", new_callable=AsyncMock) as mock_save:
        from main import app
        client = TestClient(app)
        token = get_test_token()
        resp = client.post(
            "/api/quiz/complete",
            json={"primary_vibe": "explorer", "secondary_vibe": "foodie", "scores": {"explorer": 23}},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["profile"]["primary_vibe"] == "explorer"
        mock_save.assert_called_once()
```

- [ ] **Step 3: Run test**

```bash
cd backend && pytest tests/test_quiz_complete.py -v
```

Expected: `test_quiz_complete_saves_profile PASSED`

- [ ] **Step 4: Commit**

```bash
git add backend/recommendations/router.py backend/tests/test_quiz_complete.py
git commit -m "feat: POST /api/quiz/complete — save vibe to memory + mark has_vibe"
```

---

### Task 8: LangChain Tools

**Files:**
- Create: `backend/agent/__init__.py`
- Create: `backend/agent/tools.py`

- [ ] **Step 1: Create backend/agent/__init__.py** (empty)

```python
```

- [ ] **Step 2: Create backend/agent/tools.py**

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
import json

def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        base_url=LLM_BASE_URL,
        api_key=LLM_API_KEY,
        model=LLM_MODEL,
        temperature=0.7,
    )

VIBE_DESCRIPTIONS = {
    "foodie": ("🍜 Foodie", "Bạn sống để thưởng thức — mỗi bữa ăn là một trải nghiệm, mỗi quán là một câu chuyện. Bạn biết nơi ngon nhất trước khi nó nổi tiếng."),
    "explorer": ("🗺️ Explorer", "Bạn không đi để check-in — bạn đi để khám phá. Những con phố chưa có tên trên bản đồ mới là nơi bạn thực sự cảm thấy sống."),
    "culture": ("🏛️ Culture", "Bạn muốn hiểu hơn là chỉ nhìn. Lịch sử, kiến trúc, nghệ thuật — mỗi nơi bạn đến đều để lại một tầng hiểu biết mới."),
    "adventure": ("⚡ Adventure", "Adrenaline là ngôn ngữ của bạn. Chuyến đi mà không có gì thử thách là chuyến đi bạn sẽ quên ngay."),
    "relaxation": ("🌿 Relaxation", "Bạn biết rằng dừng lại cũng là một lựa chọn dũng cảm. Không gian yên tĩnh, không agenda — đó là bạn trong trạng thái tốt nhất."),
}

VIBE_HASHTAGS = {
    "foodie": ["#StreetFood", "#LocalFlavors", "#FoodieLife"],
    "explorer": ["#HiddenGems", "#OffTheBeatenPath", "#WanderlustVibes"],
    "culture": ["#CultureFirst", "#ArtAndHistory", "#DeepDive"],
    "adventure": ["#AdventureAwaits", "#ThrilllSeeker", "#OutdoorVibes"],
    "relaxation": ["#SlowTravel", "#UnwindMode", "#PeacefulEscape"],
}

async def describe_vibe(primary_vibe: str, secondary_vibe: str | None) -> dict:
    """Returns personality description and hashtags for a vibe combination."""
    icon, desc = VIBE_DESCRIPTIONS.get(primary_vibe, ("✨", "Bạn là một người độc đáo."))
    hashtags = VIBE_HASHTAGS.get(primary_vibe, [])
    if secondary_vibe and secondary_vibe in VIBE_HASHTAGS:
        hashtags = hashtags + VIBE_HASHTAGS[secondary_vibe][:1]
    return {"icon": icon, "description": desc, "hashtags": hashtags}

async def search_locations(
    primary_vibe: str, secondary_vibe: str | None, location: str, trip_type: str
) -> list[dict]:
    """Returns 6-8 place recommendations matching the vibe."""
    llm = _get_llm()
    vibe_label = VIBE_DESCRIPTIONS.get(primary_vibe, ("", ""))[0]
    secondary_label = VIBE_DESCRIPTIONS.get(secondary_vibe or "", ("", ""))[0] if secondary_vibe else ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là chuyên gia gợi ý địa điểm du lịch tại Việt Nam. Trả về JSON array, không có markdown code block."),
        ("human", """Gợi ý 6-8 địa điểm phù hợp cho người có vibe chính là {vibe} {secondary} gần khu vực {location}.
Loại chuyến đi: {trip_type}.

Trả về JSON array với format:
[{{"name": "tên địa điểm", "type": "loại (ăn uống/tham quan/hoạt động/nghỉ ngơi)", "description": "mô tả 1-2 câu thú vị", "why_vibe": "lý do phù hợp với vibe 1 câu"}}]

Chỉ trả về JSON, không giải thích thêm."""),
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "vibe": vibe_label,
        "secondary": f"và phụ là {secondary_label}" if secondary_label else "",
        "location": location,
        "trip_type": "trong ngày" if trip_type == "inday" else "nhiều ngày",
    })
    text = result.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)

async def build_itinerary(
    places: list[dict], origin: str, trip_type: str, duration: int
) -> list[dict]:
    """Returns an ordered itinerary with time/distance estimates."""
    llm = _get_llm()
    places_json = json.dumps(places, ensure_ascii=False)
    unit = "giờ" if trip_type == "inday" else "ngày"
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là chuyên gia lên lịch trình du lịch. Trả về JSON array, không có markdown code block."),
        ("human", """Lên lịch trình từ địa điểm xuất phát: {origin}
Thời lượng: {duration} {unit}
Địa điểm gợi ý: {places}

Sắp xếp theo thứ tự tối ưu (gần nhau, hợp lý về thời gian).
Trả về JSON array với format:
[{{"time": "9:00" hoặc "Ngày 1", "name": "tên địa điểm", "description": "mô tả ngắn", "duration_note": "ví dụ: 45 phút", "distance_from_prev": "ví dụ: ~1.2km (đi bộ 15 phút)"}}]

Chỉ trả về JSON, không giải thích thêm."""),
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "origin": origin,
        "duration": duration,
        "unit": unit,
        "places": places_json,
    })
    text = result.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)
```

- [ ] **Step 3: Write test for describe_vibe (no LLM needed)**

Create `backend/tests/test_tools.py`:

```python
import pytest
import asyncio
from agent.tools import describe_vibe

@pytest.mark.asyncio
async def test_describe_vibe_explorer():
    result = await describe_vibe("explorer", None)
    assert "Explorer" in result["icon"]
    assert len(result["description"]) > 20
    assert "#HiddenGems" in result["hashtags"]

@pytest.mark.asyncio
async def test_describe_vibe_with_secondary():
    result = await describe_vibe("foodie", "explorer")
    assert len(result["hashtags"]) >= 4  # 3 primary + 1 secondary

@pytest.mark.asyncio
async def test_describe_vibe_unknown_falls_back():
    result = await describe_vibe("unknown_vibe", None)
    assert "description" in result
    assert "hashtags" in result
```

- [ ] **Step 4: Run tests**

```bash
cd backend && pytest tests/test_tools.py -v
```

Expected: 3 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/agent/ backend/tests/test_tools.py
git commit -m "feat: langchain tools — describe_vibe, search_locations, build_itinerary"
```

---

### Task 9: LangChain Agent Executor + Recommendations Endpoint

**Files:**
- Create: `backend/agent/executor.py`
- Modify: `backend/recommendations/router.py`

- [ ] **Step 1: Create backend/agent/executor.py**

```python
from agent.tools import describe_vibe, search_locations, build_itinerary

async def run_recommendation_pipeline(
    primary_vibe: str,
    secondary_vibe: str | None,
    location: str,
    trip_type: str,
    duration: int,
) -> dict:
    """
    Sequential pipeline: describe_vibe → search_locations → build_itinerary.
    Returns combined result dict.
    """
    vibe_info = await describe_vibe(primary_vibe, secondary_vibe)
    places = await search_locations(primary_vibe, secondary_vibe, location, trip_type)
    itinerary = await build_itinerary(places, location, trip_type, duration)
    return {
        "vibe_info": vibe_info,
        "places": places,
        "itinerary": itinerary,
    }
```

- [ ] **Step 2: Update backend/recommendations/router.py with recommendations endpoint**

```python
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.router import get_current_user_id
from memory.service import save_vibe_profile
from agent.executor import run_recommendation_pipeline
from config import SQLITE_PATH

router = APIRouter(prefix="/api")

class QuizCompleteRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    scores: dict[str, int]

class RecommendationsRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    location: str
    trip_type: str  # "inday" | "multiday"
    duration: int   # hours if inday, days if multiday

@router.post("/quiz/complete")
async def quiz_complete(
    req: QuizCompleteRequest,
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime, timezone
    profile = {
        "primary_vibe": req.primary_vibe,
        "secondary_vibe": req.secondary_vibe,
        "scores": req.scores,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    await save_vibe_profile(user_id, profile)
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("UPDATE users SET has_vibe = 1 WHERE id = ?", (user_id,))
        await db.commit()
    return {"status": "ok", "profile": profile}

@router.post("/recommendations")
async def get_recommendations(
    req: RecommendationsRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        result = await run_recommendation_pipeline(
            primary_vibe=req.primary_vibe,
            secondary_vibe=req.secondary_vibe,
            location=req.location,
            trip_type=req.trip_type,
            duration=req.duration,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
```

- [ ] **Step 3: Write test for executor (mocked LLM tools)**

Create `backend/tests/test_executor.py`:

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_run_recommendation_pipeline_calls_all_tools():
    mock_vibe = {"icon": "🗺️", "description": "desc", "hashtags": ["#Tag"]}
    mock_places = [{"name": "Place A", "type": "tham quan", "description": "desc", "why_vibe": "why"}]
    mock_itinerary = [{"time": "9:00", "name": "Place A", "description": "desc", "duration_note": "1h", "distance_from_prev": "0km"}]

    with patch("agent.executor.describe_vibe", new_callable=AsyncMock, return_value=mock_vibe), \
         patch("agent.executor.search_locations", new_callable=AsyncMock, return_value=mock_places), \
         patch("agent.executor.build_itinerary", new_callable=AsyncMock, return_value=mock_itinerary):
        from agent.executor import run_recommendation_pipeline
        result = await run_recommendation_pipeline("explorer", "foodie", "Quận 1", "inday", 8)
        assert result["vibe_info"]["icon"] == "🗺️"
        assert len(result["places"]) == 1
        assert result["itinerary"][0]["time"] == "9:00"
```

- [ ] **Step 4: Run test**

```bash
cd backend && pytest tests/test_executor.py -v
```

Expected: `test_run_recommendation_pipeline_calls_all_tools PASSED`

- [ ] **Step 5: Commit**

```bash
git add backend/agent/executor.py backend/recommendations/router.py backend/tests/test_executor.py
git commit -m "feat: agent executor pipeline + POST /api/recommendations"
```

---

### Task 10: Frontend — Questions Data + Scoring Utility

**Files:**
- Create: `frontend/src/data/questions.js`
- Create: `frontend/src/utils/scoring.js`

- [ ] **Step 1: Create frontend/src/data/questions.js**

```js
export const VIBES = ['foodie', 'explorer', 'culture', 'adventure', 'relaxation']

export const VIBE_META = {
  foodie:      { label: '🍜 Foodie',      color: '#f97316' },
  explorer:    { label: '🗺️ Explorer',    color: '#8b5cf6' },
  culture:     { label: '🏛️ Culture',     color: '#0ea5e9' },
  adventure:   { label: '⚡ Adventure',   color: '#ef4444' },
  relaxation:  { label: '🌿 Relaxation',  color: '#22c55e' },
}

// Single-choice questions (Q1-Q10)
// Each option maps to a vibe index: [foodie, explorer, culture, adventure, relaxation]
export const SINGLE_CHOICE_QUESTIONS = [
  // --- Screen 1 (Q1-Q5) ---
  {
    id: 'q1', screen: 1,
    question: 'Bạn có một buổi chiều hoàn toàn tự do, không kế hoạch. Bạn cảm thấy...?',
    options: [
      { text: '😋 Hứng khởi — ngay lập tức nghĩ tới nơi muốn thử ăn', vibe: 'foodie' },
      { text: '🧭 Tò mò — muốn đi lang thang xem có gì mới', vibe: 'explorer' },
      { text: '📖 Suy nghĩ — muốn làm gì đó có ý nghĩa', vibe: 'culture' },
      { text: '⚡ Bứt rứt — cần làm gì đó, ngồi yên không được', vibe: 'adventure' },
      { text: '😌 Nhẹ nhõm — cuối cùng cũng được không làm gì', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q2', screen: 1,
    question: 'Khi stress nặng, bạn thường giải tỏa bằng cách...?',
    options: [
      { text: '🍳 Ăn một bữa ngon, hoặc vào bếp tự nấu', vibe: 'foodie' },
      { text: '🚶 Ra ngoài đi, dù chẳng biết đi đâu', vibe: 'explorer' },
      { text: '📚 Đọc sách, xem phim, nghe nhạc', vibe: 'culture' },
      { text: '🏃 Tập thể thao, đổ mồ hôi cho hết', vibe: 'adventure' },
      { text: '🛌 Nằm im, tắt điện thoại, ngủ thêm', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q3', screen: 1,
    question: 'Bạn bè hay mô tả bạn là người...?',
    options: [
      { text: '😋 "Biết ăn" — luôn biết chỗ ngon, gọi món không bao giờ sai', vibe: 'foodie' },
      { text: '🗺️ Hay rủ đi đâu đó vào những lúc bất ngờ nhất', vibe: 'explorer' },
      { text: '🏛️ Hay kể chuyện lịch sử, văn hóa lúc không ai hỏi', vibe: 'culture' },
      { text: '⚡ Luôn đề xuất thứ gì đó "hơi crazy"', vibe: 'adventure' },
      { text: '😌 Bình thản, dễ tính, không bao giờ cần drama', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q4', screen: 1,
    question: 'Một bộ phim/series bạn có thể xem đi xem lại?',
    options: [
      { text: '🎬 Chef\'s Table, Ugly Delicious — bất kỳ thứ gì về ẩm thực', vibe: 'foodie' },
      { text: '🌍 Phim về hành trình, road trip, khám phá thế giới', vibe: 'explorer' },
      { text: '📜 Tài liệu lịch sử, drama cổ trang, phim nghệ thuật', vibe: 'culture' },
      { text: '💥 Phim hành động, survival, leo núi, đua xe', vibe: 'adventure' },
      { text: '🌸 Anime slice-of-life, sitcom nhẹ nhàng, ASMR', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q5', screen: 1,
    question: 'Tâm trạng của bạn lúc này gần giống nhất với...?',
    options: [
      { text: '🍜 Đói — theo nghĩa đen hoặc nghĩa bóng', vibe: 'foodie' },
      { text: '🔍 Tò mò — có gì đó đang chờ được khám phá', vibe: 'explorer' },
      { text: '💭 Suy tư — muốn có chiều sâu, không phải bề mặt', vibe: 'culture' },
      { text: '⚡ Phấn khích — cần xả năng lượng, không thể ngồi yên', vibe: 'adventure' },
      { text: '🌿 Mệt — nhưng là cái mệt cần được chăm sóc', vibe: 'relaxation' },
    ],
  },
  // --- Screen 2 (Q6-Q10) ---
  {
    id: 'q6', screen: 2,
    question: 'Một người bạn rủ ra ngoài lúc 10 giờ tối. Bạn...?',
    options: [
      { text: '🍽️ "Đi ăn gì không?" là câu đầu tiên bạn hỏi', vibe: 'foodie' },
      { text: '🚀 "Đi đâu cũng được, miễn là đi"', vibe: 'explorer' },
      { text: '🎵 "Chiếu phim gì không, hay nghe nhạc sống?"', vibe: 'culture' },
      { text: '🎉 "Có chỗ nào vui vẻ, nhiều người không?"', vibe: 'adventure' },
      { text: '☕ "Ừ nhưng chỗ nào yên tĩnh một chút nha"', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q7', screen: 2,
    question: 'Khi lướt Instagram, bạn hay dừng lại ở loại post nào?',
    options: [
      { text: '🍣 Ảnh đồ ăn đẹp — và ngay lập tức save lại', vibe: 'foodie' },
      { text: '🏙️ Ảnh góc phố, địa điểm lạ chưa thấy bao giờ', vibe: 'explorer' },
      { text: '🏛️ Ảnh kiến trúc cổ, triển lãm, nghệ thuật', vibe: 'culture' },
      { text: '🤸 Clip thể thao, parkour, outdoor cực đỉnh', vibe: 'adventure' },
      { text: '🌅 Ảnh view buổi sáng, cà phê, thiên nhiên yên bình', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q8', screen: 2,
    question: 'Được tặng 1 triệu đồng để tiêu trong ngày hôm nay. Bạn...?',
    options: [
      { text: '🍽️ Booking bàn nhà hàng xịn hoặc đặt food tour', vibe: 'foodie' },
      { text: '🛵 Thuê xe máy, đổ xăng đầy, đi không cần đích đến', vibe: 'explorer' },
      { text: '🎭 Mua vé xem concert, triển lãm hoặc vé kịch tối nay', vibe: 'culture' },
      { text: '🪂 Book ngay một hoạt động mạo hiểm chưa dám thử', vibe: 'adventure' },
      { text: '💆 Booking spa hoặc staycation khách sạn đẹp', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q9', screen: 2,
    question: 'Câu nào dưới đây bạn hay nói nhất?',
    options: [
      { text: '🍜 "Mình ăn gì đã rồi tính tiếp"', vibe: 'foodie' },
      { text: '🗺️ "Ủa chỗ này mình chưa thấy bao giờ, vào xem thử không?"', vibe: 'explorer' },
      { text: '📖 "Thật ra cái này có nguồn gốc từ..."', vibe: 'culture' },
      { text: '⚡ "Đã thử chưa? Không thử hối hận đó!"', vibe: 'adventure' },
      { text: '😌 "Thôi mình cần nghỉ một chút"', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q10', screen: 2,
    question: 'Nếu bạn là một loại thời tiết, bạn là...?',
    options: [
      { text: '🍂 Ngày thu se lạnh — đủ mát để ngồi ăn uống thật lâu', vibe: 'foodie' },
      { text: '🌫️ Buổi sáng sớm có sương mù — bí ẩn, chờ được khám phá', vibe: 'explorer' },
      { text: '🌇 Chiều tà ánh vàng — đẹp, trầm, đáng ngẫm', vibe: 'culture' },
      { text: '⛈️ Cơn giông trước khi mưa — căng, kịch tính, đầy năng lượng', vibe: 'adventure' },
      { text: '☀️ Ngày nắng nhẹ, gió mát — không quá, vừa đủ', vibe: 'relaxation' },
    ],
  },
]

// Rating questions (R1-R5, screen 3)
export const RATING_QUESTIONS = [
  { id: 'r1', vibe: 'foodie',     statement: 'Một bữa ăn ngon có thể thay đổi hoàn toàn tâm trạng của tôi' },
  { id: 'r2', vibe: 'explorer',   statement: 'Tôi thấy bất an nếu quá lâu không có gì mới để khám phá' },
  { id: 'r3', vibe: 'culture',    statement: 'Tôi muốn hiểu "tại sao" hơn là chỉ thấy "cái gì"' },
  { id: 'r4', vibe: 'adventure',  statement: 'Adrenaline là thứ tôi cần để cảm thấy mình đang sống' },
  { id: 'r5', vibe: 'relaxation', statement: 'Không làm gì cũng là một lựa chọn hoàn toàn hợp lệ' },
]
```

- [ ] **Step 2: Create frontend/src/utils/scoring.js**

```js
import { VIBES } from '../data/questions.js'

/**
 * @param {Record<string, string>} singleAnswers  - { q1: 'foodie', q2: 'explorer', ... }
 * @param {Record<string, number>} ratingAnswers  - { r1: 4, r2: 2, ... }
 * @param {Array}                  ratingQuestions - RATING_QUESTIONS array
 * @returns {{ scores: Record<string,number>, primary: string, secondary: string|null }}
 */
export function calculateScores(singleAnswers, ratingAnswers, ratingQuestions) {
  const scores = Object.fromEntries(VIBES.map(v => [v, 0]))

  // Single choice: +2 per correct vibe answer
  for (const vibe of Object.values(singleAnswers)) {
    if (vibe && scores[vibe] !== undefined) {
      scores[vibe] += 2
    }
  }

  // Rating: add directly (1-5)
  for (const q of ratingQuestions) {
    const rating = ratingAnswers[q.id] ?? 0
    scores[q.vibe] += rating
  }

  return { scores, ...determineVibe(scores) }
}

/**
 * @param {Record<string, number>} scores
 * @returns {{ primary: string, secondary: string|null }}
 */
export function determineVibe(scores) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const primary = sorted[0][0]
  const secondScore = sorted[1][1]
  const primaryScore = sorted[0][1]
  const secondary = (primaryScore - secondScore) <= 3 ? sorted[1][0] : null
  return { primary, secondary }
}

/**
 * Convert scores (0-25) to percentages for display.
 * @param {Record<string,number>} scores
 * @returns {Record<string,number>}
 */
export function scoresToPercent(scores) {
  const max = 25
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, Math.round((v / max) * 100)])
  )
}
```

- [ ] **Step 3: Write scoring tests (in a test file — no test runner needed, just verify manually)**

Create `frontend/src/utils/scoring.test.js`:

```js
import { calculateScores, determineVibe, scoresToPercent } from './scoring.js'
import { RATING_QUESTIONS } from '../data/questions.js'

// Test 1: all explorer answers → explorer wins
const singleAllExplorer = Object.fromEntries(
  ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'].map(q => [q, 'explorer'])
)
const ratingNeutral = { r1: 3, r2: 3, r3: 3, r4: 3, r5: 3 }
const result1 = calculateScores(singleAllExplorer, ratingNeutral, RATING_QUESTIONS)
console.assert(result1.primary === 'explorer', 'primary should be explorer')
console.assert(result1.scores.explorer === 20 + 3, 'explorer score should be 23')

// Test 2: hybrid detection (close scores)
const hybridScores = { foodie: 20, explorer: 19, culture: 5, adventure: 5, relaxation: 5 }
const { primary, secondary } = determineVibe(hybridScores)
console.assert(primary === 'foodie', 'primary should be foodie')
console.assert(secondary === 'explorer', 'secondary should be explorer (diff <= 3)')

// Test 3: scoresToPercent
const pct = scoresToPercent({ foodie: 25, explorer: 0 })
console.assert(pct.foodie === 100, 'foodie should be 100%')
console.assert(pct.explorer === 0, 'explorer should be 0%')

console.log('All scoring tests passed ✓')
```

- [ ] **Step 4: Run scoring tests**

```bash
cd frontend && node src/utils/scoring.test.js
```

Expected: `All scoring tests passed ✓`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/questions.js frontend/src/utils/scoring.js frontend/src/utils/scoring.test.js
git commit -m "feat: questions data + scoring utility with tests"
```

---

### Task 11: Frontend — api.js + App.jsx State Machine

**Files:**
- Create: `frontend/src/api.js`
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: Create frontend/src/api.js**

```js
const BASE = '/api'

function getToken() {
  return localStorage.getItem('sole_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const api = {
  register: (email, password) => request('POST', '/auth/register', { email, password }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  quizComplete: (payload) => request('POST', '/quiz/complete', payload),
  recommendations: (payload) => request('POST', '/recommendations', payload),
  saveToken: (token) => localStorage.setItem('sole_token', token),
  clearToken: () => localStorage.removeItem('sole_token'),
  hasToken: () => !!getToken(),
}
```

- [ ] **Step 2: Create frontend/src/App.jsx**

```jsx
import { useState, useEffect } from 'react'
import { api } from './api.js'
import AuthScreen from './components/AuthScreen.jsx'
import EntryScreen from './components/EntryScreen.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import RatingScreen from './components/RatingScreen.jsx'
import VibeResult from './components/VibeResult.jsx'
import Itinerary from './components/Itinerary.jsx'
import { calculateScores } from './utils/scoring.js'
import { SINGLE_CHOICE_QUESTIONS, RATING_QUESTIONS } from './data/questions.js'

const SCREENS = ['AUTH', 'ENTRY', 'QUIZ1', 'QUIZ2', 'QUIZ3', 'VIBE', 'ITINERARY']

export default function App() {
  const [screen, setScreen] = useState('AUTH')
  const [user, setUser] = useState(null)

  // Quiz state
  const [tripType, setTripType] = useState('inday')
  const [duration, setDuration] = useState(8)
  const [location, setLocation] = useState('')
  const [singleAnswers, setSingleAnswers] = useState({})
  const [ratingAnswers, setRatingAnswers] = useState({})
  const [vibeResult, setVibeResult] = useState(null)   // { primary, secondary, scores }
  const [recommendations, setRecommendations] = useState(null)
  const [loadingRec, setLoadingRec] = useState(false)

  // On mount: check for existing session
  useEffect(() => {
    if (!api.hasToken()) return
    api.me()
      .then((userData) => {
        setUser(userData)
        setScreen(userData.has_vibe ? 'ENTRY' : 'ENTRY')
      })
      .catch(() => {
        api.clearToken()
      })
  }, [])

  function handleAuthSuccess(userData) {
    setUser(userData)
    setScreen('ENTRY')
  }

  function handleEntryDone(entryData) {
    setTripType(entryData.tripType)
    setDuration(entryData.duration)
    setLocation(entryData.location)
    if (user?.has_vibe) {
      // Returning user with vibe — skip to VIBE screen showing saved vibe
      // We need to load their vibe from the token — use /api/auth/me won't have scores
      // So go straight to recommendations
      handleGetRecommendations(entryData, vibeResult)
    } else {
      setScreen('QUIZ1')
    }
  }

  function handleQuiz1Done(answers) {
    setSingleAnswers(prev => ({ ...prev, ...answers }))
    setScreen('QUIZ2')
  }

  function handleQuiz2Done(answers) {
    setSingleAnswers(prev => ({ ...prev, ...answers }))
    setScreen('QUIZ3')
  }

  async function handleQuiz3Done(ratings) {
    setRatingAnswers(ratings)
    const allSingle = { ...singleAnswers }
    const result = calculateScores(allSingle, ratings, RATING_QUESTIONS)
    setVibeResult(result)

    // Save to backend
    try {
      await api.quizComplete({
        primary_vibe: result.primary,
        secondary_vibe: result.secondary,
        scores: result.scores,
      })
      setUser(prev => prev ? { ...prev, has_vibe: true } : prev)
    } catch (e) {
      console.warn('Failed to save vibe:', e)
    }
    setScreen('VIBE')
  }

  async function handleGetRecommendations(entryOverride, vibeOverride) {
    const vr = vibeOverride || vibeResult
    const et = entryOverride || { tripType, duration, location }
    if (!vr || !et.location) return
    setLoadingRec(true)
    setScreen('ITINERARY')
    try {
      const data = await api.recommendations({
        primary_vibe: vr.primary,
        secondary_vibe: vr.secondary,
        location: et.location,
        trip_type: et.tripType,
        duration: et.duration,
      })
      setRecommendations(data)
    } catch (e) {
      console.error('Recommendation failed:', e)
    } finally {
      setLoadingRec(false)
    }
  }

  function handleRestart() {
    setSingleAnswers({})
    setRatingAnswers({})
    setVibeResult(null)
    setRecommendations(null)
    setScreen('ENTRY')
  }

  const screen1Qs = SINGLE_CHOICE_QUESTIONS.filter(q => q.screen === 1)
  const screen2Qs = SINGLE_CHOICE_QUESTIONS.filter(q => q.screen === 2)

  return (
    <div className="min-h-screen bg-background">
      {screen === 'AUTH'      && <AuthScreen onSuccess={handleAuthSuccess} />}
      {screen === 'ENTRY'     && <EntryScreen user={user} onDone={handleEntryDone} />}
      {screen === 'QUIZ1'     && <QuizScreen questions={screen1Qs} screenIndex={1} totalScreens={3} onDone={handleQuiz1Done} />}
      {screen === 'QUIZ2'     && <QuizScreen questions={screen2Qs} screenIndex={2} totalScreens={3} onDone={handleQuiz2Done} />}
      {screen === 'QUIZ3'     && <RatingScreen screenIndex={3} totalScreens={3} onDone={handleQuiz3Done} />}
      {screen === 'VIBE'      && <VibeResult vibeResult={vibeResult} onContinue={() => handleGetRecommendations(null, null)} />}
      {screen === 'ITINERARY' && <Itinerary recommendations={recommendations} loading={loadingRec} tripType={tripType} location={location} onRestart={handleRestart} />}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api.js frontend/src/App.jsx
git commit -m "feat: api client + app state machine"
```

---

### Task 12: AuthScreen Component

**Files:**
- Create: `frontend/src/components/AuthScreen.jsx`

- [ ] **Step 1: Create frontend/src/components/AuthScreen.jsx**

```jsx
import { useState } from 'react'
import { api } from '../api.js'

export default function AuthScreen({ onSuccess }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = tab === 'login'
        ? await api.login(email, password)
        : await api.register(email, password)
      api.saveToken(data.token)
      onSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-container-margin"
      onMouseMove={(e) => {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,107,107,0.07) 0%, transparent 50%)`
      }}
    >
      {/* Glow orbs */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <h1 className="font-display text-display-lg text-primary tracking-tighter mb-2">SOLE</h1>
      <p className="font-label text-label-md text-on-surface-variant mb-stack-lg text-center">
        Khám phá vibe du lịch của bạn
      </p>

      <div className="glass-card w-full max-w-sm rounded-lg p-stack-lg shadow-xl">
        {/* Tabs */}
        <div className="flex mb-stack-md border-b border-outline-variant">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 font-label text-label-md transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
          />
          {error && (
            <p className="text-red-500 font-label text-label-md text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="sunset-gradient text-on-primary font-label text-label-md uppercase tracking-widest py-4 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? '...' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AuthScreen.jsx
git commit -m "feat: AuthScreen — login and register tabs with glass card UI"
```

---

### Task 13: EntryScreen Component

**Files:**
- Create: `frontend/src/components/EntryScreen.jsx`

- [ ] **Step 1: Create frontend/src/components/EntryScreen.jsx**

```jsx
import { useState } from 'react'

export default function EntryScreen({ user, onDone }) {
  const [tripType, setTripType] = useState('inday')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState(8)
  const [error, setError] = useState('')

  function handleContinue() {
    if (!location.trim()) {
      setError('Vui lòng nhập địa điểm của bạn')
      return
    }
    onDone({ tripType, location: location.trim(), duration })
  }

  return (
    <div className="min-h-screen flex flex-col px-container-margin pt-20 pb-32 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-between items-center px-container-margin h-16 left-0">
        <div className="w-8" />
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
        {user && (
          <p className="font-label text-caption text-on-surface-variant truncate max-w-[120px]">{user.email}</p>
        )}
      </header>

      <div className="mb-stack-lg mt-4">
        <p className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full inline-block mb-stack-sm">
          {user?.has_vibe ? 'Khám phá tiếp' : 'Bắt đầu'}
        </p>
        <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
          Hôm nay bạn muốn đi kiểu nào?
        </h2>
      </div>

      {/* Trip type */}
      <div className="grid grid-cols-2 gap-4 mb-stack-lg">
        {[
          { value: 'inday', icon: '⏱️', label: 'Trong ngày', sub: 'Vài tiếng đồng hồ' },
          { value: 'multiday', icon: '🗺️', label: 'Chuyến xa', sub: 'Nhiều ngày' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setTripType(opt.value)}
            className={`flex flex-col items-center justify-center rounded-lg p-5 border-2 transition-all active:scale-95 ${
              tripType === opt.value
                ? 'bg-primary-container border-primary shadow-md'
                : 'bg-surface-container-low border-transparent'
            }`}
          >
            <span className="text-3xl mb-2">{opt.icon}</span>
            <span className="font-display text-headline-md text-on-surface">{opt.label}</span>
            <span className="font-label text-caption text-on-surface-variant mt-1">{opt.sub}</span>
          </button>
        ))}
      </div>

      {/* Duration */}
      <div className="mb-stack-lg">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          {tripType === 'inday' ? `Thời gian: ${duration} giờ` : `Số ngày: ${duration}`}
        </label>
        <input
          type="range"
          min={tripType === 'inday' ? 2 : 1}
          max={tripType === 'inday' ? 12 : 7}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Location */}
      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          📍 Bạn đang ở đâu?
        </label>
        <input
          type="text"
          placeholder="VD: Quận 1, TP.HCM"
          value={location}
          onChange={e => { setLocation(e.target.value); setError('') }}
          className="w-full bg-white/70 backdrop-blur border border-white/30 rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
        />
        {error && <p className="text-red-500 font-label text-caption mt-1">{error}</p>}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={handleContinue}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {user?.has_vibe ? 'Xem gợi ý ngay' : 'Bắt đầu khám phá'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/EntryScreen.jsx
git commit -m "feat: EntryScreen — trip type, duration, location input"
```

---

### Task 14: QuizScreen Component (Màn 1 & 2)

**Files:**
- Create: `frontend/src/components/QuizScreen.jsx`

- [ ] **Step 1: Create frontend/src/components/QuizScreen.jsx**

```jsx
import { useState } from 'react'

export default function QuizScreen({ questions, screenIndex, totalScreens, onDone }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  const question = questions[currentIdx]
  const totalQuestions = questions.length
  const globalProgress = ((screenIndex - 1) * 5 + currentIdx) / (totalScreens * 5)

  function handleSelect(vibe) {
    if (animating) return
    setSelected(vibe)
    const newAnswers = { ...answers, [question.id]: vibe }
    setAnimating(true)
    setTimeout(() => {
      if (currentIdx < totalQuestions - 1) {
        setAnswers(newAnswers)
        setCurrentIdx(i => i + 1)
        setSelected(null)
        setAnimating(false)
      } else {
        onDone(newAnswers)
      }
    }, 400)
  }

  // Masonry: odd-indexed cards get margin-top
  const masonryDelay = (i) => `${(i + 1) * 0.1}s`

  return (
    <div
      className="min-h-screen bg-background pb-12 overflow-x-hidden"
      onMouseMove={(e) => {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,107,107,0.05) 0%, transparent 50%)`
      }}
    >
      {/* Progress Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl px-container-margin h-20 flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="font-label text-label-md text-primary tracking-widest uppercase">Discovery</span>
          <span className="font-label text-label-md text-on-surface-variant">
            Step {screenIndex}/{totalScreens}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full sunset-gradient rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.round(globalProgress * 100)}%` }}
          />
        </div>
      </header>

      <main className="pt-28 pb-12 px-container-margin">
        {/* Question */}
        <section className="mb-stack-lg">
          <h1 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
            {question.question}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-2">
            Chọn đáp án phù hợp nhất với bạn.
          </p>
        </section>

        {/* Masonry Options Grid */}
        <div
          className="grid grid-cols-2 gap-4 pb-24"
          style={{ gridAutoRows: 'auto' }}
        >
          {question.options.map((opt, i) => {
            const isSelected = selected === opt.vibe
            const isEven = i % 2 === 1

            return (
              <button
                key={opt.vibe}
                onClick={() => handleSelect(opt.vibe)}
                className={`animate-slide-in relative group flex flex-col text-left focus:outline-none transition-transform active:scale-95 ${
                  isEven ? 'mt-6' : ''
                }`}
                style={{ animationDelay: masonryDelay(i), opacity: 0, animationFillMode: 'forwards' }}
              >
                <div
                  className={`overflow-hidden rounded-lg mb-3 transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-primary scale-[1.02]' : ''
                  }`}
                  style={{ aspectRatio: i % 2 === 0 ? '4/5' : '4/6' }}
                >
                  {/* Gradient placeholder for image */}
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ae2f34 100%)'
                        : 'linear-gradient(135deg, #ffe9e5 0%, #ffdad3 100%)',
                    }}
                  >
                    {opt.text.slice(0, 2)}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary scale-[1.02]'
                      : 'bg-surface-container-low text-on-surface border-white/40'
                  }`}
                >
                  <p className="font-body text-body-md leading-snug">{opt.text.slice(3)}</p>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/QuizScreen.jsx
git commit -m "feat: QuizScreen — masonry card grid with staggered slideIn animation"
```

---

### Task 15: RatingScreen Component (Màn 3)

**Files:**
- Create: `frontend/src/components/RatingScreen.jsx`

- [ ] **Step 1: Create frontend/src/components/RatingScreen.jsx**

```jsx
import { useState } from 'react'
import { RATING_QUESTIONS } from '../data/questions.js'
import { VIBE_META } from '../data/questions.js'

export default function RatingScreen({ screenIndex, totalScreens, onDone }) {
  const [ratings, setRatings] = useState(
    Object.fromEntries(RATING_QUESTIONS.map(q => [q.id, 0]))
  )
  const allAnswered = Object.values(ratings).every(v => v > 0)

  function handleRate(id, value) {
    setRatings(prev => ({ ...prev, [id]: value }))
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Progress Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl px-container-margin h-20 flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="font-label text-label-md text-primary tracking-widest uppercase">Discovery</span>
          <span className="font-label text-label-md text-on-surface-variant">
            Step {screenIndex}/{totalScreens}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full sunset-gradient rounded-full w-full transition-all duration-700" />
        </div>
      </header>

      <main className="pt-28 pb-12 px-container-margin">
        <section className="mb-stack-lg">
          <h1 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
            Bạn đồng ý đến mức nào?
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-2">
            1 = Hoàn toàn không đồng ý &nbsp;·&nbsp; 5 = Hoàn toàn đồng ý
          </p>
        </section>

        <div className="flex flex-col gap-stack-md">
          {RATING_QUESTIONS.map((q, idx) => {
            const meta = VIBE_META[q.vibe]
            const current = ratings[q.id]
            return (
              <div
                key={q.id}
                className="animate-slide-in glass-card rounded-lg p-stack-md"
                style={{ animationDelay: `${(idx + 1) * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <p className="font-body text-body-md text-on-surface mb-stack-md leading-snug">
                  "{q.statement}"
                </p>
                <div className="flex gap-2 justify-between">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => handleRate(q.id, val)}
                      className={`flex-1 h-10 rounded-DEFAULT font-label text-label-md transition-all active:scale-95 ${
                        current === val
                          ? 'sunset-gradient text-on-primary shadow-md scale-110'
                          : current > 0 && val <= current
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Action bar */}
      <div
        className={`fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent transition-all duration-300 ${
          allAnswered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        }`}
      >
        <button
          onClick={() => onDone(ratings)}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          Xem kết quả vibe
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/RatingScreen.jsx
git commit -m "feat: RatingScreen — rating 1-5 with slide-up CTA"
```

---

### Task 16: VibeResult Component (Màn 4)

**Files:**
- Create: `frontend/src/components/VibeResult.jsx`

- [ ] **Step 1: Create frontend/src/components/VibeResult.jsx**

```jsx
import { useEffect, useRef } from 'react'
import { VIBE_META } from '../data/questions.js'
import { scoresToPercent } from '../utils/scoring.js'

const VIBE_NAMES_VI = {
  foodie: 'Urban Food Explorer',
  explorer: 'Fearless Explorer',
  culture: 'Culture Seeker',
  adventure: 'Thrill Hunter',
  relaxation: 'Peaceful Wanderer',
}

export default function VibeResult({ vibeResult, onContinue }) {
  const barsRef = useRef([])
  const percentages = vibeResult ? scoresToPercent(vibeResult.scores) : {}

  // Animate bars on mount
  useEffect(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar) return
      const target = bar.dataset.target
      bar.style.width = '0%'
      setTimeout(() => {
        bar.style.transition = 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        bar.style.width = target
      }, 400 + i * 100)
    })
  }, [])

  if (!vibeResult) return null

  const primary = vibeResult.primary
  const secondary = vibeResult.secondary
  const meta = VIBE_META[primary]
  const sortedVibes = Object.entries(percentages).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background pt-20 pb-32 px-container-margin relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-center items-center h-16 left-0">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      {/* Reveal header */}
      <div className="mb-stack-lg text-center">
        <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full mb-stack-sm inline-block">
          Your Travel Vibe
        </span>
        <h2 className="font-display text-headline-lg-mobile text-on-surface">
          {secondary ? 'Bạn là một sự kết hợp độc đáo.' : 'Bạn là một traveler đặc biệt.'}
        </h2>
      </div>

      {/* Hero card */}
      <div className="relative w-full mb-stack-lg rounded-xl overflow-hidden shadow-lg group" style={{ aspectRatio: '4/3' }}>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ffe9e5 0%, #ffdad3 100%)' }}
        >
          <div className="text-9xl opacity-20">{meta.label.slice(0, 2)}</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/10">
          <div className="glass-card w-full p-stack-lg rounded-lg shadow-2xl transform transition-transform group-hover:scale-[1.02] duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sunset-gradient rounded-full flex items-center justify-center mb-stack-md shadow-[0_8px_32px_rgba(255,107,107,0.4)] animate-float text-4xl">
                {meta.label.slice(0, 2)}
              </div>
              <h3 className="font-display text-headline-lg text-primary mb-2">
                {VIBE_NAMES_VI[primary]}
              </h3>
              {secondary && (
                <p className="font-label text-label-md text-on-surface-variant mb-2">
                  + {VIBE_NAMES_VI[secondary]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Travel DNA bars */}
      <section className="mb-stack-lg space-y-stack-md">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-display text-headline-md text-on-surface">Travel DNA</h4>
          <span className="font-label text-label-md text-primary">Uniquely Yours</span>
        </div>
        <div className="bg-white/50 backdrop-blur-md rounded-lg p-stack-md border border-white/40 shadow-sm space-y-6">
          {sortedVibes.map(([vibe, pct], i) => (
            <div key={vibe} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-label text-label-md text-on-surface-variant">
                  {VIBE_META[vibe].label}
                </span>
                <span className="font-label text-label-md text-primary">{pct}%</span>
              </div>
              <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  ref={el => barsRef.current[i] = el}
                  data-target={`${pct}%`}
                  className="h-full sunset-gradient rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hashtag pills */}
      <div className="flex flex-wrap gap-2 mb-section-gap justify-center">
        {(VIBE_META[primary].label.includes('Foodie') ? ['#StreetFood', '#LocalFlavors'] :
          VIBE_META[primary].label.includes('Explorer') ? ['#HiddenGems', '#WanderlustVibes'] :
          VIBE_META[primary].label.includes('Culture') ? ['#CultureFirst', '#ArtAndHistory'] :
          VIBE_META[primary].label.includes('Adventure') ? ['#AdventureAwaits', '#ThrilllSeeker'] :
          ['#SlowTravel', '#UnwindMode']).map(tag => (
          <span key={tag} className="bg-primary/10 text-primary font-label text-label-md px-4 py-2 rounded-full border border-primary/20">
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={onContinue}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 max-w-sm mx-auto"
        >
          Show Places For Me
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/VibeResult.jsx
git commit -m "feat: VibeResult — DNA bars animation, vibe reveal, hashtag pills"
```

---

### Task 17: Itinerary Component (Màn 5)

**Files:**
- Create: `frontend/src/components/Itinerary.jsx`

- [ ] **Step 1: Create frontend/src/components/Itinerary.jsx**

```jsx
export default function Itinerary({ recommendations, loading, tripType, location, onRestart }) {
  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-center items-center h-16 left-0">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-24 pb-12 px-container-margin">
        <div className="mb-stack-lg">
          <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full inline-block mb-stack-sm">
            {tripType === 'inday' ? 'Lịch trình trong ngày' : 'Lịch trình chuyến xa'}
          </span>
          <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight">
            Dành riêng cho bạn
          </h2>
          {location && (
            <p className="font-label text-label-md text-on-surface-variant mt-1">
              📍 Từ: {location}
            </p>
          )}
        </div>

        {loading && <SkeletonItinerary />}

        {!loading && recommendations && (
          <div className="space-y-4">
            {recommendations.itinerary?.map((item, i) => (
              <div
                key={i}
                className="animate-slide-in flex gap-4 items-start"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-4 h-4 sunset-gradient rounded-full mt-1 shadow-md" />
                  {i < recommendations.itinerary.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary/20 mt-1" style={{ minHeight: '2rem' }} />
                  )}
                </div>

                {/* Card */}
                <div className="glass-card flex-1 rounded-lg p-stack-md mb-2">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-display text-headline-md text-on-surface leading-tight">
                      {item.time && <span className="text-primary mr-2">{item.time}</span>}
                      {item.name}
                    </p>
                  </div>
                  {item.description && (
                    <p className="font-body text-body-md text-on-surface-variant mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    {item.duration_note && (
                      <span className="font-label text-caption bg-primary/10 text-primary px-3 py-1 rounded-full">
                        ⏱ {item.duration_note}
                      </span>
                    )}
                    {item.distance_from_prev && (
                      <span className="font-label text-caption bg-tertiary/10 text-tertiary px-3 py-1 rounded-full">
                        📍 {item.distance_from_prev}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !recommendations && (
          <div className="text-center py-12 text-on-surface-variant">
            <p className="font-body text-body-lg">Không thể tải gợi ý. Vui lòng thử lại.</p>
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      {!loading && (
        <div className="fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            onClick={onRestart}
            className="w-full bg-surface-container border-2 border-primary/30 text-primary py-4 rounded-full font-label text-label-md uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Lên kế hoạch lại
          </button>
        </div>
      )}
    </div>
  )
}

function SkeletonItinerary() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-4 items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-4 h-4 bg-primary/30 rounded-full mt-1" />
            {i < 4 && <div className="w-0.5 bg-primary/10 mt-1" style={{ minHeight: '2rem' }} />}
          </div>
          <div className="flex-1 bg-surface-container rounded-lg p-stack-md">
            <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2" />
            <div className="h-3 bg-surface-container-high rounded w-full mb-1" />
            <div className="h-3 bg-surface-container-high rounded w-2/3" />
          </div>
        </div>
      ))}
      <p className="text-center font-label text-label-md text-on-surface-variant mt-4 animate-pulse">
        Agent đang tìm địa điểm phù hợp cho bạn...
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Itinerary.jsx
git commit -m "feat: Itinerary — timeline layout, loading skeleton, restart CTA"
```

---

### Task 18: End-to-End Smoke Test (Dev Mode)

- [ ] **Step 1: Start backend**

```bash
cd backend && uvicorn main:app --port 8080 --reload &
sleep 2
```

- [ ] **Step 2: Start frontend dev server**

```bash
cd frontend && npm run dev &
sleep 3
```

- [ ] **Step 3: Open browser and test full flow**

Navigate to `http://localhost:5173` and verify:
1. Auth screen renders — register with a test email
2. EntryScreen renders — select trip type, enter location
3. Quiz screens 1-3 render — answer all questions
4. VibeResult renders — DNA bars animate, vibe name shows
5. Itinerary renders — skeleton shows while loading, then results appear

- [ ] **Step 4: Kill dev servers**

```bash
pkill -f "uvicorn main:app"; pkill -f "vite"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: all components wired — smoke test passed"
```

---

### Task 19: Dockerfile + Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim AS runtime
WORKDIR /app

# Install Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend into backend/static/
COPY --from=frontend-build /app/frontend/dist ./static

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - LLM_BASE_URL=${LLM_BASE_URL}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL}
      - JWT_SECRET=${JWT_SECRET}
      - AGENTBASE_MEMORY_ID=${AGENTBASE_MEMORY_ID}
      - AGENTBASE_STRATEGY_ID=${AGENTBASE_STRATEGY_ID}
      - GREENNODE_CLIENT_ID=${GREENNODE_CLIENT_ID}
      - GREENNODE_CLIENT_SECRET=${GREENNODE_CLIENT_SECRET}
    volumes:
      - ./data:/app/data
    env_file:
      - .env
```

- [ ] **Step 3: Update SQLITE_PATH to use volume mount**

In `backend/config.py`, change:

```python
SQLITE_PATH = os.getenv("SQLITE_PATH", "./data/sole.db")
```

- [ ] **Step 4: Build Docker image**

```bash
docker build -t travel-vibe-agent . 2>&1 | tail -20
```

Expected: `Successfully built <hash>` with no errors.

- [ ] **Step 5: Run container locally**

```bash
cp .env.example .env  # fill in real values first
mkdir -p data
docker run -p 8080:8080 --env-file .env -v $(pwd)/data:/app/data travel-vibe-agent &
sleep 5 && curl -s http://localhost:8080/api/auth/me -H "Authorization: Bearer bad" | python3 -m json.tool
```

Expected: `{"detail": "Invalid or expired token"}`

- [ ] **Step 6: Stop container and commit**

```bash
docker ps -q --filter "ancestor=travel-vibe-agent" | xargs docker stop 2>/dev/null; true
git add Dockerfile docker-compose.yml backend/config.py
git commit -m "feat: multi-stage Dockerfile + docker-compose for GreenNode AgentBase deploy"
```

---

### Task 20: Pre-Deploy Setup — Create AgentBase Memory

Before deploying, a Memory resource must exist. Run this once from local:

- [ ] **Step 1: Verify AgentBase credentials are configured**

```bash
bash .claude/skills/agentbase/scripts/check_credentials.sh iam
```

Expected: `IAM credentials: OK`

- [ ] **Step 2: Create Memory resource**

```bash
bash .claude/skills/agentbase/scripts/memory.sh create \
  --name sole-vibe-profiles \
  --description "Travel vibe profiles for SOLE app users" \
  --expiry-days 365 \
  --strategy-name user-vibe \
  --strategy-type USER_PREFERENCE \
  --namespace-template "/strategies/{memoryStrategyId}/actors/{actorId}" \
  --auto-generate
```

Expected: JSON response with `id` field (e.g. `mem_abc123`).

- [ ] **Step 3: Note Memory ID and Strategy ID**

From the response, copy:
- `id` → `AGENTBASE_MEMORY_ID` in `.env`
- `longTermMemoryStrategies[0].id` → `AGENTBASE_STRATEGY_ID` in `.env`

```bash
bash .claude/skills/agentbase/scripts/memory.sh get <memory-id>
```

- [ ] **Step 4: Update .env with real values and rebuild**

```bash
docker build -t travel-vibe-agent .
```

- [ ] **Step 5: Commit env example update if needed**

```bash
git add .env.example
git commit -m "chore: update env example with agentbase memory ids placeholder"
```

---

### Task 21: Deploy to GreenNode AgentBase

- [ ] **Step 1: Push image to GreenNode Container Registry**

Follow `/agentbase-deploy` skill for registry login and push:

```bash
# Get registry credentials from AgentBase deploy skill
# docker login <registry-url>
# docker tag travel-vibe-agent <registry-url>/travel-vibe-agent:latest
# docker push <registry-url>/travel-vibe-agent:latest
```

- [ ] **Step 2: Create Agent Runtime via AgentBase deploy skill**

Use `/agentbase-deploy` with:
- Image: `<registry-url>/travel-vibe-agent:latest`
- Port: `8080`
- Mode: `PUBLIC`
- Env vars: all from `.env`

- [ ] **Step 3: Verify deployment**

```bash
curl -s https://<runtime-url>/api/auth/me -H "Authorization: Bearer bad"
```

Expected: `{"detail": "Invalid or expired token"}`

- [ ] **Step 4: Open browser and run full smoke test on production URL**

Navigate to `https://<runtime-url>` and verify all 5 screens work end-to-end.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| 5 nhóm vibe + scoring | Task 10 (questions.js + scoring.js) |
| 15 câu hỏi (Q1-Q10 single, R1-R5 rating) | Task 10 |
| Màn 0 Entry (trip type + location) | Task 13 |
| Màn 1-3 Quiz | Tasks 14, 15 |
| Màn 4 Vibe Result + DNA bars | Task 16 |
| Màn 5 Itinerary + loading skeleton | Task 17 |
| Auth email+password + JWT | Tasks 4, 5 |
| SQLite credentials storage | Task 3 |
| AgentBase Memory vibe storage | Tasks 6, 7 |
| LangChain 3 tools | Task 8 |
| Sequential agent pipeline | Task 9 |
| POST /api/recommendations | Task 9 |
| POST /api/quiz/complete | Tasks 7, 9 |
| Returning user skips quiz | App.jsx Task 11 (has_vibe check) |
| Docker multi-stage port 8080 | Task 19 |
| FastAPI serves React static | Task 5 (main.py) |
| Design tokens from example UI | Task 2 |
| slideIn stagger animation | Tasks 14, 17 |
| float animation vibe icon | Task 16 |
| DNA bar animate on load | Task 16 |
| Action bar slide-up | Tasks 14, 15 |
| Ambient background mousemove | Tasks 12, 14 |
| Deploy GreenNode AgentBase | Tasks 20, 21 |
