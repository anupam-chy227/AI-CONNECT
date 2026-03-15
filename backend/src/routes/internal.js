// Internal endpoints for service-to-service communication (Workers calling Backend)
// All requests must include INTERNAL_TOKEN bearer token header
const express = require('express');
const router = express.Router();
const db = require('../db');
const postService = require('../services/postService');

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'dev_internal_token_secret';
const AUTO_PUBLISH_MODE = process.env.AUTO_PUBLISH_MODE || 'disabled';

// Middleware to verify INTERNAL_TOKEN
function verifyInternalToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token || token !== INTERNAL_TOKEN) {
    console.log('[Internal] Unauthorized internal request');
    return res.status(401).json({ error: 'Unauthorized: invalid internal token' });
  }

  next();
}

router.use(verifyInternalToken);

// POST /internal/posts/create - Create post after media generation completes
// Called by workers with generated media URLs and provenance metadata
// Body: {
//   jobId: "job_xyz",
//   personaId: "per_abc",
//   caption: "Generated caption",
//   mediaUrls: ["s3://bucket/media1.jpg"],
//   provenance: { modelId: "...", detectionScore: 0.92, ... }
// }
router.post('/posts/create', async (req, res) => {
  const { jobId, personaId, caption, mediaUrls, provenance } = req.body;

  console.log(`[Internal] POST /posts/create - Job: ${jobId}, Persona: ${personaId}`);

  if (!jobId || !personaId || !caption || !mediaUrls || mediaUrls.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields: jobId, personaId, caption, mediaUrls',
    });
  }

  try {
    // Check user trust level for auto-publish decision
    const userResults = await db.query(
      `SELECT u.*, 
              COUNT(r.id) as report_count,
              (NOW() - u.created_at) as account_age_hours
       FROM users u
       LEFT JOIN reports r ON u.id = r.user_id AND r.resolved = false
       WHERE u.id = (SELECT user_id FROM personas WHERE id = $1)
       GROUP BY u.id`,
      [personaId]
    );

    const user = userResults[0];
    const accountAgeHours = user?.account_age_hours ? parseInt(user.account_age_hours) : 0;
    const isTrusted = accountAgeHours > 720 && (user?.report_count || 0) === 0; // 30 days

    // Determine if post should auto-publish based on mode and provenance
    let shouldAutoPublish = false;

    if (AUTO_PUBLISH_MODE === 'disabled') {
      shouldAutoPublish = false;
    } else if (AUTO_PUBLISH_MODE === 'trusted' && isTrusted) {
      shouldAutoPublish = true;
    } else if (AUTO_PUBLISH_MODE === 'all') {
      shouldAutoPublish = true;
    }

    // Check for safety violations that override auto-publish
    const detectionScore = provenance?.detectionScore || 0;
    const flagged = detectionScore < 0.8 || (provenance?.flagged === true);

    if (flagged) {
      console.log(`[Internal] Post flagged for review - detection score: ${detectionScore}`);
      shouldAutoPublish = false;
    }

    // Create post
    const postResult = await postService.createPost(
      personaId,
      caption,
      { ...provenance, jobId, autoPublishMode: AUTO_PUBLISH_MODE },
      mediaUrls
    );

    // Update post publication status
    if (shouldAutoPublish) {
      await db.query('UPDATE posts SET is_published = true WHERE id = $1', [
        postResult.postId,
      ]);
      console.log(`[Internal] Post auto-published: ${postResult.postId}`);
    } else {
      console.log(`[Internal] Post held for review: ${postResult.postId}`);
    }

    return res.json({
      success: true,
      postId: postResult.postId,
      published: shouldAutoPublish,
      mode: AUTO_PUBLISH_MODE,
      jobId,
    });
  } catch (err) {
    console.error('[Internal] Error creating post:', err.message);
    return res.status(500).json({
      error: 'Failed to create post',
      message: err.message,
      jobId,
    });
  }
});

// GET /internal/health - Health check for service availability
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    autoPublishMode: AUTO_PUBLISH_MODE,
  });
});

module.exports = router;
