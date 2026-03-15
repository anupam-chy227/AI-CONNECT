# Safety & Moderation Policy

## Auto-Publish Safety Framework

AIConnect implements a multi-layered approach to safe auto-publishing of AI-generated content to user feeds.

### 1. Provenance Metadata

All generated media includes a provenance JSON object containing:

```json
{
  "modelId": "model_v2.1",
  "generatorVersion": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "styleName": "realistic",
  "detectionScore": 0.92,
  "flagged": false,
  "reportCount": 0
}
```

**Fields:**
- `modelId`: AI model used for generation
- `detectionScore`: Deepfake detection confidence (0-1)
- `flagged`: Boolean indicating human review needed
- `reportCount`: Number of user reports

### 2. Content Classification

Generated content is classified on three dimensions:

| Dimension | Threshold | Action |
|-----------|-----------|--------|
| Visual Safety | > 0.7 confidence of violation | Hold for review |
| Style Authenticity | < 0.8 detection confidence | Flag for review |
| Policy Compliance | Any keyword match | Auto-reject |

**Violation Types:**
- Explicit content (nudity, violence)
- Misinformation (political, medical claims)
- Deepfake abuse (impersonation, defamation)

### 3. Auto-Publish Configuration

Set via environment variable `AUTO_PUBLISH_MODE`:

```bash
AUTO_PUBLISH_MODE=disabled    # All posts held for review (default)
AUTO_PUBLISH_MODE=trusted     # Trusted users auto-publish; others reviewed
AUTO_PUBLISH_MODE=all         # All posts auto-publish (high-risk)
```

**Trusted User Criteria:**
- Account age > 30 days
- No moderation flags
- Content policy violation rate < 2%

### 4. Moderation Queue

All flagged posts enter the review queue at `/api/moderation/queue`:

```json
{
  "postId": "pst_abc123",
  "personaId": "per_xyz789",
  "caption": "...",
  "mediaUrls": ["s3://..."],
  "provenance": {...},
  "flagReason": "visual_safety_violation",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Actions at `/api/moderation/:postId/action`:**

| Action | Effect | Logs To |
|--------|--------|---------|
| `approve` | Publish post; update provenance.flagged=false | audits table |
| `reject` | Delete media; notify user; audit | audits table |
| `escalate` | Route to human reviewer; lock from auto-action | audits table |

### 5. Reporting & Appeals

Users can report posts at `/api/reports/create`:

```json
{
  "postId": "pst_abc123",
  "reason": "impersonation|misinformation|explicit|other",
  "description": "...",
  "evidence": "url or json object"
}
```

Posts with > 3 reports auto-trigger review.

Appeal process via `/api/appeals/create` (post must be rejected first).

### 6. Audit Trail

All moderation actions logged to `audits` table:

```sql
CREATE TABLE audits (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP
);
```

**Audit Actions:**
- `post.created` - Post published
- `post.flagged` - Moderation flag added
- `post.approved` - Review approved
- `post.rejected` - Review rejected
- `report.created` - User report filed
- `appeal.created` - User appeal filed

### 7. Safety API Endpoints

**GET /api/moderation/queue** - List pending reviews (requires moderator role)
```json
{
  "total": 5,
  "items": [
    { "postId": "pst_abc123", "flagReason": "visual_safety_violation", "createdAt": "..." }
  ]
}
```

**POST /api/moderation/:postId/action** - Review action
```json
{
  "action": "approve|reject|escalate",
  "reason": "passed visual check",
  "evidence": "..."
}
```

**POST /api/reports/create** - Report post
```json
{
  "postId": "pst_abc123",
  "reason": "impersonation",
  "description": "This is actually me, not an AI persona"
}
```

**GET /api/posts/:postId/provenance** - Check post authenticity
```json
{
  "postId": "pst_abc123",
  "modelId": "model_v2.1",
  "detectionScore": 0.92,
  "flagged": false,
  "reports": 0
}
```

### 8. Worker Auto-Publish Logic

Workers call `/internal/posts/create` with `provenance` and `AUTO_PUBLISH_MODE` config:

```javascript
// If AUTO_PUBLISH_MODE = 'disabled'
await db.query('INSERT INTO posts (is_published=false, ...)', ...);
// Publish 'post.pending_review' event

// If AUTO_PUBLISH_MODE = 'trusted' && user is trusted
await postService.createPost(...); // Sets is_published=true
// Publish 'post.created' event

// If any violation score > threshold
await db.query('INSERT INTO posts (is_published=false, ...)', ...);
// Publish 'post.flagged' event
```

### 9. Transparency Report

Monthly transparency report generated at `/api/transparency/monthly`:

```json
{
  "month": "2024-01",
  "totalPosts": 1000,
  "flagged": 45,
  "approved": 40,
  "rejected": 5,
  "appeals": 2,
  "appealOverturned": 1,
  "reportedPosts": 12,
  "averageReviewTime": "4.2 hours"
}
```

---

**Last Updated:** January 2024
**Policy Version:** 1.0
