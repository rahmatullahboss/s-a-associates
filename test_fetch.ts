import app from './src/index.js';

async function test() {
  const req1 = new Request('http://localhost/api/auth/me');
  const res1 = await app.fetch(req1);
  console.log('/api/auth/me -> ', res1.status, await res1.text());

  const req2 = new Request('http://localhost/');
  const res2 = await app.fetch(req2);
  console.log('/ -> ', res2.status, await res2.text());
  
  const req3 = new Request('http://localhost/api/site-settings');
  const res3 = await app.fetch(req3);
  console.log('/api/site-settings -> ', res3.status, await res3.text());
}
test();
