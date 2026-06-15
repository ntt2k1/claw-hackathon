# Auth: Migrate SQLite → AgentBase Memory — Design Spec

## Problem

SQLite file lives on the container's ephemeral filesystem. On every AgentBase redeploy, the file is lost → all user accounts are wiped. Vibe data and ratings already survive deploys (stored in AgentBase Memory). Auth data must follow.

## Solution

Replace all SQLite auth operations with AgentBase Memory reads/writes. Remove `database.py` and `init_db()`. Encode email in JWT so `/me` never needs a DB lookup.

---

## AgentBase Memory Namespace

```
/strategies/{AGENTBASE_STRATEGY_ID}/global/users/{email_sha256}
```

- `email_sha256` = `hashlib.sha256(email.lower().encode()).hexdigest()`
- Content (JSON string): `{"user_id": "...", "email": "...", "password_hash": "...", "created_at": "..."}`
- Write-once at registration. Never updated.

---

## JWT Change

**Before:** `{"sub": user_id, "exp": ...}`

**After:** `{"sub": user_id, "email": email, "exp": ...}`

`decode_jwt(token)` now returns a dict with both fields. `get_current_user_id` extracts `payload["sub"]` — backward compatible with all other routers.

---

## `has_vibe` — live check

No more flag in DB. `/me` checks:
```python
has_vibe = await get_vibe_profile(user_id) is not None
```

One extra Memory call per page load. Acceptable for hackathon scale.

---

## New auth flow

### Register
1. Compute `email_sha256 = sha256(email.lower())`
2. Read namespace → if record exists → 409 Email already registered
3. `user_id = uuid4()`
4. Write `{user_id, email, password_hash: bcrypt(password), created_at}` to namespace
5. Issue JWT with `{sub: user_id, email: email}`
6. Return `{token, user: {id, email, has_vibe: false}}`

### Login
1. Compute `email_sha256`
2. Read namespace → if no record → 401
3. Verify `bcrypt(password, record.password_hash)` → if fail → 401
4. Issue JWT with `{sub: user_id, email: email}`
5. Return `{token, user: {id, email, has_vibe: checked_live}}`

### /me
1. Decode JWT → `{user_id, email}`
2. `has_vibe = await get_vibe_profile(user_id) is not None`
3. Return `{id: user_id, email: email, has_vibe: has_vibe}`

---

## Files

| Action | File | What changes |
|--------|------|------|
| Modify | `backend/memory/service.py` | Add `save_user_auth(email, record)`, `get_user_by_email(email)` |
| Modify | `backend/auth/service.py` | `create_jwt(user_id, email)`, `decode_jwt` returns dict |
| Modify | `backend/auth/router.py` | Replace all aiosqlite with Memory calls; `/me` uses JWT payload |
| Modify | `backend/recommendations/router.py` | Remove `UPDATE users SET has_vibe = 1` line |
| Modify | `backend/main.py` | Remove `init_db()` import and call |
| Delete | `backend/database.py` | No longer needed |

## Not changed
- All frontend files
- `backend/config.py` (SQLITE_PATH stays but unused)
- `backend/memory/service.py` vibe/ratings functions
- All other routers
