/*
 * this file contains the following plugins
 * slowFade, stepper, labelify, form, jqModal (along with jq drag'n'resize), getErrorHtmlFromJsonResponse
 */
// extend jquery for slowFade effect. not making separate plugin as this is used everywhere
jQuery.fn.slowFade = function(showTime, fadeTime, callback) {
  return this.each(function() {
    if (!showTime) showTime=1000;
    if (!fadeTime) fadeTime=1000;
    $(this).show().animate({opacity: 1.0}, showTime).fadeOut(fadeTime, callback);
  });
};
/*
 * jqStepper plugin. Not very well written as I do not know how to write jquery plugins.
 * uses global variables for max, min, onChange values
 * Probably should NOT be used ANYWHERE ELSE!
 */
jQuery.fn.jqStepper = function(minValue, maxValue) {
  jQuery.fn.jqStepper.minValue = minValue;
  jQuery.fn.jqStepper.maxValue = maxValue;
  return this.each(jqStepper_addStepper);
  function jqStepper_addStepper() {
    $(this).wrap('<span class="jqStepper"/>').after('<a href="#" class="jqStepper-up"><span>&gt;</span></a><a href="#" class="jqStepper-down"><span>&lt;</span></a>');
    $(this).parents('.jqStepper').find('.jqStepper-up').click(jqStepper_increaseValue);
    $(this).parents('.jqStepper').find('.jqStepper-down').click(jqStepper_decreaseValue);
  }
  function jqStepper_increaseValue() {
    var inputElem = $(this).parents('.jqStepper').find('input');
    var val = eval(inputElem.val()+'+'+1);
    if(!jQuery.fn.jqStepper.maxValue) inputElem.val(val);
    else if (val <= jQuery.fn.jqStepper.maxValue) inputElem.val(val);
    inputElem.blur();
    return false;
  }
  function jqStepper_decreaseValue() {
    var inputElem = $(this).parents('.jqStepper').find('input');
    var val = eval(inputElem.val()+'-'+1);
    if(!jQuery.fn.jqStepper.minValue) inputElem.val(val);
    else if (val >= jQuery.fn.jqStepper.minValue) inputElem.val(val);
    inputElem.blur();
    return false;
  }
};
/**
 * jQuery.labelify - Display in-textbox hints
 * Stuart Langridge, http://www.kryogenix.org/
 * Released into the public domain
 * Date: 25th June 2008
 * @author Stuart Langridge
 * @version 1.3
 *
 *
 * Basic calling syntax: $("input").labelify();
 * Defaults to taking the in-field label from the field's title attribute
 *
 * You can also pass an options object with the following keys:
 *   text
 *     "title" to get the in-field label from the field's title attribute
 *      (this is the default)
 *     "label" to get the in-field label from the inner text of the field's label
 *      (note that the label must be attached to the field with for="fieldid")
 *     a function which takes one parameter, the input field, and returns
 *      whatever text it likes
 *
 *   labelledClass
 *     a class that will be applied to the input field when it contains the
 *      label and removed when it contains user input. Defaults to blank.
 *
 */
jQuery.fn.labelify = function(settings) {
  settings = jQuery.extend({
    text: "title",
    labelledClass: "",
    defaultValueBlank: true
  }, settings);
  var lookups = {
    title: function(input) {
      return $(input).attr("title");
    },
    label: function(input) {
      return $("label[for=" + input.id +"]").text();
    }
  };
  var lookup;
  var jQuery_labellified_elements = $(this);
  return $(this).each(function() {
    var defaultValue = settings.defaultValueBlank?'':this.defaultValue;
    if (typeof settings.text === "string") {
      lookup = lookups[settings.text]; // what if not there?
    } else {
      lookup = settings.text; // what if not a fn?
    };
    // bail if lookup isn't a function or if it returns undefined
    if (typeof lookup !== "function") { return; }
    var lookupval = lookup(this);
    if (!lookupval) { return; }

    // need to strip newlines because the browser strips them
    // if you set textbox.value to a string containing them
    $(this).data("label",lookup(this).replace(/\n/g,''));
    $(this).focus(function() {
      if (this.value === $(this).data("label")) {
        this.value = defaultValue;
        $(this).removeClass(settings.labelledClass);
      }
    }).blur(function(){
      if (this.value === defaultValue) {
        this.value = $(this).data("label");
        $(this).addClass(settings.labelledClass);
      }
    });

    var removeValuesOnExit = function() {
      jQuery_labellified_elements.each(function(){
        if (this.value === $(this).data("label")) {
          this.value = defaultValue;
          $(this).removeClass(settings.labelledClass);
        }
      });
    };

    $(this).parents("form").submit(removeValuesOnExit);
    $(window).unload(removeValuesOnExit);

    if (this.value !== defaultValue) {
      // user already started typing; don't overwrite their work!
      return;
    }
    // actually set the value
    this.value = $(this).data("label");
    $(this).addClass(settings.labelledClass);

  });
};
/*
 * jQuery Form Plugin
 * version: 2.17 (06-NOV-2008)
 * @requires jQuery v1.2.2 or later
 *
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Revision: $Id: jquery.form.js,v 1.2 2008-12-29 06:59:12 Kani Exp $
 */
