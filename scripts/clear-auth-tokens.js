#!/usr/bin/env node

/**
 * Clear Invalid Auth Tokens Script
 * 
 * This script helps clear invalid Supabase authentication tokens
 * from localStorage that might cause "Invalid Refresh Token" errors.
 * 
 * Usage:
 * - Run in browser console: Copy and paste the browser code section
 * - Or add this to your developer tools as a snippet
 */

console.log('🧹 Auth Token Cleaner Script')
console.log('============================')

if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Running in browser environment')
  
  function clearAuthTokens() {
    let clearedCount = 0
    
    // Clear specific ScaleAgents auth key
    if (localStorage.getItem('scaleagents-auth')) {
      localStorage.removeItem('scaleagents-auth')
      clearedCount++
      console.log('✅ Cleared: scaleagents-auth')
    }
    
    // Clear Supabase-generated keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token')) {
        localStorage.removeItem(key)
        clearedCount++
        console.log('✅ Cleared:', key)
      }
    })
    
    if (clearedCount === 0) {
      console.log('ℹ️ No auth tokens found to clear')
    } else {
      console.log(`🎉 Successfully cleared ${clearedCount} auth token(s)`)
      console.log('💡 Please refresh the page to reinitialize authentication')
    }
  }
  
  // Run the cleanup
  clearAuthTokens()
  
} else {
  // Node.js environment
  console.log('🖥️ Running in Node.js environment')
  console.log('❌ This script is meant to run in the browser')
  console.log('')
  console.log('📋 Copy and paste this code in your browser console:')
  console.log('')
  console.log(`
// Clear ScaleAgents Auth Tokens
(function() {
  let clearedCount = 0;
  
  // Clear specific ScaleAgents auth key
  if (localStorage.getItem('scaleagents-auth')) {
    localStorage.removeItem('scaleagents-auth');
    clearedCount++;
    console.log('✅ Cleared: scaleagents-auth');
  }
  
  // Clear Supabase-generated keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token')) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log('✅ Cleared:', key);
    }
  });
  
  if (clearedCount === 0) {
    console.log('ℹ️ No auth tokens found to clear');
  } else {
    console.log(\`🎉 Successfully cleared \${clearedCount} auth token(s)\`);
    console.log('💡 Please refresh the page to reinitialize authentication');
  }
})();
  `)
}
