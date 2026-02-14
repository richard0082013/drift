# Drift API Contract v1（Frozen for Week 1）

## 1. 版本与规则
- Version: `v1`
- 状态: Frozen（Week 1 期间默认不改）
- 变更流程: 提交 Lead 审批，批准后以 `v1.1` 追加，不做破坏性修改。

## 2. POST /api/checkins
### Request JSON
```json
{
  "date": "2026-02-14",
  "energy": 4,
  "stress": 2,
  "social": 5,
  "keyContact": "alice",
  "note": "optional"
}
```

### Validation
- `date`: ISO date，必填
- `energy|stress|social`: 整数 1-5，必填
- `keyContact`: 可选字符串
- `note`: 可选字符串（建议 <= 280）

### Success 201
```json
{
  "checkin": {
    "id": "ck_123",
    "userId": "u_123",
    "date": "2026-02-14",
    "energy": 4,
    "stress": 2,
    "social": 5,
    "keyContact": "alice",
    "note": "optional"
  }
}
```

### Error 400
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "energy must be between 1 and 5"
  }
}
```

### Error 409
```json
{
  "error": {
    "code": "DUPLICATE_CHECKIN",
    "message": "Check-in already exists for this date"
  }
}
```

## 3. GET /api/trends?window=7|30
### Success 200
```json
{
  "window": 7,
  "series": {
    "energy": [4, 3, 3],
    "stress": [2, 3, 4],
    "social": [5, 4, 3],
    "dates": ["2026-02-12", "2026-02-13", "2026-02-14"]
  },
  "summary": {
    "driftIndex": 0.62,
    "direction": "down"
  }
}
```

## 4. POST /api/alerts/evaluate
### Success 200
```json
{
  "evaluatedAt": "2026-02-14T10:00:00Z",
  "driftIndex": 0.73,
  "triggered": true,
  "reasons": [
    "Energy trend has declined over recent days",
    "Stress trend has increased in the same period"
  ],
  "alert": {
    "id": "al_123",
    "severity": "medium",
    "message": "You may be drifting. Consider a short recovery break today."
  }
}
```

## 5. Contract 对齐责任
- Backend: 保证响应字段名/类型稳定
- Frontend: 不依赖未定义字段；新增字段需向后兼容
- QA: 用 contract 生成 API/E2E 校验点
- Lead: 审批合同变更
