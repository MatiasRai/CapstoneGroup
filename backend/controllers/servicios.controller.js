const db = require('../config/db');

const createServicio = (req, res) => {
  const {
    nombre_servicio,
    descripcion_servicio,
    horario_disponible,
    costo_servicio,
    Empresas_id_empresa,
    id_discapacidad,
    nombre_lugar,
    direccion_lugar,
    latitud,
    longitud,
    id_categoria
  } = req.body;

  if (!nombre_servicio || !costo_servicio || !Empresas_id_empresa) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const categoriaId = id_categoria || 1;

  const queryLugar = `
    INSERT INTO lugares (nombre_lugar, direccion_lugar, Empresas_id_empresa, Categoria_Lugar_id_categoria)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    queryLugar,
    [nombre_lugar || 'Ubicación del servicio', direccion_lugar || 'Sin dirección', Empresas_id_empresa, categoriaId],
    (err, resultLugar) => {
      if (err) {
        console.error('❌ Error al crear lugar:', err.sqlMessage);
        return res.status(500).json({ error: 'Error al crear lugar' });
      }

      const id_lugar = resultLugar.insertId;

      if (latitud && longitud) {
        const queryCoord = `
          INSERT INTO coordenadas (latitud, longitud, id_lugar)
          VALUES (?, ?, ?)
        `;
        db.query(queryCoord, [latitud, longitud, id_lugar], (err) => {
          if (err) console.error('⚠️ Error al registrar coordenadas (no crítico):', err.sqlMessage);
        });
      }

      const queryServicio = `
        INSERT INTO servicios (
          nombre_servicio, descripcion_servicio, horario_disponible,
          costo_servicio, Lugares_id_lugar, Empresas_id_empresa, id_discapacidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        queryServicio,
        [
          nombre_servicio,
          descripcion_servicio,
          horario_disponible,
          costo_servicio,
          id_lugar,
          Empresas_id_empresa,
          id_discapacidad || null
        ],
        (err, resultServicio) => {
          if (err) {
            console.error('❌ Error al crear servicio:', err.sqlMessage);
            return res.status(500).json({ error: 'Error al crear servicio' });
          }

          res.status(201).json({
            id_servicio: resultServicio.insertId,
            id_lugar,
            message: '✅ Servicio creado correctamente con lugar y coordenadas'
          });
        }
      );
    }
  );
};

const getServiciosByEmpresa = (req, res) => {
  const { id_empresa } = req.params;

  const query = `
    SELECT 
      s.id_servicio, s.nombre_servicio, s.descripcion_servicio,
      s.horario_disponible, s.costo_servicio,
      s.Lugares_id_lugar,
      l.id_lugar, l.nombre_lugar, l.direccion_lugar,
      c.nombre_categoria AS categoria_lugar,
      d.nombre_discapacidad,
      coord.id_coordenada, coord.latitud, coord.longitud,
      r.id_resena, r.valoracion, r.comentarios, r.fecha_resena
    FROM servicios s
    INNER JOIN empresas e ON s.Empresas_id_empresa = e.id_empresa
    LEFT JOIN lugares l ON s.Lugares_id_lugar = l.id_lugar
    LEFT JOIN categoria_lugar c ON l.Categoria_Lugar_id_categoria = c.id_categoria
    LEFT JOIN tipos_discapacidad d ON s.id_discapacidad = d.id_discapacidad
    LEFT JOIN coordenadas coord ON coord.id_lugar = l.id_lugar
    LEFT JOIN resenas r ON r.Lugares_id_lugar = l.id_lugar
    WHERE s.Empresas_id_empresa = ?
    ORDER BY s.id_servicio;
  `;

  db.query(query, [id_empresa], (err, rows) => {
    if (err) {
      console.error('❌ Error SQL en getServiciosByEmpresa:', err.sqlMessage);
      return res.status(500).json({ error: 'Error al obtener los servicios' });
    }

    const servicios = {};
    rows.forEach((row) => {
      if (!servicios[row.id_servicio]) {
        servicios[row.id_servicio] = {
          id_servicio: row.id_servicio,
          nombre_servicio: row.nombre_servicio,
          descripcion_servicio: row.descripcion_servicio,
          horario_disponible: row.horario_disponible,
          costo_servicio: row.costo_servicio,
          Lugares_id_lugar: row.Lugares_id_lugar,
          id_lugar: row.id_lugar,
          nombre_lugar: row.nombre_lugar,
          direccion_lugar: row.direccion_lugar,
          categoria_lugar: row.categoria_lugar,
          nombre_discapacidad: row.nombre_discapacidad,
          coordenadas: [],
          resenas: []
        };
      }

      if (row.id_coordenada && !servicios[row.id_servicio].coordenadas.find(c => c.id_coordenada === row.id_coordenada)) {
        servicios[row.id_servicio].coordenadas.push({
          id_coordenada: row.id_coordenada,
          latitud: row.latitud,
          longitud: row.longitud
        });
      }

      if (row.id_resena && !servicios[row.id_servicio].resenas.find(r => r.id_resena === row.id_resena)) {
        servicios[row.id_servicio].resenas.push({
          id_resena: row.id_resena,
          valoracion: row.valoracion,
          comentarios: row.comentarios,
          fecha_resena: row.fecha_resena
        });
      }
    });

    Object.values(servicios).forEach(servicio => {
      if (servicio.coordenadas.length === 1) {
        servicio.latitud = servicio.coordenadas[0].latitud;
        servicio.longitud = servicio.coordenadas[0].longitud;
      }
    });

    res.json(Object.values(servicios));
  });
};

