const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const fs = require("fs");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deploy() {
  try {
    const rulesPath = path.join(__dirname, "../firestore.rules");
    const rulesContent = fs.readFileSync(rulesPath, "utf8");
    
    console.log("Reading firestore.rules from:", rulesPath);
    
    const securityRules = admin.securityRules();
    console.log("Releasing firestore ruleset from source...");
    await securityRules.releaseFirestoreRulesetFromSource(rulesContent);
    
    console.log("SUCCESS: Firestore security rules successfully deployed!");
    process.exit(0);
  } catch (error) {
    console.error("ERROR: Failed to deploy firestore rules programmatically:", error);
    console.log("\nIf this service account doesn't have permissions to deploy rules, please copy firestore.rules contents manually and paste them into the Firebase Console.");
    process.exit(1);
  }
}

deploy();
