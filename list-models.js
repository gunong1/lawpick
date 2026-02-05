const fs = require('fs');
const https = require('https');

try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.+)/);
    if (!match) {
        console.error("No API Key found");
        process.exit(1);
    }

    const apiKey = match[1].trim();
    console.log("Listing models with Key:", apiKey.substring(0, 5) + "...");

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models?key=${apiKey}`,
        method: 'GET'
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Status:", res.statusCode);
            try {
                const json = JSON.parse(body);
                if (json.models) {
                    console.log("Available Models:");
                    json.models.forEach(m => {
                        if (m.supportedGenerationMethods.includes("generateContent")) {
                            console.log("- " + m.name);
                        }
                    });
                } else {
                    console.log("Response:", body);
                }
            } catch (e) {
                console.log("Raw Body:", body);
            }
        });
    });

    req.on('error', (e) => { console.error(e); });
    req.end();

} catch (e) { console.error(e); }
