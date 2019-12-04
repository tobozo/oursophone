
OursoPhone.config =  {
  scClientID: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", /* STRING : a valid SoundCloud Client ID */
  scUserID: 61698493, /* INT    : SoundClound user ID to fetch the playlists from */
  CORSRelay: false,   /* Priv.  : changing this has no effect */
  autoplay: true,     /* BOOL   : will automatically play the next song in the current album/taglist */
  theme: 'default',   /* STRING : must be in /css folder and named oursophone.theme.[string].css */
  showComments: false, /* BOOL   : will display comments while playing songs */
  loop: true, /* BOOL  : cycle through current tracklist, taglist or albumlist */
  isInWebView: !!(window._cordovaNative || window.__nwWindowId),
  isFeedbackEnabled: false, /* BOOL : can use haptic feecback */
  gestureLoaded: false, /* Priv.: will be set when library is loaded */
  thumbs: {
    autoresize: true, /* BOOL : enable dynamic thumbs size on document load/resize */
    rowsperalbum: 3,  /* INT  : amount of thumbnails per row for album thumbs */
    rowspertrack: 4   /* INT  : amount of thumbnails per row for track thumbs */
  }
};

OursoPhone.initialPlay       =  true; /* BOOL : will be unset on first play() */
OursoPhone.currentPlayer     =  undefined; /* shortcut to the SoundManager instance */
OursoPhone.currentTrack      =  undefined; /* shortcut to the track playing */
OursoPhone.waveFormRenderer  =  undefined; /* waveform renderer type (requestAnimationFrame/setInterval) */
OursoPhone.graphUpdater      = undefined; /* animationFrame used to update the graph */
OursoPhone.graphData = {
  progress: 0,
  chroma: 'transparent'
};
OursoPhone.localStorage   = false;
OursoPhone.waveformData   = undefined;
OursoPhone.waveformWidth  = undefined;
OursoPhone.pixelTrans     = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
OursoPhone.templates      =  ['index', 'album-goback', 'album-item', 'album-no-picture', 'album-picture', 'track-item', 'track-no-picture', 'track-picture', 'user-item', 'view-mode-control', 'comment-item'];