const getAllServicios = (req, res) => {
  const query = `
    SELECT 
      s.id_servicio, 
      s.nombre_servicio, 
      s.descripcion_servicio,
      s.horario_disponible, 
      s.costo_servicio,
      s.Empresas_id_empresa,
      s.Lugares_id_lugar,
      s.id_discapacidad,
      l.id_lugar, 
      l.nombre_lugar, 
      l.direccion_lugar,
      c.nombre_categoria AS categoria_lugar,
      d.id_discapacidad,
      d.nombre_discapacidad,
      e.id_empresa,
      e.nombre_empresa, 
      e.telefono AS empresa_telefono,
      coord.id_coordenada, 
      coord.latitud, 
      coord.longitud,
      r.id_resena, 
      r.valoracion, 
      r.comentarios, 
      r.fecha_resena
    FROM servicios s
    INNER JOIN empresas e ON s.Empresas_id_empresa = e.id_empresa
    LEFT JOIN lugares l ON s.Lugares_id_lugar = l.id_lugar
    LEFT JOIN categoria_lugar c ON l.Categoria_Lugar_id_categoria = c.id_categoria
    LEFT JOIN tipos_discapacidad d ON s.id_discapacidad = d.id_discapacidad
    LEFT JOIN coordenadas coord ON coord.id_lugar = l.id_lugar
    LEFT JOIN resenas r ON r.Lugares_id_lugar = l.id_lugar
    WHERE e.Estado = 'Aprobado'
    ORDER BY s.id_servicio;
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error('❌ Error SQL en getAllServicios:', err.sqlMessage);
      return res.status(500).json({ error: 'Error al obtener los servicios' });
    }

    const servicios = {};
    rows.forEach((row) => {
      if (!servicios[row.id_servicio]) {
        servicios[row.id_servicio] = {
          id_servicio: row.id_servicio,
          nombre_servicio: row.nombre_servicio,
          descripcion_servicio: row.descripcion_servicio,
          horario_disponible: row.horario_disponible,
          costo_servicio: row.costo_servicio,
          Empresas_id_empresa: row.Empresas_id_empresa,
          Lugares_id_lugar: row.Lugares_id_lugar,
          id_lugar: row.id_lugar,
          nombre_lugar: row.nombre_lugar,
          direccion_lugar: row.direccion_lugar,
          categoria_lugar: row.categoria_lugar,
          id_discapacidad: row.id_discapacidad,
          nombre_discapacidad: row.nombre_discapacidad,
          nombre_empresa: row.nombre_empresa,
          empresa_telefono: row.empresa_telefono,
          coordenadas: [],
          resenas: []
        };
      }

      if (row.id_coordenada && !servicios[row.id_servicio].coordenadas.find(c => c.id_coordenada === row.id_coordenada)) {
        servicios[row.id_servicio].coordenadas.push({
          id_coordenada: row.id_coordenada,
          latitud: row.latitud,
          longitud: row.longitud
        });
      }

      if (row.id_resena && !servicios[row.id_servicio].resenas.find(r => r.id_resena === row.id_resena)) {
        servicios[row.id_servicio].resenas.push({
          id_resena: row.id_resena,
          valoracion: row.valoracion,
          comentarios: row.comentarios,
          fecha_resena: row.fecha_resena
        });
      }
    });

    Object.values(servicios).forEach(servicio => {
      if (servicio.coordenadas.length === 1) {
        servicio.latitud = servicio.coordenadas[0].latitud;
        servicio.longitud = servicio.coordenadas[0].longitud;
      }
    });

    console.log(`✅ Se encontraron ${Object.keys(servicios).length} servicios disponibles`);
    res.json(Object.values(servicios));
  });
};

const updateServicio = (req, res) => {
  const { id_servicio } = req.params;
  const { nombre_servicio, descripcion_servicio, horario_disponible, costo_servicio } = req.body;

  const query = `
    UPDATE servicios
    SET nombre_servicio = ?, descripcion_servicio = ?, horario_disponible = ?, costo_servicio = ?
    WHERE id_servicio = ?
  `;

  db.query(query, [nombre_servicio, descripcion_servicio, horario_disponible, costo_servicio, id_servicio], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ Servicio actualizado correctamente' });
  });
};

const deleteServicio = (req, res) => {
  const { id_servicio } = req.params;

  db.query('DELETE FROM servicios WHERE id_servicio = ?', [id_servicio], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ Servicio eliminado correctamente' });
  });
};

module.exports = {
  createServicio,
  getServiciosByEmpresa,
  getAllServicios,
  updateServicio,
  deleteServicio
};