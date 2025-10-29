# Lockify Backend (MongoDB Atlas + Express)

Production-ready backend for your Lockify app with JWT auth and zero-knowledge note storage (ciphertext only).

## 1) Setup

```bash
cd lockify-backend
cp .env.example .env
# fill MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

### MongoDB Atlas
- Create a free cluster at https://www.mongodb.com/atlas
- Add a database user and Network Access => allow your IP (or 0.0.0.0/0 during dev)
- Grab your connection string and put it in `MONGODB_URI`

## 2) API

### Auth
- `POST /api/auth/signup` `{ fullName, email, password }`
- `POST /api/auth/login` `{ email, password }` -> `{ token, user }`

> Legacy aliases for your current frontend:
- `POST /api/register` -> signup
- `POST /api/login` -> login

### Notes (JWT required in `Authorization: Bearer <token>`)
- `GET /api/notes` -> list notes (ciphertext)
- `POST /api/notes` `{ title?, content }` -> create
- `PUT /api/notes/:id` -> update
- `DELETE /api/notes/:id` -> delete

## 3) Frontend Integration Tips

- Store token as `lockify_token` in `localStorage`.
- Ensure you encrypt on the client; send ciphertext `content` only.
- For dev: set `API_BASE = 'http://localhost:5000/api'`

