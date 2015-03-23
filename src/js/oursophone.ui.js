
OursoPhone.ui  = {};

OursoPhone.ui.init = function() {
  // inject the view controls
  var $viewModeControl = TemplateStore.get('view-mode-control');

  $($viewModeControl).appendTo('#controls');

  $('oursophone').attr('data-size', OursoPhone.cache.size );

  $('.display-mode-box div').off().on('click', function(e) {

    var mode = this.className.split('-')[2],
        $this = $(this),
        $playlist = $('#playlist'),
        $scrollTarget,
        $flexBox;

    if( OursoPhone.config.isFeedbackEnabled ) {
      OursoPhone.ui.vibrate(e);
    }

    OursoPhone.ui.touchRipple(e, this, $(this));

    switch(mode) {

      case 'albumview':
      case 'trackview':
      case 'userview':

        if( $this.hasClass('view-active') ) {
          $playlist.removeClass('docked');
          console.log('view already set');
          return false;
        }
        //console.log('wat');
        $scrollTarget = $('#' + mode.replace('view', '') + '-description');

        if($scrollTarget.is(':empty')) {
          console.log('no need to scroll to an empty slot');
          $playlist.removeClass('docked');
          return false;
        }
        //console.log('wot');
        // do NOT animate the scroll itself
        $flexBox = $('#flex-box');

        $flexBox.animate({opacity:0.5}, 100, function() {
          //console.log('wut');
          $flexBox.scrollTo( $scrollTarget, 0, function() {
            $flexBox.animate({opacity:1}, 100, function() {

            });
          });
        });

        $('.display-mode-box div').removeClass('view-active');
        $this.addClass('view-active');
        $playlist.removeClass('docked');

      break;
      case 'up':
        $('.display-mode-albumview').trigger("click");
        location.href = '#';
      break;
      case 'thumb':
        setTimeout(function() {
          OursoPhone.calcThumbsSize({
            maxrows:            OursoPhone.config.thumbs.rowspertrack,
            containerSelector:  '#playlist',
            quantifierSelector: 'trackbox',
            outerThumbSelector: '.track img',
            innerThumbSelector: '.track',
            marginWidthRule:    '[data-display-mode="thumb"] .track .track-picture',
            fontSizeRule:       '[data-display-mode="thumb"] .track .track-title'
          });
/*
          OursoPhone.calcThumbsSize({
            maxrows:            OursoPhone.config.thumbs.rowsperalbum,
            containerSelector:  '#album-description',
            quantifierSelector: '.album',
            outerThumbSelector: '.album img',
            innerThumbSelector: '.album',
            marginWidthRule:    '[data-display-mode="thumb"] .album .album-picture',
            fontSizeRule:       '[data-display-mode="thumb"] .album .album-title'
          });
*/

        }, 300);
      case 'list':
        $('#playlist[data-display-mode]').attr('data-display-mode', mode);
        $('.display-mode-box div').removeClass('mode-active');
        $this.addClass('mode-active');
        if($playlist.is(':empty')) {
          $playlist.removeClass('docked');
        } else {
          $playlist.addClass('docked');
        }
    }
    return false;
  });

  // Get the canvas & its context, width, and height.
  $('#canvas-overlay').on('mousedown', function(evt) {

    var pos, currentPlayer, currentduration, newPosition;

    if( OursoPhone.config.isFeedbackEnabled ) {
      OursoPhone.ui.vibrate(evt);
    }

    pos = (evt.pageX - $(this).offset().left) / $(this).width();
    currentPlayer = OursoPhone.player.getCurrent();

    if(currentPlayer) {
      currentduration = currentPlayer.duration;
      newPosition = (currentduration*pos).toFixed(0);
      currentPlayer.setPosition(newPosition);
    }
  });

  $('.search-button').on('click', function() {
    var user;
    if(user = prompt('Load playlist from user : ')) {
      OursoPhone.ui.resolveUser(user)
    }
  });

  $('input[data-action="setvolume"]').on('change', function() {
    var thisVal = $(this).val();
    OursoPhone.config.currentVolume = thisVal;
    OursoPhone.player.setVolume( thisVal*100 );
    if( OursoPhone.localStorage ) {
      console.info('saving config');
      localforage.setItem('oursophone-config', JSON.stringify( OursoPhone.config ) );
    }
  });

  if( OursoPhone.config.currentVolume ) {
    $('input[data-action="setvolume"]').val( OursoPhone.config.currentVolume );
  }


  $('#controls .player-button').on('click', function(e) {
    var that = $(this);

    if( OursoPhone.config.isFeedbackEnabled ) {
      OursoPhone.ui.vibrate(e);
    }

    OursoPhone.ui.touchRipple(e, this, $(this).find('span'), function() {
      OursoPhone.utils.interfaceLock();

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

    });

    e.preventDefault();
    return false;
  });

  $('#un-mute').on('click', function(e) {
    if( OursoPhone.config.isFeedbackEnabled ) {
      OursoPhone.ui.vibrate(e);
    }
    OursoPhone.config.showComments = this.checked;
    if(! this.checked) {
      $('#comments').empty();
    }
    if( OursoPhone.localStorage ) {
      console.info('saving config');
      localforage.setItem('oursophone-config', JSON.stringify( OursoPhone.config ) );
    }
  });
  $('#un-mute').attr('checked', OursoPhone.config.showComments);

  $('.volume-control label').on('click', function(e) {
    if( OursoPhone.config.isFeedbackEnabled ) {
      OursoPhone.ui.vibrate(e);
    }

    var $volumeControl = $('[data-action="setvolume"]');
    var currentVolume = 0- -$volumeControl.val();
    var maxVolume     = 0- -$volumeControl.prop('max');
    var minVolume     = 0- -$volumeControl.prop('min');
    var step          = 0- -$volumeControl.prop('step');
    var newVolume;

    switch( $(this).attr('data-volume-action') ) {
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
      $volumeControl.val(newVolume).trigger('change');
    }
  });


  $('#flex-box').on('scroll', function() {
    // scroll is not animated and triggered programmatically
    // hopefully it'll only be fired once
    var $flex = $(this),
        flexTop = $flex.offset().top,
        flexScrollTop = this.scrollTop;
    $('div[id$=description]').not(':empty').each(function() {
      var viewName;
      if( $(this).offset().top == flexTop ) {
         viewName = this.id.split('-')[0];
         $('.display-mode-box div').removeClass('view-active');
         $('.display-mode-' + viewName + 'view').addClass('view-active');
      }
      //console.log(this.id, $(this).offset().top, flexTop, flexScrollTop);
    });
    //console.log('.', this.scrollTop);
  }).trigger('scroll');



  setTimeout(function() {
    OursoPhone.calcThumbsSize();
  }, 500);
};




