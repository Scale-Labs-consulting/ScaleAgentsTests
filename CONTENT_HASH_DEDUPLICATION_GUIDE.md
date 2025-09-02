# Content Hash Deduplication Guide

## **What is Content Hash Deduplication?**

Content hash deduplication is a sophisticated technique that prevents the same audio/video content from being analyzed multiple times, even when uploaded with different filenames or through different methods.

## **How It Works**

### **1. Hash Generation**
```typescript
// Generate SHA-256 hash of the transcription content
const encoder = new TextEncoder()
const data = encoder.encode(transcription)
const hashBuffer = await crypto.subtle.digest('SHA-256', data)
const hashArray = Array.from(new Uint8Array(hashBuffer))
const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
```

**What this does:**
- Converts the transcription text into a unique 64-character hexadecimal string
- SHA-256 is cryptographically secure and virtually collision-free
- Same content = Same hash, Different content = Different hash

### **2. Duplicate Detection**
```typescript
// Check if we already have an analysis with this exact content
const { data: existingAnalysis } = await supabase
  .from('sales_call_analyses')
  .select('*')
  .eq('user_id', userId)
  .eq('analysis_metadata->>content_hash', contentHash)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

**What this does:**
- Searches the database for any existing analysis with the same content hash
- Only checks within the same user's analyses (privacy protection)
- Returns the most recent analysis if duplicates exist

### **3. Duplicate Prevention**
```typescript
if (existingAnalysis) {
  // Return existing analysis instead of creating new one
  return NextResponse.json({
    success: true,
    analysis: existingAnalysis.analysis,
    analysisId: existingAnalysis.id,
    message: 'Duplicate content detected - returning existing analysis',
    isDuplicate: true,
    duplicateInfo: {
      originalId: existingAnalysis.id,
      originalTitle: existingAnalysis.title,
      originalDate: existingAnalysis.created_at
    }
  })
}
```

## **Why This Solves Your Problem**

### **Before (Problem):**
- User uploads "sales_call_1.mp4" → Gets analysis A
- User uploads "meeting_recording.mp4" (same content) → Gets analysis B
- **Result**: Same content, different evaluations, inconsistent results

### **After (Solution):**
- User uploads "sales_call_1.mp4" → Gets analysis A
- User uploads "meeting_recording.mp4" (same content) → Gets analysis A again
- **Result**: Same content, same evaluation, consistent results

## **Real-World Examples**

### **Example 1: Renamed Files**
```
File 1: "Q1_Sales_Call.mp4" → Hash: abc123...
File 2: "January_Meeting.mp4" → Hash: abc123... (SAME!)
Result: Second file uses existing analysis
```

### **Example 2: Multiple Uploads**
```
Upload 1: "client_call.mp4" → Hash: def456...
Upload 2: "client_call.mp4" → Hash: def456... (SAME!)
Result: Second upload detected as duplicate
```

### **Example 3: Different Formats**
```
File 1: "recording.mp4" → Hash: ghi789...
File 2: "recording.mov" → Hash: ghi789... (SAME!)
Result: Same content, same analysis
```

## **Benefits**

### **1. Consistency**
- Identical content always gets identical analysis results
- No more "same file, different scores" issues

### **2. Efficiency**
- Saves OpenAI API calls (cost reduction)
- Reduces processing time
- Prevents unnecessary database storage

### **3. User Experience**
- Users get immediate results for duplicate content
- Clear feedback when duplicates are detected
- Maintains analysis history

### **4. Data Integrity**
- Prevents duplicate analyses in the database
- Maintains single source of truth for each unique content

## **Technical Implementation**

### **Database Schema**
```sql
-- Index for faster duplicate detection
CREATE INDEX idx_sales_call_analyses_content_hash 
ON sales_call_analyses ((analysis_metadata->>'content_hash'));

-- Composite index for user-specific queries
CREATE INDEX idx_sales_call_analyses_user_content_hash 
ON sales_call_analyses (user_id, (analysis_metadata->>'content_hash'));
```

### **Storage Location**
```typescript
analysis_metadata: {
  content_hash: contentHash, // SHA-256 hash of transcription
  transcription_length: transcription.length,
  processing_time: new Date().toISOString(),
  // ... other metadata
}
```

## **Security & Privacy**

### **Hash Properties**
- **One-way**: Cannot reverse-engineer content from hash
- **Deterministic**: Same input always produces same hash
- **Collision-resistant**: Extremely unlikely for different content to produce same hash

### **User Isolation**
- Hashes are checked per-user only
- User A cannot see User B's duplicate content
- Each user has their own deduplication scope

## **Performance Considerations**

### **Hash Generation**
- **Time**: ~1-5ms for typical transcriptions
- **Memory**: Minimal (64 bytes for hash string)
- **CPU**: Negligible impact

### **Database Queries**
- **Indexed**: O(log n) lookup time
- **Selective**: Only searches user's own analyses
- **Efficient**: Single query with composite index

## **Monitoring & Debugging**

### **Log Messages**
```
🔍 Checking for duplicate content...
🔐 Generated content hash: abc123def456...
✅ No duplicate content found, proceeding with new analysis...
🔄 Duplicate content detected!
📊 Existing analysis ID: 123e4567-e89b-12d3-a456-426614174000
```

### **Duplicate Response**
```json
{
  "success": true,
  "analysis": { /* existing analysis data */ },
  "analysisId": "123e4567-e89b-12d3-a456-426614174000",
  "isDuplicate": true,
  "duplicateInfo": {
    "originalId": "123e4567-e89b-12d3-a456-426614174000",
    "originalTitle": "Sales Call Analysis",
    "originalDate": "2024-01-15T10:30:00Z"
  }
}
```

## **Migration Steps**

### **1. Run Database Migration**
```sql
-- Execute ADD_CONTENT_HASH_INDEXES.sql
-- This adds the necessary indexes for performance
```

### **2. Deploy Code Changes**
- The analyze endpoint now includes deduplication logic
- Frontend handles duplicate responses gracefully

### **3. Verify Implementation**
- Upload the same file twice
- Check that second upload returns existing analysis
- Verify logs show duplicate detection

## **Troubleshooting**

### **Common Issues**

#### **1. Hash Generation Fails**
```typescript
// Ensure crypto.subtle is available (HTTPS required)
if (!crypto.subtle) {
  throw new Error('Crypto API not available - HTTPS required')
}
```

#### **2. Database Query Errors**
```typescript
// Handle "no rows" error gracefully
if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
  console.warn('⚠️ Error checking for duplicates:', duplicateCheckError)
}
```

#### **3. Index Performance**
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE SELECT * FROM sales_call_analyses 
WHERE user_id = 'user-uuid' 
AND analysis_metadata->>'content_hash' = 'hash-value';
```

## **Future Enhancements**

### **1. Fuzzy Matching**
- Detect similar content (not just exact matches)
- Handle minor transcription differences

### **2. Batch Deduplication**
- Check multiple files simultaneously
- Bulk duplicate removal

### **3. Content Fingerprinting**
- Audio fingerprinting for pre-transcription deduplication
- Video frame analysis for visual content

## **Conclusion**

Content hash deduplication is a robust, efficient solution that ensures:
- **Consistent results** for identical content
- **Resource efficiency** by preventing duplicate processing
- **Better user experience** with immediate duplicate detection
- **Data integrity** by maintaining single source of truth

This implementation will solve your issue of "same files getting different evaluations" while providing a foundation for future content management features.
