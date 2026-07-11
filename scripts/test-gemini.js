const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBSC1zXOO6ia6u5xcstBccbaWf6G_RTk5A";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testAll() {
  const models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-pro"];
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hi");
      console.log(`✅ ${m} Working:`, result.response.text());
      return;
    } catch (e) {
      console.error(`❌ ${m} Failed:`, e.message);
    }
  }
}
testAll();
