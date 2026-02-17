//script.js
document.addEventListener("DOMContentLoaded", function () {

    // -- Constante de API--
    const API_URL = "https://localhost:3000/clientes"; //json-server endpoint

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

    // -- funções de clientes (apenas na pag principal ) --
    const clientesContainer = document.getElementById("clientes-container");
    const btnBuscar = document.querySelector(".btn-buscar");

    if (clientesContainer) {
        // Função para buscar e exibir os clientes
        async function carregarClientes(filtros = {}) {
            try {
                const params = new URLSearchParams();
                if (filtros.nome) params.append("nome_like", filtros.nome);
                if (filtros.cpf) params.append("cpf_like", filtros.cpf);
                const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
                const resposta = await fetch(url);
                if (!resposta.ok) throw new Error("Erro ao buscar clientes");
                const dados = await resposta.json();
                renderClientes(dados);
            } catch (error) {
                console.error("Erro:", error);
                clientesContainer.innerHTML = `
                    <div class="table-row">
                        <div class="col" style="grid-column: span 5; text-align: center;">
                            Nenhum cliente encontrado.
                            </div></div>`;
            }
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
                        <div class="col" style="grid-column: span 5; text-align: center;">
                            Nenhum cliente encontrado.
                        </div>
                    </div>`;
                return;
            }
            clientesContainer.innerHTML = lista.map(cliente => {
                return `
                    <div class="table-row">
                        <div class="col">${cliente.nome}</div>
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
                if (confirm("CConfirma a exclusão do cliente?")) {
                    try {
                        const resposta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                        if (!resposta.ok) throw new Error("Falha ao excluir");
                        carregarClientes(); // Recarrega a lista após exclusão
                    } catch (error) {
                        console.error("Erro:", error);
                        alert("Erro ao excluir cliente.");
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
                    const cpfCadastroInput = document.getElementById('cpf');
                    const telefoneCadastroInput = document.getElementById('telefone');
                    const dataNascInput = document.getElementById('data-nascimento');
                    if (nomeCompletoInput) nomeCompletoInput.value = cliente.nome || "";
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
                    alert("Falha ao carregar cliente para edição.");
                    console.error("Erro:", error);
                }
            })();
        }

        btnSalvar.addEventListener("click", async () => {
            const nomeCompletoInput = document.getElementById('nome');
            const cpfCadastroInput = document.getElementById('cpf');
            const telefoneCadastroInput = document.getElementById('telefone');
            const dataNascInput = document.getElementById('data-nascimento');

            const nome = (nomeCompletoInput?.value || '').trim();
            const cpf = (cpfCadastroInput?.value || '').trim();
            const telefone = (telefoneCadastroInput?.value || '').trim();
            const data = (dataNascInput?.value || '').trim();

            if (!nome) return alert("O nome é obrigatório.");
            if (!cpf || !validaCPF(cpf)) return alert("CPF inválido");
            if (data && !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return alert("Data deve estar no formato dd/mm/aaaa");

            // converter data para ISO (aaaa-mm-dd) se fornecida
            let dataISO = "";
            if (data) {
                const [d, m, y] = data.split("/");
                dataISO = `${y}-${m}-${d}`;
            }

            const payload = { nome, cpf, telefone, dataNascimento: dataISO };
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
                alert(idExistente ? "Cliente atualizado!" : "Cliente salvo com sucesso!");
                if (!idExistente) {
                    // Limpa os campos para um novo cadastro
                    nomeCompletoInput.value = "";
                    cpfCadastroInput.value = "";
                    telefoneCadastroInput.value = "";
                    dataNascInput.value = "";
                }
            } catch (error) {
                alert("Falha ao salvar cliente. Verifique console");
                console.error("Erro:", error);
            }
        });
    }
});

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