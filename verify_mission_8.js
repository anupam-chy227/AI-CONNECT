/**
 * verify_mission_8.js
 */
const detector = require('./backend/src/services/deepfake_detector');
const signer = require('./backend/src/services/provenance_signer');

async function verify() {
  console.log('[Verify Mission 8] Starting...');

  // 1. Test Deepfake Detector
  const analysis = await detector.analyze('http://example.com/media.mp4');
  console.log('[Verify] Deepfake Analysis:', analysis);

  // 2. Test Provenance Signer
  const payload = {
    job_id: 'job_123',
    creator: 'user_456',
    model: 'flux-v1'
  };
  const signed = signer.signPayload(payload);
  console.log('[Verify] Signed Payload:', signed);

  const isValid = signer.verifySignature(payload, signed.signature);
  console.log('[Verify] Signature Valid:', isValid);

  if (isValid) {
    console.log('[Verify] MISSION 8 SUCCESS');
  } else {
    console.log('[Verify] MISSION 8 FAILED');
  }
}

verify();
