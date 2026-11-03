import http.server
import socketserver
import os
import sys

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 3000
directory = os.path.dirname(os.path.abspath(__file__))
os.chdir(directory)

try:
    with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
        print(f"Serving GitAtlas at http://localhost:{PORT}")
        sys.stdout.flush()
        httpd.serve_forever()
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)

