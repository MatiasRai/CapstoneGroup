const express = require('express');
const router = express.Router();
const { getDiscapacidades } = require('../controllers/discapacidades.controller');

router.get('/', getDiscapacidades);

module.exports = router;
