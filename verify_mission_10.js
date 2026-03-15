/**
 * verify_mission_10.js
 */
const cache = require('./backend/src/services/media_cache');

function verify() {
  console.log('[Verify Mission 10] Starting...');

  // 1. Fill cache
  cache.set('key1', 'val1');
  cache.set('key2', 'val2');
  cache.set('key3', 'val3');
  
  console.log('[Verify] Cache Status (Initial):', cache.status());

  // 2. Access key1 (makes it MRU)
  cache.get('key1');
  
  // 3. Add key4, should evict key2 (since key1 was accessed and key3 is newer than key2)
  // Wait, LRU is based on Map insertion order.
  // Initial: key1, key2, key3
  // Get key1: Map moves key1 to end -> key2, key3, key1
  // Set key4: MaxSize is 100, but if I set maxSize to 3...
  
  const smallCache = new (require('./backend/src/services/media_cache').constructor)(3);
  smallCache.set('a', 1);
  smallCache.set('b', 2);
  smallCache.set('c', 3);
  smallCache.get('a'); // a is now MRU: b, c, a
  smallCache.set('d', 4); // should evict b
  
  const status = smallCache.status();
  console.log('[Verify] Small Cache Status:', status);

  if (!status.keys.includes('b') && status.keys.includes('a') && status.keys.includes('d')) {
    console.log('[Verify] MISSION 10 SUCCESS: LRU working.');
  } else {
    console.log('[Verify] MISSION 10 FAILED:', status.keys);
  }
  
  process.exit(0);
}

verify();
