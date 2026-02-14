# Drift API Contract v1.1（Week 2 Incremental）

## 1. 版本信息
- Base: `v1`（`docs/contracts/2026-02-14-api-contract-v1.md`）
- Version: `v1.1`
- 日期: `2026-02-14`
- 性质: 增量补充（不做破坏性删除，但以 Week2 真实实现口径为准）

## 2. 与 v1 的差异点（重点）
1. 鉴权上下文统一为会话模式：
- 支持 `Authorization: Bearer drift-user:<userId>`
- 或 Cookie `drift_session_user=<userId>`
- 未鉴权统一返回 `401 UNAUTHORIZED`

2. `GET /api/trends` 合同口径调整：
- Query 参数由 `window` 调整为 `days`
- 成功响应由 `window + series + summary` 调整为 `days + data`
- 当前 `data` 为点数组：`[{ date, energy, stress, social }]`

3. Week2 已存在并可用的读取接口：
- `GET /api/alerts`
- `GET /api/export`（CSV）

4. Week2 新增账号删除能力：
- `POST /api/account/delete`
- `DELETE /api/account/delete`
- 删除策略在当前版本明确为 `hard delete`

## 3. 通用错误码

### 401 UNAUTHORIZED
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

### 400 VALIDATION_ERROR（按接口场景）
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "<validation message>"
  }
}
```

## 4. API 口径（Week2 当前实现）

### 4.1 POST /api/checkins

#### Request JSON
```json
{
  "date": "2026-02-14",
  "energy": 4,
  "stress": 2,
  "social": 5,
  "key_contact": "alice"
}
```

#### Success 201
```json
{
  "checkin": {
    "id": "ck_123",
    "userId": "u_123",
    "date": "2026-02-14T00:00:00.000Z",
    "energy": 4,
    "stress": 2,
    "social": 5,
    "keyContact": "alice"
  }
}
```

#### Errors
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `409 DUPLICATE_CHECKIN`
- `500 INTERNAL_ERROR`

### 4.2 GET /api/trends?days=7|30

#### Query Params
- `days`: `7 | 30`，默认 `7`

#### Success 200
```json
{
  "days": 7,
  "data": [
    {
      "date": "2026-02-14",
      "energy": 4,
      "stress": 3,
      "social": 2
    }
  ]
}
```

#### Errors
- `400 VALIDATION_ERROR`（例如 days 非 7/30）
- `401 UNAUTHORIZED`

### 4.3 GET /api/alerts

#### Success 200
```json
{
  "data": [
    {
      "id": "al_123",
      "date": "2026-02-14",
      "level": "moderate",
      "message": "You may be drifting.",
      "reason": "Energy trend down",
      "action": "Take a short reset"
    }
  ]
}
```

#### Errors
- `401 UNAUTHORIZED`

### 4.4 POST /api/alerts/evaluate

#### Request JSON
```json
{
  "date": "2026-02-14"
}
```

#### Success 200（未触发告警）
```json
{
  "driftIndex": 0.42,
  "reasons": ["..."],
  "alertCreated": false
}
```

#### Success 200（触发告警）
```json
{
  "driftIndex": 0.73,
  "reasons": ["..."],
  "alertCreated": true,
  "alert": {
    "id": "al_123",
    "userId": "u_123",
    "date": "2026-02-14T00:00:00.000Z",
    "level": "moderate",
    "message": "...",
    "reason": "...",
    "action": "..."
  }
}
```

#### Errors
- `401 UNAUTHORIZED`

### 4.5 GET /api/export

#### Success 200
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename=drift-export-<userId>.csv`
- CSV Header:

```csv
date,energy,stress,social,key_contact,drift_index,drift_reasons
```

#### 字段说明（导出一致性）
- `date`: `YYYY-MM-DD`
- `energy|stress|social`: 1-5 整数
- `key_contact`: 可能为空字符串
- `drift_index`: 当日无漂移记录时为空字符串
- `drift_reasons`: 多个原因使用 `" | "` 连接；无漂移记录时为空字符串

#### Errors
- `401 UNAUTHORIZED`

### 4.6 POST|DELETE /api/account/delete

#### Auth
- 需要登录会话（Bearer 或 `drift_session_user` Cookie）

#### Success 200
```json
{
  "deleted": true,
  "strategy": "hard"
}
```

#### Errors
- `401 UNAUTHORIZED`
- `404 ACCOUNT_NOT_FOUND`
```json
{
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "Account does not exist."
  }
}
```
- `500 INTERNAL_ERROR`

## 5. 兼容性说明
- `v1` 中 `GET /api/trends?window=...` 与 `series/summary` 结构不再作为 Week2 前后端联调口径。
- QA 与 FE 在 Week2 以 `v1.1` 为准：`days + data`。
