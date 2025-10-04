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

// 🔹 Nuevo: Obtener servicios por ID del administrador
const getServiciosByAdm = (req, res) => {
  const { id_adm_empresa } = req.params;

  const query = `
    SELECT s.nombre_servicio, s.descripcion_servicio, s.horario_disponible, s.costo_servicio
    FROM servicios s
    INNER JOIN empresas e ON s.Empresas_id_empresa = e.id_empresa
    WHERE e.Adm_Empresa_id_adm_Empresa = ?;
  `;

  db.query(query, [id_adm_empresa], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length === 0)
      return res.status(404).json({ message: '⚠️ No hay servicios registrados para esta empresa' });

    res.json(rows);
  });
};


module.exports = {
  getEmpresas,
  createEmpresa,
  updateEstadoEmpresa,
  getEmpresaByAdm,
  getServiciosByAdm,
};