OursoPhone.ui.touchRipple = function(e, source, target, callback) {

  var svgCircle,
  x = e.pageX,
  y = e.pageY,
  $source = $(source),
  clickY = y - $source.offset().top,
  clickX = x - $source.offset().left,
  setX = parseInt(clickX),
  setY = parseInt(clickY)
  ;

  if(isNaN(setX) || isNaN(setY)) {
    // not a mouse click
    setX = 10;
    setY = 10;
  }

  target.append('<svg><circle cx="'+setX+'" cy="'+setY+'" r="'+0+'"></circle></svg>');

  svgCircle = $(target).find("circle");

  svgCircle.animate({
    "r" : $source.outerWidth()
  },{
    //easing: "easeOut",
    duration: 300,
    step : function(val){
      svgCircle.attr("r", val);
    },
    complete: function() {
      svgCircle.attr("r", 0);
      $source.find("svg").remove();
      if(callback) {
        callback();
      }
    }
  });
};




OursoPhone.ui.drawAlbum = function(album) {
  var $albumpicture,
  $albumtpl = TemplateStore.get('album-item'),
  albumTagList,
  html ='';

  if(album.streamable!==true) {
    console.warn('album is not sreamable', album);
    return;
  }
  if(album.embeddable_by!=='all') {
    console.warn('album is not embeddable', album);
    return;
  }

  OursoPhone.cache.album.store(album);

  OursoPhone.cache.album.fields.forEach(function(propName) {
    if(album[propName]==undefined || album[propName]==null || album[propName]=='') {
      switch(propName) {
        case 'full_name':
          album[propName] = album['username'];
        break;
        default:
          album[propName] = '';
      }
    }
  });

  if(album.downloadable===true) {
    //console.info('album "'+album.title+'" is downloadable');
    // set download link?
  }
  if (album.artwork_url != null && album.artwork_url.length > 0) {
    /* templating */
    $albumpicture = TemplateStore.get('album-picture').replaceArray(
      ["{album-cover}"],
      [album.artwork_url]
    );
  } else {
    $albumpicture = '<img src="'+OursoPhone.pixelTrans +'" />';
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
    TemplateStore.nl2br(album.description),
    album.artwork_url,
    $albumpicture
  ]);

  $(html).appendTo('#album-description');
  setTimeout(OursoPhone.on.tagInserted, 300);
};





