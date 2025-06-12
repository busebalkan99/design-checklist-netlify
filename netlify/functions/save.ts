import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'This endpoint only accepts POST requests'
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
    
    // Verify Google token
    const userInfo = await verifyGoogleToken(accessToken)
    if (!userInfo) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid Google token',
          message: 'The provided access token is invalid or expired'
        }),
      }
    }

    const requestBody = JSON.parse(event.body || '{}')
    const { userId, userEmail, data, timestamp } = requestBody
    
    // Verify the user ID matches the token
    if (userId !== userInfo.id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'User ID mismatch',
          message: 'The user ID does not match the authenticated user'
        }),
      }
    }

    // Here you would typically save to a database
    // For now, we'll just log and return success
    console.log('=== SAVE REQUEST ===')
    console.log(`User: ${userEmail} (${userId})`)
    console.log(`Timestamp: ${timestamp}`)
    console.log(`Data size: ${JSON.stringify(data).length} characters`)
    console.log('==================')
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Data saved successfully',
        timestamp: new Date().toISOString(),
        userId: userId
      }),
    }
    
  } catch (error) {
    console.error('Save endpoint error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while saving data'
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

