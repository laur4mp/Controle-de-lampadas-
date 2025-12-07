const mysql = require('mysql2');

const conexao = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root' ,
    password: 'laura',
    database: 'controlelampadas'
})

conexao.connect((erro) => {
    if(erro){
        console.error("Erro ao conectar com o banco de dados " + erro);
        return;
    }
    console.log('Conexão com o banco de dados realizada com sucesso!');
});

module.exports = conexao;