const API_KEY = "AIzaSyCeBpElo6rNcxWRY_aqTF-FZMiDHgvGaOk";

async function check() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const flashModels = data.models?.filter(m => m.name.toLowerCase().includes('flash'));
    console.log("Flash Models:", flashModels.map(m => m.name));
  } catch (e) {
    console.error("Fetch Error:", e.message);
  }
}

check();
