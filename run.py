import subprocess, time, webbrowser, os, sys, socket
from datetime import datetime

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def init_env():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env")
    required_keys = [
        "ZERODHA_API_KEY",
        "ZERODHA_ACCESS_TOKEN",
        "OPENAI_API_KEY",
        "NVIDIA_API_KEY"
    ]
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            for key in required_keys: f.write(f"{key}=\n")
        print(f"📄 Created .env with {len(required_keys)} Nexus Tactical Key placeholders.")

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    init_env()
    
    print("\n" + "🛡️ " + "="*50)
    print("🚀 SOVEREIGN INTELLIGENCE NEXUS (v2.3)")
    print("="*50)

    # 1. Start Backend Kernel
    print("📡 Igniting Intelligence Kernel...")
    backend_path = os.path.join(base_dir, "backend", "main.py")
    backend_proc = subprocess.Popen([sys.executable, backend_path])

    # 2. Start Tactical Interface
    print("🖥️  Booting Tactical Interface...")
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=base_dir, shell=True)

    print("⏳ Synchronizing Nexus Mesh...")
    ready = False
    for i in range(60):
        if is_port_open(8008) and is_port_open(5173):
            ready = True
            break
        time.sleep(1)
        if i % 5 == 0: print(f"   [Mesh Sync: Backend {'OK' if is_port_open(8008) else '...'} | UI {'OK' if is_port_open(5173) else '...'}]")

    if ready:
        print("\n✅ NEXUS ONLINE")
        webbrowser.open("http://localhost:5173")
        print("🌍 Nexus Command: http://localhost:5173")
    else:
        print("\n❌ MESH TIMEOUT: Synchronization failed.")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 SHUTTING DOWN...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    run()