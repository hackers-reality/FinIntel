import subprocess, time, webbrowser, os, sys, shutil, socket
from datetime import datetime

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def init_env():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env")
    required_keys = [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY",
        "GROQ_API_KEY",
        "NVIDIA_NIM_API_KEY"
    ]
    
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            for key in required_keys:
                f.write(f"{key}=\n")
        print(f"📄 Created .env with {len(required_keys)} provider placeholders.")

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    init_env()
    
    print("\n" + "="*50)
    print("🚀 FININTEL PRO: SOVEREIGN COMMAND CENTER")
    print("="*50)

    # Pre-flight Check
    if is_port_open(8008):
        print("⚠️  Warning: Port 8008 (Backend) is already active.")
    if is_port_open(5173):
        print("⚠️  Warning: Port 5173 (Frontend) is already active.")

    # Start Backend Kernel
    print("📡 Initializing Intelligence Kernel...")
    backend_path = os.path.join(base_dir, "backend", "main.py")
    backend_proc = subprocess.Popen([sys.executable, backend_path])

    # Start Frontend Interface
    print("🖥️  Booting Strategic Interface...")
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=base_dir, shell=True)

    print("⏳ Synchronizing services...")
    ready = False
    for i in range(60):
        b_ready = is_port_open(8008)
        f_ready = is_port_open(5173)
        if b_ready and f_ready:
            ready = True
            break
        time.sleep(1)
        if i % 5 == 0: print(f"   [Waiting... Kernel: {'OK' if b_ready else '...'} | UI: {'OK' if f_ready else '...'}]")

    if ready:
        print("\n✅ SYSTEM ONLINE")
        print("🌍 Command Center: http://localhost:5173")
        print("⚙️  Intelligence API: http://localhost:8008")
        webbrowser.open("http://localhost:5173")
    else:
        print("\n❌ TIMEOUT: Services failed to synchronize in 60s.")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 SHUTTING DOWN SYSTEM...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("👋 Standby mode engaged.")

if __name__ == "__main__":
    run()