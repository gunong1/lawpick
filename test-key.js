const fs = require('fs');
const https = require('https');

// Read .env.local manually
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.+)/);
    if (!match) {
        console.error("No API Key found in .env.local");
        process.exit(1);
    }

    const apiKey = match[1].trim();
    console.log("Testing Key:", apiKey.substring(0, 5) + "...");

    const data = JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Response Status:", res.statusCode);
            console.log("Response Body:", body);
        });
    });

    req.on('error', (e) => {
        console.error("Request Error:", e);
    });

    req.write(data);
    req.end();

} catch (e) {
    console.error("Error reading file:", e);
}
