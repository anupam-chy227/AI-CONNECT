const db = require('../db');
const publisher = require('../events/publisher');

async function createPost({ persona_id, caption, mediaUrls, provenance, jobId }) {
  try {
    const postId = await db.query(
      `INSERT INTO posts (id, persona_id, caption, provenance) 
       VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id`,
      [persona_id, caption, provenance]
    )[0].id;

    // Add media
    for (const url of mediaUrls) {
      await db.query(
        'INSERT INTO media (post_id, url) VALUES ($1, $2)',
        [postId, url]
      );
    }

    // Mark as published
    await db.query(
      'UPDATE posts SET is_published = true, published_at = CURRENT_TIMESTAMP WHERE id = $1',
      [postId]
    );

    // Publish event
    publisher.publish('post.created', {
      id: postId,
      persona_id,
      caption,
      mediaUrls,
      provenance,
      published_at: new Date().toISOString()
    });

    return { id: postId, status: 'published' };
  } catch (err) {
    console.error('[PostService] Create error:', err);
    throw err;
  }
}

module.exports = { createPost };