;(function($) {

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are intended to be exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').bind('submit', function() {
            $(this).ajaxSubmit({
                target: '#output'
            });
            return false; // <-- important!
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    if (typeof options == 'function')
        options = { success: options };

    options = $.extend({
        url:  this.attr('action') || window.location.toString(),
        type: this.attr('method') || 'GET'
    }, options || {});

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var a = this.formToArray(options.semantic);
    if (options.data) {
        options.extraData = options.data;
        for (var n in options.data) {
          if(options.data[n] instanceof Array) {
            for (var k in options.data[n])
              a.push( { name: n, value: options.data[n][k] } )
          }
          else
             a.push( { name: n, value: options.data[n] } );
        }
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a);

    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else
        options.data = q; // data is the query string for 'post'

    var $form = this, callbacks = [];
    if (options.resetForm) callbacks.push(function() { $form.resetForm(); });
    if (options.clearForm) callbacks.push(function() { $form.clearForm(); });

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            $(options.target).html(data).each(oldSuccess, arguments);
        });
    }
    else if (options.success)
        callbacks.push(options.success);

    options.success = function(data, status) {
        for (var i=0, max=callbacks.length; i < max; i++)
            callbacks[i].apply(options, [data, status, $form]);
    };

    // are there files to upload?
    var files = $('input:file', this).fieldValue();
    var found = false;
    for (var j=0; j < files.length; j++)
        if (files[j])
            found = true;

    // options.iframe allows user to force iframe mode
   if (options.iframe || found) {
       // hack to fix Safari hang (thanks to Tim Molendijk for this)
       // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
       if ($.browser.safari && options.closeKeepAlive)
           $.get(options.closeKeepAlive, fileUpload);
       else
           fileUpload();
       }
   else
       $.ajax(options);

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;


    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUpload() {
        var form = $form[0];

        if ($(':input[name=submit]', form).length) {
            alert('Error: Form elements must not be named "submit".');
            return;
        }

        var opts = $.extend({}, $.ajaxSettings, options);
		var s = jQuery.extend(true, {}, $.extend(true, {}, $.ajaxSettings), opts);

        var id = 'jqFormIO' + (new Date().getTime());
        var $io = $('<iframe id="' + id + '" name="' + id + '" />');
        var io = $io[0];

        if ($.browser.msie || $.browser.opera)
            io.src = 'javascript:false;document.write("");';
        $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });

        var xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function() {
                this.aborted = 1;
                $io.attr('src','about:blank'); // abort op in progress
            }
        };

        var g = opts.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && ! $.active++) $.event.trigger("ajaxStart");
        if (g) $.event.trigger("ajaxSend", [xhr, opts]);

		if (s.beforeSend && s.beforeSend(xhr, s) === false) {
			s.global && jQuery.active--;
			return;
        }
        if (xhr.aborted)
            return;

        var cbInvoked = 0;
        var timedOut = 0;

        // add submitting element to data if we know it
        var sub = form.clk;
        if (sub) {
            var n = sub.name;
            if (n && !sub.disabled) {
                options.extraData = options.extraData || {};
                options.extraData[n] = sub.value;
                if (sub.type == "image") {
                    options.extraData[name+'.x'] = form.clk_x;
                    options.extraData[name+'.y'] = form.clk_y;
                }
            }
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        setTimeout(function() {
            // make sure form attrs are set
            var t = $form.attr('target'), a = $form.attr('action');
            $form.attr({
                target:   id,
                method:   'POST',
                action:   opts.url
            });

            // ie borks in some cases when setting encoding
            if (! options.skipEncodingOverride) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (opts.timeout)
                setTimeout(function() { timedOut = true; cb(); }, opts.timeout);

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (options.extraData)
                    for (var n in options.extraData)
                        extraInputs.push(
                            $('<input type="hidden" name="'+n+'" value="'+options.extraData[n]+'" />')
                                .appendTo(form)[0]);

                // add iframe to doc and submit the form
                $io.appendTo('body');
                io.attachEvent ? io.attachEvent('onload', cb) : io.addEventListener('load', cb, false);
                form.submit();
            }
            finally {
                // reset attrs and remove "extra" input elements
                $form.attr('action', a);
                t ? $form.attr('target', t) : $form.removeAttr('target');
                $(extraInputs).remove();
            }
        }, 10);

        function cb() {
            if (cbInvoked++) return;

            io.detachEvent ? io.detachEvent('onload', cb) : io.removeEventListener('load', cb, false);

            var operaHack = 0;
            var ok = true;
            try {
                if (timedOut) throw 'timeout';
                // extract the server response from the iframe
                var data, doc;

                doc = io.contentWindow ? io.contentWindow.document : io.contentDocument ? io.contentDocument : io.document;

                if (doc.body == null && !operaHack && $.browser.opera) {
                    // In Opera 9.2.x the iframe DOM is not always traversable when
                    // the onload callback fires so we give Opera 100ms to right itself
                    operaHack = 1;
                    cbInvoked--;
                    setTimeout(cb, 100);
                    return;
                }

                xhr.responseText = doc.body ? doc.body.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': opts.dataType};
                    return headers[header];
                };

                if (opts.dataType == 'json' || opts.dataType == 'script') {
                    var ta = doc.getElementsByTagName('textarea')[0];
                    xhr.responseText = ta ? ta.value : xhr.responseText;
                }
                else if (opts.dataType == 'xml' && !xhr.responseXML && xhr.responseText != null) {
                    xhr.responseXML = toXml(xhr.responseText);
                }
                //data = $.httpData(xhr, opts.dataType);

                var ct = xhr.getResponseHeader("content-type");
                var xml = opts.dataType == "xml" || !opts.dataType && ct && ct.indexOf("xml") >= 0;
                var script = opts.dataType == "script" || !opts.dataType && ct && ct.indexOf("script") >= 0;
                var json = opts.dataType == "json" || !opts.dataType && ct && ct.indexOf("json") >= 0;
                data = xml ? xhr.responseXML : xhr.responseText;
                //data = xhr.responseText;

                if ( xml && data.documentElement.tagName == "parsererror" )
                    throw "parsererror";

                // Allow a pre-filtering function to sanitize the response
                // s != null is checked to keep backwards compatibility
                //if( s && s.dataFilter )
                //    data = s.dataFilter( data, type );

                // If the type is "script", eval it in global context
                if ( script )
                    jQuery.globalEval( data );

                // Get the JavaScript object, if JSON is used.
                if ( json ){
                    var x = data.match(/"code":"(.*?)"/)
                    data = {"code":x[1]};//data = eval("(" + data + ")");

                }
            }
            catch(e){
                ok = false;
                $.handleError(opts, xhr, 'error', e);
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (ok) {
                opts.success(data, 'success');
                if (g) $.event.trigger("ajaxSuccess", [xhr, opts]);
            }
            if (g) $.event.trigger("ajaxComplete", [xhr, opts]);
            if (g && ! --$.active) $.event.trigger("ajaxStop");
            if (opts.complete) opts.complete(xhr, ok ? 'success' : 'error');

            // clean up
            setTimeout(function() {
                $io.remove();
                xhr.responseXML = null;
            }, 100);
        };

        function toXml(s, doc) {
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            return (doc && doc.documentElement && doc.documentElement.tagName != 'parsererror') ? doc : null;
        };
    };
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    return this.ajaxFormUnbind().bind('submit.form-plugin',function() {
        $(this).ajaxSubmit(options);
        return false;
    }).each(function() {
        // store options in hash
        $(":submit,input:image", this).bind('click.form-plugin',function(e) {
            var form = this.form;
            form.clk = this;
            if (this.type == 'image') {
                if (e.offsetX != undefined) {
                    form.clk_x = e.offsetX;
                    form.clk_y = e.offsetY;
                } else if (typeof $.fn.offset == 'function') { // try to use dimensions plugin
                    var offset = $(this).offset();
                    form.clk_x = e.pageX - offset.left;
                    form.clk_y = e.pageY - offset.top;
                } else {
                    form.clk_x = e.pageX - this.offsetLeft;
                    form.clk_y = e.pageY - this.offsetTop;
                }
            }
            // clear form vars
            setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 10);
        });
    });
};

// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    this.unbind('submit.form-plugin');
    return this.each(function() {
        $(":submit,input:image", this).unbind('click.form-plugin');
    });

};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic) {
    var a = [];
    if (this.length == 0) return a;

    var form = this[0];
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    if (!els) return a;
    for(var i=0, max=els.length; i < max; i++) {
        var el = els[i];
        var n = el.name;
        if (!n) continue;

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(!el.disabled && form.clk == el)
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            continue;
        }

        var v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            for(var j=0, jmax=v.length; j < jmax; j++)
                a.push({name: n, value: v[j]});
        }
        else if (v !== null && typeof v != 'undefined')
            a.push({name: n, value: v});
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle them here
        var inputs = form.getElementsByTagName("input");
        for(var i=0, max=inputs.length; i < max; i++) {
            var input = inputs[i];
            var n = input.name;
            if(n && !input.disabled && input.type == "image" && form.clk == input)
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) return;
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++)
                a.push({name: n, value: v[i]});
        }
        else if (v !== null && typeof v != 'undefined')
            a.push({name: this.name, value: v});
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $(':text').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $(':checkbox').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $(':radio').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *       array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length))
            continue;
        v.constructor == Array ? $.merge(val, v) : val.push(v);
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (typeof successful == 'undefined') successful = true;

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1))
            return null;

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) return null;
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                // extra pain for IE...
                var v = $.browser.msie && !(op.attributes['value'].specified) ? op.text : op.value;
                if (one) return v;
                a.push(v);
            }
        }
        return a;
    }
    return el.value;
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function() {
    return this.each(function() {
        $('input,select,textarea', this).clearFields();
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function() {
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (t == 'text' || t == 'password' || tag == 'textarea')
            this.value = '';
        else if (t == 'checkbox' || t == 'radio')
            this.checked = false;
        else if (tag == 'select')
            this.selectedIndex = -1;
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType))
            this.reset();
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b == undefined) b = true;
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select == undefined) select = true;
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio')
            this.checked = select;
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// helper fn for console logging
// set $.fn.ajaxSubmit.debug to true to enable debug logging
function log() {
    if ($.fn.ajaxSubmit.debug && window.console && window.console.log)
        window.console.log('[jquery.form] ' + Array.prototype.join.call(arguments,''));
};

})(jQuery);