OursoPhone.ui.drawTracks = function(track, index, thisArg) {
  // thisArg => all tracks
  var attributes = '';
  var $tracktpl = TemplateStore.get('track-item');
  var $trackpicture;
  var html = '';
  var linkType = '';
  var linkVal = '';
  var trackTagList = '';

  OursoPhone.cache.track.store(track);

  if( $('#playlist').attr('data-tag-id')!=0 ) {
    linkType = 'tag';
    linkVal = $("#playlist").attr('data-tag-id')
  } else {
    if( $('#playlist').attr('data-user')!='' ) {
      linkType = 'user';
      linkVal = $("#playlist").attr('data-user');
    } else {
      linkType = 'album';
      linkVal = $("#playlist").attr('data-album-id');
    }
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
    //console.info('track "'+track.title+'" is downloadable');
    // set download link?
  }
  if(track.download_url===undefined) {
    track.download_url = '';
  }
  if(track.track_type===null) {
    track.track_type = '';
  }
  // build attributes list
  OursoPhone.cache.trackList.fields.forEach(function(attr) {
    attributes += 'data-' + attr + '="' + OursoPhone.utils.attrEncode(track[attr]) + '" ';
  });
  if (track.artwork_url != null && track.artwork_url.length > 0) {
    /* templating */
    $trackpicture = TemplateStore.get('track-picture').replaceArray(
      ["{track-artwork-url}", "{track-title}"],
      [track.artwork_url, OursoPhone.utils.htmlEncode(track.title)]
    );
  } else {
    $trackpicture = '<img src="'+OursoPhone.pixelTrans +'" />';//TemplateStore.get('track-no-picture');
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
    "{track-download-url}",
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
    TemplateStore.nl2br(track.description),
    track.track_type,
    track.permalink_url,
    track.download_url,
    '#'+linkType+':'+ linkVal + ':track:'+ track.id,
    attributes,
    track.id,
    $trackpicture,
    OursoPhone.utils.htmlEncode(track.title)
  ]);
  $(html).appendTo('#playlist');
};





OursoPhone.ui.drawTrackInfo = function(track) {
  var trackBoxContainer, trackBox;

  // todo : build it instead of cloning it
  trackBox = $('#playlist trackbox[data-index="'+ track.id +'"]').clone();

  if(!trackBox.length) {
    // trackBox is being drawn before the trackList is rendered
    OursoPhone.ui.drawTracks( track );
    trackBoxContainer = $('#playlist trackbox[data-index="'+ track.id +'"]').parent();
    trackBox = trackBoxContainer.find('trackbox').clone();
    trackBoxContainer.remove();
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
  $('#track-description').html('').append( trackBox );

  if(OursoPhone.config.isInWebView) {

    $(trackBox).find('.track-titlespan').on('click', function() {

      var downloadUrl = $(this).attr('data-download-url'),
      downloadTitle = $(this).text();
      console.log(downloadUrl);

      var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
      }
      /*
        $.ajax({
          type: "HEAD",
          async: true,
          url: downloadUrl + '?client_id=' + OursoPhone.config.scClientID,
          success: function(message, txt, response){
            console.log('HEAD:', message,txt, response.getAllResponseHeaders());
          }
        }); return;
      */
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
        fileSystem.root.getFile("dummy.html", {create: true,exclusive: false}, function gotFileEntry(fileEntry) {
          var sPath = fileEntry.toURL().replace("dummy.html", "");
          var fileTransfer = new FileTransfer();
          fileTransfer.onprogress = function(progress) {
            var percent = progress.loaded/progress.total;
            //console.log('progress', );
          }

          fileEntry.remove();
          var DBuri = encodeURI(downloadUrl + '?client_id=' + OursoPhone.config.scClientID);
          console.log('will download', DBuri, sPath);

          fileTransfer.download(DBuri, sPath + downloadTitle, function (theFile) {
            console.log("download complete: " + theFile.toURL(), theFile, this);
            //console.log(theFile.toURL());
          }, function (error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code: " + error.code);
          });
        }, fail);
      }, fail);
    });
  }

  setTimeout(OursoPhone.on.tagInserted, 300);
},





OursoPhone.ui.drawComment = function(comments){
  var firstComment = comments[0],
  userComment,
  blockComment,
  userAvatar,
  userLink,
  text = "",
  htmlComment,
  $comments;

  if(!OursoPhone.config.showComments){
    return;
  }

  /*
  userLink.on('click', function(e) {
    if( OursoPhone.config.isFeedbackEnabled ) {
      OursoPhone.ui.vibrate(e);
    }
    OursoPhone.ui.resolveUser(firstComment.user.id);
    return false;
  });
  */

  // avoid duplicates (it CAN happen when rewinding a track)
  if(! $('#comments li[data-id="'+ firstComment.id +'"]').length) {

    htmlComment = TemplateStore.get('comment-item').replaceArray([
      '{src}',
      '{alt}',
      '{title}',
      '{target}',
      '{href}',
      '{comment}',
      '{timestamp}'
    ],[
      firstComment.user.avatar_url,
      firstComment.user.username,
      firstComment.user.username,
      "_self",
      "#user:" + firstComment.user.id,
      firstComment.body,
      '(@' +Math.floor(firstComment.timestamp / 1000) + "s): "
    ]);
    $(htmlComment).on('click', function(e) {
      if( OursoPhone.config.isFeedbackEnabled ) {
        OursoPhone.ui.vibrate(e);
      }
      OursoPhone.ui.resolveUser(firstComment.user.id, false)
      return false;
    }).appendTo('#comments');
  }

  $comments = $('#comments');
  $comments.stop(true, true).animate({scrollTop: $comments.prop("scrollHeight")}, 300);
};




