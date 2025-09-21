const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba1'
});

db.connect(err => {
  if (err) {
    console.error('❌ Error en MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');
});

// OBTENER TODOS
app.get('/usuarios', (req, res) => {
  db.query('SELECT * FROM usuario', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// CREAR
app.post('/usuarios', (req, res) => {
  const { nombre, correo } = req.body;
  db.query(
    'INSERT INTO usuario (nombre, correo) VALUES (?, ?)',
    [nombre, correo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_usuario: result.insertId, nombre, correo });
    }
  );
});

// ACTUALIZAR
app.put('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, correo } = req.body;
  db.query(
    'UPDATE usuario SET nombre=?, correo=? WHERE id_usuario=?',
    [nombre, correo, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_usuario: id, nombre, correo });
    }
  );
});

// ELIMINAR
app.delete('/usuarios/:id', (req, res) => {
  const { id } = req.params;

  // Primero borro las reseñas asociadas
  db.query('DELETE FROM resenas WHERE Usuario_id_usuario = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // Ahora borro el usuario
    db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: '✅ Usuario y reseñas eliminados' });
    });
  });
});


// Servidor
app.listen(3000, () => console.log('🚀 Backend en http://localhost:3000'));