/*
 * jqModal - Minimalist Modaling with jQuery
 *   (http://dev.iceburg.net/jquery/jqModal/)
 *
 * Copyright (c) 2007,2008 Brice Burgess <bhb@iceburg.net>
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * $Version: 03/01/2009 +r14
 */
(function($) {
    $.fn.jqm=function(o){
        var p={
            overlay: 50,
            overlayClass: 'jqmOverlay',
            closeClass: 'jqmClose',
            trigger: '.jqModal',
            ajax: F,
            ajaxText: '',
            target: F,
            modal: F,
            toTop: F,
            onShow: F,
            onHide: F,
            onLoad: F
        };
        return this.each(function(){if(this._jqm)return H[this._jqm].c=$.extend({},H[this._jqm].c,o);s++;this._jqm=s;
            H[s]={c:$.extend(p,$.jqm.params,o),a:F,w:$(this).addClass('jqmID'+s),s:s};
            if(p.trigger)$(this).jqmAddTrigger(p.trigger);
        });};

    $.fn.jqmAddClose=function(e){return hs(this,e,'jqmHide');};
    $.fn.jqmAddTrigger=function(e){return hs(this,e,'jqmShow');};
    $.fn.jqmShow=function(t){return this.each(function(){t=t||window.event;$.jqm.open(this._jqm,t);});};
    $.fn.jqmHide=function(t){return this.each(function(){t=t||window.event;$.jqm.close(this._jqm,t)});};

    $.jqm = {
        hash:{},
        open:function(s,t){var h=H[s],c=h.c,cc='.'+c.closeClass,z=(parseInt(h.w.css('z-index'))),z=(z>0)?z:3000,o=$('<div></div>').css({height:'100%',width:'100%',position:'fixed',left:0,top:0,'z-index':z-1,opacity:c.overlay/100});if(h.a)return F;h.t=t;h.a=true;h.w.css('z-index',z);
            if(c.modal) {if(!A[0])L('bind');A.push(s);}
            else if(c.overlay > 0)h.w.jqmAddClose(o);
            else o=F;

            h.o=(o)?o.addClass(c.overlayClass).prependTo('body'):F;
            if(ie6){$('html,body').css({height:'100%',width:'100%'});if(o){o=o.css({position:'absolute'})[0];for(var y in {Top:1,Left:1})o.style.setExpression(y.toLowerCase(),"(_=(document.documentElement.scroll"+y+" || document.body.scroll"+y+"))+'px'");}}

            if(c.ajax) {var r=c.target||h.w,u=c.ajax,r=(typeof r == 'string')?$(r,h.w):$(r),u=(u.substr(0,1) == '@')?$(t).attr(u.substring(1)):u;
                r.html(c.ajaxText).load(u,function(){if(c.onLoad)c.onLoad.call(this,h);if(cc)h.w.jqmAddClose($(cc,h.w));e(h);});}
            else if(cc)h.w.jqmAddClose($(cc,h.w));

            if(c.toTop&&h.o)h.w.before('<span id="jqmP'+h.w[0]._jqm+'"></span>').insertAfter(h.o);
            (c.onShow)?c.onShow(h):h.w.show();e(h);return F;
        },
        close:function(s){var h=H[s];if(!h.a)return F;h.a=F;
            if(A[0]){A.pop();if(!A[0])L('unbind');}
            if(h.c.toTop&&h.o)$('#jqmP'+h.w[0]._jqm).after(h.w).remove();
            if(h.c.onHide)h.c.onHide(h);else{h.w.hide();if(h.o)h.o.remove();} return F;
        },
        params:{}};
    var s=0,H=$.jqm.hash,A=[],ie6=$.browser.msie&&($.browser.version == "6.0"),F=false,
        i=$('<iframe src="javascript:false;document.write(\'\');" class="jqm"></iframe>').css({opacity:0}),
        e=function(h){if(ie6)if(h.o)h.o.html('<p style="width:100%;height:100%"/>').prepend(i);else if(!$('iframe.jqm',h.w)[0])h.w.prepend(i); f(h);},
        f=function(h){try{$(':input:visible',h.w)[0].focus();}catch(_){}},
        L=function(t){$()[t]("keypress",m)[t]("keydown",m)[t]("mousedown",m);},
        m=function(e){var h=H[A[A.length-1]],r=(!$(e.target).parents('.jqmID'+h.s)[0]);if(r)f(h);return !r;},
        hs=function(w,t,c){return w.each(function(){var s=this._jqm;$(t).each(function() {
            if(!this[c]){this[c]=[];$(this).click(function(){for(var i in {jqmShow:1,jqmHide:1})for(var s in this[i])if(H[this[i][s]])H[this[i][s]].w[i](this);return F;});}this[c].push(s);});});};
})(jQuery);

/*
 * jqDnR - Minimalistic Drag'n'Resize for jQuery.
 *
 * Copyright (c) 2007 Brice Burgess <bhb@iceburg.net>, http://www.iceburg.net
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * $Version: 2007.08.19 +r2
 */

(function($){
$.fn.jqDrag=function(h){return i(this,h,'d');};
$.fn.jqResize=function(h){return i(this,h,'r');};
$.jqDnR={dnr:{},e:0,
drag:function(v){
 if(M.k == 'd')E.css({left:M.X+v.pageX-M.pX,top:M.Y+v.pageY-M.pY});
 else
E.css({width:Math.max(v.pageX-M.pX+M.W,0),height:Math.max(v.pageY-M.pY+M.H,0)});
  return false;},
stop:function(){/*E.css('opacity',M.o);*/$().unbind('mousemove',J.drag).unbind('mouseup',J.stop);}
};
var J=$.jqDnR,M=J.dnr,E=J.e,
i=function(e,h,k){return e.each(function(){h=(h)?$(h,e):e;
 h.bind('mousedown',{e:e,k:k},function(v){var d=v.data,p={},vertScroll=0;E=d.e;
 // attempt utilization of dimensions plugin to fix IE issues
 if(E.css('position') != 'relative'){if (E.css('position') != 'absolute') {vertScroll=$(window).scrollTop();};p=E.position();}
M={X:p.left||f('left')||0,Y:(p.top-vertScroll)||f('top')||0,W:f('width')||E[0].scrollWidth||0,H:f('height')||E[0].scrollHeight||0,pX:v.pageX,pY:v.pageY,k:d.k,o:E.css('opacity')};
 /*E.css({opacity:0.8})*/;$().mousemove($.jqDnR.drag).mouseup($.jqDnR.stop);
 return false;
 });
});},
f=function(k){return parseInt(E.css(k))||false;};
})(jQuery);
function getErrorHtmlFromJsonResponse(response) {
  var html = '<div class="errorContainer"><p>Please fix the following errors:</p><ol class="errorList">';
  for (var errKey in response.data) {
    html += "<li class='errorMessage'>" + response.data[errKey] + "</li>";
  }
  html += "</ol></div>";
  return html;
}
/*
 * this file contains the following plugins
 * slowFade, stepper, labelify, form, jqModal (along with jq drag'n'resize), getErrorHtmlFromJsonResponse
 */
// extend jquery for slowFade effect. not making separate plugin as this is used everywhere

