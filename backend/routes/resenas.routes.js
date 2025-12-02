const express = require('express');
const router = express.Router();
const {
  getResenasByUsuario,
  createResena,
  updateResena,
  deleteResena,
  getResenasByLugar
} = require('../controllers/resenas.controller');




router.get('/usuario/:id_usuario', getResenasByUsuario);


router.get('/lugar/:id_lugar', getResenasByLugar);


router.post('/', createResena);


router.put('/:id', updateResena);


router.delete('/:id', deleteResena);

module.exports = router;