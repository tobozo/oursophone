    var Route = {
      // default : load playlist from user profile
      default: function(args) {
        // not arguments given, show albums. TODO : play first song from first album ?
        $('#playlist').attr('data-song-id', 0).attr('data-album-id', 0).attr('data-tag-id', 0).attr('data-user', '');
        SC.get('/users/' + OursoPhone.config.scUserID + '/playlists', OursoPhone.on.playlistsGet);
        SC.get('/users/' + OursoPhone.config.scUserID, OursoPhone.ui.drawUser);
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
          if (!(/^[0-9]+$/gi.test(args[1]))) {
            console.warn('Route: bad hash entry');
            return;
          }
          Route.list.album(args);
        },
        album: function(args) { 
          if( args[1] != $('#playlist').attr('data-album-id') ) {
            $('#playlist').attr('data-tag-id', 0);
            SC.get('/playlists/' + args[1], OursoPhone.on.playlistLoaded);
          }
        },
        tagdispatch: function(args) {
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
        },
        userdispatch: function(args) {
          // user permalink
          if(!(/^[a-z0-9 _\-]+$/gi.test(args[1]))) {
             console.warn('Route: bad user name');
             return;
          }
          Route.list.user(args);
        },
        user: function(args) {
          var  userInCache = OursoPhone.userCache.find(args[1]),
             tracksInCache = OursoPhone.trackListCache.find({id: args[1]});
             
          $('#playlist').attr('data-user', args[1]);

          if( userInCache ) {
            //console.log('route user in cache');
            OursoPhone.ui.drawUser( userInCache );
          } else {
            //console.log('route user NOT in cache');
            SC.get('/users/'+ args[1], OursoPhone.ui.drawUser);
          }
          
          if( tracksInCache ) {
            //console.info('route tracklist in cache');
            OursoPhone.on.trackListLoaded( tracksInCache );
          } else {
            //console.log('route tracklist NOT in cache');
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
              Route.play.album(args);
              break;
            case 'tag':
              Route.play.tag(args);
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
    


