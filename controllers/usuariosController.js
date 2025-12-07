const db = require('../db');
const bcrypt = require('bcrypt');
const transporter = require('../config/email');


const emailRegras = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const login = (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
        if (!resultado || resultado.length === 0) return res.status(404).json({ mensagem: 'Email não cadastrado.' });

        const usuario = resultado[0];
        try {
            // compara senha com a criptografada
            let match = await bcrypt.compare(senha, usuario.senha);
            if (!match && usuario.senha && usuario.senha.length < 60 && senha === usuario.senha) {
                match = true;
            }
            if (!match) return res.status(401).json({ mensagem: 'Senha incorreta.' });
            return res.status(200).json({ mensagem: 'Login bem-sucedido!', usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome } });
        } catch (err) {
            return res.status(500).json({ erro: 'Erro ao verificar senha.' });
        }
    });
};


const buscarUser = (req, res) => {
    const userId = req.params.id;
    db.query('SELECT id, email, nome FROM usuarios WHERE id = ?', [userId], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro ao buscar usuário' });
        }
        if (!resultado || resultado.length === 0) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' });
        }
        return res.status(200).json(resultado[0]);
    });
};


const criarUsuario = (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
    // validar email
    if (!emailRegras.test(email)) {
        return res.status(400).json({ mensagem: 'Formato de email inválido.' });
    }
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao verificar. Tente novamente' });
        if (resultado && resultado.length > 0) return res.status(409).json({ mensagem: 'Email já cadastrado. Tente novamente' });
        //criptografar
        bcrypt.hash(senha, 10, (hashErr, hash) => {
            if (hashErr) {
                return res.status(500).json({ erro: 'Erro ao processar senha.' });
            }
            db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash], (erroInsert, resultadoInsert) => {
                if (erroInsert) return res.status(500).json({ erro: 'Erro ao criar usuário.' });
                res.status(201).json({ mensagem: 'Usuário criado com sucesso!', usuarioId: resultadoInsert.insertId });
            });
        });
    });
};


const atualizarUsuario = (req, res) => {
    const userId = req.params.id;
    const { nome, email, senha, senhaAtual } = req.body;
    if (!nome || !email) return res.status(400).json({ mensagem: 'Nome e email são obrigatórios.' });
    //validar formato de email
    if (!emailRegras.test(email)) {
        return res.status(400).json({ mensagem: 'Formato de email inválido.' });
    }
    if (!senhaAtual) {
        return res.status(400).json({ mensagem: 'Senha atual é obrigatória.' });
    }
    // validar email e atualizar
    const validarEmail = () => {
        // verificar se o novo email já existe 
        db.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, userId], (erroCheck, resultadoCheck) => {
            if (erroCheck) {
                return res.status(500).json({ erro: 'Erro ao verificar email.' });
            }
            
            if (resultadoCheck && resultadoCheck.length > 0) {
                return res.status(409).json({ mensagem: 'Email já cadastrado por outro usuário. Tente novamente.' });
            }
            const updateDb = (senhaHash) => {
                const params = senhaHash ? [nome, email, senhaHash, userId] : [nome, email, userId];
                const sql = senhaHash ? 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?' : 'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?';
                db.query(sql, params, (erro, resultado) => {
                    if (erro) {
                        return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
                    }
                    if (resultado.affectedRows === 0) {
                        return res.status(404).json({ erro: 'Usuário não encontrado para atualização' });
                    }
                    return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso' });
                });
            };
            if (senha) {
                // gerar hash e atualizar
                bcrypt.hash(senha, 10, (hashErr, hash) => {
                    if (hashErr) {
                        return res.status(500).json({ erro: 'Erro ao processar senha.' });
                    }
                    updateDb(hash);
                });
            } else {
                updateDb();
            }
        });
    };

    // buscar usuário e validar senha 
    db.query('SELECT senha FROM usuarios WHERE id = ?', [userId], async (erroUser, resultadoUser) => {
        if (erroUser) {
            return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
        }

        if (!resultadoUser || resultadoUser.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }
        const usuarioAtual = resultadoUser[0];
        try {

            let match = await bcrypt.compare(senhaAtual, usuarioAtual.senha);
            if (!match && usuarioAtual.senha && usuarioAtual.senha.length < 60 && senhaAtual === usuarioAtual.senha) {
                match = true;
            }
            if (!match) {
                return res.status(401).json({ mensagem: 'Senha atual incorreta.' });
            }

            validarEmail();
        } catch (err) {
            return res.status(500).json({ erro: 'Erro ao verificar senha.' });
        }
    });
};

