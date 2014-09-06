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
<style type="text/css">
* {
  margin: 0;    
  padding: 0;
}
body {
  background-color: #000000;
}

.locked {
  -webkit-user-select: none; /* webkit (safari, chrome) browsers */
  -moz-user-select: none; /* mozilla browsers */
  -khtml-user-select: none; /* webkit (konqueror) browsers */
  -ms-user-select: none; /* IE10+ */
}
.locked:after {
    background-color: white;
    content: " ";
    height: 100%;
    left: 0;
    opacity: 0.2;
    position: fixed;
    top: 0;
    width: 100%;
}

section {
  display: block;
  font-family: Arial;
  font-size: 1em;
}
div {
  margin: 5px;
}
a {
  text-decoration: none;
  color: #880000;
}
a:hover {
  /*text-decoration: underline;*/
}
#soundcloud {
  display: none;
}
#player {
  position:absolute;
  min-width:600px;
  width: 100%;
  height: 100%;
  overflow: auto;
}

header, #playlist {
    float: left;
    width: 50%;
    min-width: 300px;
}

.track, .album {
    display: inline-block;
    margin: 5px;
    position: relative;
}

[data-display-mode="list"] .track {
    display:block;
    height:28px;
    margin:0;
}
[data-display-mode="list"] .track-picture, [data-display-mode="list"] .track-nopicture {
  display: block;
  width: 25px;
  height: 25px;
  border:1px solid white;
  margin:1px;
  position:absolute;
  -webkit-transition: all 0.3s linear;
          transition: all 0.3s linear;
}
[data-display-mode="list"] .track-title {
  padding-left:31px;
  margin:0;
}
/*
[data-display-mode="list"] .track-title:after {
  content:" ";
  clear:both;
}*/

[data-display-mode="list"] .track-titlespan {
    color: white;
    display: block;
    font-size: 12px;
    height: 28px;
    line-height: 28px;
    text-align: left;
    padding-right: 5em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

[data-display-mode="list"] .track-duration {
    color: #8d8d8d;
    display: inline-block;
    font-size: 13px;
    line-height: 28px;
    position: absolute;
    right: 1em;
    top: 0;
}

[data-display-mode="thumb"] .sound {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
  text-align: center;
  background-color: #DDDDDD;
  text-decoration: none;
  margin: 0;
  padding: 0;
  line-height: 100px;
  vertical-align: middle;
}

[data-display-mode="thumb"] .track-picture {
  display: block;
  width: 100px;
  height: 100px;
  border:5px solid white;
  -webkit-transition: all 0.3s linear;
          transition: all 0.3s linear;
}
[data-display-mode="thumb"] .track-nopicture {
  display: block;
  width: 100px;
  height: 100px;
  background-color: #000000;
  border: 5px dashed rgba(0, 128, 0, 0.5)
}

[data-display-mode="thumb"] .track-title {
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 1);
  text-shadow:0 0 0 #fff;
  width: 110px;
  height: 110px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  font-size: .9em;
  line-height: 10px;
  color: #000000;
  opacity:0.5;
  line-height: 100px;
  vertical-align: top;
  -webkit-transition:all 0.3s ease;
          transition:all 0.3s ease;
}
.track-titlespan {
  display: inline-block;
  text-align: center;
  line-height: 15px;
  vertical-align: middle;
}


.album-picture {
  display: block;
  width: 200px;
  height: 200px;
}
.album-nopicture {
  display: block;
  width: 200px;
  height: 200px;
  background-color: #000000;
}

.album-title {
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 1);
  text-shadow:0 0 0 #fff;
  width: 200px;
  height: 200px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  font-size: .9em;
  font-weight: bold;
  line-height: 10px;
  color: #000000;
  opacity:0.5;
  line-height: 100px;
  vertical-align: top;
  -webkit-transition:all 0.3s ease;
          transition:all 0.3s ease;
}
.album-titlespan, .album-descspan {
  display: inline-block;
  text-align: center;
  line-height: 15px;
  vertical-align: middle;
  -webkit-transform: translate(0, 0%);
      -ms-transform: translate(0, 0%);
          transform: translate(0, 0%);
  font-size:1em;
}


.track-createdat,
.track-taglist,
.track-genre,
.track-description,
.track-tracktype,
.track-permalinkurl {
  display:none;
}


.track-titlespan {
    
}

.full-view {

}

.full-view span {
    text-align:left;
}

.full-view .track-titlespan:before {
    /*content:"Track title: ";*/
}

.full-view .track-createdat:before {
    content:"Created: ";
}
.full-view .track-createdat {
    font-size:10px;
}

.full-view .track-duration {
    font-size:10px;
}

.full-view .track-duration:before {
    content: "Track Duration: ";
}

.full-view .track-genre {
    font-size:10px;
}

.full-view .track-genre:before {
    content: "Genre: ";
}

.full-view img.track-picture {
    border: medium none;
    float: left;
    outline: medium none;
}

#track-description {
    background-color:white;
}

#track-description a {
    display: none;
}
#track-description a img {
    float:left;
    border: 5px solid #000;
    -webkit-transition: all 0.3s linear 0s;
            transition: all 0.3s linear 0s;
    width: auto;
    height: auto;
}

#track-description .track-title {
    display: block;
    position: relative;
    width: auto;
    height:auto;
    padding-left:100px;
    margin:0;
}
#track-description .track-title span {
    display: block;
    height: auto;
    line-height: 1.2em;
    font-size: 12px;
    background:white;
    padding:0.3em;
}

#track-description .track-title span.track-titlespan {
    font-weight:bold;
    text-align:center;
    padding: 0.5em 0;
}





/*.album_kind,*/
/*.album_id,*/
.album-createdat,
.album-duration,
.album-taglist,
.album-trackcount,
.album-genre {
  display:none;
}


.album-duration {
    font-size:10px;
}

.album-duration:before {
    content: "Total Duration: ";
}

.album-createdat {
    font-size:10px;
}

.album-createdat:before {
    content: "Created: ";
}

.album-trackcount {
    font-size:10px;
}

.album-trackcount:before {
    content: "Tracks: ";
}

.album-genre {
    font-size:10px;
}

.album-genre:before {
    content: "Genre: ";
}


tag:hover {
    text-decoration: none;
    -webkit-transform: scale(1.2,1.2);
        -ms-transform: scale(1.2,1.2);
            transform: scale(1.2,1.2);
    background: black;
    color: white;
}

tag:before {
    content: "⚫";
    font-size: 0.83em;
    margin: inherit;
}
tag {
    display: inline-block;
    font-size: 10px;
    line-height: 1.2em;
    margin: auto 0.14em;
    cursor: pointer;
    -webkit-transition:all 0.3s ease;
            transition:all 0.3s ease;
}


#user-description {
    display:block;
    max-height:150px;
    overflow:auto;
}

.user-stats {
    text-align: left;
}

.user-stats span {
    display: inline-block;
}
            
.user-id, .user-kind {
  display:none;
}
.user-avatarurl {
  display:block;
  float:left;
  width:50px;
}
.user-fullname {
  text-align:left;
  display:block;
}
.user-description {
    display: block;
    font-size: 12px;
    font-weight: normal;
    text-align: left;
}

.user-permalinkurl {
    color:white;
    text-decoration:underline;
}
.user-permalinkurl:hover {
    text-decoration:none;
}

.user-trackcount,
.user-playlistcount,
.user-followerscount,
.user-followingcount {
  font-size:12px;
  line-height:13px;
  font-weight:normal;
}

.user-website,
.user-websitetitle{
  display:block;
}






