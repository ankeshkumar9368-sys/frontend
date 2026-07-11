const { GoogleGenerativeAI } = require('@google/generative-ai');

const key = "AIzaSyCeBpElo6rNcxWRY_aqTF-FZMiDHgvGaOk";
console.log("Testing API Key:", key);

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function runTest() {
  try {
    const result = await model.generateContent("Hello, respond in one word.");
    console.log("Success! Response text:", result.response.text());
  } catch (error) {
    console.error("Gemini API Error:", error);
  }
}

runTest();
