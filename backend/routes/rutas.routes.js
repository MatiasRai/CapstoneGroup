const express = require('express');
const router = express.Router();
const rutasController = require('../controllers/rutasController');

// Ruta POST para registrar rutas
router.post('/', rutasController.crearRuta);

// (Opcional) Ruta GET para probar desde el navegador
router.get('/', (req, res) => {
  res.send('✅ Ruta /api/v1/rutas activa');
});

module.exports = router;


