const express = require('express');
const router = express.Router();
const { createAdministrador } = require('../controllers/adm.controller');

router.post('/', createAdministrador);

module.exports = router;
