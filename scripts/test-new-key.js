const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyCeBpElo6rNcxWRY_aqTF-FZMiDHgvGaOk";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
  try {
    console.log("Testing NEW API Key...");
    const result = await model.generateContent("Hello");
    console.log("✅ New API Key working! Response:", result.response.text());
  } catch (error) {
    console.error("❌ New API Key Failed:", error.message);
  }
}

test();
