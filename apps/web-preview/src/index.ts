const server = Bun.serve({
    port: 3000,
    fetch(req) {
        return new Response(`
      <html>
        <head>
          <title>StyleSwipe Architecture Preview</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { text-align: center; border: 1px solid #333; padding: 2rem; border-radius: 12px; background: #111; }
            h1 { background: linear-gradient(to right, #f09, #30f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3rem; margin-bottom: 0.5rem; }
            p { color: #888; }
            .status { margin-top: 1rem; padding: 0.5rem 1rem; background: #222; border-radius: 20px; display: inline-block; font-size: 0.8rem; }
            .dot { height: 10px; width: 10px; background-color: #0f0; border-radius: 50%; display: inline-block; margin-right: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>StyleSwipe</h1>
            <p>Architecture Initialized & Running on Bun</p>
            <div class="status">
              <span class="dot"></span> System Operational
            </div>
            <p style="margin-top: 2rem; font-size: 0.9rem;">
              Monorepo: <strong>Active</strong><br/>
              Runtime: <strong>Bun v${Bun.version}</strong><br/>
              Agent Protocol: <strong>Enabled</strong>
            </p>
          </div>
        </body>
      </html>
    `, {
            headers: {
                "Content-Type": "text/html",
            },
        });
    },
});

console.log(`Listening on http://localhost:${server.port} ...`);
