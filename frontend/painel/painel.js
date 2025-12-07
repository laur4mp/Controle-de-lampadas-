// rotas
const rotaBuscarTudo = 'http://localhost:3000/lampadas/buscarTudo/';
const rotaAtualizar = 'http://localhost:3000/lampadas/atualizarLampada/';
const rotaBuscarNome = 'http://localhost:3000/lampadas/buscarNome/';
const rotaBuscarUser = 'http://localhost:3000/usuarios/buscarUser/';
const rotaCriarUsuario = 'http://localhost:3000/usuarios/criarUsuario/'; 

// variáveis globais
let usuario = {};
let emailUser = '';
let nomeUseCompelto = '';
let todasAsLampadas = [];

// abrir modal de edição de usuário
function abrirModalEditarUsuario() {
    const modalEl = document.getElementById('modalEditarUsuario');
    if (!modalEl) return;
    const elNome = document.getElementById('editNomeUser');
    const elEmail = document.getElementById('editEmailUser');
    const elSenha1 = document.getElementById('editSenhaUser1');
    const elSenha2 = document.getElementById('editSenhaUser2');
    if (elNome) elNome.value = nomeUseCompelto || '';
    if (elEmail) elEmail.value = emailUser || '';
    if (elSenha1) elSenha1.value = '';
    if (elSenha2) elSenha2.value = '';

    const modalUserEl = document.getElementById('modalUser');
    const showEditar = () => {
        try {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
        } catch (err) {
        }
    };
    if (modalUserEl) {
        try {
            const modalUserInst = bootstrap.Modal.getInstance(modalUserEl) || new bootstrap.Modal(modalUserEl);
            modalUserInst.hide();
            setTimeout(() => {
                showEditar();
            }, 250);
        } catch (err) {
            showEditar();
        }
    } else {
        showEditar();
    }
}

// atualizar usuário
async function atualizarUser() {
    const elNome = document.getElementById('editNomeUser');
    const elEmail = document.getElementById('editEmailUser');
    const elSenhaAtual = document.getElementById('editSenhaAtual');
    const elSenha1 = document.getElementById('editSenhaUser1');
    const elSenha2 = document.getElementById('editSenhaUser2');
    if (!elNome || !elEmail || !elSenhaAtual) return;
    
    const nomeNovo = elNome.value.trim();
    const emailNovo = elEmail.value.trim();
    const senhaAtual = elSenhaAtual.value;
    const senha1 = elSenha1 ? elSenha1.value : '';
    const senha2 = elSenha2 ? elSenha2.value : '';
    
    if (!nomeNovo || !emailNovo) {
        alert('Nome e email são obrigatórios.');
        return;
    }
    if (!senhaAtual) {
        alert('Senha atual é obrigatória.');
        return;
    }
    if ((senha1 || senha2) && senha1 !== senha2) {
        alert('As senhas não conferem.');
        return;
    }
    
    const idUser = (usuario && usuario.id) ? usuario.id : localStorage.getItem('idUser');
    if (!idUser) {
        alert('ID do usuário não encontrado. Faça login novamente.');
        return;
    }
    const urlPut = 'http://localhost:3000/usuarios/atualizarUser/' + encodeURIComponent(idUser);
    const body = { nome: nomeNovo, email: emailNovo, senhaAtual: senhaAtual };
    if (senha1) {
        body.senha = senha1;
    }
    try {
        const res = await fetch(urlPut, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const serverMsg = data.mensagem || data.erro || data || res.statusText || res.status;
            alert('Erro ao atualizar usuário: ' + serverMsg);
            return;
        }
        nomeUseCompelto = nomeNovo;
        emailUser = emailNovo;
        localStorage.setItem('nomeUser', nomeUseCompelto);
        const nomeUserModal = document.getElementById('nomeUserPer');
        const emailUserModal = document.getElementById('emailUserModalPer');
        if (nomeUserModal) nomeUserModal.textContent = `Nome: ${nomeUseCompelto}`;
        if (emailUserModal) emailUserModal.textContent = `Email: ${emailUser}`;

        const modalEl = document.getElementById('modalEditarUsuario');
        try {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        } catch (err) {
        }
        if (elNome) elNome.value = '';
        if (elEmail) elEmail.value = '';
        if (elSenha1) elSenha1.value = '';
        if (elSenha2) elSenha2.value = '';

        alert('Usuário atualizado com sucesso.');
    } catch (err) {
        alert('Erro ao atualizar usuário. Tente novamente.');
    }
}

