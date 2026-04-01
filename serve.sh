#!/bin/bash
cd "$(dirname "$0")"
PORT="${PORT:-8093}"
python3 -c "
import http.server, socketserver, os
os.chdir('$(pwd)')
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('', $PORT), handler) as httpd:
    print(f'Serving on port $PORT')
    httpd.serve_forever()
"