// esqueceu Senha 
const esqueceuSenha = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensagem: 'Email é obrigatório.' });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const dataExpiracao = new Date(Date.now() + 15 * 60 * 1000);

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
        if (!resultado || resultado.length === 0) {
            return res.status(200).json({ mensagem: 'Se o email existir, um código será enviado.' });
        }

        db.query('UPDATE usuarios SET codigo_recuperacao = ?, data_expiracao_codigo = ? WHERE email = ?', 
            [codigo, dataExpiracao, email], (erroUpdate) => {
            if (erroUpdate) return res.status(500).json({ erro: 'Erro ao processar requisição.' });
            
            //enviar email
            const mailOptions = {
                from: 'seu_email@gmail.com',
                to: email,
                subject: 'Código de Recuperação de Senha',
                html: `
                    <h2>Recuperação de Senha</h2>
                    <p>Seu código de recuperação é:</p>
                    <h3 style="color: #007bff; font-size: 24px; letter-spacing: 2px;">${codigo}</h3>
                    <p>Este código é válido por <strong>15 minutos</strong>.</p>
                    <p>Se você não solicitou, ignore este email.</p>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return res.status(200).json({ 
                        mensagem: 'Código gerado, mas erro ao enviar email. Tente novamente mais tarde.',
                        codigo: codigo 
                    });
                }
                return res.status(200).json({ mensagem: 'Código enviado para seu email!' });
            });
        });
    });
};

// Validar código
const validarCodigo = (req, res) => {
    const { email, codigo } = req.body;
    if (!email || !codigo) return res.status(400).json({ mensagem: 'Email e código são obrigatórios.' });

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
        if (!resultado || resultado.length === 0) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        const usuario = resultado[0];
        const agora = new Date();

        if (usuario.codigo_recuperacao !== codigo) {
            return res.status(401).json({ mensagem: 'Código inválido.' });
        }
        if (new Date(usuario.data_expiracao_codigo) < agora) {
            return res.status(401).json({ mensagem: 'Código expirado. Solicite um novo.' });
        }

        return res.status(200).json({ mensagem: 'Código válido.' });
    });
};

//resetar senha
const resetarSenha = (req, res) => {
    const { email, codigo, novaSenha } = req.body;
    if (!email || !codigo || !novaSenha) {
        return res.status(400).json({ mensagem: 'Email, código e nova senha são obrigatórios.' });
    }

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
        if (!resultado || resultado.length === 0) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }
        const usuario = resultado[0];
        const agora = new Date();
        if (usuario.codigo_recuperacao !== codigo || new Date(usuario.data_expiracao_codigo) < agora) {
            return res.status(401).json({ mensagem: 'Código inválido ou expirado.' });
        }
        bcrypt.hash(novaSenha, 10, (hashErr, hash) => {
            if (hashErr) return res.status(500).json({ erro: 'Erro ao processar senha.' });

            db.query('UPDATE usuarios SET senha = ?, codigo_recuperacao = NULL, data_expiracao_codigo = NULL WHERE email = ?',
                [hash, email], (erroUpdate) => {
                if (erroUpdate) return res.status(500).json({ erro: 'Erro ao atualizar senha.' });
                return res.status(200).json({ mensagem: 'Senha alterada com sucesso!' });
            });
        });
    });
};

module.exports = { login, criarUsuario, buscarUser, atualizarUsuario, esqueceuSenha, validarCodigo, resetarSenha };
