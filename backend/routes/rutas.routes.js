const express = require('express');
const router = express.Router();
const {
  createRuta,
  getRutasByUsuario,
  getRutaById,
  getAllRutas,
  deleteRuta,
  updateRuta,
  getTiposRuta
} = require('../controllers/rutas.controller');

// 🔹 Obtener tipos de ruta disponibles
router.get('/tipos', getTiposRuta);

// 🔹 Obtener todas las rutas (para admin)
router.get('/', getAllRutas);

// 🔹 Crear nueva ruta con coordenadas
router.post('/', createRuta);

// 🔹 Obtener todas las rutas de un usuario específico
router.get('/usuario/:id_usuario', getRutasByUsuario);

// 🔹 Obtener detalle completo de una ruta (incluyendo coordenadas)
router.get('/:id', getRutaById);

// 🔹 Actualizar información de una ruta
router.put('/:id', updateRuta);

// 🔹 Eliminar una ruta
router.delete('/:id', deleteRuta);

module.exports = router;