#trackback {
  position: relative;
  display: inline-block;
  width: 110px;
  height: 110px;
  background-color: #DDDDDD;
  padding: 0;
  margin: 5px;
  vertical-align: top;
}
#goback {
  display: inline-block;
  width: 100%;
  height: 100%;
  line-height: 110px;
  vertical-align: middle;
  text-align: center;
  font-size: 3em;
}
#player-header {
  display: block;
  position:relative;
  width: 50%;
  background-color: #222222;
  color: #fff;
  overflow: auto;
  text-align: center;
}
.player-button {
    color: #ff0000;
    cursor: pointer;
    display: inline-block;
    float: left;
    font-weight: bold;
    margin: 0;
    width: 25%;
}
#player-infos {
  display: block;
  text-align: center;
  background-color: #444444;
  height:26px;
}

marquee {
  line-height: 26px;
}

#player-description {
  display: block;
  padding-top: 15px;
  margin-top:120px;
}
#playlist {
  display: block;
  width: auto;
  overflow: auto;
  margin:0;
  margin-top:25px;
  width:50%;
  -webkit-transition:all 0.3s ease;
          transition:all 0.3s ease;
  max-height:100%;
  max-height:100vh;
  max-height:calc(100vh - 25px);
}


#playlist[data-album-id] .album {
    display: block;
    height:auto;
}
#playlist[data-album-id] .album .album-picture {
    float:left;
}
#playlist[data-album-id] .album .album-title {
    position: relative;
    width: auto;
    overflow:auto;
}
#playlist[data-album-id] .album .album-title .album-descspan {
    font-size: 12px;
    font-weight: normal;
    line-height: 1.2em;
    margin: 1em;
    padding: 0.3em;
    text-align: left;
}

#playlist[data-album-id] .album albumbox {
    cursor:default;
}

#playlist[data-album-id] .album albumbox div span {
    display:block;
    line-height:1.2em;
    cursor:default;
    opacity:1;

}


trackbox, albumbox {
  color: #880000
}

#playlist[data-album-id] albumbox:hover .album-title .album-descspan, 
#playlist[data-album-id] albumbox.active .album-title .album-descspan,
#playlist[data-album-id] trackbox.active .track-title .track_descspan,
#playlist[data-album-id] trackbox:hover .track-title .track_descspan
{
  -webkit-transition: all 0.3s linear;
          transition: all 0.3s linear;
  -webkit-animation: none;
          animation: none;
}


.comment-text {
    color: white;
    vertical-align: middle;
    font-size: 12px;
    margin: 0 0.5em;
}



#comments {
    display: block;
    max-height: 4em;
    overflow-y: hidden;
    position: relative;
    width: 100%;
    text-align: left;
}

#comments li:after {
    clear: both;
    content: " ";
    display: block;
}


#hello {
  display: none;
}
.player-click {
    display: block;
    font-size: 2.25vw;
    line-height: 5vw;
    margin: 0.25vw;
    text-align: center;
    vertical-align: middle;
}


#controls {
  position:relative;
}

#controls [data-action="play"] span {
  background-color: #bbb;
}
#controls [data-action="pause"] span {
  background-color: #eee;
}

#controls.playing [data-action="play"] span {
  opacity:0.2;
}
#controls.playing [data-action="pause"] span {
  background-color: #bbb;
}

#controls.paused [data-action="pause"] span {
  opacity:0.2;
}


.volume-control {
  height:24px;
  line-height:24px;
  font-size:1em;
  padding-left: 80px;
  clear:both;
}
.volume-control label {
  font-size: 2em;
  line-height: 24px;
  cursor:pointer;
  -webkit-user-select: none; /* webkit (safari, chrome) browsers */
  -moz-user-select: none; /* mozilla browsers */
  -khtml-user-select: none; /* webkit (konqueror) browsers */
  -ms-user-select: none; /* IE10+ */
}

.search-button {
  width:1em;
  height:1em;
  line-height:1.2em;
  color:white;
  cursor:pointer;
  position:absolute;
  right:0;
}


canvas#waveform {
  width:600px;
  height:100px;
  position:absolute;
  left:15px;
  cursor:crosshair;
  -webkit-transition: all 0.5s linear 0s
  display:none;
          transition: all 0.5s linear 0s
  display:none;
}



#canvas-overlay {
    margin:0;
    margin-left:15px;
    position: relative;
    width: calc( 100% -15px);
    cursor:crosshair;
    -webkit-transition: all 0.5s linear 0s;
            transition: all 0.5s linear 0s
}

.waveform-img {
    width: 100%;
    height: 100%;
    display:block;
    max-height: 100px;
}


trackbox:hover .track-title, 
trackbox.active .track-title,
albumbox.active .album-title,
albumbox:hover .album-title
{
  opacity:1;
  background-color: rgba(255, 255, 255, 0.3);
  text-shadow:0 0 3px #fff;
}

albumbox:hover .album-title .album-descspan, 
albumbox.active .album-title .album-descspan,
trackbox.active .track-title .track_descspan,
trackbox:hover .track-title .track_descspan
{
  -webkit-transition: all 0.3s linear;
          transition: all 0.3s linear;
  -webkit-animation: scroller 1s forwards;
          animation: scroller 1s forwards;
}


#playlist[data-display-mode="list"] {
  width:50%;
}

#playlist[data-display-mode="thumb"] trackbox.active .track-picture 
{
  border:5px dotted #000;
  -webkit-transition: all 0.3s linear;
          transition: all 0.3s linear;
  /*animation: borderswitcher 1s infinite;*/
}


@-webkit-keyframes scroller {
  0% { font-size:1em; -webkit-transform: translate(0, 0%); transform: translate(0, 0%); color:rgb(0,128,0); }
  50% { font-size:20em; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); color:rgb(128,0,255); }
  100% { font-size:1em; -webkit-transform: translate(0, 0%); transform: translate(0, 0%); color:rgb(0,0,0); }
}


@keyframes scroller {
  0% { font-size:1em; -webkit-transform: translate(0, 0%); transform: translate(0, 0%); color:rgb(0,128,0); }
  50% { font-size:20em; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); color:rgb(128,0,255); }
  100% { font-size:1em; -webkit-transform: translate(0, 0%); transform: translate(0, 0%); color:rgb(0,0,0); }
}

@-webkit-keyframes borderswitcher {
  0% { border-color:#0f0; }
  50% { border-color:#f00; }
  100% { border-color:#00f; }
}

@keyframes borderswitcher {
  0% { border-color:#0f0; }
  50% { border-color:#f00; }
  100% { border-color:#00f; }
}


#animbox {
    position: absolute;
    width: 10px;
    z-index: 100000;
    left: 0;
    background-color:rgb(255,255,255);
    -webkit-transition: all 0.1s ease;
            transition: all 0.1s ease;
    margin:0;
}

.waveform-holder {
    position: relative;
    width: auto;
}



#player-state {
    background-color: black;
    background-position: left center;
    background-repeat: no-repeat;
    background-size: contain;
    height: 16px;
    padding-right: 60px;
    position: absolute;
    width: 16px;
    border: 2px solid #888;
    border-radius: 16px;
    margin: 3px;
    left:0;
    bottom:0;
}

#player-state:after {
    content: "- " attr(data-state) " -";
    white-space:nowrap;
    font-size: 10px;
    left: 20px;
    position: absolute;
    width: 60px;
}

#player-state.playing {
  background-image:url("data:image/gif;base64,R0lGODlhMAAnAIABAP///////yH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3MjA5MUZCRDU4OEJFMjExQkU0MUIxQ0RFNDI2RkEwQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4MzI1NjFCQzhCNjAxMUUyOEYxM0ExN0FENjgxN0VGQiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MzI1NjFCQjhCNjAxMUUyOEYxM0ExN0FENjgxN0VGQiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjczMDkxRkJENTg4QkUyMTFCRTQxQjFDREU0MjZGQTBCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjcyMDkxRkJENTg4QkUyMTFCRTQxQjFDREU0MjZGQTBCIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkECR4AAQAsAAAAADAAJwAAAnKEf6HL7Q8XmrHaONHdvPsPhuIIZgnpmQaaquwLx/LMqsBnb3lr6i6foQmHROFOcQwkMT9kU/lk9iTPZfGKzVaS3CikO3WGt9XyWItOY8FB6tjGprjbYri8foe+veq+/xKnMZdnt2dIp1d4gifIuJg4UQAAIfkEBR4AAQAsAAAAADAAJwAAAmCMj6nL7Q+jnLTai7PevPsPhuJIlhOApmmltlGrsjD6zoA8m/rOnzYOq+UothukCHT1lswl8vA0RB3T6u94lWYD06b3+7EOtWPqVhzEltFKsPuNYceg52J9fbe3ufl9sQAAIfkECR4AAQAsAAAAADAAIQAAAjuEf6HL7Q8XmrHaONHdvPsPhuIIZgnpmQaaquwLx/JM1/aN5/rOhyrQ+wVdvaLxiEwql8ym8yLkRXe/AgAh+QQFHgABACwAAAAAMAAnAAACRoyPqcvtD6OctNqLs968+w+G4kiW5omm6sq27gvH8kwbwI3jSM57fL773XxCQFBYS8aKRgrzyPxVnodocXqtZpXcrvebKQAAOw==");
}
#player-state.paused {
  background-image:url("data:image/png;base64,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");
}
#player-state.loading {
  background-image:url("data:image/gif;base64,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");
}

