    
    var OursoPhone = {
      
      config: {
        scClientID: "0ec3a92db08c758a47397bf8d588a250", /* STRING : a valid SoundCloud Client ID */
        scUserID: /*305413, //*/61698493, /* INT    : SoundClound user ID to fetch the playlists from */
        CORSRelay: false,   /* Priv.  : changing this has no effect */
        autoplay: true,     /* BOOL   : will automatically play the next song in the current album/taglist */
        theme: 'default',   /* STRING : must be in /css folder and named oursophone.theme.[string].css */
        showComments: false, /* BOOL   : will display comments while playing songs */
        isInWebView: !!window._cordovaNative,
        isFeedbackEnabled: false, /* BOOL : can use haptic feecback */
        gestureLoaded: false, /* Priv.: will be set when library is loaded */
        thumbs: {
          autoresize: true, /* BOOL : enable dynamic thumbs resize on document load/resize */
          rowsperalbum: 4,  /* INT  : amount of thumbnails per row for album thumbs */
          rowspertrack: 5   /* INT  : amount of thumbnails per row for track thumbs */
        }
      },
      currentPlayer: undefined, /* shortcut to the SoundManager instance */
      currentTrack: undefined, /* shortcut to the track playing */
      graphUpdater: undefined, /* animationFrame used to update the graph */
      localStorage: function() {
        try {
          localStorage.setItem(mod, mod);
          localStorage.removeItem(mod);
          return true;
        } catch(e) {
          return false;
        }
      },
      userCache: {
        /* TODO: persistent data store */
        byid: { },
        byusername: { },
        bypermalink: { },
        store: function(user) {
          ['id', 'username', 'permalink'].forEach(function(prop) {
            // TODO: find better than using property name as search criteria
            var ucprop   = 'by' + prop;
            var propname = user[prop];
            if(propname) {
              OursoPhone.userCache[ucprop][propname] = user;
            }
          });
        },
        find: function(criteria) {
          if( OursoPhone.userCache.byid[criteria] ) return OursoPhone.userCache.byid[criteria];
          if( OursoPhone.userCache.byusername[criteria] ) return OursoPhone.userCache.byusername[criteria];
          if( OursoPhone.userCache.bypermalink[criteria] ) return OursoPhone.userCache.bypermalink[criteria];
        },
        fields: ['id', 'kind', 'full_name', 'permalink_url', 'avatar_url', 'description',
        'website', 'website_title', 'track_count', 'playlist_count', 'followers_count',
        'followings_count']
      },
      trackListCache: {
        /* TODO: persistent data store */
        byuser: { },
        byalbum: { },
        store: function(tracklist) {
          //console.log('will store tracklist', {tracklist:tracklist});
          OursoPhone.trackListCache.byuser[ tracklist[0].user.id ] = tracklist;
        },
        find: function(user) {
          //console.log('trackListCache searching for', user, user.id);
          return OursoPhone.trackListCache.byuser[ user.id ]; 
        },
        fields: ['id', 'title', 'uri', 'duration', 'commentable', 'description', 'artwork_url']
      },
      waveformData: undefined, 
      waveformWidth: undefined,
      pixelTrans:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      templates: ['index', 'album-goback', 'album-item', 'album-no-picture', 'album-picture', 'track-item', 'track-no-picture', 'track-picture', 'user-item', 'view-mode-control', 'comment-item'],
     
      loadTemplates: function() {
        var template = OursoPhone.templates.shift();
        if(template!==undefined) {
          TemplateStore.load(template, OursoPhone.loadTemplates);
        } else {
          OursoPhone.start();
        }
      },
      
      init: function(options) {
        if(options) {
          console.log('merging options', OursoPhone.config, options);
          OursoPhone.config = $.extend(OursoPhone.config, options); // Overwrite settings
        }
        
        if( OursoPhone.localStorage ) {
          
          options = JSON.parse(localStorage.getItem('oursophone-config'));
          if(options!==null) {
            OursoPhone.config = $.extend(OursoPhone.config, options); // Overwrite settings
          }
          
        }
        
        // enable vibration support
        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
        
        if (navigator.vibrate) {
          // vibration API supported
          OursoPhone.config.isFeedbackEnabled = true;
          // use HTML5 vibration API
          OursoPhone.ui.vibrate = function() {
            navigator.vibrate(100);
          }
        }
        
        if(OursoPhone.config.isInWebView) {
          OursoPhone.config.thumbs.autoresize = false;
          OursoPhone.config.theme = 'mobile';
          OursoPhone.config.gestureLoaded = true;
          
          OursoPhone.config.isFeedbackEnabled = function() { 
            /* check for Cordova device-feedback plugin existence */
            return !!window.plugins && window.plugins.deviceFeedback; 
          };
          
          OursoPhone.ui.vibrate = function(e) {
            DF = window.plugins.deviceFeedback;
            DF.haptic(DF.VIRTUAL_KEY);
          }
          
        } else {
          if(OursoPhone.config.thumbs.autoresize) {
            $(window).on('resize', OursoPhone.calcThumbsSize);
          }
        }
        
        // template populating for the lazy
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
          req.open('HEAD', document.location.pathname, false);
          req.send(null);
          var headers = req.getAllResponseHeaders().toLowerCase();
          // assume the relay is php
          return !!/php/i.test(headers);
        }
        
        var hasRuby = function() {
          var req = new XMLHttpRequest();
          // query self to get headers
          req.open('GET', document.location.pathname, false);
          req.send(null);
          var headers = req.getAllResponseHeaders().toLowerCase();
          //console.log(headers);
          // assume the relay is php
          return !!/ruby/i.test(headers);
        }
        
        if(hasPhp()) {
          // enable waveform animated plugin
          OursoPhone.config.CORSRelay = document.location.pathname;
        } else {
          if(hasRuby()) {
            OursoPhone.config.CORSRelay = document.location.pathname;  
          } else {
            $('#canvas-overlay').addClass('no-colors');
          }
        }
        
        OursoPhone.loadTheme(function() {
          
          try {
            // take a guess if templates are in the html body
            OursoPhone.start();
          } catch(e) {
            // templates are not in the body, load them from their folder
            OursoPhone.loadTemplates();
          }
          
        });
        
        return this;

      },
      
      loadTheme: function(callback) {
        if( !/^[a-z0-9_\-]+$/i.test(OursoPhone.config.theme) ) {
          callback();
          return;
        }

        $('style[id^="oursophone-theme"]').remove();
        
        $.ajax({
          url: 'css/oursophone.theme.' + OursoPhone.config.theme + '.css',
          dataType: 'text',
          success: function(css) {
            $('<style type="text/css" id="oursophone-theme-'+ OursoPhone.config.theme +'">\n' + css + '</style>').appendTo("head");
            callback();
          },
          error: function() {
            console.warn('invalid theme in OursoPhone.config.theme: ', OursoPhone.config.theme);
            callback();
          }
        });
        
      },
      
      start: function() {
        var indexHTML;
        TemplateStore.init();
        indexHTML = TemplateStore.get('index').replaceArray(
          ["{pixel-trans}"], 
          [OursoPhone.pixelTrans]
        );
        $(indexHTML).appendTo('body');
        window.onhashchange = OursoPhone.onRouteChanged;
        OursoPhone.onRouteChanged();
        OursoPhone.ui.init();
      },
      
      calcThumbsSize: function() {
        /* will autoresize thumbnails to fit the number of columns (see config) */
        var wSize;
        var trackWidth;
        var albumWidth;
        var trackMargin = 0;
        var albumMargin = 0;
        var scrollBarWidth = 0;
        var lastStylesheet = document.styleSheets[document.styleSheets.length-1];
        var lastRuleIndex;
        var rule;
        var $scrollBarChecker;

        $scrollBarChecker = $('<div id="scrollbar-checker"></div>');
        $scrollBarChecker.appendTo('#playlist');
        if( $scrollBarChecker.width()>0 && $('#playlist').width() != $scrollBarChecker.width() ) {
          // scrollbar detected
          wSize = $scrollBarChecker.width();
          console.log('scrollbar detected', $('#playlist').width() , $scrollBarChecker.width());
        } else {
          wSize = $('#playlist').width();          
        }
        $scrollBarChecker.remove();

        trackWidth = wSize / OursoPhone.config.thumbs.rowspertrack;
        albumWidth = wSize / OursoPhone.config.thumbs.rowsperalbum;
        
        // the whole thumb box is resized based on the child img's width
        // but outer containers may have margin/border
        // TODO : find a better way to calculate the width delta
        try {
          trackMargin = ($('#playlist .track').css('marginLeft').split('px')[0]- -$('#playlist .track').css('marginRight').split('px')[0])
            - -( $('#playlist .track').outerWidth() - $('#playlist .track img').width() )
          ;
        } catch(e) { ; }
        try {
          albumMargin = ($('#playlist .album').css('marginLeft').split('px')[0]- -$('#playlist .album').css('marginRight').split('px')[0])
            - -( $('#playlist .album').outerWidth() - $('#playlist .album img').width() )
          ;
        } catch(e) { ; }
        
        for(var i=0; i<lastStylesheet.cssRules.length; i++) { 
          rule = $.trim( lastStylesheet.cssRules[i].cssText.split('{')[0] );
          if( rule == '[data-display-mode="thumb"] .track img' 
           || rule == '[data-display-mode="thumb"] .track .track-picture' 
           || rule == '[data-display-mode="thumb"] .album img'
           || rule == '[data-display-mode="thumb"] .album .album-picture' 
           || rule == '[data-display-mode="thumb"] .track .track-title' ) {
            lastStylesheet.deleteRule(i);
            i--;
          }
        }
        lastStylesheet.insertRule(
          '[data-display-mode="thumb"] .track img { width: ' + Math.floor( trackWidth - trackMargin ) + 'px }', 
          lastStylesheet.cssRules.length-1
        );
        lastStylesheet.insertRule(
          '[data-display-mode="thumb"] .track .track-picture { width: ' + Math.floor( trackWidth - trackMargin ) + 'px }', 
          lastStylesheet.cssRules.length-1
        );
        lastStylesheet.insertRule(
          '[data-display-mode="thumb"] .album .album-picture { width: ' + Math.floor( albumWidth - albumMargin ) + 'px }', 
          lastStylesheet.cssRules.length-1
        );
        lastStylesheet.insertRule(
          '[data-display-mode="thumb"] .album img { width: ' + Math.floor( albumWidth - albumMargin ) + 'px }', 
          lastStylesheet.cssRules.length-1
        );
        lastStylesheet.insertRule(
          '[data-display-mode="thumb"] .track .track-title { font-size: ' + ( trackWidth/100 ).toFixed(2) + 'em }',
          lastStylesheet.cssRules.length-1
        );                        
        
        if(OursoPhone.config.thumbs.autoresize !== true) {
          $('.album').css({maxHeight: $('.album').width() })
        }
        
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
            if(currentPlayer.paused===false) {
              currentPlayer.pause();
            }
          }
          OursoPhone.utils.interfaceRelease()
        },
        
        play: function() {
          var currentPlayer = OursoPhone.player.getCurrent()
          if(currentPlayer) {
            if(currentPlayer.paused===true) {
              currentPlayer.play();
            }
          }
          OursoPhone.utils.interfaceRelease();
        },
        
        next: function() {
          var $playlist,
            playlistProps,
            currentTrack,
            nextTrackHash = false,
            album_id,
            track_id
          ;
          
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
              if( trackIndex+1 < OursoPhone.currentTrackList.length ) {
                if(  OursoPhone.currentTrackList[trackIndex+1].id !== undefined 
                  && OursoPhone.currentTrackList[trackIndex+1].id !==null) {
                  nextTrackHash = '#'+linkType+':' + linkVal + ':track:' + OursoPhone.currentTrackList[trackIndex+1].id;   
                }
              }
            }
           
          });
          
          if(nextTrackHash) {
            location.href = nextTrackHash;
          } else {
            OursoPhone.utils.interfaceRelease();
          }
        },
        
        prev: function() {
          var $playlist,
            playlistProps,
            currentTrack,
            nextTrackHash = false,
            album_id,
            track_id
          ;
          
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
        
        animateWaveformData: function(waveformData) {
          console.log('storing waveformData', waveformData);
          OursoPhone.player.setWaveformData(waveformData);
          if(waveformData!==undefined) {
            cancelAnimationFrame( OursoPhone.on.dataWaveformReady );
            requestAnimationFrame(OursoPhone.on.dataWaveformReady);
          } else {
            alert('dahoops');
          }
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
        
        playerClick: function(e) {
          
          if( OursoPhone.config.isFeedbackEnabled ) {
            OursoPhone.ui.vibrate(e); 
          }
          
          if($(this).attr('data-href')!='') {
            if(location.hash!=$(this).attr('data-href')) {
              location.href = $(this).attr('data-href');
            }
          }
          return false;
        },

        tagListLoaded: function(tracks) {
          var $playlist = $("#playlist");
          
          OursoPhone.currentTrackList = tracks;
          
          $playlist.fadeOut(150);
          $playlist.html('').attr('data-album-id', 0).attr('data-display-mode', 'list');
          
          tracks.forEach( OursoPhone.ui.drawTracks );
          setTimeout(OursoPhone.on.tagInserted, 300);
          
          // TODO : use internal route
          $('trackbox').off().on('click', OursoPhone.on.playerClick);
          $playlist.fadeIn(150);
          
          if(OursoPhone.config.isInWebView) {
            $('#playlist').attr('data-display-mode', 'thumb');
          }
          
          OursoPhone.utils.interfaceRelease();
          OursoPhone.calcThumbsSize();
        },

        trackListLoaded: function(tracks) {
          var $playlist = $("#playlist");
          
          OursoPhone.currentTrackList = tracks;
          OursoPhone.trackListCache.store(tracks);
          
          $playlist.fadeOut(150);
          $playlist.html('').attr('data-album-id', 0).attr('data-display-mode', 'list');
          
          tracks.forEach( OursoPhone.ui.drawTracks );
          setTimeout(OursoPhone.on.tagInserted, 300);
          
          $('trackbox').off().on('click', OursoPhone.on.playerClick);
          
          $playlist.fadeIn(150);
          
          if(OursoPhone.config.isInWebView) {
            $('#playlist').attr('data-display-mode', 'thumb');
          }
          
          OursoPhone.utils.interfaceRelease();
          OursoPhone.calcThumbsSize();
        },
        
        playlistLoaded:  function(playlist) {
          var $playlist = $("#playlist"), $currentSound;
          $playlist.fadeOut(150);
          $playlist.html('').attr('data-album-id', playlist.id);
          
          OursoPhone.currentTrackList = playlist.tracks;
          
          [playlist].forEach( OursoPhone.ui.drawAlbum );
          
          playlist.tracks.forEach( OursoPhone.ui.drawTracks );
          
          setTimeout(OursoPhone.on.tagInserted, 300);
          
          $('trackbox').off().on('click', OursoPhone.on.playerClick);            
          $('albumbox').off().on('click', OursoPhone.on.playerClick);
          
          $('trackbox').removeClass('active');
          
          $playlist.fadeIn(150);
          
          if( $('#user-description .user-id').text() != playlist.user.id ) {
            var userInCache = OursoPhone.userCache.find(track.user.id);
            if( userInCache ) {
              OursoPhone.ui.drawUser( userInCache );
            } else {
              SC.get('/users/'+track.user.id, OursoPhone.ui.drawUser);
            }
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
          
          if(OursoPhone.config.isInWebView) {
            $('#playlist').attr('data-display-mode', 'thumb');
          }
          
          OursoPhone.utils.interfaceRelease();
          OursoPhone.calcThumbsSize()
        },
        
        playlistsGet: function(playlists) {
          var $playlist = $("#playlist");
          $playlist.fadeOut(150);
          $playlist.html('').attr('data-album-id', null).attr('data-song-id', null);
          playlists.forEach( OursoPhone.ui.drawAlbum );
          $('albumbox').on('click', OursoPhone.on.playerClick);
          $playlist.fadeIn(150);
          OursoPhone.calcThumbsSize()
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
            // TODO : autoplay first song of the next album/tracklist/taglist
          }
        },
        
        trackInfo: function(track, error) {
          var url, urlImg, urlData,
              currentPlayer = OursoPhone.player.getCurrent(),
              $canvasOverlay, $img, imageObj, userInCache,
              onTimedComments = null;
          
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
            console.log('on.trackInfo', track); 
          }
          
          OursoPhone.currentTrack = track;
          OursoPhone.ui.drawTrack(track);

          $('#playlist').attr('data-song-id', OursoPhone.currentTrack.id);
          
          $('trackbox').removeClass('active');
          $('trackbox[data-index="'+ OursoPhone.currentTrack.id +'"]').addClass('active');

          if( currentPlayer ) {
            currentPlayer.pause();
          }
          
          SC.stream("/tracks/" + OursoPhone.currentTrack.id, {
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
                console.log('attaching context', this);
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
          
          userInCache = OursoPhone.userCache.find(track.user.id);
          
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
          
          $img.attr('src', track.waveform_url);
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
          
        },
        
        userResolved: function(user) {
          if(user.id) {
            OursoPhone.config.scUSerID = user.id;
            location.href = '#user:' + user.id;
          }
        },
        
        tagInserted: function() {
          $('tag').off().on('click', function() {
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
          // inject the view controls
          var $viewModeControl = TemplateStore.get('view-mode-control');
          $($viewModeControl).appendTo('#controls');
          
          $('.display-mode-box div').off().on('click', function(e) {
            
            if( OursoPhone.config.isFeedbackEnabled ) {
              OursoPhone.ui.vibrate(e); 
            }
            
            var mode = this.className.split('-')[2];
            if(mode==='up') {
              location.href = '#';
              return false;
            }
            $('#playlist').attr('data-display-mode', mode);
          });
          
          // Get the canvas & its context, width, and height.
          $('#canvas-overlay').on('mousedown', function(evt) {
            
            if( OursoPhone.config.isFeedbackEnabled ) {
              OursoPhone.ui.vibrate(evt); 
            }
            
            var pos = (evt.pageX - $(this).offset().left) / $(this).width();
            var currentPlayer = OursoPhone.player.getCurrent();
            var currentduration = currentPlayer.duration;
            var newPosition = (currentduration*pos).toFixed(0);
            currentPlayer.setPosition(newPosition);
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
              console.log('saving config');
              localStorage.setItem('oursophone-config', JSON.stringify( OursoPhone.config ) ); 
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
            if( OursoPhone.localStorage ) {
              console.log('saving config');
              localStorage.setItem('oursophone-config', JSON.stringify( OursoPhone.config ) ); 
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
          setTimeout(function() {
            OursoPhone.calcThumbsSize();
          }, 500);
        },
        
        touchRipple: function(e, source, target, callback) {
          
          var svgCircle;
          var x = e.pageX;
          var y = e.pageY;
          var clickY = y - $(source).offset().top;
          var clickX = x - $(source).offset().left;
          //var box = source;
          
          var setX = parseInt(clickX);
          var setY = parseInt(clickY);
          
          target.append('<svg><circle cx="'+setX+'" cy="'+setY+'" r="'+0+'"></circle></svg>');
          
          svgCircle = $(target).find("circle");
          
          svgCircle.animate({
            "r" : $(source).outerWidth()
          },{
            //easing: "easeOut",
            duration: 300,
            step : function(val){
              svgCircle.attr("r", val);
            },
            complete: function() {
              svgCircle.attr("r", 0);
              $(source).find("svg").remove();                    
              if(callback) {
                callback();
              }
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
            console.info('track "'+track.title+'" is downloadable');
            // set download link?
          }
          if(track.download_url===undefined) {
            track.download_url = ''; 
          }
          if(track.track_type===null) {
            track.track_type = ''; 
          }          
          // build attributes list
          OursoPhone.trackListCache.fields.forEach(function(attr) {
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
        },
        
        drawTrack: function(track) {
          var trackBox = $('#playlist trackbox[data-index="'+ track.id +'"]').clone();
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
              });
              return;*/
              
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
        
        drawComment: function(comments){
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
            OursoPhone.ui.resolveUser(firstComment.user.id)
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
        },

        handleResolvedUser: function(user, error) {
          if(error) {
            console.log('HTTP Error', error);
            alert("User not found");
          } else {
            if(user.id) {
              OursoPhone.userCache.store(user);
              OursoPhone.on.userResolved(user);
            } else {
              console.warn('handleResolvedUser: nothing found');
            }
          }
        },
        handleResolveError: function(response) {
          if(response.errors) {
            console.warn("HTTP Error while resolving user: user does not exists", response.errors);
            alert("User not found");
          } else {
            if(response.length>0) {

              OursoPhone.currentTrackList = response;
              OursoPhone.trackListCache.store(response);
              
              $('#playlist').attr('data-tag-id', 0);
              $('#playlist').attr('data-album-id', 0);
              $('#playlist').attr('data-user', response[0].user_id);
              OursoPhone.on.userResolved({id:response[0].user_id});
            } else {
              console.warn("User has an empty track list"); 
            }
          }
        },
        
        resolveUser: function(searchStr, loadTrackList) {
          var tracksInCache = false,
                userInCache = OursoPhone.userCache.find( searchStr );
                
          if( userInCache ) {
            
            if( loadTrackList !== false ) {

              tracksIncache = OursoPhone.trackListCache.find( userInCache );
              
              if( tracksIncache ) {
                $('#playlist').attr('data-tag-id', 0);
                $('#playlist').attr('data-album-id', 0);
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


        },
        
        drawUser: function(user, error) {
          var $usertpl = TemplateStore.get('user-item'),
            $userBlock = $('#user-description'),
                lastY;
          var html = '';
          
          OursoPhone.userCache.store( user );
          
          OursoPhone.userCache.fields.forEach(function(propName) {
            if(user[propName]==undefined || user[propName]==null) {
              user[propName] = '';
            }
          })
          
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
          
        }
      }
    };
    