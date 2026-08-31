# Allv2Store - API Contracts & Integration

## Auth (JWT email/password)
- POST /api/auth/register { name, email, password } -> { token, user:{id,name,email} }
- POST /api/auth/login { email, password } -> { token, user }
- GET  /api/auth/me  (Bearer token) -> { id, name, email }

## Orders
- POST /api/orders (optional Bearer) body: gameSlug,gameName,gameBadge,gameGrad,denomName,account,payment,paymentId,subtotal,fee,discount,voucherCode,total
  -> order { id, invoice, status:'pending', createdAt, userId, ... }
- POST /api/orders/{invoice}/pay -> order { status:'success', paidAt }
- GET  /api/orders/{key}  (key = invoice or id, public) -> order | 404
- GET  /api/orders (Bearer) -> [orders] for that user

## Vouchers
- POST /api/vouchers/validate { code, amount } -> { valid, discount?, code?, message }

## Mocked -> replaced
- AuthContext.jsx: localStorage auth -> real JWT endpoints (token in localStorage 'av2_token')
- StoreContext.jsx: localStorage orders/voucher -> real endpoints
- Game catalog + voucher list stays in frontend mock.js; voucher validation logic duplicated in backend for security.

## Integration
- Frontend uses REACT_APP_BACKEND_URL + '/api'. Auth token sent as Authorization: Bearer.
- Backend: JWT_SECRET in backend/.env, bcrypt via passlib, pyjwt for tokens. Mongo collections: users, orders.