.user-followerscount:before {
  content:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAA+VBMVEUAAABEREBEREBEREBEREBEREBEREBEREBEREBEREB1dXVycnJubm1ra2pPT0xzc3JycnKAgIBycnJzc3N3d3ZwcG9zc3NycnJubm5sbGtvb29zc3OAgIBzc3NqampeXl1tbW1ycnJtbW1zc3N3d3d0dHRqamlqamlzc3N3d3djY2Jzc3N0dHRycnJubm5tbWxoaGdycnFzc3NqampycnJzc3Nzc3N1dXVubm1tbW1tbW1xcXFtbW1zc3NycnJycnJycnJtbWxqamlycnJzc3Nzc3N0dHRzc3Nqampzc3Nzc3NycnJubm5wcHBzc3Nubm5tbW1ycnJzc3Nvas0aAAAAT3RSTlMAAQkKAhIUAxofMt7wsiXaUwJVNQf5fqU3Ov6tBPyOQdyhlvAe6pOT/Q8J22On/elratwMXPm2JQv94FIH8XtO/rWij9r+gPOQidfE+ldUMwZRkQAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAALpJREFUGNNtT8eWwkAMMykkofcFlt47S2fpNXQm4///GAxzgAM+6FlPtp4E8H1skizZPrii2lVFKC/UdEPXhCIROJwut0dwTZUJvcxiPvAHgnRpp4tQ2GI8Aj+IUd1QySMWZxx/E0nkqXQmSx9yjmO+AEXOSmVeqQJItTo2INFstf862O2RR3+Aw9E49T+ZzuYLgGURaVbrDTltd3sTDk/OmXXkiIcTnuEi+PVmmuZdJP1oorySvps+twf7WRx89JujJQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNC0wMi0wNVQxMTo1NTo0OC0wNjowMLtFtIEAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTQtMDItMDVUMTE6NTU6NDgtMDY6MDDKGAw9AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAABJRU5ErkJggg==");
}

.user-trackcount:before {
  content:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaElEQVR4XsVTy2rCUBA9iVGxgW58dOdrL679iHyAKz9QuukXuHMhblUQycPXom5EIYmPpPcMelsolNIuHDjM3DmZMzM3iZGmKf5jpsJjBQzHcd5KpZJzvV6RJAl+4XUcx/GrdT6fc6ZpolgsQt0Hk8hms2Dua8HlchGo58Xvdjvs9/ucdTqdUqoVCgXQbNuGYRjIZDKMdfHxeMThcNBNttstfWoqAURRBN/30Ww2UavV0Ol0MJ/PMZ1O4bouZrMZ2u228NVqFYvFAmEYipBJlbtivV4XolKpyPie52G5XIJNGo2GcK1WC6vVCrfGMgHHlL3H4zG63a74IAg4uhRtNhuMRiP0ej0Mh0Ouq+/D4gQ8MDkYDDCZTLBer5HP5ylKcdm73++TZ3cKiLAIsFiJ6FtnNxYQzCueMTlOpTkKMGepPcpqVxIad2P83Wvj23rhBE+3A/GjgMYnbxsAnhXKf/isE4X3x/+NHy64UbT68ZI0AAAAAElFTkSuQmCC");
}

.user-playlistcount:before {
  content:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABIAAAASABGyWs+AAACLklEQVQ4y8WTz0uUYRDHvzPv876u7ua6bRq6mT+o1BShyAzLS4cKqmNQJ4/RrWPdunaqS0S3OnnsFBYUWBpBRiWCmYW65m7rj5XcXd133/d9numwrvkHBA7MDAwMfPjOd4C9Drr4sBZbboEGj19p2B+LhTgcSKowk03P/olHwpEadkgsB/iXRB5vbqa92aVqrhHlqCrkkQtd7bn5qL2+e8CVvPty/smdsyc7h3qbz50GiQYBxAARAIL6lns7fm/y9o2uKBXVLhoDkCYiA0AAkvIMhsqwlaoBMpUlpU0AAoLpzIexdX9p2diuv+omk4u/U5/ShdkCKxhWwE7axGt+cqquCoFAoBQ7MIB9pvXytaMNJwa39Iaf3UxNtXSeutTXdqEfkIpcFQh8WX/RNLzw/EFjiHyljQ8Ggqn0+Ei2tJTUqugtu/M/MqnVd+nCzyxbMKQAtgjlDitT+v51h4DZggB8cF9L26FoR7eHQimiYrHautZER0NfO7Fo4rKIYICYLMkHK8UATCAoKnNxNHTgcLy6qaMoObfKCkfj4cZEInqkDQS9rf7OFda8hV++AQOA8nQJDJRezTy7H1+pf0rVnp7LfZ74OD9WGJ0bTrANwzZgOQS2Acsm3kJ2MRFBSSBQtuXAAM75Y9dvtdf3DLiSd0f047v9PV1Dvc2DfSApE2z7gAjW9Mbo+zeTE6/rdvvAiGEjmo1oFggZMWREMyAClF2xfQTLwPB/s/Je/yLwF/4P/UCgMPkdAAAAInpUWHRTb2Z0d2FyZQAAeNorLy/Xy8zLLk5OLEjVyy9KBwA22AZYEFPKXAAAAABJRU5ErkJggg==");
}

.user-followingcount:before {
  content:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAABDlBMVEUAAABEREBEREBEREB5eXl5eXhubm5EREB1dXR5eXl4eHhvb25gYF5EREB3d3d4eHh6enpEREB1dXVsbGt4eHh5eXl5eXlEREBEREB5eXl1dXR4eHh5eXlzc3J2dnZ5eXliYmFEREB0dHN4eHhwcHBsbGtgYF51dXV5eXl4eHh5eXl4eHhwcG82a5tcZWp0dHN5eXkzdLM0dbM0dLE2bqM3baE2cKY0c7EwcK95eXk0dbI0drIxebZ6eno0dLA0dbIudLl4eHh5eXk3aps3bJ03baA0dLA0dbI1dbI0dbIrgKqAgIB4eHhvb29MTEk1drMzgLN4eHh0dHNzc3J5eXl5eXg0dLA2cKY2b6Q0dbJQLuNyAAAAUXRSTlMAAQkK2fhSFLB0gJtCGmWQQwIYfMuvqQMSV3LY6Jpw+Dof07iTcxf8zyJlyp6ZSkuHhru8wsPyxhBZt84VWLi8C1WGfaWkmpnpwAwEERQhggq7x0TgAAAACXBIWXMAAABIAAAASABGyWs+AAAAxUlEQVQY02NgwA4YmZiZGBFcFlY2dg5WTrAMWICLm4eXj18AyBJkAhJCgUHBwiKiISFiDOISzEAByaDgIClpoICMOC87UAWjbHBQoBxQQD5QQVECaAaTUlBgCEhAWUWVVxCoQ009MERDk0FLW0dXTxxkhX5oSIiBoZGxiamZuQVIwDIEKGAVFh4RHhZpbQMUsAUJ2IH5kfYOQAFHoICTs4urm7uHpxfIpd4+Pr5+irxA8/wDIC5lEJRglxBkgLCYUXwKYgEAPNweNeJGQJQAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTMtMTAtMzFUMTE6Mzk6MjAtMDU6MDBdWGK2AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDEzLTEwLTMxVDExOjM5OjIwLTA1OjAwLAXaCgAAAABJRU5ErkJggg==");
}


