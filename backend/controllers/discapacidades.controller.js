const db = require('../config/db');

// 📋 Obtener todas las discapacidades (async + manejo de errores)
const getDiscapacidades = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         id_discapacidad, 
         tipo_discapacidad AS nombre_discapacidad, 
         descripcion
       FROM discapacidades
       ORDER BY tipo_discapacidad ASC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error en getDiscapacidades:', error);
    res.status(500).json({ message: 'Error al obtener discapacidades', error });
  }
};

module.exports = { getDiscapacidades };

