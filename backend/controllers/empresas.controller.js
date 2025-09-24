const db = require('../config/db');

const getEmpresas = (req, res) => {
  db.query('SELECT * FROM empresas', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

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
    'INSERT INTO empresas (nombre_empresa, direccion_empresa, telefono, descripcion_empresa, horarios, sitio_web, Adm_Empresa_id_adm_Empresa, Correo, Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

const updateEstadoEmpresa = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  db.query(
    'UPDATE empresas SET estado = ? WHERE id_empresa = ?',
    [estado, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Estado actualizado correctamente' });
    }
  );
};

module.exports = { getEmpresas, createEmpresa, updateEstadoEmpresa };
