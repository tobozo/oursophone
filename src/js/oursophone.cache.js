

OursoPhone.cache = {
  size: "",
  hsize: function(fileSizeInBytes) { /* human readable size */
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  },
  lastWrite: null,
  lifeTime: 86400, // TODO : tweak this
  autoSaveFreq: 10, // check if config needs saving every N seconds
  autoSave: function() {
    if( OursoPhone.cache.lastWrite === null ) {
      // not modified
      return;
    }
    if( (0- -OursoPhone.cache.lastWrite + OursoPhone.cache.autoSaveFreq*1000) < Date.now() ) {
      // no update during the last interval
      return;
    }
    // update hit !
    OursoPhone.cache.store();
  },
  store: function() {
    var cacheData;
    if( OursoPhone.localStorage ) {
      console.info('freezing cache in localStorage');
      cacheData = {
        user: {
          byid: OursoPhone.cache.user.byid,
          byusername: OursoPhone.cache.user.byusername,
          bypermalink: OursoPhone.cache.user.bypermalink
        },
        track: {
          byid: OursoPhone.cache.track.byid
        },
        trackList:{
          byuser: OursoPhone.cache.trackList.byuser,
          byalbum: OursoPhone.cache.trackList.byalbum
        },
        album: {
          byid: OursoPhone.cache.album.byid
        },
        tagList: {
          bytag: OursoPhone.cache.tagList.bytag
        },
        playList: {
          byuser: OursoPhone.cache.playList.byuser
        }
      };
      cacheData.cached_at = Date.now();
      cacheData = JSON.stringify( cacheData );
      localStorage.setItem('oursophone-cache', cacheData);
      OursoPhone.cache.size = OursoPhone.cache.hsize( cacheData.length );
      $('oursophone').attr('data-size', OursoPhone.cache.size );
    }
  },
  restore: function() {
    var cacheData;
    if( OursoPhone.localStorage ) {
      cacheData = localStorage.getItem('oursophone-cache');
      //console.log('cache data', cacheData);
      if(cacheData === null) return;
      OursoPhone.cache.size = OursoPhone.cache.hsize( cacheData.length );
      $('oursophone').attr('data-size', OursoPhone.cache.size );
      cacheData = JSON.parse(cacheData);
      if(cacheData!==null) {
        // jquery extends
        console.info('unfreezing cache from localStorage', cacheData);
        OursoPhone.cache.user.byid = cacheData.user.byid;
        OursoPhone.cache.user.byusername = cacheData.user.byusername;
        OursoPhone.cache.user.bypermalink = cacheData.user.bypermalink;
        OursoPhone.cache.track.byid = cacheData.track.byid;
        OursoPhone.cache.trackList.byuser = cacheData.trackList.byuser;
        OursoPhone.cache.trackList.byalbum = cacheData.trackList.byalbum;
        OursoPhone.cache.album.byid = cacheData.album.byid;
        OursoPhone.cache.tagList.bytag = cacheData.tagList.bytag;
        OursoPhone.cache.playList.byuser = cacheData.playList.byuser;
      }
    }
  },
  clean: function() {
    if( OursoPhone.localStorage ) {
      localStorage.removeItem('oursophone-cache');
    }
  },
  stamp: function(obj) {
    if(obj.cached_at===undefined) {
      obj.cached_at = Date.now();
      OursoPhone.cache.lastWrite = obj.cached_at;
      console.log('stamping obj', {obj:obj, stamp: obj.cached_at});
    } else {
      console.log('obj already stamped', {obj:obj, stamp:obj.cached_at});
    }
    return obj;
  },
  user: {
    byid: { },
    byusername: { },
    bypermalink: { },
    store: function(user) {
      if( OursoPhone.cache.user.byid[ user.id ] !== undefined ) {
        // don't overwrite
        return;
      }
      user = OursoPhone.cache.stamp( user );
      ['id', 'username', 'permalink'].forEach(function(prop) {
        // TODO: find better than using property name as search criteria
        var ucprop   = 'by' + prop;
        var propname = user[prop];
        if(propname) {
          OursoPhone.cache.user[ucprop][propname] = user;
        }
      });
    },
    find: function(criteria) {
      if( OursoPhone.cache.user.byid[criteria] ) return OursoPhone.cache.user.byid[criteria];
      if( OursoPhone.cache.user.byusername[criteria] ) return OursoPhone.cache.user.byusername[criteria];
      if( OursoPhone.cache.user.bypermalink[criteria] ) return OursoPhone.cache.user.bypermalink[criteria];
      return false;
    },
    fields: ['id', 'kind', 'full_name', 'permalink_url', 'avatar_url', 'description',
    'website', 'website_title', 'track_count', 'playlist_count', 'followers_count',
    'followings_count']
  },
  track: {
    byid: { },
    store: function(track) {
      if( OursoPhone.cache.track.byid[ track.id ] !== undefined ) {
        // don't overwrite
        return;
      }

      track = OursoPhone.cache.stamp( track );
      OursoPhone.cache.track.byid[ track.id ] = track;
    },
    find: function(trackid) {
      if( OursoPhone.cache.track.byid[ trackid ]!== undefined ) {
        return OursoPhone.cache.track.byid[ trackid ];
      }
      return false;
    }
  },
  trackList: {
    byuser: { },
    byalbum: { },
    store: function(tracks) {
      if( OursoPhone.cache.trackList.byuser[ tracks[0].user.id ] !== undefined ) {
        // dont' overwrite
        return;
      }
      tracklist = OursoPhone.cache.stamp( {tracks:tracks} );
      OursoPhone.cache.trackList.byuser[ tracks[0].user.id ] = tracklist;
      OursoPhone.cache.store();
    },
    find: function(user) {
      if( OursoPhone.cache.trackList.byuser[ user.id ] !== undefined ) {
        return OursoPhone.cache.trackList.byuser[ user.id ].tracks;
      }
      return false;
    },
    fields: ['id', 'title', 'uri', 'duration', 'commentable', 'description', 'artwork_url']
  },
  album: {
    byid: { },
    store: function(album) {
      if( OursoPhone.cache.album.byid[ album.id ] !== undefined ) {
        // don't overwrite
        return;
      }
      album = OursoPhone.cache.stamp( album );
      OursoPhone.cache.album.byid[ album.id ] = album;
    },
    find: function(id) {
      return OursoPhone.cache.album.byid[ id ];
    },
    fields: ['id', 'kind', 'created_at', 'duration', 'track_count', 'genre', 'title', 'description', 'artwork_url']
  },
  tagList: {
    bytag: { },
    store: function(trackList) {
      var tracks;
      if( OursoPhone.cache.tagList.bytag[ trackList.tag ] !== undefined ) {
        // don't overwrite
        return;
      }
      tracks = OursoPhone.cache.stamp( {tracks: trackList.tracks} );
      OursoPhone.cache.tagList.bytag[ trackList.tag ] = tracks;
      OursoPhone.cache.store();
    },
    find: function(tag) {
      if( OursoPhone.cache.tagList.bytag[ tag ]!== undefined ) {
        return OursoPhone.cache.tagList.bytag[ tag ].tracks;
      }
      return false;
    }
  },
  playList: {
    byuser: { },
    store: function( albumList ) {
      var albums;
      if( OursoPhone.cache.playList.byuser[ albumList.userid ] !== undefined ) {
        // don't overwrite
        return;
      }
      albums = OursoPhone.cache.stamp({albums: albumList.albums});
      OursoPhone.cache.playList.byuser[ albumList.userid ] = albums;
      OursoPhone.cache.store();
    },
    find: function( user ) {
      if( OursoPhone.cache.playList.byuser[ user ] !== undefined ) {
        return OursoPhone.cache.playList.byuser[ user ].albums;
      }
      console.warn('playlist not found for user:', user);
      return false;
    }
  }
};
