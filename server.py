import http.server
import socketserver
import os

PORT = 5500
os.chdir(os.path.dirname(os.path.abspath(__file__)))

handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Frontend running at http://127.0.0.1:{PORT}")
    print("Press CTRL+C to stop")
    httpd.serve_forever()
