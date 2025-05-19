const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { isoBase64URL } = require('@simplewebauthn/server/helpers');

// Create Express server
const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies with increased size limit for image data
app.use(express.json({ limit: '50mb' }));

// WebAuthn configuration
const rpID = process.env.RP_ID || 'localhost';
const rpName = 'React Test App';
const origin = process.env.ORIGIN || `http://${rpID}:3000`;

// In-memory store for user credentials
// In a production environment, this would be replaced with a database
const inMemoryUserDeviceDB = {};

// Helper function to generate a random user ID
function generateUserId() {
  // Return a Buffer directly instead of converting to hex string
  return crypto.randomBytes(16);
}

// TV server endpoint
const TV_SERVER_URL = 'http://10.0.0.77:7979/notify';

// Use the actual IP of the machine running the proxy server
// This is the IP that the TV needs to use to access the images
const PROXY_IP = process.env.PROXY_IP || '10.0.0.52'; // Your machine's IP
const PROXY_PORT = process.env.PROXY_PORT || 3001;

// Log the network interfaces to help diagnose IP issues
console.log('[Setup] Network interfaces:');
const networkInterfaces = require('os').networkInterfaces();
Object.keys(networkInterfaces).forEach(interfaceName => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach(iface => {
    if (!iface.internal && iface.family === 'IPv4') {
      console.log(`[Setup] Interface ${interfaceName}: ${iface.address}`);
    }
  });
});

// Create temp directory for images if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`[Setup] Created temp directory at: ${TEMP_DIR}`);
} else {
  console.log(`[Setup] Using existing temp directory at: ${TEMP_DIR}`);
}

