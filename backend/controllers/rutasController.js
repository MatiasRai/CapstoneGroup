const db = require('../config/db'); // ✅ Correcto


const crearRuta = async (req, res) => {
  const { nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario, coordenadas } = req.body;

  try {
    // 1. Insertar la ruta
    const [rutaResult] = await db.query(
      `INSERT INTO rutas_recomendadas (nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario)
       VALUES (?, ?, ?, ?)`,
      [nombre_ruta, descripcion_ruta, id_tipo_ruta, id_usuario]
    );

    const id_ruta = rutaResult.insertId;

    // 2. Insertar coordenadas
    for (const coord of coordenadas) {
      await db.query(
        `INSERT INTO coordenadas (latitud, longitud, id_ruta)
         VALUES (?, ?, ?)`,
        [coord.lat, coord.lng, id_ruta]
      );
    }

    res.status(201).json({ message: 'Ruta y coordenadas registradas', id_ruta });
  } catch (error) {
    console.error('Error en crearRuta:', error);
    res.status(500).json({ message: 'Error al registrar la ruta' });
  }
};

module.exports = {
  crearRuta
};