.display-mode-box {
    margin-top: -50px;
    z-index: 1000000;
    position: absolute;
    background: black;
    border-radius:8px;
    opacity: 0.8;
    -webkit-transition:all 0.3s ease;
            transition:all 0.3s ease;
    -webkit-transform:scale(1, 0.5);
        -ms-transform:scale(1, 0.5);
            transform:scale(1, 0.5);
    -webkit-transform-origin:bottom left;
        -ms-transform-origin:bottom left;
            transform-origin:bottom left;
}

.display-mode-box:hover {
    opacity:1;
    border-radius:4px;
    -webkit-transform:scale(1,1);
        -ms-transform:scale(1,1);
            transform:scale(1,1);
}

.display-mode-box:after {
  content:" ";
  display:block;
  clear:both;
}

.display-mode-box div {
    background-position: center center;
    background-repeat: no-repeat;
    border: 4px solid rgba(50, 50, 50, 1);
    outline:0px dotted rgba(50, 50, 50, 0);
    background-color:rgba(255,255,255,0);
    border-radius: 5px;
    float: left;
    height: 24px;
    margin: 4px;
    padding: 4px;
    width: 24px;
    cursor:pointer;
    -webkit-transition:all 0.3s ease;
            transition:all 0.3s ease;
}

.display-mode-box div.display-mode-up {
    margin-right:1em;
}

.display-mode-box div:hover {
    border:4px solid rgba(50, 50, 50, 0);
    outline:4px solid rgba(70, 70, 70, 1);
    background-color:rgba(255,255,255,0.4);
}

[data-display-mode="thumb"] .display-mode-thumb, 
[data-display-mode="list"] .display-mode-list,
.display-mode-box div.active {
    background-color:rgba(0, 0, 128, 1)
}

.display-mode-list {
  background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAVCAYAAABc6S4mAAAABmJLR0QA/wD/AP+gvaeTAAAAV0lEQVQ4jWP08/PvYmBgTGFkZJy1ceP6CgYo8PML+M9ABcDEwMCYycDAIPj///8sahiIxYL/0xkYGH4yMjJOo4UFo4AgYBxNRaOAYjCaikYB5WA0FREEAEtxN+kFsxtoAAAAAElFTkSuQmCC");
}

.display-mode-thumb {
  background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAD9JREFUeNpidHFx+c9AHGBE4xOlj4mBxmDUglELRi0A5s7///FnSFdX19E4oC1gAYbxaGk6asGoBUPdAoAAAwBvHAmW1CyoVgAAAABJRU5ErkJggg==");
}

.display-mode-up {
  margin-left:1em;
  background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABkUlEQVRIie3Ry07CQBTG8W8KhHj3EVwx5REKrhq3TOFRQEV3bvEOz2FCmmkC8bL1FbDDyp2wdUcIPS6gpEDLTXZ6lp0z/1+TiWGFsazCZSrFs+22el/2TmzZRSHy1wCuGGMnup7eUsp92xgwipcDn44517eXQRYCQlg3ACuHHGU55ztKqde1Acsq3AI4j95gC5FIQIj8HYCzeT/gI7qe3lXKDUVCgVH8dHF8PBnO9T2l3JeFgBD5+xXjQWR/GpkAcrnCA2MorRH3x5hGxsAwTsVfxMdIKpU+aLfdZx9gQuQfGcMm4gAAxmBwrh8q5T4zyypUiOhizv4ngKM1zkBEFY2IvgBQxE4L8LJRgXhcyxDhI6rPGOtoUto1otCHbQGemUwmu1FAvV7vDAYJMwQhAEUp7ZoGAI5jV4km3qAFeKaUMjLuT6Px1BkMEubwzqhOKElp1wBA8z8GkKXjQQTwTAAtIhQdx676Z1pw0XHsar/fM1aJ+yOl7Pb7PSMYnwEAoNlsfq8an3d3Btj0/AN/APgB2DyuJh85tTcAAAAASUVORK5CYII=");
}


</style>
<script type="text/javascript" src="./jquery.min.js"></script>
<!-- script type="text/javascript" src="https://w.soundcloud.com/player/api.js"></script -->
<script type="text/javascript" src="http://connect.soundcloud.com/sdk.js"></script>
</head>
<body>
<section id="player">
  <header id="player-header">
    <div class="waveform-holder">
      <div id="animbox"></div>
      <div id="canvas-overlay"></div>
    </div>
    <div id="controls">
      <div class="search-button" title="Marre de GarD?">🔍</div>
      <div class="player-button" href="#a:0:b:0" data-action="backward" data-index="0"><span class="player-click">&lt;&lt;</span></div>
      <div class="player-button" href="#" data-action="play"><span class="player-click">play</span></div>
      <div class="player-button" href="#" data-action="pause"><span class="player-click">pause</span></div>
      <div class="player-button" href="#a:0:b:1" data-action="forward" data-index="0"><span class="player-click">&gt;&gt;</span></div>
      <div class="volume-control">
        <label>-</label>
        <input type="range" data-action="setvolume" min="0" max="1" step="0.1" />
        <label>+</label>
      </div>
      <div id="player-state"></div>
    </div>
    <div id="user-description"></div>
    <div id="track-description"></div>
    <ol id="comments"></ol>
  </header>
  <div id="playlist" data-display-mode="thumb"></div>
</section>
    
<script type="text/html" id="album-item">
  <div class="album">
    <albumbox data-href="{album-url}" class="sound" 
      data-index="{album-index}" 
      data-url="{album-url}">
      {album-picture}
      <div class="album-title" data-kind="{album-kind}">
        <span class="album-titlespan">{album-title}</span>
        <span class="album-descspan">{album-description}</span>
        <span class="album-genre">{album-genre}</span>
        <span class="album-trackcount">{album-trackcount}</span>
        <span class="album-duration">{album-duration}</span>
        <span class="album-createdat">{album-createdat}</span>
        <span class="album-taglist">{album-taglist}</span>
      </div>
    </albumbox>
  </div>
</script>

<script type="text/html" id="track-item">
  <div class="track">
    <trackbox data-href="{album-url}" class="sound" {data-attributes} data-index="{data-index}">
      {track-picture}
      <div class="track-title">
        <span class="track-titlespan">{track-title}</span>
        <span class="track-description">{track-description}</span>
        <a class="track-permalinkurl" target="_blank" href="{track-permalinkurl}">permalink</a>
        <span class="track-genre">{track-genre}</span>
        <span class="track-duration">{track-duration}</span>
        <span class="track-createdat">{track-createdat}</span>
        <span class="track-taglist">{track-taglist}</span>
        <span class="track-tracktype">{track-tracktype}</span>
      </div>
    </trackbox>
  </div>
</script>

