import subprocess, time, webbrowser, os, sys, shutil, socket

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def init_env():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env")
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            f.write("OPENAI_API_KEY=\nANTHROPIC_API_KEY=\nGEMINI_API_KEY=\n")

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    init_env()
    print("🚀 Starting FinIntel Pro...")
    # Start Backend
    backend_path = os.path.join(base_dir, "backend", "main.py")
    backend_proc = subprocess.Popen([sys.executable, backend_path])

    # Start Frontend
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=base_dir, shell=True)

    print("⏳ Waiting for services to be ready...")
    for _ in range(60):
        if is_port_open(5173) and is_port_open(8008):
            break
        time.sleep(1)
    webbrowser.open("http://localhost:5173")
    print("\n✅ FinIntel is running!")
    
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
     run()