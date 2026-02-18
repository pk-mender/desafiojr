/**
 * 1. CONFIGURAÇÕES E ESTADO GLOBAL
 */
const API_URL = "http://localhost:3000/clientes";
let paginaAtual = 1;
let limitePorPagina = 10;
let totalDeClientes = 0;
let colunaOrdenacao = "nome";
let ordemDirecao = "asc";
let foiSalvo = false; // Controle para o aviso de "dados não salvos"

/**
 * 2. FUNÇÕES DE LISTAGEM (Página Inicial)
 */

async function carregarClientes() {
    const container = document.getElementById("clientes-container");
    if (!container) return;

    container.innerHTML = "⏳ Carregando...";

    try {
        const params = new URLSearchParams();
        params.append("_page", paginaAtual);
        params.append("_limit", limitePorPagina);
        params.append("_sort", colunaOrdenacao);
        params.append("_order", ordemDirecao);

        const filtroNome = document.getElementById("nome")?.value.trim();
        const filtroCpf = document.getElementById("cpf")?.value.trim();
        
        if (filtroNome) params.append("nome_like", filtroNome);
        if (filtroCpf) params.append("cpf", filtroCpf);

        const resposta = await fetch(`${API_URL}?${params.toString()}`);
        totalDeClientes = parseInt(resposta.headers.get("X-Total-Count")) || 0;

        const dados = await resposta.json();
        renderClientes(dados);
        atualizarControlesPaginacao();
        atualizarIconesOrdenacao();
    } catch (error) {
        showToast("Erro ao carregar lista.", "error");
    }
}

