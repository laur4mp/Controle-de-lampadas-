const urlLogin = 'http://localhost:3000/usuarios/login';

function loginUser(email, senha) {
    fetch(urlLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })
    .then(res => {
        if (res.status === 404) {
            alert("Email não registrado");
            return null;
        }
        if (res.status === 401) {
            alert("Senha incorreta");
            return null;
        }
        if (res.status === 500) {
            alert('Erro ao logar. Tente novamente.');
            return null;
        }
        return res.json(); // Aqui converte para JSON!
    })
    .then(json => {
    if (json && json.usuario && json.usuario.nome) {
        localStorage.setItem('nomeUser', json.usuario.nome);
        localStorage.setItem('idUser', json.usuario.id);
        window.location.href = `painel/painel.html`;
    }
});
}

function verificar() {
    let email = document.getElementById('email').value;
    let senha = document.getElementById('senha').value;
    if (senha === "" || email === "") {
        alert('Preencha todos os campos.');
    } else {
        loginUser(email, senha);
    }
}

let btnEntrar = document.getElementById('btnEntrar');
btnEntrar.addEventListener('click', (event) => {
    event.preventDefault();
    verificar();
});

// Variáveis para recuperação de senha
let emailRecuperacaoAtual = '';
let codigoRecuperacaoAtual = '';

// Passo 1: Enviar código
async function enviarCodigo() {
    const email = document.getElementById('emailRecuperacao').value.trim();
    if (!email) {
        alert('Digite um email válido.');
        return;
    }

    const res = await fetch('http://localhost:3000/usuarios/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const data = await res.json();
    
    if (res.ok) {
        // Mostrar o código se estiver em desenvolvimento
        if (data.codigo) {
            alert(`Código gerado: ${data.codigo}\n\n${data.mensagem}`);
        } else {
            alert(data.mensagem);
        }
        emailRecuperacaoAtual = email;
        document.getElementById('passo1-email').style.display = 'none';
        document.getElementById('passo2-codigo').style.display = 'block';
    } else {
        alert(data.mensagem || 'Erro ao enviar código.');
    }
}

// Passo 2: Validar código
async function validarCod() {
    const codigo = document.getElementById('codigoRecuperacao').value.trim();
    if (!codigo || codigo.length !== 6) {
        alert('Digite um código válido de 6 dígitos.');
        return;
    }

    const res = await fetch('http://localhost:3000/usuarios/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecuperacaoAtual, codigo })
    });

    const data = await res.json();
    if (!res.ok) {
        alert(data.mensagem);
        return;
    }

    alert('Código validado!');
    codigoRecuperacaoAtual = codigo;
    document.getElementById('passo2-codigo').style.display = 'none';
    document.getElementById('passo3-senha').style.display = 'block';
}

// Passo 3: Alterar senha
async function alterarSenha() {
    const novaSenha1 = document.getElementById('novaSenha1').value;
    const novaSenha2 = document.getElementById('novaSenha2').value;

    if (!novaSenha1 || !novaSenha2) {
        alert('Preencha as duas senhas.');
        return;
    }
    if (novaSenha1 !== novaSenha2) {
        alert('As senhas não conferem.');
        return;
    }

    const res = await fetch('http://localhost:3000/usuarios/resetar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecuperacaoAtual, codigo: codigoRecuperacaoAtual, novaSenha: novaSenha1 })
    });

    const data = await res.json();
    alert(data.mensagem);
    
    if (res.ok) {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalRecuperarSenha'));
        modal.hide();
        
        // Limpar campos
        document.getElementById('emailRecuperacao').value = '';
        document.getElementById('codigoRecuperacao').value = '';
        document.getElementById('novaSenha1').value = '';
        document.getElementById('novaSenha2').value = '';
        
        // Voltar ao Passo 1
        document.getElementById('passo1-email').style.display = 'block';
        document.getElementById('passo2-codigo').style.display = 'none';
        document.getElementById('passo3-senha').style.display = 'none';
    }
}