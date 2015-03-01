
OursoPhone.on = { };

OursoPhone.on.playerClick = function(e) {

  if( OursoPhone.config.isFeedbackEnabled ) {
    OursoPhone.ui.vibrate(e);
  }

  if($(this).attr('data-href')!='') {
    if(location.hash!=$(this).attr('data-href')) {
      location.href = $(this).attr('data-href');
    }
  }
  return false;
};




OursoPhone.on.tagListLoaded = function(tracks) {
  var $playlist = $("#playlist");

  OursoPhone.currentTrackList = tracks;
  OursoPhone.cache.tagList.store({tag: $playlist.attr('data-tag-id'), tracks: tracks});

  $playlist.find('.track').remove();
  $playlist.attr('data-album-id', '0').attr('data-display-mode', 'list');

  tracks.forEach( OursoPhone.ui.drawTracks );
  setTimeout(OursoPhone.on.tagInserted, 300);

  // TODO : use internal route
  $('trackbox').off().on('click', OursoPhone.on.playerClick);

  if(OursoPhone.config.isInWebView) {
    $('#playlist').attr('data-display-mode', 'thumb');
  }

  OursoPhone.utils.interfaceRelease();
  OursoPhone.calcThumbsSize();
};





OursoPhone.on.trackListLoaded = function(tracks) {
  var $playlist = $("#playlist");

  console.log('trackListLoaded', {tracks:tracks});

  OursoPhone.currentTrackList = tracks;
  OursoPhone.cache.trackList.store(tracks);

  $playlist.find('.track').remove();
  $('.album').remove();
  $playlist.attr('data-album-id', '0').attr('data-display-mode', 'list');

  tracks.forEach( OursoPhone.ui.drawTracks );
  setTimeout(OursoPhone.on.tagInserted, 300);

  $('trackbox').off().on('click', OursoPhone.on.playerClick);

  if(OursoPhone.config.isInWebView) {
    $('#playlist').attr('data-display-mode', 'thumb');
  }

  OursoPhone.utils.interfaceRelease();
  OursoPhone.calcThumbsSize();
};




OursoPhone.on.playlistLoaded = function(playlist) {
  var $playlist = $("#playlist"), $currentSound;

  $playlist.attr('data-album-id', playlist.id);

  OursoPhone.currentTrackList = playlist.tracks;
  //OursoPhone.cache.playList.store({userid: OursoPhone.config.scUserID, albums: playlist});

  $playlist.find('.track').remove();
  playlist.tracks.forEach( OursoPhone.ui.drawTracks );

  $('.album').remove();
  [playlist].forEach( OursoPhone.ui.drawAlbum );

  setTimeout(OursoPhone.on.tagInserted, 300);

  $('trackbox').off().on('click', OursoPhone.on.playerClick);
  $('albumbox').off().on('click', OursoPhone.on.playerClick);

  $('trackbox').removeClass('active');

  if( $('#user-description .user-id').text() != playlist.user.id ) {
    var userInCache = OursoPhone.cache.user.find(playlist.user.id);
    if( userInCache ) {
      OursoPhone.ui.drawUser( userInCache );
    } else {
      SC.get('/users/'+playlist.user.id, OursoPhone.ui.drawUser);
    }
  }

  $currentSound = $('trackbox[data-index="'+ $playlist.attr('data-song-id') +'"]');

  if( $currentSound.length ) {
    $currentSound.addClass('active');
    if(OursoPhone.currentTrack) {
      OursoPhone.ui.drawTrackInfo(OursoPhone.currentTrack);
    }
  } else {
    //
  }

  $playlist.addClass('docked');
  $('.display-mode-thumb').trigger('click');

  if(OursoPhone.config.isInWebView) {
    $('#playlist').attr('data-display-mode', 'thumb');
  }

  OursoPhone.utils.interfaceRelease();
  OursoPhone.calcThumbsSize()
};






OursoPhone.on.playlistsGet = function(playlists) {
  var $playlist = $("#playlist"),
  albumId = $playlist.attr('data-album-id');

  $playlist.attr('data-album-id', '0');

  OursoPhone.cache.playList.store({userid: OursoPhone.config.scUserID, albums: playlists});

  $('.album').remove();
  playlists.forEach( OursoPhone.ui.drawAlbum );
  $('albumbox').on('click', OursoPhone.on.playerClick);

  if(albumId!='0') {
    $('albumbox[data-index="'+ albumId +'"]').addClass('active');
  }
  //if($playlist.is(':empty')) {
    $playlist.removeClass('docked');
  //} else {
  //  $playlist.addClass('docked');
  //}
  OursoPhone.calcThumbsSize();
};





OursoPhone.on.streamReady = function(player, error) {
  var startFrom;
  OursoPhone.currentPlayer = player;
  $('#comments').empty();

  if( OursoPhone.graphUpdater!== undefined ) {
    // clear previous timers
    clearInterval( OursoPhone.graphUpdater );
    cancelAnimationFrame( OursoPhone.player.dataWaveformReady );
    // reset progress box
    $('#canvas-overlay').css('box-shadow',  '0 0 1px rgba(0, 255, 0, 0.4) inset');
  }

  if( OursoPhone.localStorage && OursoPhone.initialPlay ) {
    startFrom = localStorage.getItem('currentPlayerPosition');
    // page reload : resume track at specific timestamp ?
    if( startFrom && startFrom !== null) {
      console.info('resuming track at', startFrom);
      OursoPhone.currentPlayer.position = startFrom;
    }
  }
  OursoPhone.initialPlay = false;
  OursoPhone.player.applyVolume();
  OursoPhone.graphUpdater = setInterval( OursoPhone.player.songProgress, 500 );
  OursoPhone.utils.interfaceRelease();
};