/*
 * DropMenu.js
 * for the healthkart top menu bar
 */


jQuery.fn.hoverBox = function(targetHoverBox, reposition) {
  //If the mouse is on neither source link nor target then fadeOut the element
  function checkMenuHover(element, obj, tar) {
    if (!(obj) && !(tar)) {
      $(element).stop(true, true).fadeOut();
      /*Remove any queued animations and jump to the target CSS property before starting another animation*/
    }
  }

  var obj = null; //To test if mouse is on the source link
  var tar = null; //To test if mouse is on the drop menu
  var element = null; //The target. Needed because it can either address all targets on the page or just the local target (sibling to the source)
  var tarExist = false;  //To test if the user hovered over a child drop menu
  var t; //Timer

  $(this).hover(function(e) {
    // Clear any prior setTimeout functions, hide any existing drop menus, and reset tarExist
    clearTimeout(t);
    checkMenuHover(targetHoverBox, obj,tar);
    tarExist = false;

    //Show the child drop menu for this link
    element = $(this).parent().find(targetHoverBox);
    if (reposition) {
      var offset = $(this).offset();
      var width = $(this).width();
      var offsetContainer = $('#container').offset();
      //Needed since the hoverbox will be positioned relative to the container
      var tLeft = offset.left - offsetContainer.left + width;
      var tTop = offset.top - offsetContainer.top;
      element.css({'top' : tTop, 'left' : tLeft});
//      element.css({'top' : tTop - 50 + "px", 'left' : tLeft + linkWidth - 200 + "px"});
    }
    element.stop(true, true).fadeIn();
    obj = $(this); //mouse on source
  }, function() {
    obj = null; //source reset
    $(targetHoverBox).hover(function() {
      tarExist = true; // target was hovered over
      tar = $(this); //mouse on target
    }, function() {
      tar = null; //target reset
      t = setTimeout(function(){checkMenuHover(element,obj,tar);}, 300);
    });
    if (!(tarExist)) {
      t = setTimeout(function(){checkMenuHover(element,obj,tar);}, 300); //A setTimeout call would already be in progress is tarExist was true, so only do it in case it's false
    }
  });
};