<script type="text/html" id="user-item">
  <div class="user">
    <img class="user-avatarurl" src="{user-avatarurl}" />
    <span class="user-id">{user-id}</span>
    <span class="user-kind">{user-kind}</span>
    <div class="user-stats">
      <span class="user-fullname"><a target="_blank" class="user-permalinkurl" href="{user-permalinkurl}">{user-fullname}</a></span>
     (
       <span class="user-trackcount" title="tracks">{user-trackcount}</span>
       <span class="user-playlistcount" title="playlists">{user-playlistcount}</span>
       <span class="user-followerscount" title="followers">{user-followerscount}</span>
       <span class="user-followingcount" title="following">{user-followingcount}</span>
      )
    </div>
    <span class="user-description">{user-description}</span>
    <span class"user-website"><a class="user-websitetitle" target="_blank" href="{user-website}">{user-websitetitle}</a></span>
  </div>
</script>

<script type="text/html" id="album-goback">
  <div id="trackback"><a href="#" id="goback">&lt;--</a></div>
</script>
<script type="text/html" id="album-picture">
  <img class="album-picture" src="{album-cover}" />
</script>
<script type="text/html" id="album-no-picture">
  <span class="album-nopicture"></span>
</script>
<script type="text/html" id="track-picture">
  <img class="track-picture" src="{track-artwork-url}" title="{track-title}" />
</script>
<script type="text/html" id="track-no-picture">
  <span class="track-nopicture"></span>
</script>
<script type="text/html" id="view-mode-control">
  <div class="display-mode-box">
    <div class="display-mode-up" title="Back to Album list"></div>
    <div class="display-mode-thumb" title="Display as thumbnails"></div>
    <div class="display-mode-list" title="Display as list"></div>
  </div>
</script>
    
