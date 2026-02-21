import app from './src/index.js';

app.routes.forEach(route => {
  console.log(`${route.method} ${route.path}`);
});