// Check if the directory is writable
try {
  const testFile = path.join(TEMP_DIR, 'test-write.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('[Setup] Temp directory is writable');
} catch (error) {
  console.error('[Setup] ERROR: Temp directory is not writable:', error.message);
}

// Clean up temp images older than 1 hour
function cleanupTempImages() {
  if (fs.existsSync(TEMP_DIR)) {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      // Delete files older than 1 hour (3600000 ms)
      if (now - stats.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted old temp file: ${file}`);
      }
    });
  }
}

// Run cleanup every hour
setInterval(cleanupTempImages, 3600000);

/**
 * Proxy endpoint to forward requests to TV server
 * Handles CORS and adds appropriate headers
 */
app.post('/api/tv/notify', async (req, res) => {
  try {
    console.log('[Proxy] Incoming request to /api/tv/notify');
    console.log('[Proxy] Payload:', JSON.stringify(req.body));
    // Forward the request to TV server
    const tvResponse = await fetch(TV_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    // Get response data
    const data = await tvResponse.text();

    console.log('[Proxy] TV server response status:', tvResponse.status);
    console.log('[Proxy] TV server response body:', data);

    // Forward the TV server's response code
    res.status(tvResponse.status);

    // If response has content, send it
    if (data) {
      res.send(data);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({
      error: 'Failed to forward request to TV server',
      details: error.message
    });
  }
});

/**
 * Endpoint to host an image temporarily
 * Accepts a base64 data URL and returns a URL to the hosted image
 */
app.post('/api/host-image', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data. Must be a data URL.' });
    }
    
    // Extract image data and type
    const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image data format.' });
    }
    
    const imageType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename
    const filename = `${crypto.randomBytes(16).toString('hex')}.${imageType}`;
    const filePath = path.join(TEMP_DIR, filename);
    
    // Save the image
    fs.writeFileSync(filePath, buffer);
    
    // Generate a URL using our proxy server's IP and port
    // This is the URL that the TV will use to access the image
    const imageUrl = `http://${PROXY_IP}:${PROXY_PORT}/temp/${filename}`;
    
    console.log(`[Host Image] Using proxy IP: ${PROXY_IP} with port: ${PROXY_PORT}`);
    console.log(`[Host Image] Full image URL: ${imageUrl}`);
    console.log(`[Host Image] Full file path: ${filePath}`);
    
    console.log(`[Host Image] Saved temporary image: ${filename}`);
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error hosting image:', error);
    res.status(500).json({ error: 'Failed to host image', details: error.message });
  }
});

// Serve static files from the temp directory
app.use('/temp', express.static(TEMP_DIR));
console.log(`[Setup] Serving static files from: ${TEMP_DIR} at /temp endpoint`);

// Add a test endpoint to check if static files are being served
app.get('/test-static', (req, res) => {
  const testFile = path.join(TEMP_DIR, 'test-static.txt');
  fs.writeFileSync(testFile, 'This is a test file');
  
  // Create a test image too
  const testImagePath = path.join(TEMP_DIR, 'test-image.png');
  // Copy a simple test image or create one
  try {
    // Create a simple 1x1 pixel PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, buffer);
    console.log(`[Test] Created test image at: ${testImagePath}`);
  } catch (error) {
    console.error(`[Test] Failed to create test image: ${error.message}`);
  }
  
  const imageUrl = `http://${PROXY_IP}:${PROXY_PORT}/temp/test-image.png`;
  
  res.send(`
    <html>
      <body>
        <h1>Static File Test</h1>
        <p>A test file has been created at: ${testFile}</p>
        <p>You should be able to access it at: <a href="/temp/test-static.txt" target="_blank">/temp/test-static.txt</a></p>
        <p>A test image has been created at: ${testImagePath}</p>
        <p>You should be able to access it at: <a href="${imageUrl}" target="_blank">${imageUrl}</a></p>
        <img src="${imageUrl}" alt="Test Image" style="border: 1px solid black; padding: 5px;">
      </body>
    </html>
  `);
});

// Add a ping endpoint to test connectivity
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Add a test endpoint to check connectivity to the TV server
app.get('/test-tv-connection', async (req, res) => {
  try {
    console.log('[Test] Testing connection to TV server...');
    const response = await fetch(TV_SERVER_URL, {
      method: 'HEAD',
    });
    console.log(`[Test] TV server response status: ${response.status}`);
    res.send(`
      <html>
        <body>
          <h1>TV Server Connection Test</h1>
          <p>TV Server URL: ${TV_SERVER_URL}</p>
          <p>Response Status: ${response.status}</p>
          <p>Connection: ${response.ok ? 'Successful' : 'Failed'}</p>
          <h2>Network Information</h2>
          <p>Proxy Server IP: ${PROXY_IP}</p>
          <p>Proxy Server Port: ${PROXY_PORT}</p>
          <p>Test Image URL: <a href="http://${PROXY_IP}:${PROXY_PORT}/temp/test-image.png">http://${PROXY_IP}:${PROXY_PORT}/temp/test-image.png</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[Test] Error connecting to TV server:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>TV Server Connection Test</h1>
          <p>TV Server URL: ${TV_SERVER_URL}</p>
          <p>Connection: Failed</p>
          <p>Error: ${error.message}</p>
          <h2>Network Information</h2>
          <p>Proxy Server IP: ${PROXY_IP}</p>
          <p>Proxy Server Port: ${PROXY_PORT}</p>
        </body>
      </html>
    `);
  }
});

/**
 * WebAuthn Registration Options Endpoint
 * Generates registration options for a new passkey
 */
app.post('/webauthn/register/options', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if user exists, or create a new one
    if (!inMemoryUserDeviceDB[username]) {
      inMemoryUserDeviceDB[username] = {
        id: generateUserId(),
        username,
        devices: [],
        currentChallenge: null
      };
    }
    
    const user = inMemoryUserDeviceDB[username];
    
    // Generate registration options
    const registrationOptions = {
      rpName,
      rpID,
      userID: user.id,
      userName: username,
      authenticatorSelection: {
        // Defaults
        residentKey: 'preferred',
        userVerification: 'preferred',
        // Optional: restrict to platform authenticators (like TouchID, FaceID)
        // authenticatorAttachment: 'platform',
      },
      // Always explicitly set excludeCredentials to avoid SimpleWebAuthn issues
      excludeCredentials: []
    };
    
    // If the user has existing devices, add them to excludeCredentials
    if (user.devices.length > 0) {
      registrationOptions.excludeCredentials = user.devices.map(device => ({
        id: isoBase64URL.fromBuffer(device.credentialID),
        type: 'public-key',
        transports: device.transports || ['internal']
      }));
    }
    
    const options = await generateRegistrationOptions(registrationOptions);
    
    // Save the challenge for verification
    user.currentChallenge = options.challenge;
    
    res.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({
      error: 'Failed to generate registration options',
      details: error.message
    });
  }
});

/**
 * WebAuthn Registration Verification Endpoint
 * Verifies the response from the authenticator after registration
 */
