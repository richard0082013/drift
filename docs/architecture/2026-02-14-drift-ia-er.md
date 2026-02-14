# Drift 信息架构与数据模型图

## 1. 信息架构图（IA）
```mermaid
flowchart TD
    A[Drift App] --> B[Home]
    A --> C[Check-in]
    A --> D[Trends]
    A --> E[Alerts]
    A --> F[Settings]
    A --> G[Privacy]

    B --> C
    B --> D
    B --> E

    C --> C1[今日打卡]
    C --> C2[补录当日]

    D --> D1[7天趋势]
    D --> D2[30天趋势]
    D --> D3[漂移指数解释]

    E --> E1[提醒列表]
    E --> E2[触发原因]
    E --> E3[建议行动]

    F --> F1[提醒时间]
    F --> F2[时区]
    F --> F3[通知偏好]
    F --> F4[数据导出]
    F --> F5[账号删除]
```

## 2. 数据实体关系图（ER）
```mermaid
erDiagram
    USERS ||--o{ DAILY_CHECKINS : has
    USERS ||--o{ DRIFT_SCORES : has
    USERS ||--o{ ALERTS : receives
    USERS ||--o{ NOTIFICATION_LOGS : has
    USERS ||--|| USER_PREFERENCES : configures

    USERS {
      string id PK
      string email
      string timezone
      datetime created_at
    }

    DAILY_CHECKINS {
      string id PK
      string user_id FK
      date checkin_date
      int energy
      int stress
      int social
      boolean key_contact
      string note
      datetime created_at
    }

    DRIFT_SCORES {
      string id PK
      string user_id FK
      date score_date
      float drift_index
      float energy_trend
      float stress_trend
      float social_trend
      string reasons_json
      datetime created_at
    }

    ALERTS {
      string id PK
      string user_id FK
      date alert_date
      string alert_type
      string severity
      string message
      string status
      datetime created_at
    }

    NOTIFICATION_LOGS {
      string id PK
      string user_id FK
      string channel
      string template_id
      datetime sent_at
      string delivery_status
    }

    USER_PREFERENCES {
      string user_id PK, FK
      string reminder_time_local
      boolean reminder_enabled
      string quiet_hours
      string consent_flags
      datetime updated_at
    }
```

## 3. 约束说明
- `DAILY_CHECKINS` 建议唯一键：`(user_id, checkin_date)`。
- `DAILY_CHECKINS`、`DRIFT_SCORES` 建议索引：`(user_id, checkin_date/score_date)`。
- 所有查询默认按 `user_id` 进行隔离（RLS 或应用层强校验）。
