import os
import subprocess
import sys
import time
import urllib.request
import json


def spawn_process(command, cwd):
    if os.name == "nt" and command[0] == "npm":
        command = ["npm.cmd", *command[1:]]
    return subprocess.Popen(command, cwd=cwd)


def wait_for_backend(url="http://127.0.0.1:8008/health", timeout=30):
    print("Waiting for backend...", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            # Using urllib instead of requests to avoid external dependencies in startup script
            proxy_handler = urllib.request.ProxyHandler({})
            opener = urllib.request.build_opener(proxy_handler)
            with opener.open(url, timeout=2) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data.get("status") == "ok":
                        print(" ready.")
                        return True
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(1)
    print(" FAILED. Check backend logs.")
    return False


def run():
    root = os.path.dirname(os.path.abspath(__file__))

    print("FININTEL PLATFORM STARTUP")
    print("------------------------------------------")

    print("Starting backend API...")
    backend = spawn_process([sys.executable, "-m", "backend.main"], cwd=root)

    if not wait_for_backend():
        print("Backend failed to start. Terminating startup.")
        backend.terminate()
        sys.exit(1)

    print("Starting frontend dashboard...")
    frontend = spawn_process(["npm", "run", "dev", "--", "--host", "0.0.0.0"], cwd=root)

    print("\nDashboard is live at http://localhost:5173")
    print("Press Ctrl+C to shut down.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down services...")
        backend.terminate()
        frontend.terminate()
        sys.exit(0)


if __name__ == "__main__":
    run()