function atualizarLampada() {
    const novoNome = document.getElementById('novoNome').value;
    const onHorario = document.getElementById('horaLigar').value;
    const offHorario = document.getElementById('horaDesligar').value;
   
    const modalEd = document.getElementById('modalEdicao');
    const nomeOriginal = (modalEd && modalEd.dataset && modalEd.dataset.originalName) ? modalEd.dataset.originalName : novoNome;
    editarLampadas(nomeOriginal, novoNome, onHorario, offHorario).then(success => {
        if (success) {
            try {
                const modal = bootstrap.Modal.getInstance(modalEd) || new bootstrap.Modal(modalEd);
                modal.hide();
            } catch (e) {
            }
            recuperarLampadasTudo();
        }
    });
}

async function editarLampadas(nomeAntigo, novoNome, onHorario, offHorario) {
    const lampadaEditada = {
        onHorario: onHorario,
        offHorario: offHorario,
        novoNome: novoNome
    };
    try {
        const url = rotaAtualizar + encodeURIComponent(nomeAntigo);
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lampadaEditada)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert('Erro ao atualizar lâmpada: ' + (err.mensagem || err.erro || res.status));
            return false;
        }
        return true;
    } catch (erro) {
        alert('Não foi possível atualizar a lâmpada. Tente novamente.');
        return false;
    }
}

