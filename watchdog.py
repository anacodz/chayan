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
CHECK_INTERVAL = 5  # faster check for testing

def log(message):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", buffering=1) as f: # Unbuffered write
        f.write(f"[{timestamp}] {message}\n")
    print(f"[{timestamp}] {message}", flush=True)

def kill_port_process(port):
    try:
        pids = subprocess.check_output(["lsof", "-t", f"-i:{port}"]).decode().strip().split("\n")
        for pid in pids:
            if pid:
                log(f"Killing process {pid} on port {port}")
                os.kill(int(pid), signal.SIGKILL)
        time.sleep(2)
    except subprocess.CalledProcessError:
        pass

def start_server():
    log(f"Starting dev server: {' '.join(DEV_COMMAND)}")
    process = subprocess.Popen(
        DEV_COMMAND,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        preexec_fn=os.setsid
    )
    return process

def check_health():
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", HEALTH_CHECK_URL],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip()
    except Exception as e:
        return f"ERROR: {e}"

def main():
    log("Watchdog version 1.2 started.")
    server_process = None
    start_time = 0
    
    while True:
        try:
            # Check if server process is alive
            if server_process is None or server_process.poll() is not None:
                if server_process and server_process.poll() is not None:
                    log(f"Server process terminated with exit code {server_process.returncode}")
                
                log("Server process missing or dead, restarting...")
                kill_port_process(PORT)
                server_process = start_server()
                start_time = time.time()
                time.sleep(10) # Wait for startup

            # Health check
            status = check_health()
            if status == "200":
                # log("Health check OK (200)")
                pass
            elif status == "000": 
                if time.time() - start_time < 30:
                    log("Server starting (status 000)...")
                else:
                    log(f"Health check failed (000), restarting...")
                    os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
                    server_process = None
            else:
                log(f"Health check status: {status}")
                if "ERROR" in status or status != "200":
                     log("Unexpected health check result, restarting...")
                     os.killpg(os.getpgid(server_process.pid), signal.SIGKILL)
                     server_process = None

            time.sleep(CHECK_INTERVAL)
        except Exception as e:
            log(f"Watchdog main loop error: {e}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
