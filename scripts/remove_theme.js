const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeSecretTheme() {
    console.log("Checking user_stats collection...");
    const statsSnap = await db.collection('user_stats').get();
    let statsCount = 0;
    for (const doc of statsSnap.docs) {
        const data = doc.data();
        if (data.redemptions && data.redemptions.some(r => r.itemName === 'Secret App Theme')) {
            const filtered = data.redemptions.filter(r => r.itemName !== 'Secret App Theme');
            await doc.ref.update({ redemptions: filtered });
            statsCount++;
        }
    }
    console.log(`Removed Secret App Theme from ${statsCount} user_stats documents.`);

    console.log("Checking users collection...");
    const usersSnap = await db.collection('users').get();
    let usersCount = 0;
    for (const doc of usersSnap.docs) {
        const data = doc.data();
        if (data.redemptions && data.redemptions.some(r => r.itemName === 'Secret App Theme')) {
            const filtered = data.redemptions.filter(r => r.itemName !== 'Secret App Theme');
            await doc.ref.update({ redemptions: filtered });
            usersCount++;
        }
    }
    console.log(`Removed Secret App Theme from ${usersCount} users documents.`);
}

removeSecretTheme().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
