const db = require('../config/db');

// 🔹 Obtener todas las empresas
const getEmpresas = (req, res) => {
  db.query('SELECT * FROM empresas', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// 🔹 Crear nueva empresa
const createEmpresa = (req, res) => {
  const {
    nombre_empresa,
    direccion_empresa,
    telefono,
    descripcion_empresa,
    horarios,
    sitio_web,
    Adm_Empresa_id_adm_Empresa,
    Correo
  } = req.body;

  const Estado = "Proceso"; // estado por defecto

  db.query(
    `INSERT INTO empresas 
     (nombre_empresa, direccion_empresa, telefono, descripcion_empresa, horarios, sitio_web, Adm_Empresa_id_adm_Empresa, Correo, Estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre_empresa, direccion_empresa, telefono, descripcion_empresa, horarios, sitio_web, Adm_Empresa_id_adm_Empresa, Correo, Estado],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id_empresa: result.insertId,
        nombre_empresa,
        Estado,
        message: '✅ Empresa registrada correctamente (estado por defecto: Proceso)'
      });
    }
  );
};

// 🔹 Actualizar el estado de una empresa
const updateEstadoEmpresa = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  db.query(
    'UPDATE empresas SET estado = ? WHERE id_empresa = ?',
    [estado, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: '✅ Estado actualizado correctamente' });
    }
  );
};

// 🔹 Obtener empresa por ID del administrador logeado
const getEmpresaByAdm = (req, res) => {
  const { id_adm_empresa } = req.params;

  const query = `
    SELECT e.*
    FROM empresas e
    INNER JOIN adm_empresa a ON e.Adm_Empresa_id_adm_Empresa = a.id_adm_empresa
    WHERE e.Adm_Empresa_id_adm_Empresa = ?;
  `;

  db.query(query, [id_adm_empresa], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0)
      return res.status(404).json({ message: '⚠️ Empresa no encontrada para este administrador' });

    res.json(rows[0]);
  });
};

const getServiciosByEmpresa = (req, res) => {
  const { id_adm_empresa } = req.params;

  const query = `
    SELECT 
      s.id_servicio,
      s.nombre_servicio,
      s.descripcion_servicio,
      s.horario_disponible,
      s.costo_servicio,
      l.nombre_lugar,
      l.direccion_lugar,
      c.nombre_categoria AS categoria_lugar,
      d.nombre_discapacidad,
      r.id_resena,
      r.valoracion,
      r.comentarios,
      r.fecha_resena
    FROM servicios s
    INNER JOIN empresas e 
      ON s.Empresas_id_empresa = e.id_empresa
    LEFT JOIN lugares l 
      ON s.Lugares_id_lugar = l.id_lugar
    LEFT JOIN categoria_lugar c 
      ON l.Categoria_Lugar_id_categoria = c.id_categoria
    LEFT JOIN tipos_discapacidad d 
      ON s.id_discapacidad = d.id_discapacidad
    LEFT JOIN resenas r
      ON r.Lugares_id_lugar = l.id_lugar
    WHERE e.Adm_Empresa_id_adm_Empresa = ?;
  `;

  db.query(query, [id_adm_empresa], (err, rows) => {
    if (err) {
      console.error('❌ Error en getServiciosByEmpresa:', err);
      return res.status(500).json({ error: err.message });
    }

    // Agrupar servicios y reseñas
    const servicios = {};
    for (const row of rows) {
      if (!servicios[row.id_servicio]) {
        servicios[row.id_servicio] = {
          id_servicio: row.id_servicio,
          nombre_servicio: row.nombre_servicio,
          descripcion_servicio: row.descripcion_servicio,
          horario_disponible: row.horario_disponible,
          costo_servicio: row.costo_servicio,
          nombre_lugar: row.nombre_lugar,
          direccion_lugar: row.direccion_lugar,
          categoria_lugar: row.categoria_lugar,
          nombre_discapacidad: row.nombre_discapacidad,
          resenas: [] // 👈 Aquí se guardarán las reseñas
        };
      }

      if (row.id_resena) {
        servicios[row.id_servicio].resenas.push({
          id_resena: row.id_resena,
          valoracion: row.valoracion,
          comentarios: row.comentarios,
          fecha_resena: row.fecha_resena
        });
      }
    }

    res.json(Object.values(servicios));
  });
};
// 🔹 Eliminar servicio por ID
const deleteServicio = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM servicios WHERE id_servicio = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: '⚠️ Servicio no encontrado' });

    res.json({ message: '✅ Servicio eliminado correctamente' });
  });
};

// 🔹 Actualizar servicio junto con su lugar y tipo de discapacidad
const updateServicio = (req, res) => {
  const { id } = req.params;
  const {
    nombre_servicio,
    descripcion_servicio,
    horario_disponible,
    costo_servicio,
    nombre_lugar,
    direccion_lugar,
    nombre_discapacidad
  } = req.body;

  console.log("📝 Datos recibidos para actualización completa:", req.body);

  // 1️⃣ Buscar el servicio y obtener sus relaciones
  const queryGet = `
    SELECT 
      s.Lugares_id_lugar,
      s.id_discapacidad
    FROM servicios s
    WHERE s.id_servicio = ?;
  `;

  db.query(queryGet, [id], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener relaciones del servicio:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "⚠️ Servicio no encontrado" });
    }

    const { Lugares_id_lugar, id_discapacidad } = results[0];

    // 2️⃣ Actualizar el servicio
    const queryServicio = `
      UPDATE servicios 
      SET nombre_servicio=?, descripcion_servicio=?, horario_disponible=?, costo_servicio=?
      WHERE id_servicio=?;
    `;

    db.query(
      queryServicio,
      [nombre_servicio, descripcion_servicio, horario_disponible, costo_servicio, id],
      (err) => {
        if (err) {
          console.error("❌ Error al actualizar servicio:", err);
          return res.status(500).json({ error: err.message });
        }

        // 3️⃣ Actualizar el lugar
        const queryLugar = `
          UPDATE lugares 
          SET nombre_lugar=?, direccion_lugar=?
          WHERE id_lugar=?;
        `;

        db.query(
          queryLugar,
          [nombre_lugar, direccion_lugar, Lugares_id_lugar],
          (err) => {
            if (err) {
              console.error("❌ Error al actualizar lugar:", err);
              return res.status(500).json({ error: err.message });
            }

            // 4️⃣ Actualizar el tipo de discapacidad
            const queryDiscapacidad = `
              UPDATE tipos_discapacidad
              SET nombre_discapacidad=?
              WHERE id_discapacidad=?;
            `;

            db.query(
              queryDiscapacidad,
              [nombre_discapacidad, id_discapacidad],
              (err) => {
                if (err) {
                  console.error("❌ Error al actualizar discapacidad:", err);
                  return res.status(500).json({ error: err.message });
                }

                res.json({ message: "✅ Servicio, lugar y discapacidad actualizados correctamente" });
              }
            );
          }
        );
      }
    );
  });
};
// ✏️ Editar empresa
const updateEmpresa = (req, res) => {
  const { id } = req.params;
  const {
    nombre_empresa,
    direccion_empresa,
    telefono,
    correo,
    descripcion_empresa,
    horarios
  } = req.body;

  const query = `
    UPDATE empresas
    SET nombre_empresa=?, direccion_empresa=?, telefono=?, correo=?, descripcion_empresa=?, horarios=?
    WHERE id_empresa=?;
  `;

  db.query(
    query,
    [nombre_empresa, direccion_empresa, telefono, correo, descripcion_empresa, horarios, id],
    (err, result) => {
      if (err) {
        console.error('❌ Error en updateEmpresa:', err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0)
        return res.status(404).json({ message: '⚠️ Empresa no encontrada' });

      res.json({ message: '✅ Empresa actualizada correctamente' });
    }
  );
};



module.exports = {
  getEmpresas,
  updateEmpresa,
  updateServicio,
  deleteServicio,
  createEmpresa,
  updateEstadoEmpresa,
  getEmpresaByAdm,
  getServiciosByEmpresa,
};
