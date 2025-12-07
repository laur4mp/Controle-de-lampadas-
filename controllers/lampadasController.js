const db = require('../db');


const buscarTudo = (req, res) => {
    try {
        db.query('SELECT * FROM lampadas', (erro, resultado) => {
            if (erro) {
                return res.status(500).json({ erro: 'Erro ao buscar lâmpadas' });
            }
            
            if (!resultado || resultado.length === 0) {
                return res.status(404).json({ mensagem: 'Nenhuma lâmpada encontrada' });
            }
            
            return res.status(200).json(resultado);
        });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}

const buscarNome = (req, res) => {
    const nome = req.params.nome;
    db.query('SELECT * FROM lampadas WHERE nome = ?', [nome], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro ao buscar lâmpada' });
        }
        if (resultado.length === 0) {
            return res.status(404).json({ mensagem: 'Lâmpada não encontrada' });
        }
        return res.json(resultado[0]);
    });
}
const criarLampada = (req, res) => {
    const { nome, onHorario, offHorario } = req.body;
    db.query('INSERT INTO lampadas (nome, onHorario, offHorario) VALUES (?, ?, ?)', 
        [nome, onHorario, offHorario], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro ao criar lâmpada' });
        }
        return res.json({ id: resultado.insertId, mensagem: 'Lâmpada criada com sucesso' });
    });
}

const atualizarLampada = (req, res) => {
    const { nome } = req.params;
    const { onHorario, offHorario, novoNome } = req.body;
    
    db.query('UPDATE lampadas SET onHorario = ?, offHorario = ?, nome = ? WHERE nome = ?', 
        [onHorario, offHorario, novoNome || nome, nome], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro ao atualizar lâmpada' });
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Lâmpada não encontrada para atualização' });
        }
        return res.json({ mensagem: 'Lâmpada atualizada com sucesso' });
    });
}


  
const deletarLampada = (req, res) => {
    const { nome } = req.params;
    db.query('DELETE FROM lampadas WHERE nome = ?', [nome], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro ao deletar lâmpada' });
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Lâmpada não encontrada para deleção' });
        }
        return res.json({ mensagem: 'Lâmpada deletada com sucesso' });
    });
}


module.exports = { buscarTudo, buscarNome, criarLampada, atualizarLampada, atualizarEstado, deletarLampada};