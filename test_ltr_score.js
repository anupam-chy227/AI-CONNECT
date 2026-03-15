const scorer = require('./backend/src/services/ltr/score_api');

const candidates = [
  { id: 'pst_1', visual_score: 0.9, style_score: 0.8, recency_hours: 2 },
  { id: 'pst_2', visual_score: 0.4, style_score: 0.3, recency_hours: 24 },
  { id: 'pst_3', visual_score: 0.7, style_score: 0.9, recency_hours: 1 }
];

console.log('[LTR Test] Initial candidates:', JSON.stringify(candidates, null, 2));
const ranked = scorer.score(candidates);
console.log('[LTR Test] Ranked candidates:', JSON.stringify(ranked, null, 2));

if (ranked[0].id === 'pst_3') {
  console.log('[LTR Test] PASSED: pst_3 ranked first due to high style_score and low recency_hours.');
} else {
  console.log('[LTR Test] FAILED: Ranking mismatch.');
}
