const db = require('../config/db');

const getUsuarios = (req, res) => {
  db.query('SELECT * FROM usuario', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const createUsuario = (req, res) => {
  const { nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad } = req.body;

  db.query(
    'INSERT INTO usuario (nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id_usuario: result.insertId,
        nombre,
        correo,
        celular,
        foto_perfil,
        Discapacidades_id_discapacidad
      });
    }
  );
};

const updateUsuario = (req, res) => {
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
};

const deleteUsuario = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM resenas WHERE Usuario_id_usuario = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: '✅ Usuario y reseñas eliminados' });
    });
  });
};

module.exports = { getUsuarios, createUsuario, updateUsuario, deleteUsuario };
