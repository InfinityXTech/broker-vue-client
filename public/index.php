<?php
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// $etag_file = 'ver_etag.inf';
// $etag = '';
// if (file_exists($etag_file)) {
//     $etag = file_get_contents($etag_file);
// } else {
//     $charsz = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     $etag = substr(str_shuffle($charsz), 0, 10);
//     file_put_contents($etag_file, $etag);
// }
// header('Etag: "'.$etag.'"');

// if(isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
// 	// If HTTP_IF_NONE_MATCH is same as the generated ETag => content is the same as browser cache
// 	// So send a 304 Not Modified response header and exit
// 	if($_SERVER['HTTP_IF_NONE_MATCH'] == $etag) {
// 		header('HTTP/1.1 304 Not Modified', true, 304);
// 		exit();
// 	}
// }

readfile('index.html');