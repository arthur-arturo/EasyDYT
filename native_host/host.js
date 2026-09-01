const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const LOG_FILE = path.join(__dirname, 'host.log');
function log(msg) {
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

log("EasyDYT Host iniciado.");

// Protocolo Chrome Native Messaging
function sendNativeMessage(msgObj) {
  const jsonStr = JSON.stringify(msgObj);
  const msgBuffer = Buffer.from(jsonStr, 'utf-8');
  const lenBuffer = Buffer.alloc(4);
  lenBuffer.writeUInt32LE(msgBuffer.length, 0);

  process.stdout.write(lenBuffer);
  process.stdout.write(msgBuffer);
  log(`Mensaje enviado: ${jsonStr}`);
}

// Búsqueda inteligente de ejecutables en WinGet y Sistema
function findBinary(name, searchSubDir) {
  const localAppData = process.env.LOCALAPPDATA || '';
  const packagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  
  if (fs.existsSync(packagesDir)) {
    try {
      const entries = fs.readdirSync(packagesDir);
      for (const entry of entries) {
        if (entry.toLowerCase().includes(searchSubDir.toLowerCase())) {
          const fullDir = path.join(packagesDir, entry);
          const found = findInDir(fullDir, name);
          if (found) return found;
        }
      }
    } catch (e) {}
  }

  const linkPath = path.join(localAppData, 'Microsoft', 'WinGet', 'Links', name);
  if (fs.existsSync(linkPath)) return linkPath;

  return name;
}

function findInDir(dir, targetFile) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const res = findInDir(full, targetFile);
        if (res) return res;
      } else if (f.toLowerCase() === targetFile.toLowerCase()) {
        return full;
      }
    }
  } catch (e) {}
  return null;
}

const YT_DLP_EXE = findBinary('yt-dlp.exe', 'yt-dlp.yt-dlp');
const FFMPEG_EXE = findBinary('ffmpeg.exe', 'yt-dlp.FFmpeg');
const DENO_EXE = findBinary('deno.exe', 'DenoLand.Deno');

const FFMPEG_DIR = FFMPEG_EXE && FFMPEG_EXE.includes('\\') ? path.dirname(FFMPEG_EXE) : null;

log(`Rutas detectadas:
- yt-dlp: ${YT_DLP_EXE}
- ffmpeg dir: ${FFMPEG_DIR}
- deno: ${DENO_EXE}`);

function runYtDlp(args, onProgress) {
  return new Promise((resolve, reject) => {
    const env = Object.assign({}, process.env);
    if (FFMPEG_DIR) {
      env.PATH = FFMPEG_DIR + ';' + (env.PATH || '');
    }

    log(`Spawneando: ${YT_DLP_EXE} ${args.join(' ')}`);
    const child = spawn(YT_DLP_EXE, args, { env, windowsHide: true });
    
    let stdout = '';
    let stderr = '';
    let lastPercent = -1;

    child.stdout.on('data', (d) => {
      const s = d.toString();
      stdout += s;
      log(`[STDOUT] ${s.trim()}`);

      if (onProgress) {
        const match = s.match(/\[download\]\s+([\d\.]+)%/);
        if (match) {
          const pct = Math.round(parseFloat(match[1]));
          if (pct !== lastPercent && pct >= 0 && pct <= 100) {
            lastPercent = pct;
            onProgress({ type: 'progress', percent: pct });
          }
        } else if (s.includes('[ExtractAudio]')) {
          onProgress({ type: 'status', text: 'Convirtiendo...' });
        } else if (s.includes('[Merger]')) {
          onProgress({ type: 'status', text: 'Uniendo...' });
        }
      }
    });

    child.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      log(`[STDERR] ${s.trim()}`);
    });

    child.on('error', (err) => {
      log(`[SPAWN ERROR] ${err.message}`);
      reject(err);
    });

    child.on('close', (code) => {
      log(`[EXIT CODE] ${code}`);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || stdout || `Código de salida: ${code}`));
      }
    });
  });
}

// Descargar video o audio
async function handleDownload(url, mode, onProgress) {
  log(`Procesando solicitud: ${url} (Modo: ${mode})`);
  const downloadsDir = path.join(os.homedir(), 'Downloads');
  const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');

  const baseArgs = [
    '--no-warnings',
    '--no-playlist',
    '--force-overwrites',
    '-N', '4',
    '-o', outputTemplate
  ];

  if (FFMPEG_DIR) {
    baseArgs.push('--ffmpeg-location', FFMPEG_DIR);
  }

  if (DENO_EXE && DENO_EXE.includes('\\')) {
    baseArgs.push('--js-runtimes', `deno:${DENO_EXE}`);
  }

  if (mode === 'audio') {
    // Descarga rápida directa de solo audio (140 = m4a ~16MB o mejor stream disponible)
    baseArgs.push('-f', '140/ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '320k');
  } else {
    // Video MP4 en alta calidad
    baseArgs.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b', '--merge-output-format', 'mp4');
  }

  baseArgs.push(url);

  try {
    log('Ejecutando descarga directa...');
    await runYtDlp(baseArgs, onProgress);
    return {
      success: true,
      message: 'Descarga completada con éxito en tu carpeta de Descargas'
    };
  } catch (err1) {
    log(`Intento 1 falló: ${err1.message}`);

    // Fallback sin restricción de formato
    try {
      log('Intento 2: Fallback ba/b...');
      const fallbackArgs = baseArgs.map(a => a === '140/ba/b' ? 'ba/b' : a);
      await runYtDlp(fallbackArgs, onProgress);
      return {
        success: true,
        message: 'Descarga completada con éxito en tu carpeta de Descargas'
      };
    } catch (err2) {
      log(`Intento 2 falló: ${err2.message}`);
      throw err2;
    }
  }
}

let inputBuffer = Buffer.alloc(0);

process.stdin.on('data', async (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);

  while (inputBuffer.length >= 4) {
    const msgLen = inputBuffer.readUInt32LE(0);

    if (inputBuffer.length < 4 + msgLen) {
      break;
    }

    const msgData = inputBuffer.slice(4, 4 + msgLen);
    inputBuffer = inputBuffer.slice(4 + msgLen);

    try {
      const request = JSON.parse(msgData.toString('utf-8'));
      log(`Petición recibida: ${JSON.stringify(request)}`);

      if (request.action === 'ping') {
        sendNativeMessage({ success: true, version: '2.0.0', type: 'pong' });
      } else if (request.action === 'download') {
        try {
          const result = await handleDownload(request.url, request.mode || 'audio', (prog) => {
            sendNativeMessage(prog);
          });
          sendNativeMessage({ type: 'complete', success: true, ...result });
        } catch (err) {
          sendNativeMessage({ type: 'complete', success: false, error: err.message || 'Error en yt-dlp' });
        }
      } else {
        sendNativeMessage({ type: 'complete', success: false, error: 'Acción desconocida' });
      }
    } catch (parseErr) {
      log(`Error parseando JSON: ${parseErr.message}`);
    }
  }
});

process.stdin.on('end', () => {
  log("Stdin cerrado, terminando host.");
  process.exit(0);
});