OursoPhone.ui.handleResolvedUser = function(user, error) {
  if(error) {
    console.log('HTTP Error', error);
    alert("User not found");
  } else {
    if(user.id) {
      OursoPhone.cache.user.store(user);
      OursoPhone.on.userResolved(user);
    } else {
      console.warn('handleResolvedUser: nothing found');
    }
  }
};



OursoPhone.ui.handleResolveError = function(response) {
  if(response.errors) {
    console.warn("HTTP Error while resolving user: user does not exists", response.errors);
    alert("User not found");
  } else {
    if(response.length>0) {

      OursoPhone.currentTrackList = response;
      OursoPhone.cache.trackList.store(response);

      $('#playlist').attr('data-tag-id', '0');
      $('#playlist').attr('data-album-id', '0');
      //$('#playlist').attr('data-user', response[0].user_id);
      OursoPhone.on.userResolved({id:response[0].user_id});
    } else {
      console.warn("User has an empty track list");
    }
  }
};



OursoPhone.ui.resolveUser = function(searchStr, loadTrackList) {
  var tracksInCache = false,
  userInCache = OursoPhone.cache.user.find( searchStr );

  if( userInCache ) {

    if( loadTrackList !== false ) {

      tracksIncache = OursoPhone.cache.trackList.find( userInCache );

      if( tracksIncache ) {
        $('#playlist').attr('data-tag-id', '0');
        $('#playlist').attr('data-album-id', '0');
        $('#playlist').attr('data-user', userInCache.id);
        OursoPhone.on.trackListLoaded( tracksIncache );
        return;
      }

    } else {
      // only draw user and return ?
      OursoPhone.ui.drawUser( userInCache );
      return;
    }
  }

  if(/^[a-z0-9 _\-]+$/gi.test(searchStr)) {
    // user ID or permalink
    if( loadTrackList !== false ) {
      SC.get('/users/' + searchStr + '/tracks', {
        filter:'streamable',
        order: 'created_at'
      }, OursoPhone.ui.handleResolveError);
    } else {
      SC.get('/users/'+searchStr, OursoPhone.ui.drawUser);
    }

  } else {
    // user Name (WARNING XSS IN PROGRESS)
    console.log('will resolve', searchStr);
    // pale attempt to convert user data to SoundCloud user permalink
    // success rate must be very low and give accidental results
    searchStr = searchStr.replace(/ /g, '-');
    SC.get('/resolve', {
      url: 'https://soundcloud.com/' + searchStr
    }, OursoPhone.ui.handleResolvedUser);
  }
};




OursoPhone.ui.drawUser = function(user, error) {
  var $usertpl = TemplateStore.get('user-item'),
      $userBlock = $('#user-description'),
      lastY,
      html = '';

  OursoPhone.cache.user.store( user );

  OursoPhone.cache.user.fields.forEach(function(propName) {
    if(user[propName]==undefined || user[propName]==null || user[propName]=='') {
      switch(propName) {
        case 'full_name':
          user[propName] = user['username'];
        break;
        default:
          user[propName] = '';
      }
    }
  });

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
    TemplateStore.nl2br(user.description),
    user.website,
    user.website_title,
    user.track_count,
    user.playlist_count,
    user.followers_count,
    user.followings_count
  ]);

  $userBlock.removeClass('contracted').html(html);
  $userBlock.trigger('init');

  $userBlock.find('.user-playlistcount').on('click', function() {
    if( parseInt( $(this).text() ) <= 0 ) {
      return false;
    }

    OursoPhone.config.scUserID = $(this).attr('data-user-id');
    location.href = '#';

  });

  if(OursoPhone.config.gestureLoaded) {
    // this sucks
    return;

    $userBlock.off().on('touchstart', function(e) {
      lastY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
    });
    $userBlock.on('touchmove', function(e) {
      var currentY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
      if (currentY > lastY) {
        console.log('moving down');
        $('.waveform-holder').removeClass('contracted');
      } else {
        $('#user-description').addClass('contracted');
      }
    });
    $userBlock.on('click', function(e) {
      if( OursoPhone.config.isFeedbackEnabled ) {
        OursoPhone.ui.vibrate(e);
      }
      console.log('user toggle');
      $('.waveform-holder').toggleClass('contracted');
    });
  }

};



