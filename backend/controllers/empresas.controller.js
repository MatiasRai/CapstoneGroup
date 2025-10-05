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



module.exports = {
  getEmpresas,
  createEmpresa,
  updateEstadoEmpresa,
  getEmpresaByAdm,
  getServiciosByEmpresa,
};
