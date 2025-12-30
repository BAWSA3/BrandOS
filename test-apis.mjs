import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

console.log("=== API Connection Tests ===\n");

// Test Gemini API
async function testGemini() {
  console.log("1. Testing Gemini API...");

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.log("   FAILED: GOOGLE_GEMINI_API_KEY not set in .env.local");
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Hello, connection successful!' in exactly those words.");
    const response = await result.response;
    console.log("   SUCCESS: Gemini API connected!");
    console.log(`   Response: ${response.text().trim()}`);
    return true;
  } catch (error) {
    console.log(`   FAILED: ${error.message}`);
    return false;
  }
}

// Test X API
async function testX() {
  console.log("\n2. Testing X (Twitter) API...");

  if (!X_BEARER_TOKEN || X_BEARER_TOKEN === "your_x_bearer_token_here") {
    console.log("   FAILED: X_BEARER_TOKEN not set in .env.local");
    return false;
  }

  try {
    const response = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        "Authorization": `Bearer ${X_BEARER_TOKEN}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("   SUCCESS: X API connected!");
      console.log(`   Authenticated as: @${data.data.username}`);
      return true;
    } else {
      const error = await response.json();
      console.log(`   FAILED: ${response.status} - ${error.detail || error.title || JSON.stringify(error)}`);
      return false;
    }
  } catch (error) {
    console.log(`   FAILED: ${error.message}`);
    return false;
  }
}

// Run tests
const geminiOk = await testGemini();
const xOk = await testX();

console.log("\n=== Summary ===");
console.log(`Gemini API: ${geminiOk ? "OK" : "FAILED"}`);
console.log(`X API: ${xOk ? "OK" : "FAILED"}`);
