import { execSync } from 'child_process';

const args = process.argv.slice(2);
const PORTS = args.length > 0 ? args.map(Number).filter(n => !isNaN(n)) : [8081, 8082, 3001];

function killPorts() {
  console.log(`🔍 Checking for active processes on ports: ${PORTS.join(', ')}...`);

  if (process.platform === 'win32') {
    // Windows implementation
    for (const port of PORTS) {
      try {
        // Find PID using netstat
        const output = execSync(`netstat -ano | findstr :${port}`).toString().trim();
        const lines = output.split('\n');
        const pids = new Set<string>();

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          // netstat output lines: Proto  LocalAddress  ForeignAddress  State  PID
          // PID is the last element
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && /^\d+$/.test(pid)) {
              pids.add(pid);
            }
          }
        }

        for (const pid of pids) {
          console.log(`💀 Killing Windows process PID ${pid} holding port ${port}...`);
          try {
            execSync(`taskkill /F /PID ${pid}`);
          } catch (err) {
            // Ignore if process already exited
          }
        }
      } catch (err) {
        // netstat throws if no matches are found, which is fine (port is free)
      }
    }
  } else {
    // macOS and Linux implementation
    for (const port of PORTS) {
      try {
        const pid = execSync(`lsof -t -i:${port}`).toString().trim();
        if (pid) {
          const pids = pid.split('\n');
          for (const p of pids) {
            if (p) {
              console.log(`💀 Killing Unix process PID ${p} holding port ${port}...`);
              execSync(`kill -9 ${p}`);
            }
          }
        }
      } catch (err) {
        // lsof throws if no process found, which is fine (port is free)
      }
    }
  }

  console.log('✅ Port check and cleanup complete.\n');
}

killPorts();
