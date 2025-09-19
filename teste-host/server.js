import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// helper
const q = (text, params = []) => pool.query(text, params);

// serve o front-end (index.html)
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
 *         PRODUCTS
 * ========================= */
app.get('/api/products', async (req, res) => {
  const { rows } = await q('select * from products order by name asc');
  res.json(rows);
});

app.post('/api/products', async (req, res) => {
  try {
    const { code, name, unit = 'un', min_stock = 0, base_cost = 0 } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'code e name são obrigatórios' });
    }
    const id = uuid();
    const { rows } = await q(
      'insert into products (id, code, name, unit, min_stock, base_cost) values ($1,$2,$3,$4,$5,$6) returning *',
      [id, String(code).trim(), String(name).trim(), unit, min_stock, base_cost]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (String(e.message).includes('unique')) {
      return res.status(409).json({ error: 'code já existe' });
    }
    res.status(500).json({ error: 'erro ao criar produto' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // apaga movimentos primeiro (evita FK error)
    await q('delete from moves where product_id=$1', [id]);
    const r = await q('delete from products where id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'produto não encontrado', id });
    return res.status(204).end();
  } catch (err) {
    console.error('Erro ao remover product', err);
    return res.status(500).json({ error: 'erro ao remover produto', details: err.message });
  }
});

/* =========================
 *          MOVES
 * ========================= */

// listar (útil para debug; o front usa /api/report, mas deixo aqui)
app.get('/api/moves', async (req, res) => {
  const { rows } = await q('select * from moves order by date_iso desc');
  res.json(rows);
});

// criar
app.post('/api/moves', async (req, res) => {
  const { product_id, type, qty, unit_price = 0, date_iso, note } = req.body;

  // valida obrigatórios
  if (!product_id || !type || !qty || !date_iso) {
    return res.status(400).json({ error: 'campos obrigatórios faltando' });
  }
  if (!['IN', 'OUT'].includes(type)) {
    return res.status(400).json({ error: 'type inválido' });
  }

  try {
    const id = uuid();
    const { rows } = await q(
      `insert into moves (id, product_id, type, qty, unit_price, date_iso, note)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      // ORDEM CORRETA
      [id, product_id, type, qty, unit_price, date_iso, note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao inserir move', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  }
});

// remover
app.delete('/api/moves/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('DELETE /api/moves id =>', id);
    const { rowCount } = await q('delete from moves where id=$1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'move não encontrado', id });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('Erro ao remover move', err);
    return res.status(500).json({ error: 'erro ao remover move', details: err.message });
  }
});

/* =========================
 *          REPORT
 * ========================= */
app.get('/api/report', async (req, res) => {
  const [products, moves] = await Promise.all([
    q('select * from products order by name asc'),
    q('select * from moves order by date_iso asc'),
  ]);
  res.json({ products: products.rows, moves: moves.rows });
});

/* =========================
 *          SPA
 * ========================= */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`DANI BLUES API on http://localhost:${port}`));
