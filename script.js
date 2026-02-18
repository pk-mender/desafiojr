//script.js
document.addEventListener("DOMContentLoaded", function () {

    // -- Constante de API--
    const API_URL = "http://localhost:3000/clientes"; //json-server endpoint

    // -- mascara do nome --

    const nomeInput = document.getElementById("nome");
    if (nomeInput) {
        nomeInput.addEventListener("input", (event) => {

            const nome = event.target;

            // Remove tudo que NÃO (^) é letra, acento, espaço, hífen ou apóstrofo
            // O "g" no final é para remover todas as ocorrências, não só a primeira

            nome.value = nome.value.replace(/[^A-Za-zÀ-ÿ '-]/g, "");
        });
    }

    // -- mascaro do CPF --

    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
        // Aplicar a mascara enquanto o usuario digita
        cpfInput.addEventListener("input", (event) => {
            const input = event.target;
            let value = input.value.replace(/\D/g, ""); // Remove tudo que não é dígito
            value = value.substring(0, 11); // Limita a 11 dígitos

            if (value.length > 9) {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            } else if (value.length > 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
            } else if (value.length > 3) {
                value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
            }

            input.value = value;
        });

        async function buscarTodosClientes() {
            const resposta = await fetch(API_URL);
            if (!resposta.ok) throw new Error("Erro ao buscar clientes");
        }

        // --- Mascara de telefone --

        const telefoneInput = document.getElementById("telefone");
        if (telefoneInput) {
            telefoneInput.addEventListener("input", (event) => {
                let value = event.target.value.replace(/\D/g, "").substring(0, 11); // Remove tudo que não é dígito e limita a 11 dígitos
                if (value.length > 10) { // Formato para 11 dígitos (ex: (11) 94567-8901)
                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                } else if (value.length > 5) { // Formato para 10 dígitos (ex: (12) 3456-7890)
                    value = value.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");
                } else if (value.length > 2) { // Formato para 3-6 dígitos (ex: (12) 3456)
                    value = value.replace(/(\d{2})(\d{1,4})/, "($1) $2");
                } else if (value.length > 0) { // Formato para 1-2 dígitos (ex: (12)
                    value = value.replace(/(\d{1,2})/, "($1");
                }
                event.target.value = value; // Atualiza o valor do campo com a máscara aplicada
            });
        }


    }

    // --- Mascara de data de nascimento ---
    const dataNascInput = document.getElementById("data-nascimento");
    if (dataNascInput) {
        dataNascInput.addEventListener("input", (event) => {
            // remove tudo que não for número
            let value = event.target.value.replace(/\D/g, "").substring(0, 8); // Limita a 8 dígitos (ddmmyyyy)

            // Aplicar as barras conforme o usuário digita
            if (value.length > 4) { // dd/mm/aaaa
                value = value.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
            } else if (value.length > 2) { // dd/mm
                value = value.replace(/(\d{2})(\d{1,2})/, "$1/$2");
            }

            event.target.value = value; // Atualiza o valor do campo com a máscara aplicada
        });
    }

    // -- funções de clientes (apenas na pag principal ) --
    const clientesContainer = document.getElementById("clientes-container");
    // Verifique se já declarou btnBuscar antes. Se sim, use apenas: btnBuscar = ...
    const botaoBuscar = document.querySelector(".btn-buscar");
    const btnLimpar = document.getElementById('btn-limpar');

    if (clientesContainer) {
        // Função para buscar e exibir os clientes
        async function carregarClientes(filtros = {}) {
            // --- INÍCIO DO LOADING ---
            clientesContainer.innerHTML = `
            <div class="table-row">
                <div class="col" style="grid-column: span 6; text-align: center; color: #666;">
                    ⏳ Carregando clientes...
                </div>
            </div>`;

            try {
                const params = new URLSearchParams();
                if (filtros.nome) params.append("nome_like", filtros.nome);
                if (filtros.cpf) params.append("cpf", filtros.cpf); // CPF geralmente é busca exata

                const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
                const resposta = await fetch(url);

                if (!resposta.ok) throw new Error("Erro ao buscar clientes");

                const dados = await resposta.json();
                renderClientes(dados); // Certifique-se que sua função de desenho se chama renderClientes

            } catch (error) {
                console.error("Erro:", error);
                clientesContainer.innerHTML = `
                <div class="table-row">
                    <div class="col" style="grid-column: span 6; text-align: center; color: red;">
                        Erro ao carregar dados ou servidor offline.
                    </div>
                </div>`;
            }
        }

        // --- LOGICA DO BOTÃO BUSCAR ---
        if (botaoBuscar) {
            botaoBuscar.addEventListener("click", () => {
                const nomeFiltro = document.getElementById("nome").value.trim();
                const cpfFiltro = document.getElementById("cpf").value.trim();

                // Passa o objeto que a função carregarClientes espera
                carregarClientes({ nome: nomeFiltro, cpf: cpfFiltro });
            });
        }

        // --- LOGICA DO BOTÃO LIMPAR (Desafio 2.3) ---
        if (btnLimpar) {
            btnLimpar.addEventListener("click", () => {
                const inputNome = document.getElementById("nome");
                const inputCpf = document.getElementById("cpf");

                if (inputNome) inputNome.value = "";
                if (inputCpf) inputCpf.value = "";

                carregarClientes(); // Chama sem filtros para trazer todos
                showToast("Filtros removidos", "info");
            });
        }

        // Carregamento inicial (ao abrir a página)
        carregarClientes();
    }

    function formataDataISOparaBR(iso) {
        if (!iso) return "";
        // Aceita formatos 'aaaa-mm-dd' ou 'dd/mm/aaaa' e retorna dd/mm/aaaa
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            const [y, m, d] = iso.split("-");
            return `${d}/${m}/${y}`;
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso; // Já está no formato correto
        return iso; // Retorna como está se não reconhecer o formato
    }

    function renderClientes(lista) {
        clientesContainer.innerHTML = "";
        if (!lista.length) {
            clientesContainer.innerHTML = `
                    <div class="table-row">
                        <div class="col" style="grid-column: span 6; text-align: center;">
                            Nenhum cliente encontrado.
                        </div>
                    </div>`;
            return;
        }
        clientesContainer.innerHTML = lista.map(cliente => {
            return `
                    <div class="table-row">
                        <div class="col">${cliente.nome}</div>
                        <div class="col">${cliente.email || '-'}</div>
                        <div class="col">${cliente.cpf}</div>
                        <div class="col">${formataDataISOparaBR(cliente.dataNascimento)}</div>
                        <div class="col">${cliente.telefone}</div>
                        <div class="col">
                            <a href="editar.html?id=${cliente.id}" class="btn-editar">Editar</a>
                            <button data-id="${cliente.id}" class="btn-excluir">Excluir</button>
                        </div>
                    </div>`;
        }).join("");
    }

    // Evento para excluir 
    clientesContainer.addEventListener("click", async (event) => {
        const btnExcluir = event.target.closest(".btn-excluir");
        if (btnExcluir) {
            const id = btnExcluir.getAttribute("data-id");
            if (confirm("Confirma a exclusão do cliente?")) {

                // --- INÍCIO DO LOADING (EXCLUIR) ---
                const textoOriginal = btnExcluir.textContent;
                btnExcluir.textContent = "Excluindo...";
                btnExcluir.disabled = true;
                btnExcluir.style.cursor = "wait"; // Opcional: muda o cursor para indicar que está processando
                // --- FIM DO LOADING ---

                try {
                    const resposta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                    if (!resposta.ok) throw new Error("Falha ao excluir");
                    carregarClientes(); // Recarrega a lista após exclusão
                } catch (error) {
                    console.error("Erro:", error);
                    //alert("Erro ao excluir cliente.");
                    showToast("Erro ao excluir cliente.", "error");

                    // Se der erro, temos que voltar o botão ao normal
                    btnExcluir.textContent = textoOriginal;
                    btnExcluir.disabled = false;
                    btnExcluir.style.cursor = "pointer"; // Opcional: volta o cursor ao normal
                }
            }
            return; // evita cair na lógica de alterar
        }

        const btnAlterar = event.target.closest(".btn-alterar");
        if (btnAlterar) {
            const id = btnAlterar.getAttribute("data-id");
            // Abre a página de edição passando o ID do cliente como parâmetro
            window.open(`novo_cliente.html?id=${id}`, "_blank");
        }
    });

    // Busca por filtros
    carregarClientes(); // Carrega todos os clientes inicialmente
    })();

    // --- Desafio 2.3: LÓGICA DE BUSCA E LIMPEZA ---

    async function buscarClientes() {
        const nome = document.getElementById('nome')?.value.trim() || '';
        const cpf = document.getElementById('cpf')?.value.trim() || '';

        // Monta a URL com filtros
        let url = `${API_URL}?`;
        if (nome) url += `nome_like=${nome}&`;
        if (cpf) url += `cpf=${cpf}`; // CPF geralmente é busca exata, mas pode usar cpf_like se preferir

        // CHAMADA IMPORTANTE: 
        // Em vez de criar um fetch novo aqui, vamos usar a função carregarClientes
        // que você já tem, mas passando a URL filtrada para ela!
        carregarClientes(url);
    }

    // Evento do botão BUSCAR
    const btnBuscar = document.querySelector('.btn-buscar');
if (btnBuscar) {
    btnBuscar.addEventListener('click', buscarClientes);
}

// Evento do botão LIMPAR
const btnLimpar = document.getElementById('btn-limpar');
if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
        const nomeInput = document.getElementById('nome');
        const cpfInput = document.getElementById('cpf');

        if (nomeInput) nomeInput.value = '';
        if (cpfInput) cpfInput.value = '';

        // Recarrega a lista completa usando a URL base original
        carregarClientes(API_URL);

        showToast('Filtros limpos com sucesso!', 'info');
    });
}


