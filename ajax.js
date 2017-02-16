/**
 * 
 * @authors Benjamin (zuojj.com@gmail.com)
 * @date    2017-02-10 19:39:43
 * @version $Id$
 */


(function(window) {
	var jsonpID = 0,
		document = window.document,
		toString = {}.toString,
		rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		scriptTypeRE = /^(?:text|application)\/javascript/i,
		xmlTypeRE = /^(?:text|application)\/xml/i,
		jsonType = 'application/json',
		htmlType = 'text/html',
		blankRE = /^\s*$/;


	/**
	 * [noop 空函数]
	 * @return {[type]} [description]
	 */
	function noop() {}

	/**
	 * [extend description]
	 * @return {[type]} [description]
	 */
	function extend(target) {
		Array.prototype.slice.call(arguments, 1).forEach(function(source) {
			for (var key in source)
				if (source[key] !== undefined)
					target[key] = source[key]
		})
		return target;
	}

	/**
	 * [appendQuery url增加参数]
	 * @param  {[type]} url   [description]
	 * @param  {[type]} query [description]
	 * @return {[type]}       [description]
	 */
	function appendQuery(url, query) {
	    url = url.indexOf('?') > 0 ? url : (url + '?');

	    url = /\?.+[^&]$/.test(url) ? (url + '&') : url;

		return url + query;
	}


	/**
	 * [serializeData 处理get请求参数]
	 * @param  {[type]} settings [description]
	 * @return {[type]}          [description]
	 */
	function serializeData(settings) {
		if('object' === typeof settings.data) {
			settings.data = param(settings.data);
		}

		if(settings.data && (!settings.type || settings.type.toUpperCase() === 'GET') ) {
			settings.url = appendQuery(settings.url, settings.data);
		}
	}

	/**
	 * [serialize 参数序列化]
	 * @param  {[type]} params      [description]
	 * @param  {[type]} obj         [description]
	 * @param  {[type]} traditional [description]
	 * @param  {[type]} scope       [description]
	 * @return {[type]}             [description]
	 */
	function serialize(params, obj, traditional, scope) {
		var array = toString.call(obj) === '[object Array]' ;
		for (var key in obj) {
			var value = obj[key];

			if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
				// handle data in serializeArray() format
			if (!scope && array) params.add(value.name, value.value)
				// recurse into nested objects
			else if (traditional ? (toString.call(value) === '[object Array]') : (toString.call(value) === '[object Object]'))
				serialize(params, value, traditional, key)
			else params.add(key, value)
		}
	}

	/**
	 * [param 生成键值对]
	 * @param  {[type]} obj         [description]
	 * @param  {[type]} traditional [description]
	 * @return {[type]}             [description]
	 */
	function param(obj, traditional) {
		var params = [];

		params.add = function(k, v) {
			this.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
		}
		serialize(params, obj, traditional);
		return params.join('&').replace('%20', '+');
	}

	/**
	 * [mimeToDataType mimeType转换]
	 * @param  {[type]} mime [description]
	 * @return {[type]}      [description]
	 */
	function mimeToDataType(mime) {
		return mime && 
			(mime == htmlType ? 'html' :
			mime == jsonType ? 'json' :
			scriptTypeRE.test(mime) ? 'script' :
			xmlTypeRE.test(mime) && 'xml') || 'text';
	}

	/**
	 * [ajaxBeforeSend ajax请求发送前触发]
	 */
	function ajaxBeforeSend(settings) {
		return settings.beforeSend.call(settings.context);
	}

	/**
	 * [ajaxSuccess 请求成功]
	 * @param {[type]} data [description]
	 */
	function ajaxSuccess(data, settings) {
		settings.success.call(settings.context, data);
		ajaxComplete('success', settings);
	}

	/**
	 * [ajaxError 请求失败]
	 * @param {[type]} type  [description]
	 * @param {[type]} error [description]
	 */
	function ajaxError(type, error, settings) {
		settings.error.call(settings.context, type, error);
		ajaxComplete(type, settings);
	}

	/**
	 * [ajaxComplete 完成]
	 * @param {[type]} data [description]
	 */
	function ajaxComplete(status, settings) {
		settings.complete.call(settings.context, status);
	}


	/**
	 * [Ajax Ajax请求]
	 * @param {[type]} options [description]
	 */
	function Ajax(options) {
		var defaults = Ajax.settings,
			settings = extend({}, options || {});

		for (var key in defaults) {
			if('undefined' === typeof settings[key]) settings[key] = defaults[key];
		}
	
		if (!settings.crossDomain) {
			settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host
		} 

		var dataType = settings.dataType,
			hasPlaceholder = /=\?/.test(settings.url);

		/* jsonp */
		if (dataType == 'jsonp' || hasPlaceholder) {
			if (!hasPlaceholder) {
				settings.url = appendQuery(settings.url, 'callback=?');	
			} 
			return Ajax.jsonp(settings);
		}

		if (!settings.url) {
			settings.url = window.location.toString();
		}

		serializeData(settings);

		var mime = settings.accepts[dataType],
			baseHeaders = {},
			protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
			xhr = Ajax.settings.xhr(),
			abortTimeout;

		if (!settings.crossDomain){
			baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
		}

		if (mime) {
			baseHeaders['Accept'] = mime;

			if (mime.indexOf(',') > -1) {
				mime = mime.split(',', 2)[0];
			}

			xhr.overrideMimeType && xhr.overrideMimeType(mime);
		}

		/* Not get request*/
		if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET')) {
			baseHeaders['Content-Type'] = settings.contentType || 'application/x-www-form-urlencoded';
		}
			
		settings.headers = extend(baseHeaders, settings.headers || {})

		xhr.onreadystatechange = function() {
			var result, error = false;

			if (xhr.readyState == 4) {
				clearTimeout(abortTimeout);
				var result, error = false;

				if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
					dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
					result = xhr.responseText

					try {
						switch(dataType) {
							case 'script': 
								(1, eval)(result);
								break;
							case 'xml': 
								result = xhr.responseXML;
								break;
							case 'json':
								result = blankRE.test(result) ? null : JSON.parse(result);
								break;
						}
					} catch (e) {
						error = e
					}

					if(error) {
						ajaxError('parsererror', error, settings);
					}else {
						ajaxSuccess(result, settings);
					}
				} else {
					ajaxError('error', xhr.status, settings);
				}
			}
		}

		var async = 'async' in settings ? settings.async : true;

		xhr.open(settings.type, settings.url, async);

		for (var name in settings.headers) {
			xhr.setRequestHeader(name, settings.headers[name]);
		}

		if (ajaxBeforeSend(settings) === false) {
			xhr.abort()
			return false
		}

		if (settings.timeout > 0) {
			abortTimeout = setTimeout(function() {
				xhr.onreadystatechange = noop;
				xhr.abort();
				ajaxError('timeout', null, settings);
			}, settings.timeout);
		}

		// settings.data 空串判断
		xhr.send(settings.data ? settings.data : null);

		return xhr;
	}


	/**
	 * [settings 默认配置项]
	 */
	Ajax.settings = {
		// Default type of request
		type: 'GET',

		// The context for the callbacks
		context: null,

		// Transport
		xhr: function() {
			return new window.XMLHttpRequest();
		},

		// MIME types mapping
		accepts: {
			script: 'text/javascript, application/javascript',
			json: jsonType,
			xml: 'application/xml, text/xml',
			html: htmlType,
			text: 'text/plain'
		},
		// Whether the request is to another domain
		crossDomain: false,
		// Default timeout
		timeout: 0,
		// Callback that is executed before request
		beforeSend: noop,
		// Callback that is executed if the request succeeds
		success: noop,
		// Callback that is executed the the server drops error
		error: noop,
		// Callback that is executed on request complete (both: error and success)
		complete: noop
	}


	/**
	 * [jsonp JSONP 请求]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	Ajax.jsonp = function(options) {
		if (!('type' in options)) return ajax(options);

		var callbackName = 'jsonp__' + (++jsonpID),
			script = document.createElement('script'),
			xhr = {
				abort: function() {
					// remove script
					head.removeChild(script);

					window[callbackName] && (window[callbackName] = noop);
				}
			},
			abortTimeout,
			head = document.getElementsByTagName("head")[0] || document.documentElement

		if ('function' === typeof options.error) {
			script.onerror = function(error) {
				// remove script
				// head.removeChild(script);

				delete window[callbackName];

				ajaxError('error', error, options);
			}
		}

		window[callbackName] = function(data) {
			clearTimeout(abortTimeout);
			
			// remove script
			head.removeChild(script);

			delete window[callbackName];

			ajaxSuccess(data, options);
		}

		serializeData(options);

		script.src = options.url.replace(/=\?/, '=' + callbackName)

		// Use insertBefore instead of appendChild to circumvent an IE6 bug.
		// This arises when a base node is used (see jQuery bugs #2709 and #4378).
		head.insertBefore(script, head.firstChild);

		if (options.timeout > 0){
			abortTimeout = setTimeout(function() {
				xhr.abort();
				ajaxComplete('timeout', options);
			}, options.timeout);
		}

		return xhr
	}

	window.Ajax = Ajax;
})(window);
