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


router.get('/tipos', getTiposRuta);


router.get('/', getAllRutas);


router.post('/', createRuta);


router.get('/usuario/:id_usuario', getRutasByUsuario);


router.get('/:id', getRutaById);


router.put('/:id', updateRuta);


router.delete('/:id', deleteRuta);

module.exports = router;