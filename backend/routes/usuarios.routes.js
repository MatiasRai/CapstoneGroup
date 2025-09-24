const express = require('express');
const router = express.Router();
const { getUsuarios, createUsuario, updateUsuario, deleteUsuario } = require('../controllers/usuarios.controller');

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

module.exports = router;
