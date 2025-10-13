const db = require('../config/db');

// 📋 Obtener todos los tipos de ruta
const getTiposRuta = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         id_tipo_ruta, 
         nombre_tipo_ruta, 
         descripcion
       FROM tipos_ruta
       ORDER BY nombre_tipo_ruta ASC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error en getTiposRuta:', error);
    res.status(500).json({ message: 'Error al obtener tipos de ruta', error });
  }
};

module.exports = { getTiposRuta };
