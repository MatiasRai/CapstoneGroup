const express = require('express');
const router = express.Router();
const { getEmpresas, createEmpresa, updateEstadoEmpresa } = require('../controllers/empresas.controller');

router.get('/', getEmpresas);
router.post('/', createEmpresa);
router.put('/:id/estado', updateEstadoEmpresa);

module.exports = router;