/**
* hoverIntent is similar to jQuery's built-in "hover" function except that
* instead of firing the onMouseOver event immediately, hoverIntent checks
* to see if the user's mouse has slowed down (beneath the sensitivity
* threshold) before firing the onMouseOver event.
*
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
*
* hoverIntent is currently available for use in all personal or commercial
* projects under both MIT and GPL licenses. This means that you can choose
* the license that best suits your project, and use it accordingly.
*
* // basic usage (just like .hover) receives onMouseOver and onMouseOut functions
* $("ul li").hoverIntent( showNav , hideNav );
*
* // advanced usage receives configuration object only
* $("ul li").hoverIntent({
*	sensitivity: 7, // number = sensitivity threshold (must be 1 or higher)
*	interval: 100,   // number = milliseconds of polling interval
*	over: showNav,  // function = onMouseOver callback (required)
*	timeout: 0,   // number = milliseconds delay before onMouseOut function call
*	out: hideNav    // function = onMouseOut callback (required)
* });
*
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/
(function($) {
	$.fn.hoverIntent = function(f,g) {
		// default configuration options
		var cfg = {
			sensitivity: 7,
			interval: 100,
			timeout: 0
		};
		// override configuration options with user supplied object
		cfg = $.extend(cfg, g ? { over: f, out: g } : f );

		// instantiate variables
		// cX, cY = current X and Y position of mouse, updated by mousemove event
		// pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
		var cX, cY, pX, pY;

		// A private function for getting mouse position
		var track = function(ev) {
			cX = ev.pageX;
			cY = ev.pageY;
		};

		// A private function for comparing current and previous mouse position
		var compare = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			// compare mouse positions to see if they've crossed the threshold
			if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
				$(ob).unbind("mousemove",track);
				// set hoverIntent state to true (so mouseOut can be called)
				ob.hoverIntent_s = 1;
				return cfg.over.apply(ob,[ev]);
			} else {
				// set previous coordinates for next time
				pX = cX; pY = cY;
				// use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
				ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
			}
		};

		// A private function for delaying the mouseOut function
		var delay = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			ob.hoverIntent_s = 0;
			return cfg.out.apply(ob,[ev]);
		};

		// A private function for handling mouse 'hovering'
		var handleHover = function(e) {
			// copy objects to be passed into t (required for event object to be passed in IE)
			var ev = jQuery.extend({},e);
			var ob = this;

			// cancel hoverIntent timer if it exists
			if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }

			// if e.type == "mouseenter"
			if (e.type == "mouseenter") {
				// set "previous" X and Y position based on initial entry point
				pX = ev.pageX; pY = ev.pageY;
				// update "current" X and Y position based on mousemove
				$(ob).bind("mousemove",track);
				// start polling interval (self-calling timeout) to compare mouse coordinates over time
				if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}

			// else e.type == "mouseleave"
			} else {
				// unbind expensive mousemove event
				$(ob).unbind("mousemove",track);
				// if hoverIntent state is true, then call the mouseOut function after the specified delay
				if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
			}
		};

		// bind the function to the two event listeners
		return this.bind('mouseenter',handleHover).bind('mouseleave',handleHover);
	};
})(jQuery);

(function($){
	$.fn.popupWindow = function(instanceSettings){

		return this.each(function(){

		$(this).click(function(){

		$.fn.popupWindow.defaultSettings = {
			centerBrowser:0, // center window over browser window? {1 (YES) or 0 (NO)}. overrides top and left
			centerScreen:0, // center window over entire screen? {1 (YES) or 0 (NO)}. overrides top and left
			height:500, // sets the height in pixels of the window.
			left:0, // left position when the window appears.
			location:0, // determines whether the address bar is displayed {1 (YES) or 0 (NO)}.
			menubar:0, // determines whether the menu bar is displayed {1 (YES) or 0 (NO)}.
			resizable:0, // whether the window can be resized {1 (YES) or 0 (NO)}. Can also be overloaded using resizable.
			scrollbars:1, // determines whether scrollbars appear on the window {1 (YES) or 0 (NO)}.
			status:0, // whether a status line appears at the bottom of the window {1 (YES) or 0 (NO)}.
			width:500, // sets the width in pixels of the window.
			windowName:null, // name of window set from the name attribute of the element that invokes the click
			windowURL:null, // url used for the popup
			top:0, // top position when the window appears.
			toolbar:0 // determines whether a toolbar (includes the forward and back buttons) is displayed {1 (YES) or 0 (NO)}.
		};

		settings = $.extend({}, $.fn.popupWindow.defaultSettings, instanceSettings || {});

		var windowFeatures =    'height=' + settings.height +
								',width=' + settings.width +
								',toolbar=' + settings.toolbar +
								',scrollbars=' + settings.scrollbars +
								',status=' + settings.status +
								',resizable=' + settings.resizable +
								',location=' + settings.location +
								',menuBar=' + settings.menubar;

				settings.windowName = this.name || settings.windowName;
				settings.windowURL = this.href || settings.windowURL;
				var centeredY,centeredX;

				if(settings.centerBrowser){

					if ($.browser.msie) {//hacked together for IE browsers
						centeredY = (window.screenTop - 120) + ((((document.documentElement.clientHeight + 120)/2) - (settings.height/2)));
						centeredX = window.screenLeft + ((((document.body.offsetWidth + 20)/2) - (settings.width/2)));
					}else{
						centeredY = window.screenY + (((window.outerHeight/2) - (settings.height/2)));
						centeredX = window.screenX + (((window.outerWidth/2) - (settings.width/2)));
					}
					window.open(settings.windowURL, settings.windowName, windowFeatures+',left=' + centeredX +',top=' + centeredY).focus();
				}else if(settings.centerScreen){
					centeredY = (screen.height - settings.height)/2;
					centeredX = (screen.width - settings.width)/2;
					window.open(settings.windowURL, settings.windowName, windowFeatures+',left=' + centeredX +',top=' + centeredY).focus();
				}else{
					window.open(settings.windowURL, settings.windowName, windowFeatures+',left=' + settings.left +',top=' + settings.top).focus();
				}
				return false;
			});

		});
	};
})(jQuery);

$(document).ready(function() {
  // heartbeat. keeps the user session from expiring.
  setInterval(heartbeat, 150000);
  $('#searchbox').labelify({labelledClass: 'input_tip'});

  var onerror = function() {
    if (this.getAttribute("onerror_cnt") == 0) {
      this.setAttribute("onerror_cnt", 1);
      $(this).attr("src", $('#imageNotFound').attr('src')).attr("width", 100);
    }
    return false;
  };

  $('.product_image').attr('onerror_cnt', 0).error(onerror);

});
function heartbeat() {
//  if ($('#heartbeat').size()>0) $.getJSON($('#heartbeat').attr('href'), function() {});
}
//Issues: Hover out gets called multiple times.

// jStepper 1.3.1        - modified by pradeep to handle delays in keyup

// A jQuery plugin by EmKay usable for making a numeric textfield value easy to increase or decrease.

function AddOrSubtractTwoFloats(fltValue1, fltValue2, bAddSubtract) {

    var strNumber1 = fltValue1.toString();
    var strNumber2 = fltValue2.toString();

    var strResult = "";

    if (strNumber1.indexOf(".") > -1 || strNumber2.indexOf(".") > -1) {

        // If no decimals on one of them, then put them on!
        if (strNumber1.indexOf(".") == -1) {
            strNumber1 = strNumber1 + ".0";
        }

        if (strNumber2.indexOf(".") == -1) {
            strNumber2 = strNumber2 + ".0";
        }

        // Get only decimals
        var strDecimals1 = strNumber1.substr(strNumber1.indexOf(".") + 1);
        var strDecimals2 = strNumber2.substr(strNumber2.indexOf(".") + 1);

        // Getting the integers...
        var strInteger1 = strNumber1.substr(0, strNumber1.indexOf("."));
        var strInteger2 = strNumber2.substr(0, strNumber2.indexOf("."));

        //Make sure that the two decimals are same length (ie .02 vs .001) and append zeros as necessary.
        var bNotSameLength = true;

        while (bNotSameLength) {

            if (strDecimals1.length != strDecimals2.length) {
                if (strDecimals1.length < strDecimals2.length) {
                    strDecimals1 += "0";
                } else {
                    strDecimals2 += "0";
                }
            } else {
                bNotSameLength = false;
            }
        }

        var intOriginalDecimalLength = strDecimals1.length;

        for (var intCharIndex = 0; intCharIndex <= strDecimals1.length - 1; intCharIndex++) {
            strInteger1 = strInteger1 + strDecimals1.substr(intCharIndex, 1);
            strInteger2 = strInteger2 + strDecimals2.substr(intCharIndex, 1);
        }

        var intInteger1 = Number(strInteger1);
        var intInteger2 = Number(strInteger2);
        var intResult;

        if (bAddSubtract) {
            intResult = intInteger1 + intInteger2;
        } else {
            intResult = intInteger1 - intInteger2;
        }

        strResult = intResult.toString();

        for (var intZerosAdded = 0; intZerosAdded < ((intOriginalDecimalLength - strResult.length) + 1); intZerosAdded++) {
            strResult = "0" + strResult;
        }

        if (strResult.length >= intOriginalDecimalLength) {
            strResult = strResult.substring(0, strResult.length - intOriginalDecimalLength) + "." + strResult.substring(strResult.length - intOriginalDecimalLength);
        }

    } else {
        if (bAddSubtract) {
            strResult = Number(fltValue1) + Number(fltValue2);
        } else {
            strResult = Number(fltValue1) - Number(fltValue2);
        }

    }

    return Number(strResult);
}

(function(jQuery) {

    jQuery.fn.jStepper = function(options) {

        var opts = jQuery.extend({}, jQuery.fn.jStepper.defaults, options);

        return this.each(function() {
            var $this = jQuery(this);

            var o = jQuery.meta ? jQuery.extend({}, opts, $this.data()) : opts;

            if (o.disableAutocomplete) {
                $this.attr("autocomplete", "off");
            }

            if (jQuery.isFunction($this.mousewheel)) {
                $this.mousewheel(function(objEvent, intDelta){
                    if (intDelta > 0){ // Up
                        MakeStep(o, 1, objEvent, this);
                        return false;
                    }
                    else if (intDelta < 0){ // Down
                        MakeStep(o, 0, objEvent, this);
                        return false;
                    }
                });
            }

            $this.keydown(function(e){
                var key = e.keyCode;

                if (key == 38){ // Up
                    MakeStep(o, 1, e, this);
                }

                if (key == 40){ // Down
                    MakeStep(o, 0, e, this);
                }

            });

            var delay = (function(){
                var timer = 0;
                return function(callback, ms){
                    clearTimeout (timer);
                    timer = setTimeout(callback, ms);
                };
            })();

            $this.keyup(function(e){
                var self=this;
                delay(function(){
                    CheckValue(o, self);
                }, 2500 );
            });

        });
    };

    function CheckValue(o, objElm) {

        var $objElm = jQuery(objElm);

        var strValue = $objElm.val();

        if (o.disableNonNumeric) {
            strValue = strValue.replace(/[^\d\.,\-]/gi,"");
        }

        if (o.maxValue !== null) {
            if (strValue >= o.maxValue) {
                strValue = o.maxValue;
            }
        }

        if (o.minValue !== null) {
            if (strValue < o.minValue && strValue != "") {
                strValue = o.minValue;
            }
        }

        $objElm.val(strValue).change(); //firing change event - by pradeep

    }

    function MakeStep(o, bDirection, keydown, objElm) {

        var $objElm = jQuery(objElm);

        var stepToUse;
        if(keydown) {

            if (keydown.ctrlKey) {
                stepToUse = o.ctrlStep;
            } else if (keydown.shiftKey) {
                stepToUse = o.shiftStep;
            } else {
                stepToUse = o.normalStep;
            }

        } else {
            stepToUse = o.normalStep;
        }

        var numValue = $objElm.val();

        var intSelectionStart = numValue.length - objElm.selectionStart;
        var intSelectionEnd = numValue.length - objElm.selectionEnd;

        numValue = numValue.replace(/,/g,".");
        numValue = numValue.replace(o.decimalSeparator,".");

        numValue = numValue + '';
        if (numValue.indexOf(".") != -1) {
            numValue = numValue.match(new RegExp("-{0,1}[0-9]+[\\.][0-9]*"));
        }

        numValue = numValue + '';
        if (numValue.indexOf("-") != -1) {
            numValue = numValue.match(new RegExp("-{0,1}[0-9]+[\\.]*[0-9]*"));
        }

        numValue = numValue + '';
        numValue = numValue.match(new RegExp("-{0,1}[0-9]+[\\.]*[0-9]*"));

        if (numValue === "" || numValue == "-" || numValue === null) {
            numValue = o.defaultValue;
        }


        if (bDirection == 1) {
            numValue = AddOrSubtractTwoFloats(numValue, stepToUse, true);
        } else {
            numValue = AddOrSubtractTwoFloats(numValue, stepToUse, false);
        }

        var bLimitReached = false;

        if (o.maxValue !== null) {
            if (numValue >= o.maxValue) {
                numValue = o.maxValue;
                bLimitReached = true;
            }
        }

        if (o.minValue !== null) {
            if (numValue <= o.minValue) {
                numValue = o.minValue;
                bLimitReached = true;
            }
        }

        numValue = numValue + '';

        if (o.minLength !== null) {
            var intLengthNow = numValue.length;

            if (numValue.indexOf(".") != -1) {
                intLengthNow = numValue.indexOf(".");
            }
            var bIsNegative = false;
            if (numValue.indexOf("-") != -1) {
                bIsNegative = true;
                numValue = numValue.replace(/-/,"");
            }

            if (intLengthNow < o.minLength) {
                for (var i=1;i<=(o.minLength - intLengthNow);i++) {
                    numValue = '0' + numValue;
                }
            }

            if (bIsNegative) {
                numValue =  '-' + numValue;
            }

        }

        numValue = numValue + '';

        var intDecimalsNow;

        if (o.minDecimals > 0) {
            var intDecimalsMissing;
            if (numValue.indexOf(".") != -1) {
                intDecimalsNow = numValue.length - (numValue.indexOf(".") + 1);
                if (intDecimalsNow < o.minDecimals) {
                    intDecimalsMissing = o.minDecimals - intDecimalsNow;
                }
            }	else {
                intDecimalsMissing = o.minDecimals;
                numValue = numValue + '.';
            }
            for (var intDecimalIndex=1; intDecimalIndex<=intDecimalsMissing; intDecimalIndex++) {
                numValue = numValue + '0';
            }
        }

        if (o.maxDecimals > 0) {
            intDecimalsNow = 0;
            if (numValue.indexOf(".") != -1) {
                intDecimalsNow = numValue.length - (numValue.indexOf(".") + 1);
                if (o.maxDecimals < intDecimalsNow) {
                    numValue = numValue.substring(0,numValue.indexOf(".")) + "." + numValue.substring(numValue.indexOf(".") + 1,numValue.indexOf(".") + 1 + o.maxDecimals);
                }
            }
        }

        if (!o.allowDecimals) {
            numValue = numValue + '';
            numValue = numValue.replace(new RegExp("[\\.].+"),"");
        }

        numValue = numValue.replace(/\./,o.decimalSeparator);

        $objElm.val(numValue);

        objElm.selectionStart = numValue.length - intSelectionStart;
        objElm.selectionEnd = numValue.length - intSelectionEnd;

        CheckValue(o, objElm);

        if (o.onStep) {
            o.onStep($objElm, bDirection, bLimitReached);
        }

        return false;

    }

    jQuery.fn.jStepper.defaults = {
        maxValue : null,
        minValue : null,
        normalStep : 1,
        shiftStep : 5,
        ctrlStep : 10,
        minLength : null,
        disableAutocomplete : true,
        defaultValue : 1,
        decimalSeparator : ",",
        allowDecimals : true,
        minDecimals : 0,
        maxDecimals : null,
        disableNonNumeric : true,
        onStep : null
    };

})(jQuery);

/**
 * jquery.autocomplete.js
 * Version 3.1
 * Copyright (c) Dylan Verheul <dylan.verheul@gmail.com>
 */
