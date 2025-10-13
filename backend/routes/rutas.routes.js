const express = require('express');
const router = express.Router();
const rutasController = require('../controllers/rutasController');

// 📍 Crear nueva ruta
router.post('/', rutasController.crearRuta);

// 🔍 Obtener rutas filtradas (usada por el frontend)
router.get('/filtrar', rutasController.obtenerRutasFiltradas);

// ✅ Endpoint base opcional (solo diagnóstico, devuelve JSON)
router.get('/', (req, res) => {
  res.json({ message: '✅ Endpoint /api/v1/rutas activo' });
});

module.exports = router;



