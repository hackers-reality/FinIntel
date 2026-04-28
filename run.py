import subprocess
import time
import webbrowser
import os
import sys

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("🚀 Starting FinIntel Pro...")

    # 1. Start Backend
    backend_path = os.path.join(base_dir, "backend", "main.py")
    backend_proc = subprocess.Popen([sys.executable, backend_path], 
                                    stdout=subprocess.PIPE, 
                                    stderr=subprocess.STDOUT)
    
    # 2. Start Frontend
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], 
                                     cwd=base_dir,
                                     shell=True,
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.STDOUT)

    print("⏳ Initializing services (takes ~5 seconds)...")
    time.sleep(5)

    # 3. Open Browser
    print("🌐 Opening Dashboard...")
    webbrowser.open("http://localhost:5173")

    print("\n✅ FinIntel is running!")
    print("👉 Keep this window open to stay connected.")
    print("⌨️ Press Ctrl+C to shut down.")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    run()
