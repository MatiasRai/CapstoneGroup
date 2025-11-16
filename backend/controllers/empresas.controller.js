const db = require('../config/db');

/* ======================================================
   📌 EMPRESAS PAGINADAS (CORRECTO PARA IONIC)
====================================================== */
const getEmpresasPaginadas = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const queryData = `
    SELECT *
    FROM empresas
    ORDER BY id_empresa ASC
    LIMIT ? OFFSET ?
  `;

  const queryTotal = `SELECT COUNT(*) AS total FROM empresas`;

  db.query(queryData, [limit, offset], (err, rows) => {
    if (err) {
      console.error("❌ Error en getEmpresasPaginadas:", err.sqlMessage);
      return res.status(500).json({ error: "Error al obtener empresas paginadas" });
    }

    db.query(queryTotal, (err2, totalRows) => {
      if (err2) {
        console.error("❌ Error al contar empresas:", err2.sqlMessage);
        return res.status(500).json({ error: "Error al contar empresas" });
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


/* ======================================================
   📌 Obtener todas las empresas
====================================================== */
const getEmpresas = (req, res) => {
  db.query('SELECT * FROM empresas', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};


/* ======================================================
   📌 Crear empresa
====================================================== */
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

  const Estado = "Proceso";

  db.query(
    `INSERT INTO empresas 
     (nombre_empresa, direccion_empresa, telefono, descripcion_empresa, horarios, sitio_web, Adm_Empresa_id_adm_Empresa, Correo, Estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre_empresa,
      direccion_empresa,
      telefono,
      descripcion_empresa,
      horarios,
      sitio_web,
      Adm_Empresa_id_adm_Empresa,
      Correo,
      Estado
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id_empresa: result.insertId,
        nombre_empresa,
        Estado,
        message: "✅ Empresa registrada correctamente"
      });
    }
  );
};


/* ======================================================
   📌 Actualizar estado de empresa
====================================================== */
const updateEstadoEmpresa = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  db.query('UPDATE empresas SET Estado = ? WHERE id_empresa = ?', [estado, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Estado actualizado correctamente" });
  });
};


/* ======================================================
   📌 Obtener empresa por ID del administrador
====================================================== */
const getEmpresaByAdm = (req, res) => {
  const { id_adm_empresa } = req.params;

  const query = `
    SELECT *
    FROM empresas
    WHERE Adm_Empresa_id_adm_Empresa = ?
  `;

  db.query(query, [id_adm_empresa], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length === 0)
      return res.status(404).json({ message: "⚠️ Empresa no encontrada" });

    res.json(rows[0]);
  });
};


/* ======================================================
   📌 Obtener servicios por empresa
====================================================== */
const getServiciosByEmpresa = (req, res) => {
  const { id_adm_empresa } = req.params;

  const query = `
    SELECT 
      s.*,
      l.nombre_lugar, l.direccion_lugar,
      c.nombre_categoria AS categoria_lugar,
      d.nombre_discapacidad,
      r.id_resena, r.valoracion, r.comentarios, r.fecha_resena
    FROM servicios s
    INNER JOIN empresas e ON s.Empresas_id_empresa = e.id_empresa
    LEFT JOIN lugares l ON s.Lugares_id_lugar = l.id_lugar
    LEFT JOIN categoria_lugar c ON l.Categoria_Lugar_id_categoria = c.id_categoria
    LEFT JOIN tipos_discapacidad d ON s.id_discapacidad = d.id_discapacidad
    LEFT JOIN resenas r ON r.Lugares_id_lugar = l.id_lugar
    WHERE e.Adm_Empresa_id_adm_Empresa = ?;
  `;

  db.query(query, [id_adm_empresa], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Agrupar servicios con sus reseñas
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
          resenas: []
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


/* ======================================================
   📌 Eliminar servicio
====================================================== */
const deleteServicio = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM servicios WHERE id_servicio = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "⚠️ Servicio no encontrado" });

    res.json({ message: "✅ Servicio eliminado correctamente" });
  });
};


/* ======================================================
   📌 Actualizar servicio
====================================================== */
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

  const queryGet = `
    SELECT s.Lugares_id_lugar, s.id_discapacidad
    FROM servicios s
    WHERE s.id_servicio = ?
  `;

  db.query(queryGet, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0)
      return res.status(404).json({ message: "⚠️ Servicio no encontrado" });

    const { Lugares_id_lugar, id_discapacidad } = results[0];

    db.query(
      `UPDATE servicios 
       SET nombre_servicio=?, descripcion_servicio=?, horario_disponible=?, costo_servicio=?
       WHERE id_servicio=?`,
      [
        nombre_servicio, descripcion_servicio,
        horario_disponible, costo_servicio, id
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(
          `UPDATE lugares SET nombre_lugar=?, direccion_lugar=? WHERE id_lugar=?`,
          [nombre_lugar, direccion_lugar, Lugares_id_lugar],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(
              `UPDATE tipos_discapacidad SET nombre_discapacidad=? WHERE id_discapacidad=?`,
              [nombre_discapacidad, id_discapacidad],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                  message: "✅ Servicio, lugar y discapacidad actualizados correctamente"
                });
              }
            );
          }
        );
      }
    );
  });
};


/* ======================================================
   📌 Actualizar empresa
====================================================== */
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
    WHERE id_empresa=?
  `;

  db.query(
    query,
    [nombre_empresa, direccion_empresa, telefono, correo, descripcion_empresa, horarios, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "⚠️ Empresa no encontrada" });

      res.json({ message: "✅ Empresa actualizada correctamente" });
    }
  );
};


/* ======================================================
   📌 Eliminar empresa COMPLETA (cascada)
====================================================== */
const deleteEmpresa = (req, res) => {
  const { id } = req.params;

  // 1. Eliminar reseñas
  const deleteResenas = `
    DELETE r FROM resenas r
    INNER JOIN lugares l ON r.Lugares_id_lugar = l.id_lugar
    WHERE l.Empresas_id_empresa = ?;
  `;

  db.query(deleteResenas, [id], (err) => {
    if (err) return res.status(500).json({ error: "Error al eliminar reseñas" });

    // 2. Eliminar servicios
    const deleteServicios = `
      DELETE s FROM servicios s
      INNER JOIN lugares l ON s.Lugares_id_lugar = l.id_lugar
      WHERE l.Empresas_id_empresa = ?;
    `;

    db.query(deleteServicios, [id], (err) => {
      if (err) return res.status(500).json({ error: "Error al eliminar servicios" });

      // 3. Eliminar lugares
      const deleteLugares = `DELETE FROM lugares WHERE Empresas_id_empresa = ?`;

      db.query(deleteLugares, [id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar lugares" });

        // 4. Eliminar empresa
        const deleteEmpresaQuery = `DELETE FROM empresas WHERE id_empresa = ?`;

        db.query(deleteEmpresaQuery, [id], (err, result) => {
          if (err) return res.status(500).json({ error: "Error al eliminar empresa" });

          if (result.affectedRows === 0)
            return res.status(404).json({ message: "⚠️ Empresa no encontrada" });

          res.json({ message: "✅ Empresa y datos asociados eliminados correctamente" });
        });
      });
    });
  });
};


/* ======================================================
   📌 EXPORTACIONES
====================================================== */
module.exports = {
  getEmpresas,
  createEmpresa,
  updateEstadoEmpresa,
  getEmpresaByAdm,
  getServiciosByEmpresa,
  deleteServicio,
  updateServicio,
  updateEmpresa,
  deleteEmpresa,
  getEmpresasPaginadas      // 👈 IMPORTANTE
};
