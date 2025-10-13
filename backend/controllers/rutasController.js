const db = require('../config/db'); // ✅ Conexión a la base de datos

// 🧭 Crear una nueva ruta con coordenadas
const crearRuta = async (req, res) => {
  const { nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario, coordenadas, longitud_ruta } = req.body;

  try {
    // 1️⃣ Insertar la ruta en la tabla principal
    const [rutaResult] = await db.query(
      `INSERT INTO rutas_recomendadas (nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario, longitud_ruta)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario, longitud_ruta || null]
    );

    const id_ruta = rutaResult.insertId;

    // 2️⃣ Insertar las coordenadas asociadas
    if (Array.isArray(coordenadas)) {
      for (const coord of coordenadas) {
        await db.query(
          `INSERT INTO coordenadas (latitud, longitud, id_ruta)
           VALUES (?, ?, ?)`,
          [coord.lat, coord.lng, id_ruta]
        );
      }
    }

    res.status(201).json({ message: '✅ Ruta y coordenadas registradas correctamente', id_ruta });
  } catch (error) {
    console.error('❌ Error en crearRuta:', error);
    res.status(500).json({ message: 'Error al registrar la ruta', error });
  }
};

// 🔍 Obtener rutas filtradas o recomendadas según discapacidad
const obtenerRutasFiltradas = async (req, res) => {
  try {
    const { tipo_ruta, max_longitud, id_discapacidad } = req.query;

    let sql = `
      SELECT rr.*, tr.nombre_tipo_ruta
      FROM rutas_recomendadas rr
      LEFT JOIN tipos_ruta tr ON rr.id_tipo_ruta = tr.id_tipo_ruta
      WHERE 1=1
    `;

    const params = [];

    // 📌 Filtro por tipo de ruta
    if (tipo_ruta) {
      sql += ` AND tr.nombre_tipo_ruta = ?`;
      params.push(tipo_ruta);
    }

    // 📏 Filtro por longitud máxima
    if (max_longitud) {
      sql += ` AND rr.longitud_ruta <= ?`;
      params.push(parseFloat(max_longitud));
    }

    // 🤖 Sistema de recomendación automática por tipo de discapacidad
    if (id_discapacidad) {
      const discId = parseInt(id_discapacidad);

      switch (discId) {
        case 1: // Movilidad reducida
        case 10: // Trastornos de la marcha
        case 13: // Amputación
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Peatonal%' OR tr.nombre_tipo_ruta LIKE '%Comercial%' OR tr.nombre_tipo_ruta LIKE '%Hospitalaria%')`;
          break;

        case 2: // Discapacidad visual
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Cultural%' OR tr.nombre_tipo_ruta LIKE '%Turística%' OR tr.nombre_tipo_ruta LIKE '%Religiosa%')`;
          break;

        case 3: // Auditiva
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Cultural%' OR tr.nombre_tipo_ruta LIKE '%Gastronómica%')`;
          break;

        case 4: // Cognitiva
        case 14: // TEA
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Natural%' OR tr.nombre_tipo_ruta LIKE '%Recreativa%' OR tr.nombre_tipo_ruta LIKE '%Universitaria%')`;
          break;

        case 5: // Psicosocial
        case 11: // Ansiedad social
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Natural%' OR tr.nombre_tipo_ruta LIKE '%Turística%')`;
          break;

        case 6: // Neurológica
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Hospitalaria%' OR tr.nombre_tipo_ruta LIKE '%Peatonal%')`;
          break;

        case 7: // Sordoceguera
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Hospitalaria%' OR tr.nombre_tipo_ruta LIKE '%Religiosa%')`;
          break;

        case 9: // Habla o comunicación
          sql += ` AND (tr.nombre_tipo_ruta LIKE '%Cultural%' OR tr.nombre_tipo_ruta LIKE '%Comercial%')`;
          break;

        default:
          sql += ` AND tr.nombre_tipo_ruta IS NOT NULL`; // Si no hay match, mostrar todas
      }
    }

    // 🧾 Ejecutar la consulta
    const [rutas] = await db.query(sql, params);

    // 🗺️ Agregar coordenadas a cada ruta
    const rutasConCoordenadas = await Promise.all(
      rutas.map(async (ruta) => {
        const [coords] = await db.query(
          `SELECT latitud, longitud FROM coordenadas WHERE id_ruta = ?`,
          [ruta.id_ruta]
        );
        return { ...ruta, coordenadas: coords };
      })
    );

    res.status(200).json(rutasConCoordenadas);
  } catch (error) {
    console.error('❌ Error en obtenerRutasFiltradas:', error);
    res.status(500).json({ message: 'Error al obtener rutas filtradas', error });
  }
};

module.exports = {
  crearRuta,
  obtenerRutasFiltradas
};
