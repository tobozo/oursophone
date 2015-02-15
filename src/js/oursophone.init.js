
OursoPhone.loadTemplates = function() {
  var template = OursoPhone.templates.shift();
  if(template!==undefined) {
    TemplateStore.load(template, OursoPhone.loadTemplates);
  } else {
    OursoPhone.start();
  }
};



OursoPhone.start = function() {
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
};



OursoPhone.onRouteChanged = function() {
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



OursoPhone.init = function(options) {
  var cache;
  if(options) {
    console.log('merging options', OursoPhone.config, options);
    OursoPhone.config = $.extend(OursoPhone.config, options); // Overwrite settings
  }

  try {
    localStorage.setItem('blah', 'blah');
    localStorage.removeItem('blah');
    OursoPhone.localStorage = true;
  } catch(e) { ; }

  if( OursoPhone.localStorage ) {

    options = JSON.parse(localStorage.getItem('oursophone-config'));
    if(options!==null) {
      OursoPhone.config = $.extend( OursoPhone.config, options ); // Overwrite settings
    }

    OursoPhone.cache.restore();
    setInterval(OursoPhone.cache.autoSave, OursoPhone.cache.autoSaveFreq*1000);

  }

  navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
  // vibration API supported ?
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

    /* check for Cordova device-feedback plugin existence */
    if(!window.plugins) {
      OursoPhone.config.isFeedbackEnabled = false;
    } else {
      if(window.plugins.deviceFeedback) {
        OursoPhone.config.isFeedbackEnabled = true;
      } else {
        OursoPhone.config.isFeedbackEnabled = false;
      }
    };

    OursoPhone.ui.vibrate = function(e) {
      DF = window.plugins.deviceFeedback;
      DF.haptic(DF.VIRTUAL_KEY);
    }

  } else {
    if(OursoPhone.config.thumbs.autoresize) {

      $(window).on('resize', function() {
        OursoPhone.lastResize = Date.now();
      });

      setInterval(function() {
        if( (Date.now()) - OursoPhone.lastResize < 300 || OursoPhone.lastResize ===0 ) {
          return;
        }
        OursoPhone.calcThumbsSize();
        OursoPhone.lastResize = 0;
      }, 300);

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

};




OursoPhone.loadTheme = function(callback) {
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

};