<script type="text/javascript">


    var Route = {
      // default : load playlist from user profile
      default: function(args) {
        // not arguments given, show albums. TODO : play first song from first album ?
        $('#playlist').attr('data-song-id', 0).attr('data-album-id', 0).attr('data-tag-id', 0);
        SC.get('/users/'+OursoPhone.config.scUserID+'/playlists', OursoPhone.on.playlistsGet);
        SC.get('/users/'+OursoPhone.config.scUserID, OursoPhone.ui.drawUser);
      },
      list: {
        dispatch: function(args) {
          switch(args[0]) {
            case 'album':
              Route.list.albumdispatch(args);
            break;
            case 'tag':
              Route.list.tagdispatch(args);
            break;
          }
        },
        albumdispatch: function(args) { 
          if (!(/^[0-9]+$/.test(args[1]))) {
            console.warn('Route: bad hash entry');
            return;
          }
          Route.list.album(args);
        },
        album: function(args) { 
          $('#playlist').attr('data-tag-id', 0);
          SC.get('/playlists/' + args[1], OursoPhone.on.playlistLoaded);
        },
        tagdispatch:function(args) {
          // tag search
          if (!(/^[a-z0-9 ]+$/i.test(args[1]))) {
            console.warn('Route: bad hash entry');
            return;
          }
          Route.list.tag(args);
        },
        tag: function(args) {  
          $('#playlist').attr('data-tag-id', args[1]);
          SC.get('/tracks/', { tags:args[1], filter:'streamable', order:'created_at' }, OursoPhone.on.tagListLoaded);
        }
   
      },
      play: {
        dispatch: function(args) { 
          if (!(/^[a-z0-9 ]+$/i.test(args[1]))) {
            console.warn('Route: bad hash entry');
            return;
          }
          if (!(/^[0-9]+$/.test(args[3]))) {
            console.warn('Route: bad hash entry');
            return;
          }
          // check if the requested song is not already playing
          if ( args[3] !=$('#playlist').attr('data-song-id') 
            && args[3] !=$('#track-description trackbox[data-id="'+args[3]+'"]').attr('data-id') ) {
            Route.play.song(args);            
          }
          switch(args[0]) {
            case 'album':
              Route.play.album(args);
            break;
            case 'tag':
              Route.play.tag(args);
            break;
          }
        },
        album: function(args) { 
          $('#playlist').attr('data-tag-id', 0);
          // current album or other album ?
          if (args[1] != $('#playlist').attr('data-album-id')) {
            // different album, probably got here using a permalink, load tracks data into playlist
            OursoPhone.utils.interfaceLock();
            SC.get('/playlists/' + args[1], OursoPhone.on.playlistLoaded);
          }
        },
        tag: function(args) {  
          if (args[1] != $('#playlist').attr('data-tag-id')) {
            $('#playlist').attr('data-tag-id', args[1]);
            SC.get('/tracks/', { tags:args[1], filter:'streamable', order:'created_at' }, OursoPhone.on.tagListLoaded);
          }
        },
        song: function(args) {
          OursoPhone.utils.interfaceLock();
          $('#playlist').attr('data-song-id', args[3]);
          SC.get('/tracks/' + args[3], OursoPhone.on.trackInfo);
        }
      }
    };
    
    
    var TemplateStore = {
      init: function() {
        var templates = document.querySelectorAll('script[type="text/html"]');
        for(var tpl in templates) {
          if(templates[tpl].id!==undefined) {
            console.log('loading template ', templates[tpl].id);
            TemplateStore.get(templates[tpl].id);
          }
        }
      },
      get: function(id) {
        var $tpl;
        //id = id.replace('#', '');
        if(TemplateStore.store[id]!==undefined) {
          return TemplateStore.store[id];
        }
        $tpl = document.querySelector('#'+id);
        TemplateStore.store[id] = $tpl.innerHTML;
        $tpl.remove();
        return TemplateStore.store[id];
      },
      store: { }
    };
    
    
    
    var OursoPhone = {
      config: {
        scClientID: "0ec3a92db08c758a47397bf8d588a250",
        scUserID: 61698493,
        CORSRelay: false,
        autoplay: true
      },
      currentPlayer: undefined,
      currentTrack: undefined,
      graphUpdater: undefined,
      waveformData: undefined,
      waveformWidth: undefined,
      init: function() {
      
        // templating for the lazy
        String.prototype.replaceArray = function(find, replace) {
          var replaceString = this;
          var regex; 
          for (var i = 0; i < find.length; i++) {
            regex = new RegExp(find[i], "g");
            replaceString = replaceString.replace(regex, replace[i]);
          }
          return replaceString;
        };  
      
        var hasPhp = function() {
          var req = new XMLHttpRequest();
          // query self to get headers
          req.open('HEAD', document.location, false);
          req.send(null);
          var headers = req.getAllResponseHeaders().toLowerCase();
          // assume the relay is php
          return !!/php/.test(headers);
        }
        
        if(hasPhp()) {
          // enable waveform animated plugin
          OursoPhone.config.CORSRelay = document.location.href;
        }
      
        window.onhashchange = OursoPhone.onRouteChanged;
        //onHashChanged()
        TemplateStore.init();
        OursoPhone.onRouteChanged();
        OursoPhone.ui.init();
      },
      onRouteChanged: function() {
        var args = location.hash.replace('#', '').split(':');
        
        if(args.length==2) {
          Route.list.dispatch(args);
          return;
        }
        if(args.length==4) {
          Route.play.dispatch(args);
          return;
        }
        Route.default(args);
      },
      utils: {
        htmlEncode: function(string){
          string = (string === null)?"":string.toString();
          string = $('<div/>').text(string).html();
          return string.replace(/\n/gi, '<br />\n');
          //
        },
        attrEncode: function(string) {
          string = (string === null)?"":string.toString();
          string = string.replace(/"/gi, '&quot;');
          return string.replace(/\n/gi, '<br />\n');
        },
        interfaceLock: function() {
          $('body').addClass('locked');
        },
        interfaceRelease: function() {
          $('body').removeClass('locked');
        }
      },
      player: {
        pause: function() {
          var currentPlayer = OursoPhone.player.getCurrent()
          if(currentPlayer) {
            currentPlayer.pause();
          }
          OursoPhone.utils.interfaceRelease()
        },        
        play: function() {
          var currentPlayer = OursoPhone.player.getCurrent()
          if(currentPlayer) {
            currentPlayer.play();
          }
          OursoPhone.utils.interfaceRelease();
        },        
        next: function() {
          var tracks = $('#playlist .track trackbox'),
              currentTrack = $('#playlist').attr('data-song-id'),
              nextTrackHash = false,
              album_id,
              track_id;
              
          if(!tracks.length) {
            OursoPhone.utils.interfaceRelease();
            return;      
          }
          
          $(tracks).each(function(trackIndex) {
          
            var linkType = '';
            var linkVal = '';
            
            if( $('#playlist').attr('data-tag-id')!=0 ) {
              linkType = 'tag';
              linkVal = $("#playlist").attr('data-tag-id')
            } else {
              linkType = 'album';
              linkVal = $("#playlist").attr('data-album-id');
            }
          
            if( $(this).attr('data-id') == currentTrack ) {
              if( trackIndex+1 < tracks.length ) {
                album_id = $('#playlist').attr('data-album-id');
                track_id = $(tracks[trackIndex+1]).attr('data-id');
                if(album_id===undefined) return;
                if(track_id===undefined || track_id===null) return;
                nextTrackHash = '#'+linkType+':' + linkVal
                              + ':track:' + $(tracks[trackIndex+1]).attr('data-id');
              }
            }
          });
          if(nextTrackHash) {
            location.href = nextTrackHash;
            //onHashChanged();
          } else {
            OursoPhone.utils.interfaceRelease();
          }
        },
        prev: function() {
          var tracks = $('#playlist .track trackbox'),
              currentTrack = $('#playlist').attr('data-song-id'),
              prevTrackHash = false,
              album_id,
              track_id;

          if(!tracks.length) {
            OursoPhone.utils.interfaceRelease();
            return;      
          }
          
          $(tracks).each(function(trackIndex) {
          
            var linkType = '';
            var linkVal = '';
            
            if( $('#playlist').attr('data-tag-id')!=0 ) {
              linkType = 'tag';
              linkVal = $("#playlist").attr('data-tag-id')
            } else {
              linkType = 'album';
              linkVal = $("#playlist").attr('data-album-id');
            }
          
            if( $(this).attr('data-id') == currentTrack ) {
              if( trackIndex-1 >= 0 ) {
                album_id = $('#playlist').attr('data-album-id');
                track_id = $(tracks[trackIndex-1]).attr('data-id');
                if(album_id===undefined) return;
                if(track_id===undefined || track_id===null) return;
                prevTrackHash = '#'+linkType+':' + linkVal
                              + ':track:' + $(tracks[trackIndex-1]).attr('data-id');
              }
            }
          });
          if(prevTrackHash) {
            location.href = prevTrackHash;
            //onHashChanged();
          } else {
            OursoPhone.utils.interfaceRelease();
          }
        },
        applyVolume: function() {
          $('input[data-action="setvolume"]').trigger('change');
        },
        setVolume: function(newVolume) {
          var currentPlayer = OursoPhone.player.getCurrent();
          if(currentPlayer===undefined) {
            console.warn('attempt to change volume on undefined player', newVolume);
          } else {
            currentPlayer.setVolume( newVolume );
          }
        },
        getCurrent: function() {
          return OursoPhone.currentPlayer;
        },
        getWaveFormData: function() {
          return OursoPhone.waveformData;
        },
        setWaveformData: function(waveformData) {
          OursoPhone.waveformData = waveformData;
        },
        songProgress: function() {
          var currentPlayer = OursoPhone.player.getCurrent();
          if(currentPlayer===undefined) return;
          var ratio = (currentPlayer.position / currentPlayer.duration);
          var state = currentPlayer.playState;
          var progress = (ratio*OursoPhone.waveformWidth);
          var chroma = document.getElementById('animbox').style.backgroundColor;
          if(ratio===1) {
            OursoPhone.on.streamFinished();
          } else {
            $('#canvas-overlay').css({'box-shadow':  progress.toFixed(0) + 'px 0 1px '+ chroma +' inset'});
          }
          
          state = currentPlayer.playState === 1 ? 'playing' : state;
          state = currentPlayer.isBuffering === true ? 'loading' : state;
          state = currentPlayer.paused === true ? 'paused' : state;
          
          $('#player-state,#controls').attr({
            'class': state,
            'data-state': state
          });
        }
      },
      on: {
        tagListLoaded: function(tracks) {
          var $playlist = $("#playlist"), $viewModeControl;
          $playlist.hide();
          $playlist.html('').attr('data-album-id', 0).attr('data-display-mode', 'list');
          
          tracks.forEach( OursoPhone.ui.drawTracks );
          setTimeout(OursoPhone.on.tagInserted, 300);
          
          $viewModeControl = TemplateStore.get('view-mode-control');
          $($viewModeControl).css({
            'top': '55px',
            'right':'0',
            'transform-origin': 'top right'
          }).appendTo('#playlist');
          
          $('.display-mode-box div').off().on('click', function() {
            var mode = this.className.split('-')[2];
            if(mode==='up') {
              location.href = '#';
              //onHashChanged();
              return false;
            }
            $('#playlist').attr('data-display-mode', mode);
          });
          
          $('trackbox').off().on('click', function() {
            if($(this).attr('data-href')!='') {
              if(location.hash!=$(this).attr('data-href')) {
                location.href = $(this).attr('data-href');
                //onHashChanged();
              }
            }
            return false;
          });
          
          $playlist.show();
          OursoPhone.utils.interfaceRelease();
        },
        playlistLoaded:  function(playlist) {
          var $playlist = $("#playlist"), $currentSound, $viewModeControl;
          $playlist.hide();
          $playlist.html('').attr('data-album-id', playlist.id);

          [playlist].forEach( OursoPhone.ui.drawAlbum );
          
          $viewModeControl = TemplateStore.get('view-mode-control');
          $($viewModeControl).appendTo('#playlist');
          
          $('.display-mode-box div').off().on('click', function() {
            var mode = this.className.split('-')[2];
            if(mode==='up') {
              location.href = '#';
              //onHashChanged();
              return false;
            }
            $('#playlist').attr('data-display-mode', mode);
          });
          
          playlist.tracks.forEach( OursoPhone.ui.drawTracks );
          
          setTimeout(OursoPhone.on.tagInserted, 300);
          
          $('trackbox,albumbox').off().on('click', function() {
            if($(this).attr('data-href')!='') {
              if(location.hash!=$(this).attr('data-href')) {
                location.href = $(this).attr('data-href');
                //onHashChanged();
              }
            }
            return false;
          });
          
          $('trackbox').removeClass('active');
          
          $playlist.show();
          
          if( $('#user-description .user-id').text() != playlist.user.id ) {
            SC.get('/users/'+playlist.user.id, OursoPhone.ui.drawUser); 
          }
          
          $currentSound = $('trackbox[data-index="'+ $playlist.attr('data-song-id') +'"]');
          
          if( $currentSound.length ) {
            $currentSound.addClass('active');
            if(OursoPhone.currentTrack) {
              OursoPhone.ui.drawTrack(OursoPhone.currentTrack);
            }
          } else {
            // 
          }
          OursoPhone.utils.interfaceRelease();
        },
        playlistsGet: function(playlists) {
          var $playlist = $("#playlist");
          $playlist.hide();
          $playlist.html('').attr('data-album-id', null).attr('data-song-id', null);
          playlists.forEach( OursoPhone.ui.drawAlbum );
          $('albumbox').on('click', function() {
            if($(this).attr('data-href')!='') {
              if(location.hash!=$(this).attr('data-href')) {
                location.href = $(this).attr('data-href');
                //onHashChanged();
              }
            }
            return false;
          });
          $playlist.show();
        },
        dataWaveformReady: function() {
          var currentPlayer = OursoPhone.player.getCurrent();
          var waveformData  = OursoPhone.player.getWaveFormData();
          var rgb, r, g, b;
          
          if(currentPlayer!==undefined && waveformData!==undefined) {
          
            var ratio = (currentPlayer.position / currentPlayer.duration);
            var progress = (ratio*OursoPhone.waveformWidth);
            var waveformIndex = (ratio*1800).toFixed(0);
            var waveformRatio = 0;
            
            waveformRatio = waveformData.samples[waveformIndex] / waveformData.height;
            
            r = 255-(255*waveformRatio).toFixed(0);
            g = (255*waveformRatio).toFixed(0);
            b = 255-(255*waveformRatio).toFixed(0);

            rgb = "rgb("+ r +","+ g +","+ b +")";
            
            //document.getElementById('waveform').style.opacity = waveformRatio;
            document.getElementById('animbox').style.height = waveformData.samples[waveformIndex] + 'px';
            document.getElementById('animbox').style.backgroundColor = rgb;
          
          }
          
          requestAnimationFrame(OursoPhone.on.dataWaveformReady);
        },
        streamReady: function(player, error) {
      
          OursoPhone.currentPlayer = player;
          $('#comments').empty();
          
          if( OursoPhone.graphUpdater ) {
            clearInterval( OursoPhone.graphUpdater );
            $('#canvas-overlay').css('box-shadow',  '0px 0 1px rgba(0, 255, 0, 0.4) inset');
          }
          OursoPhone.player.applyVolume();
          OursoPhone.graphUpdater = setInterval( OursoPhone.player.songProgress, 500 );
          OursoPhone.utils.interfaceRelease();
        },        
        streamFinished: function() {
          if( OursoPhone.graphUpdater!== undefined ) {
            clearInterval( OursoPhone.graphUpdater );
            cancelAnimationFrame( OursoPhone.on.dataWaveformReady );
            $('#canvas-overlay').css({'box-shadow': '0px 0 1px rgba(0, 255, 0, 0.4) inset', opacity:1});
          }
        
          if(OursoPhone.config.autoplay) {
            // calculate next song
            
            $('[data-action="forward"]').trigger('click');
            
            // play next song
          } else {
            // song ended
          }
        },
        trackInfo: function(track, error) {
          var url, urlImg, urlData,
              currentPlayer = OursoPhone.player.getCurrent(),
              $img, imageObj;
          
          if(error!==null) {
            console.warn('Error while loading track', error);
            //$('#player-title').html( error.message );
            $('#playlist').attr('data-album-id', null).attr('data-song-id', null);
            location.href = '#';
            //history.go(-1);
            OursoPhone.utils.interfaceRelease();
            return;
          }
          
          OursoPhone.currentTrack = track;
          OursoPhone.ui.drawTrack(track);
          
          //$('#player-title').html( '' /*OursoPhone.utils.htmlEncode(track['title']) */);
          //$('#player-description').html( '' /*OursoPhone.utils.htmlEncode(track['description']) */);
          $('#playlist').attr('data-song-id', OursoPhone.currentTrack.id);
          
          $('trackbox').removeClass('active');
          $('trackbox[data-index="'+ OursoPhone.currentTrack.id +'"]').addClass('active');
          
          if( currentPlayer ) {
            currentPlayer.pause();
            //audioManager.removeAudioPlayer( currentPlayer._id );
          }
          
          SC.stream("/tracks/" + OursoPhone.currentTrack.id, {
            autoPlay: true,
            usePeakData:true,
            useWaveformData:true,
            useEQData:true,
            ontimedcomments: OursoPhone.ui.drawComment,
            onloadedmetadata: function(data) {
              console.log('loaded metadata', this, data);
            },
            onbufferchange:function() {
              //console.log('buffer change');
            },
            whileloading:function() {
            /*
                if(this._a===undefined) return;
                console.log('while loading', this);
                audio = this._a;
                
                audio.volume = 1/3;
                audio.controls = true;
                
                audio.addEventListener('canplay', function() {
                    // Timing issue with Chrome - if console opened, audioprocess stops firing during playback?
                    // a timeout here seems to help, but does not completely fix.
                    window.setTimeout(function() {
                        connect();
                    }, 20);
                }, false);*/
            },
            whileplaying: function () {
              //console.log("track is playing", this._a, this._a.onaudioprocess );
              if(this._a.onaudioprocessattached===undefined) {
                console.log('attaching context', this);
                /*
                setTimeout(function() {
                  //connect()
                }, 2500);*/
                this._a.onaudioprocessattached = true;
              }
              //console.log(this.peakData[0]);
            }
          }, OursoPhone.on.streamReady);
          
          // urlImg  = track.waveform_url.replace('http://', '');
          // urlImg  = track.waveform_url.replace('https://', '');
          
          SC.get('/users/'+track.user.id, OursoPhone.ui.drawUser);
          
          $img = $('<img class="waveform-img" />');
            
          $img.on('error', function() {
            // transparent pixel
            $img.attr('src', "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
          });

          $img.on('load', function() {
            OursoPhone.waveformWidth = $(this).width();
          });
          
          $img.attr('src', track.waveform_url);
          $('#canvas-overlay').empty().append($img);

          if(OursoPhone.config.CORSRelay!==false) {
            // enable waveform animated plugin
            urlData = track.waveform_url.replace('http://w1', 'wis');
            urlData = track.waveform_url.replace('https://w1', 'wis');
            
            $.get('<?=basename(__FILE__);?>?w=' + urlData, function(data) {
              waveformData = JSON.parse(data);
              //console.log('storing waveformData', waveformData);
              OursoPhone.player.setWaveformData(waveformData);
              if(waveformData!==undefined) {
                cancelAnimationFrame( OursoPhone.on.dataWaveformReady );
                requestAnimationFrame(OursoPhone.on.dataWaveformReady);
              } else {
                alert('dahoops');
              }
            })
          }
        },
        userResolved: function(user) {
          if(user.id) {
            OursoPhone.config.scUSerID = user.id;
            location.href = '#';
          }
        },
        tagInserted: function() {
          $('tag').off().on('click', function() {
            // console.log($(this).text());
            var cleanStr = $(this).text().replace(/[^a-z0-9 ]+/gi, '');
            if(cleanStr!='') {
              cleanStr = cleanStr.toLowerCase();
              location.href='#tag:'+cleanStr;
              return false;
            }
          });
        }
      },
      ui: {
        init: function() {
          // Get the canvas & its context, width, and height.
          $('#canvas-overlay').on('mousedown', function(evt) {
            var pos = (evt.pageX - $(this).offset().left) / $(this).width();
            var currentPlayer = OursoPhone.player.getCurrent();
            var currentduration = currentPlayer.duration;
            var newPosition = (currentduration*pos).toFixed(0);
            currentPlayer.setPosition(newPosition);
          });
          
          $('.search-button').on('click', function() {
            var user;
            if(user = prompt('Load playlist from user : ')) {
              OursoPhone.ui.resolveUser(user, OursoPhone.on.userResolved)
            }
          });
          
          $('input[data-action="setvolume"]').on('change', function() {
            OursoPhone.player.setVolume( $(this).val()*100 );
          });
          
          $('#controls .player-button').on('click', function(evt) {
            evt.preventDefault();
            OursoPhone.utils.interfaceLock();
            var that = $(this);
            switch(that.attr('data-action')) {
              case 'play':
                OursoPhone.player.play();
              break;
              case 'pause':
                OursoPhone.player.pause();
              break;
              case 'backward':
                OursoPhone.player.prev();
              break;
              case 'forward':
                OursoPhone.player.next()
              break;
            }
            return false;
          });
          
          $('.volume-control label').on('click', function() {
            var $volumeControl = $('[data-action="setvolume"]');
            var currentVolume = 0- -$volumeControl.val();
            var maxVolume     = 0- -$volumeControl.prop('max');
            var minVolume     = 0- -$volumeControl.prop('min');
            var step          = 0- -$volumeControl.prop('step');
            var newVolume;
            
            //console.log(currentVolume, maxVolume, minVolume, step);
            
            switch( $(this).html() ) {
              case '+':
                if( ( currentVolume + step ) <= maxVolume ) {
                  newVolume = currentVolume + 0 + step;
                }
              break;
              case '-':
                if( ( currentVolume - step ) >= minVolume ) {
                  newVolume = currentVolume - step;
                }
              break;
            }
            if(newVolume!==undefined) {
              //console.log('new volume', newVolume);
              $volumeControl.val(newVolume).trigger('change');
            }
          });        
        },
        drawAlbum: function(album) {
          var $albumpicture, 
              $albumtpl = TemplateStore.get('album-item'),
              albumTagList;
          var html ='';
          
          if(album.streamable!==true) {
            console.warn('album is not sreamable', album);
            return;
          }
          if(album.embeddable_by!=='all') {
            console.warn('album is not embeddable', album);
            return;
          }
          if(album.downloadable===true) {
            console.info('album "'+album.title+'" is downloadable');
            // set download link?
          }
          if (album.artwork_url != null && album.artwork_url.length > 0) {
            /* templating */
            $albumpicture = TemplateStore.get('album-picture').replaceArray(
              ["{album-cover}"],
              [album.artwork_url]
            );
          } else {
            $albumpicture = TemplateStore.get('album-no-picture');
          }
          if(album.tag_list=='') {
            albumTagList = '';
          } else {
            albumTagList = '<tag>' + album.tag_list.match(/(".*?")|(\S+)/g).join('</tag><tag>') + '</tag>';
          }
          
          html = $albumtpl.replaceArray([
            "{album-kind}",
            "{album-createdat}",
            "{album-duration}",
            "{album-taglist}",
            "{album-trackcount}",
            "{album-genre}",
            "{album-url}",
            "{album-index}",
            "{album-title}",
            "{album-description}",
            "{album-cover}",
            "{album-picture}"
          ],[
            album.kind,
            album.created_at,
            new Date(album.duration).getMinutes() + 'mn' + ( new Date(album.duration).getSeconds()%60 ) + 's',
            albumTagList,
            album.track_count,
            album.genre,
            '#album:' + album.id,
            album.id,
            album.title,
            album.description,
            album.artwork_url,
            $albumpicture
          ]);
          
          $(html).appendTo('#playlist');
          setTimeout(OursoPhone.on.tagInserted, 300);
        },
        drawTracks: function(track, index, thisArg) {
          // thisArg => all tracks
          var attributes = '';
          var $tracktpl = TemplateStore.get('track-item');
          var $trackpicture;
          var html = '';
          var linkType = '';
          var linkVal = '';
          var trackTagList = '';
          
          if( $('#playlist').attr('data-tag-id')!=0 ) {
            linkType = 'tag';
            linkVal = $("#playlist").attr('data-tag-id')
          } else {
            linkType = 'album';
            linkVal = $("#playlist").attr('data-album-id');
          }
          if(track.streamable!==true) {
            console.warn('track is not sreamable', track);
            return;
          }
          if(track.embeddable_by!=='all') {
            console.warn('track is not embeddable', track);
            return;
          }
          if(track.downloadable===true) {
            console.info('track "'+track.title+'" is downloadable');
            // set download link?
          }
          // build attributes list
          ['id', 'title', 'uri', 'duration', 'commentable', 'description', 'artwork_url'].forEach(function(attr) {
            attributes += 'data-' + attr + '="' + OursoPhone.utils.attrEncode(track[attr]) + '" ';
          });
          if (track.artwork_url != null && track.artwork_url.length > 0) {
            /* templating */
            $trackpicture = TemplateStore.get('track-picture').replaceArray(
              ["{track-artwork-url}", "{track-title}"],
              [track.artwork_url, OursoPhone.utils.htmlEncode(track.title)]
            );
          } else {
            $trackpicture = TemplateStore.get('track-no-picture');
          }
          if(track.tag_list=='') {
            trackTagList = '';
          } else {
            trackTagList = '<tag>' + track.tag_list.match(/(".*?")|(\S+)/g).join('</tag><tag>') + '</tag>';
          }
          /* templating */
          html = $tracktpl.replaceArray([
              "{track-createdat}",
              "{track-duration}",
              "{track-taglist}",
              "{track-genre}",
              "{track-description}",
              "{track-tracktype}",
              "{track-permalinkurl}",
              "{album-url}",
              "{data-attributes}",
              "{data-index}",
              "{track-picture}",
              "{track-title}"
            ],[
              track.created_at,
              new Date(track.duration).getMinutes() + 'mn' + ( new Date(track.duration).getSeconds()%60 ) + 's',
              trackTagList,
              track.genre,
              track.description,
              track.track_type,
              track.permalink_url,
              '#'+linkType+':'+ linkVal + ':track:'+ track.id,
              attributes,
              track.id,
              $trackpicture,
              OursoPhone.utils.htmlEncode(track.title)
          ]);
          $(html).appendTo('#playlist');
        },
        drawTrack: function(track) {
          var trackBox = $('trackbox[data-index="'+ track.id +'"]').clone();
          if(!trackBox.length) {
            console.log('should query api');
          }
          if(track.streamable!==true) {
            console.warn('track is not sreamable', track);
            return;
          }
          if(track.embeddable_by!=='all') {
            console.warn('track is not embeddable', track);
            return;
          }
          $(trackBox).addClass('full-view').removeClass('active');
          $('#track-description').empty().append( trackBox );
          setTimeout(OursoPhone.on.tagInserted, 300);
        },
        drawComment: function(comments){
          var firstComment = comments[0];
          var userComment, blockComment, userAvatar, userLink;
          var text = "";
          var $comments = $('#comments');
          
          userAvatar = $('<img/>').attr({
            'src': firstComment.user.avatar_url,
            'align': 'left',
            'alt': firstComment.user.username,
            'title': firstComment.user.username
          }).css({maxWidth:"1.2em"});
          
          userLink = $('<a></a>').attr({
            target:"_blank",
            href:firstComment.user.permalink_url
          });
          
          userAvatar.appendTo(userLink);
          
          userComment = $('<span class="comment-text"></span>').text('(@' +Math.floor(firstComment.timestamp / 1000) + "s): "+ firstComment.body);
          blockComment = $('<li/>').append(userLink).append(userComment).attr('data-id', firstComment.id);
          
          if(! $('#comments li[data-id="'+ firstComment.id +'"]').length) {
            blockComment.appendTo('#comments');
          }
          $comments.stop(true, true).animate({scrollTop: $comments.prop("scrollHeight")}, 300);
        },
        resolveUser: function(searchStr, callback) {
          searchStr = searchStr.replace(/ /g, '-');
          console.log('will resolve', searchStr);
          SC.get('/resolve', {
            url: 'https://soundcloud.com/' + searchStr
          }, function(user, error) {
            if(error) {
              console.log('HTTP Error', error);
            } else {
              if(user.id) {
                callback(user);
              } else {
                console.log('nothing found');
              }
            }
          });
        },
        drawUser: function(user, error) {
          var $usertpl = TemplateStore.get('user-item');
          var html = '';
          
          html = $usertpl.replaceArray([    
            "{user-id}",
            "{user-kind}",
            "{user-fullname}",
            "{user-permalinkurl}",
            "{user-avatarurl}",
            "{user-description}",
            "{user-website}",
            "{user-websitetitle}",
            "{user-trackcount}",
            "{user-playlistcount}",
            "{user-followerscount}",
            "{user-followingcount}"
          ],[            
            user.id,
            user.kind,
            user.full_name,
            user.permalink_url,
            user.avatar_url,
            user.description,
            user.website,
            user.website_title,
            user.track_count,
            user.playlist_count,
            user.followers_count,
            user.followings_count
          ]);
          $('#user-description').html(html);
        }
      }
    };
    
   
    
    
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
