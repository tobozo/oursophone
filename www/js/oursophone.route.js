    var Route = {
      // default : load playlist from user profile
      default: function(args) {
        var $playlist = $('#playlist'),
            userInCache,
            playListInCache;

        // not arguments given, show albums. TODO : play first song from first album ?
        $playlist.attr('data-album-id', 0).attr('data-tag-id', 0).attr('data-user', '');

        playListInCache = OursoPhone.cache.playList.find( OursoPhone.config.scUserID );

        if( playListInCache ) {
          OursoPhone.on.playlistsGet( playListInCache );
        } else {
          SC.get('/users/' + OursoPhone.config.scUserID + '/playlists', OursoPhone.on.playlistsGet);
        }

        userInCache = OursoPhone.cache.user.find( OursoPhone.config.scUserID );

        if( userInCache ) {
          OursoPhone.ui.drawUser( userInCache );
        } else {
          SC.get('/users/' + OursoPhone.config.scUserID, OursoPhone.ui.drawUser);
        }

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
            case 'user':
              Route.list.userdispatch(args);
            break;
          }
        },
        albumdispatch: function(args) {
          if (!(/^[0-9]+$/gi.test(args[1])) || args[1]==0) {
            console.warn('Route: bad hash entry');
            return;
          }
          Route.list.album(args);
        },
        tagdispatch: function(args) {
          // tag search
          if (!(/^[a-z0-9 ]+$/i.test(args[1])) || args[1]=='0') {
            console.warn('Route: bad hash entry');
            return;
          }
          Route.list.tag(args);
        },
        userdispatch: function(args) {
          // user permalink
          if(!(/^[a-z0-9 _\-]+$/gi.test(args[1])) || args[1]=='' || args[1]=='0') {
            console.warn('Route: bad user name');
            return;
          }
          Route.list.user(args);
        },
        album: function(args) {
          var $playlist = $('#playlist'),
              albumInCache,
              playListInCache;

          if( args[1] == $playlist.attr('data-album-id') ) {
            return;
          }

          $playlist.attr('data-tag-id', 0);
          $playlist.attr('data-user', '');
          $playlist.attr('data-album-id', args[1]);

          playListInCache = OursoPhone.cache.playList.find( OursoPhone.config.scUserID );

          if( playListInCache ) {
            // fine
            OursoPhone.on.playlistsGet( playListInCache );
          } else {
            SC.get('/users/' + OursoPhone.config.scUserID + '/playlists', OursoPhone.on.playlistsGet);
          }

          albumInCache = OursoPhone.cache.album.find(args[1]);

          if( albumInCache ) {
            OursoPhone.on.playlistLoaded( albumInCache );
          } else {
            SC.get('/playlists/' + args[1], OursoPhone.on.playlistLoaded);
          }

        },
        tag: function(args) {
          var $playlist = $('#playlist'),
            tagListInCache;

          if($playlist.attr('data-tag-id') == args[1]) {
            return;
          }

          $playlist.attr('data-album-id', 0).find('.album').remove();
          $playlist.attr('data-tag-id', args[1]);


          tagListInCache = OursoPhone.cache.tagList.find(args[1]);

          if( tagListInCache ) {
            OursoPhone.on.tagListLoaded( tagListInCache );
          } else {
            SC.get('/tracks/', { tags:args[1], filter:'streamable', order:'created_at' }, OursoPhone.on.tagListLoaded);
          }
        },
        user: function(args) {
          var  userInCache,
             tracksInCache,
                 $playlist = $('#playlist');

          if($playlist.attr('data-user') == args[1]) {
            return;
          }

          $('#playlist').attr('data-user', args[1]);

          userInCache = OursoPhone.cache.user.find(args[1]);

          if( userInCache ) {
            OursoPhone.ui.drawUser( userInCache );
          } else {
            SC.get('/users/'+ args[1], OursoPhone.ui.drawUser);
          }

          tracksInCache = OursoPhone.cache.trackList.find({id: args[1]});

          if( tracksInCache ) {
            OursoPhone.on.trackListLoaded( tracksInCache );
          } else {
            SC.get('/users/' + args[1] + '/tracks', OursoPhone.on.trackListLoaded);
          }

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

          switch(args[0]) {
            case 'album':
              Route.list.album(args);
              break;
            case 'tag':
              Route.list.tag(args);
              break;
            case 'user':
              Route.list.user(args);
          }

          // check if the requested song is not already playing
          if ( args[3] !=$('#playlist').attr('data-song-id')
            && args[3] !=$('#track-description trackbox[data-id="'+args[3]+'"]').attr('data-id') ) {
            Route.play.song(args);
          }

        },
        song: function(args) {
          OursoPhone.utils.interfaceLock();
          $('#playlist').attr('data-song-id', args[3]);
          SC.get('/tracks/' + args[3], OursoPhone.on.trackInfo);
        }
      }
    };



