const { spawnSync } = require('child_process');

const candidates = ['python3', 'python'];
const args = ['-m', 'pip', 'install', '-r', 'requirements.txt'];

for (const command of candidates) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (!result.error && result.status === 0) {
    process.exit(0);
  }
}

console.warn('Python dependency installation did not complete automatically.');
process.exit(0);
