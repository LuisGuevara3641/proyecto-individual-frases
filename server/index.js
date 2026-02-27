// Express + CORS para que el front pueda llamar desde otro puerto
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { PORT, POSITIVE_API_BASE, EAC_QUOTES_URL, FAVORITES_FILENAME } from './config.js';
import { validateFavoriteBody } from './validators/favorites.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, 'data');
const favoritosPath = path.join(dataPath, FAVORITES_FILENAME);

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

function leerFavoritos() {
  try {
    const texto = fs.readFileSync(favoritosPath, 'utf-8');
    return JSON.parse(texto);
  } catch {
    return [];
  }
}

function guardarFavoritos(lista) {
  fs.writeFileSync(favoritosPath, JSON.stringify(lista, null, 2), 'utf-8');
}

// --- Rutas ---

app.get('/api/favoritos', (req, res) => {
  const favoritos = leerFavoritos();
  res.json(favoritos);
});

app.post('/api/favoritos', (req, res) => {
  const validation = validateFavoriteBody(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }
  const { content, author, nota } = validation.data;
  const favoritos = leerFavoritos();
  const yaExiste = favoritos.some(
    (f) => f.content === content && f.author === author
  );
  if (yaExiste) {
    return res.status(409).json({ error: 'Ya está en favoritos' });
  }
  const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);
  const nuevo = {
    id,
    content,
    author,
    nota: nota ?? '',
    fecha: new Date().toISOString(),
  };
  favoritos.push(nuevo);
  guardarFavoritos(favoritos);
  res.status(201).json(nuevo);
});

app.delete('/api/favoritos/:id', (req, res) => {
  const { id } = req.params;
  const favoritos = leerFavoritos().filter((f) => f.id !== id);
  guardarFavoritos(favoritos);
  res.status(204).send();
});

function fetchPositive(urlPath) {
  return new Promise((resolve, reject) => {
    const opts = { rejectUnauthorized: false };
    const url = POSITIVE_API_BASE + urlPath;
    const req = https.get(url, opts, (resp) => {
      if (resp.statusCode !== 200) {
        reject(new Error(`API respondió ${resp.statusCode}`));
        return;
      }
      let body = '';
      resp.on('data', (chunk) => { body += chunk; });
      resp.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function normalizarFrasePositive(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    content: data.text || data.phrase || '',
    author_id: data.author_id ?? null,
    author: null,
    _id: data.id != null ? String(data.id) : '',
    category_id: data.category_id ?? null,
  };
}

app.get('/api/frases', async (req, res) => {
  try {
    const list = await fetchPositive('/phrases/esp');
    const arr = Array.isArray(list) ? list : [];
    const frases = arr.map(normalizarFrasePositive).filter(Boolean);
    res.json(frases);
  } catch (err) {
    console.error('Error /api/frases:', err.message);
    res.status(502).json({ error: err.message });
  }
});

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, opts, (resp) => {
      if (resp.statusCode !== 200) {
        reject(new Error(`HTTP ${resp.statusCode}`));
        return;
      }
      let body = '';
      resp.on('data', (chunk) => { body += chunk; });
      resp.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function fetchEACQuotes() {
  return fetchJson(EAC_QUOTES_URL).then((data) => {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).map(([key, item]) => {
      const es = item?.quote?.es;
      if (!es?.text) return null;
      return {
        content: String(es.text).trim(),
        author_id: null,
        author: (es.author && String(es.author).trim()) || 'Anónimo',
        _id: 'eac-' + key,
        category_id: null,
      };
    }).filter(Boolean);
  });
}

app.get('/api/frases/extra', async (req, res) => {
  console.log('[DEBUG] API extra (EAC): pidiendo...');
  const start = Date.now();
  try {
    const eac = await fetchEACQuotes().catch((err) => { console.warn('[DEBUG] EAC:', err.message); return []; });
    console.log(`[DEBUG] API extra (EAC): OK en ${Date.now() - start}ms — ${eac.length} frases`);
    res.json(eac);
  } catch (err) {
    console.warn(`[DEBUG] API extra (EAC): ERROR en ${Date.now() - start}ms —`, err.message);
    res.json([]);
  }
});

app.get('/api/categorias', async (req, res) => {
  try {
    const data = await fetchPositive('/categories');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error /api/categorias:', err.message);
    res.status(502).json([]);
  }
});

app.get('/api/autores', async (req, res) => {
  try {
    const data = await fetchPositive('/authors');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error /api/autores:', err.message);
    res.status(502).json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
