// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- VALIDADORES E MÁSCARAS ---

    // Validador para o campo de nome na página principal
    const nomeInput = document.getElementById('nome');
    if (nomeInput) {
        nomeInput.addEventListener('input', (event) => {
            const input = event.target;
            // A expressão regular [^a-zA-Z\sáéíóúâêîôûàèìòùãõçÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃÕÇ] significa:
            // ^ -> "não" (negação)
            // a-zA-Z -> todas as letras de a a z, maiúsculas e minúsculas
            // \s -> espaços em branco
            // áéíóú... -> caracteres acentuados
            input.value = input.value.replace(/[^a-zA-Z\sáéíóúâêîôûàèìòùãõçÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃÕÇ]/g, '');
        });
    }

    // Máscara e Validador de CPF para qualquer campo com id 'cpf'
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        // Aplica a máscara enquanto o usuário digita
        cpfInput.addEventListener('input', (event) => {
            const input = event.target;
            let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
            value = value.substring(0, 11); // Limita a 11 dígitos

            if (value.length > 9) {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            } else if (value.length > 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
            } else if (value.length > 3) {
                value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
            }

            input.value = value;
        });

        // Valida o CPF quando o usuário sai do campo
        cpfInput.addEventListener('blur', (event) => {
            const input = event.target;
            if (input.value.length > 0 && !validaCPF(input.value)) {
                alert('CPF inválido!');
                input.classList.add('invalid-input');
            } else {
                input.classList.remove('invalid-input');
            }
        });
    }
});

/**
 * Valida um CPF brasileiro.
 * @param {string} cpfString - O CPF a ser validado, pode estar formatado.
 * @returns {boolean} - Retorna true se o CPF for válido, false caso contrário.
 */
function validaCPF(cpfString) {
    const cpf = cpfString.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;
    let resto;

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) {
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
    if ((resto === 10) || (resto === 11)) {
        resto = 0;
    }
    if (resto !== parseInt(cpf.substring(10, 11))) {
        return false;
    }

    return true;
}