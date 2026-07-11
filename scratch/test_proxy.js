const fetch = require('node-fetch');

async function testProxy() {
  const res = await fetch('http://localhost:3000/api/proxy-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Hello, world!', isJsonMode: false })
  });
  const data = await res.json();
  console.log(data);
}
testProxy();