(function($) {

  /**
   * Autocompleter Object
   * @param {jQuery} $elem jQuery object with one input tag
   * @param {Object=} options Settings
   * @constructor
   */
  $.Autocompleter = function($elem, options) {

    /**
     * Cached data
     * @type Object
     * @private
     */
    this.cacheData_ = {};

    /**
     * Number of cached data items
     * @type number
     * @private
     */
    this.cacheLength_ = 0;

    /**
     * Class name to mark selected item
     * @type string
     * @private
     */
    this.selectClass_ = 'jquery-autocomplete-selected-item';

    /**
     * Handler to activation timeout
     * @type ?number
     * @private
     */
    this.keyTimeout_ = null;

    /**
     * Last key pressed in the input field (store for behavior)
     * @type ?number
     * @private
     */
    this.lastKeyPressed_ = null;

    /**
     * Last value processed by the autocompleter
     * @type ?string
     * @private
     */
    this.lastProcessedValue_ = null;

    /**
     * Last value selected by the user
     * @type ?string
     * @private
     */
    this.lastSelectedValue_ = null;

    /**
     * Is this autocompleter active?
     * @type boolean
     * @private
     */
    this.active_ = false;

    /**
     * Is it OK to finish on blur?
     * @type boolean
     * @private
     */
    this.finishOnBlur_ = true;

    /**
     * Assert parameters
     */
    if (!$elem || !($elem instanceof jQuery) || $elem.length !== 1 || $elem.get(0).tagName.toUpperCase() !== 'INPUT') {
      alert('Invalid parameter for jquery.Autocompleter, jQuery object with one element with INPUT tag expected');
      return;
    }

    /**
     * Init and sanitize options
     */
    if (typeof options === 'string') {
      this.options = { url:options };
    } else {
      this.options = options;
    }
    this.options.maxCacheLength = parseInt(this.options.maxCacheLength);
    if (isNaN(this.options.maxCacheLength) || this.options.maxCacheLength < 1) {
      this.options.maxCacheLength = 1;
    }
    this.options.minChars = parseInt(this.options.minChars);
    if (isNaN(this.options.minChars) || this.options.minChars < 1) {
      this.options.minChars = 1;
    }

    /**
     * Init DOM elements repository
     */
    this.dom = {};

    /**
     * Store the input element we're attached to in the repository, add class
     */
    this.dom.$elem = $elem;
    if (this.options.inputClass) {
      this.dom.$elem.addClass(this.options.inputClass);
    }

    /**
     * Create DOM element to hold results
     */
    this.dom.$results = $('<div></div>').hide();
    if (this.options.resultsClass) {
      this.dom.$results.addClass(this.options.resultsClass);
    }

    this.dom.$results.css({
      position:'absolute',
      padding: "none",
      border: "1px solid #a2c4e5",
      background: "#f2f7fb",
      overflow :" hidden",
      "z-index":"99999"
    });

    $('body').append(this.dom.$results);

    /**
     * Shortcut to self
     */
    var self = this;

    //    $elem.mousedown(function(e) {
    //      if (e.which) {
    //        if (e.which == 1) {
    //          if (self.active_) {
    //            self.selectCurrent();
    //            return true;
    //          }
    //        }
    //      } else if (e.button) {
    //        if (e.button == 0) {
    //          if (self.active_) {
    //            self.selectCurrent();
    //            return true;
    //          }
    //        }
    //      }
    //    });

    /**
     * Attach keyboard monitoring to $elem
     */
    $elem.keydown(function(e) {
      self.lastKeyPressed_ = e.keyCode;
      switch (self.lastKeyPressed_) {

        case 38: // up
          e.preventDefault();
          if (self.active_) {
            self.focusPrev();
          } else {
            self.activate();
          }
          return false;
          break;

        case 40: // down
          e.preventDefault();
          if (self.active_) {
            self.focusNext();
          } else {
            self.activate();
          }
          return false;
          break;

        case 9: // tab
          if (self.active_) {
            e.preventDefault();
            self.selectCurrent();
            return false;
          }
          break;

        case 13: // return
          if (self.active_) {
            self.selectCurrent();
            return true;
          }
          break;

        case 27: // escape
          if (self.active_) {
            e.preventDefault();
            self.finish();
            return false;
          }
          break;

        default:
          self.activate();

      }
    });
    $elem.blur(function() {
      if (self.finishOnBlur_) {
        setTimeout(function() {
          self.finish();
        }, 200);
      }
    });

  };

  $.Autocompleter.prototype.position = function() {
    var offset = this.dom.$elem.offset();
    this.dom.$results.css({
      top: offset.top + this.dom.$elem.outerHeight(),
      left: offset.left
    });
  };

  $.Autocompleter.prototype.cacheRead = function(filter) {
    var filterLength, searchLength, search, maxPos, pos;
    if (this.options.useCache) {
      filter = String(filter);
      filterLength = filter.length;
      if (this.options.matchSubset) {
        searchLength = 1;
      } else {
        searchLength = filterLength;
      }
      while (searchLength <= filterLength) {
        if (this.options.matchInside) {
          maxPos = filterLength - searchLength;
        } else {
          maxPos = 0;
        }
        pos = 0;
        while (pos <= maxPos) {
          search = filter.substr(0, searchLength);
          if (this.cacheData_[search] !== undefined) {
            return this.cacheData_[search];
          }
          pos++;
        }
        searchLength++;
      }
    }
    return false;
  };

  $.Autocompleter.prototype.cacheWrite = function(filter, data) {
    if (this.options.useCache) {
      if (this.cacheLength_ >= this.options.maxCacheLength) {
        this.cacheFlush();
      }
      filter = String(filter);
      if (this.cacheData_[filter] !== undefined) {
        this.cacheLength_++;
      }
      return this.cacheData_[filter] = data;
    }
    return false;
  };

  $.Autocompleter.prototype.cacheFlush = function() {
    this.cacheData_ = {};
    this.cacheLength_ = 0;
  };

  $.Autocompleter.prototype.callHook = function(hook, data) {
    var f = this.options[hook];
    if (f && $.isFunction(f)) {
      return f(data, this);
    }
    return false;
  };

  $.Autocompleter.prototype.activate = function() {
    var self = this;
    var activateNow = function() {
      self.activateNow();
    };
    var delay = parseInt(this.options.delay);
    if (isNaN(delay) || delay <= 0) {
      delay = 250;
    }
    if (this.keyTimeout_) {
      clearTimeout(this.keyTimeout_);
    }
    this.keyTimeout_ = setTimeout(activateNow, delay);
  };

  $.Autocompleter.prototype.activateNow = function() {
    var value = this.dom.$elem.val();
    if (value !== this.lastProcessedValue_ && value !== this.lastSelectedValue_) {
      if (value.length >= this.options.minChars) {
        this.active_ = true;
        this.lastProcessedValue_ = value;
        this.fetchData(value);
      }
    }
  };

  $.Autocompleter.prototype.fetchData = function(value) {
    if (this.options.data) {
      this.filterAndShowResults(this.options.data, value);
    } else {
      var self = this;
      this.fetchRemoteData(value, function(remoteData) {
        self.filterAndShowResults(remoteData, value);
      });
    }
  };

  $.Autocompleter.prototype.fetchRemoteData = function(filter, callback) {
    var data = this.cacheRead(filter);
    if (data) {
      //      alert('cached results found');
      callback(data);
    } else {
      //      alert(' fetching fresh data');
      var self = this;
      this.dom.$elem.addClass(this.options.loadingClass);
      var ajaxCallback = function(data) {
        var parsed = false;
        //        alert('calling parse remote data : parsed = '+parsed);
        if (data !== false) {
          //          alert('calling parse remote data');
          parsed = self.parseRemoteData(data);
          self.cacheWrite(filter, parsed);
        }
        self.dom.$elem.removeClass(self.options.loadingClass);
        callback(parsed);
      };
      //      alert('bfore json call') ;
      $.getJSON(this.makeUrl(filter), ajaxCallback);
      //      alert('after json call');
    }
  };

  $.Autocompleter.prototype.setExtraParam = function(name, value) {
    var index = $.trim(String(name));
    if (index) {
      if (!this.options.extraParams) {
        this.options.extraParams = {};
      }
      if (this.options.extraParams[index] !== value) {
        this.options.extraParams[index] = value;
        this.cacheFlush();
      }
    }
  };

  $.Autocompleter.prototype.makeUrl = function(param) {
    var self = this;
    var paramName = this.options.paramName || 'q';
    var url = this.options.url;
    var params = $.extend({}, this.options.extraParams);
    // If options.paramName === false, append query to url
    // instead of using a GET parameter
    if (this.options.paramName === false) {
      url += encodeURIComponent(param);
    } else {
      params[paramName] = param;
    }
    var urlAppend = [];
    $.each(params, function(index, value) {
      urlAppend.push(self.makeUrlParam(index, value));
    });

    // KANI hack : removing callback parameter as this will make jquery take it as a jsonp request. we do not need jsonp., comment below callback to not take as jsonp
    //    urlAppend.push('callback=?');

    if (urlAppend.length) {
      url += url.indexOf('?') == -1 ? '?' : '&';
      url += urlAppend.join('&');
    }
    return url;
  };

  $.Autocompleter.prototype.makeUrlParam = function(name, value) {
    return String(name) + '=' + encodeURIComponent(value);
  };

  $.Autocompleter.prototype.parseRemoteData = function(remoteData) {
    var results = [];

    /*
     som && som(["har",[
     ["harry potter","","0"],
     ["harry potter and the deathly hallows","","1"],
     ["harry potter and the half blood prince","","2"],
     ["harry potter and the sorcerer's stone","","3"],
     ["harry potter and the goblet of fire","","4"],
     ["harry potter and the chamber of secrets","","5"],
     ["harry potter books","","6"],
     ["hardy boys","","7"],
     ["harry potter and the prisoner of azkaban","","8"],
     ["harry potter and the philosopher's stone","","9"]
     ],"","","","","",{}]);
     */


    /*var convertedData = "";
     for (var idx = 0; idx < remoteData[1].length; idx++) {
     convertedData += remoteData[1][idx][0] + '\n';
     }
     remoteData = convertedData;

     var text = String(remoteData).replace('\r\n', '\n');
     var i, j, data, line, lines = text.split('\n');
     var value;
     for (i = 0; i < lines.length; i++) {
     line = lines[i].split('|');
     data = [];
     for (j = 0; j < line.length; j++) {
     data.push(unescape(line[j]));
     }
     value = data.shift();
     results.push({ value: unescape(value), data: data });
     }*/


    /* KANI hack : trying with HealthKartResponse object
     alert(results); */
    results = remoteData.data;
    return results;
  };

  $.Autocompleter.prototype.filterAndShowResults = function(results, filter) {
    this.showResults(this.filterResults(results, filter), filter);
  };

  $.Autocompleter.prototype.filterResults = function(results, filter) {

    var filtered = [];
    var value, data, i, result, type;
    var regex, pattern, attributes = '';

    for (i = 0; i < results.length; i++) {
      result = results[i];
      type = typeof result;
      if (type === 'string') {
        value = result;
        data = {};
      } else if ($.isArray(result)) {
        value = result.shift();
        data = result;
      } else if (type === 'object') {
        value = result.value;
        data = result.data;
      }
      value = String(value)
      // Condition below means we do NOT do empty results
      if (value) {
       value = value.trim();
        if (typeof data !== 'object') {
          data = {};
        }
        pattern = String(filter);
        if (!this.options.matchInside) {
          pattern = '^' + pattern;
        }
        if (!this.options.matchCase) {
          attributes = 'i';
        }
        regex = new RegExp(pattern, attributes);
          //marut- modify..we just want to display whatever comes from backend. Logic has already been taken care of
        //if (regex.test(value)) {
          filtered.push({ value: value, data: data });
        //}
      }
    }

    if (this.options.sortResults) {
      return this.sortResults(filtered);
    }

    return filtered;

  };

  $.Autocompleter.prototype.sortResults = function(results) {
    var self = this;
    if ($.isFunction(this.options.sortFunction)) {
      results.sort(this.options.sortFunction);
    } else {
      results.sort(function(a, b) {
        return self.sortValueAlpha(a, b);
      });
    }
    return results;
  };

  $.Autocompleter.prototype.sortValueAlpha = function(a, b) {
    a = String(a.value);
    b = String(b.value);
    if (!this.options.matchCase) {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  };

  $.Autocompleter.prototype.showResults = function(results, filter) {
    var self = this;
    var $ul = $('<ul></ul>');
    var i, result, $li, extraWidth, first = false, $first = false;
    var numResults = results.length;
    for (i = 0; i < numResults; i++) {
      result = results[i];
      $li = $('<li>' + this.showResult((result.value).replace(filter, '<b>'+filter+'</b>'), result.data) + '</li>');
      $li.data('value', result.value);
      $li.data('data', result.data);
      $li.click(function() {
        var $this = $(this);
        self.selectItem($this);
      }).mousedown(function() {
        self.finishOnBlur_ = false;

        //        if (e.which) {
        //          if (e.which == 1) {
        //            if (self.active_) {
        //              self.selectCurrent();
        //              return true;
        //            }
        //          }
        //        } else if (e.button) {
        //          if (e.button == 0) {
        //            if (self.active_) {
        //              self.selectCurrent();
        //              return true;
        //            }
        //          }
        //        }

      }).mouseup(function() {
        self.finishOnBlur_ = true;
      });
      $ul.append($li);
      if (first === false) {
        first = String(result.value);
        $first = $li;
        $li.addClass(this.options.firstItemClass);
      }
      if (i == numResults - 1) {
        $li.addClass(this.options.lastItemClass);
      }
    }

    // Alway recalculate position before showing since window size or
    // input element location may have changed. This fixes #14
    this.position();

    this.dom.$results.html($ul).show();
    extraWidth = this.dom.$results.outerWidth() - this.dom.$results.width();
    this.dom.$results.width(this.dom.$elem.outerWidth() - extraWidth);
    $('li', this.dom.$results).hover(function() {
      self.focusItem(this);
    }, function() { /* void */
    });
//  .mousedown(function(e) {
//      if (e.which) {
//        if (e.which == 1) {
//          if (self.active_) {
//            self.selectCurrent();
//            return true;
//          }
//        }
//      } else if (e.button) {
//        if (e.button == 0) {
//          if (self.active_) {
//            self.selectCurrent();
//            return true;
//          }
//        }
//      }
//    });
    if (this.autoFill(first, filter)) {
      this.focusItem($first);
    }
  };

  $.Autocompleter.prototype.showResult = function(value, data) {
    if ($.isFunction(this.options.showResult)) {
      return this.options.showResult(value, data);
    } else {
      return value;
    }
  };

  $.Autocompleter.prototype.autoFill = function(value, filter) {
    var lcValue, lcFilter, valueLength, filterLength;
    if (this.options.autoFill && this.lastKeyPressed_ != 8) {
      lcValue = String(value).toLowerCase();
      lcFilter = String(filter).toLowerCase();
      valueLength = value.length;
      filterLength = filter.length;
      if (lcValue.substr(0, filterLength) === lcFilter) {
        this.dom.$elem.val(value);
        this.selectRange(filterLength, valueLength);
        return true;
      }
    }
    return false;
  };

  $.Autocompleter.prototype.focusNext = function() {
    this.focusMove(+1);
  };

  $.Autocompleter.prototype.focusPrev = function() {
    this.focusMove(-1);
  };

  $.Autocompleter.prototype.focusMove = function(modifier) {
    var i, $items = $('li', this.dom.$results);
    modifier = parseInt(modifier);
    for (var i = 0; i < $items.length; i++) {
      if ($($items[i]).hasClass(this.selectClass_)) {
        this.focusItem(i + modifier);
        return;
      }
    }
    this.focusItem(0);
  };

  $.Autocompleter.prototype.focusItem = function(item) {
    var $item, $items = $('li', this.dom.$results);
    if ($items.length) {
      $items.removeClass(this.selectClass_).removeClass(this.options.selectClass);
      if (typeof item === 'number') {
        item = parseInt(item);
        if (item < 0) {
          item = 0;
        } else if (item >= $items.length) {
          item = $items.length - 1;
        }
        $item = $($items[item]);
      } else {
        $item = $(item);
      }
      if ($item) {
        $item.addClass(this.selectClass_).addClass(this.options.selectClass);

        var value = $item.data('value');
        var data = $item.data('data');
        var displayValue = this.displayValue(value, data);
        this.dom.$elem.val(displayValue);
      }
    }
  };

  $.Autocompleter.prototype.selectCurrent = function() {
    var $item = $('li.' + this.selectClass_, this.dom.$results);
    if ($item.length == 1) {
      this.selectItem($item);
    } else {
      this.finish();
    }
  };

  $.Autocompleter.prototype.selectItem = function($li) {
    var value = $li.data('value');
    var data = $li.data('data');
    var displayValue = this.displayValue(value, data);
    this.lastProcessedValue_ = displayValue;
    this.lastSelectedValue_ = displayValue;
    this.dom.$elem.val(displayValue).focus();
    this.setCaret(displayValue.length);
    this.callHook('onItemSelect', { value: value, data: data });
    this.finish();
  };

  $.Autocompleter.prototype.displayValue = function(value, data) {
    if ($.isFunction(this.options.displayValue)) {
      return this.options.displayValue(value, data);
    } else {
      return value;
    }
  };

  $.Autocompleter.prototype.finish = function() {
    if (this.keyTimeout_) {
      clearTimeout(this.keyTimeout_);
    }
    if (this.dom.$elem.val() !== this.lastSelectedValue_) {
      if (this.options.mustMatch) {
        this.dom.$elem.val('');
      }
      this.callHook('onNoMatch');
    }
    this.dom.$results.hide();
    this.lastKeyPressed_ = null;
    this.lastProcessedValue_ = null;
    if (this.active_) {
      this.callHook('onFinish');
    }
    this.active_ = false;
  };

  $.Autocompleter.prototype.selectRange = function(start, end) {
    var input = this.dom.$elem.get(0);
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(start, end);
    } else if (this.createTextRange) {
      var range = this.createTextRange();
      range.collapse(true);
      range.moveEnd('character', end);
      range.moveStart('character', start);
      range.select();
    }
  };

  $.Autocompleter.prototype.setCaret = function(pos) {
    this.selectRange(pos, pos);
  };

  /**
   * autocomplete plugin
   */
  $.fn.autocomplete = function(options) {
    if (typeof options === 'string') {
      options = {
        url: options
      };
    }
    var o = $.extend({}, $.fn.autocomplete.defaults, options);
    return this.each(function() {
      var $this = $(this);
      var ac = new $.Autocompleter($this, o);
      $this.data('autocompleter', ac);
    });

  };

  /**
   * Default options for autocomplete plugin
   */
  $.fn.autocomplete.defaults = {
    paramName: 'q',
    minChars: 2,
    loadingClass: 'acLoading',
    resultsClass: 'acResults',
    inputClass: 'acInput',
    selectClass: 'acSelect',
    mustMatch: false,
    matchCase: false,
    matchInside: true,
    matchSubset: true,
    useCache: false,
    maxCacheLength: 10,
    autoFill: false,
    sortResults: false,
    sortFunction: false,
    onItemSelect: false,
    onNoMatch: false
  };

})(jQuery);
