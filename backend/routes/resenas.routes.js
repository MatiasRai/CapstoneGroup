const express = require('express');
const router = express.Router();
const {
  getResenasByUsuario,
  createResena,
  updateResena,
  deleteResena,
  getResenasByLugar
} = require('../controllers/resenas.controller');

/* ======================================================
   ⭐ RUTAS DE RESEÑAS
====================================================== */

// 🔹 Obtener todas las reseñas de un usuario
router.get('/usuario/:id_usuario', getResenasByUsuario);

// 🔹 Obtener todas las reseñas de un lugar
router.get('/lugar/:id_lugar', getResenasByLugar);

// 🔹 Crear nueva reseña
router.post('/', createResena);

// 🔹 Actualizar reseña
router.put('/:id', updateResena);

// 🔹 Eliminar reseña
router.delete('/:id', deleteResena);

module.exports = router;