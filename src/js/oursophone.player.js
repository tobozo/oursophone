
OursoPhone.player = { }

OursoPhone.player.stop = function() {
  OursoPhone.currentPlayer.stop();
  OursoPhone.currentPlayer.position = 0;
  if( OursoPhone.localStorage ) {
    localStorage.removeItem('currentPlayerPosition');
  }
  clearInterval( OursoPhone.graphUpdater );
  $('#player-state').attr({
    "class":"",
    "data-state":""
  });
};



OursoPhone.player.pause = function() {
  var currentPlayer = OursoPhone.player.getCurrent()
  if(currentPlayer) {
    if(currentPlayer.paused===false) {
      currentPlayer.pause();
    }else {
      console.warn('received blind pause');
    }
  } else {
    console.warn('received early pause');
  }

  //clearInterval( OursoPhone.graphUpdater );
  cancelAnimationFrame( OursoPhone.player.dataWaveformReady );

  if( OursoPhone.localStorage ) {
    localStorage.removeItem('currentPlayerPosition');
  }
  OursoPhone.utils.interfaceRelease()
};




OursoPhone.player.play = function() {
  var currentPlayer = OursoPhone.player.getCurrent()
  if(currentPlayer) {
    if(currentPlayer.paused===true) {
      currentPlayer.play();
      console.warn('sending play');
    } else {
      console.warn('received blind play, expecting paused=true and got paused=', currentPlayer.paused);
    }
  } else {
    console.warn('received early play');
  }
  /*
    *          if( !OursoPhone.graphUpdater  ) {
    *            OursoPhone.graphUpdater = setInterval( OursoPhone.player.songProgress, 500 );
    *            requestAnimationFrame( OursoPhone.player.dataWaveformReady );
}*/
  OursoPhone.utils.interfaceRelease();
};




OursoPhone.player.next = function() {
  var $playlist,
  playlistProps,
  currentTrack,
  nextTrackHash = false,
  album_id,
  track_id
  ;

  OursoPhone.player.stop();

  function first(obj) {
    for (var a in obj) return a;
  }

  if(!OursoPhone.currentTrackList || !OursoPhone.currentTrackList.length) {
    // TODO : handle loop on single track
    console.warn('current tracklist is empty');
    OursoPhone.utils.interfaceRelease();
    return;
  }

  $playlist = $('#playlist');

  playlistProps = {
    tag: $playlist.attr('data-tag-id'),
    user: $playlist.attr('data-user'),
    album: $playlist.attr('data-album-id')
  };

  currentTrack = $playlist.attr('data-song-id');

  OursoPhone.currentTrackList.forEach(function(track, trackIndex) {

    var linkType = '',
    linkVal = '',
    albumList,
    trackList;

    if( playlistProps.tag !='0' ) {
      linkType = 'tag';
      linkVal  = playlistProps.tag;
    } else {
      if( playlistProps.user !='' ) {
        linkType = 'user';
        linkVal  = playlistProps.user;
      } else {
        linkType = 'album';
        linkVal  = playlistProps.album;
      }
    }
    if(track.id == currentTrack) {
      trackList = OursoPhone.currentTrackList;
      if( trackIndex+1 < OursoPhone.currentTrackList.length ) {
        if(  trackList[trackIndex+1].id !== undefined
          && trackList[trackIndex+1].id !== null) {
          nextTrackHash = '#'+linkType+':' + linkVal + ':track:' + trackList[trackIndex+1].id;
          }
      } else {
        // current track is the last of its tracklist
        if( OursoPhone.config.loop ) { // is loop enabled ?
          switch(linkType) {
            case 'album':
              // identify next album and play its first song
              albumList = OursoPhone.cache.playList.byuser[ OursoPhone.config.scUserID ].albums;
              albumList.forEach(function(album, index) {

                var targetAlbum;

                if(album.id == linkVal) {
                  if( index+1 < albumList.length ) {
                    // next album, first song
                    nextTrackHash = '#'+linkType+':' + albumList[index+1].id + ':track:' + albumList[index+1].tracks[0].id;
                  } else { // loop between albums
                    // first album, first song
                    targetAlbum = albumList[first( albumList )];
                    nextTrackHash = '#'+linkType+':' + targetAlbum.id + ':track:' + targetAlbum.tracks[0].id;
                  }
                }
              });
              break;
            default:
              // jump back to the beginning of the current user-tracklist/taglist
              nextTrackHash = '#'+linkType+':' + linkVal + ':track:' + OursoPhone.currentTrackList[0].id;
          }; // end switch()
        }
      }
    }

  });

  if(nextTrackHash) {
    location.href = nextTrackHash;
  } else {
    console.log('no next track found');
    location.href ='#';
    OursoPhone.utils.interfaceRelease();
  }
};




OursoPhone.player.prev = function() {
  var $playlist,
  playlistProps,
  currentTrack,
  prevTrackHash = false,
  album_id,
  track_id
  ;

  OursoPhone.player.stop();

  if(!OursoPhone.currentTrackList.length) {
    OursoPhone.utils.interfaceRelease();
    return;
  }

  $playlist = $('#playlist');

  playlistProps = {
    tag: $playlist.attr('data-tag-id'),
    user: $playlist.attr('data-user'),
    album: $playlist.attr('data-album-id')
  };

  currentTrack = $playlist.attr('data-song-id');

  OursoPhone.currentTrackList.forEach(function(track, trackIndex) {

    var linkType = '';
    var linkVal = '';

    if( playlistProps.tag !=0 ) {
      linkType = 'tag';
      linkVal  = playlistProps.tag;
    } else {
      if( playlistProps.user !='' ) {
        linkType = 'user';
        linkVal  = playlistProps.user;
      } else {
        linkType = 'album';
        linkVal  = playlistProps.album;
      }
    }

    if(track.id == currentTrack) {
      if( trackIndex-1 >= 0 ) {
        if(  OursoPhone.currentTrackList[trackIndex-1].id !== undefined
          && OursoPhone.currentTrackList[trackIndex-1].id !==null) {
          prevTrackHash = '#'+linkType+':' + linkVal + ':track:' + OursoPhone.currentTrackList[trackIndex-1].id;
          }
      }
    }

  });

  if(prevTrackHash) {
    location.href = prevTrackHash;
  } else {
    OursoPhone.utils.interfaceRelease();
  }
};




