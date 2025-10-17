<?php
// Define o fuso horário para garantir que os logs tenham carimbos de tempo corretos
date_default_timezone_set('America/Sao_Paulo');

// Configura os cabeçalhos para CORS e JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Inicializa a variável para a resposta de erro
$response_data = [];
$http_status_code = 200;

try {
    // 1. Coleta e Limpa o CEP (esperado via GET ou POST)
    $cep = isset($_REQUEST['cep']) ? $_REQUEST['cep'] : '';
    $cep_limpo = preg_replace('/[^0-9]/', '', $cep);

    // 2. Validação Simples
    if (empty($cep_limpo) || strlen($cep_limpo) !== 8) {
        $http_status_code = 400; // Bad Request
        throw new Exception('CEP inválido ou não fornecido: ' . $cep);
    }

    // 3. Monta a URL da ViaCEP
    $url_viacep = "https://viacep.com.br/ws/{$cep_limpo}/json/";

    // 4. Configuração e Execução da Requisição cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url_viacep);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // Configura um timeout para evitar que a requisição trave o servidor
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    // Para ambientes de desenvolvimento, pode ser necessário desabilitar a verificação SSL
    // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 

    $response_viacep = curl_exec($ch);
    
    // Verifica se houve erro de cURL (ex: falha de DNS, timeout de rede)
    if (curl_errno($ch)) {
        $curl_error = curl_error($ch);
        $http_status_code = 500; // Internal Server Error
        curl_close($ch);
        throw new Exception("Erro de cURL na comunicação com a ViaCEP: " . $curl_error);
    }

    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 5. Verifica o status HTTP da ViaCEP
    if ($http_code !== 200) {
        $http_status_code = 500;
        throw new Exception("ViaCEP retornou status HTTP: {$http_code}. CEP: {$cep_limpo}");
    }

    // 6. Decodifica a Resposta
    $data_viacep = json_decode($response_viacep, true);

    // 7. Verifica a Resposta da ViaCEP (CEP não encontrado)
    if (isset($data_viacep['erro']) && $data_viacep['erro'] === true) {
        $http_status_code = 404; // Not Found
        // Não é um erro grave de sistema, apenas CEP não encontrado.
        $response_data = ['erro' => true, 'mensagem' => 'O CEP não foi encontrado.'];
    } else {
        // Sucesso: Retorna os dados
        $response_data = $data_viacep;
    }

} catch (Exception $e) {
    // Se ocorrer uma exceção (throw), registra e prepara a resposta
    $error_message = $e->getMessage();
    
    // Registra o erro no log do PHP
    error_log("ERRO VIA CEP PROXY ({$http_status_code}): {$error_message}");

    // Prepara a resposta de erro para o Frontend
    if (empty($response_data)) {
        $response_data = [
            'erro' => true, 
            'mensagem' => 'Erro interno na busca de CEP. Tente novamente mais tarde.'
        ];
    }
}

// 8. Envia o código de status HTTP e a resposta JSON para o frontend
http_response_code($http_status_code);
echo json_encode($response_data);

?>
