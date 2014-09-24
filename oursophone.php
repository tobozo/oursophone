<?
session_start();

if(isset($_GET['w'])) {

  $requestedFile     = 'http://'.$_GET['w'];
  $requestedFileHash = md5($requestedFile);

  $urlParts = parse_url($requestedFile);
  
  if($urlParts['host']=='') {
    die('no host found');
  }
  
  $hostParts = explode('.', $urlParts['host']);
  
  switch(count($hostParts)) {
    case 4:
      // CDN
      $ms  = $hostParts[1];
      $dn  = $hostParts[2];
      $tld = $hostParts[3];
    break;
    case 3:
      // CDN
      $ms  = $hostParts[0];
      $dn  = $hostParts[1];
      $tld = $hostParts[2];
    break;
    case 2:
      // DN
      $ms  = false;
      $dn  = $hostParts[0];
      $tld = $hostParts[1];
    break;
    default:
      // TLD
      die('invalid host');
  }
  
  switch($dn.$tld) {
    case 'sndcdncom':
      // SoundCloud CDN
    break;
    default:
      die('invalid cdn');
  }

  $fileExt = strtolower(end(explode('.', $urlParts['path'])));
  
  switch($fileExt) {
    case 'jpg':
    case 'gif':
    case 'png':
      // ok .. 'ish
    break;
    default:
      die('invalid file type');
  };
  
  if(!is_dir('.imgcache/') &&! isset($_SESSION['create-dir-failed'])) {
    // dirty but effective way to suppress warning
    if(!@mkdir('.imgcache/')) {
      // store failure in session_start to avoid spamming error log
      $_SESSION['create-dir-failed'] = true;
    }
  }
  
  if(file_exists('.imgcache/'.$requestedFileHash.'.cache')) {
    echo file_get_contents('.imgcache/'.$requestedFileHash.'.cache');
    exit;
  }
  
  if($ms=='wis') {
    $requestedDatafile = str_replace('http://w1.', 'http://wis.', $requestedFile);
    //$requestedDatafile = str_replace('https://w1.', 'https://wis.', $requestedFile);
    $requestedFileHash = md5($requestedDatafile);
    $fileContent = file_get_contents($requestedDatafile);
    file_put_contents('.imgcache/'.$requestedFileHash.'.cache', $fileContent);
    echo file_get_contents('.imgcache/'.$requestedFileHash.'.cache');    
  } else {
    $fileB64 = base64_encode(file_get_contents($requestedFile));
    file_put_contents('.imgcache/'.$requestedFileHash.'.cache', "data:image/$fileExt;base64,".$fileB64);
    echo file_get_contents('.imgcache/'.$requestedFileHash.'.cache');  
  }
  exit;

}
?><!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>assassine.org</title>
<link rel="stylesheet" type="text/css" href="css/oursophone.css"></link>
<script type="text/javascript" src="./jquery.min.js"></script>
<script type="text/javascript" src="//connect.soundcloud.com/sdk.js"></script>
</head>
<body>
<?

$tplExt = 'tpl';
$templates = glob('templates/*.'.$tplExt);

foreach($templates as $template) {
  $templateId = str_replace('.'.$tplExt, '', basename($template));
  echo '<script type="text/html" id="'.$templateId.'">'."\n";
  echo trim(file_get_contents($template))."\n";
  echo '</script>'."\n";
}
?>
<script type="text/javascript" src="js/oursophone.js"></script>
<script type="text/javascript" src="js/oursophone.route.js"></script>
<script type="text/javascript" src="js/oursophone.template.js"></script>
<script type="text/javascript">

(function(){

    // Initialize the SoundCloud Javascript SDK
    SC.initialize({
      client_id: OursoPhone.config.scClientID
    });

    // release the bear !
    OursoPhone.init();
    
}());

</script>
</body>
</html>