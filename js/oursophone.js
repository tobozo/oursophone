
    
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
      templates: ['album-goback', 'album-item', 'album-no-picture', 'album-picture', 'track-item', 'track-no-picture', 'track-picture', 'user-item', 'view-mode-control'],
      loadTemplates: function() {
        var template = OursoPhone.templates.shift();
        if(template!==undefined) {
          TemplateStore.load(template, OursoPhone.loadTemplates);
        } else {
          window.onhashchange = OursoPhone.onRouteChanged;
          TemplateStore.init();
          OursoPhone.onRouteChanged();
          OursoPhone.ui.init();
        }
      },
      init: function() {
        
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
          console.log(headers);
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
            $('#canvas-overlay').css({color:'black'});
          }
        }
        
        try {
          // take a guess if templates are in the html body
          TemplateStore.init();
          window.onhashchange = OursoPhone.onRouteChanged;
          OursoPhone.onRouteChanged();
          OursoPhone.ui.init();          
        } catch(e) {
          // templates are not in the body, load them from their folder
          OursoPhone.loadTemplates();
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
            
            $.get(OursoPhone.config.CORSRelay + '?w=' + urlData, function(data) {
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
    