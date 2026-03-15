// Media routes for job status tracking and asset serving
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/media/status/:jobId - Track media generation job progress
// Returns: { jobId, status: "pending|processing|completed|failed", postId?, mediaUrls?, error? }
router.get('/status/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    console.log(`[Media] Checking status for job ${jobId}`);

    // Query media entries associated with job
    const results = await db.query(
      `SELECT m.id, m.post_id, m.url, m.media_type, m.metadata 
       FROM media m 
       WHERE m.metadata->>'jobId' = $1
       ORDER BY m.created_at DESC`,
      [jobId]
    );

    if (results.length > 0) {
      const mediaUrls = results.map((m) => m.url);
      const postId = results[0].post_id;

      // If post exists, job is completed
      if (postId) {
        return res.json({
          status: 'completed',
          media_urls: mediaUrls,
          post_id: postId,
          timestamp: results[0].created_at,
        });
      }
    }

    // Job exists but no media yet - return processing status
    return res.json({
      status: 'processing',
      media_urls: [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Media] Error checking job status:', err.message);
    return res.status(500).json({
      error: 'Failed to check job status',
      message: err.message,
    });
  }
});

// GET /api/media/:mediaId - Fetch media metadata
router.get('/:mediaId', async (req, res) => {
  const { mediaId } = req.params;

  try {
    const results = await db.query(
      'SELECT * FROM media WHERE id = $1',
      [mediaId]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    return res.json(results[0]);
  } catch (err) {
    console.error('[Media] Error fetching media:', err.message);
    return res.status(500).json({
      error: 'Failed to fetch media',
      message: err.message,
    });
  }
});

module.exports = router;
