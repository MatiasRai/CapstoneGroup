const db = require('../config/db');
const bcrypt = require('bcrypt');

// ✅ Obtener todos los usuarios
const getUsuarios = (req, res) => {
  db.query('SELECT * FROM usuario', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// ✅ Obtener usuario por ID (para perfil)
const getUsuarioById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      u.id_usuario,
      u.nombre,
      u.correo,
      u.celular,
      u.foto_perfil,
      u.Discapacidades_id_discapacidad,
      d.tipo_discapacidad AS nombre_discapacidad,
      d.descripcion AS descripcion_discapacidad
    FROM usuario u
    LEFT JOIN discapacidades d 
      ON u.Discapacidades_id_discapacidad = d.id_discapacidad
    WHERE u.id_usuario = ?;
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Error SQL en getUsuarioById:', err.sqlMessage);
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result[0]);
  });
};

// ✅ Crear usuario
const createUsuario = async (req, res) => {
  const { nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    db.query(
      'INSERT INTO usuario (nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, correo, hashedPassword, celular, foto_perfil, Discapacidades_id_discapacidad],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({
          id_usuario: result.insertId,
          nombre,
          correo,
          celular,
          foto_perfil,
          Discapacidades_id_discapacidad,
          message: '✅ Usuario registrado con contraseña protegida'
        });
      }
    );
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    res.status(500).json({ error: '❌ Error al registrar usuario' });
  }
};

// ✅ Actualizar usuario
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

// ✅ Eliminar usuario
const deleteUsuario = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err2) => {
    if (err2) return res.status(500).json({ error: err2.message });
    res.json({ message: '✅ Usuario eliminado' });
  });
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
};