function renderClientes(lista) {
    const container = document.getElementById("clientes-container");
    if (!container) return;

    container.innerHTML = lista.length ? lista.map(c => `
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

/**
 * 3. INICIALIZAÇÃO E EVENTOS (DOM CONTENT LOADED)
 */

document.addEventListener("DOMContentLoaded", function () {
    
    // Elementos comuns
    const btnBuscar = document.getElementById("btn-buscar");
    const btnLimpar = document.getElementById("btn-limpar");
    const btnSalvar = document.querySelector(".btn-salvar");
    const containerTabela = document.getElementById("clientes-container");

    // Ativa todas as máscaras de input (independente da página)
    configurarMascaras();

    // --- LÓGICA DA PÁGINA DE LISTAGEM ---
    if (containerTabela) {
        carregarClientes();

        btnBuscar?.addEventListener("click", () => {
            paginaAtual = 1;
            carregarClientes();
        });

        btnLimpar?.addEventListener("click", () => {
            document.getElementById("nome").value = "";
            document.getElementById("cpf").value = "";
            paginaAtual = 1;
            carregarClientes();
        });

        document.getElementById("btn-anterior")?.addEventListener("click", () => {
            if (paginaAtual > 1) { paginaAtual--; carregarClientes(); }
        });

        document.getElementById("btn-proximo")?.addEventListener("click", () => {
            if (paginaAtual < Math.ceil(totalDeClientes / limitePorPagina)) {
                paginaAtual++;
                carregarClientes();
            }
        });

        containerTabela.addEventListener("click", async (e) => {
            const btn = e.target.closest(".btn-excluir");
            if (btn && confirm("Excluir este cliente?")) {
                await fetch(`${API_URL}/${btn.dataset.id}`, { method: "DELETE" });
                carregarClientes();
                showToast("Excluído com sucesso!", "success");
            }
        });
    }

    // --- LÓGICA DA PÁGINA DE CADASTRO/EDIÇÃO ---
    if (btnSalvar) {
        verificarEdicao(); // Verifica se há ID na URL para preencher os campos

        btnSalvar.addEventListener("click", salvarCliente);

        // Aviso de dados não salvos ao fechar a aba
        window.addEventListener('beforeunload', (e) => {
            const temConteudo = document.getElementById('nome')?.value.trim() || document.getElementById('email')?.value.trim();
            if (temConteudo && !foiSalvo) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
});

/**
 * 4. FUNÇÕES DE CADASTRO E VALIDAÇÃO
 */

async function salvarCliente() {
    const idHidden = document.getElementById('cliente-id').value;
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        cpf: document.getElementById('cpf').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        dataNascimento: converterDataParaISO(document.getElementById('data-nascimento').value)
    };

    // Validações básicas
    if (!dados.nome || !validaEmail(dados.email) || !validaCPF(dados.cpf)) {
        return showToast("Preencha os campos corretamente!", "error");
    }

    // Validação de Idade (Mínimo 18 anos)
    if (calcularIdade(document.getElementById('data-nascimento').value) < 18) {
        return showToast("O cliente deve ter pelo menos 18 anos.", "error");
    }

    try {
        const metodo = idHidden ? "PATCH" : "POST";
        const url = idHidden ? `${API_URL}/${idHidden}` : API_URL;

        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            foiSalvo = true;
            showToast("Dados salvos com sucesso!", "success");
            setTimeout(() => window.location.href = "index.html", 1500);
        }
    } catch (e) {
        showToast("Erro ao salvar dados.", "error");
    }
}

// Preenche o formulário se for uma edição
async function verificarEdicao() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
        const res = await fetch(`${API_URL}/${id}`);
        const c = await res.json();
        document.getElementById('cliente-id').value = c.id;
        document.getElementById('nome').value = c.nome;
        document.getElementById('email').value = c.email;
        document.getElementById('cpf').value = c.cpf;
        document.getElementById('telefone').value = c.telefone;
        document.getElementById('data-nascimento').value = formataDataISOparaBR(c.dataNascimento);
        document.querySelector('h1').textContent = "EDITAR CLIENTE";
    }
}

/**
 * 5. MÁSCARAS E UTILITÁRIOS
 */

function configurarMascaras() {
    // --- MÁSCARA DE NOME (Impede números e caracteres especiais) ---
    const nomeInput = document.getElementById("nome");
    if (nomeInput) {
        nomeInput.addEventListener("input", (e) => {
            // Remove tudo que NÃO for letra, espaço, hífen ou apóstrofo
            e.target.value = e.target.value.replace(/[^A-Za-zÀ-ÿ '-]/g, "");
        });
    }

    // --- MÁSCARA CPF ---
    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").substring(0, 11);
            if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
            else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
            e.target.value = v;
        });
    }

    // --- MÁSCARA TELEFONE ---
    const telInput = document.getElementById("telefone");
    if (telInput) {
        telInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").substring(0, 11);
            if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
            else if (v.length > 5) v = v.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");
            else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,4})/, "($1) $2");
            else if (v.length > 0) v = v.replace(/(\d{1,2})/, "($1");
            e.target.value = v;
        });
    }

    // --- MÁSCARA DATA ---
    const dataInput = document.getElementById("data-nascimento");
    if (dataInput) {
        dataInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").substring(0, 8);
            if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
            else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
            e.target.value = v;
        });
    }

    // --- MÁSCARA CEP + BUSCA AUTOMÁTICA ---
    const cepInput = document.getElementById("cep");
    if (cepInput) {
        cepInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").substring(0, 8);
            if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
            e.target.value = v;

            if (v.length === 9) { // 8 números + 1 hífen
                buscarCEP(v.replace("-", ""));
            }
        });
    }
}

async function buscarCEP(val) {
    try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const d = await res.json();
        if (!d.erro) {
            document.getElementById("logradouro").value = d.logradouro;
            document.getElementById("bairro").value = d.bairro;
            document.getElementById("cidade").value = d.localidade;
            document.getElementById("estado").value = d.uf;
            document.getElementById("numero").focus();
        }
    } catch (e) { showToast("CEP não encontrado", "info"); }
}

// --- AJUDANTES DE VALIDAÇÃO ---

function validaEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validaCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    return cpf.length === 11; // Validação simplificada para o exemplo
}

function calcularIdade(dataBR) {
    if (!dataBR) return 0;
    const [d, m, y] = dataBR.split("/").map(Number);
    const hoje = new Date();
    const nasc = new Date(y, m - 1, d);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

function converterDataParaISO(dataBR) {
    const [d, m, y] = dataBR.split("/");
    return `${y}-${m}-${d}`;
}

function formataDataISOparaBR(iso) {
    if (!iso || !iso.includes("-")) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function showToast(msg, tipo) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Ordenação (Chamada pelo onclick no HTML)
function definirOrdenacao(coluna) {
    if (colunaOrdenacao === coluna) {
        ordemDirecao = ordemDirecao === "asc" ? "desc" : "asc";
    } else {
        colunaOrdenacao = coluna;
        ordemDirecao = "asc";
    }
    paginaAtual = 1;
    carregarClientes();
}

function atualizarIconesOrdenacao() {
    const colunas = ["nome", "email", "cpf", "telefone", "dataNascimento"];
    colunas.forEach(c => {
        const el = document.getElementById(`sort-${c}`);
        if (el) el.innerHTML = "";
    });
    const ativo = document.getElementById(`sort-${colunaOrdenacao}`);
    if (ativo) ativo.innerHTML = ordemDirecao === "asc" ? " ▲" : " ▼";
}

function atualizarControlesPaginacao() {
    const info = document.getElementById("info-paginas");
    if (!info) return;
    const totalPaginas = Math.ceil(totalDeClientes / limitePorPagina) || 1;
    info.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalDeClientes} registros)`;
    document.getElementById("btn-anterior").disabled = (paginaAtual === 1);
    document.getElementById("btn-proximo").disabled = (paginaAtual === totalPaginas || totalDeClientes == 0);
}