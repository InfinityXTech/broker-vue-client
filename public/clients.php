<?php
$json = file_get_contents('data/clients.json');
$clients = json_decode($json, true);
$domain = trim(strtolower($_SERVER['HTTP_HOST'] ?? ''));
foreach ($clients as $client) {
    $client_ui_domain = trim(strtolower((empty($client['ui_domain'] ?? '') ? $client['crm_domain'] ?? '' : $client['ui_domain'] ?? '')));
    $host = parse_url($client_ui_domain, PHP_URL_HOST);

    // if (strpos($domain, 'saas_dev.albertroi.com') !== false) {
    //     $client['api_domain'] = 'https://saas_dev-api.albertroi.com';
    //     $client['crm_domain'] = 'https://saas_dev.albertroi.com';
    // }

    if ($host == $domain) {

        $clientId = (string)$client['_id'];

        $images = [
            'favicon_file' => 'favicon_url',
            'login_background_file' => 'login_background',
            'logo_big_file' => 'logo_url_big',
            'logo_small_file' => 'logo_url_small',
        ];

        $pre_dir = '/images';

        foreach ($images as $image_file => $image_url) {
            $files = (array)($client[$image_file] ?? []);
            if (!empty($files)) {
                $fileId = array_shift($files);
                $image_path = '/images/clients' . $pre_dir . '/' . $clientId . '/' . $image_file . '/';
                $file = glob(__DIR__ . $image_path . '*.*') ?? [];
                if (!empty($file)) {
                    $client[$image_url] = $image_path . basename($file[0]);
                }
            }
        }

        $result = [
            'nickname' =>  $client['nickname'] ?? '',
            'api_domain' => $client['api_domain'] ?? '',
            'crm_domain' => $client_ui_domain,
            'favicon_url' => $client['favicon_url'] ?? '',
            'login_background' => $client['login_background'] ?? '',
            'logo_url_big' => $client['logo_url_big'] ?? '',
            'logo_url_small' => $client['logo_url_small'] ?? '',
        ];
        echo json_encode([$result]);
        exit();
    }
}
echo json_encode([]);
