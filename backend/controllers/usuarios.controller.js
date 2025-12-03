const db = require('../config/db');
const bcrypt = require('bcrypt');

const getUsuariosPaginados = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const queryData = `
    SELECT *
    FROM usuario
    ORDER BY id_usuario ASC
    LIMIT ? OFFSET ?
  `;

  const queryTotal = `SELECT COUNT(*) AS total FROM usuario`;

  db.query(queryData, [limit, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener usuarios paginados" });
    }

    db.query(queryTotal, (err2, totalRows) => {
      if (err2) {
        return res.status(500).json({ error: "Error al contar usuarios" });
      }

      const total = totalRows[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        page,
        limit,
        total,
        totalPages,
        data: rows
      });
    });
  });
};

const getUsuarios = (req, res) => {
  db.query('SELECT * FROM usuario', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

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
      u.font_size,
      u.high_contrast,
      d.tipo_discapacidad AS nombre_discapacidad,
      d.descripcion AS descripcion_discapacidad
    FROM usuario u
    LEFT JOIN discapacidades d 
      ON u.Discapacidades_id_discapacidad = d.id_discapacidad
    WHERE u.id_usuario = ?;
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result[0]);
  });
};

const createUsuario = async (req, res) => {
  const { nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    db.query(
      `INSERT INTO usuario (nombre, correo, contrasena, celular, foto_perfil, Discapacidades_id_discapacidad)
       VALUES (?, ?, ?, ?, ?, ?)`,
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
          message: 'Usuario registrado correctamente'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const updateUsuario = (req, res) => {
  const { id } = req.params;
  const { correo, celular, Discapacidades_id_discapacidad } = req.body;

  if (!correo && !celular && !Discapacidades_id_discapacidad) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
  }

  const fields = [];
  const values = [];

  if (correo) {
    fields.push('correo = ?');
    values.push(correo);
  }

  if (celular) {
    fields.push('celular = ?');
    values.push(celular);
  }

  if (Discapacidades_id_discapacidad) {
    fields.push('Discapacidades_id_discapacidad = ?');
    values.push(Discapacidades_id_discapacidad);
  }

  values.push(id);

  const query = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar usuario' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado correctamente',
      id_usuario: id,
      actualizado: { correo, celular, Discapacidades_id_discapacidad }
    });
  });
};

const deleteUsuario = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuario eliminado correctamente' });
  });
};

const actualizarAccesibilidad = (req, res) => {
  const { id } = req.params;
  const { font_size, high_contrast } = req.body;

  const query = `
    UPDATE usuario 
    SET font_size = ?, high_contrast = ?
    WHERE id_usuario = ?
  `;

  db.query(query, [font_size, high_contrast, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar accesibilidad' });
    }

    res.json({ message: 'Accesibilidad actualizada correctamente' });
  });
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuariosPaginados,
  actualizarAccesibilidad
};
