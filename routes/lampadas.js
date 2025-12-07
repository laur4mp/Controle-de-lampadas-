const express = require('express');
const router = express.Router();

const controller = require('../controllers/lampadasController');

router.get('/buscarTudo', controller.buscarTudo);
router.get('/buscarNome/:nome', controller.buscarNome);

router.post('/criarLampada', controller.criarLampada);
router.put('/atualizarLampada/:nome', controller.atualizarLampada);
router.delete('/deletarLampada/:nome', controller.deletarLampada);

module.exports = router;
