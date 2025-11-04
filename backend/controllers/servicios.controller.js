const db = require('../config/db');

// ✅ Crear un nuevo servicio
const createServicio = (req, res) => {
  const { nombre_servicio, descripcion_servicio, horario_disponible, costo_servicio, Lugares_id_lugar, Empresas_id_empresa, id_discapacidad } = req.body;

  if (!nombre_servicio || !costo_servicio || !Empresas_id_empresa) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const query = `
    INSERT INTO servicios 
    (nombre_servicio, descripcion_servicio, horario_disponible, costo_servicio, Lugares_id_lugar, Empresas_id_empresa, id_discapacidad)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [nombre_servicio, descripcion_servicio, horario_disponible, costo_servicio, Lugares_id_lugar, Empresas_id_empresa, id_discapacidad],
    (err, result) => {
      if (err) {
        console.error('❌ Error SQL en createServicio:', err.sqlMessage);
        return res.status(500).json({ error: 'Error al crear el servicio' });
      }

      res.status(201).json({
        id_servicio: result.insertId,
        message: '✅ Servicio registrado correctamente'
      });
    }
  );
};

// ✅ Obtener servicios por empresa
const getServiciosByEmpresa = (req, res) => {
  const { id_empresa } = req.params;

  db.query('SELECT * FROM servicios WHERE Empresas_id_empresa = ?', [id_empresa], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

module.exports = { createServicio, getServiciosByEmpresa };
