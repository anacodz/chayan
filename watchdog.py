import subprocess
import time
import os
import signal
import sys

# Configuration
PORT = 3000
DEV_COMMAND = ["npm", "run", "dev"]
HEALTH_CHECK_URL = f"http://localhost:{PORT}"
LOG_FILE = "DEV_SERVER_LOG.txt"
CHECK_INTERVAL = 10  # seconds

def log(message):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(f"[{timestamp}] {message}")

def kill_port_process(port):
    try:
        # Get all PIDs using the port
        pids = subprocess.check_output(["lsof", "-t", f"-i:{port}"]).decode().strip().split("\n")
        for pid in pids:
            if pid:
                log(f"Killing process {pid} on port {port}")
                os.kill(int(pid), signal.SIGKILL) # Force kill
        time.sleep(2)
    except subprocess.CalledProcessError:
        pass

def start_server():
    log(f"Starting dev server: {' '.join(DEV_COMMAND)}")
    # Use Popen to run in background
    process = subprocess.Popen(
        DEV_COMMAND,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        preexec_fn=os.setsid # Create process group
    )
    return process

def check_health():
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", HEALTH_CHECK_URL],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except Exception as e:
        return str(e)

def main():
    log("Watchdog started.")
    server_process = None
    start_time = 0
    
    while True:
        # Check if server process is alive
        if server_process is None or server_process.poll() is not None:
            if server_process and server_process.poll() is not None:
                log(f"Server process terminated with exit code {server_process.returncode}")
            
            kill_port_process(PORT)
            server_process = start_server()
            start_time = time.time()
            time.sleep(10) # Wait for it to start

        # Health check
        status = check_health()
        if status == "200":
            # log("Health check passed.")
            pass
        elif status == "000": # curl couldn't connect
            # If it just started, give it more time
            if time.time() - start_time < 30:
                log("Server still starting...")
            else:
                log(f"Health check failed: Connection refused")
                os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
                server_process = None
        else:
            log(f"Health check failed with status/error: {status}")
            os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
            server_process = None

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
