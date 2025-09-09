import { NextRequest, NextResponse } from 'next/server'

// Store active operations that can be cancelled
const activeOperations = new Map<string, AbortController>()

export async function POST(request: NextRequest) {
  try {
    const { operationId, userId } = await request.json()
    
    if (!operationId || !userId) {
      return NextResponse.json(
        { error: 'Missing operationId or userId' },
        { status: 400 }
      )
    }
    
    console.log(`🚫 Cancelling operation ${operationId} for user ${userId}`)
    
    // Find and abort the operation
    const abortController = activeOperations.get(operationId)
    if (abortController) {
      abortController.abort()
      activeOperations.delete(operationId)
      console.log(`✅ Operation ${operationId} cancelled successfully`)
      
      return NextResponse.json({
        success: true,
        message: 'Operation cancelled successfully'
      })
    } else {
      console.log(`⚠️ Operation ${operationId} not found or already completed`)
      return NextResponse.json({
        success: false,
        message: 'Operation not found or already completed'
      })
    }
    
  } catch (error) {
    console.error('❌ Error cancelling operation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel operation' },
      { status: 500 }
    )
  }
}

// Helper function to register an operation for cancellation
export function registerOperation(operationId: string, abortController: AbortController) {
  activeOperations.set(operationId, abortController)
  console.log(`📝 Registered operation ${operationId} for cancellation`)
}

// Helper function to unregister an operation
export function unregisterOperation(operationId: string) {
  activeOperations.delete(operationId)
  console.log(`🗑️ Unregistered operation ${operationId}`)
}
