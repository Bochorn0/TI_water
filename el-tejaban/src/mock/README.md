# Mock layer

All API calls are mocked while `VITE_USE_MOCK_API=true` (default).

## Files to replace when integrating TI_water_api

| Mock file | Replace with |
|-----------|--------------|
| `src/mock/mock-store.ts` | Delete — use real API |
| `src/mock/data.ts` | DB seed migration |
| `src/services/*.service.ts` | Axios calls to `/api/v1.0/tiwater/restaurant/*` |
| `src/services/auth.service.ts` | `POST /api/v1.0/auth/login` |
| `src/api/axiosInstance.ts` | Wire JWT + API key interceptors |

Search the codebase for **`MOCK-BACKEND`** to find every integration point.

## Toggle mock mode

```env
VITE_USE_MOCK_API=false
```

When false, services will call axios (stubs throw until routes exist).
