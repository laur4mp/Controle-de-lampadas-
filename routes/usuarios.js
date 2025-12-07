const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuariosController');

router.post('/login', controller.login);
router.post('/criarUsuario', controller.criarUsuario);
router.get('/buscarUser/:id', controller.buscarUser);
router.put('/atualizarUser/:id', controller.atualizarUsuario);
router.post('/esqueci-senha', controller.esqueceuSenha);
router.post('/validar-codigo', controller.validarCodigo);
router.post('/resetar-senha', controller.resetarSenha);
module.exports = router;