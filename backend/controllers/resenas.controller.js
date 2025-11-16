const db = require('../config/db');

/* ======================================================
   ⭐ OBTENER TODAS LAS RESEÑAS DE UN USUARIO
====================================================== */
const getResenasByUsuario = (req, res) => {
  const { id_usuario } = req.params;

  console.log(`🔍 Buscando reseñas para usuario ${id_usuario}...`);

  const query = `
    SELECT 
      r.id_resena,
      r.valoracion,
      r.comentarios,
      r.fecha_resena,
      r.Lugares_id_lugar,
      r.Usuario_id_usuario,
      l.nombre_lugar,
      l.direccion_lugar,
      e.nombre_empresa,
      s.nombre_servicio
    FROM resenas r
    LEFT JOIN lugares l ON r.Lugares_id_lugar = l.id_lugar
    LEFT JOIN empresas e ON l.Empresas_id_empresa = e.id_empresa
    LEFT JOIN servicios s ON s.Lugares_id_lugar = l.id_lugar
    WHERE r.Usuario_id_usuario = ?
    ORDER BY r.fecha_resena DESC
  `;

  db.query(query, [id_usuario], (err, rows) => {
    if (err) {
      console.error('❌ Error SQL en getResenasByUsuario:', err.sqlMessage);
      console.error('❌ Error completo:', err);
      return res.status(500).json({ 
        error: 'Error al obtener reseñas del usuario',
        details: err.sqlMessage 
      });
    }

    console.log(`✅ ${rows.length} reseñas encontradas para usuario ${id_usuario}`);
    res.json(rows || []);
  });
};

/* ======================================================
   ⭐ CREAR UNA NUEVA RESEÑA
====================================================== */
const createResena = (req, res) => {
  const { valoracion, comentarios, Lugares_id_lugar, id_usuario } = req.body;

  console.log('📝 Intentando crear reseña:', { valoracion, Lugares_id_lugar, id_usuario });

  // Validaciones
  if (!valoracion || !Lugares_id_lugar || !id_usuario) {
    return res.status(400).json({ 
      error: 'Faltan datos obligatorios: valoracion, Lugares_id_lugar, id_usuario' 
    });
  }

  if (valoracion < 1 || valoracion > 5) {
    return res.status(400).json({ 
      error: 'La valoración debe estar entre 1 y 5' 
    });
  }

  const query = `
    INSERT INTO resenas (valoracion, comentarios, fecha_resena, Lugares_id_lugar, Usuario_id_usuario)
    VALUES (?, ?, CURDATE(), ?, ?)
  `;

  db.query(
    query,
    [valoracion, comentarios || '', Lugares_id_lugar, id_usuario],
    (err, result) => {
      if (err) {
        console.error('❌ Error al crear reseña:', err.sqlMessage);
        console.error('❌ Error completo:', err);
        return res.status(500).json({ 
          error: 'Error al crear reseña',
          details: err.sqlMessage 
        });
      }

      console.log(`✅ Reseña ${result.insertId} creada correctamente`);
      res.status(201).json({
        id_resena: result.insertId,
        valoracion,
        comentarios,
        Lugares_id_lugar,
        id_usuario,
        message: '✅ Reseña creada correctamente'
      });
    }
  );
};

/* ======================================================
   ⭐ ACTUALIZAR UNA RESEÑA
====================================================== */
const updateResena = (req, res) => {
  const { id } = req.params;
  const { valoracion, comentarios } = req.body;

  console.log(`✏️ Actualizando reseña ${id}...`);

  // Validación
  if (valoracion && (valoracion < 1 || valoracion > 5)) {
    return res.status(400).json({ 
      error: 'La valoración debe estar entre 1 y 5' 
    });
  }

  const fields = [];
  const values = [];

  if (valoracion !== undefined) {
    fields.push('valoracion = ?');
    values.push(valoracion);
  }

  if (comentarios !== undefined) {
    fields.push('comentarios = ?');
    values.push(comentarios);
  }

  if (fields.length === 0) {
    return res.status(400).json({ 
      error: 'Debe proporcionar al menos un campo para actualizar' 
    });
  }

  values.push(id);

  const query = `UPDATE resenas SET ${fields.join(', ')} WHERE id_resena = ?`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error al actualizar reseña:', err.sqlMessage);
      return res.status(500).json({ 
        error: 'Error al actualizar reseña',
        details: err.sqlMessage 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '⚠️ Reseña no encontrada' });
    }

    console.log(`✅ Reseña ${id} actualizada correctamente`);
    res.json({ message: '✅ Reseña actualizada correctamente' });
  });
};

/* ======================================================
   ⭐ ELIMINAR UNA RESEÑA
====================================================== */
const deleteResena = (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Intentando eliminar reseña ${id}...`);

  db.query('DELETE FROM resenas WHERE id_resena = ?', [id], (err, result) => {
    if (err) {
      console.error('❌ Error al eliminar reseña:', err.sqlMessage);
      return res.status(500).json({ 
        error: 'Error al eliminar reseña',
        details: err.sqlMessage 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '⚠️ Reseña no encontrada' });
    }

    console.log(`✅ Reseña ${id} eliminada correctamente`);
    res.json({ message: '✅ Reseña eliminada correctamente' });
  });
};

/* ======================================================
   ⭐ OBTENER RESEÑAS DE UN LUGAR ESPECÍFICO
====================================================== */
const getResenasByLugar = (req, res) => {
  const { id_lugar } = req.params;

  console.log(`🔍 Buscando reseñas para lugar ${id_lugar}...`);

  const query = `
    SELECT 
      r.id_resena,
      r.valoracion,
      r.comentarios,
      r.fecha_resena,
      u.nombre AS usuario_nombre,
      u.foto_perfil
    FROM resenas r
    LEFT JOIN usuario u ON r.Usuario_id_usuario = u.id_usuario
    WHERE r.Lugares_id_lugar = ?
    ORDER BY r.fecha_resena DESC
  `;

  db.query(query, [id_lugar], (err, rows) => {
    if (err) {
      console.error('❌ Error SQL en getResenasByLugar:', err.sqlMessage);
      return res.status(500).json({ 
        error: 'Error al obtener reseñas del lugar',
        details: err.sqlMessage 
      });
    }

    console.log(`✅ ${rows.length} reseñas encontradas para lugar ${id_lugar}`);
    res.json(rows || []);
  });
};

/* ======================================================
   🧪 VERIFICAR ESTADO DE LA TABLA (para debugging)
====================================================== */
const checkTableStatus = (req, res) => {
  db.query('SHOW TABLES LIKE "resenas"', (err, tables) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Error al verificar tabla',
        details: err.sqlMessage 
      });
    }

    if (tables.length === 0) {
      return res.status(404).json({ 
        exists: false,
        message: '⚠️ La tabla resenas no existe.' 
      });
    }

    db.query('DESC resenas', (err2, structure) => {
      if (err2) {
        return res.status(500).json({ 
          error: 'Error al obtener estructura',
          details: err2.sqlMessage 
        });
      }

      db.query('SELECT COUNT(*) as total FROM resenas', (err3, count) => {
        res.json({
          exists: true,
          structure: structure,
          total_records: count[0]?.total || 0,
          message: '✅ Tabla resenas encontrada y funcional'
        });
      });
    });
  });
};

/* ======================================================
   📦 EXPORTAR FUNCIONES
====================================================== */
module.exports = {
  getResenasByUsuario,
  createResena,
  updateResena,
  deleteResena,
  getResenasByLugar,
  checkTableStatus
};