app.post('/webauthn/register/verify', async (req, res) => {
  try {
    const { username, attestationResponse } = req.body;
    
    if (!username || !attestationResponse) {
      return res.status(400).json({ error: 'Username and attestation response are required' });
    }
    
    const user = inMemoryUserDeviceDB[username];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.currentChallenge) {
      return res.status(400).json({ error: 'No challenge found for user' });
    }
    
    // Verify the attestation response
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true
    });
    
    if (!verification.verified) {
      return res.status(400).json({ error: 'Registration verification failed' });
    }
    
    // Get the authenticator data from the verification
    const { registrationInfo } = verification;
    
    if (!registrationInfo) {
      return res.status(400).json({ error: 'Registration info missing' });
    }
    
    // Create a new device entry
    const newDevice = {
      credentialID: registrationInfo.credentialID,
      credentialPublicKey: registrationInfo.credentialPublicKey,
      counter: registrationInfo.counter,
      transports: attestationResponse.response.transports || [],
      registered: new Date().toISOString()
    };
    
    // Add the device to the user's devices
    user.devices.push(newDevice);
    
    // Clear the challenge
    user.currentChallenge = null;
    
    res.json({
      success: true,
      message: 'Registration successful',
      device: {
        credentialID: isoBase64URL.fromBuffer(newDevice.credentialID),
        transports: newDevice.transports
      }
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({
      error: 'Failed to verify registration',
      details: error.message
    });
  }
});

/**
 * WebAuthn Authentication Options Endpoint
 * Generates authentication options for an existing user
 */
app.post('/webauthn/authenticate/options', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const user = inMemoryUserDeviceDB[username];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.devices.length === 0) {
      return res.status(400).json({ error: 'No registered devices found for user' });
    }
    
    // Generate authentication options
    const authenticationOptions = {
      rpID,
      userVerification: 'preferred'
    };
    
    // Add allowCredentials if the user has devices
    if (user.devices.length > 0) {
      authenticationOptions.allowCredentials = user.devices.map(device => ({
        id: isoBase64URL.fromBuffer(device.credentialID),
        type: 'public-key',
        transports: device.transports || ['internal']
      }));
    }
    
    const options = await generateAuthenticationOptions(authenticationOptions);
    
    // Save the challenge for verification
    user.currentChallenge = options.challenge;
    
    res.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    res.status(500).json({
      error: 'Failed to generate authentication options',
      details: error.message
    });
  }
});

/**
 * WebAuthn Authentication Verification Endpoint
 * Verifies the response from the authenticator after authentication
 */
app.post('/webauthn/authenticate/verify', async (req, res) => {
  try {
    const { username, assertionResponse } = req.body;
    
    if (!username || !assertionResponse) {
      return res.status(400).json({ error: 'Username and assertion response are required' });
    }
    
    const user = inMemoryUserDeviceDB[username];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.currentChallenge) {
      return res.status(400).json({ error: 'No challenge found for user' });
    }
    
    // Find the authenticator device
    const credentialID = assertionResponse.id;
    const device = user.devices.find(device =>
      isoBase64URL.fromBuffer(device.credentialID) === credentialID
    );
    
    if (!device) {
      return res.status(400).json({ error: 'Authenticator not registered for this user' });
    }
    
    // Verify the assertion response
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: device.credentialID,
        credentialPublicKey: device.credentialPublicKey,
        counter: device.counter
      },
      requireUserVerification: true
    });
    
    if (!verification.verified) {
      return res.status(400).json({ error: 'Authentication verification failed' });
    }
    
    // Update the device counter
    device.counter = verification.authenticationInfo.newCounter;
    
    // Clear the challenge
    user.currentChallenge = null;
    
    // Generate a simple token (in a real app, you would use JWT)
    const token = crypto.randomBytes(32).toString('hex');
    
    // In a real application, you would store the token with an expiry
    // For this demo, we'll just store it in memory
    user.token = token;
    
    // Return user info and token
    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username
      },
      token
    });
    
    if (!verification.verified) {
      return res.status(400).json({ error: 'Authentication verification failed' });
    }
    
    // Update the device counter
    device.counter = verification.authenticationInfo.newCounter;
    
    // Clear the challenge
    user.currentChallenge = null;
    
    // In a real application, you would generate a session token here
    // For this phase, we'll just return a success message
    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(500).json({
      error: 'Failed to verify authentication',
      details: error.message
    });
  }
});

/**
 * WebAuthn Token Verification Endpoint
 * Verifies if a token is valid and returns user information
 */
app.get('/webauthn/verify', (req, res) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Find the user with this token
    const user = Object.values(inMemoryUserDeviceDB).find(user => user.token === token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Return user information
    res.json({
      user: {
        id: user.id,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      error: 'Failed to verify token',
      details: error.message
    });
  }
});

// Start server
const PORT = process.env.PROXY_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Forwarding requests to: ${TV_SERVER_URL}`);
  console.log(`Serving temporary images from: ${TEMP_DIR}`);
  
  // Run initial cleanup
  cleanupTempImages();
});