OursoPhone.on.streamFinished = function() {
  if( OursoPhone.graphUpdater!== undefined ) {
    clearInterval( OursoPhone.graphUpdater );
    cancelAnimationFrame( OursoPhone.player.dataWaveformReady );
    $('#canvas-overlay').css({'box-shadow': '0 0 1px rgba(0, 255, 0, 0.4) inset', opacity:1});
  }

  if( OursoPhone.localStorage ) {
    localStorage.removeItem('currentPlayerPosition');
    OursoPhone.currentPlayer.position = 0;
  }

  if(OursoPhone.config.autoplay) {
    // calculate next song

    $('[data-action="forward"]').trigger('click');

    // play next song
  } else {
    // song ended
  }
};




OursoPhone.on.trackInfo = function(track, error) {
  var url, urlImg, urlData,
      currentPlayer = OursoPhone.player.getCurrent(),
      $canvasOverlay, $img, imageObj, userInCache,
      onTimedComments = null
  ;

  if(OursoPhone.config.showComments){
    onTimedComments = OursoPhone.ui.drawComment;
  }

  if(error!==null) {
    console.warn('Error while loading track', error);
    //$('#player-title').html( error.message );
    $('#playlist').attr('data-album-id', '0').attr('data-song-id', '0');
    location.href = '#';
    OursoPhone.utils.interfaceRelease();
    return;
  } else {
    //console.log('on.trackInfo', track);
  }

  $('#playlist').attr('data-song-id', track.id);

  OursoPhone.currentTrack = track;
  OursoPhone.ui.drawTrackInfo( track );

  $('trackbox').removeClass('active');
  $('trackbox[data-index="'+ track.id +'"]').addClass('active');
  $('.display-mode-trackview').trigger('click');


  if( currentPlayer ) {
    currentPlayer.pause();
  }

  SC.stream("/tracks/" + track.id, {
    autoPlay: true,
    usePeakData: true,
    useWaveformData: true,
    useEQData: true,
    ontimedcomments: onTimedComments,
    onloadedmetadata: function(data) {
      console.log('loaded metadata', this, data);
    },
    onbufferchange:function() {
      //console.log('buffer change');
    },
    whileloading:function() {
      /*
        *                if(this._a===undefined) return;
        *                console.log('while loading', this);
        *                audio = this._a;
        *
        *                audio.volume = 1/3;
        *                audio.controls = true;
        *
        *                audio.addEventListener('canplay', function() {
        *                    // Timing issue with Chrome - if console opened, audioprocess stops firing during playback?
        *                    // a timeout here seems to help, but does not completely fix.
        *                    window.setTimeout(function() {
        *                        connect();
    }, 20);
    }, false);*/
    },
    whileplaying: function () {
      //console.log("track is playing", this._a, this._a.onaudioprocess );
      if(this._a.onaudioprocessattached===undefined) {
        //console.log('attaching context', this);
        /*
          *                setTimeout(function() {
          *                  //connect()
      }, 2500);*/
        this._a.onaudioprocessattached = true;
      }
      //console.log(this.peakData[0]);
    }
  }, OursoPhone.on.streamReady);

  // urlImg  = track.waveform_url.replace('http://', '');
  // urlImg  = track.waveform_url.replace('https://', '');

  userInCache = OursoPhone.cache.user.find(track.user.id);

  if( userInCache ) {
    OursoPhone.ui.drawUser( userInCache );
  } else {
    //console.log('user not in cache', track.user.id);
    SC.get('/users/'+track.user.id, OursoPhone.ui.drawUser);
  }

  $canvasOverlay = $('#canvas-overlay');

  $img = $canvasOverlay.find('img');

  if($img.length<=0) {
    $img = $('<img class="waveform-img" />');
    $canvasOverlay.append($img);
    //console.log('appended overlay');
  } else {
    //console.log('reusing overlay');
  }

  $img.on('error', function() {
    // transparent pixel
    $img.attr('src', OursoPhone.pixelTrans);
  });

  $img.on('load', function() {
    OursoPhone.waveformWidth = $(this).width();
  });

  $img.attr('src', track.waveform_url).removeClass('loader');
  //$('#canvas-overlay').empty().append($img);

  if(OursoPhone.config.isInWebView) {
    // enable waveform animated plugin
    urlData = track.waveform_url.replace('http://w1', 'http://wis');
    urlData = track.waveform_url.replace('https://w1', 'https://wis');

  } else {

    urlData = track.waveform_url.replace('http://w1', 'http://wis');
    urlData = track.waveform_url.replace('https://w1', 'https://wis');

    if(OursoPhone.config.CORSRelay!==false) {
      // enable waveform animated plugin
      urlData = track.waveform_url.replace('http://w1', 'wis');
      urlData = track.waveform_url.replace('https://w1', 'wis');
      urlData = OursoPhone.config.CORSRelay + '?w=' + urlData;
    }

  }

  if(urlData) {
    $.get(urlData, OursoPhone.player.animateWaveformData);
  }

};





OursoPhone.on.userResolved = function(user) {
  if(user.id) {
    OursoPhone.config.scUSerID = user.id;
    location.href = '#user:' + user.id;
  }
};





OursoPhone.on.tagInserted = function() {
  $('tag').off().on('click', function() {
    var cleanStr = $(this).text().replace(/[^a-z0-9 ]+/gi, '');
    if(cleanStr!='') {
      cleanStr = cleanStr.toLowerCase();
      location.href='#tag:'+cleanStr;
      return false;
    }
  });
}