// --- Lógica de cadastro (novo_cliente.html) ---

const btnSalvar = document.querySelector('.btn-salvar');
if (btnSalvar) {
    // dectetar se é edição: verificar parametro id na url
    const params = new URLSearchParams(window.location.search);
    const editarId = params.get("id");
    const hiddenIdInput = document.getElementById('cliente-id');
    const headerTitulo = document.querySelector('header h1');

    if (editarId) {
        // Modo edição - buscar cliente e preencher
        (async () => {
            try {
                const resposta = await fetch(`${API_URL}/${editarId}`);
                if (!resposta.ok) throw new Error("Cliente não encontrado");
                const cliente = await resposta.json();
                const nomeCompletoInput = document.getElementById('nome');
                const emailInput = document.getElementById('email');
                const cpfCadastroInput = document.getElementById('cpf');
                const telefoneCadastroInput = document.getElementById('telefone');
                const dataNascInput = document.getElementById('data-nascimento');
                if (nomeCompletoInput) nomeCompletoInput.value = cliente.nome || "";
                if (emailInput) emailInput.value = cliente.email || "";
                if (cpfCadastroInput) cpfCadastroInput.value = cliente.cpf || "";
                if (telefoneCadastroInput) telefoneCadastroInput.value = cliente.telefone || "";
                if (dataNascInput) {
                    // converte ISO para dd/mm/aaaa
                    if (cliente.dataNascimento && /^\d{4}-\d{2}-\d{2}$/.test(cliente.dataNascimento)) {
                        const [y, m, d] = cliente.dataNascimento.split("-");
                        dataNascInput.value = `${d}/${m}/${y}`;
                    } else {
                        dataNascInput.value = cliente.dataNascimento || "";
                    }
                }
                if (hiddenIdInput) hiddenIdInput.value = cliente.id;
                if (headerTitulo) headerTitulo.textContent = "Editar Cliente";
                btnSalvar.textContent = "ATUALIZAR";
            } catch (error) {
                //alert("Falha ao carregar cliente para edição.");
                showToast("Falha ao carregar cliente para edição.", "error");
                console.error("Erro:", error);
            }
        })();
    }

    btnSalvar.addEventListener("click", async () => {
        console.log("1. O botão foi clicado!"); // analise 1
        const nomeCompletoInput = document.getElementById('nome');
        const emailInput = document.getElementById('email');
        const cpfCadastroInput = document.getElementById('cpf');
        const telefoneCadastroInput = document.getElementById('telefone');
        const dataNascInput = document.getElementById('data-nascimento');

        const nome = (nomeCompletoInput?.value || '').trim();
        const email = (emailInput?.value || '').trim();
        const cpf = (cpfCadastroInput?.value || '').trim();
        const telefone = (telefoneCadastroInput?.value || '').trim();
        const data = (dataNascInput?.value || '').trim();

        console.log("2. Pegou os dados. Data digitada:", data); // analise 2

        // Validações básicas e obrigatórias
        //if (!nome) return alert("O nome é obrigatório.");
        if (!nome) return showToast("O nome é obrigatório.", "error");
        if (!email || !validaEmail(email)) return showToast("Por favor, insira um email válido.", "error");
        if (!cpf || !validaCPF(cpf)) return showToast("CPF inválido.", "error");
        if (!data) return showToast("A data de nascimento é obrigatória.", "error");
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return showToast("Data deve estar no formato dd/mm/aaaa.", "error");

        console.log("3. Passou pelas validações básicas! Indo calcular a idade..."); // analise 3

        // --- Desafio 1.3: Verificar idade mínima de 18 anos ---
        const idadeCalculada = calcularIdade(data);

        console.log("4. A idade calculada foi:", idadeCalculada); // analise 4

        if (idadeCalculada < 18) {
            return showToast("Cliente deve ter no mínimo 18 anos de idade para se cadastrar.", "error");
        }
        // --- Fim do desafio 1.3 ---

        console.log("5. Tudo certo! Indo salvar no banco..."); // analise 5

        // -- Desafio 2.1: Loading --

        const textoOriginalBotao = btnSalvar.textContent;
        btnSalvar.textContent = "SALVANDO...";
        btnSalvar.disabled = true; // Desabilita o botão para evitar cliques múltiplos
        btnSalvar.style.cursor = "wait"; // Opcional: muda o cursor para indicar que está processando

        // Fim do loading

        // --- Desafio 1.1: VALIDAÇÃO DE CPF DUPLICADO ---
        try {
            console.log("1. Vai buscar na API o CPF:", cpf); // <-- Analise 1

            // Busca clientes existentes para verificar duplicidade de CPF
            const respostaBusca = await fetch(`${API_URL}?cpf=${cpf}`);
            const clientesEncontrados = await respostaBusca.json();

            console.log("2. O que a API respondeu?", clientesEncontrados); // <-- Analise 2

            // Se o array voltar com algum item, esse CPF já existe no db.json
            if (clientesEncontrados.length > 0) {
                const clienteExistente = clientesEncontrados[0];
                const idExistente = hiddenIdInput?.value;

                console.log("3. ID no Banco:", clienteExistente.id, "| ID no Form:", idExistente); // <-- Analise 3

                // Verifica se é uma tentativa de duplicata (ID diferente do que estamos editando, ou um novo cadastro)
                if (clienteExistente.id != idExistente) {
                    console.error("4. CPF Duplicado detectado! Bloqueando salvamento."); // <-- Analise DE ERRO
                    return showToast("Erro: Este CPF já está cadastrado no sistema para outro cliente!", "error");
                }
            }
        } catch (erroBusca) {
            console.error("Erro ao verificar CPF duplicado:", erroBusca);
            return showToast("Erro ao verificar o CPF no servidor.", "error");
        }
        // --- FIM DO DESAFIO 1.1 --- 

        // converter data para ISO (aaaa-mm-dd) se fornecida
        let dataISO = "";
        if (data) {
            const [d, m, y] = data.split("/");
            dataISO = `${y}-${m}-${d}`;
        }

        const payload = { nome, email, cpf, telefone, dataNascimento: dataISO };
        const idExistente = hiddenIdInput?.value;
        const metodo = idExistente ? "PATCH" : "POST";
        const url = idExistente ? `${API_URL}/${idExistente}` : API_URL;

        try {
            const resposta = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resposta.ok) throw new Error("Erro ao salvar");
            showToast(idExistente ? "Cliente atualizado!" : "Cliente salvo com sucesso!", "success");

            if (!idExistente) {
                // Limpa os campos para um novo cadastro
                nomeCompletoInput.value = "";
                emailInput.value = "";
                cpfCadastroInput.value = "";
                telefoneCadastroInput.value = "";
                dataNascInput.value = "";
            }
        } catch (error) {
            showToast("Falha ao salvar cliente. Verifique console", "error");
            console.error("Erro:", error);
        } finally {
            // Reset do loading (independente de sucesso ou falha)
            btnSalvar.textContent = textoOriginalBotao;
            btnSalvar.disabled = false;
            btnSalvar.style.cursor = "pointer"; // Opcional: volta o cursor ao normal
        }
    });
}

