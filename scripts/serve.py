"""Local server that behaves like Cloudflare Pages: clean URLs, 404 page.
Run:  python scripts/serve.py   then open http://localhost:8000
"""
import http.server, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def translate_path(self, path):
        p = super().translate_path(path.split('?')[0])
        if os.path.isdir(p): return os.path.join(p, 'index.html')
        if not os.path.exists(p) and os.path.exists(p + '.html'): return p + '.html'
        return p
    def send_error(self, code, *a, **k):
        if code == 404:
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        super().send_error(code, *a, **k)
    def log_message(self, *a): pass

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print(f'http://localhost:{port}')
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
