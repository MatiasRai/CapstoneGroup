const express = require('express');
const router = express.Router();

const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuariosPaginados 
} = require('../controllers/usuarios.controller');


router.get('/paginados', getUsuariosPaginados);




router.get('/', getUsuarios);


router.get('/:id', getUsuarioById);


router.post('/', createUsuario);


router.put('/:id', updateUsuario);


router.delete('/:id', deleteUsuario);

module.exports = router;
