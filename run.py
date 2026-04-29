import subprocess
import time
import sys
import os

def run():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_path = os.path.join(root, "backend", "main.py")
    frontend_dir = root

    print("🚀 FININTEL TERMINAL - STRATEGIC IGNITION")
    print("──────────────────────────────────────────")
    
    # 1. Start Backend Kernel
    print("• Igniting Intelligence Kernel...")
    backend = subprocess.Popen([sys.executable, backend_path])
    
    # 2. Start Frontend Interface
    print("• Igniting Tactical Interface...")
    frontend = subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir, shell=True)
    
    print("\n✅ Terminal is live at http://localhost:5173")
    print("🛡️ Press Ctrl+C to shutdown.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 SHUTTING DOWN TERMINAL...")
        backend.terminate()
        frontend.terminate()
        sys.exit(0)

if __name__ == "__main__":
    run()