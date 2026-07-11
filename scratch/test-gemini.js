const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GOOGLE_AI_API_KEY || "AIzaSyANl3-T7ADYDnlUXys-fx-3YQCD06NGMkk";
const genAI = new GoogleGenerativeAI(API_KEY);

async function test(modelName) {
  console.log(`Testing model: ${modelName}`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, reply with one word.");
    const response = await result.response;
    console.log(`Success! Response for ${modelName}:`, response.text());
  } catch (error) {
    console.error(`Error for ${modelName}:`, error.message);
  }
}

async function run() {
  await test("gemini-2.5-flash");
  await test("gemini-2.0-flash");
  await test("gemini-1.5-flash");
}

run();
