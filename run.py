import os
import subprocess
import sys
import time


def spawn_process(command, cwd):
    if os.name == "nt" and command[0] == "npm":
        command = ["npm.cmd", *command[1:]]
    return subprocess.Popen(command, cwd=cwd)


def run():
    root = os.path.dirname(os.path.abspath(__file__))

    print("FININTEL PLATFORM STARTUP")
    print("------------------------------------------")

    print("Starting backend API...")
    backend = spawn_process([sys.executable, "-m", "backend.main"], cwd=root)

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