/**
 * Valida um cpf brasileiro
 * @param {string} cpfString  - O CPF a ser validado, pode estar formatado
 * @returns {boolean} - Retorna true se o CPF for válido, false caso contrário
 */

function validaCPF(cpfString) {
    const cpf = cpfString.replace(/[^\d]+/g, ""); // Remove caracteres não é numéricos

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false; // Verifica se tem 11 dígitos e não é uma sequência repetida
    }

    let soma = 0;
    let resto;

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
        resto = 0;
    }
    if (resto !== parseInt(cpf.substring(9, 10))) {
        return false;
    }

    soma = 0;

    // Validação do segundo dígito verificador
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
        resto = 0;
    }
    if (resto !== parseInt(cpf.substring(10, 11))) {
        return false;
    }

    return true;

}

/**
 * Valida email usando regex simples
 */
function validaEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Calculo de idade a partir da data de nascimento (dd/mm/aaaa)
 */

function calcularIdade(dataNascimentoBR) {
    // mexer na string "dd/mm/aaaa" em um array: ["dd", "mm", "aaaa"]
    const partes = dataNascimentoBR.split("/");
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // // O JavaScript conta os meses de 0 (Jan) a 11 (Dez)
    const ano = parseInt(partes[2], 10);

    const dataNascimento = new Date(ano, mes, dia);
    const hoje = new Date();

    // calcula a diferença bruta dos anos
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();

    // Ajusta a idade se o aniversário ainda não ocorreu este ano
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();


    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }

    return idade;
}

/**
 * Mostra uma notificação Toast na tela
 * @param {string} mensagem - Texto a ser exibido
 * @param {string} tipo - 'success', 'error' ou 'info'
 */
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Cria o elemento do toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;

    // Adiciona ao container
    container.appendChild(toast);

    // Remove automaticamente após 3 segundos
    setTimeout(() => {
        toast.classList.add('toast-fade-out'); // Começa animação de saída
        toast.addEventListener('animationend', () => {
            toast.remove(); // Remove do HTML quando a animação acabar
        });
    }, 3000);
}