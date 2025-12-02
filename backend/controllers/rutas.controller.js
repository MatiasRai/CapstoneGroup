const db = require('../config/db');


const createRuta = (req, res) => {
  const {
    nombre_ruta,
    descripcion_ruta,
    id_tipo_ruta,
    id_usuario,
    longitud_ruta,
    coordenadas 
  } = req.body;

  
  if (!id_usuario) {
    return res.status(400).json({ error: '⚠️ El id_usuario es requerido' });
  }

  if (!coordenadas || coordenadas.length < 2) {
    return res.status(400).json({ error: '⚠️ Se requieren al menos 2 coordenadas para crear una ruta' });
  }

  
  const queryRuta = `
    INSERT INTO rutas_recomendadas 
    (nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario, longitud_ruta)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    queryRuta,
    [nombre_ruta || '', descripcion_ruta || '', id_tipo_ruta || 1, id_usuario, longitud_ruta || 0],
    (err, result) => {
      if (err) {
        console.error('❌ Error al crear ruta:', err);
        return res.status(500).json({ error: err.message });
      }

      const id_ruta = result.insertId;

      
      const queryCoordenadas = `
        INSERT INTO coordenadas (latitud, longitud, id_ruta)
        VALUES ?
      `;

      const coordenadasValues = coordenadas.map(coord => [
        coord.latitud,
        coord.longitud,
        id_ruta
      ]);

      db.query(queryCoordenadas, [coordenadasValues], (err2) => {
        if (err2) {
          console.error('❌ Error al insertar coordenadas:', err2);
          
          db.query('DELETE FROM rutas_recomendadas WHERE id_ruta = ?', [id_ruta]);
          return res.status(500).json({ error: err2.message });
        }

        res.status(201).json({
          id_ruta,
          nombre_ruta,
          descripcion_ruta,
          longitud_ruta,
          total_coordenadas: coordenadas.length,
          message: '✅ Ruta creada correctamente'
        });
      });
    }
  );
};


const getRutasByUsuario = (req, res) => {
  const { id_usuario } = req.params;

  const query = `
    SELECT 
      r.id_ruta,
      r.nombre_ruta,
      r.descripcion_ruta,
      r.longitud_ruta,
      tr.nombre_tipo_ruta,
      tr.descripcion AS tipo_descripcion,
      COUNT(c.id_coordenada) AS total_puntos
    FROM rutas_recomendadas r
    LEFT JOIN tipos_ruta tr ON r.id_tipo_ruta = tr.id_tipo_ruta
    LEFT JOIN coordenadas c ON r.id_ruta = c.id_ruta
    WHERE r.id_usuario = ?
    GROUP BY r.id_ruta
    ORDER BY r.id_ruta DESC
  `;

  db.query(query, [id_usuario], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener rutas:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};


const getRutaById = (req, res) => {
  const { id } = req.params;

  
  const queryRuta = `
    SELECT 
      r.*,
      tr.nombre_tipo_ruta,
      tr.descripcion AS tipo_descripcion,
      u.nombre AS usuario_nombre,
      u.correo AS usuario_correo
    FROM rutas_recomendadas r
    LEFT JOIN tipos_ruta tr ON r.id_tipo_ruta = tr.id_tipo_ruta
    LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
    WHERE r.id_ruta = ?
  `;

  db.query(queryRuta, [id], (err, rutaRows) => {
    if (err) {
      console.error('❌ Error al obtener ruta:', err);
      return res.status(500).json({ error: err.message });
    }

    if (rutaRows.length === 0) {
      return res.status(404).json({ message: '⚠️ Ruta no encontrada' });
    }

    const ruta = rutaRows[0];

    
    const queryCoordenadas = `
      SELECT 
        id_coordenada,
        latitud,
        longitud
      FROM coordenadas
      WHERE id_ruta = ?
      ORDER BY id_coordenada ASC
    `;

    db.query(queryCoordenadas, [id], (err2, coordRows) => {
      if (err2) {
        console.error('❌ Error al obtener coordenadas:', err2);
        return res.status(500).json({ error: err2.message });
      }

      
      const resultado = {
        ...ruta,
        coordenadas: coordRows
      };

      res.json(resultado);
    });
  });
};


const getAllRutas = (req, res) => {
  const query = `
    SELECT 
      r.id_ruta,
      r.nombre_ruta,
      r.descripcion_ruta,
      r.longitud_ruta,
      tr.nombre_tipo_ruta,
      u.nombre AS usuario_nombre,
      u.correo AS usuario_correo,
      COUNT(c.id_coordenada) AS total_puntos
    FROM rutas_recomendadas r
    LEFT JOIN tipos_ruta tr ON r.id_tipo_ruta = tr.id_tipo_ruta
    LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
    LEFT JOIN coordenadas c ON r.id_ruta = c.id_ruta
    GROUP BY r.id_ruta
    ORDER BY r.id_ruta DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener todas las rutas:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};


const deleteRuta = (req, res) => {
  const { id } = req.params;

  
  db.query('DELETE FROM coordenadas WHERE id_ruta = ?', [id], (err) => {
    if (err) {
      console.error('❌ Error al eliminar coordenadas:', err);
      return res.status(500).json({ error: err.message });
    }

    
    db.query('DELETE FROM rutas_recomendadas WHERE id_ruta = ?', [id], (err2, result) => {
      if (err2) {
        console.error('❌ Error al eliminar ruta:', err2);
        return res.status(500).json({ error: err2.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '⚠️ Ruta no encontrada' });
      }

      res.json({ message: '✅ Ruta eliminada correctamente' });
    });
  });
};


const updateRuta = (req, res) => {
  const { id } = req.params;
  const { nombre_ruta, descripcion_ruta, id_tipo_ruta, longitud_ruta } = req.body;

  const query = `
    UPDATE rutas_recomendadas
    SET nombre_ruta=?, descripcion_ruta=?, id_tipo_ruta=?, longitud_ruta=?
    WHERE id_ruta=?
  `;

  db.query(
    query,
    [nombre_ruta, descripcion_ruta, id_tipo_ruta, longitud_ruta, id],
    (err, result) => {
      if (err) {
        console.error('❌ Error al actualizar ruta:', err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '⚠️ Ruta no encontrada' });
      }

      res.json({ message: '✅ Ruta actualizada correctamente' });
    }
  );
};


const getTiposRuta = (req, res) => {
  db.query('SELECT * FROM tipos_ruta', (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener tipos de ruta:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

module.exports = {
  createRuta,
  getRutasByUsuario,
  getRutaById,
  getAllRutas,
  deleteRuta,
  updateRuta,
  getTiposRuta
};