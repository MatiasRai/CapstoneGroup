const express = require('express');
const router = express.Router();
const rutasController = require('../controllers/rutasController');

// ✅ Ruta de prueba (para verificar conexión con el backend)
router.get('/', (req, res) => {
  res.send('✅ Endpoint /api/v1/rutas activo');
});

// 🗺️ Crear una nueva ruta con coordenadas
router.post('/', rutasController.crearRuta);

// 🔍 Obtener rutas filtradas (tipo, longitud, discapacidad)
router.get('/filtrar', rutasController.obtenerRutasFiltradas);

module.exports = router;


