    var TemplateStore = {
      config: {
        folder: 'templates/',
        extension: 'tpl'
      },
      init: function(callback) {
        var templates = document.querySelectorAll('script[type="text/html"]');
        
        if(templates.length === 0) {
          throw("Early TemplateStore:init() call, aborting");
        }
        
        for(var tpl in templates) {
          if(templates[tpl].id!==undefined) {
            console.log('loading template ', templates[tpl].id);
            TemplateStore.get(templates[tpl].id);
          }
        }
        if(callback) callback();
      },
      get: function(id) {
        var $tpl;

        if(TemplateStore.store[id]!==undefined) {
          return TemplateStore.store[id];
        }
        $tpl = document.querySelector('#'+id);
        
        TemplateStore.store[id] = $tpl.innerHTML;
        
        if($tpl) {
          $tpl.parentElement.removeChild($tpl);
        }
        
        return TemplateStore.store[id];
      },
      load: function(id, callback) {
        var tplUrl = TemplateStore.config.folder + id + '.' + TemplateStore.config.extension;
        $.get(tplUrl, function(data) {
          $('<script type="text/html" id="'+ id +'"></script>').html(data).appendTo('body');
          if(callback) callback();
        });
      },
      store: { }
    };
    