OursoPhone.player.applyVolume = function() {
  $('input[data-action="setvolume"]').trigger('change');
};




OursoPhone.player.setVolume = function(newVolume) {
  var currentPlayer = OursoPhone.player.getCurrent();
  if(currentPlayer===undefined) {
    console.warn('attempt to change volume on undefined player', newVolume);
  } else {
    currentPlayer.setVolume( newVolume );
  }
};




OursoPhone.player.getCurrent = function() {
  return OursoPhone.currentPlayer;
};




OursoPhone.player.getWaveFormData = function() {
  return OursoPhone.waveformData;
};




OursoPhone.player.setWaveformData = function(waveformData) {
  OursoPhone.waveformData = waveformData;
};

OursoPhone.player.animateWaveformData = function(waveformData) {
  var interval;

  if(waveformData!==undefined) {

    cancelAnimationFrame( OursoPhone.player.dataWaveformReady );
    clearInterval( OursoPhone.player.dataWaveformReady );

    OursoPhone.player.setWaveformData(waveformData);
    // css transition time is 100ms
    // waveform data length is always 1800
    // 1800 * 100 = 180000
    /*if( OursoPhone.currentTrack.duration > 180000 ) {*/
    interval = ((OursoPhone.currentTrack.duration / 180000) * 100).toFixed(0);
    // use setInterval, not enough data for a decent 30fps anyway
    OursoPhone.waveFormRenderer = 'setInterval';
    setInterval( OursoPhone.player.dataWaveformReady,  interval );
    /*} else {
      *              console.log("animateWaveformData: use requestAnimationFrame, don't bother calculating optimal refresh rate");
      *              // use requestAnimationFrame, don't bother calculating optimal refresh rate
      *              OursoPhone.waveFormRenderer = 'requestAnimationFrame';
      *              requestAnimationFrame( OursoPhone.player.dataWaveformReady );
  }*/

    if( OursoPhone.currentTrack.duration > 180000 ) {
      $('#animbox').css('transition', 'all '+ interval +'ms cubic-bezier(0.5, -0.5, 0.5, 1.5) 0s');
    } else {
      $('#animbox').css('transition', 'all 0.1s ease 0s');
    }

    //cancelAnimationFrame( OursoPhone.player.dataWaveformReady );
    //requestAnimationFrame( OursoPhone.player.dataWaveformReady );
  } else {
    alert('dahoops');
  }
};





OursoPhone.player.dataWaveformReady = function() {
  var currentPlayer = OursoPhone.player.getCurrent();
  var waveformData  = OursoPhone.player.getWaveFormData();
  var rgb, r, g, b;

  if(currentPlayer!==undefined && waveformData!==undefined) {

    var       ratio = (currentPlayer.position / currentPlayer.duration),
    progress = (ratio*OursoPhone.waveformWidth),
    waveformIndex = (ratio*1800).toFixed(0),
    waveformRatio = 0
    ;

    waveformRatio = waveformData.samples[waveformIndex] / waveformData.height;

    r = 255-(255*waveformRatio).toFixed(0);
    g = (255*waveformRatio).toFixed(0);
    b = 255-(255*waveformRatio).toFixed(0);

    rgb = "rgb("+ r +","+ g +","+ b +")";

    //document.getElementById('waveform').style.opacity = waveformRatio;
    document.getElementById('animbox').style.height = waveformData.samples[waveformIndex] + 'px';
    document.getElementById('animbox').style.backgroundColor = rgb;
    OursoPhone.graphData = {
      chroma: rgb,
      ratio: ratio,
      progress: progress
    };

  }
  if( OursoPhone.waveFormRenderer == 'requestAnimationFrame' ) {
    requestAnimationFrame(OursoPhone.player.dataWaveformReady);
  }
};





OursoPhone.player.songProgress = function() {
  // don't call use this in requestAnimationFrame
  // instead use linear CSS transitions and setInterval
  var state, currentPlayer = OursoPhone.player.getCurrent();

  if(currentPlayer===undefined) return;

  if(OursoPhone.graphData.ratio===1) {
    OursoPhone.on.streamFinished();
  } else {
    $('#canvas-overlay').css({
      'box-shadow':  OursoPhone.graphData.progress.toFixed(0) + 'px 0 1px '+ OursoPhone.graphData.chroma +' inset'
    });
  }

  state = currentPlayer.playState === 1 ? 'playing' : state;
  state = currentPlayer.isBuffering === true ? 'loading' : state;
  state = currentPlayer.paused === true ? 'paused' : state;

  if( OursoPhone.localStorage ) {
    if( state == 'playing' ) {
      //console.log('songProgress setitem', currentPlayer.position);
      localStorage.setItem('currentPlayerPosition',  currentPlayer.position);
    } else {
      //console.log('songProgress delitem');
      localStorage.setItem('currentPlayerPosition',  null);
    }
  }

  $('#player-state,#controls').attr({
    'class': state,
    'data-state': state
  });
};

