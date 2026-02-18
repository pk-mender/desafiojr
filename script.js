// script.js
document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:3000/clientes";

    // --- SELETORES GERAIS ---
    const clientesContainer = document.getElementById("clientes-container");
    const botaoBuscar = document.querySelector(".btn-buscar");
    const btnLimpar = document.getElementById('btn-limpar');
    const btnSalvar = document.querySelector('.btn-salvar');

    // --- 1. MÁSCARAS E VALIDAÇÕES VISUAIS ---

    const nomeInput = document.getElementById("nome");
    if (nomeInput) {
        nomeInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-zÀ-ÿ '-]/g, "");
        });
    }

    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 11);
            if (val.length > 9) val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            else if (val.length > 6) val = val.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
            else if (val.length > 3) val = val.replace(/(\d{3})(\d{1,3})/, "$1.$2");
            e.target.value = val;
        });
    }

    const telefoneInput = document.getElementById("telefone");
    if (telefoneInput) {
        telefoneInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 11);
            if (val.length > 10) val = val.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
            else if (val.length > 5) val = val.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");
            else if (val.length > 2) val = val.replace(/(\d{2})(\d{1,4})/, "($1) $2");
            else if (val.length > 0) val = val.replace(/(\d{1,2})/, "($1");
            e.target.value = val;
        });
    }

    const dataNascInput = document.getElementById("data-nascimento");
    if (dataNascInput) {
        dataNascInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 8);
            if (val.length > 4) val = val.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
            else if (val.length > 2) val = val.replace(/(\d{2})(\d{1,2})/, "$1/$2");
            e.target.value = val;
        });
    }

    // Aviso de dados não salvos (Desafio 2.4)
    window.addEventListener('beforeunload', (event) => {
        if (nomeInput && nomeInput.value.trim().length > 0 && !btnSalvar.disabled) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // --- 2. LÓGICA DA TELA PRINCIPAL (LISTAGEM) ---

    if (clientesContainer) {
        async function carregarClientes(filtros = {}) {
            clientesContainer.innerHTML = `<div class="table-row"><div class="col" style="grid-column: span 6; text-align: center;">⏳ Carregando...</div></div>`;
            try {
                const params = new URLSearchParams();
                if (filtros.nome) params.append("nome_like", filtros.nome);
                if (filtros.cpf) params.append("cpf", filtros.cpf);

                const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
                const resposta = await fetch(url);
                const dados = await resposta.json();
                renderClientes(dados);
            } catch (error) {
                showToast("Erro ao carregar dados.", "error");
            }
        }

        function renderClientes(lista) {
            clientesContainer.innerHTML = lista.length ? lista.map(c => `
                <div class="table-row">
                    <div class="col">${c.nome}</div>
                    <div class="col">${c.email || '-'}</div>
                    <div class="col">${c.cpf}</div>
                    <div class="col">${formataDataISOparaBR(c.dataNascimento)}</div>
                    <div class="col">${c.telefone}</div>
                    <div class="col">
                        <a href="novo_cliente.html?id=${c.id}" class="btn-editar">Editar</a>
                        <button data-id="${c.id}" class="btn-excluir">Excluir</button>
                    </div>
                </div>`).join("") : `<div class="table-row"><div class="col" style="grid-column: span 6; text-align: center;">Nenhum cliente encontrado.</div></div>`;
        }

        // Eventos de Busca e Limpar
        if (botaoBuscar) {
            botaoBuscar.addEventListener("click", () => {
                carregarClientes({ 
                    nome: document.getElementById("nome").value.trim(), 
                    cpf: document.getElementById("cpf").value.trim() 
                });
            });
        }

        if (btnLimpar) {
            btnLimpar.addEventListener("click", () => {
                document.getElementById("nome").value = "";
                document.getElementById("cpf").value = "";
                carregarClientes();
                showToast("Filtros removidos", "info");
            });
        }

        // Evento de Excluir
        clientesContainer.addEventListener("click", async (e) => {
            const btnExcluir = e.target.closest(".btn-excluir");
            if (btnExcluir && confirm("Confirma a exclusão?")) {
                const id = btnExcluir.getAttribute("data-id");
                try {
                    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                    carregarClientes();
                    showToast("Excluído!", "success");
                } catch (err) { showToast("Erro ao excluir", "error"); }
            }
        });

        carregarClientes(); // Carga inicial
    }

    // --- 3. LÓGICA DA TELA DE CADASTRO/EDIÇÃO ---

    if (btnSalvar) {
        const params = new URLSearchParams(window.location.search);
        const editarId = params.get("id");
        const hiddenIdInput = document.getElementById('cliente-id');

        // Se for edição, busca os dados
        if (editarId) {
            (async () => {
                try {
                    const res = await fetch(`${API_URL}/${editarId}`);
                    const c = await res.json();
                    document.getElementById('nome').value = c.nome;
                    document.getElementById('email').value = c.email;
                    document.getElementById('cpf').value = c.cpf;
                    document.getElementById('telefone').value = c.telefone;
                    if (c.dataNascimento) {
                        const [y, m, d] = c.dataNascimento.split("-");
                        document.getElementById('data-nascimento').value = `${d}/${m}/${y}`;
                    }
                    hiddenIdInput.value = c.id;
                    document.querySelector('header h1').textContent = "Editar Cliente";
                    btnSalvar.textContent = "ATUALIZAR";
                } catch (e) { showToast("Erro ao carregar cliente", "error"); }
            })();
        }

        btnSalvar.addEventListener("click", async () => {
            const nome = document.getElementById('nome').value.trim();
            const email = document.getElementById('email').value.trim();
            const cpf = document.getElementById('cpf').value.trim();
            const tel = document.getElementById('telefone').value.trim();
            const data = document.getElementById('data-nascimento').value.trim();

            if (!nome || !validaEmail(email) || !validaCPF(cpf) || !data) {
                return showToast("Preencha os campos corretamente", "error");
            }

            if (calcularIdade(data) < 18) {
                return showToast("Mínimo 18 anos.", "error");
            }

            // Início do processo de salvar
            btnSalvar.textContent = "SALVANDO...";
            btnSalvar.disabled = true;

            try {
                // Validação de CPF Duplicado
                const resBusca = await fetch(`${API_URL}?cpf=${cpf}`);
                const encontrados = await resBusca.json();
                if (encontrados.length > 0 && encontrados[0].id != hiddenIdInput.value) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = editarId ? "ATUALIZAR" : "SALVAR";
                    return showToast("CPF já cadastrado!", "error");
                }

                const [d, m, y] = data.split("/");
                const payload = { nome, email, cpf, telefone: tel, dataNascimento: `${y}-${m}-${d}` };
                
                const metodo = editarId ? "PATCH" : "POST";
                const url = editarId ? `${API_URL}/${editarId}` : API_URL;

                const resposta = await fetch(url, {
                    method: metodo,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!resposta.ok) throw new Error();

                showToast(editarId ? "Atualizado!" : "Salvo!", "success");

                // --- DESAFIO 2.4: NAVEGAÇÃO APÓS SALVAR ---
                setTimeout(() => {
                    const acao = confirm("Sucesso!\n\nOK: Voltar para a lista\nCancelar: Cadastrar outro");
                    if (acao) {
                        window.location.href = "index.html";
                    } else {
                        if (!editarId) {
                            ["nome", "email", "cpf", "telefone", "data-nascimento"].forEach(id => document.getElementById(id).value = "");
                        } else {
                            window.location.href = "novo_cliente.html";
                        }
                    }
                }, 500);

            } catch (error) {
                showToast("Erro ao salvar", "error");
            } finally {
                btnSalvar.textContent = editarId ? "ATUALIZAR" : "SALVAR";
                btnSalvar.disabled = false;
            }
        });
    }
});

// --- FUNÇÕES AUXILIARES (FORA DO DOMCONTENTLOADED) ---

function formataDataISOparaBR(iso) {
    if (!iso || !iso.includes("-")) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function validaCPF(cpfString) {
    const cpf = cpfString.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
}

function validaEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calcularIdade(dataBR) {
    const [d, m, y] = dataBR.split("/").map(Number);
    const nasc = new Date(y, m - 1, d);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}