async function abrirEditarModal(nome) {
    try {
        const res = await fetch(rotaBuscarNome + encodeURIComponent(nome), { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (res.status === 404) {
            alert('Lâmpada não encontrada para edição.');
            return;
        }
        if (!res.ok) {
            alert('Erro ao buscar lâmpada para edição.');
            return;
        }
        const data = await res.json();
        const elNome = document.getElementById('novoNome');
        const elOn = document.getElementById('horaLigar');
        const elOff = document.getElementById('horaDesligar');
        if (elNome) elNome.value = data.nome || '';
        if (elOn) elOn.value = data.onHorario || '';
        if (elOff) elOff.value = data.offHorario || '';

        const modalEd = document.getElementById('modalEdicao');
        if (modalEd) modalEd.dataset.originalName = data.nome || nome;

    } catch (err) {
        alert('Erro ao carregar dados da lâmpada.');
    }
}

async function recuperarLampadasTudo() {
    try {
        const res = await fetch(rotaBuscarTudo, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (res.status === 404) {
            return;
        }
        if (!res.ok) {
            return;
        }

        const data = await res.json();
        todasAsLampadas = data;
        atualizarInterfaceLampadas();
    } catch (erro) {
    }
}

function atualizarInterfaceLampadas() {
    const tamanho = todasAsLampadas.length;
    const divlamapadas = document.getElementById('container-lampadas');

    const addCard = divlamapadas.querySelector('.add-lampada'); 
    if (addCard) {
        addCard.remove();
    }
    divlamapadas.innerHTML = '';

    for (let i = 0; i < tamanho; i++) {
        const lampada = todasAsLampadas[i];
        const nomelampada = lampada.nome;
        const onHorario = lampada.onHorario;
        const offHorario = lampada.offHorario;
        const estadoLampada = lampada.estado;
        const criarLampadasDiv = document.createElement('div');
        criarLampadasDiv.className = 'card';

        const criaP = document.createElement('p');
        criaP.className = 'lampada-nome';
        criaP.textContent = nomelampada;

        const botaoEditar = document.createElement('button');
        botaoEditar.className = 'edit btn btn-link';
        botaoEditar.setAttribute('data-bs-toggle', 'modal');
        botaoEditar.setAttribute('data-bs-target', '#modalEdicao');
        botaoEditar.innerHTML = '<i class="bi bi-pencil-fill"></i>';
        botaoEditar.addEventListener('click', () => abrirEditarModal(nomelampada));

        const criarDivHorarios = document.createElement('div');
        criarDivHorarios.className = 'horarios';

        const criardivHorario = document.createElement('div');
        criardivHorario.className = 'horario';
        const criardivHorario2 = document.createElement('div');
        criardivHorario2.className = 'horario';

        const criarLabel1 = document.createElement('label');
        criarLabel1.textContent = 'Horário para ligar: ' + onHorario;

        const criarLabel2 = document.createElement('label');
        criarLabel2.textContent = 'Horário para desligar: ' + offHorario;

        const criarEstado = document.createElement('div')
        criarEstado.className = 'status';
        
        const statusTextSpan = document.createElement('span');
        statusTextSpan.className = 'status-text';
        const isLigadaInicial = (estadoLampada === 1 || estadoLampada === '1' || String(estadoLampada).toLowerCase().startsWith('l') || estadoLampada === true);
        statusTextSpan.textContent = 'A lampada está: ' + (isLigadaInicial ? 'Ligada' : 'Desligada');

        const criarBotãoLigDes = document.createElement('button');
        criarBotãoLigDes.className = 'bnt-ligar btn btn-sm ' + (isLigadaInicial ? 'btn-outline-danger' : 'btn-outline-success');
        criarBotãoLigDes.textContent = isLigadaInicial ? 'Desligar' : 'Ligar';

        function setButtonColor(btn, ligada) {
            if (!btn) return;
            btn.classList.remove('btn-outline-success', 'btn-outline-danger', 'btn-outline-primary', 'btn-outline-secondary');
            if (ligada) {
                btn.classList.add('btn-outline-danger');
            } else {
                btn.classList.add('btn-outline-success');
            }
        }

    

        criarEstado.appendChild(statusTextSpan);
    
        criardivHorario.appendChild(criarLabel1);
        criardivHorario2.appendChild(criarLabel2);
        criarDivHorarios.appendChild(criardivHorario);
        criarDivHorarios.appendChild(criardivHorario2);

        criaP.appendChild(botaoEditar);
        criarLampadasDiv.appendChild(criaP);
        criarLampadasDiv.appendChild(criarDivHorarios);
        criarLampadasDiv.appendChild(criarEstado);
        divlamapadas.appendChild(criarLampadasDiv);
    }

    if (addCard) {
        divlamapadas.appendChild(addCard);
        addCard.style.display = 'flex';
    }
}
function fazerLogoff() {
    usuario = {};
    emailUser = '';
    nomeUseCompelto = '';
    localStorage.removeItem('idUser');
    localStorage.removeItem('nomeUser');
    window.location.href = '../index.html'; 
}

document.addEventListener('DOMContentLoaded', async () => {
    // Greeting
    const bemvindo = document.getElementById('bemvindo');
    const nomeUser = localStorage.getItem('nomeUser') || 'Usuário';
    const nome1 = nomeUser.split(' ')[0];
    bemvindo.innerHTML = `Olá, ${nome1}.`;
    const tituloModal = document.getElementById('tituloModal');
    tituloModal.innerHTML = `Usuário: ${nome1}`;

    //desfazer login 
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
    btnSair.addEventListener('click', fazerLogoff);
    }
    // buscar Usuário
    try {
        const idUser = localStorage.getItem('idUser');
        if (!idUser) {
            return;
        }
        const res = await fetch(rotaBuscarUser + encodeURIComponent(idUser), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.status === 404) {
            return;
        }
        if (!res.ok) {
            return;
        }
        const data = await res.json();
        usuario = data;
        emailUser = usuario.email || '';
        nomeUseCompelto = usuario.nome || '';

    } catch (erro) {
    }
    const nomeUserModal = document.getElementById('nomeUserPer');
    const emailUserModal = document.getElementById('emailUserModalPer');
    if (nomeUserModal) nomeUserModal.textContent = `Nome: ${nomeUseCompelto}`;
    if (emailUserModal) emailUserModal.textContent = `Email: ${emailUser}`;

    // Event listeners
    const modalEditarBtn = document.getElementById('salvar');
    if (modalEditarBtn) {
        modalEditarBtn.addEventListener('click', atualizarLampada);
    }

    const btnEditarDados = document.getElementById('btnEditarDados');
    const btnAdicionarUsuario = document.getElementById('btnAdicionarUsuario');

    if (btnEditarDados) {
        btnEditarDados.addEventListener('mousedown', () => {
            try { document.activeElement && document.activeElement.blur(); } catch (err) {}
        });

        btnEditarDados.addEventListener('click', () => {
            const elNome = document.getElementById('editNomeUser');
            const elEmail = document.getElementById('editEmailUser');
            const elSenha1 = document.getElementById('editSenhaUser1');
            const elSenha2 = document.getElementById('editSenhaUser2');
            if (elNome) elNome.value = nomeUseCompelto || '';
            if (elEmail) elEmail.value = emailUser || '';
            if (elSenha1) elSenha1.value = '';
            if (elSenha2) elSenha2.value = '';
        });
    }

    if (btnAdicionarUsuario) {
        btnAdicionarUsuario.addEventListener('mousedown', () => {
            try { document.activeElement && document.activeElement.blur(); } catch (err) {}
        });

        btnAdicionarUsuario.addEventListener('click', () => {
            const novoNomeUser = document.getElementById('novoNomeUser');
            const novoEmailUser = document.getElementById('novoEmailUser');
            const novaSenhaUser = document.getElementById('novaSenhaUser');
            const novaSenhaUserConfirm = document.getElementById('novaSenhaUserConfirm');
            if (novoNomeUser) novoNomeUser.value = '';
            if (novoEmailUser) novoEmailUser.value = '';
            if (novaSenhaUser) novaSenhaUser.value = '';
            if (novaSenhaUserConfirm) novaSenhaUserConfirm.value = '';
        });
    }

    const btnSalvarEditarUser = document.getElementById('btnSalvarEditarUser');
    if (btnSalvarEditarUser) btnSalvarEditarUser.addEventListener('click', atualizarUser);

    const modalEditarEl = document.getElementById('modalEditarUsuario');
    if (modalEditarEl) {
        modalEditarEl.addEventListener('hidden.bs.modal', () => {
            const elNome = document.getElementById('editNomeUser');
            const elEmail = document.getElementById('editEmailUser');
            const elSenhaAtual = document.getElementById('editSenhaAtual');
            const elSenha1 = document.getElementById('editSenhaUser1');
            const elSenha2 = document.getElementById('editSenhaUser2');
            if (elNome) elNome.value = '';
            if (elEmail) elEmail.value = '';
            if (elSenhaAtual) elSenhaAtual.value = '';
            if (elSenha1) elSenha1.value = '';
            if (elSenha2) elSenha2.value = '';
        });
    }

    const modalAddEl = document.getElementById('modalAdicionarUser');
    if (modalAddEl) {
        modalAddEl.addEventListener('hidden.bs.modal', () => {
            const novoNomeUser = document.getElementById('novoNomeUser');
            const novoEmailUser = document.getElementById('novoEmailUser');
            const novaSenhaUser = document.getElementById('novaSenhaUser');
            const novaSenhaUserConfirm = document.getElementById('novaSenhaUserConfirm');
            if (novoNomeUser) novoNomeUser.value = '';
            if (novoEmailUser) novoEmailUser.value = '';
            if (novaSenhaUser) novaSenhaUser.value = '';
            if (novaSenhaUserConfirm) novaSenhaUserConfirm.value = '';
        });
    }

    recuperarLampadasTudo();

    // Adicionar novo usuário
    const formAdicionarUsuario = document.getElementById('formAdicionarUsuario');
    const novoNomeUser = document.getElementById('novoNomeUser');
    const novoEmailUser = document.getElementById('novoEmailUser');
    const novaSenhaUser = document.getElementById('novaSenhaUser');
    const btnSalvarNovoUser = document.getElementById('btnSalvarNovoUser');

    btnSalvarNovoUser.addEventListener('click', async (e) => {
        e.preventDefault(); 

        const confirmSenha = document.getElementById('novaSenhaUserConfirm');
        if (!novoNomeUser.value || !novoEmailUser.value || !novaSenhaUser.value || !confirmSenha || !confirmSenha.value) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        if (novaSenhaUser.value !== confirmSenha.value) {
            alert('As senhas não conferem.');
            return;
        }
        const novoUsuario = {
            nome: novoNomeUser.value,
            email: novoEmailUser.value,
            senha: novaSenhaUser.value 
        }

        try {
            const res = await fetch(rotaCriarUsuario, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoUsuario)
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Sucesso! Usuário '${novoUsuario.nome}' criado. ID: ${data.usuarioId}`);

                const modalElement = document.getElementById('modalAdicionarUser');
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.hide();

                formAdicionarUsuario.reset();

            } else {
                alert(`Erro ao criar usuário: ${data.mensagem || data.erro || 'Erro desconhecido.'}`);
            }

        } catch (erro) {
            alert('Não foi possível criar usuário. Tente novamente mais tarde.');
        }
    });
});

