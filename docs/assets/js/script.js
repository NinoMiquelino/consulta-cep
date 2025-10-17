document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção de Elementos
    const cepInput = document.getElementById('cep');
    const btnBuscarCep = document.getElementById('btn-buscar-cep'); // NOVO: Seleção do botão
    const logradouroInput = document.getElementById('logradouro');
    const bairroInput = document.getElementById('bairro');
    const localidadeInput = document.getElementById('localidade');
    const ufInput = document.getElementById('uf');
    
    // Elementos de Feedback e Seleção de Método
    const erroMsg = document.getElementById('erro-msg');
    const loadingIcon = document.getElementById('loading-icon');
    const radioButtons = document.querySelectorAll('input[name="consulta-method"]');


    // Funções de UX (Mantidas)
    const limparCamposEndereco = () => {
        logradouroInput.value = '';
        bairroInput.value = '';
        localidadeInput.value = '';
        ufInput.value = '';
    };

    const exibirErro = (mensagem) => {
        limparCamposEndereco();
        erroMsg.textContent = mensagem;
        erroMsg.style.display = 'block';
        cepInput.classList.add('is-invalid');
    };

    const ocultarErro = () => {
        erroMsg.style.display = 'none';
        cepInput.classList.remove('is-invalid');
    };

    // Lógica de Seleção e URL (Mantida)
    const getTargetUrl = (cepLimpo) => {
        const selectedMethod = document.querySelector('input[name="consulta-method"]:checked').value;
        
        if (selectedMethod === 'js') {
            return `https://viacep.com.br/ws/${cepLimpo}/json/`;
        } else if (selectedMethod === 'php') {
            return `consulta_cep.php?cep=${cepLimpo}`;
        }
        return null;
    };

    // Função Principal que consulta o CEP (Mantida)
    const buscarCEP = async (cep) => {
        ocultarErro();
        limparCamposEndereco();
        loadingIcon.style.display = 'flex'; 
        btnBuscarCep.disabled = true; // Desabilita o botão durante a busca

        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length !== 8) {
            loadingIcon.style.display = 'none';
            btnBuscarCep.disabled = false;
            exibirErro('O CEP deve ter 8 dígitos.');
            return; 
        }

        const url = getTargetUrl(cepLimpo);

        if (!url) {
            loadingIcon.style.display = 'none';
            btnBuscarCep.disabled = false;
            exibirErro('Método de consulta inválido.');
            return;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.erro) {
                const method = document.querySelector('input[name="consulta-method"]:checked').value.toUpperCase();
                const msg = data.mensagem || `CEP não encontrado ou erro na comunicação ${method}.`;
                exibirErro(msg);
                return;
            }

            // Preenche os campos
            logradouroInput.value = data.logradouro;
            bairroInput.value = data.bairro;
            localidadeInput.value = data.localidade;
            ufInput.value = data.uf;
            
            /*document.getElementById('numero').focus();*/

        } catch (error) {
            console.error('Erro ao buscar o CEP:', error);
            exibirErro('Erro de rede ou servidor. Verifique a console.');
        } finally {
            loadingIcon.style.display = 'none'; 
            btnBuscarCep.disabled = false; // Habilita o botão ao finalizar
        }
    };

    // 3. NOVO EVENT LISTENER: Acionamento pelo botão
    btnBuscarCep.addEventListener('click', () => {
        const cep = cepInput.value;
        buscarCEP(cep);
    });
    
    // Opcional: Acionar busca ao pressionar ENTER no campo CEP
    cepInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Impede o envio padrão do formulário
            buscarCEP(cepInput.value);
        }
    });


    // Outros Event Listeners (ajustados para incluir o acionamento do botão)
    cepInput.addEventListener('input', (event) => {
        // Máscara 99999-999 (Mantida)
        let value = event.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        event.target.value = value;
        
        if (cepInput.classList.contains('is-invalid')) {
            ocultarErro();
        }
    });
    
    // Opcional: Limpar campos ao trocar o método de consulta (Mantido)
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            ocultarErro();
            limparCamposEndereco();
            cepInput.value = ''; 
        });
    });
});
