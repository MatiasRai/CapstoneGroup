const express = require('express');
const router = express.Router();
const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
} = require('../controllers/usuarios.controller');

// ✅ Obtener todos los usuarios
router.get('/', getUsuarios);

// ✅ Obtener un usuario por ID (para el perfil)
router.get('/:id', getUsuarioById);

// ✅ Crear un nuevo usuario
router.post('/', createUsuario);

// ✅ Actualizar un usuario existente
router.put('/:id', updateUsuario);

// ✅ Eliminar un usuario y sus reseñas asociadas
router.delete('/:id', deleteUsuario);

module.exports = router;
