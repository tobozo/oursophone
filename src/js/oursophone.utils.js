
OursoPhone.utils = {}

OursoPhone.utils.htmlEncode = function(string){
  string = (string === null)?"":string.toString();
  string = $('<div/>').text(string).html();
  return string.replace(/\n/gi, '<br />\n');
};

OursoPhone.utils.attrEncode = function(string) {
  string = (string === null)?"":string.toString();
  string = string.replace(/"/gi, '&quot;');
  return string.replace(/\n/gi, '<br />\n');
};


OursoPhone.utils.interfaceLock = function() {
  $('body').addClass('locked');
};


OursoPhone.utils.interfaceRelease = function() {
  $('body').removeClass('locked');
}



OursoPhone.calcThumbsSize = function(options) {

  var defaultOptions = {
    maxrows:            OursoPhone.config.thumbs.rowspertrack,
    containerSelector:  '#playlist',
    quantifierSelector: 'trackbox',
    outerThumbSelector: '.track img',
    innerThumbSelector: '.track',
    marginWidthRule:    '[data-display-mode="thumb"] .track .track-picture',
    fontSizeRule:       '[data-display-mode="thumb"] .track .track-title'
  }

  var settings = $.extend(defaultOptions, options);

  var containerSelector  = $( settings.containerSelector ),
  quantifierSelector = $( settings.quantifierSelector ),
  outerThumbSelector = $( settings.outerThumbSelector ),
  innerThumbSelector = $( settings.innerThumbSelector ),
  marginWidthRule    = settings.marginWidthRule,
  fontSizeRule       = settings.fontSizeRule,
  maxrows            = settings.maxrows
  ;

  /* will autoresize thumbnails to fit the number of columns (see config) */
  var wSize,
  thumbWidth,
  thumbAmount = quantifierSelector.length,
  thumbMargin = 0,
  scrollBarWidth = 0,
  lastStylesheet = document.styleSheets[document.styleSheets.length-1],
  lastRuleIndex,
  rule,
  $scrollBarChecker,

  $scrollBarChecker = $('<div id="scrollbar-checker"></div>');
  $scrollBarChecker.appendTo(containerSelector);
  if( $scrollBarChecker.width()>0 && containerSelector.width() != $scrollBarChecker.width() ) {
    // scrollbar detected
    wSize = $scrollBarChecker.width();
    console.info('autogrow/autoshrink triggered', containerSelector.width() , $scrollBarChecker.width());
  } else {
    wSize = containerSelector.width();
  }
  $scrollBarChecker.remove();

  thumbWidth = wSize / Math.min(maxrows, thumbAmount);

  // the whole thumb box is resized based on the child img's width
  // but outer containers may have margin/border
  // TODO : find a better way to calculate the width delta
  try {
    thumbMargin = ( innerThumbSelector.css('marginLeft').split('px')[0]- -innerThumbSelector.css('marginRight').split('px')[0])
    - -( innerThumbSelector.outerWidth() - outerThumbSelector.width() )
    ;
  } catch(e) { ;
    // something broke up, CSS reflow precedence or destroyed block, better give up
    return;
  }

  for(var i=0; i<lastStylesheet.cssRules.length; i++) {
    rule = $.trim( lastStylesheet.cssRules[i].cssText.split('{')[0] );
    if(  rule == marginWidthRule
      || rule == fontSizeRule ) {
      lastStylesheet.deleteRule(i);
    i--;
      }
  }
  lastStylesheet.insertRule(
    marginWidthRule +' { width: ' + Math.floor( thumbWidth - thumbMargin ) + 'px }',
                            lastStylesheet.cssRules.length-1
  );
  lastStylesheet.insertRule(
    fontSizeRule + ' { font-size: ' + ( thumbWidth/100 ).toFixed(2) + 'rem }',
                            lastStylesheet.cssRules.length-1
  );

};


