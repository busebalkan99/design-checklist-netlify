import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'This endpoint only accepts GET requests'
      }),
    }
  }

  try {
    // Check for authorization header
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Missing or invalid authorization header',
          message: 'Please provide a valid Bearer token'
        }),
      }
    }

    const accessToken = authHeader.substring(7)
    const userId = event.queryStringParameters?.userId
    
    // Validate userId parameter
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing userId parameter',
          message: 'The userId query parameter is required'
        }),
      }
    }
    
    // Verify Google token
    const userInfo = await verifyGoogleToken(accessToken)
    if (!userInfo || userInfo.id !== userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid token or user mismatch',
          message: 'The provided token does not match the requested user'
        }),
      }
    }

    // Here you would typically load from a database
    // For now, we'll return null to indicate no saved data
    console.log('=== LOAD REQUEST ===')
    console.log(`User: ${userInfo.email} (${userId})`)
    console.log(`Loading data for user...`)
    console.log('==================')
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: null, // No saved data yet - would come from database
        timestamp: null,
        message: 'No saved data found (this is normal for new users)',
        userId: userId
      }),
    }
    
  } catch (error) {
    console.error('Load endpoint error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while loading data'
      }),
    }
  }
}

// Helper function to verify Google access token
async function verifyGoogleToken(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`Google API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const userInfo = await response.json()
    
    // Validate required fields
    if (!userInfo.id || !userInfo.email) {
      console.error('Invalid user info from Google:', userInfo)
      return null
    }
    
    return userInfo
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

