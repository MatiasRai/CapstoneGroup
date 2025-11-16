const express = require('express');
const router = express.Router();

const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuariosPaginados // 👈 Nueva función añadida
} = require('../controllers/usuarios.controller');

// ======================================================
// 📌 NUEVA RUTA: Obtener usuarios con paginación
// ======================================================
router.get('/paginados', getUsuariosPaginados);

// ======================================================
// 📌 Rutas antiguas (se mantienen igual)
// ======================================================

// Obtener todos los usuarios
router.get('/', getUsuarios);

// Obtener un usuario por ID
router.get('/:id', getUsuarioById);

// Crear un nuevo usuario
router.post('/', createUsuario);

// Actualizar un usuario
router.put('/:id', updateUsuario);

// Eliminar un usuario
router.delete('/:id', deleteUsuario);

module.exports = router;
