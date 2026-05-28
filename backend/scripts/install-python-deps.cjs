const { spawnSync } = require('child_process');

const candidates = [
  { command: 'python3', args: ['-m', 'pip', 'install', '-r', 'requirements.txt'] },
  { command: 'python', args: ['-m', 'pip', 'install', '-r', 'requirements.txt'] },
  { command: 'py', args: ['-3', '-m', 'pip', 'install', '-r', 'requirements.txt'] },
];

const verifyArgsMap = {
  python3: ['-c', 'import numpy, PIL; print("python deps ok")'],
  python: ['-c', 'import numpy, PIL; print("python deps ok")'],
  py: ['-3', '-c', 'import numpy, PIL; print("python deps ok")'],
};

for (const candidate of candidates) {
  console.log(`[python-deps] trying: ${candidate.command} ${candidate.args.join(' ')}`);
  const result = spawnSync(candidate.command, candidate.args, {
    stdio: 'inherit',
  });

  if (!result.error && result.status === 0) {
    const verify = spawnSync(candidate.command, verifyArgsMap[candidate.command], {
      stdio: 'inherit',
    });

    if (!verify.error && verify.status === 0) {
      console.log('[python-deps] install verification passed');
      process.exit(0);
    }
  }
}

console.error('[python-deps] installation failed or verification failed (numpy/Pillow missing).');
process.exit(1);
