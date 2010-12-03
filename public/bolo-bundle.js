(function() {
  var require;
  require = function(path) {
    var m, originalPath;
    originalPath = path;
    if (!(m = require.modules[path])) {
      path += '/index';
      if (!(m = require.modules[path])) {
        throw "Couldn't find module for: " + originalPath;
      }
    }
    if (!m.exports) {
      m.exports = {};
      m.call(m.exports, m, m.exports, require.bind(path));
    }
    return m.exports;
  };
  require.modules = {};
  require.bind = function(path) {
    return function(p) {
      var cwd, part, _i, _len, _ref;
      if (p.charAt(0) !== '.') {
        return require(p);
      }
      cwd = path.split('/');
      cwd.pop();
      _ref = p.split('/');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        if (part === '..') {
          cwd.pop();
        } else {
          if (part !== '.') {
            cwd.push(part);
          }
        }
      }
      return require(cwd.join('/'));
    };
  };
  require.module = function(path, fn) {
    return require.modules[path] = fn;
  };
  window.require = require;
}).call(this);
/*!
 * jQuery JavaScript Library v1.4.2
 * http://jquery.com/
 *
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2010, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Sat Feb 13 22:33:48 2010 -0500
 */
(function( window, undefined ) {

// Define a local copy of jQuery
var jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context );
	},

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	// A central reference to the root jQuery(document)
	rootjQuery,

	// A simple way to check for HTML strings or ID strings
	// (both of which we optimize for)
	quickExpr = /^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/,

	// Is it a simple selector
	isSimple = /^.[^:#\[\.,]*$/,

	// Check if a string has a non-whitespace character in it
	rnotwhite = /\S/,

	// Used for trimming whitespace
	rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,

	// Keep a UserAgent string for use with jQuery.browser
	userAgent = navigator.userAgent,

	// For matching the engine and version of the browser
	browserMatch,
	
	// Has the ready events already been bound?
	readyBound = false,
	
	// The functions to execute on DOM ready
	readyList = [],

	// The ready event handler
	DOMContentLoaded,

	// Save a reference to some core methods
	toString = Object.prototype.toString,
	hasOwnProperty = Object.prototype.hasOwnProperty,
	push = Array.prototype.push,
	slice = Array.prototype.slice,
	indexOf = Array.prototype.indexOf;

jQuery.fn = jQuery.prototype = {
	init: function( selector, context ) {
		var match, elem, ret, doc;

		// Handle $(""), $(null), or $(undefined)
		if ( !selector ) {
			return this;
		}

		// Handle $(DOMElement)
		if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		}
		
		// The body element only exists once, optimize finding it
		if ( selector === "body" && !context ) {
			this.context = document;
			this[0] = document.body;
			this.selector = "body";
			this.length = 1;
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			// Are we dealing with HTML string or an ID?
			match = quickExpr.exec( selector );

			// Verify a match, and that no context was specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					doc = (context ? context.ownerDocument || context : document);

					// If a single string is passed in and it's a single tag
					// just do a createElement and skip the rest
					ret = rsingleTag.exec( selector );

					if ( ret ) {
						if ( jQuery.isPlainObject( context ) ) {
							selector = [ document.createElement( ret[1] ) ];
							jQuery.fn.attr.call( selector, context, true );

						} else {
							selector = [ doc.createElement( ret[1] ) ];
						}

					} else {
						ret = buildFragment( [ match[1] ], [ doc ] );
						selector = (ret.cacheable ? ret.fragment.cloneNode(true) : ret.fragment).childNodes;
					}
					
					return jQuery.merge( this, selector );
					
				// HANDLE: $("#id")
				} else {
					elem = document.getElementById( match[2] );

					if ( elem ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $("TAG")
			} else if ( !context && /^\w+$/.test( selector ) ) {
				this.selector = selector;
				this.context = document;
				selector = document.getElementsByTagName( selector );
				return jQuery.merge( this, selector );

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return (context || rootjQuery).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return jQuery( context ).find( selector );
			}

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if (selector.selector !== undefined) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "1.4.2",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	toArray: function() {
		return slice.call( this, 0 );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this.slice(num)[ 0 ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems, name, selector ) {
		// Build a new jQuery matched element set
		var ret = jQuery();

		if ( jQuery.isArray( elems ) ) {
			push.apply( ret, elems );
		
		} else {
			jQuery.merge( ret, elems );
		}

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		ret.context = this.context;

		if ( name === "find" ) {
			ret.selector = this.selector + (this.selector ? " " : "") + selector;
		} else if ( name ) {
			ret.selector = this.selector + "." + name + "(" + selector + ")";
		}

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},
	
	ready: function( fn ) {
		// Attach the listeners
		jQuery.bindReady();

		// If the DOM is already ready
		if ( jQuery.isReady ) {
			// Execute the function immediately
			fn.call( document, jQuery );

		// Otherwise, remember the function for later
		} else if ( readyList ) {
			// Add the function to the wait list
			readyList.push( fn );
		}

		return this;
	},
	
	eq: function( i ) {
		return i === -1 ?
			this.slice( i ) :
			this.slice( i, +i + 1 );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ),
			"slice", slice.call(arguments).join(",") );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},
	
	end: function() {
		return this.prevObject || jQuery(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	// copy reference to target object
	var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging object literal values or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || jQuery.isArray(copy) ) ) {
					var clone = src && ( jQuery.isPlainObject(src) || jQuery.isArray(src) ) ? src
						: jQuery.isArray(copy) ? [] : {};

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	noConflict: function( deep ) {
		window.$ = _$;

		if ( deep ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},
	
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,
	
	// Handle when the DOM is ready
	ready: function() {
		// Make sure that the DOM is not already loaded
		if ( !jQuery.isReady ) {
			// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
			if ( !document.body ) {
				return setTimeout( jQuery.ready, 13 );
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If there are functions bound, to execute
			if ( readyList ) {
				// Execute all of them
				var fn, i = 0;
				while ( (fn = readyList[ i++ ]) ) {
					fn.call( document, jQuery );
				}

				// Reset the list of functions
				readyList = null;
			}

			// Trigger any bound ready events
			if ( jQuery.fn.triggerHandler ) {
				jQuery( document ).triggerHandler( "ready" );
			}
		}
	},
	
	bindReady: function() {
		if ( readyBound ) {
			return;
		}

		readyBound = true;

		// Catch cases where $(document).ready() is called after the
		// browser event has already occurred.
		if ( document.readyState === "complete" ) {
			return jQuery.ready();
		}

		// Mozilla, Opera and webkit nightlies currently support this event
		if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
			
			// A fallback to window.onload, that will always work
			window.addEventListener( "load", jQuery.ready, false );

		// If IE event model is used
		} else if ( document.attachEvent ) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			document.attachEvent("onreadystatechange", DOMContentLoaded);
			
			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", jQuery.ready );

			// If IE and not a frame
			// continually check to see if the document is ready
			var toplevel = false;

			try {
				toplevel = window.frameElement == null;
			} catch(e) {}

			if ( document.documentElement.doScroll && toplevel ) {
				doScrollCheck();
			}
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return toString.call(obj) === "[object Function]";
	},

	isArray: function( obj ) {
		return toString.call(obj) === "[object Array]";
	},

	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
			return false;
		}
		
		// Not own constructor property must be Object
		if ( obj.constructor
			&& !hasOwnProperty.call(obj, "constructor")
			&& !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}
		
		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
	
		var key;
		for ( key in obj ) {}
		
		return key === undefined || hasOwnProperty.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		for ( var name in obj ) {
			return false;
		}
		return true;
	},
	
	error: function( msg ) {
		throw msg;
	},
	
	parseJSON: function( data ) {
		if ( typeof data !== "string" || !data ) {
			return null;
		}

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = jQuery.trim( data );
		
		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			// Try to use the native JSON parser first
			return window.JSON && window.JSON.parse ?
				window.JSON.parse( data ) :
				(new Function("return " + data))();

		} else {
			jQuery.error( "Invalid JSON: " + data );
		}
	},

	noop: function() {},

	// Evalulates a script in a global context
	globalEval: function( data ) {
		if ( data && rnotwhite.test(data) ) {
			// Inspired by code by Andrea Giammarchi
			// http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				script = document.createElement("script");

			script.type = "text/javascript";

			if ( jQuery.support.scriptEval ) {
				script.appendChild( document.createTextNode( data ) );
			} else {
				script.text = data;
			}

			// Use insertBefore instead of appendChild to circumvent an IE6 bug.
			// This arises when a base node is used (#2709).
			head.insertBefore( script, head.firstChild );
			head.removeChild( script );
		}
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
	},

	// args is for internal usage only
	each: function( object, callback, args ) {
		var name, i = 0,
			length = object.length,
			isObj = length === undefined || jQuery.isFunction(object);

		if ( args ) {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.apply( object[ name ], args ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.apply( object[ i++ ], args ) === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
						break;
					}
				}
			} else {
				for ( var value = object[0];
					i < length && callback.call( value, i, value ) !== false; value = object[++i] ) {}
			}
		}

		return object;
	},

	trim: function( text ) {
		return (text || "").replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( array, results ) {
		var ret = results || [];

		if ( array != null ) {
			// The window, strings (and functions) also have 'length'
			// The extra typeof function check is to prevent crashes
			// in Safari 2 (See: #3039)
			if ( array.length == null || typeof array === "string" || jQuery.isFunction(array) || (typeof array !== "function" && array.setInterval) ) {
				push.call( ret, array );
			} else {
				jQuery.merge( ret, array );
			}
		}

		return ret;
	},

	inArray: function( elem, array ) {
		if ( array.indexOf ) {
			return array.indexOf( elem );
		}

		for ( var i = 0, length = array.length; i < length; i++ ) {
			if ( array[ i ] === elem ) {
				return i;
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var i = first.length, j = 0;

		if ( typeof second.length === "number" ) {
			for ( var l = second.length; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var ret = [];

		// Go through the array, only saving the items
		// that pass the validator function
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			if ( !inv !== !callback( elems[ i ], i ) ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var ret = [], value;

		// Go through the array, translating each of the items to their
		// new value (or values).
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			value = callback( elems[ i ], i, arg );

			if ( value != null ) {
				ret[ ret.length ] = value;
			}
		}

		return ret.concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	proxy: function( fn, proxy, thisObject ) {
		if ( arguments.length === 2 ) {
			if ( typeof proxy === "string" ) {
				thisObject = fn;
				fn = thisObject[ proxy ];
				proxy = undefined;

			} else if ( proxy && !jQuery.isFunction( proxy ) ) {
				thisObject = proxy;
				proxy = undefined;
			}
		}

		if ( !proxy && fn ) {
			proxy = function() {
				return fn.apply( thisObject || this, arguments );
			};
		}

		// Set the guid of unique handler to the same of original handler, so it can be removed
		if ( fn ) {
			proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;
		}

		// So proxy can be declared as an argument
		return proxy;
	},

	// Use of jQuery.browser is frowned upon.
	// More details: http://docs.jquery.com/Utilities/jQuery.browser
	uaMatch: function( ua ) {
		ua = ua.toLowerCase();

		var match = /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
			/(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
			/(msie) ([\w.]+)/.exec( ua ) ||
			!/compatible/.test( ua ) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) ||
		  	[];

		return { browser: match[1] || "", version: match[2] || "0" };
	},

	browser: {}
});

browserMatch = jQuery.uaMatch( userAgent );
if ( browserMatch.browser ) {
	jQuery.browser[ browserMatch.browser ] = true;
	jQuery.browser.version = browserMatch.version;
}

// Deprecated, use jQuery.browser.webkit instead
if ( jQuery.browser.webkit ) {
	jQuery.browser.safari = true;
}

if ( indexOf ) {
	jQuery.inArray = function( elem, array ) {
		return indexOf.call( array, elem );
	};
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);

// Cleanup functions for the document ready method
if ( document.addEventListener ) {
	DOMContentLoaded = function() {
		document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
		jQuery.ready();
	};

} else if ( document.attachEvent ) {
	DOMContentLoaded = function() {
		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( document.readyState === "complete" ) {
			document.detachEvent( "onreadystatechange", DOMContentLoaded );
			jQuery.ready();
		}
	};
}

// The DOM ready check for Internet Explorer
function doScrollCheck() {
	if ( jQuery.isReady ) {
		return;
	}

	try {
		// If IE is used, use the trick by Diego Perini
		// http://javascript.nwbox.com/IEContentLoaded/
		document.documentElement.doScroll("left");
	} catch( error ) {
		setTimeout( doScrollCheck, 1 );
		return;
	}

	// and execute any waiting functions
	jQuery.ready();
}

function evalScript( i, elem ) {
	if ( elem.src ) {
		jQuery.ajax({
			url: elem.src,
			async: false,
			dataType: "script"
		});
	} else {
		jQuery.globalEval( elem.text || elem.textContent || elem.innerHTML || "" );
	}

	if ( elem.parentNode ) {
		elem.parentNode.removeChild( elem );
	}
}

// Mutifunctional method to get and set values to a collection
// The value/s can be optionally by executed if its a function
function access( elems, key, value, exec, fn, pass ) {
	var length = elems.length;
	
	// Setting many attributes
	if ( typeof key === "object" ) {
		for ( var k in key ) {
			access( elems, k, key[k], exec, fn, value );
		}
		return elems;
	}
	
	// Setting one attribute
	if ( value !== undefined ) {
		// Optionally, function values get executed if exec is true
		exec = !pass && exec && jQuery.isFunction(value);
		
		for ( var i = 0; i < length; i++ ) {
			fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
		}
		
		return elems;
	}
	
	// Getting an attribute
	return length ? fn( elems[0], key ) : undefined;
}

function now() {
	return (new Date).getTime();
}
(function() {

	jQuery.support = {};

	var root = document.documentElement,
		script = document.createElement("script"),
		div = document.createElement("div"),
		id = "script" + now();

	div.style.display = "none";
	div.innerHTML = "   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";

	var all = div.getElementsByTagName("*"),
		a = div.getElementsByTagName("a")[0];

	// Can't get basic test support
	if ( !all || !all.length || !a ) {
		return;
	}

	jQuery.support = {
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: div.firstChild.nodeType === 3,

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText insted)
		style: /red/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: a.getAttribute("href") === "/a",

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.55$/.test( a.style.opacity ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Make sure that if no value is specified for a checkbox
		// that it defaults to "on".
		// (WebKit defaults to "" instead)
		checkOn: div.getElementsByTagName("input")[0].value === "on",

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: document.createElement("select").appendChild( document.createElement("option") ).selected,

		parentNode: div.removeChild( div.appendChild( document.createElement("div") ) ).parentNode === null,

		// Will be defined later
		deleteExpando: true,
		checkClone: false,
		scriptEval: false,
		noCloneEvent: true,
		boxModel: null
	};

	script.type = "text/javascript";
	try {
		script.appendChild( document.createTextNode( "window." + id + "=1;" ) );
	} catch(e) {}

	root.insertBefore( script, root.firstChild );

	// Make sure that the execution of code works by injecting a script
	// tag with appendChild/createTextNode
	// (IE doesn't support this, fails, and uses .text instead)
	if ( window[ id ] ) {
		jQuery.support.scriptEval = true;
		delete window[ id ];
	}

	// Test to see if it's possible to delete an expando from an element
	// Fails in Internet Explorer
	try {
		delete script.test;
	
	} catch(e) {
		jQuery.support.deleteExpando = false;
	}

	root.removeChild( script );

	if ( div.attachEvent && div.fireEvent ) {
		div.attachEvent("onclick", function click() {
			// Cloning a node shouldn't copy over any
			// bound event handlers (IE does this)
			jQuery.support.noCloneEvent = false;
			div.detachEvent("onclick", click);
		});
		div.cloneNode(true).fireEvent("onclick");
	}

	div = document.createElement("div");
	div.innerHTML = "<input type='radio' name='radiotest' checked='checked'/>";

	var fragment = document.createDocumentFragment();
	fragment.appendChild( div.firstChild );

	// WebKit doesn't clone checked state correctly in fragments
	jQuery.support.checkClone = fragment.cloneNode(true).cloneNode(true).lastChild.checked;

	// Figure out if the W3C box model works as expected
	// document.body must exist before we can do this
	jQuery(function() {
		var div = document.createElement("div");
		div.style.width = div.style.paddingLeft = "1px";

		document.body.appendChild( div );
		jQuery.boxModel = jQuery.support.boxModel = div.offsetWidth === 2;
		document.body.removeChild( div ).style.display = 'none';

		div = null;
	});

	// Technique from Juriy Zaytsev
	// http://thinkweb2.com/projects/prototype/detecting-event-support-without-browser-sniffing/
	var eventSupported = function( eventName ) { 
		var el = document.createElement("div"); 
		eventName = "on" + eventName; 

		var isSupported = (eventName in el); 
		if ( !isSupported ) { 
			el.setAttribute(eventName, "return;"); 
			isSupported = typeof el[eventName] === "function"; 
		} 
		el = null; 

		return isSupported; 
	};
	
	jQuery.support.submitBubbles = eventSupported("submit");
	jQuery.support.changeBubbles = eventSupported("change");

	// release memory in IE
	root = script = div = all = a = null;
})();

jQuery.props = {
	"for": "htmlFor",
	"class": "className",
	readonly: "readOnly",
	maxlength: "maxLength",
	cellspacing: "cellSpacing",
	rowspan: "rowSpan",
	colspan: "colSpan",
	tabindex: "tabIndex",
	usemap: "useMap",
	frameborder: "frameBorder"
};
var expando = "jQuery" + now(), uuid = 0, windowData = {};

jQuery.extend({
	cache: {},
	
	expando:expando,

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		"object": true,
		"applet": true
	},

	data: function( elem, name, data ) {
		if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
			return;
		}

		elem = elem == window ?
			windowData :
			elem;

		var id = elem[ expando ], cache = jQuery.cache, thisCache;

		if ( !id && typeof name === "string" && data === undefined ) {
			return null;
		}

		// Compute a unique ID for the element
		if ( !id ) { 
			id = ++uuid;
		}

		// Avoid generating a new cache unless none exists and we
		// want to manipulate it.
		if ( typeof name === "object" ) {
			elem[ expando ] = id;
			thisCache = cache[ id ] = jQuery.extend(true, {}, name);

		} else if ( !cache[ id ] ) {
			elem[ expando ] = id;
			cache[ id ] = {};
		}

		thisCache = cache[ id ];

		// Prevent overriding the named cache with undefined values
		if ( data !== undefined ) {
			thisCache[ name ] = data;
		}

		return typeof name === "string" ? thisCache[ name ] : thisCache;
	},

	removeData: function( elem, name ) {
		if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
			return;
		}

		elem = elem == window ?
			windowData :
			elem;

		var id = elem[ expando ], cache = jQuery.cache, thisCache = cache[ id ];

		// If we want to remove a specific section of the element's data
		if ( name ) {
			if ( thisCache ) {
				// Remove the section of cache data
				delete thisCache[ name ];

				// If we've removed all the data, remove the element's cache
				if ( jQuery.isEmptyObject(thisCache) ) {
					jQuery.removeData( elem );
				}
			}

		// Otherwise, we want to remove all of the element's data
		} else {
			if ( jQuery.support.deleteExpando ) {
				delete elem[ jQuery.expando ];

			} else if ( elem.removeAttribute ) {
				elem.removeAttribute( jQuery.expando );
			}

			// Completely remove the data cache
			delete cache[ id ];
		}
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		if ( typeof key === "undefined" && this.length ) {
			return jQuery.data( this[0] );

		} else if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		var parts = key.split(".");
		parts[1] = parts[1] ? "." + parts[1] : "";

		if ( value === undefined ) {
			var data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);

			if ( data === undefined && this.length ) {
				data = jQuery.data( this[0], key );
			}
			return data === undefined && parts[1] ?
				this.data( parts[0] ) :
				data;
		} else {
			return this.trigger("setData" + parts[1] + "!", [parts[0], value]).each(function() {
				jQuery.data( this, key, value );
			});
		}
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});
jQuery.extend({
	queue: function( elem, type, data ) {
		if ( !elem ) {
			return;
		}

		type = (type || "fx") + "queue";
		var q = jQuery.data( elem, type );

		// Speed up dequeue by getting out quickly if this is just a lookup
		if ( !data ) {
			return q || [];
		}

		if ( !q || jQuery.isArray(data) ) {
			q = jQuery.data( elem, type, jQuery.makeArray(data) );

		} else {
			q.push( data );
		}

		return q;
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ), fn = queue.shift();

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
		}

		if ( fn ) {
			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift("inprogress");
			}

			fn.call(elem, function() {
				jQuery.dequeue(elem, type);
			});
		}
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
		}

		if ( data === undefined ) {
			return jQuery.queue( this[0], type );
		}
		return this.each(function( i, elem ) {
			var queue = jQuery.queue( this, type, data );

			if ( type === "fx" && queue[0] !== "inprogress" ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},

	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
		type = type || "fx";

		return this.queue( type, function() {
			var elem = this;
			setTimeout(function() {
				jQuery.dequeue( elem, type );
			}, time );
		});
	},

	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	}
});
var rclass = /[\n\t]/g,
	rspace = /\s+/,
	rreturn = /\r/g,
	rspecialurl = /href|src|style/,
	rtype = /(button|input)/i,
	rfocusable = /(button|input|object|select|textarea)/i,
	rclickable = /^(a|area)$/i,
	rradiocheck = /radio|checkbox/;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, name, value, true, jQuery.attr );
	},

	removeAttr: function( name, fn ) {
		return this.each(function(){
			jQuery.attr( this, name, "" );
			if ( this.nodeType === 1 ) {
				this.removeAttribute( name );
			}
		});
	},

	addClass: function( value ) {
		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.addClass( value.call(this, i, self.attr("class")) );
			});
		}

		if ( value && typeof value === "string" ) {
			var classNames = (value || "").split( rspace );

			for ( var i = 0, l = this.length; i < l; i++ ) {
				var elem = this[i];

				if ( elem.nodeType === 1 ) {
					if ( !elem.className ) {
						elem.className = value;

					} else {
						var className = " " + elem.className + " ", setClass = elem.className;
						for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
							if ( className.indexOf( " " + classNames[c] + " " ) < 0 ) {
								setClass += " " + classNames[c];
							}
						}
						elem.className = jQuery.trim( setClass );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.removeClass( value.call(this, i, self.attr("class")) );
			});
		}

		if ( (value && typeof value === "string") || value === undefined ) {
			var classNames = (value || "").split(rspace);

			for ( var i = 0, l = this.length; i < l; i++ ) {
				var elem = this[i];

				if ( elem.nodeType === 1 && elem.className ) {
					if ( value ) {
						var className = (" " + elem.className + " ").replace(rclass, " ");
						for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
							className = className.replace(" " + classNames[c] + " ", " ");
						}
						elem.className = jQuery.trim( className );

					} else {
						elem.className = "";
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value, isBool = typeof stateVal === "boolean";

		if ( jQuery.isFunction( value ) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.toggleClass( value.call(this, i, self.attr("class"), stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className, i = 0, self = jQuery(this),
					state = stateVal,
					classNames = value.split( rspace );

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space seperated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			} else if ( type === "undefined" || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery.data( this, "__className__", this.className );
				}

				// toggle whole className
				this.className = this.className || value === false ? "" : jQuery.data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ";
		for ( var i = 0, l = this.length; i < l; i++ ) {
			if ( (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) > -1 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		if ( value === undefined ) {
			var elem = this[0];

			if ( elem ) {
				if ( jQuery.nodeName( elem, "option" ) ) {
					return (elem.attributes.value || {}).specified ? elem.value : elem.text;
				}

				// We need to handle select boxes special
				if ( jQuery.nodeName( elem, "select" ) ) {
					var index = elem.selectedIndex,
						values = [],
						options = elem.options,
						one = elem.type === "select-one";

					// Nothing was selected
					if ( index < 0 ) {
						return null;
					}

					// Loop through all the selected options
					for ( var i = one ? index : 0, max = one ? index + 1 : options.length; i < max; i++ ) {
						var option = options[ i ];

						if ( option.selected ) {
							// Get the specifc value for the option
							value = jQuery(option).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;
				}

				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
				if ( rradiocheck.test( elem.type ) && !jQuery.support.checkOn ) {
					return elem.getAttribute("value") === null ? "on" : elem.value;
				}
				

				// Everything else, we just grab the value
				return (elem.value || "").replace(rreturn, "");

			}

			return undefined;
		}

		var isFunction = jQuery.isFunction(value);

		return this.each(function(i) {
			var self = jQuery(this), val = value;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call(this, i, self.val());
			}

			// Typecast each time if the value is a Function and the appended
			// value is therefore different each time.
			if ( typeof val === "number" ) {
				val += "";
			}

			if ( jQuery.isArray(val) && rradiocheck.test( this.type ) ) {
				this.checked = jQuery.inArray( self.val(), val ) >= 0;

			} else if ( jQuery.nodeName( this, "select" ) ) {
				var values = jQuery.makeArray(val);

				jQuery( "option", this ).each(function() {
					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
				});

				if ( !values.length ) {
					this.selectedIndex = -1;
				}

			} else {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	attrFn: {
		val: true,
		css: true,
		html: true,
		text: true,
		data: true,
		width: true,
		height: true,
		offset: true
	},
		
	attr: function( elem, name, value, pass ) {
		// don't set attributes on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
			return undefined;
		}

		if ( pass && name in jQuery.attrFn ) {
			return jQuery(elem)[name](value);
		}

		var notxml = elem.nodeType !== 1 || !jQuery.isXMLDoc( elem ),
			// Whether we are setting (or getting)
			set = value !== undefined;

		// Try to normalize/fix the name
		name = notxml && jQuery.props[ name ] || name;

		// Only do all the following if this is a node (faster for style)
		if ( elem.nodeType === 1 ) {
			// These attributes require special treatment
			var special = rspecialurl.test( name );

			// Safari mis-reports the default selected property of an option
			// Accessing the parent's selectedIndex property fixes it
			if ( name === "selected" && !jQuery.support.optSelected ) {
				var parent = elem.parentNode;
				if ( parent ) {
					parent.selectedIndex;
	
					// Make sure that it also works with optgroups, see #5701
					if ( parent.parentNode ) {
						parent.parentNode.selectedIndex;
					}
				}
			}

			// If applicable, access the attribute via the DOM 0 way
			if ( name in elem && notxml && !special ) {
				if ( set ) {
					// We can't allow the type property to be changed (since it causes problems in IE)
					if ( name === "type" && rtype.test( elem.nodeName ) && elem.parentNode ) {
						jQuery.error( "type property can't be changed" );
					}

					elem[ name ] = value;
				}

				// browsers index elements by id/name on forms, give priority to attributes.
				if ( jQuery.nodeName( elem, "form" ) && elem.getAttributeNode(name) ) {
					return elem.getAttributeNode( name ).nodeValue;
				}

				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				if ( name === "tabIndex" ) {
					var attributeNode = elem.getAttributeNode( "tabIndex" );

					return attributeNode && attributeNode.specified ?
						attributeNode.value :
						rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
							0 :
							undefined;
				}

				return elem[ name ];
			}

			if ( !jQuery.support.style && notxml && name === "style" ) {
				if ( set ) {
					elem.style.cssText = "" + value;
				}

				return elem.style.cssText;
			}

			if ( set ) {
				// convert the value to a string (all browsers do this but IE) see #1070
				elem.setAttribute( name, "" + value );
			}

			var attr = !jQuery.support.hrefNormalized && notxml && special ?
					// Some attributes require a special call on IE
					elem.getAttribute( name, 2 ) :
					elem.getAttribute( name );

			// Non-existent attributes return null, we normalize to undefined
			return attr === null ? undefined : attr;
		}

		// elem is actually elem.style ... set the style
		// Using attr for specific style information is now deprecated. Use style instead.
		return jQuery.style( elem, name, value );
	}
});
var rnamespaces = /\.(.*)$/,
	fcleanup = function( nm ) {
		return nm.replace(/[^\w\s\.\|`]/g, function( ch ) {
			return "\\" + ch;
		});
	};

/*
 * A number of helper functions used for managing events.
 * Many of the ideas behind this code originated from
 * Dean Edwards' addEvent library.
 */
jQuery.event = {

	// Bind an event to an element
	// Original by Dean Edwards
	add: function( elem, types, handler, data ) {
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// For whatever reason, IE has trouble passing the window object
		// around, causing it to be cloned in the process
		if ( elem.setInterval && ( elem !== window && !elem.frameElement ) ) {
			elem = window;
		}

		var handleObjIn, handleObj;

		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
		}

		// Make sure that the function being executed has a unique ID
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure
		var elemData = jQuery.data( elem );

		// If no elemData is found then we must be trying to bind to one of the
		// banned noData elements
		if ( !elemData ) {
			return;
		}

		var events = elemData.events = elemData.events || {},
			eventHandle = elemData.handle, eventHandle;

		if ( !eventHandle ) {
			elemData.handle = eventHandle = function() {
				// Handle the second event of a trigger and when
				// an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && !jQuery.event.triggered ?
					jQuery.event.handle.apply( eventHandle.elem, arguments ) :
					undefined;
			};
		}

		// Add elem as a property of the handle function
		// This is to prevent a memory leak with non-native events in IE.
		eventHandle.elem = elem;

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = types.split(" ");

		var type, i = 0, namespaces;

		while ( (type = types[ i++ ]) ) {
			handleObj = handleObjIn ?
				jQuery.extend({}, handleObjIn) :
				{ handler: handler, data: data };

			// Namespaced event handlers
			if ( type.indexOf(".") > -1 ) {
				namespaces = type.split(".");
				type = namespaces.shift();
				handleObj.namespace = namespaces.slice(0).sort().join(".");

			} else {
				namespaces = [];
				handleObj.namespace = "";
			}

			handleObj.type = type;
			handleObj.guid = handler.guid;

			// Get the current list of functions bound to this event
			var handlers = events[ type ],
				special = jQuery.event.special[ type ] || {};

			// Init the event handler queue
			if ( !handlers ) {
				handlers = events[ type ] = [];

				// Check for a special event handler
				// Only use addEventListener/attachEvent if the special
				// events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}
			
			if ( special.add ) { 
				special.add.call( elem, handleObj ); 

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add the function to the element's handler list
			handlers.push( handleObj );

			// Keep track of which events have been used, for global triggering
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	global: {},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, pos ) {
		// don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		var ret, type, fn, i = 0, all, namespaces, namespace, special, eventType, handleObj, origType,
			elemData = jQuery.data( elem ),
			events = elemData && elemData.events;

		if ( !elemData || !events ) {
			return;
		}

		// types is actually an event object here
		if ( types && types.type ) {
			handler = types.handler;
			types = types.type;
		}

		// Unbind all events for the element
		if ( !types || typeof types === "string" && types.charAt(0) === "." ) {
			types = types || "";

			for ( type in events ) {
				jQuery.event.remove( elem, type + types );
			}

			return;
		}

		// Handle multiple events separated by a space
		// jQuery(...).unbind("mouseover mouseout", fn);
		types = types.split(" ");

		while ( (type = types[ i++ ]) ) {
			origType = type;
			handleObj = null;
			all = type.indexOf(".") < 0;
			namespaces = [];

			if ( !all ) {
				// Namespaced event handlers
				namespaces = type.split(".");
				type = namespaces.shift();

				namespace = new RegExp("(^|\\.)" + 
					jQuery.map( namespaces.slice(0).sort(), fcleanup ).join("\\.(?:.*\\.)?") + "(\\.|$)")
			}

			eventType = events[ type ];

			if ( !eventType ) {
				continue;
			}

			if ( !handler ) {
				for ( var j = 0; j < eventType.length; j++ ) {
					handleObj = eventType[ j ];

					if ( all || namespace.test( handleObj.namespace ) ) {
						jQuery.event.remove( elem, origType, handleObj.handler, j );
						eventType.splice( j--, 1 );
					}
				}

				continue;
			}

			special = jQuery.event.special[ type ] || {};

			for ( var j = pos || 0; j < eventType.length; j++ ) {
				handleObj = eventType[ j ];

				if ( handler.guid === handleObj.guid ) {
					// remove the given handler for the given type
					if ( all || namespace.test( handleObj.namespace ) ) {
						if ( pos == null ) {
							eventType.splice( j--, 1 );
						}

						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}

					if ( pos != null ) {
						break;
					}
				}
			}

			// remove generic event handler if no more handlers exist
			if ( eventType.length === 0 || pos != null && eventType.length === 1 ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces ) === false ) {
					removeEvent( elem, type, elemData.handle );
				}

				ret = null;
				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			var handle = elemData.handle;
			if ( handle ) {
				handle.elem = null;
			}

			delete elemData.events;
			delete elemData.handle;

			if ( jQuery.isEmptyObject( elemData ) ) {
				jQuery.removeData( elem );
			}
		}
	},

	// bubbling is internal
	trigger: function( event, data, elem /*, bubbling */ ) {
		// Event object or event type
		var type = event.type || event,
			bubbling = arguments[3];

		if ( !bubbling ) {
			event = typeof event === "object" ?
				// jQuery.Event object
				event[expando] ? event :
				// Object literal
				jQuery.extend( jQuery.Event(type), event ) :
				// Just the event type (string)
				jQuery.Event(type);

			if ( type.indexOf("!") >= 0 ) {
				event.type = type = type.slice(0, -1);
				event.exclusive = true;
			}

			// Handle a global trigger
			if ( !elem ) {
				// Don't bubble custom events when global (to avoid too much overhead)
				event.stopPropagation();

				// Only trigger if we've ever bound an event for it
				if ( jQuery.event.global[ type ] ) {
					jQuery.each( jQuery.cache, function() {
						if ( this.events && this.events[type] ) {
							jQuery.event.trigger( event, data, this.handle.elem );
						}
					});
				}
			}

			// Handle triggering a single element

			// don't do events on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
				return undefined;
			}

			// Clean up in case it is reused
			event.result = undefined;
			event.target = elem;

			// Clone the incoming data, if any
			data = jQuery.makeArray( data );
			data.unshift( event );
		}

		event.currentTarget = elem;

		// Trigger the event, it is assumed that "handle" is a function
		var handle = jQuery.data( elem, "handle" );
		if ( handle ) {
			handle.apply( elem, data );
		}

		var parent = elem.parentNode || elem.ownerDocument;

		// Trigger an inline bound script
		try {
			if ( !(elem && elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()]) ) {
				if ( elem[ "on" + type ] && elem[ "on" + type ].apply( elem, data ) === false ) {
					event.result = false;
				}
			}

		// prevent IE from throwing an error for some elements with some event types, see #3533
		} catch (e) {}

		if ( !event.isPropagationStopped() && parent ) {
			jQuery.event.trigger( event, data, parent, true );

		} else if ( !event.isDefaultPrevented() ) {
			var target = event.target, old,
				isClick = jQuery.nodeName(target, "a") && type === "click",
				special = jQuery.event.special[ type ] || {};

			if ( (!special._default || special._default.call( elem, event ) === false) && 
				!isClick && !(target && target.nodeName && jQuery.noData[target.nodeName.toLowerCase()]) ) {

				try {
					if ( target[ type ] ) {
						// Make sure that we don't accidentally re-trigger the onFOO events
						old = target[ "on" + type ];

						if ( old ) {
							target[ "on" + type ] = null;
						}

						jQuery.event.triggered = true;
						target[ type ]();
					}

				// prevent IE from throwing an error for some elements with some event types, see #3533
				} catch (e) {}

				if ( old ) {
					target[ "on" + type ] = old;
				}

				jQuery.event.triggered = false;
			}
		}
	},

	handle: function( event ) {
		var all, handlers, namespaces, namespace, events;

		event = arguments[0] = jQuery.event.fix( event || window.event );
		event.currentTarget = this;

		// Namespaced event handlers
		all = event.type.indexOf(".") < 0 && !event.exclusive;

		if ( !all ) {
			namespaces = event.type.split(".");
			event.type = namespaces.shift();
			namespace = new RegExp("(^|\\.)" + namespaces.slice(0).sort().join("\\.(?:.*\\.)?") + "(\\.|$)");
		}

		var events = jQuery.data(this, "events"), handlers = events[ event.type ];

		if ( events && handlers ) {
			// Clone the handlers to prevent manipulation
			handlers = handlers.slice(0);

			for ( var j = 0, l = handlers.length; j < l; j++ ) {
				var handleObj = handlers[ j ];

				// Filter the functions by class
				if ( all || namespace.test( handleObj.namespace ) ) {
					// Pass in a reference to the handler function itself
					// So that we can later remove it
					event.handler = handleObj.handler;
					event.data = handleObj.data;
					event.handleObj = handleObj;
	
					var ret = handleObj.handler.apply( this, arguments );

					if ( ret !== undefined ) {
						event.result = ret;
						if ( ret === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}

					if ( event.isImmediatePropagationStopped() ) {
						break;
					}
				}
			}
		}

		return event.result;
	},

	props: "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),

	fix: function( event ) {
		if ( event[ expando ] ) {
			return event;
		}

		// store a copy of the original event object
		// and "clone" to set read-only properties
		var originalEvent = event;
		event = jQuery.Event( originalEvent );

		for ( var i = this.props.length, prop; i; ) {
			prop = this.props[ --i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Fix target property, if necessary
		if ( !event.target ) {
			event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either
		}

		// check if target is a textnode (safari)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Add relatedTarget, if necessary
		if ( !event.relatedTarget && event.fromElement ) {
			event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
		}

		// Calculate pageX/Y if missing and clientX/Y available
		if ( event.pageX == null && event.clientX != null ) {
			var doc = document.documentElement, body = document.body;
			event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
			event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
		}

		// Add which for key events
		if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) ) {
			event.which = event.charCode || event.keyCode;
		}

		// Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
		if ( !event.metaKey && event.ctrlKey ) {
			event.metaKey = event.ctrlKey;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		// Note: button is not normalized, so don't use it
		if ( !event.which && event.button !== undefined ) {
			event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
		}

		return event;
	},

	// Deprecated, use jQuery.guid instead
	guid: 1E8,

	// Deprecated, use jQuery.proxy instead
	proxy: jQuery.proxy,

	special: {
		ready: {
			// Make sure the ready event is setup
			setup: jQuery.bindReady,
			teardown: jQuery.noop
		},

		live: {
			add: function( handleObj ) {
				jQuery.event.add( this, handleObj.origType, jQuery.extend({}, handleObj, {handler: liveHandler}) ); 
			},

			remove: function( handleObj ) {
				var remove = true,
					type = handleObj.origType.replace(rnamespaces, "");
				
				jQuery.each( jQuery.data(this, "events").live || [], function() {
					if ( type === this.origType.replace(rnamespaces, "") ) {
						remove = false;
						return false;
					}
				});

				if ( remove ) {
					jQuery.event.remove( this, handleObj.origType, liveHandler );
				}
			}

		},

		beforeunload: {
			setup: function( data, namespaces, eventHandle ) {
				// We only want to do this special case on windows
				if ( this.setInterval ) {
					this.onbeforeunload = eventHandle;
				}

				return false;
			},
			teardown: function( namespaces, eventHandle ) {
				if ( this.onbeforeunload === eventHandle ) {
					this.onbeforeunload = null;
				}
			}
		}
	}
};

var removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		elem.removeEventListener( type, handle, false );
	} : 
	function( elem, type, handle ) {
		elem.detachEvent( "on" + type, handle );
	};

jQuery.Event = function( src ) {
	// Allow instantiation without the 'new' keyword
	if ( !this.preventDefault ) {
		return new jQuery.Event( src );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;
	// Event type
	} else {
		this.type = src;
	}

	// timeStamp is buggy for some events on Firefox(#3843)
	// So we won't rely on the native value
	this.timeStamp = now();

	// Mark it as fixed
	this[ expando ] = true;
};

function returnFalse() {
	return false;
}
function returnTrue() {
	return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}
		
		// if preventDefault exists run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();
		}
		// otherwise set the returnValue property of the original event to false (IE)
		e.returnValue = false;
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}
		// if stopPropagation exists run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}
		// otherwise set the cancelBubble property of the original event to true (IE)
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};

// Checks if an event happened on an element within another element
// Used in jQuery.event.special.mouseenter and mouseleave handlers
var withinElement = function( event ) {
	// Check if mouse(over|out) are still within the same parent element
	var parent = event.relatedTarget;

	// Firefox sometimes assigns relatedTarget a XUL element
	// which we cannot access the parentNode property of
	try {
		// Traverse up the tree
		while ( parent && parent !== this ) {
			parent = parent.parentNode;
		}

		if ( parent !== this ) {
			// set the correct event type
			event.type = event.data;

			// handle event if we actually just moused on to a non sub-element
			jQuery.event.handle.apply( this, arguments );
		}

	// assuming we've left the element since we most likely mousedover a xul element
	} catch(e) { }
},

// In case of event delegation, we only need to rename the event.type,
// liveHandler will take care of the rest.
delegate = function( event ) {
	event.type = event.data;
	jQuery.event.handle.apply( this, arguments );
};

// Create mouseenter and mouseleave events
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		setup: function( data ) {
			jQuery.event.add( this, fix, data && data.selector ? delegate : withinElement, orig );
		},
		teardown: function( data ) {
			jQuery.event.remove( this, fix, data && data.selector ? delegate : withinElement );
		}
	};
});

// submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function( data, namespaces ) {
			if ( this.nodeName.toLowerCase() !== "form" ) {
				jQuery.event.add(this, "click.specialSubmit", function( e ) {
					var elem = e.target, type = elem.type;

					if ( (type === "submit" || type === "image") && jQuery( elem ).closest("form").length ) {
						return trigger( "submit", this, arguments );
					}
				});
	 
				jQuery.event.add(this, "keypress.specialSubmit", function( e ) {
					var elem = e.target, type = elem.type;

					if ( (type === "text" || type === "password") && jQuery( elem ).closest("form").length && e.keyCode === 13 ) {
						return trigger( "submit", this, arguments );
					}
				});

			} else {
				return false;
			}
		},

		teardown: function( namespaces ) {
			jQuery.event.remove( this, ".specialSubmit" );
		}
	};

}

// change delegation, happens here so we have bind.
if ( !jQuery.support.changeBubbles ) {

	var formElems = /textarea|input|select/i,

	changeFilters,

	getVal = function( elem ) {
		var type = elem.type, val = elem.value;

		if ( type === "radio" || type === "checkbox" ) {
			val = elem.checked;

		} else if ( type === "select-multiple" ) {
			val = elem.selectedIndex > -1 ?
				jQuery.map( elem.options, function( elem ) {
					return elem.selected;
				}).join("-") :
				"";

		} else if ( elem.nodeName.toLowerCase() === "select" ) {
			val = elem.selectedIndex;
		}

		return val;
	},

	testChange = function testChange( e ) {
		var elem = e.target, data, val;

		if ( !formElems.test( elem.nodeName ) || elem.readOnly ) {
			return;
		}

		data = jQuery.data( elem, "_change_data" );
		val = getVal(elem);

		// the current data will be also retrieved by beforeactivate
		if ( e.type !== "focusout" || elem.type !== "radio" ) {
			jQuery.data( elem, "_change_data", val );
		}
		
		if ( data === undefined || val === data ) {
			return;
		}

		if ( data != null || val ) {
			e.type = "change";
			return jQuery.event.trigger( e, arguments[1], elem );
		}
	};

	jQuery.event.special.change = {
		filters: {
			focusout: testChange, 

			click: function( e ) {
				var elem = e.target, type = elem.type;

				if ( type === "radio" || type === "checkbox" || elem.nodeName.toLowerCase() === "select" ) {
					return testChange.call( this, e );
				}
			},

			// Change has to be called before submit
			// Keydown will be called before keypress, which is used in submit-event delegation
			keydown: function( e ) {
				var elem = e.target, type = elem.type;

				if ( (e.keyCode === 13 && elem.nodeName.toLowerCase() !== "textarea") ||
					(e.keyCode === 32 && (type === "checkbox" || type === "radio")) ||
					type === "select-multiple" ) {
					return testChange.call( this, e );
				}
			},

			// Beforeactivate happens also before the previous element is blurred
			// with this event you can't trigger a change event, but you can store
			// information/focus[in] is not needed anymore
			beforeactivate: function( e ) {
				var elem = e.target;
				jQuery.data( elem, "_change_data", getVal(elem) );
			}
		},

		setup: function( data, namespaces ) {
			if ( this.type === "file" ) {
				return false;
			}

			for ( var type in changeFilters ) {
				jQuery.event.add( this, type + ".specialChange", changeFilters[type] );
			}

			return formElems.test( this.nodeName );
		},

		teardown: function( namespaces ) {
			jQuery.event.remove( this, ".specialChange" );

			return formElems.test( this.nodeName );
		}
	};

	changeFilters = jQuery.event.special.change.filters;
}

function trigger( type, elem, args ) {
	args[0].type = type;
	return jQuery.event.handle.apply( elem, args );
}

// Create "bubbling" focus and blur events
if ( document.addEventListener ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {
		jQuery.event.special[ fix ] = {
			setup: function() {
				this.addEventListener( orig, handler, true );
			}, 
			teardown: function() { 
				this.removeEventListener( orig, handler, true );
			}
		};

		function handler( e ) { 
			e = jQuery.event.fix( e );
			e.type = fix;
			return jQuery.event.handle.call( this, e );
		}
	});
}

jQuery.each(["bind", "one"], function( i, name ) {
	jQuery.fn[ name ] = function( type, data, fn ) {
		// Handle object literals
		if ( typeof type === "object" ) {
			for ( var key in type ) {
				this[ name ](key, data, type[key], fn);
			}
			return this;
		}
		
		if ( jQuery.isFunction( data ) ) {
			fn = data;
			data = undefined;
		}

		var handler = name === "one" ? jQuery.proxy( fn, function( event ) {
			jQuery( this ).unbind( event, handler );
			return fn.apply( this, arguments );
		}) : fn;

		if ( type === "unload" && name !== "one" ) {
			this.one( type, data, fn );

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				jQuery.event.add( this[i], type, handler, data );
			}
		}

		return this;
	};
});

jQuery.fn.extend({
	unbind: function( type, fn ) {
		// Handle object literals
		if ( typeof type === "object" && !type.preventDefault ) {
			for ( var key in type ) {
				this.unbind(key, type[key]);
			}

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				jQuery.event.remove( this[i], type, fn );
			}
		}

		return this;
	},
	
	delegate: function( selector, types, data, fn ) {
		return this.live( types, data, fn, selector );
	},
	
	undelegate: function( selector, types, fn ) {
		if ( arguments.length === 0 ) {
				return this.unbind( "live" );
		
		} else {
			return this.die( types, null, fn, selector );
		}
	},
	
	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},

	triggerHandler: function( type, data ) {
		if ( this[0] ) {
			var event = jQuery.Event( type );
			event.preventDefault();
			event.stopPropagation();
			jQuery.event.trigger( event, data, this[0] );
			return event.result;
		}
	},

	toggle: function( fn ) {
		// Save reference to arguments for access in closure
		var args = arguments, i = 1;

		// link all the functions, so any of them can unbind this click handler
		while ( i < args.length ) {
			jQuery.proxy( fn, args[ i++ ] );
		}

		return this.click( jQuery.proxy( fn, function( event ) {
			// Figure out which function to execute
			var lastToggle = ( jQuery.data( this, "lastToggle" + fn.guid ) || 0 ) % i;
			jQuery.data( this, "lastToggle" + fn.guid, lastToggle + 1 );

			// Make sure that clicks stop
			event.preventDefault();

			// and execute the function
			return args[ lastToggle ].apply( this, arguments ) || false;
		}));
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
});

var liveMap = {
	focus: "focusin",
	blur: "focusout",
	mouseenter: "mouseover",
	mouseleave: "mouseout"
};

jQuery.each(["live", "die"], function( i, name ) {
	jQuery.fn[ name ] = function( types, data, fn, origSelector /* Internal Use Only */ ) {
		var type, i = 0, match, namespaces, preType,
			selector = origSelector || this.selector,
			context = origSelector ? this : jQuery( this.context );

		if ( jQuery.isFunction( data ) ) {
			fn = data;
			data = undefined;
		}

		types = (types || "").split(" ");

		while ( (type = types[ i++ ]) != null ) {
			match = rnamespaces.exec( type );
			namespaces = "";

			if ( match )  {
				namespaces = match[0];
				type = type.replace( rnamespaces, "" );
			}

			if ( type === "hover" ) {
				types.push( "mouseenter" + namespaces, "mouseleave" + namespaces );
				continue;
			}

			preType = type;

			if ( type === "focus" || type === "blur" ) {
				types.push( liveMap[ type ] + namespaces );
				type = type + namespaces;

			} else {
				type = (liveMap[ type ] || type) + namespaces;
			}

			if ( name === "live" ) {
				// bind live handler
				context.each(function(){
					jQuery.event.add( this, liveConvert( type, selector ),
						{ data: data, selector: selector, handler: fn, origType: type, origHandler: fn, preType: preType } );
				});

			} else {
				// unbind live handler
				context.unbind( liveConvert( type, selector ), fn );
			}
		}
		
		return this;
	}
});

function liveHandler( event ) {
	var stop, elems = [], selectors = [], args = arguments,
		related, match, handleObj, elem, j, i, l, data,
		events = jQuery.data( this, "events" );

	// Make sure we avoid non-left-click bubbling in Firefox (#3861)
	if ( event.liveFired === this || !events || !events.live || event.button && event.type === "click" ) {
		return;
	}

	event.liveFired = this;

	var live = events.live.slice(0);

	for ( j = 0; j < live.length; j++ ) {
		handleObj = live[j];

		if ( handleObj.origType.replace( rnamespaces, "" ) === event.type ) {
			selectors.push( handleObj.selector );

		} else {
			live.splice( j--, 1 );
		}
	}

	match = jQuery( event.target ).closest( selectors, event.currentTarget );

	for ( i = 0, l = match.length; i < l; i++ ) {
		for ( j = 0; j < live.length; j++ ) {
			handleObj = live[j];

			if ( match[i].selector === handleObj.selector ) {
				elem = match[i].elem;
				related = null;

				// Those two events require additional checking
				if ( handleObj.preType === "mouseenter" || handleObj.preType === "mouseleave" ) {
					related = jQuery( event.relatedTarget ).closest( handleObj.selector )[0];
				}

				if ( !related || related !== elem ) {
					elems.push({ elem: elem, handleObj: handleObj });
				}
			}
		}
	}

	for ( i = 0, l = elems.length; i < l; i++ ) {
		match = elems[i];
		event.currentTarget = match.elem;
		event.data = match.handleObj.data;
		event.handleObj = match.handleObj;

		if ( match.handleObj.origHandler.apply( match.elem, args ) === false ) {
			stop = false;
			break;
		}
	}

	return stop;
}

function liveConvert( type, selector ) {
	return "live." + (type && type !== "*" ? type + "." : "") + selector.replace(/\./g, "`").replace(/ /g, "&");
}

jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( fn ) {
		return fn ? this.bind( name, fn ) : this.trigger( name );
	};

	if ( jQuery.attrFn ) {
		jQuery.attrFn[ name ] = true;
	}
});

// Prevent memory leaks in IE
// Window isn't included so as not to unbind existing unload events
// More info:
//  - http://isaacschlueter.com/2006/10/msie-memory-leaks/
if ( window.attachEvent && !window.addEventListener ) {
	window.attachEvent("onunload", function() {
		for ( var id in jQuery.cache ) {
			if ( jQuery.cache[ id ].handle ) {
				// Try/Catch is to handle iframes being unloaded, see #4280
				try {
					jQuery.event.remove( jQuery.cache[ id ].handle.elem );
				} catch(e) {}
			}
		}
	});
}
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, extra, prune = true, contextXML = isXML(context),
		soFar = selector;
	
	// Reset the position of the chunker regexp (start from head)
	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];
		
		parts.push( m[1] );
		
		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}
				
				set = posProcess( selector, set );
			}
		}
	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;
		
		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				var filter = Expr.filter[ type ], found, item, left = match[1];
				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw "Syntax error, unrecognized expression: " + msg;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = part.toLowerCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = part.toLowerCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = part.toLowerCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			return match[1].toLowerCase();
		},
		CHILD: function(match){
			if ( match[1] === "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 === i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			} else {
				Sizzle.error( "Syntax error, unrecognized expression: " + name );
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}
					if ( type === "first" ) { 
						return true; 
					}
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}
					
					var doneName = match[0],
						parent = elem.parentNode;
	
					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 
						parent.sizcache = doneName;
					}
					
					var diff = elem.nodeIndex - last;
					if ( first === 0 ) {
						return diff === 0;
					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, function(all, num){
		return "\\" + (num - 0 + 1);
	}));
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.compareDocumentPosition ? -1 : 1;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.sourceIndex ? -1 : 1;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.ownerDocument ? -1 : 1;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

// Utility function for retreiving the text value of an array of DOM nodes
function getText( elems ) {
	var ret = "", elem;

	for ( var i = 0; elems[i]; i++ ) {
		elem = elems[i];

		// Get the text from text nodes and CDATA nodes
		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
			ret += elem.nodeValue;

		// Traverse everything else, except comment nodes
		} else if ( elem.nodeType !== 8 ) {
			ret += getText( elem.childNodes );
		}
	}

	return ret;
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle, div = document.createElement("div");
		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}
	
		Sizzle = function(query, context, extra, seed){
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && context.nodeType === 9 && !isXML(context) ) {
				try {
					return makeArray( context.querySelectorAll(query), extra );
				} catch(e){}
			}
		
			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		div = null; // release memory in IE
	})();
}

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}
	
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ? function(a, b){
	return !!(a.compareDocumentPosition(b) & 16);
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833) 
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.filters;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = getText;
jQuery.isXMLDoc = isXML;
jQuery.contains = contains;

return;

window.Sizzle = Sizzle;

})();
var runtil = /Until$/,
	rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
	rmultiselector = /,/,
	slice = Array.prototype.slice;

// Implement the identical functionality for filter and not
var winnow = function( elements, qualifier, keep ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep(elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) === keep;
		});

	} else if ( qualifier.nodeType ) {
		return jQuery.grep(elements, function( elem, i ) {
			return (elem === qualifier) === keep;
		});

	} else if ( typeof qualifier === "string" ) {
		var filtered = jQuery.grep(elements, function( elem ) {
			return elem.nodeType === 1;
		});

		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter(qualifier, filtered, !keep);
		} else {
			qualifier = jQuery.filter( qualifier, filtered );
		}
	}

	return jQuery.grep(elements, function( elem, i ) {
		return (jQuery.inArray( elem, qualifier ) >= 0) === keep;
	});
};

jQuery.fn.extend({
	find: function( selector ) {
		var ret = this.pushStack( "", "find", selector ), length = 0;

		for ( var i = 0, l = this.length; i < l; i++ ) {
			length = ret.length;
			jQuery.find( selector, this[i], ret );

			if ( i > 0 ) {
				// Make sure that the results are unique
				for ( var n = length; n < ret.length; n++ ) {
					for ( var r = 0; r < length; r++ ) {
						if ( ret[r] === ret[n] ) {
							ret.splice(n--, 1);
							break;
						}
					}
				}
			}
		}

		return ret;
	},

	has: function( target ) {
		var targets = jQuery( target );
		return this.filter(function() {
			for ( var i = 0, l = targets.length; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector, false), "not", selector);
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector, true), "filter", selector );
	},
	
	is: function( selector ) {
		return !!selector && jQuery.filter( selector, this ).length > 0;
	},

	closest: function( selectors, context ) {
		if ( jQuery.isArray( selectors ) ) {
			var ret = [], cur = this[0], match, matches = {}, selector;

			if ( cur && selectors.length ) {
				for ( var i = 0, l = selectors.length; i < l; i++ ) {
					selector = selectors[i];

					if ( !matches[selector] ) {
						matches[selector] = jQuery.expr.match.POS.test( selector ) ? 
							jQuery( selector, context || this.context ) :
							selector;
					}
				}

				while ( cur && cur.ownerDocument && cur !== context ) {
					for ( selector in matches ) {
						match = matches[selector];

						if ( match.jquery ? match.index(cur) > -1 : jQuery(cur).is(match) ) {
							ret.push({ selector: selector, elem: cur });
							delete matches[selector];
						}
					}
					cur = cur.parentNode;
				}
			}

			return ret;
		}

		var pos = jQuery.expr.match.POS.test( selectors ) ? 
			jQuery( selectors, context || this.context ) : null;

		return this.map(function( i, cur ) {
			while ( cur && cur.ownerDocument && cur !== context ) {
				if ( pos ? pos.index(cur) > -1 : jQuery(cur).is(selectors) ) {
					return cur;
				}
				cur = cur.parentNode;
			}
			return null;
		});
	},
	
	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {
		if ( !elem || typeof elem === "string" ) {
			return jQuery.inArray( this[0],
				// If it receives a string, the selector is used
				// If it receives nothing, the siblings are used
				elem ? jQuery( elem ) : this.parent().children() );
		}
		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context || this.context ) :
				jQuery.makeArray( selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
			all :
			jQuery.unique( all ) );
	},

	andSelf: function() {
		return this.add( this.prevObject );
	}
});

// A painfully simple check to see if an element is disconnected
// from a document (should be improved, where feasible).
function isDisconnected( node ) {
	return !node || !node.parentNode || node.parentNode.nodeType === 11;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return jQuery.nth( elem, 2, "nextSibling" );
	},
	prev: function( elem ) {
		return jQuery.nth( elem, 2, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( elem.parentNode.firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.makeArray( elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );
		
		if ( !runtil.test( name ) ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		ret = this.length > 1 ? jQuery.unique( ret ) : ret;

		if ( (this.length > 1 || rmultiselector.test( selector )) && rparentsprev.test( name ) ) {
			ret = ret.reverse();
		}

		return this.pushStack( ret, name, slice.call(arguments).join(",") );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return jQuery.find.matches(expr, elems);
	},
	
	dir: function( elem, dir, until ) {
		var matched = [], cur = elem[dir];
		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	nth: function( cur, result, dir, elem ) {
		result = result || 1;
		var num = 0;

		for ( ; cur; cur = cur[dir] ) {
			if ( cur.nodeType === 1 && ++num === result ) {
				break;
			}
		}

		return cur;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});
var rinlinejQuery = / jQuery\d+="(?:\d+|null)"/g,
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /(<([\w:]+)[^>]*?)\/>/g,
	rselfClosing = /^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnocache = /<script|<object|<embed|<option|<style/i,
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,  // checked="checked" or checked (html5)
	fcloseTag = function( all, front, tag ) {
		return rselfClosing.test( tag ) ?
			all :
			front + "></" + tag + ">";
	},
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		area: [ 1, "<map>", "</map>" ],
		_default: [ 0, "", "" ]
	};

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// IE can't serialize <link> and <script> tags normally
if ( !jQuery.support.htmlSerialize ) {
	wrapMap._default = [ 1, "div<div>", "</div>" ];
}

jQuery.fn.extend({
	text: function( text ) {
		if ( jQuery.isFunction(text) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.text( text.call(this, i, self.text()) );
			});
		}

		if ( typeof text !== "object" && text !== undefined ) {
			return this.empty().append( (this[0] && this[0].ownerDocument || document).createTextNode( text ) );
		}

		return jQuery.text( this );
	},

	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append(this);
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ), contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		return this.each(function() {
			jQuery( this ).wrapAll( html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this );
			});
		} else if ( arguments.length ) {
			var set = jQuery(arguments[0]);
			set.push.apply( set, this.toArray() );
			return this.pushStack( set, "before", arguments );
		}
	},

	after: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			});
		} else if ( arguments.length ) {
			var set = this.pushStack( this, "after", arguments );
			set.push.apply( set, jQuery(arguments[0]).toArray() );
			return set;
		}
	},
	
	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
				if ( !keepData && elem.nodeType === 1 ) {
					jQuery.cleanData( elem.getElementsByTagName("*") );
					jQuery.cleanData( [ elem ] );
				}

				if ( elem.parentNode ) {
					 elem.parentNode.removeChild( elem );
				}
			}
		}
		
		return this;
	},

	empty: function() {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( elem.getElementsByTagName("*") );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}
		}
		
		return this;
	},

	clone: function( events ) {
		// Do the clone
		var ret = this.map(function() {
			if ( !jQuery.support.noCloneEvent && !jQuery.isXMLDoc(this) ) {
				// IE copies events bound via attachEvent when
				// using cloneNode. Calling detachEvent on the
				// clone will also remove the events from the orignal
				// In order to get around this, we use innerHTML.
				// Unfortunately, this means some modifications to
				// attributes in IE that are actually only stored
				// as properties will not be copied (such as the
				// the name attribute on an input).
				var html = this.outerHTML, ownerDocument = this.ownerDocument;
				if ( !html ) {
					var div = ownerDocument.createElement("div");
					div.appendChild( this.cloneNode(true) );
					html = div.innerHTML;
				}

				return jQuery.clean([html.replace(rinlinejQuery, "")
					// Handle the case in IE 8 where action=/test/> self-closes a tag
					.replace(/=([^="'>\s]+\/)>/g, '="$1">')
					.replace(rleadingWhitespace, "")], ownerDocument)[0];
			} else {
				return this.cloneNode(true);
			}
		});

		// Copy the events from the original to the clone
		if ( events === true ) {
			cloneCopyEvent( this, ret );
			cloneCopyEvent( this.find("*"), ret.find("*") );
		}

		// Return the cloned set
		return ret;
	},

	html: function( value ) {
		if ( value === undefined ) {
			return this[0] && this[0].nodeType === 1 ?
				this[0].innerHTML.replace(rinlinejQuery, "") :
				null;

		// See if we can take a shortcut and just use innerHTML
		} else if ( typeof value === "string" && !rnocache.test( value ) &&
			(jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value )) &&
			!wrapMap[ (rtagName.exec( value ) || ["", ""])[1].toLowerCase() ] ) {

			value = value.replace(rxhtmlTag, fcloseTag);

			try {
				for ( var i = 0, l = this.length; i < l; i++ ) {
					// Remove element nodes and prevent memory leaks
					if ( this[i].nodeType === 1 ) {
						jQuery.cleanData( this[i].getElementsByTagName("*") );
						this[i].innerHTML = value;
					}
				}

			// If using innerHTML throws an exception, use the fallback method
			} catch(e) {
				this.empty().append( value );
			}

		} else if ( jQuery.isFunction( value ) ) {
			this.each(function(i){
				var self = jQuery(this), old = self.html();
				self.empty().append(function(){
					return value.call( this, i, old );
				});
			});

		} else {
			this.empty().append( value );
		}

		return this;
	},

	replaceWith: function( value ) {
		if ( this[0] && this[0].parentNode ) {
			// Make sure that the elements are removed from the DOM before they are inserted
			// this can help fix replacing a parent with child elements
			if ( jQuery.isFunction( value ) ) {
				return this.each(function(i) {
					var self = jQuery(this), old = self.html();
					self.replaceWith( value.call( this, i, old ) );
				});
			}

			if ( typeof value !== "string" ) {
				value = jQuery(value).detach();
			}

			return this.each(function() {
				var next = this.nextSibling, parent = this.parentNode;

				jQuery(this).remove();

				if ( next ) {
					jQuery(next).before( value );
				} else {
					jQuery(parent).append( value );
				}
			});
		} else {
			return this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value );
		}
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, table, callback ) {
		var results, first, value = args[0], scripts = [], fragment, parent;

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( !jQuery.support.checkClone && arguments.length === 3 && typeof value === "string" && rchecked.test( value ) ) {
			return this.each(function() {
				jQuery(this).domManip( args, table, callback, true );
			});
		}

		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				args[0] = value.call(this, i, table ? self.html() : undefined);
				self.domManip( args, table, callback );
			});
		}

		if ( this[0] ) {
			parent = value && value.parentNode;

			// If we're in a fragment, just use that instead of building a new one
			if ( jQuery.support.parentNode && parent && parent.nodeType === 11 && parent.childNodes.length === this.length ) {
				results = { fragment: parent };

			} else {
				results = buildFragment( args, this, scripts );
			}
			
			fragment = results.fragment;
			
			if ( fragment.childNodes.length === 1 ) {
				first = fragment = fragment.firstChild;
			} else {
				first = fragment.firstChild;
			}

			if ( first ) {
				table = table && jQuery.nodeName( first, "tr" );

				for ( var i = 0, l = this.length; i < l; i++ ) {
					callback.call(
						table ?
							root(this[i], first) :
							this[i],
						i > 0 || results.cacheable || this.length > 1  ?
							fragment.cloneNode(true) :
							fragment
					);
				}
			}

			if ( scripts.length ) {
				jQuery.each( scripts, evalScript );
			}
		}

		return this;

		function root( elem, cur ) {
			return jQuery.nodeName(elem, "table") ?
				(elem.getElementsByTagName("tbody")[0] ||
				elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
				elem;
		}
	}
});

function cloneCopyEvent(orig, ret) {
	var i = 0;

	ret.each(function() {
		if ( this.nodeName !== (orig[i] && orig[i].nodeName) ) {
			return;
		}

		var oldData = jQuery.data( orig[i++] ), curData = jQuery.data( this, oldData ), events = oldData && oldData.events;

		if ( events ) {
			delete curData.handle;
			curData.events = {};

			for ( var type in events ) {
				for ( var handler in events[ type ] ) {
					jQuery.event.add( this, type, events[ type ][ handler ], events[ type ][ handler ].data );
				}
			}
		}
	});
}

function buildFragment( args, nodes, scripts ) {
	var fragment, cacheable, cacheresults,
		doc = (nodes && nodes[0] ? nodes[0].ownerDocument || nodes[0] : document);

	// Only cache "small" (1/2 KB) strings that are associated with the main document
	// Cloning options loses the selected state, so don't cache them
	// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
	// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
	if ( args.length === 1 && typeof args[0] === "string" && args[0].length < 512 && doc === document &&
		!rnocache.test( args[0] ) && (jQuery.support.checkClone || !rchecked.test( args[0] )) ) {

		cacheable = true;
		cacheresults = jQuery.fragments[ args[0] ];
		if ( cacheresults ) {
			if ( cacheresults !== 1 ) {
				fragment = cacheresults;
			}
		}
	}

	if ( !fragment ) {
		fragment = doc.createDocumentFragment();
		jQuery.clean( args, doc, fragment, scripts );
	}

	if ( cacheable ) {
		jQuery.fragments[ args[0] ] = cacheresults ? fragment : 1;
	}

	return { fragment: fragment, cacheable: cacheable };
}

jQuery.fragments = {};

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var ret = [], insert = jQuery( selector ),
			parent = this.length === 1 && this[0].parentNode;
		
		if ( parent && parent.nodeType === 11 && parent.childNodes.length === 1 && insert.length === 1 ) {
			insert[ original ]( this[0] );
			return this;
			
		} else {
			for ( var i = 0, l = insert.length; i < l; i++ ) {
				var elems = (i > 0 ? this.clone(true) : this).get();
				jQuery.fn[ original ].apply( jQuery(insert[i]), elems );
				ret = ret.concat( elems );
			}
		
			return this.pushStack( ret, name, insert.selector );
		}
	};
});

jQuery.extend({
	clean: function( elems, context, fragment, scripts ) {
		context = context || document;

		// !context.createElement fails in IE with an error but returns typeof 'object'
		if ( typeof context.createElement === "undefined" ) {
			context = context.ownerDocument || context[0] && context[0].ownerDocument || document;
		}

		var ret = [];

		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( typeof elem === "number" ) {
				elem += "";
			}

			if ( !elem ) {
				continue;
			}

			// Convert html string into DOM nodes
			if ( typeof elem === "string" && !rhtml.test( elem ) ) {
				elem = context.createTextNode( elem );

			} else if ( typeof elem === "string" ) {
				// Fix "XHTML"-style tags in all browsers
				elem = elem.replace(rxhtmlTag, fcloseTag);

				// Trim whitespace, otherwise indexOf won't work as expected
				var tag = (rtagName.exec( elem ) || ["", ""])[1].toLowerCase(),
					wrap = wrapMap[ tag ] || wrapMap._default,
					depth = wrap[0],
					div = context.createElement("div");

				// Go to html and back, then peel off extra wrappers
				div.innerHTML = wrap[1] + elem + wrap[2];

				// Move to the right depth
				while ( depth-- ) {
					div = div.lastChild;
				}

				// Remove IE's autoinserted <tbody> from table fragments
				if ( !jQuery.support.tbody ) {

					// String was a <table>, *may* have spurious <tbody>
					var hasBody = rtbody.test(elem),
						tbody = tag === "table" && !hasBody ?
							div.firstChild && div.firstChild.childNodes :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !hasBody ?
								div.childNodes :
								[];

					for ( var j = tbody.length - 1; j >= 0 ; --j ) {
						if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
							tbody[ j ].parentNode.removeChild( tbody[ j ] );
						}
					}

				}

				// IE completely kills leading whitespace when innerHTML is used
				if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
					div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
				}

				elem = div.childNodes;
			}

			if ( elem.nodeType ) {
				ret.push( elem );
			} else {
				ret = jQuery.merge( ret, elem );
			}
		}

		if ( fragment ) {
			for ( var i = 0; ret[i]; i++ ) {
				if ( scripts && jQuery.nodeName( ret[i], "script" ) && (!ret[i].type || ret[i].type.toLowerCase() === "text/javascript") ) {
					scripts.push( ret[i].parentNode ? ret[i].parentNode.removeChild( ret[i] ) : ret[i] );
				
				} else {
					if ( ret[i].nodeType === 1 ) {
						ret.splice.apply( ret, [i + 1, 0].concat(jQuery.makeArray(ret[i].getElementsByTagName("script"))) );
					}
					fragment.appendChild( ret[i] );
				}
			}
		}

		return ret;
	},
	
	cleanData: function( elems ) {
		var data, id, cache = jQuery.cache,
			special = jQuery.event.special,
			deleteExpando = jQuery.support.deleteExpando;
		
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			id = elem[ jQuery.expando ];
			
			if ( id ) {
				data = cache[ id ];
				
				if ( data.events ) {
					for ( var type in data.events ) {
						if ( special[ type ] ) {
							jQuery.event.remove( elem, type );

						} else {
							removeEvent( elem, type, data.handle );
						}
					}
				}
				
				if ( deleteExpando ) {
					delete elem[ jQuery.expando ];

				} else if ( elem.removeAttribute ) {
					elem.removeAttribute( jQuery.expando );
				}
				
				delete cache[ id ];
			}
		}
	}
});
// exclude the following css properties to add px
var rexclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
	ralpha = /alpha\([^)]*\)/,
	ropacity = /opacity=([^)]*)/,
	rfloat = /float/i,
	rdashAlpha = /-([a-z])/ig,
	rupper = /([A-Z])/g,
	rnumpx = /^-?\d+(?:px)?$/i,
	rnum = /^-?\d/,

	cssShow = { position: "absolute", visibility: "hidden", display:"block" },
	cssWidth = [ "Left", "Right" ],
	cssHeight = [ "Top", "Bottom" ],

	// cache check for defaultView.getComputedStyle
	getComputedStyle = document.defaultView && document.defaultView.getComputedStyle,
	// normalize float css property
	styleFloat = jQuery.support.cssFloat ? "cssFloat" : "styleFloat",
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn.css = function( name, value ) {
	return access( this, name, value, true, function( elem, name, value ) {
		if ( value === undefined ) {
			return jQuery.curCSS( elem, name );
		}
		
		if ( typeof value === "number" && !rexclude.test(name) ) {
			value += "px";
		}

		jQuery.style( elem, name, value );
	});
};

jQuery.extend({
	style: function( elem, name, value ) {
		// don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
			return undefined;
		}

		// ignore negative width and height values #1599
		if ( (name === "width" || name === "height") && parseFloat(value) < 0 ) {
			value = undefined;
		}

		var style = elem.style || elem, set = value !== undefined;

		// IE uses filters for opacity
		if ( !jQuery.support.opacity && name === "opacity" ) {
			if ( set ) {
				// IE has trouble with opacity if it does not have layout
				// Force it by setting the zoom level
				style.zoom = 1;

				// Set the alpha filter to set the opacity
				var opacity = parseInt( value, 10 ) + "" === "NaN" ? "" : "alpha(opacity=" + value * 100 + ")";
				var filter = style.filter || jQuery.curCSS( elem, "filter" ) || "";
				style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : opacity;
			}

			return style.filter && style.filter.indexOf("opacity=") >= 0 ?
				(parseFloat( ropacity.exec(style.filter)[1] ) / 100) + "":
				"";
		}

		// Make sure we're using the right name for getting the float value
		if ( rfloat.test( name ) ) {
			name = styleFloat;
		}

		name = name.replace(rdashAlpha, fcamelCase);

		if ( set ) {
			style[ name ] = value;
		}

		return style[ name ];
	},

	css: function( elem, name, force, extra ) {
		if ( name === "width" || name === "height" ) {
			var val, props = cssShow, which = name === "width" ? cssWidth : cssHeight;

			function getWH() {
				val = name === "width" ? elem.offsetWidth : elem.offsetHeight;

				if ( extra === "border" ) {
					return;
				}

				jQuery.each( which, function() {
					if ( !extra ) {
						val -= parseFloat(jQuery.curCSS( elem, "padding" + this, true)) || 0;
					}

					if ( extra === "margin" ) {
						val += parseFloat(jQuery.curCSS( elem, "margin" + this, true)) || 0;
					} else {
						val -= parseFloat(jQuery.curCSS( elem, "border" + this + "Width", true)) || 0;
					}
				});
			}

			if ( elem.offsetWidth !== 0 ) {
				getWH();
			} else {
				jQuery.swap( elem, props, getWH );
			}

			return Math.max(0, Math.round(val));
		}

		return jQuery.curCSS( elem, name, force );
	},

	curCSS: function( elem, name, force ) {
		var ret, style = elem.style, filter;

		// IE uses filters for opacity
		if ( !jQuery.support.opacity && name === "opacity" && elem.currentStyle ) {
			ret = ropacity.test(elem.currentStyle.filter || "") ?
				(parseFloat(RegExp.$1) / 100) + "" :
				"";

			return ret === "" ?
				"1" :
				ret;
		}

		// Make sure we're using the right name for getting the float value
		if ( rfloat.test( name ) ) {
			name = styleFloat;
		}

		if ( !force && style && style[ name ] ) {
			ret = style[ name ];

		} else if ( getComputedStyle ) {

			// Only "float" is needed here
			if ( rfloat.test( name ) ) {
				name = "float";
			}

			name = name.replace( rupper, "-$1" ).toLowerCase();

			var defaultView = elem.ownerDocument.defaultView;

			if ( !defaultView ) {
				return null;
			}

			var computedStyle = defaultView.getComputedStyle( elem, null );

			if ( computedStyle ) {
				ret = computedStyle.getPropertyValue( name );
			}

			// We should always get a number back from opacity
			if ( name === "opacity" && ret === "" ) {
				ret = "1";
			}

		} else if ( elem.currentStyle ) {
			var camelCase = name.replace(rdashAlpha, fcamelCase);

			ret = elem.currentStyle[ name ] || elem.currentStyle[ camelCase ];

			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
			if ( !rnumpx.test( ret ) && rnum.test( ret ) ) {
				// Remember the original values
				var left = style.left, rsLeft = elem.runtimeStyle.left;

				// Put in the new values to get a computed value out
				elem.runtimeStyle.left = elem.currentStyle.left;
				style.left = camelCase === "fontSize" ? "1em" : (ret || 0);
				ret = style.pixelLeft + "px";

				// Revert the changed values
				style.left = left;
				elem.runtimeStyle.left = rsLeft;
			}
		}

		return ret;
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback ) {
		var old = {};

		// Remember the old values, and insert the new ones
		for ( var name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		callback.call( elem );

		// Revert the old values
		for ( var name in options ) {
			elem.style[ name ] = old[ name ];
		}
	}
});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		var width = elem.offsetWidth, height = elem.offsetHeight,
			skip = elem.nodeName.toLowerCase() === "tr";

		return width === 0 && height === 0 && !skip ?
			true :
			width > 0 && height > 0 && !skip ?
				false :
				jQuery.curCSS(elem, "display") === "none";
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}
var jsc = now(),
	rscript = /<script(.|\s)*?\/script>/gi,
	rselectTextarea = /select|textarea/i,
	rinput = /color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week/i,
	jsre = /=\?(&|$)/,
	rquery = /\?/,
	rts = /(\?|&)_=.*?(&|$)/,
	rurl = /^(\w+:)?\/\/([^\/?#]+)/,
	r20 = /%20/g,

	// Keep a copy of the old load method
	_load = jQuery.fn.load;

jQuery.fn.extend({
	load: function( url, params, callback ) {
		if ( typeof url !== "string" ) {
			return _load.call( this, url );

		// Don't do a request if no elements are being requested
		} else if ( !this.length ) {
			return this;
		}

		var off = url.indexOf(" ");
		if ( off >= 0 ) {
			var selector = url.slice(off, url.length);
			url = url.slice(0, off);
		}

		// Default to a GET request
		var type = "GET";

		// If the second parameter was provided
		if ( params ) {
			// If it's a function
			if ( jQuery.isFunction( params ) ) {
				// We assume that it's the callback
				callback = params;
				params = null;

			// Otherwise, build a param string
			} else if ( typeof params === "object" ) {
				params = jQuery.param( params, jQuery.ajaxSettings.traditional );
				type = "POST";
			}
		}

		var self = this;

		// Request the remote document
		jQuery.ajax({
			url: url,
			type: type,
			dataType: "html",
			data: params,
			complete: function( res, status ) {
				// If successful, inject the HTML into all the matched elements
				if ( status === "success" || status === "notmodified" ) {
					// See if a selector was specified
					self.html( selector ?
						// Create a dummy div to hold the results
						jQuery("<div />")
							// inject the contents of the document in, removing the scripts
							// to avoid any 'Permission Denied' errors in IE
							.append(res.responseText.replace(rscript, ""))

							// Locate the specified elements
							.find(selector) :

						// If not, just inject the full result
						res.responseText );
				}

				if ( callback ) {
					self.each( callback, [res.responseText, status, res] );
				}
			}
		});

		return this;
	},

	serialize: function() {
		return jQuery.param(this.serializeArray());
	},
	serializeArray: function() {
		return this.map(function() {
			return this.elements ? jQuery.makeArray(this.elements) : this;
		})
		.filter(function() {
			return this.name && !this.disabled &&
				(this.checked || rselectTextarea.test(this.nodeName) ||
					rinput.test(this.type));
		})
		.map(function( i, elem ) {
			var val = jQuery(this).val();

			return val == null ?
				null :
				jQuery.isArray(val) ?
					jQuery.map( val, function( val, i ) {
						return { name: elem.name, value: val };
					}) :
					{ name: elem.name, value: val };
		}).get();
	}
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function( i, o ) {
	jQuery.fn[o] = function( f ) {
		return this.bind(o, f);
	};
});

jQuery.extend({

	get: function( url, data, callback, type ) {
		// shift arguments if data argument was omited
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = null;
		}

		return jQuery.ajax({
			type: "GET",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},

	getScript: function( url, callback ) {
		return jQuery.get(url, null, callback, "script");
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get(url, data, callback, "json");
	},

	post: function( url, data, callback, type ) {
		// shift arguments if data argument was omited
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = {};
		}

		return jQuery.ajax({
			type: "POST",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},

	ajaxSetup: function( settings ) {
		jQuery.extend( jQuery.ajaxSettings, settings );
	},

	ajaxSettings: {
		url: location.href,
		global: true,
		type: "GET",
		contentType: "application/x-www-form-urlencoded",
		processData: true,
		async: true,
		/*
		timeout: 0,
		data: null,
		username: null,
		password: null,
		traditional: false,
		*/
		// Create the request object; Microsoft failed to properly
		// implement the XMLHttpRequest in IE7 (can't request local files),
		// so we use the ActiveXObject when it is available
		// This function can be overriden by calling jQuery.ajaxSetup
		xhr: window.XMLHttpRequest && (window.location.protocol !== "file:" || !window.ActiveXObject) ?
			function() {
				return new window.XMLHttpRequest();
			} :
			function() {
				try {
					return new window.ActiveXObject("Microsoft.XMLHTTP");
				} catch(e) {}
			},
		accepts: {
			xml: "application/xml, text/xml",
			html: "text/html",
			script: "text/javascript, application/javascript",
			json: "application/json, text/javascript",
			text: "text/plain",
			_default: "*/*"
		}
	},

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajax: function( origSettings ) {
		var s = jQuery.extend(true, {}, jQuery.ajaxSettings, origSettings);
		
		var jsonp, status, data,
			callbackContext = origSettings && origSettings.context || s,
			type = s.type.toUpperCase();

		// convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Handle JSONP Parameter Callbacks
		if ( s.dataType === "jsonp" ) {
			if ( type === "GET" ) {
				if ( !jsre.test( s.url ) ) {
					s.url += (rquery.test( s.url ) ? "&" : "?") + (s.jsonp || "callback") + "=?";
				}
			} else if ( !s.data || !jsre.test(s.data) ) {
				s.data = (s.data ? s.data + "&" : "") + (s.jsonp || "callback") + "=?";
			}
			s.dataType = "json";
		}

		// Build temporary JSONP function
		if ( s.dataType === "json" && (s.data && jsre.test(s.data) || jsre.test(s.url)) ) {
			jsonp = s.jsonpCallback || ("jsonp" + jsc++);

			// Replace the =? sequence both in the query string and the data
			if ( s.data ) {
				s.data = (s.data + "").replace(jsre, "=" + jsonp + "$1");
			}

			s.url = s.url.replace(jsre, "=" + jsonp + "$1");

			// We need to make sure
			// that a JSONP style response is executed properly
			s.dataType = "script";

			// Handle JSONP-style loading
			window[ jsonp ] = window[ jsonp ] || function( tmp ) {
				data = tmp;
				success();
				complete();
				// Garbage collect
				window[ jsonp ] = undefined;

				try {
					delete window[ jsonp ];
				} catch(e) {}

				if ( head ) {
					head.removeChild( script );
				}
			};
		}

		if ( s.dataType === "script" && s.cache === null ) {
			s.cache = false;
		}

		if ( s.cache === false && type === "GET" ) {
			var ts = now();

			// try replacing _= if it is there
			var ret = s.url.replace(rts, "$1_=" + ts + "$2");

			// if nothing was replaced, add timestamp to the end
			s.url = ret + ((ret === s.url) ? (rquery.test(s.url) ? "&" : "?") + "_=" + ts : "");
		}

		// If data is available, append data to url for get requests
		if ( s.data && type === "GET" ) {
			s.url += (rquery.test(s.url) ? "&" : "?") + s.data;
		}

		// Watch for a new set of requests
		if ( s.global && ! jQuery.active++ ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Matches an absolute URL, and saves the domain
		var parts = rurl.exec( s.url ),
			remote = parts && (parts[1] && parts[1] !== location.protocol || parts[2] !== location.host);

		// If we're requesting a remote document
		// and trying to load JSON or Script with a GET
		if ( s.dataType === "script" && type === "GET" && remote ) {
			var head = document.getElementsByTagName("head")[0] || document.documentElement;
			var script = document.createElement("script");
			script.src = s.url;
			if ( s.scriptCharset ) {
				script.charset = s.scriptCharset;
			}

			// Handle Script loading
			if ( !jsonp ) {
				var done = false;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function() {
					if ( !done && (!this.readyState ||
							this.readyState === "loaded" || this.readyState === "complete") ) {
						done = true;
						success();
						complete();

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;
						if ( head && script.parentNode ) {
							head.removeChild( script );
						}
					}
				};
			}

			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used (#2709 and #4378).
			head.insertBefore( script, head.firstChild );

			// We handle everything using the script element injection
			return undefined;
		}

		var requestDone = false;

		// Create the request object
		var xhr = s.xhr();

		if ( !xhr ) {
			return;
		}

		// Open the socket
		// Passing null username, generates a login popup on Opera (#2865)
		if ( s.username ) {
			xhr.open(type, s.url, s.async, s.username, s.password);
		} else {
			xhr.open(type, s.url, s.async);
		}

		// Need an extra try/catch for cross domain requests in Firefox 3
		try {
			// Set the correct header, if data is being sent
			if ( s.data || origSettings && origSettings.contentType ) {
				xhr.setRequestHeader("Content-Type", s.contentType);
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[s.url] ) {
					xhr.setRequestHeader("If-Modified-Since", jQuery.lastModified[s.url]);
				}

				if ( jQuery.etag[s.url] ) {
					xhr.setRequestHeader("If-None-Match", jQuery.etag[s.url]);
				}
			}

			// Set header so the called script knows that it's an XMLHttpRequest
			// Only send the header if it's not a remote XHR
			if ( !remote ) {
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			}

			// Set the Accepts header for the server, depending on the dataType
			xhr.setRequestHeader("Accept", s.dataType && s.accepts[ s.dataType ] ?
				s.accepts[ s.dataType ] + ", */*" :
				s.accepts._default );
		} catch(e) {}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && s.beforeSend.call(callbackContext, xhr, s) === false ) {
			// Handle the global AJAX counter
			if ( s.global && ! --jQuery.active ) {
				jQuery.event.trigger( "ajaxStop" );
			}

			// close opended socket
			xhr.abort();
			return false;
		}

		if ( s.global ) {
			trigger("ajaxSend", [xhr, s]);
		}

		// Wait for a response to come back
		var onreadystatechange = xhr.onreadystatechange = function( isTimeout ) {
			// The request was aborted
			if ( !xhr || xhr.readyState === 0 || isTimeout === "abort" ) {
				// Opera doesn't call onreadystatechange before this point
				// so we simulate the call
				if ( !requestDone ) {
					complete();
				}

				requestDone = true;
				if ( xhr ) {
					xhr.onreadystatechange = jQuery.noop;
				}

			// The transfer is complete and the data is available, or the request timed out
			} else if ( !requestDone && xhr && (xhr.readyState === 4 || isTimeout === "timeout") ) {
				requestDone = true;
				xhr.onreadystatechange = jQuery.noop;

				status = isTimeout === "timeout" ?
					"timeout" :
					!jQuery.httpSuccess( xhr ) ?
						"error" :
						s.ifModified && jQuery.httpNotModified( xhr, s.url ) ?
							"notmodified" :
							"success";

				var errMsg;

				if ( status === "success" ) {
					// Watch for, and catch, XML document parse errors
					try {
						// process the data (runs the xml through httpData regardless of callback)
						data = jQuery.httpData( xhr, s.dataType, s );
					} catch(err) {
						status = "parsererror";
						errMsg = err;
					}
				}

				// Make sure that the request was successful or notmodified
				if ( status === "success" || status === "notmodified" ) {
					// JSONP handles its own success callback
					if ( !jsonp ) {
						success();
					}
				} else {
					jQuery.handleError(s, xhr, status, errMsg);
				}

				// Fire the complete handlers
				complete();

				if ( isTimeout === "timeout" ) {
					xhr.abort();
				}

				// Stop memory leaks
				if ( s.async ) {
					xhr = null;
				}
			}
		};

		// Override the abort handler, if we can (IE doesn't allow it, but that's OK)
		// Opera doesn't fire onreadystatechange at all on abort
		try {
			var oldAbort = xhr.abort;
			xhr.abort = function() {
				if ( xhr ) {
					oldAbort.call( xhr );
				}

				onreadystatechange( "abort" );
			};
		} catch(e) { }

		// Timeout checker
		if ( s.async && s.timeout > 0 ) {
			setTimeout(function() {
				// Check to see if the request is still happening
				if ( xhr && !requestDone ) {
					onreadystatechange( "timeout" );
				}
			}, s.timeout);
		}

		// Send the data
		try {
			xhr.send( type === "POST" || type === "PUT" || type === "DELETE" ? s.data : null );
		} catch(e) {
			jQuery.handleError(s, xhr, null, e);
			// Fire the complete handlers
			complete();
		}

		// firefox 1.5 doesn't fire statechange for sync requests
		if ( !s.async ) {
			onreadystatechange();
		}

		function success() {
			// If a local callback was specified, fire it and pass it the data
			if ( s.success ) {
				s.success.call( callbackContext, data, status, xhr );
			}

			// Fire the global callback
			if ( s.global ) {
				trigger( "ajaxSuccess", [xhr, s] );
			}
		}

		function complete() {
			// Process result
			if ( s.complete ) {
				s.complete.call( callbackContext, xhr, status);
			}

			// The request was completed
			if ( s.global ) {
				trigger( "ajaxComplete", [xhr, s] );
			}

			// Handle the global AJAX counter
			if ( s.global && ! --jQuery.active ) {
				jQuery.event.trigger( "ajaxStop" );
			}
		}
		
		function trigger(type, args) {
			(s.context ? jQuery(s.context) : jQuery.event).trigger(type, args);
		}

		// return XMLHttpRequest to allow aborting the request etc.
		return xhr;
	},

	handleError: function( s, xhr, status, e ) {
		// If a local callback was specified, fire it
		if ( s.error ) {
			s.error.call( s.context || s, xhr, status, e );
		}

		// Fire the global callback
		if ( s.global ) {
			(s.context ? jQuery(s.context) : jQuery.event).trigger( "ajaxError", [xhr, s, e] );
		}
	},

	// Counter for holding the number of active queries
	active: 0,

	// Determines if an XMLHttpRequest was successful or not
	httpSuccess: function( xhr ) {
		try {
			// IE error sometimes returns 1223 when it should be 204 so treat it as success, see #1450
			return !xhr.status && location.protocol === "file:" ||
				// Opera returns 0 when status is 304
				( xhr.status >= 200 && xhr.status < 300 ) ||
				xhr.status === 304 || xhr.status === 1223 || xhr.status === 0;
		} catch(e) {}

		return false;
	},

	// Determines if an XMLHttpRequest returns NotModified
	httpNotModified: function( xhr, url ) {
		var lastModified = xhr.getResponseHeader("Last-Modified"),
			etag = xhr.getResponseHeader("Etag");

		if ( lastModified ) {
			jQuery.lastModified[url] = lastModified;
		}

		if ( etag ) {
			jQuery.etag[url] = etag;
		}

		// Opera returns 0 when status is 304
		return xhr.status === 304 || xhr.status === 0;
	},

	httpData: function( xhr, type, s ) {
		var ct = xhr.getResponseHeader("content-type") || "",
			xml = type === "xml" || !type && ct.indexOf("xml") >= 0,
			data = xml ? xhr.responseXML : xhr.responseText;

		if ( xml && data.documentElement.nodeName === "parsererror" ) {
			jQuery.error( "parsererror" );
		}

		// Allow a pre-filtering function to sanitize the response
		// s is checked to keep backwards compatibility
		if ( s && s.dataFilter ) {
			data = s.dataFilter( data, type );
		}

		// The filter can actually parse the response
		if ( typeof data === "string" ) {
			// Get the JavaScript object, if JSON is used.
			if ( type === "json" || !type && ct.indexOf("json") >= 0 ) {
				data = jQuery.parseJSON( data );

			// If the type is "script", eval it in global context
			} else if ( type === "script" || !type && ct.indexOf("javascript") >= 0 ) {
				jQuery.globalEval( data );
			}
		}

		return data;
	},

	// Serialize an array of form elements or a set of
	// key/values into a query string
	param: function( a, traditional ) {
		var s = [];
		
		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = jQuery.ajaxSettings.traditional;
		}
		
		// If an array was passed in, assume that it is an array of form elements.
		if ( jQuery.isArray(a) || a.jquery ) {
			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			});
			
		} else {
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( var prefix in a ) {
				buildParams( prefix, a[prefix] );
			}
		}

		// Return the resulting serialization
		return s.join("&").replace(r20, "+");

		function buildParams( prefix, obj ) {
			if ( jQuery.isArray(obj) ) {
				// Serialize array item.
				jQuery.each( obj, function( i, v ) {
					if ( traditional || /\[\]$/.test( prefix ) ) {
						// Treat each array item as a scalar.
						add( prefix, v );
					} else {
						// If array item is non-scalar (array or object), encode its
						// numeric index to resolve deserialization ambiguity issues.
						// Note that rack (as of 1.0.0) can't currently deserialize
						// nested arrays properly, and attempting to do so may cause
						// a server error. Possible fixes are to modify rack's
						// deserialization algorithm or to provide an option or flag
						// to force array serialization to be shallow.
						buildParams( prefix + "[" + ( typeof v === "object" || jQuery.isArray(v) ? i : "" ) + "]", v );
					}
				});
					
			} else if ( !traditional && obj != null && typeof obj === "object" ) {
				// Serialize object item.
				jQuery.each( obj, function( k, v ) {
					buildParams( prefix + "[" + k + "]", v );
				});
					
			} else {
				// Serialize scalar item.
				add( prefix, obj );
			}
		}

		function add( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction(value) ? value() : value;
			s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
		}
	}
});
var elemdisplay = {},
	rfxtypes = /toggle|show|hide/,
	rfxnum = /^([+-]=)?([\d+-.]+)(.*)$/,
	timerId,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	];

jQuery.fn.extend({
	show: function( speed, callback ) {
		if ( speed || speed === 0) {
			return this.animate( genFx("show", 3), speed, callback);

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				var old = jQuery.data(this[i], "olddisplay");

				this[i].style.display = old || "";

				if ( jQuery.css(this[i], "display") === "none" ) {
					var nodeName = this[i].nodeName, display;

					if ( elemdisplay[ nodeName ] ) {
						display = elemdisplay[ nodeName ];

					} else {
						var elem = jQuery("<" + nodeName + " />").appendTo("body");

						display = elem.css("display");

						if ( display === "none" ) {
							display = "block";
						}

						elem.remove();

						elemdisplay[ nodeName ] = display;
					}

					jQuery.data(this[i], "olddisplay", display);
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( var j = 0, k = this.length; j < k; j++ ) {
				this[j].style.display = jQuery.data(this[j], "olddisplay") || "";
			}

			return this;
		}
	},

	hide: function( speed, callback ) {
		if ( speed || speed === 0 ) {
			return this.animate( genFx("hide", 3), speed, callback);

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				var old = jQuery.data(this[i], "olddisplay");
				if ( !old && old !== "none" ) {
					jQuery.data(this[i], "olddisplay", jQuery.css(this[i], "display"));
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( var j = 0, k = this.length; j < k; j++ ) {
				this[j].style.display = "none";
			}

			return this;
		}
	},

	// Save the old toggle function
	_toggle: jQuery.fn.toggle,

	toggle: function( fn, fn2 ) {
		var bool = typeof fn === "boolean";

		if ( jQuery.isFunction(fn) && jQuery.isFunction(fn2) ) {
			this._toggle.apply( this, arguments );

		} else if ( fn == null || bool ) {
			this.each(function() {
				var state = bool ? fn : jQuery(this).is(":hidden");
				jQuery(this)[ state ? "show" : "hide" ]();
			});

		} else {
			this.animate(genFx("toggle", 3), fn, fn2);
		}

		return this;
	},

	fadeTo: function( speed, to, callback ) {
		return this.filter(":hidden").css("opacity", 0).show().end()
					.animate({opacity: to}, speed, callback);
	},

	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed(speed, easing, callback);

		if ( jQuery.isEmptyObject( prop ) ) {
			return this.each( optall.complete );
		}

		return this[ optall.queue === false ? "each" : "queue" ](function() {
			var opt = jQuery.extend({}, optall), p,
				hidden = this.nodeType === 1 && jQuery(this).is(":hidden"),
				self = this;

			for ( p in prop ) {
				var name = p.replace(rdashAlpha, fcamelCase);

				if ( p !== name ) {
					prop[ name ] = prop[ p ];
					delete prop[ p ];
					p = name;
				}

				if ( prop[p] === "hide" && hidden || prop[p] === "show" && !hidden ) {
					return opt.complete.call(this);
				}

				if ( ( p === "height" || p === "width" ) && this.style ) {
					// Store display property
					opt.display = jQuery.css(this, "display");

					// Make sure that nothing sneaks out
					opt.overflow = this.style.overflow;
				}

				if ( jQuery.isArray( prop[p] ) ) {
					// Create (if needed) and add to specialEasing
					(opt.specialEasing = opt.specialEasing || {})[p] = prop[p][1];
					prop[p] = prop[p][0];
				}
			}

			if ( opt.overflow != null ) {
				this.style.overflow = "hidden";
			}

			opt.curAnim = jQuery.extend({}, prop);

			jQuery.each( prop, function( name, val ) {
				var e = new jQuery.fx( self, opt, name );

				if ( rfxtypes.test(val) ) {
					e[ val === "toggle" ? hidden ? "show" : "hide" : val ]( prop );

				} else {
					var parts = rfxnum.exec(val),
						start = e.cur(true) || 0;

					if ( parts ) {
						var end = parseFloat( parts[2] ),
							unit = parts[3] || "px";

						// We need to compute starting value
						if ( unit !== "px" ) {
							self.style[ name ] = (end || 1) + unit;
							start = ((end || 1) / e.cur(true)) * start;
							self.style[ name ] = start + unit;
						}

						// If a +=/-= token was provided, we're doing a relative animation
						if ( parts[1] ) {
							end = ((parts[1] === "-=" ? -1 : 1) * end) + start;
						}

						e.custom( start, end, unit );

					} else {
						e.custom( start, val, "" );
					}
				}
			});

			// For JS strict compliance
			return true;
		});
	},

	stop: function( clearQueue, gotoEnd ) {
		var timers = jQuery.timers;

		if ( clearQueue ) {
			this.queue([]);
		}

		this.each(function() {
			// go in reverse order so anything added to the queue during the loop is ignored
			for ( var i = timers.length - 1; i >= 0; i-- ) {
				if ( timers[i].elem === this ) {
					if (gotoEnd) {
						// force the next step to be the last
						timers[i](true);
					}

					timers.splice(i, 1);
				}
			}
		});

		// start the next in the queue if the last step wasn't forced
		if ( !gotoEnd ) {
			this.dequeue();
		}

		return this;
	}

});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show", 1),
	slideUp: genFx("hide", 1),
	slideToggle: genFx("toggle", 1),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, callback ) {
		return this.animate( props, speed, callback );
	};
});

jQuery.extend({
	speed: function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? speed : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
		};

		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
			jQuery.fx.speeds[opt.duration] || jQuery.fx.speeds._default;

		// Queueing
		opt.old = opt.complete;
		opt.complete = function() {
			if ( opt.queue !== false ) {
				jQuery(this).dequeue();
			}
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}
		};

		return opt;
	},

	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
		}
	},

	timers: [],

	fx: function( elem, options, prop ) {
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		if ( !options.orig ) {
			options.orig = {};
		}
	}

});

jQuery.fx.prototype = {
	// Simple function for setting a style value
	update: function() {
		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		(jQuery.fx.step[this.prop] || jQuery.fx.step._default)( this );

		// Set display property to block for height/width animations
		if ( ( this.prop === "height" || this.prop === "width" ) && this.elem.style ) {
			this.elem.style.display = "block";
		}
	},

	// Get the current size
	cur: function( force ) {
		if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) ) {
			return this.elem[ this.prop ];
		}

		var r = parseFloat(jQuery.css(this.elem, this.prop, force));
		return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
	},

	// Start an animation from one number to another
	custom: function( from, to, unit ) {
		this.startTime = now();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;

		var self = this;
		function t( gotoEnd ) {
			return self.step(gotoEnd);
		}

		t.elem = this.elem;

		if ( t() && jQuery.timers.push(t) && !timerId ) {
			timerId = setInterval(jQuery.fx.tick, 13);
		}
	},

	// Simple 'show' function
	show: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.style( this.elem, this.prop );
		this.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any
		// flash of content
		this.custom(this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur());

		// Start by showing the element
		jQuery( this.elem ).show();
	},

	// Simple 'hide' function
	hide: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.style( this.elem, this.prop );
		this.options.hide = true;

		// Begin the animation
		this.custom(this.cur(), 0);
	},

	// Each step of an animation
	step: function( gotoEnd ) {
		var t = now(), done = true;

		if ( gotoEnd || t >= this.options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[ this.prop ] = true;

			for ( var i in this.options.curAnim ) {
				if ( this.options.curAnim[i] !== true ) {
					done = false;
				}
			}

			if ( done ) {
				if ( this.options.display != null ) {
					// Reset the overflow
					this.elem.style.overflow = this.options.overflow;

					// Reset the display
					var old = jQuery.data(this.elem, "olddisplay");
					this.elem.style.display = old ? old : this.options.display;

					if ( jQuery.css(this.elem, "display") === "none" ) {
						this.elem.style.display = "block";
					}
				}

				// Hide the element if the "hide" operation was done
				if ( this.options.hide ) {
					jQuery(this.elem).hide();
				}

				// Reset the properties, if the item has been hidden or shown
				if ( this.options.hide || this.options.show ) {
					for ( var p in this.options.curAnim ) {
						jQuery.style(this.elem, p, this.options.orig[p]);
					}
				}

				// Execute the complete function
				this.options.complete.call( this.elem );
			}

			return false;

		} else {
			var n = t - this.startTime;
			this.state = n / this.options.duration;

			// Perform the easing function, defaults to swing
			var specialEasing = this.options.specialEasing && this.options.specialEasing[this.prop];
			var defaultEasing = this.options.easing || (jQuery.easing.swing ? "swing" : "linear");
			this.pos = jQuery.easing[specialEasing || defaultEasing](this.state, n, 0, 1, this.options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);

			// Perform the next step of the animation
			this.update();
		}

		return true;
	}
};

jQuery.extend( jQuery.fx, {
	tick: function() {
		var timers = jQuery.timers;

		for ( var i = 0; i < timers.length; i++ ) {
			if ( !timers[i]() ) {
				timers.splice(i--, 1);
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
	},
		
	stop: function() {
		clearInterval( timerId );
		timerId = null;
	},
	
	speeds: {
		slow: 600,
 		fast: 200,
 		// Default speed
 		_default: 400
	},

	step: {
		opacity: function( fx ) {
			jQuery.style(fx.elem, "opacity", fx.now);
		},

		_default: function( fx ) {
			if ( fx.elem.style && fx.elem.style[ fx.prop ] != null ) {
				fx.elem.style[ fx.prop ] = (fx.prop === "width" || fx.prop === "height" ? Math.max(0, fx.now) : fx.now) + fx.unit;
			} else {
				fx.elem[ fx.prop ] = fx.now;
			}
		}
	}
});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}

function genFx( type, num ) {
	var obj = {};

	jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice(0,num)), function() {
		obj[ this ] = type;
	});

	return obj;
}
if ( "getBoundingClientRect" in document.documentElement ) {
	jQuery.fn.offset = function( options ) {
		var elem = this[0];

		if ( options ) { 
			return this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
		}

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement,
			clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
			top  = box.top  + (self.pageYOffset || jQuery.support.boxModel && docElem.scrollTop  || body.scrollTop ) - clientTop,
			left = box.left + (self.pageXOffset || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft) - clientLeft;

		return { top: top, left: left };
	};

} else {
	jQuery.fn.offset = function( options ) {
		var elem = this[0];

		if ( options ) { 
			return this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
		}

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		jQuery.offset.initialize();

		var offsetParent = elem.offsetParent, prevOffsetParent = elem,
			doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
			body = doc.body, defaultView = doc.defaultView,
			prevComputedStyle = defaultView ? defaultView.getComputedStyle( elem, null ) : elem.currentStyle,
			top = elem.offsetTop, left = elem.offsetLeft;

		while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
			if ( jQuery.offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
				break;
			}

			computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
			top  -= elem.scrollTop;
			left -= elem.scrollLeft;

			if ( elem === offsetParent ) {
				top  += elem.offsetTop;
				left += elem.offsetLeft;

				if ( jQuery.offset.doesNotAddBorder && !(jQuery.offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.nodeName)) ) {
					top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
					left += parseFloat( computedStyle.borderLeftWidth ) || 0;
				}

				prevOffsetParent = offsetParent, offsetParent = elem.offsetParent;
			}

			if ( jQuery.offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
				top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
				left += parseFloat( computedStyle.borderLeftWidth ) || 0;
			}

			prevComputedStyle = computedStyle;
		}

		if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
			top  += body.offsetTop;
			left += body.offsetLeft;
		}

		if ( jQuery.offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
			top  += Math.max( docElem.scrollTop, body.scrollTop );
			left += Math.max( docElem.scrollLeft, body.scrollLeft );
		}

		return { top: top, left: left };
	};
}

jQuery.offset = {
	initialize: function() {
		var body = document.body, container = document.createElement("div"), innerDiv, checkDiv, table, td, bodyMarginTop = parseFloat( jQuery.curCSS(body, "marginTop", true) ) || 0,
			html = "<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";

		jQuery.extend( container.style, { position: "absolute", top: 0, left: 0, margin: 0, border: 0, width: "1px", height: "1px", visibility: "hidden" } );

		container.innerHTML = html;
		body.insertBefore( container, body.firstChild );
		innerDiv = container.firstChild;
		checkDiv = innerDiv.firstChild;
		td = innerDiv.nextSibling.firstChild.firstChild;

		this.doesNotAddBorder = (checkDiv.offsetTop !== 5);
		this.doesAddBorderForTableAndCells = (td.offsetTop === 5);

		checkDiv.style.position = "fixed", checkDiv.style.top = "20px";
		// safari subtracts parent border width here which is 5px
		this.supportsFixedPosition = (checkDiv.offsetTop === 20 || checkDiv.offsetTop === 15);
		checkDiv.style.position = checkDiv.style.top = "";

		innerDiv.style.overflow = "hidden", innerDiv.style.position = "relative";
		this.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

		this.doesNotIncludeMarginInBodyOffset = (body.offsetTop !== bodyMarginTop);

		body.removeChild( container );
		body = container = innerDiv = checkDiv = table = td = null;
		jQuery.offset.initialize = jQuery.noop;
	},

	bodyOffset: function( body ) {
		var top = body.offsetTop, left = body.offsetLeft;

		jQuery.offset.initialize();

		if ( jQuery.offset.doesNotIncludeMarginInBodyOffset ) {
			top  += parseFloat( jQuery.curCSS(body, "marginTop",  true) ) || 0;
			left += parseFloat( jQuery.curCSS(body, "marginLeft", true) ) || 0;
		}

		return { top: top, left: left };
	},
	
	setOffset: function( elem, options, i ) {
		// set position first, in-case top/left are set even on static elem
		if ( /static/.test( jQuery.curCSS( elem, "position" ) ) ) {
			elem.style.position = "relative";
		}
		var curElem   = jQuery( elem ),
			curOffset = curElem.offset(),
			curTop    = parseInt( jQuery.curCSS( elem, "top",  true ), 10 ) || 0,
			curLeft   = parseInt( jQuery.curCSS( elem, "left", true ), 10 ) || 0;

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		var props = {
			top:  (options.top  - curOffset.top)  + curTop,
			left: (options.left - curOffset.left) + curLeft
		};
		
		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({
	position: function() {
		if ( !this[0] ) {
			return null;
		}

		var elem = this[0],

		// Get *real* offsetParent
		offsetParent = this.offsetParent(),

		// Get correct offsets
		offset       = this.offset(),
		parentOffset = /^body|html$/i.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

		// Subtract element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		offset.top  -= parseFloat( jQuery.curCSS(elem, "marginTop",  true) ) || 0;
		offset.left -= parseFloat( jQuery.curCSS(elem, "marginLeft", true) ) || 0;

		// Add offsetParent borders
		parentOffset.top  += parseFloat( jQuery.curCSS(offsetParent[0], "borderTopWidth",  true) ) || 0;
		parentOffset.left += parseFloat( jQuery.curCSS(offsetParent[0], "borderLeftWidth", true) ) || 0;

		// Subtract the two offsets
		return {
			top:  offset.top  - parentOffset.top,
			left: offset.left - parentOffset.left
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || document.body;
			while ( offsetParent && (!/^body|html$/i.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( ["Left", "Top"], function( i, name ) {
	var method = "scroll" + name;

	jQuery.fn[ method ] = function(val) {
		var elem = this[0], win;
		
		if ( !elem ) {
			return null;
		}

		if ( val !== undefined ) {
			// Set the scroll offset
			return this.each(function() {
				win = getWindow( this );

				if ( win ) {
					win.scrollTo(
						!i ? val : jQuery(win).scrollLeft(),
						 i ? val : jQuery(win).scrollTop()
					);

				} else {
					this[ method ] = val;
				}
			});
		} else {
			win = getWindow( elem );

			// Return the scroll offset
			return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
				jQuery.support.boxModel && win.document.documentElement[ method ] ||
					win.document.body[ method ] :
				elem[ method ];
		}
	};
});

function getWindow( elem ) {
	return ("scrollTo" in elem && elem.document) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}
// Create innerHeight, innerWidth, outerHeight and outerWidth methods
jQuery.each([ "Height", "Width" ], function( i, name ) {

	var type = name.toLowerCase();

	// innerHeight and innerWidth
	jQuery.fn["inner" + name] = function() {
		return this[0] ?
			jQuery.css( this[0], type, false, "padding" ) :
			null;
	};

	// outerHeight and outerWidth
	jQuery.fn["outer" + name] = function( margin ) {
		return this[0] ?
			jQuery.css( this[0], type, false, margin ? "margin" : "border" ) :
			null;
	};

	jQuery.fn[ type ] = function( size ) {
		// Get window width or height
		var elem = this[0];
		if ( !elem ) {
			return size == null ? null : this;
		}
		
		if ( jQuery.isFunction( size ) ) {
			return this.each(function( i ) {
				var self = jQuery( this );
				self[ type ]( size.call( this, i, self[ type ]() ) );
			});
		}

		return ("scrollTo" in elem && elem.document) ? // does it walk and quack like a window?
			// Everyone else use document.documentElement or document.body depending on Quirks vs Standards mode
			elem.document.compatMode === "CSS1Compat" && elem.document.documentElement[ "client" + name ] ||
			elem.document.body[ "client" + name ] :

			// Get document width or height
			(elem.nodeType === 9) ? // is it a document
				// Either scroll[Width/Height] or offset[Width/Height], whichever is greater
				Math.max(
					elem.documentElement["client" + name],
					elem.body["scroll" + name], elem.documentElement["scroll" + name],
					elem.body["offset" + name], elem.documentElement["offset" + name]
				) :

				// Get or set width or height on the element
				size === undefined ?
					// Get width or height on the element
					jQuery.css( elem, type ) :

					// Set the width or height on the element (default to pixels if value is unitless)
					this.css( type, typeof size === "string" ? size : size + "px" );
	};

});
// Expose jQuery to the global object
window.jQuery = window.$ = jQuery;

})(window);
/*!
 * jQuery UI 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI
 */
(function( $, undefined ) {

// prevent duplicate loading
// this is only a problem because we proxy existing functions
// and we don't want to double proxy them
$.ui = $.ui || {};
if ( $.ui.version ) {
	return;
}

$.extend( $.ui, {
	version: "1.8.5",

	keyCode: {
		ALT: 18,
		BACKSPACE: 8,
		CAPS_LOCK: 20,
		COMMA: 188,
		COMMAND: 91,
		COMMAND_LEFT: 91, // COMMAND
		COMMAND_RIGHT: 93,
		CONTROL: 17,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		INSERT: 45,
		LEFT: 37,
		MENU: 93, // COMMAND_RIGHT
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SHIFT: 16,
		SPACE: 32,
		TAB: 9,
		UP: 38,
		WINDOWS: 91 // COMMAND
	}
});

// plugins
$.fn.extend({
	_focus: $.fn.focus,
	focus: function( delay, fn ) {
		return typeof delay === "number" ?
			this.each(function() {
				var elem = this;
				setTimeout(function() {
					$( elem ).focus();
					if ( fn ) {
						fn.call( elem );
					}
				}, delay );
			}) :
			this._focus.apply( this, arguments );
	},

	scrollParent: function() {
		var scrollParent;
		if (($.browser.msie && (/(static|relative)/).test(this.css('position'))) || (/absolute/).test(this.css('position'))) {
			scrollParent = this.parents().filter(function() {
				return (/(relative|absolute|fixed)/).test($.curCSS(this,'position',1)) && (/(auto|scroll)/).test($.curCSS(this,'overflow',1)+$.curCSS(this,'overflow-y',1)+$.curCSS(this,'overflow-x',1));
			}).eq(0);
		} else {
			scrollParent = this.parents().filter(function() {
				return (/(auto|scroll)/).test($.curCSS(this,'overflow',1)+$.curCSS(this,'overflow-y',1)+$.curCSS(this,'overflow-x',1));
			}).eq(0);
		}

		return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ) );
					if ( !isNaN( value ) && value != 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	},
	
	disableSelection: function() {
		return this.bind(
			"mousedown.ui-disableSelection selectstart.ui-disableSelection",
			function( event ) {
				event.preventDefault();
			});
	},

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	}
});

$.each( [ "Width", "Height" ], function( i, name ) {
	var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
		type = name.toLowerCase(),
		orig = {
			innerWidth: $.fn.innerWidth,
			innerHeight: $.fn.innerHeight,
			outerWidth: $.fn.outerWidth,
			outerHeight: $.fn.outerHeight
		};

	function reduce( elem, size, border, margin ) {
		$.each( side, function() {
			size -= parseFloat( $.curCSS( elem, "padding" + this, true) ) || 0;
			if ( border ) {
				size -= parseFloat( $.curCSS( elem, "border" + this + "Width", true) ) || 0;
			}
			if ( margin ) {
				size -= parseFloat( $.curCSS( elem, "margin" + this, true) ) || 0;
			}
		});
		return size;
	}

	$.fn[ "inner" + name ] = function( size ) {
		if ( size === undefined ) {
			return orig[ "inner" + name ].call( this );
		}

		return this.each(function() {
			$.style( this, type, reduce( this, size ) + "px" );
		});
	};

	$.fn[ "outer" + name] = function( size, margin ) {
		if ( typeof size !== "number" ) {
			return orig[ "outer" + name ].call( this, size );
		}

		return this.each(function() {
			$.style( this, type, reduce( this, size, true, margin ) + "px" );
		});
	};
});

// selectors
function visible( element ) {
	return !$( element ).parents().andSelf().filter(function() {
		return $.curCSS( this, "visibility" ) === "hidden" ||
			$.expr.filters.hidden( this );
	}).length;
}

$.extend( $.expr[ ":" ], {
	data: function( elem, i, match ) {
		return !!$.data( elem, match[ 3 ] );
	},

	focusable: function( element ) {
		var nodeName = element.nodeName.toLowerCase(),
			tabIndex = $.attr( element, "tabindex" );
		if ( "area" === nodeName ) {
			var map = element.parentNode,
				mapName = map.name,
				img;
			if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
				return false;
			}
			img = $( "img[usemap=#" + mapName + "]" )[0];
			return !!img && visible( img );
		}
		return ( /input|select|textarea|button|object/.test( nodeName )
			? !element.disabled
			: "a" == nodeName
				? element.href || !isNaN( tabIndex )
				: !isNaN( tabIndex ))
			// the element and all of its ancestors must be visible
			&& visible( element );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" );
		return ( isNaN( tabIndex ) || tabIndex >= 0 ) && $( element ).is( ":focusable" );
	}
});

// support
$(function() {
	var div = document.createElement( "div" ),
		body = document.body;

	$.extend( div.style, {
		minHeight: "100px",
		height: "auto",
		padding: 0,
		borderWidth: 0
	});

	$.support.minHeight = body.appendChild( div ).offsetHeight === 100;
	// set display to none to avoid a layout bug in IE
	// http://dev.jquery.com/ticket/4014
	body.removeChild( div ).style.display = "none";
});





// deprecated
$.extend( $.ui, {
	// $.ui.plugin is deprecated.  Use the proxy pattern instead.
	plugin: {
		add: function( module, option, set ) {
			var proto = $.ui[ module ].prototype;
			for ( var i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args ) {
			var set = instance.plugins[ name ];
			if ( !set || !instance.element[ 0 ].parentNode ) {
				return;
			}
	
			for ( var i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	},
	
	// will be deprecated when we switch to jQuery 1.4 - use jQuery.contains()
	contains: function( a, b ) {
		return document.compareDocumentPosition ?
			a.compareDocumentPosition( b ) & 16 :
			a !== b && a.contains( b );
	},
	
	// only used by resizable
	hasScroll: function( el, a ) {
	
		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}
	
		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;
	
		if ( el[ scroll ] > 0 ) {
			return true;
		}
	
		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	},
	
	// these are odd functions, fix the API or move into individual plugins
	isOverAxis: function( x, reference, size ) {
		//Determines when x coordinate is over "b" element axis
		return ( x > reference ) && ( x < ( reference + size ) );
	},
	isOver: function( y, x, top, left, height, width ) {
		//Determines when x, y coordinates is over "b" element
		return $.ui.isOverAxis( y, top, height ) && $.ui.isOverAxis( x, left, width );
	}
});

})( jQuery );
/*!
 * jQuery UI Widget 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Widget
 */
(function( $, undefined ) {

// jQuery 1.4+
if ( $.cleanData ) {
	var _cleanData = $.cleanData;
	$.cleanData = function( elems ) {
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			$( elem ).triggerHandler( "remove" );
		}
		_cleanData( elems );
	};
} else {
	var _remove = $.fn.remove;
	$.fn.remove = function( selector, keepData ) {
		return this.each(function() {
			if ( !keepData ) {
				if ( !selector || $.filter( selector, [ this ] ).length ) {
					$( "*", this ).add( [ this ] ).each(function() {
						$( this ).triggerHandler( "remove" );
					});
				}
			}
			return _remove.call( $(this), selector, keepData );
		});
	};
}

$.widget = function( name, base, prototype ) {
	var namespace = name.split( "." )[ 0 ],
		fullName;
	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName ] = function( elem ) {
		return !!$.data( elem, name );
	};

	$[ namespace ] = $[ namespace ] || {};
	$[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without initializing for simple inheritance
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	var basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
//	$.each( basePrototype, function( key, val ) {
//		if ( $.isPlainObject(val) ) {
//			basePrototype[ key ] = $.extend( {}, val );
//		}
//	});
	basePrototype.options = $.extend( true, {}, basePrototype.options );
	$[ namespace ][ name ].prototype = $.extend( true, basePrototype, {
		namespace: namespace,
		widgetName: name,
		widgetEventPrefix: $[ namespace ][ name ].prototype.widgetEventPrefix || name,
		widgetBaseClass: fullName
	}, prototype );

	$.widget.bridge( name, $[ namespace ][ name ] );
};

$.widget.bridge = function( name, object ) {
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = Array.prototype.slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.extend.apply( null, [ true, options ].concat(args) ) :
			options;

		// prevent calls to internal methods
		if ( isMethodCall && options.substring( 0, 1 ) === "_" ) {
			return returnValue;
		}

		if ( isMethodCall ) {
			this.each(function() {
				var instance = $.data( this, name );
				if ( !instance ) {
					throw "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'";
				}
				if ( !$.isFunction( instance[options] ) ) {
					throw "no such method '" + options + "' for " + name + " widget instance";
				}
				var methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, name );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, name, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( options, element ) {
	// allow instantiation without initializing for simple inheritance
	if ( arguments.length ) {
		this._createWidget( options, element );
	}
};

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	options: {
		disabled: false
	},
	_createWidget: function( options, element ) {
		// $.widget.bridge stores the plugin instance, but we do it anyway
		// so that it's stored even before the _create function runs
		$.data( element, this.widgetName, this );
		this.element = $( element );
		this.options = $.extend( true, {},
			this.options,
			$.metadata && $.metadata.get( element )[ this.widgetName ],
			options );

		var self = this;
		this.element.bind( "remove." + this.widgetName, function() {
			self.destroy();
		});

		this._create();
		this._init();
	},
	_create: function() {},
	_init: function() {},

	destroy: function() {
		this.element
			.unbind( "." + this.widgetName )
			.removeData( this.widgetName );
		this.widget()
			.unbind( "." + this.widgetName )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetBaseClass + "-disabled " +
				"ui-state-disabled" );
	},

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			self = this;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.extend( {}, self.options );
		}

		if  (typeof key === "string" ) {
			if ( value === undefined ) {
				return this.options[ key ];
			}
			options = {};
			options[ key ] = value;
		}

		$.each( options, function( key, value ) {
			self._setOption( key, value );
		});

		return self;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				[ value ? "addClass" : "removeClass"](
					this.widgetBaseClass + "-disabled" + " " +
					"ui-state-disabled" )
				.attr( "aria-disabled", value );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_trigger: function( type, event, data ) {
		var callback = this.options[ type ];

		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		data = data || {};

		// copy original event properties over to the new event
		// this would happen if we could call $.event.fix instead of $.Event
		// but we don't have a way to force an event to be fixed multiple times
		if ( event.originalEvent ) {
			for ( var i = $.event.props.length, prop; i; ) {
				prop = $.event.props[ --i ];
				event[ prop ] = event.originalEvent[ prop ];
			}
		}

		this.element.trigger( event, data );

		return !( $.isFunction(callback) &&
			callback.call( this.element[0], event, data ) === false ||
			event.isDefaultPrevented() );
	}
};

})( jQuery );
/*
 * jQuery UI Position 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Position
 */
(function( $, undefined ) {

$.ui = $.ui || {};

var horizontalPositions = /left|center|right/,
	verticalPositions = /top|center|bottom/,
	center = "center",
	_position = $.fn.position,
	_offset = $.fn.offset;

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var target = $( options.of ),
		targetElem = target[0],
		collision = ( options.collision || "flip" ).split( " " ),
		offset = options.offset ? options.offset.split( " " ) : [ 0, 0 ],
		targetWidth,
		targetHeight,
		basePosition;

	if ( targetElem.nodeType === 9 ) {
		targetWidth = target.width();
		targetHeight = target.height();
		basePosition = { top: 0, left: 0 };
	} else if ( targetElem.scrollTo && targetElem.document ) {
		targetWidth = target.width();
		targetHeight = target.height();
		basePosition = { top: target.scrollTop(), left: target.scrollLeft() };
	} else if ( targetElem.preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
		targetWidth = targetHeight = 0;
		basePosition = { top: options.of.pageY, left: options.of.pageX };
	} else {
		targetWidth = target.outerWidth();
		targetHeight = target.outerHeight();
		basePosition = target.offset();
	}

	// force my and at to have valid horizontal and veritcal positions
	// if a value is missing or invalid, it will be converted to center 
	$.each( [ "my", "at" ], function() {
		var pos = ( options[this] || "" ).split( " " );
		if ( pos.length === 1) {
			pos = horizontalPositions.test( pos[0] ) ?
				pos.concat( [center] ) :
				verticalPositions.test( pos[0] ) ?
					[ center ].concat( pos ) :
					[ center, center ];
		}
		pos[ 0 ] = horizontalPositions.test( pos[0] ) ? pos[ 0 ] : center;
		pos[ 1 ] = verticalPositions.test( pos[1] ) ? pos[ 1 ] : center;
		options[ this ] = pos;
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	// normalize offset option
	offset[ 0 ] = parseInt( offset[0], 10 ) || 0;
	if ( offset.length === 1 ) {
		offset[ 1 ] = offset[ 0 ];
	}
	offset[ 1 ] = parseInt( offset[1], 10 ) || 0;

	if ( options.at[0] === "right" ) {
		basePosition.left += targetWidth;
	} else if (options.at[0] === center ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[1] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[1] === center ) {
		basePosition.top += targetHeight / 2;
	}

	basePosition.left += offset[ 0 ];
	basePosition.top += offset[ 1 ];

	return this.each(function() {
		var elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseInt( $.curCSS( this, "marginLeft", true ) ) || 0,
			marginTop = parseInt( $.curCSS( this, "marginTop", true ) ) || 0,
			collisionWidth = elemWidth + marginLeft +
				parseInt( $.curCSS( this, "marginRight", true ) ) || 0,
			collisionHeight = elemHeight + marginTop +
				parseInt( $.curCSS( this, "marginBottom", true ) ) || 0,
			position = $.extend( {}, basePosition ),
			collisionPosition;

		if ( options.my[0] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[0] === center ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[1] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[1] === center ) {
			position.top -= elemHeight / 2;
		}

		// prevent fractions (see #5280)
		position.left = parseInt( position.left );
		position.top = parseInt( position.top );

		collisionPosition = {
			left: position.left - marginLeft,
			top: position.top - marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[i] ] ) {
				$.ui.position[ collision[i] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: offset,
					my: options.my,
					at: options.at
				});
			}
		});

		if ( $.fn.bgiframe ) {
			elem.bgiframe();
		}
		elem.offset( $.extend( position, { using: options.using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var win = $( window ),
				over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft();
			position.left = over > 0 ? position.left - over : Math.max( position.left - data.collisionPosition.left, position.left );
		},
		top: function( position, data ) {
			var win = $( window ),
				over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop();
			position.top = over > 0 ? position.top - over : Math.max( position.top - data.collisionPosition.top, position.top );
		}
	},

	flip: {
		left: function( position, data ) {
			if ( data.at[0] === center ) {
				return;
			}
			var win = $( window ),
				over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft(),
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					-data.targetWidth,
				offset = -2 * data.offset[ 0 ];
			position.left += data.collisionPosition.left < 0 ?
				myOffset + atOffset + offset :
				over > 0 ?
					myOffset + atOffset + offset :
					0;
		},
		top: function( position, data ) {
			if ( data.at[1] === center ) {
				return;
			}
			var win = $( window ),
				over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop(),
				myOffset = data.my[ 1 ] === "top" ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					-data.targetHeight,
				offset = -2 * data.offset[ 1 ];
			position.top += data.collisionPosition.top < 0 ?
				myOffset + atOffset + offset :
				over > 0 ?
					myOffset + atOffset + offset :
					0;
		}
	}
};

// offset setter from jQuery 1.4
if ( !$.offset.setOffset ) {
	$.offset.setOffset = function( elem, options ) {
		// set position first, in-case top/left are set even on static elem
		if ( /static/.test( $.curCSS( elem, "position" ) ) ) {
			elem.style.position = "relative";
		}
		var curElem   = $( elem ),
			curOffset = curElem.offset(),
			curTop    = parseInt( $.curCSS( elem, "top",  true ), 10 ) || 0,
			curLeft   = parseInt( $.curCSS( elem, "left", true ), 10)  || 0,
			props     = {
				top:  (options.top  - curOffset.top)  + curTop,
				left: (options.left - curOffset.left) + curLeft
			};
		
		if ( 'using' in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	};

	$.fn.offset = function( options ) {
		var elem = this[ 0 ];
		if ( !elem || !elem.ownerDocument ) { return null; }
		if ( options ) { 
			return this.each(function() {
				$.offset.setOffset( this, options );
			});
		}
		return _offset.call( this );
	};
}

}( jQuery ));
/*
 * jQuery UI Button 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Button
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

var lastActive,
	baseClasses = "ui-button ui-widget ui-state-default ui-corner-all",
	stateClasses = "ui-state-hover ui-state-active ",
	typeClasses = "ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only",
	formResetHandler = function( event ) {
		$( ":ui-button", event.target.form ).each(function() {
			var inst = $( this ).data( "button" );
			setTimeout(function() {
				inst.refresh();
			}, 1 );
		});
	},
	radioGroup = function( radio ) {
		var name = radio.name,
			form = radio.form,
			radios = $( [] );
		if ( name ) {
			if ( form ) {
				radios = $( form ).find( "[name='" + name + "']" );
			} else {
				radios = $( "[name='" + name + "']", radio.ownerDocument )
					.filter(function() {
						return !this.form;
					});
			}
		}
		return radios;
	};

$.widget( "ui.button", {
	options: {
		disabled: null,
		text: true,
		label: null,
		icons: {
			primary: null,
			secondary: null
		}
	},
	_create: function() {
		this.element.closest( "form" )
			.unbind( "reset.button" )
			.bind( "reset.button", formResetHandler );

		if ( typeof this.options.disabled !== "boolean" ) {
			this.options.disabled = this.element.attr( "disabled" );
		}

		this._determineButtonType();
		this.hasTitle = !!this.buttonElement.attr( "title" );

		var self = this,
			options = this.options,
			toggleButton = this.type === "checkbox" || this.type === "radio",
			hoverClass = "ui-state-hover" + ( !toggleButton ? " ui-state-active" : "" ),
			focusClass = "ui-state-focus";

		if ( options.label === null ) {
			options.label = this.buttonElement.html();
		}

		if ( this.element.is( ":disabled" ) ) {
			options.disabled = true;
		}

		this.buttonElement
			.addClass( baseClasses )
			.attr( "role", "button" )
			.bind( "mouseenter.button", function() {
				if ( options.disabled ) {
					return;
				}
				$( this ).addClass( "ui-state-hover" );
				if ( this === lastActive ) {
					$( this ).addClass( "ui-state-active" );
				}
			})
			.bind( "mouseleave.button", function() {
				if ( options.disabled ) {
					return;
				}
				$( this ).removeClass( hoverClass );
			})
			.bind( "focus.button", function() {
				// no need to check disabled, focus won't be triggered anyway
				$( this ).addClass( focusClass );
			})
			.bind( "blur.button", function() {
				$( this ).removeClass( focusClass );
			});

		if ( toggleButton ) {
			this.element.bind( "change.button", function() {
				self.refresh();
			});
		}

		if ( this.type === "checkbox" ) {
			this.buttonElement.bind( "click.button", function() {
				if ( options.disabled ) {
					return false;
				}
				$( this ).toggleClass( "ui-state-active" );
				self.buttonElement.attr( "aria-pressed", self.element[0].checked );
			});
		} else if ( this.type === "radio" ) {
			this.buttonElement.bind( "click.button", function() {
				if ( options.disabled ) {
					return false;
				}
				$( this ).addClass( "ui-state-active" );
				self.buttonElement.attr( "aria-pressed", true );

				var radio = self.element[ 0 ];
				radioGroup( radio )
					.not( radio )
					.map(function() {
						return $( this ).button( "widget" )[ 0 ];
					})
					.removeClass( "ui-state-active" )
					.attr( "aria-pressed", false );
			});
		} else {
			this.buttonElement
				.bind( "mousedown.button", function() {
					if ( options.disabled ) {
						return false;
					}
					$( this ).addClass( "ui-state-active" );
					lastActive = this;
					$( document ).one( "mouseup", function() {
						lastActive = null;
					});
				})
				.bind( "mouseup.button", function() {
					if ( options.disabled ) {
						return false;
					}
					$( this ).removeClass( "ui-state-active" );
				})
				.bind( "keydown.button", function(event) {
					if ( options.disabled ) {
						return false;
					}
					if ( event.keyCode == $.ui.keyCode.SPACE || event.keyCode == $.ui.keyCode.ENTER ) {
						$( this ).addClass( "ui-state-active" );
					}
				})
				.bind( "keyup.button", function() {
					$( this ).removeClass( "ui-state-active" );
				});

			if ( this.buttonElement.is("a") ) {
				this.buttonElement.keyup(function(event) {
					if ( event.keyCode === $.ui.keyCode.SPACE ) {
						// TODO pass through original event correctly (just as 2nd argument doesn't work)
						$( this ).click();
					}
				});
			}
		}

		// TODO: pull out $.Widget's handling for the disabled option into
		// $.Widget.prototype._setOptionDisabled so it's easy to proxy and can
		// be overridden by individual plugins
		this._setOption( "disabled", options.disabled );
	},

	_determineButtonType: function() {
		
		if ( this.element.is(":checkbox") ) {
			this.type = "checkbox";
		} else {
			if ( this.element.is(":radio") ) {
				this.type = "radio";
			} else {
				if ( this.element.is("input") ) {
					this.type = "input";
				} else {
					this.type = "button";
				}
			}
		}
		
		if ( this.type === "checkbox" || this.type === "radio" ) {
			// we don't search against the document in case the element
			// is disconnected from the DOM
			this.buttonElement = this.element.parents().last()
				.find( "label[for=" + this.element.attr("id") + "]" );
			this.element.addClass( "ui-helper-hidden-accessible" );

			var checked = this.element.is( ":checked" );
			if ( checked ) {
				this.buttonElement.addClass( "ui-state-active" );
			}
			this.buttonElement.attr( "aria-pressed", checked );
		} else {
			this.buttonElement = this.element;
		}
	},

	widget: function() {
		return this.buttonElement;
	},

	destroy: function() {
		this.element
			.removeClass( "ui-helper-hidden-accessible" );
		this.buttonElement
			.removeClass( baseClasses + " " + stateClasses + " " + typeClasses )
			.removeAttr( "role" )
			.removeAttr( "aria-pressed" )
			.html( this.buttonElement.find(".ui-button-text").html() );

		if ( !this.hasTitle ) {
			this.buttonElement.removeAttr( "title" );
		}

		$.Widget.prototype.destroy.call( this );
	},

	_setOption: function( key, value ) {
		$.Widget.prototype._setOption.apply( this, arguments );
		if ( key === "disabled" ) {
			if ( value ) {
				this.element.attr( "disabled", true );
			} else {
				this.element.removeAttr( "disabled" );
			}
		}
		this._resetButton();
	},

	refresh: function() {
		var isDisabled = this.element.is( ":disabled" );
		if ( isDisabled !== this.options.disabled ) {
			this._setOption( "disabled", isDisabled );
		}
		if ( this.type === "radio" ) {
			radioGroup( this.element[0] ).each(function() {
				if ( $( this ).is( ":checked" ) ) {
					$( this ).button( "widget" )
						.addClass( "ui-state-active" )
						.attr( "aria-pressed", true );
				} else {
					$( this ).button( "widget" )
						.removeClass( "ui-state-active" )
						.attr( "aria-pressed", false );
				}
			});
		} else if ( this.type === "checkbox" ) {
			if ( this.element.is( ":checked" ) ) {
				this.buttonElement
					.addClass( "ui-state-active" )
					.attr( "aria-pressed", true );
			} else {
				this.buttonElement
					.removeClass( "ui-state-active" )
					.attr( "aria-pressed", false );
			}
		}
	},

	_resetButton: function() {
		if ( this.type === "input" ) {
			if ( this.options.label ) {
				this.element.val( this.options.label );
			}
			return;
		}
		var buttonElement = this.buttonElement.removeClass( typeClasses ),
			buttonText = $( "<span></span>" )
				.addClass( "ui-button-text" )
				.html( this.options.label )
				.appendTo( buttonElement.empty() )
				.text(),
			icons = this.options.icons,
			multipleIcons = icons.primary && icons.secondary;
		if ( icons.primary || icons.secondary ) {
			buttonElement.addClass( "ui-button-text-icon" +
				( multipleIcons ? "s" : ( icons.primary ? "-primary" : "-secondary" ) ) );
			if ( icons.primary ) {
				buttonElement.prepend( "<span class='ui-button-icon-primary ui-icon " + icons.primary + "'></span>" );
			}
			if ( icons.secondary ) {
				buttonElement.append( "<span class='ui-button-icon-secondary ui-icon " + icons.secondary + "'></span>" );
			}
			if ( !this.options.text ) {
				buttonElement
					.addClass( multipleIcons ? "ui-button-icons-only" : "ui-button-icon-only" )
					.removeClass( "ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary" );
				if ( !this.hasTitle ) {
					buttonElement.attr( "title", buttonText );
				}
			}
		} else {
			buttonElement.addClass( "ui-button-text-only" );
		}
	}
});

$.widget( "ui.buttonset", {
	_create: function() {
		this.element.addClass( "ui-buttonset" );
		this._init();
	},
	
	_init: function() {
		this.refresh();
	},

	_setOption: function( key, value ) {
		if ( key === "disabled" ) {
			this.buttons.button( "option", key, value );
		}

		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	refresh: function() {
		this.buttons = this.element.find( ":button, :submit, :reset, :checkbox, :radio, a, :data(button)" )
			.filter( ":ui-button" )
				.button( "refresh" )
			.end()
			.not( ":ui-button" )
				.button()
			.end()
			.map(function() {
				return $( this ).button( "widget" )[ 0 ];
			})
				.removeClass( "ui-corner-all ui-corner-left ui-corner-right" )
				.filter( ":visible" )
					.filter( ":first" )
						.addClass( "ui-corner-left" )
					.end()
					.filter( ":last" )
						.addClass( "ui-corner-right" )
					.end()
				.end()
			.end();
	},

	destroy: function() {
		this.element.removeClass( "ui-buttonset" );
		this.buttons
			.map(function() {
				return $( this ).button( "widget" )[ 0 ];
			})
				.removeClass( "ui-corner-left ui-corner-right" )
			.end()
			.button( "destroy" );

		$.Widget.prototype.destroy.call( this );
	}
});

}( jQuery ) );
/*
 * jQuery UI Dialog 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Dialog
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.ui.button.js
 *	jquery.ui.draggable.js
 *	jquery.ui.mouse.js
 *	jquery.ui.position.js
 *	jquery.ui.resizable.js
 */
(function( $, undefined ) {

var uiDialogClasses =
	'ui-dialog ' +
	'ui-widget ' +
	'ui-widget-content ' +
	'ui-corner-all ';

$.widget("ui.dialog", {
	options: {
		autoOpen: true,
		buttons: {},
		closeOnEscape: true,
		closeText: 'close',
		dialogClass: '',
		draggable: true,
		hide: null,
		height: 'auto',
		maxHeight: false,
		maxWidth: false,
		minHeight: 150,
		minWidth: 150,
		modal: false,
		position: {
			my: 'center',
			at: 'center',
			of: window,
			collision: 'fit',
			// ensure that the titlebar is never outside the document
			using: function(pos) {
				var topOffset = $(this).css(pos).offset().top;
				if (topOffset < 0) {
					$(this).css('top', pos.top - topOffset);
				}
			}
		},
		resizable: true,
		show: null,
		stack: true,
		title: '',
		width: 300,
		zIndex: 1000
	},

	_create: function() {
		this.originalTitle = this.element.attr('title');
		// #5742 - .attr() might return a DOMElement
		if ( typeof this.originalTitle !== "string" ) {
			this.originalTitle = "";
		}

		this.options.title = this.options.title || this.originalTitle;
		var self = this,
			options = self.options,

			title = options.title || '&#160;',
			titleId = $.ui.dialog.getTitleId(self.element),

			uiDialog = (self.uiDialog = $('<div></div>'))
				.appendTo(document.body)
				.hide()
				.addClass(uiDialogClasses + options.dialogClass)
				.css({
					zIndex: options.zIndex
				})
				// setting tabIndex makes the div focusable
				// setting outline to 0 prevents a border on focus in Mozilla
				.attr('tabIndex', -1).css('outline', 0).keydown(function(event) {
					if (options.closeOnEscape && event.keyCode &&
						event.keyCode === $.ui.keyCode.ESCAPE) {
						
						self.close(event);
						event.preventDefault();
					}
				})
				.attr({
					role: 'dialog',
					'aria-labelledby': titleId
				})
				.mousedown(function(event) {
					self.moveToTop(false, event);
				}),

			uiDialogContent = self.element
				.show()
				.removeAttr('title')
				.addClass(
					'ui-dialog-content ' +
					'ui-widget-content')
				.appendTo(uiDialog),

			uiDialogTitlebar = (self.uiDialogTitlebar = $('<div></div>'))
				.addClass(
					'ui-dialog-titlebar ' +
					'ui-widget-header ' +
					'ui-corner-all ' +
					'ui-helper-clearfix'
				)
				.prependTo(uiDialog),

			uiDialogTitlebarClose = $('<a href="#"></a>')
				.addClass(
					'ui-dialog-titlebar-close ' +
					'ui-corner-all'
				)
				.attr('role', 'button')
				.hover(
					function() {
						uiDialogTitlebarClose.addClass('ui-state-hover');
					},
					function() {
						uiDialogTitlebarClose.removeClass('ui-state-hover');
					}
				)
				.focus(function() {
					uiDialogTitlebarClose.addClass('ui-state-focus');
				})
				.blur(function() {
					uiDialogTitlebarClose.removeClass('ui-state-focus');
				})
				.click(function(event) {
					self.close(event);
					return false;
				})
				.appendTo(uiDialogTitlebar),

			uiDialogTitlebarCloseText = (self.uiDialogTitlebarCloseText = $('<span></span>'))
				.addClass(
					'ui-icon ' +
					'ui-icon-closethick'
				)
				.text(options.closeText)
				.appendTo(uiDialogTitlebarClose),

			uiDialogTitle = $('<span></span>')
				.addClass('ui-dialog-title')
				.attr('id', titleId)
				.html(title)
				.prependTo(uiDialogTitlebar);

		//handling of deprecated beforeclose (vs beforeClose) option
		//Ticket #4669 http://dev.jqueryui.com/ticket/4669
		//TODO: remove in 1.9pre
		if ($.isFunction(options.beforeclose) && !$.isFunction(options.beforeClose)) {
			options.beforeClose = options.beforeclose;
		}

		uiDialogTitlebar.find("*").add(uiDialogTitlebar).disableSelection();

		if (options.draggable && $.fn.draggable) {
			self._makeDraggable();
		}
		if (options.resizable && $.fn.resizable) {
			self._makeResizable();
		}

		self._createButtons(options.buttons);
		self._isOpen = false;

		if ($.fn.bgiframe) {
			uiDialog.bgiframe();
		}
	},

	_init: function() {
		if ( this.options.autoOpen ) {
			this.open();
		}
	},

	destroy: function() {
		var self = this;
		
		if (self.overlay) {
			self.overlay.destroy();
		}
		self.uiDialog.hide();
		self.element
			.unbind('.dialog')
			.removeData('dialog')
			.removeClass('ui-dialog-content ui-widget-content')
			.hide().appendTo('body');
		self.uiDialog.remove();

		if (self.originalTitle) {
			self.element.attr('title', self.originalTitle);
		}

		return self;
	},

	widget: function() {
		return this.uiDialog;
	},

	close: function(event) {
		var self = this,
			maxZ;
		
		if (false === self._trigger('beforeClose', event)) {
			return;
		}

		if (self.overlay) {
			self.overlay.destroy();
		}
		self.uiDialog.unbind('keypress.ui-dialog');

		self._isOpen = false;

		if (self.options.hide) {
			self.uiDialog.hide(self.options.hide, function() {
				self._trigger('close', event);
			});
		} else {
			self.uiDialog.hide();
			self._trigger('close', event);
		}

		$.ui.dialog.overlay.resize();

		// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
		if (self.options.modal) {
			maxZ = 0;
			$('.ui-dialog').each(function() {
				if (this !== self.uiDialog[0]) {
					maxZ = Math.max(maxZ, $(this).css('z-index'));
				}
			});
			$.ui.dialog.maxZ = maxZ;
		}

		return self;
	},

	isOpen: function() {
		return this._isOpen;
	},

	// the force parameter allows us to move modal dialogs to their correct
	// position on open
	moveToTop: function(force, event) {
		var self = this,
			options = self.options,
			saveScroll;

		if ((options.modal && !force) ||
			(!options.stack && !options.modal)) {
			return self._trigger('focus', event);
		}

		if (options.zIndex > $.ui.dialog.maxZ) {
			$.ui.dialog.maxZ = options.zIndex;
		}
		if (self.overlay) {
			$.ui.dialog.maxZ += 1;
			self.overlay.$el.css('z-index', $.ui.dialog.overlay.maxZ = $.ui.dialog.maxZ);
		}

		//Save and then restore scroll since Opera 9.5+ resets when parent z-Index is changed.
		//  http://ui.jquery.com/bugs/ticket/3193
		saveScroll = { scrollTop: self.element.attr('scrollTop'), scrollLeft: self.element.attr('scrollLeft') };
		$.ui.dialog.maxZ += 1;
		self.uiDialog.css('z-index', $.ui.dialog.maxZ);
		self.element.attr(saveScroll);
		self._trigger('focus', event);

		return self;
	},

	open: function() {
		if (this._isOpen) { return; }

		var self = this,
			options = self.options,
			uiDialog = self.uiDialog;

		self.overlay = options.modal ? new $.ui.dialog.overlay(self) : null;
		if (uiDialog.next().length) {
			uiDialog.appendTo('body');
		}
		self._size();
		self._position(options.position);
		uiDialog.show(options.show);
		self.moveToTop(true);

		// prevent tabbing out of modal dialogs
		if (options.modal) {
			uiDialog.bind('keypress.ui-dialog', function(event) {
				if (event.keyCode !== $.ui.keyCode.TAB) {
					return;
				}

				var tabbables = $(':tabbable', this),
					first = tabbables.filter(':first'),
					last  = tabbables.filter(':last');

				if (event.target === last[0] && !event.shiftKey) {
					first.focus(1);
					return false;
				} else if (event.target === first[0] && event.shiftKey) {
					last.focus(1);
					return false;
				}
			});
		}

		// set focus to the first tabbable element in the content area or the first button
		// if there are no tabbable elements, set focus on the dialog itself
		$(self.element.find(':tabbable').get().concat(
			uiDialog.find('.ui-dialog-buttonpane :tabbable').get().concat(
				uiDialog.get()))).eq(0).focus();

		self._isOpen = true;
		self._trigger('open');

		return self;
	},

	_createButtons: function(buttons) {
		var self = this,
			hasButtons = false,
			uiDialogButtonPane = $('<div></div>')
				.addClass(
					'ui-dialog-buttonpane ' +
					'ui-widget-content ' +
					'ui-helper-clearfix'
				),
			uiButtonSet = $( "<div></div>" )
				.addClass( "ui-dialog-buttonset" )
				.appendTo( uiDialogButtonPane );

		// if we already have a button pane, remove it
		self.uiDialog.find('.ui-dialog-buttonpane').remove();

		if (typeof buttons === 'object' && buttons !== null) {
			$.each(buttons, function() {
				return !(hasButtons = true);
			});
		}
		if (hasButtons) {
			$.each(buttons, function(name, props) {
				props = $.isFunction( props ) ?
					{ click: props, text: name } :
					props;
				var button = $('<button></button>', props)
					.unbind('click')
					.click(function() {
						props.click.apply(self.element[0], arguments);
					})
					.appendTo(uiButtonSet);
				if ($.fn.button) {
					button.button();
				}
			});
			uiDialogButtonPane.appendTo(self.uiDialog);
		}
	},

	_makeDraggable: function() {
		var self = this,
			options = self.options,
			doc = $(document),
			heightBeforeDrag;

		function filteredUi(ui) {
			return {
				position: ui.position,
				offset: ui.offset
			};
		}

		self.uiDialog.draggable({
			cancel: '.ui-dialog-content, .ui-dialog-titlebar-close',
			handle: '.ui-dialog-titlebar',
			containment: 'document',
			start: function(event, ui) {
				heightBeforeDrag = options.height === "auto" ? "auto" : $(this).height();
				$(this).height($(this).height()).addClass("ui-dialog-dragging");
				self._trigger('dragStart', event, filteredUi(ui));
			},
			drag: function(event, ui) {
				self._trigger('drag', event, filteredUi(ui));
			},
			stop: function(event, ui) {
				options.position = [ui.position.left - doc.scrollLeft(),
					ui.position.top - doc.scrollTop()];
				$(this).removeClass("ui-dialog-dragging").height(heightBeforeDrag);
				self._trigger('dragStop', event, filteredUi(ui));
				$.ui.dialog.overlay.resize();
			}
		});
	},

	_makeResizable: function(handles) {
		handles = (handles === undefined ? this.options.resizable : handles);
		var self = this,
			options = self.options,
			// .ui-resizable has position: relative defined in the stylesheet
			// but dialogs have to use absolute or fixed positioning
			position = self.uiDialog.css('position'),
			resizeHandles = (typeof handles === 'string' ?
				handles	:
				'n,e,s,w,se,sw,ne,nw'
			);

		function filteredUi(ui) {
			return {
				originalPosition: ui.originalPosition,
				originalSize: ui.originalSize,
				position: ui.position,
				size: ui.size
			};
		}

		self.uiDialog.resizable({
			cancel: '.ui-dialog-content',
			containment: 'document',
			alsoResize: self.element,
			maxWidth: options.maxWidth,
			maxHeight: options.maxHeight,
			minWidth: options.minWidth,
			minHeight: self._minHeight(),
			handles: resizeHandles,
			start: function(event, ui) {
				$(this).addClass("ui-dialog-resizing");
				self._trigger('resizeStart', event, filteredUi(ui));
			},
			resize: function(event, ui) {
				self._trigger('resize', event, filteredUi(ui));
			},
			stop: function(event, ui) {
				$(this).removeClass("ui-dialog-resizing");
				options.height = $(this).height();
				options.width = $(this).width();
				self._trigger('resizeStop', event, filteredUi(ui));
				$.ui.dialog.overlay.resize();
			}
		})
		.css('position', position)
		.find('.ui-resizable-se').addClass('ui-icon ui-icon-grip-diagonal-se');
	},

	_minHeight: function() {
		var options = this.options;

		if (options.height === 'auto') {
			return options.minHeight;
		} else {
			return Math.min(options.minHeight, options.height);
		}
	},

	_position: function(position) {
		var myAt = [],
			offset = [0, 0],
			isVisible;

		if (position) {
			// deep extending converts arrays to objects in jQuery <= 1.3.2 :-(
	//		if (typeof position == 'string' || $.isArray(position)) {
	//			myAt = $.isArray(position) ? position : position.split(' ');

			if (typeof position === 'string' || (typeof position === 'object' && '0' in position)) {
				myAt = position.split ? position.split(' ') : [position[0], position[1]];
				if (myAt.length === 1) {
					myAt[1] = myAt[0];
				}

				$.each(['left', 'top'], function(i, offsetPosition) {
					if (+myAt[i] === myAt[i]) {
						offset[i] = myAt[i];
						myAt[i] = offsetPosition;
					}
				});

				position = {
					my: myAt.join(" "),
					at: myAt.join(" "),
					offset: offset.join(" ")
				};
			} 

			position = $.extend({}, $.ui.dialog.prototype.options.position, position);
		} else {
			position = $.ui.dialog.prototype.options.position;
		}

		// need to show the dialog to get the actual offset in the position plugin
		isVisible = this.uiDialog.is(':visible');
		if (!isVisible) {
			this.uiDialog.show();
		}
		this.uiDialog
			// workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
			.css({ top: 0, left: 0 })
			.position(position);
		if (!isVisible) {
			this.uiDialog.hide();
		}
	},

	_setOption: function(key, value){
		var self = this,
			uiDialog = self.uiDialog,
			isResizable = uiDialog.is(':data(resizable)'),
			resize = false;

		switch (key) {
			//handling of deprecated beforeclose (vs beforeClose) option
			//Ticket #4669 http://dev.jqueryui.com/ticket/4669
			//TODO: remove in 1.9pre
			case "beforeclose":
				key = "beforeClose";
				break;
			case "buttons":
				self._createButtons(value);
				resize = true;
				break;
			case "closeText":
				// convert whatever was passed in to a string, for text() to not throw up
				self.uiDialogTitlebarCloseText.text("" + value);
				break;
			case "dialogClass":
				uiDialog
					.removeClass(self.options.dialogClass)
					.addClass(uiDialogClasses + value);
				break;
			case "disabled":
				if (value) {
					uiDialog.addClass('ui-dialog-disabled');
				} else {
					uiDialog.removeClass('ui-dialog-disabled');
				}
				break;
			case "draggable":
				if (value) {
					self._makeDraggable();
				} else {
					uiDialog.draggable('destroy');
				}
				break;
			case "height":
				resize = true;
				break;
			case "maxHeight":
				if (isResizable) {
					uiDialog.resizable('option', 'maxHeight', value);
				}
				resize = true;
				break;
			case "maxWidth":
				if (isResizable) {
					uiDialog.resizable('option', 'maxWidth', value);
				}
				resize = true;
				break;
			case "minHeight":
				if (isResizable) {
					uiDialog.resizable('option', 'minHeight', value);
				}
				resize = true;
				break;
			case "minWidth":
				if (isResizable) {
					uiDialog.resizable('option', 'minWidth', value);
				}
				resize = true;
				break;
			case "position":
				self._position(value);
				break;
			case "resizable":
				// currently resizable, becoming non-resizable
				if (isResizable && !value) {
					uiDialog.resizable('destroy');
				}

				// currently resizable, changing handles
				if (isResizable && typeof value === 'string') {
					uiDialog.resizable('option', 'handles', value);
				}

				// currently non-resizable, becoming resizable
				if (!isResizable && value !== false) {
					self._makeResizable(value);
				}
				break;
			case "title":
				// convert whatever was passed in o a string, for html() to not throw up
				$(".ui-dialog-title", self.uiDialogTitlebar).html("" + (value || '&#160;'));
				break;
			case "width":
				resize = true;
				break;
		}

		$.Widget.prototype._setOption.apply(self, arguments);
		if (resize) {
			self._size();
		}
	},

	_size: function() {
		/* If the user has resized the dialog, the .ui-dialog and .ui-dialog-content
		 * divs will both have width and height set, so we need to reset them
		 */
		var options = this.options,
			nonContentHeight;

		// reset content sizing
		// hide for non content measurement because height: 0 doesn't work in IE quirks mode (see #4350)
		this.element.css({
			width: 'auto',
			minHeight: 0,
			height: 0
		});

		if (options.minWidth > options.width) {
			options.width = options.minWidth;
		}

		// reset wrapper sizing
		// determine the height of all the non-content elements
		nonContentHeight = this.uiDialog.css({
				height: 'auto',
				width: options.width
			})
			.height();

		this.element
			.css(options.height === 'auto' ? {
					minHeight: Math.max(options.minHeight - nonContentHeight, 0),
					height: $.support.minHeight ? 'auto' :
						Math.max(options.minHeight - nonContentHeight, 0)
				} : {
					minHeight: 0,
					height: Math.max(options.height - nonContentHeight, 0)				
			})
			.show();

		if (this.uiDialog.is(':data(resizable)')) {
			this.uiDialog.resizable('option', 'minHeight', this._minHeight());
		}
	}
});

$.extend($.ui.dialog, {
	version: "1.8.5",

	uuid: 0,
	maxZ: 0,

	getTitleId: function($el) {
		var id = $el.attr('id');
		if (!id) {
			this.uuid += 1;
			id = this.uuid;
		}
		return 'ui-dialog-title-' + id;
	},

	overlay: function(dialog) {
		this.$el = $.ui.dialog.overlay.create(dialog);
	}
});

$.extend($.ui.dialog.overlay, {
	instances: [],
	// reuse old instances due to IE memory leak with alpha transparency (see #5185)
	oldInstances: [],
	maxZ: 0,
	events: $.map('focus,mousedown,mouseup,keydown,keypress,click'.split(','),
		function(event) { return event + '.dialog-overlay'; }).join(' '),
	create: function(dialog) {
		if (this.instances.length === 0) {
			// prevent use of anchors and inputs
			// we use a setTimeout in case the overlay is created from an
			// event that we're going to be cancelling (see #2804)
			setTimeout(function() {
				// handle $(el).dialog().dialog('close') (see #4065)
				if ($.ui.dialog.overlay.instances.length) {
					$(document).bind($.ui.dialog.overlay.events, function(event) {
						// stop events if the z-index of the target is < the z-index of the overlay
						// we cannot return true when we don't want to cancel the event (#3523)
						if ($(event.target).zIndex() < $.ui.dialog.overlay.maxZ) {
							return false;
						}
					});
				}
			}, 1);

			// allow closing by pressing the escape key
			$(document).bind('keydown.dialog-overlay', function(event) {
				if (dialog.options.closeOnEscape && event.keyCode &&
					event.keyCode === $.ui.keyCode.ESCAPE) {
					
					dialog.close(event);
					event.preventDefault();
				}
			});

			// handle window resize
			$(window).bind('resize.dialog-overlay', $.ui.dialog.overlay.resize);
		}

		var $el = (this.oldInstances.pop() || $('<div></div>').addClass('ui-widget-overlay'))
			.appendTo(document.body)
			.css({
				width: this.width(),
				height: this.height()
			});

		if ($.fn.bgiframe) {
			$el.bgiframe();
		}

		this.instances.push($el);
		return $el;
	},

	destroy: function($el) {
		this.oldInstances.push(this.instances.splice($.inArray($el, this.instances), 1)[0]);

		if (this.instances.length === 0) {
			$([document, window]).unbind('.dialog-overlay');
		}

		$el.remove();
		
		// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
		var maxZ = 0;
		$.each(this.instances, function() {
			maxZ = Math.max(maxZ, this.css('z-index'));
		});
		this.maxZ = maxZ;
	},

	height: function() {
		var scrollHeight,
			offsetHeight;
		// handle IE 6
		if ($.browser.msie && $.browser.version < 7) {
			scrollHeight = Math.max(
				document.documentElement.scrollHeight,
				document.body.scrollHeight
			);
			offsetHeight = Math.max(
				document.documentElement.offsetHeight,
				document.body.offsetHeight
			);

			if (scrollHeight < offsetHeight) {
				return $(window).height() + 'px';
			} else {
				return scrollHeight + 'px';
			}
		// handle "good" browsers
		} else {
			return $(document).height() + 'px';
		}
	},

	width: function() {
		var scrollWidth,
			offsetWidth;
		// handle IE 6
		if ($.browser.msie && $.browser.version < 7) {
			scrollWidth = Math.max(
				document.documentElement.scrollWidth,
				document.body.scrollWidth
			);
			offsetWidth = Math.max(
				document.documentElement.offsetWidth,
				document.body.offsetWidth
			);

			if (scrollWidth < offsetWidth) {
				return $(window).width() + 'px';
			} else {
				return scrollWidth + 'px';
			}
		// handle "good" browsers
		} else {
			return $(document).width() + 'px';
		}
	},

	resize: function() {
		/* If the dialog is draggable and the user drags it past the
		 * right edge of the window, the document becomes wider so we
		 * need to stretch the overlay. If the user then drags the
		 * dialog back to the left, the document will become narrower,
		 * so we need to shrink the overlay to the appropriate size.
		 * This is handled by shrinking the overlay before setting it
		 * to the full document size.
		 */
		var $overlays = $([]);
		$.each($.ui.dialog.overlay.instances, function() {
			$overlays = $overlays.add(this);
		});

		$overlays.css({
			width: 0,
			height: 0
		}).css({
			width: $.ui.dialog.overlay.width(),
			height: $.ui.dialog.overlay.height()
		});
	}
});

$.extend($.ui.dialog.overlay.prototype, {
	destroy: function() {
		$.ui.dialog.overlay.destroy(this.$el);
	}
});

}(jQuery));
/*
 * jQuery UI Tabs 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Tabs
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

var tabId = 0,
	listId = 0;

function getNextTabId() {
	return ++tabId;
}

function getNextListId() {
	return ++listId;
}

$.widget( "ui.tabs", {
	options: {
		add: null,
		ajaxOptions: null,
		cache: false,
		cookie: null, // e.g. { expires: 7, path: '/', domain: 'jquery.com', secure: true }
		collapsible: false,
		disable: null,
		disabled: [],
		enable: null,
		event: "click",
		fx: null, // e.g. { height: 'toggle', opacity: 'toggle', duration: 200 }
		idPrefix: "ui-tabs-",
		load: null,
		panelTemplate: "<div></div>",
		remove: null,
		select: null,
		show: null,
		spinner: "<em>Loading&#8230;</em>",
		tabTemplate: "<li><a href='#{href}'><span>#{label}</span></a></li>"
	},

	_create: function() {
		this._tabify( true );
	},

	_setOption: function( key, value ) {
		if ( key == "selected" ) {
			if (this.options.collapsible && value == this.options.selected ) {
				return;
			}
			this.select( value );
		} else {
			this.options[ key ] = value;
			this._tabify();
		}
	},

	_tabId: function( a ) {
		return a.title && a.title.replace( /\s/g, "_" ).replace( /[^\w\u00c0-\uFFFF-]/g, "" ) ||
			this.options.idPrefix + getNextTabId();
	},

	_sanitizeSelector: function( hash ) {
		// we need this because an id may contain a ":"
		return hash.replace( /:/g, "\\:" );
	},

	_cookie: function() {
		var cookie = this.cookie ||
			( this.cookie = this.options.cookie.name || "ui-tabs-" + getNextListId() );
		return $.cookie.apply( null, [ cookie ].concat( $.makeArray( arguments ) ) );
	},

	_ui: function( tab, panel ) {
		return {
			tab: tab,
			panel: panel,
			index: this.anchors.index( tab )
		};
	},

	_cleanup: function() {
		// restore all former loading tabs labels
		this.lis.filter( ".ui-state-processing" )
			.removeClass( "ui-state-processing" )
			.find( "span:data(label.tabs)" )
				.each(function() {
					var el = $( this );
					el.html( el.data( "label.tabs" ) ).removeData( "label.tabs" );
				});
	},

	_tabify: function( init ) {
		var self = this,
			o = this.options,
			fragmentId = /^#.+/; // Safari 2 reports '#' for an empty hash

		this.list = this.element.find( "ol,ul" ).eq( 0 );
		this.lis = $( " > li:has(a[href])", this.list );
		this.anchors = this.lis.map(function() {
			return $( "a", this )[ 0 ];
		});
		this.panels = $( [] );

		this.anchors.each(function( i, a ) {
			var href = $( a ).attr( "href" );
			// For dynamically created HTML that contains a hash as href IE < 8 expands
			// such href to the full page url with hash and then misinterprets tab as ajax.
			// Same consideration applies for an added tab with a fragment identifier
			// since a[href=#fragment-identifier] does unexpectedly not match.
			// Thus normalize href attribute...
			var hrefBase = href.split( "#" )[ 0 ],
				baseEl;
			if ( hrefBase && ( hrefBase === location.toString().split( "#" )[ 0 ] ||
					( baseEl = $( "base" )[ 0 ]) && hrefBase === baseEl.href ) ) {
				href = a.hash;
				a.href = href;
			}

			// inline tab
			if ( fragmentId.test( href ) ) {
				self.panels = self.panels.add( self._sanitizeSelector( href ) );
			// remote tab
			// prevent loading the page itself if href is just "#"
			} else if ( href && href !== "#" ) {
				// required for restore on destroy
				$.data( a, "href.tabs", href );

				// TODO until #3808 is fixed strip fragment identifier from url
				// (IE fails to load from such url)
				$.data( a, "load.tabs", href.replace( /#.*$/, "" ) );

				var id = self._tabId( a );
				a.href = "#" + id;
				var $panel = $( "#" + id );
				if ( !$panel.length ) {
					$panel = $( o.panelTemplate )
						.attr( "id", id )
						.addClass( "ui-tabs-panel ui-widget-content ui-corner-bottom" )
						.insertAfter( self.panels[ i - 1 ] || self.list );
					$panel.data( "destroy.tabs", true );
				}
				self.panels = self.panels.add( $panel );
			// invalid tab href
			} else {
				o.disabled.push( i );
			}
		});

		// initialization from scratch
		if ( init ) {
			// attach necessary classes for styling
			this.element.addClass( "ui-tabs ui-widget ui-widget-content ui-corner-all" );
			this.list.addClass( "ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" );
			this.lis.addClass( "ui-state-default ui-corner-top" );
			this.panels.addClass( "ui-tabs-panel ui-widget-content ui-corner-bottom" );

			// Selected tab
			// use "selected" option or try to retrieve:
			// 1. from fragment identifier in url
			// 2. from cookie
			// 3. from selected class attribute on <li>
			if ( o.selected === undefined ) {
				if ( location.hash ) {
					this.anchors.each(function( i, a ) {
						if ( a.hash == location.hash ) {
							o.selected = i;
							return false;
						}
					});
				}
				if ( typeof o.selected !== "number" && o.cookie ) {
					o.selected = parseInt( self._cookie(), 10 );
				}
				if ( typeof o.selected !== "number" && this.lis.filter( ".ui-tabs-selected" ).length ) {
					o.selected = this.lis.index( this.lis.filter( ".ui-tabs-selected" ) );
				}
				o.selected = o.selected || ( this.lis.length ? 0 : -1 );
			} else if ( o.selected === null ) { // usage of null is deprecated, TODO remove in next release
				o.selected = -1;
			}

			// sanity check - default to first tab...
			o.selected = ( ( o.selected >= 0 && this.anchors[ o.selected ] ) || o.selected < 0 )
				? o.selected
				: 0;

			// Take disabling tabs via class attribute from HTML
			// into account and update option properly.
			// A selected tab cannot become disabled.
			o.disabled = $.unique( o.disabled.concat(
				$.map( this.lis.filter( ".ui-state-disabled" ), function( n, i ) {
					return self.lis.index( n );
				})
			) ).sort();

			if ( $.inArray( o.selected, o.disabled ) != -1 ) {
				o.disabled.splice( $.inArray( o.selected, o.disabled ), 1 );
			}

			// highlight selected tab
			this.panels.addClass( "ui-tabs-hide" );
			this.lis.removeClass( "ui-tabs-selected ui-state-active" );
			// check for length avoids error when initializing empty list
			if ( o.selected >= 0 && this.anchors.length ) {
				this.panels.eq( o.selected ).removeClass( "ui-tabs-hide" );
				this.lis.eq( o.selected ).addClass( "ui-tabs-selected ui-state-active" );

				// seems to be expected behavior that the show callback is fired
				self.element.queue( "tabs", function() {
					self._trigger( "show", null,
						self._ui( self.anchors[ o.selected ], self.panels[ o.selected ] ) );
				});

				this.load( o.selected );
			}

			// clean up to avoid memory leaks in certain versions of IE 6
			// TODO: namespace this event
			$( window ).bind( "unload", function() {
				self.lis.add( self.anchors ).unbind( ".tabs" );
				self.lis = self.anchors = self.panels = null;
			});
		// update selected after add/remove
		} else {
			o.selected = this.lis.index( this.lis.filter( ".ui-tabs-selected" ) );
		}

		// update collapsible
		// TODO: use .toggleClass()
		this.element[ o.collapsible ? "addClass" : "removeClass" ]( "ui-tabs-collapsible" );

		// set or update cookie after init and add/remove respectively
		if ( o.cookie ) {
			this._cookie( o.selected, o.cookie );
		}

		// disable tabs
		for ( var i = 0, li; ( li = this.lis[ i ] ); i++ ) {
			$( li )[ $.inArray( i, o.disabled ) != -1 &&
				// TODO: use .toggleClass()
				!$( li ).hasClass( "ui-tabs-selected" ) ? "addClass" : "removeClass" ]( "ui-state-disabled" );
		}

		// reset cache if switching from cached to not cached
		if ( o.cache === false ) {
			this.anchors.removeData( "cache.tabs" );
		}

		// remove all handlers before, tabify may run on existing tabs after add or option change
		this.lis.add( this.anchors ).unbind( ".tabs" );

		if ( o.event !== "mouseover" ) {
			var addState = function( state, el ) {
				if ( el.is( ":not(.ui-state-disabled)" ) ) {
					el.addClass( "ui-state-" + state );
				}
			};
			var removeState = function( state, el ) {
				el.removeClass( "ui-state-" + state );
			};
			this.lis.bind( "mouseover.tabs" , function() {
				addState( "hover", $( this ) );
			});
			this.lis.bind( "mouseout.tabs", function() {
				removeState( "hover", $( this ) );
			});
			this.anchors.bind( "focus.tabs", function() {
				addState( "focus", $( this ).closest( "li" ) );
			});
			this.anchors.bind( "blur.tabs", function() {
				removeState( "focus", $( this ).closest( "li" ) );
			});
		}

		// set up animations
		var hideFx, showFx;
		if ( o.fx ) {
			if ( $.isArray( o.fx ) ) {
				hideFx = o.fx[ 0 ];
				showFx = o.fx[ 1 ];
			} else {
				hideFx = showFx = o.fx;
			}
		}

		// Reset certain styles left over from animation
		// and prevent IE's ClearType bug...
		function resetStyle( $el, fx ) {
			$el.css( "display", "" );
			if ( !$.support.opacity && fx.opacity ) {
				$el[ 0 ].style.removeAttribute( "filter" );
			}
		}

		// Show a tab...
		var showTab = showFx
			? function( clicked, $show ) {
				$( clicked ).closest( "li" ).addClass( "ui-tabs-selected ui-state-active" );
				$show.hide().removeClass( "ui-tabs-hide" ) // avoid flicker that way
					.animate( showFx, showFx.duration || "normal", function() {
						resetStyle( $show, showFx );
						self._trigger( "show", null, self._ui( clicked, $show[ 0 ] ) );
					});
			}
			: function( clicked, $show ) {
				$( clicked ).closest( "li" ).addClass( "ui-tabs-selected ui-state-active" );
				$show.removeClass( "ui-tabs-hide" );
				self._trigger( "show", null, self._ui( clicked, $show[ 0 ] ) );
			};

		// Hide a tab, $show is optional...
		var hideTab = hideFx
			? function( clicked, $hide ) {
				$hide.animate( hideFx, hideFx.duration || "normal", function() {
					self.lis.removeClass( "ui-tabs-selected ui-state-active" );
					$hide.addClass( "ui-tabs-hide" );
					resetStyle( $hide, hideFx );
					self.element.dequeue( "tabs" );
				});
			}
			: function( clicked, $hide, $show ) {
				self.lis.removeClass( "ui-tabs-selected ui-state-active" );
				$hide.addClass( "ui-tabs-hide" );
				self.element.dequeue( "tabs" );
			};

		// attach tab event handler, unbind to avoid duplicates from former tabifying...
		this.anchors.bind( o.event + ".tabs", function() {
			var el = this,
				$li = $(el).closest( "li" ),
				$hide = self.panels.filter( ":not(.ui-tabs-hide)" ),
				$show = $( self._sanitizeSelector( el.hash ) );

			// If tab is already selected and not collapsible or tab disabled or
			// or is already loading or click callback returns false stop here.
			// Check if click handler returns false last so that it is not executed
			// for a disabled or loading tab!
			if ( ( $li.hasClass( "ui-tabs-selected" ) && !o.collapsible) ||
				$li.hasClass( "ui-state-disabled" ) ||
				$li.hasClass( "ui-state-processing" ) ||
				self.panels.filter( ":animated" ).length ||
				self._trigger( "select", null, self._ui( this, $show[ 0 ] ) ) === false ) {
				this.blur();
				return false;
			}

			o.selected = self.anchors.index( this );

			self.abort();

			// if tab may be closed
			if ( o.collapsible ) {
				if ( $li.hasClass( "ui-tabs-selected" ) ) {
					o.selected = -1;

					if ( o.cookie ) {
						self._cookie( o.selected, o.cookie );
					}

					self.element.queue( "tabs", function() {
						hideTab( el, $hide );
					}).dequeue( "tabs" );

					this.blur();
					return false;
				} else if ( !$hide.length ) {
					if ( o.cookie ) {
						self._cookie( o.selected, o.cookie );
					}

					self.element.queue( "tabs", function() {
						showTab( el, $show );
					});

					// TODO make passing in node possible, see also http://dev.jqueryui.com/ticket/3171
					self.load( self.anchors.index( this ) );

					this.blur();
					return false;
				}
			}

			if ( o.cookie ) {
				self._cookie( o.selected, o.cookie );
			}

			// show new tab
			if ( $show.length ) {
				if ( $hide.length ) {
					self.element.queue( "tabs", function() {
						hideTab( el, $hide );
					});
				}
				self.element.queue( "tabs", function() {
					showTab( el, $show );
				});

				self.load( self.anchors.index( this ) );
			} else {
				throw "jQuery UI Tabs: Mismatching fragment identifier.";
			}

			// Prevent IE from keeping other link focussed when using the back button
			// and remove dotted border from clicked link. This is controlled via CSS
			// in modern browsers; blur() removes focus from address bar in Firefox
			// which can become a usability and annoying problem with tabs('rotate').
			if ( $.browser.msie ) {
				this.blur();
			}
		});

		// disable click in any case
		this.anchors.bind( "click.tabs", function(){
			return false;
		});
	},

    _getIndex: function( index ) {
		// meta-function to give users option to provide a href string instead of a numerical index.
		// also sanitizes numerical indexes to valid values.
		if ( typeof index == "string" ) {
			index = this.anchors.index( this.anchors.filter( "[href$=" + index + "]" ) );
		}

		return index;
	},

	destroy: function() {
		var o = this.options;

		this.abort();

		this.element
			.unbind( ".tabs" )
			.removeClass( "ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible" )
			.removeData( "tabs" );

		this.list.removeClass( "ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" );

		this.anchors.each(function() {
			var href = $.data( this, "href.tabs" );
			if ( href ) {
				this.href = href;
			}
			var $this = $( this ).unbind( ".tabs" );
			$.each( [ "href", "load", "cache" ], function( i, prefix ) {
				$this.removeData( prefix + ".tabs" );
			});
		});

		this.lis.unbind( ".tabs" ).add( this.panels ).each(function() {
			if ( $.data( this, "destroy.tabs" ) ) {
				$( this ).remove();
			} else {
				$( this ).removeClass([
					"ui-state-default",
					"ui-corner-top",
					"ui-tabs-selected",
					"ui-state-active",
					"ui-state-hover",
					"ui-state-focus",
					"ui-state-disabled",
					"ui-tabs-panel",
					"ui-widget-content",
					"ui-corner-bottom",
					"ui-tabs-hide"
				].join( " " ) );
			}
		});

		if ( o.cookie ) {
			this._cookie( null, o.cookie );
		}

		return this;
	},

	add: function( url, label, index ) {
		if ( index === undefined ) {
			index = this.anchors.length;
		}

		var self = this,
			o = this.options,
			$li = $( o.tabTemplate.replace( /#\{href\}/g, url ).replace( /#\{label\}/g, label ) ),
			id = !url.indexOf( "#" ) ? url.replace( "#", "" ) : this._tabId( $( "a", $li )[ 0 ] );

		$li.addClass( "ui-state-default ui-corner-top" ).data( "destroy.tabs", true );

		// try to find an existing element before creating a new one
		var $panel = $( "#" + id );
		if ( !$panel.length ) {
			$panel = $( o.panelTemplate )
				.attr( "id", id )
				.data( "destroy.tabs", true );
		}
		$panel.addClass( "ui-tabs-panel ui-widget-content ui-corner-bottom ui-tabs-hide" );

		if ( index >= this.lis.length ) {
			$li.appendTo( this.list );
			$panel.appendTo( this.list[ 0 ].parentNode );
		} else {
			$li.insertBefore( this.lis[ index ] );
			$panel.insertBefore( this.panels[ index ] );
		}

		o.disabled = $.map( o.disabled, function( n, i ) {
			return n >= index ? ++n : n;
		});

		this._tabify();

		if ( this.anchors.length == 1 ) {
			o.selected = 0;
			$li.addClass( "ui-tabs-selected ui-state-active" );
			$panel.removeClass( "ui-tabs-hide" );
			this.element.queue( "tabs", function() {
				self._trigger( "show", null, self._ui( self.anchors[ 0 ], self.panels[ 0 ] ) );
			});

			this.load( 0 );
		}

		this._trigger( "add", null, this._ui( this.anchors[ index ], this.panels[ index ] ) );
		return this;
	},

	remove: function( index ) {
		index = this._getIndex( index );
		var o = this.options,
			$li = this.lis.eq( index ).remove(),
			$panel = this.panels.eq( index ).remove();

		// If selected tab was removed focus tab to the right or
		// in case the last tab was removed the tab to the left.
		if ( $li.hasClass( "ui-tabs-selected" ) && this.anchors.length > 1) {
			this.select( index + ( index + 1 < this.anchors.length ? 1 : -1 ) );
		}

		o.disabled = $.map(
			$.grep( o.disabled, function(n, i) {
				return n != index;
			}),
			function( n, i ) {
				return n >= index ? --n : n;
			});

		this._tabify();

		this._trigger( "remove", null, this._ui( $li.find( "a" )[ 0 ], $panel[ 0 ] ) );
		return this;
	},

	enable: function( index ) {
		index = this._getIndex( index );
		var o = this.options;
		if ( $.inArray( index, o.disabled ) == -1 ) {
			return;
		}

		this.lis.eq( index ).removeClass( "ui-state-disabled" );
		o.disabled = $.grep( o.disabled, function( n, i ) {
			return n != index;
		});

		this._trigger( "enable", null, this._ui( this.anchors[ index ], this.panels[ index ] ) );
		return this;
	},

	disable: function( index ) {
		index = this._getIndex( index );
		var self = this, o = this.options;
		// cannot disable already selected tab
		if ( index != o.selected ) {
			this.lis.eq( index ).addClass( "ui-state-disabled" );

			o.disabled.push( index );
			o.disabled.sort();

			this._trigger( "disable", null, this._ui( this.anchors[ index ], this.panels[ index ] ) );
		}

		return this;
	},

	select: function( index ) {
		index = this._getIndex( index );
		if ( index == -1 ) {
			if ( this.options.collapsible && this.options.selected != -1 ) {
				index = this.options.selected;
			} else {
				return this;
			}
		}
		this.anchors.eq( index ).trigger( this.options.event + ".tabs" );
		return this;
	},

	load: function( index ) {
		index = this._getIndex( index );
		var self = this,
			o = this.options,
			a = this.anchors.eq( index )[ 0 ],
			url = $.data( a, "load.tabs" );

		this.abort();

		// not remote or from cache
		if ( !url || this.element.queue( "tabs" ).length !== 0 && $.data( a, "cache.tabs" ) ) {
			this.element.dequeue( "tabs" );
			return;
		}

		// load remote from here on
		this.lis.eq( index ).addClass( "ui-state-processing" );

		if ( o.spinner ) {
			var span = $( "span", a );
			span.data( "label.tabs", span.html() ).html( o.spinner );
		}

		this.xhr = $.ajax( $.extend( {}, o.ajaxOptions, {
			url: url,
			success: function( r, s ) {
				$( self._sanitizeSelector( a.hash ) ).html( r );

				// take care of tab labels
				self._cleanup();

				if ( o.cache ) {
					$.data( a, "cache.tabs", true );
				}

				self._trigger( "load", null, self._ui( self.anchors[ index ], self.panels[ index ] ) );
				try {
					o.ajaxOptions.success( r, s );
				}
				catch ( e ) {}
			},
			error: function( xhr, s, e ) {
				// take care of tab labels
				self._cleanup();

				self._trigger( "load", null, self._ui( self.anchors[ index ], self.panels[ index ] ) );
				try {
					// Passing index avoid a race condition when this method is
					// called after the user has selected another tab.
					// Pass the anchor that initiated this request allows
					// loadError to manipulate the tab content panel via $(a.hash)
					o.ajaxOptions.error( xhr, s, index, a );
				}
				catch ( e ) {}
			}
		} ) );

		// last, so that load event is fired before show...
		self.element.dequeue( "tabs" );

		return this;
	},

	abort: function() {
		// stop possibly running animations
		this.element.queue( [] );
		this.panels.stop( false, true );

		// "tabs" queue must not contain more than two elements,
		// which are the callbacks for the latest clicked tab...
		this.element.queue( "tabs", this.element.queue( "tabs" ).splice( -2, 2 ) );

		// terminate pending requests from other tabs
		if ( this.xhr ) {
			this.xhr.abort();
			delete this.xhr;
		}

		// take care of tab labels
		this._cleanup();
		return this;
	},

	url: function( index, url ) {
		this.anchors.eq( index ).removeData( "cache.tabs" ).data( "load.tabs", url );
		return this;
	},

	length: function() {
		return this.anchors.length;
	}
});

$.extend( $.ui.tabs, {
	version: "1.8.5"
});

/*
 * Tabs Extensions
 */

/*
 * Rotate
 */
$.extend( $.ui.tabs.prototype, {
	rotation: null,
	rotate: function( ms, continuing ) {
		var self = this,
			o = this.options;

		var rotate = self._rotate || ( self._rotate = function( e ) {
			clearTimeout( self.rotation );
			self.rotation = setTimeout(function() {
				var t = o.selected;
				self.select( ++t < self.anchors.length ? t : 0 );
			}, ms );
			
			if ( e ) {
				e.stopPropagation();
			}
		});

		var stop = self._unrotate || ( self._unrotate = !continuing
			? function(e) {
				if (e.clientX) { // in case of a true click
					self.rotate(null);
				}
			}
			: function( e ) {
				t = o.selected;
				rotate();
			});

		// start rotation
		if ( ms ) {
			this.element.bind( "tabsshow", rotate );
			this.anchors.bind( o.event + ".tabs", stop );
			rotate();
		// stop rotation
		} else {
			clearTimeout( self.rotation );
			this.element.unbind( "tabsshow", rotate );
			this.anchors.unbind( o.event + ".tabs", stop );
			delete this._rotate;
			delete this._unrotate;
		}

		return this;
	}
});

})( jQuery );
/*
 * jQuery UI Progressbar 1.8.5
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Progressbar
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
(function( $, undefined ) {

$.widget( "ui.progressbar", {
	options: {
		value: 0
	},

	min: 0,
	max: 100,

	_create: function() {
		this.element
			.addClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
			.attr({
				role: "progressbar",
				"aria-valuemin": this.min,
				"aria-valuemax": this.max,
				"aria-valuenow": this._value()
			});

		this.valueDiv = $( "<div class='ui-progressbar-value ui-widget-header ui-corner-left'></div>" )
			.appendTo( this.element );

		this._refreshValue();
	},

	destroy: function() {
		this.element
			.removeClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
			.removeAttr( "role" )
			.removeAttr( "aria-valuemin" )
			.removeAttr( "aria-valuemax" )
			.removeAttr( "aria-valuenow" );

		this.valueDiv.remove();

		$.Widget.prototype.destroy.apply( this, arguments );
	},

	value: function( newValue ) {
		if ( newValue === undefined ) {
			return this._value();
		}

		this._setOption( "value", newValue );
		return this;
	},

	_setOption: function( key, value ) {
		if ( key === "value" ) {
			this.options.value = value;
			this._refreshValue();
			this._trigger( "change" );
		}

		$.Widget.prototype._setOption.apply( this, arguments );
	},

	_value: function() {
		var val = this.options.value;
		// normalize invalid value
		if ( typeof val !== "number" ) {
			val = 0;
		}
		return Math.min( this.max, Math.max( this.min, val ) );
	},

	_refreshValue: function() {
		var value = this.value();
		this.valueDiv
			.toggleClass( "ui-corner-right", value === this.max )
			.width( value + "%" );
		this.element.attr( "aria-valuenow", value );
	}
});

$.extend( $.ui.progressbar, {
	version: "1.8.5"
});

})( jQuery );
/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};require.module('bolo/client/index', function(module, exports, require) {
(function() {
  var BoloLocalWorld, BoloNetworkWorld;
  BoloLocalWorld = require('./world/local');
  BoloNetworkWorld = require('./world/client');
  if (location.search === '?local' || location.hostname.split('.')[1] === 'github') {
    module.exports = BoloLocalWorld;
  } else {
    module.exports = BoloNetworkWorld;
  }
}).call(this);

});
require.module('bolo/client/world/local', function(module, exports, require) {
(function() {
  var BoloLocalWorld, EverardIsland, NetLocalWorld, Tank, WorldMap, allObjects, decodeBase64, helpers;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  NetLocalWorld = require('villain/world/net/local');
  WorldMap = require('../../world_map');
  EverardIsland = require('../everard');
  allObjects = require('../../objects/all');
  Tank = require('../../objects/tank');
  decodeBase64 = require('../base64').decodeBase64;
  helpers = require('../../helpers');
  BoloLocalWorld = function() {
    function BoloLocalWorld() {
      BoloLocalWorld.__super__.constructor.apply(this, arguments);
    }
    __extends(BoloLocalWorld, NetLocalWorld);
    BoloLocalWorld.prototype.authority = true;
    BoloLocalWorld.prototype.loaded = function(vignette) {
      this.map = WorldMap.load(decodeBase64(EverardIsland));
      this.commonInitialization();
      this.spawnMapObjects();
      this.player = this.spawn(Tank, 0);
      this.renderer.initHud();
      vignette.destroy();
      return this.loop.start();
    };
    BoloLocalWorld.prototype.tick = function() {
      BoloLocalWorld.__super__.tick.apply(this, arguments);
      if (this.increasingRange !== this.decreasingRange) {
        if (++this.rangeAdjustTimer === 6) {
          if (this.increasingRange) {
            this.player.increaseRange();
          } else {
            this.player.decreaseRange();
          }
          return this.rangeAdjustTimer = 0;
        }
      } else {
        return this.rangeAdjustTimer = 0;
      }
    };
    BoloLocalWorld.prototype.soundEffect = function(sfx, x, y, owner) {
      return this.renderer.playSound(sfx, x, y, owner);
    };
    BoloLocalWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {};
    BoloLocalWorld.prototype.handleKeydown = function(e) {
      switch (e.which) {
        case 32:
          return this.player.shooting = true;
        case 37:
          return this.player.turningCounterClockwise = true;
        case 38:
          return this.player.accelerating = true;
        case 39:
          return this.player.turningClockwise = true;
        case 40:
          return this.player.braking = true;
      }
    };
    BoloLocalWorld.prototype.handleKeyup = function(e) {
      switch (e.which) {
        case 32:
          return this.player.shooting = false;
        case 37:
          return this.player.turningCounterClockwise = false;
        case 38:
          return this.player.accelerating = false;
        case 39:
          return this.player.turningClockwise = false;
        case 40:
          return this.player.braking = false;
      }
    };
    BoloLocalWorld.prototype.buildOrder = function(action, trees, cell) {
      return this.player.builder.$.performOrder(action, trees, cell);
    };
    return BoloLocalWorld;
  }();
  helpers.extend(BoloLocalWorld.prototype, require('./mixin'));
  allObjects.registerWithWorld(BoloLocalWorld.prototype);
  module.exports = BoloLocalWorld;
}).call(this);

});
require.module('villain/world/net/local', function(module, exports, require) {
(function() {
  var BaseWorld, NetLocalWorld;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice;
  BaseWorld = require('../base');
  NetLocalWorld = function() {
    function NetLocalWorld() {
      NetLocalWorld.__super__.constructor.apply(this, arguments);
    }
    __extends(NetLocalWorld, BaseWorld);
    NetLocalWorld.prototype.spawn = function() {
      var args, obj, type;
      type = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      obj = this.insert(new type(this));
      obj.spawn.apply(obj, args);
      obj.anySpawn();
      return obj;
    };
    NetLocalWorld.prototype.update = function(obj) {
      obj.update();
      obj.emit('update');
      obj.emit('anyUpdate');
      return obj;
    };
    NetLocalWorld.prototype.destroy = function(obj) {
      obj.destroy();
      obj.emit('destroy');
      obj.emit('finalize');
      this.remove(obj);
      return obj;
    };
    return NetLocalWorld;
  }();
  module.exports = NetLocalWorld;
}).call(this);

});
require.module('villain/world/base', function(module, exports, require) {
(function() {
  var BaseWorld;
  var __slice = Array.prototype.slice;
  BaseWorld = function() {
    function BaseWorld() {
      this.objects = [];
    }
    BaseWorld.prototype.tick = function() {
      var obj, _i, _len, _ref;
      _ref = this.objects.slice(0);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        this.update(obj);
      }
      return;
    };
    BaseWorld.prototype.insert = function(obj) {
      var i, other, _len, _ref, _ref2;
      _ref = this.objects;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        other = _ref[i];
        if (obj.updatePriority > other.updatePriority) {
          break;
        }
      }
      this.objects.splice(i, 0, obj);
      for (i = i, _ref2 = this.objects.length; (i <= _ref2 ? i < _ref2 : i > _ref2); (i <= _ref2 ? i += 1 : i -= 1)) {
        this.objects[i].idx = i;
      }
      return obj;
    };
    BaseWorld.prototype.remove = function(obj) {
      var i, _ref, _ref2;
      this.objects.splice(obj.idx, 1);
      for (i = _ref = obj.idx, _ref2 = this.objects.length; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
        this.objects[i].idx = i;
      }
      obj.idx = null;
      return obj;
    };
    BaseWorld.prototype.registerType = function(type) {};
    BaseWorld.prototype.spawn = function() {
      var args, type;
      type = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    };
    BaseWorld.prototype.update = function(obj) {};
    BaseWorld.prototype.destroy = function(obj) {};
    return BaseWorld;
  }();
  module.exports = BaseWorld;
}).call(this);

});
require.module('bolo/world_map', function(module, exports, require) {
(function() {
  var FloodFill, Map, TERRAIN_TYPES, TERRAIN_TYPE_ATTRIBUTES, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, WorldBase, WorldMap, WorldMapCell, WorldPillbox, extendTerrainMap, floor, net, random, round, sounds, _ref, _ref2;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, random = Math.random, floor = Math.floor;
  _ref = require('./constants'), TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS;
  _ref2 = require('./map'), Map = _ref2.Map, TERRAIN_TYPES = _ref2.TERRAIN_TYPES;
  net = require('./net');
  sounds = require('./sounds');
  WorldPillbox = require('./objects/world_pillbox');
  WorldBase = require('./objects/world_base');
  FloodFill = require('./objects/flood_fill');
  TERRAIN_TYPE_ATTRIBUTES = {
    '|': {
      tankSpeed: 0,
      tankTurn: 0.00,
      manSpeed: 0
    },
    ' ': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 0
    },
    '~': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 4
    },
    '%': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 4
    },
    '=': {
      tankSpeed: 16,
      tankTurn: 1.00,
      manSpeed: 16
    },
    '#': {
      tankSpeed: 6,
      tankTurn: 0.50,
      manSpeed: 8
    },
    ':': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 4
    },
    '.': {
      tankSpeed: 12,
      tankTurn: 1.00,
      manSpeed: 16
    },
    '}': {
      tankSpeed: 0,
      tankTurn: 0.00,
      manSpeed: 0
    },
    'b': {
      tankSpeed: 16,
      tankTurn: 1.00,
      manSpeed: 16
    },
    '^': {
      tankSpeed: 3,
      tankTurn: 0.50,
      manSpeed: 0
    }
  };
  extendTerrainMap = function() {
    var ascii, attributes, key, type, value, _results, _results2;
    _results = [];
    for (ascii in TERRAIN_TYPE_ATTRIBUTES) {
      if (!__hasProp.call(TERRAIN_TYPE_ATTRIBUTES, ascii)) continue;
      attributes = TERRAIN_TYPE_ATTRIBUTES[ascii];
      type = TERRAIN_TYPES[ascii];
      _results.push(function() {
        _results2 = [];
        for (key in attributes) {
          if (!__hasProp.call(attributes, key)) continue;
          value = attributes[key];
          _results2.push(type[key] = value);
        }
        return _results2;
      }());
    }
    return _results;
  };
  extendTerrainMap();
  WorldMapCell = function() {
    function WorldMapCell(map, x, y) {
      WorldMapCell.__super__.constructor.apply(this, arguments);
      this.life = 0;
    }
    __extends(WorldMapCell, Map.prototype.CellClass);
    WorldMapCell.prototype.isObstacle = function() {
      var _ref;
      return ((_ref = this.pill) != null ? _ref.armour : void 0) > 0 || this.type.tankSpeed === 0;
    };
    WorldMapCell.prototype.hasTankOnBoat = function() {
      var tank, _i, _len, _ref;
      _ref = this.map.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.armour !== 255 && tank.cell === this) {
          if (tank.onBoat) {
            return true;
          }
        }
      }
      return false;
    };
    WorldMapCell.prototype.getTankSpeed = function(tank) {
      var _ref, _ref2;
      if (((_ref = this.pill) != null ? _ref.armour : void 0) > 0) {
        return 0;
      }
      if ((_ref2 = this.base) != null ? _ref2.owner : void 0) {
        if (!(this.base.owner.$.isAlly(tank) || this.base.armour <= 9)) {
          return 0;
        }
      }
      if (tank.onBoat && this.isType('^', ' ')) {
        return 16;
      }
      return this.type.tankSpeed;
    };
    WorldMapCell.prototype.getTankTurn = function(tank) {
      var _ref, _ref2;
      if (((_ref = this.pill) != null ? _ref.armour : void 0) > 0) {
        return 0.00;
      }
      if ((_ref2 = this.base) != null ? _ref2.owner : void 0) {
        if (!(this.base.owner.$.isAlly(tank) || this.base.armour <= 9)) {
          return 0.00;
        }
      }
      if (tank.onBoat && this.isType('^', ' ')) {
        return 1.00;
      }
      return this.type.tankTurn;
    };
    WorldMapCell.prototype.getManSpeed = function(man) {
      var tank, _ref, _ref2;
      tank = man.owner.$;
      if (((_ref = this.pill) != null ? _ref.armour : void 0) > 0) {
        return 0;
      }
      if (((_ref2 = this.base) != null ? _ref2.owner : void 0) != null) {
        if (!(this.base.owner.$.isAlly(tank) || this.base.armour <= 9)) {
          return 0;
        }
      }
      return this.type.manSpeed;
    };
    WorldMapCell.prototype.getPixelCoordinates = function() {
      return [(this.x + 0.5) * TILE_SIZE_PIXELS, (this.y + 0.5) * TILE_SIZE_PIXELS];
    };
    WorldMapCell.prototype.getWorldCoordinates = function() {
      return [(this.x + 0.5) * TILE_SIZE_WORLD, (this.y + 0.5) * TILE_SIZE_WORLD];
    };
    WorldMapCell.prototype.setType = function(newType, mine, retileRadius) {
      var hadMine, oldLife, oldType, _ref, _ref2;
      _ref = [this.type, this.mine, this.life], oldType = _ref[0], hadMine = _ref[1], oldLife = _ref[2];
      WorldMapCell.__super__.setType.apply(this, arguments);
      this.life = function() {
        switch (this.type.ascii) {
          case '.':
            return 5;
          case '}':
            return 5;
          case ':':
            return 5;
          case '~':
            return 4;
          default:
            return 0;
        }
      }.call(this);
      return (_ref2 = this.map.world) != null ? _ref2.mapChanged(this, oldType, hadMine, oldLife) : void 0;
    };
    WorldMapCell.prototype.takeShellHit = function(shell) {
      var neigh, nextType, sfx, _ref, _ref2;
      sfx = sounds.SHOT_BUILDING;
      if (this.isType('.', '}', ':', '~')) {
        if (--this.life === 0) {
          nextType = function() {
            switch (this.type.ascii) {
              case '.':
                return '~';
              case '}':
                return ':';
              case ':':
                return ' ';
              case '~':
                return ' ';
            }
          }.call(this);
          this.setType(nextType);
        } else {
          if ((_ref = this.map.world) != null) {
            _ref.mapChanged(this, this.type, this.mine);
          }
        }
      } else if (this.isType('#')) {
        this.setType('.');
        sfx = sounds.SHOT_TREE;
      } else if (this.isType('=')) {
        neigh = shell.direction >= 224 || shell.direction < 32 ? this.neigh(1, 0) : shell.direction >= 32 && shell.direction < 96 ? this.neigh(0, -1) : shell.direction >= 96 && shell.direction < 160 ? this.neigh(-1, 0) : this.neigh(0, 1);
        if (neigh.isType(' ', '^')) {
          this.setType(' ');
        }
      } else {
        nextType = function() {
          switch (this.type.ascii) {
            case '|':
              return '}';
            case 'b':
              return ' ';
          }
        }.call(this);
        this.setType(nextType);
      }
      if (this.isType(' ')) {
        if ((_ref2 = this.map.world) != null) {
          _ref2.spawn(FloodFill, this);
        }
      }
      return sfx;
    };
    WorldMapCell.prototype.takeExplosionHit = function() {
      var _ref;
      if (this.pill != null) {
        return this.pill.takeExplosionHit();
      }
      if (this.isType('b')) {
        this.setType(' ');
      } else if (!this.isType(' ', '^', 'b')) {
        this.setType('%');
      } else {
        return;
      }
      return (_ref = this.map.world) != null ? _ref.spawn(FloodFill, this) : void 0;
    };
    return WorldMapCell;
  }();
  WorldMap = function() {
    function WorldMap() {
      WorldMap.__super__.constructor.apply(this, arguments);
    }
    __extends(WorldMap, Map);
    WorldMap.prototype.CellClass = WorldMapCell;
    WorldMap.prototype.PillboxClass = WorldPillbox;
    WorldMap.prototype.BaseClass = WorldBase;
    WorldMap.prototype.cellAtPixel = function(x, y) {
      return this.cellAtTile(floor(x / TILE_SIZE_PIXELS), floor(y / TILE_SIZE_PIXELS));
    };
    WorldMap.prototype.cellAtWorld = function(x, y) {
      return this.cellAtTile(floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD));
    };
    WorldMap.prototype.getRandomStart = function() {
      return this.starts[round(random() * (this.starts.length - 1))];
    };
    return WorldMap;
  }();
  module.exports = WorldMap;
}).call(this);

});
require.module('bolo/constants', function(module, exports, require) {
(function() {
  exports.PIXEL_SIZE_WORLD = 8;
  exports.TILE_SIZE_PIXELS = 32;
  exports.TILE_SIZE_WORLD = exports.TILE_SIZE_PIXELS * exports.PIXEL_SIZE_WORLD;
  exports.MAP_SIZE_TILES = 256;
  exports.MAP_SIZE_PIXELS = exports.MAP_SIZE_TILES * exports.TILE_SIZE_PIXELS;
  exports.MAP_SIZE_WORLD = exports.MAP_SIZE_TILES * exports.TILE_SIZE_WORLD;
  exports.TICK_LENGTH_MS = 20;
}).call(this);

});
require.module('bolo/map', function(module, exports, require) {
(function() {
  var Base, MAP_SIZE_TILES, Map, MapCell, MapObject, MapView, Pillbox, Start, TERRAIN_TYPES, createTerrainMap, floor, min, round;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice;
  round = Math.round, floor = Math.floor, min = Math.min;
  MAP_SIZE_TILES = require('./constants').MAP_SIZE_TILES;
  TERRAIN_TYPES = [
    {
      ascii: '|',
      description: 'building'
    }, {
      ascii: ' ',
      description: 'river'
    }, {
      ascii: '~',
      description: 'swamp'
    }, {
      ascii: '%',
      description: 'crater'
    }, {
      ascii: '=',
      description: 'road'
    }, {
      ascii: '#',
      description: 'forest'
    }, {
      ascii: ':',
      description: 'rubble'
    }, {
      ascii: '.',
      description: 'grass'
    }, {
      ascii: '}',
      description: 'shot building'
    }, {
      ascii: 'b',
      description: 'river with boat'
    }, {
      ascii: '^',
      description: 'deep sea'
    }
  ];
  createTerrainMap = function() {
    var type, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = TERRAIN_TYPES.length; _i < _len; _i++) {
      type = TERRAIN_TYPES[_i];
      _results.push(TERRAIN_TYPES[type.ascii] = type);
    }
    return _results;
  };
  createTerrainMap();
  MapCell = function() {
    function MapCell(map, x, y) {
      this.map = map;
      this.x = x;
      this.y = y;
      this.type = TERRAIN_TYPES['^'];
      this.mine = this.isEdgeCell();
      this.idx = this.y * MAP_SIZE_TILES + this.x;
    }
    MapCell.prototype.neigh = function(dx, dy) {
      return this.map.cellAtTile(this.x + dx, this.y + dy);
    };
    MapCell.prototype.isType = function() {
      var i, type, _ref;
      for (i = 0, _ref = arguments.length; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        type = arguments[i];
        if (this.type === type || this.type.ascii === type) {
          return true;
        }
      }
      return false;
    };
    MapCell.prototype.isEdgeCell = function() {
      return this.x <= 20 || this.x >= 236 || this.y <= 20 || this.y >= 236;
    };
    MapCell.prototype.getNumericType = function() {
      var num;
      if (this.type.ascii === '^') {
        return -1;
      }
      num = TERRAIN_TYPES.indexOf(this.type);
      if (this.mine) {
        num += 8;
      }
      return num;
    };
    MapCell.prototype.setType = function(newType, mine, retileRadius) {
      var hadMine, oldType;
      retileRadius || (retileRadius = 1);
      oldType = this.type;
      hadMine = this.mine;
      if (mine !== void 0) {
        this.mine = mine;
      }
      if (typeof newType === 'string') {
        this.type = TERRAIN_TYPES[newType];
        if (newType.length !== 1 || !(this.type != null)) {
          throw "Invalid terrain type: " + newType;
        }
      } else if (typeof newType === 'number') {
        if (newType >= 10) {
          newType -= 8;
          this.mine = true;
        } else {
          this.mine = false;
        }
        this.type = TERRAIN_TYPES[newType];
        if (!(this.type != null)) {
          throw "Invalid terrain type: " + newType;
        }
      } else {
        if (newType !== null) {
          this.type = newType;
        }
      }
      if (this.isEdgeCell()) {
        this.mine = true;
      }
      if (retileRadius >= 0) {
        return this.map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius);
      }
    };
    MapCell.prototype.setTile = function(tx, ty) {
      if (this.mine && !((this.pill != null) || (this.base != null))) {
        ty += 10;
      }
      return this.map.view.onRetile(this, tx, ty);
    };
    MapCell.prototype.retile = function() {
      if (this.pill != null) {
        return this.setTile(this.pill.armour, 2);
      } else if (this.base != null) {
        return this.setTile(16, 0);
      } else {
        switch (this.type.ascii) {
          case '^':
            return this.retileDeepSea();
          case '|':
            return this.retileBuilding();
          case ' ':
            return this.retileRiver();
          case '~':
            return this.setTile(7, 1);
          case '%':
            return this.setTile(5, 1);
          case '=':
            return this.retileRoad();
          case '#':
            return this.retileForest();
          case ':':
            return this.setTile(4, 1);
          case '.':
            return this.setTile(2, 1);
          case '}':
            return this.setTile(8, 1);
          case 'b':
            return this.retileBoat();
        }
      }
    };
    MapCell.prototype.retileDeepSea = function() {
      var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
      neighbourSignificance = __bind(function(dx, dy) {
        var n;
        n = this.neigh(dx, dy);
        if (n.isType('^')) {
          return 'd';
        }
        if (n.isType(' ', 'b')) {
          return 'w';
        }
        return 'l';
      }, this);
      above = neighbourSignificance(0, -1);
      aboveRight = neighbourSignificance(1, -1);
      right = neighbourSignificance(1, 0);
      belowRight = neighbourSignificance(1, 1);
      below = neighbourSignificance(0, 1);
      belowLeft = neighbourSignificance(-1, 1);
      left = neighbourSignificance(-1, 0);
      aboveLeft = neighbourSignificance(-1, -1);
      if (aboveLeft !== 'd' && above !== 'd' && left !== 'd' && right === 'd' && below === 'd') {
        return this.setTile(10, 3);
      } else if (aboveRight !== 'd' && above !== 'd' && right !== 'd' && left === 'd' && below === 'd') {
        return this.setTile(11, 3);
      } else if (belowRight !== 'd' && below !== 'd' && right !== 'd' && left === 'd' && above === 'd') {
        return this.setTile(13, 3);
      } else if (belowLeft !== 'd' && below !== 'd' && left !== 'd' && right === 'd' && above === 'd') {
        return this.setTile(12, 3);
      } else if (left === 'w' && right === 'd') {
        return this.setTile(14, 3);
      } else if (below === 'w' && above === 'd') {
        return this.setTile(15, 3);
      } else if (above === 'w' && below === 'd') {
        return this.setTile(16, 3);
      } else if (right === 'w' && left === 'd') {
        return this.setTile(17, 3);
      } else {
        return this.setTile(0, 0);
      }
    };
    MapCell.prototype.retileBuilding = function() {
      var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
      neighbourSignificance = __bind(function(dx, dy) {
        var n;
        n = this.neigh(dx, dy);
        if (n.isType('|', '}')) {
          return 'b';
        }
        return 'o';
      }, this);
      above = neighbourSignificance(0, -1);
      aboveRight = neighbourSignificance(1, -1);
      right = neighbourSignificance(1, 0);
      belowRight = neighbourSignificance(1, 1);
      below = neighbourSignificance(0, 1);
      belowLeft = neighbourSignificance(-1, 1);
      left = neighbourSignificance(-1, 0);
      aboveLeft = neighbourSignificance(-1, -1);
      if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
        return this.setTile(17, 1);
      } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b') {
        return this.setTile(30, 1);
      } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft === 'b') {
        return this.setTile(22, 2);
      } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft === 'b' && belowRight !== 'b' && belowLeft !== 'b') {
        return this.setTile(23, 2);
      } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight === 'b' && belowLeft !== 'b') {
        return this.setTile(24, 2);
      } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight === 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b') {
        return this.setTile(25, 2);
      } else if (aboveLeft === 'b' && above === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
        return this.setTile(16, 2);
      } else if (above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
        return this.setTile(17, 2);
      } else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b') {
        return this.setTile(18, 2);
      } else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b') {
        return this.setTile(19, 2);
      } else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && aboveRight === 'b' && belowLeft === 'b' && aboveLeft !== 'b' && belowRight !== 'b') {
        return this.setTile(20, 2);
      } else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && belowRight === 'b' && aboveLeft === 'b' && aboveRight !== 'b' && belowLeft !== 'b') {
        return this.setTile(21, 2);
      } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' && aboveRight === 'b') {
        return this.setTile(8, 2);
      } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && aboveLeft === 'b') {
        return this.setTile(9, 2);
      } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight === 'b') {
        return this.setTile(10, 2);
      } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && aboveLeft === 'b' && aboveRight === 'b') {
        return this.setTile(11, 2);
      } else if (above === 'b' && below === 'b' && left === 'b' && right !== 'b' && belowLeft === 'b' && aboveLeft !== 'b') {
        return this.setTile(12, 2);
      } else if (above === 'b' && below === 'b' && right === 'b' && belowRight === 'b' && left !== 'b' && aboveRight !== 'b') {
        return this.setTile(13, 2);
      } else if (above === 'b' && below === 'b' && right === 'b' && aboveRight === 'b' && belowRight !== 'b') {
        return this.setTile(14, 2);
      } else if (above === 'b' && below === 'b' && left === 'b' && aboveLeft === 'b' && belowLeft !== 'b') {
        return this.setTile(15, 2);
      } else if (right === 'b' && above === 'b' && left === 'b' && below !== 'b' && aboveLeft !== 'b' && aboveRight !== 'b') {
        return this.setTile(26, 1);
      } else if (right === 'b' && below === 'b' && left === 'b' && belowLeft !== 'b' && belowRight !== 'b') {
        return this.setTile(27, 1);
      } else if (right === 'b' && above === 'b' && below === 'b' && aboveRight !== 'b' && belowRight !== 'b') {
        return this.setTile(28, 1);
      } else if (below === 'b' && above === 'b' && left === 'b' && aboveLeft !== 'b' && belowLeft !== 'b') {
        return this.setTile(29, 1);
      } else if (left === 'b' && right === 'b' && above === 'b' && aboveRight === 'b' && aboveLeft !== 'b') {
        return this.setTile(4, 2);
      } else if (left === 'b' && right === 'b' && above === 'b' && aboveLeft === 'b' && aboveRight !== 'b') {
        return this.setTile(5, 2);
      } else if (left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight !== 'b') {
        return this.setTile(6, 2);
      } else if (left === 'b' && right === 'b' && below === 'b' && above !== 'b' && belowRight === 'b' && belowLeft !== 'b') {
        return this.setTile(7, 2);
      } else if (right === 'b' && above === 'b' && below === 'b') {
        return this.setTile(0, 2);
      } else if (left === 'b' && above === 'b' && below === 'b') {
        return this.setTile(1, 2);
      } else if (right === 'b' && left === 'b' && below === 'b') {
        return this.setTile(2, 2);
      } else if (right === 'b' && above === 'b' && left === 'b') {
        return this.setTile(3, 2);
      } else if (right === 'b' && below === 'b' && belowRight === 'b') {
        return this.setTile(18, 1);
      } else if (left === 'b' && below === 'b' && belowLeft === 'b') {
        return this.setTile(19, 1);
      } else if (right === 'b' && above === 'b' && aboveRight === 'b') {
        return this.setTile(20, 1);
      } else if (left === 'b' && above === 'b' && aboveLeft === 'b') {
        return this.setTile(21, 1);
      } else if (right === 'b' && below === 'b') {
        return this.setTile(22, 1);
      } else if (left === 'b' && below === 'b') {
        return this.setTile(23, 1);
      } else if (right === 'b' && above === 'b') {
        return this.setTile(24, 1);
      } else if (left === 'b' && above === 'b') {
        return this.setTile(25, 1);
      } else if (left === 'b' && right === 'b') {
        return this.setTile(11, 1);
      } else if (above === 'b' && below === 'b') {
        return this.setTile(12, 1);
      } else if (right === 'b') {
        return this.setTile(13, 1);
      } else if (left === 'b') {
        return this.setTile(14, 1);
      } else if (below === 'b') {
        return this.setTile(15, 1);
      } else if (above === 'b') {
        return this.setTile(16, 1);
      } else {
        return this.setTile(6, 1);
      }
    };
    MapCell.prototype.retileRiver = function() {
      var above, below, left, neighbourSignificance, right;
      neighbourSignificance = __bind(function(dx, dy) {
        var n;
        n = this.neigh(dx, dy);
        if (n.isType('=')) {
          return 'r';
        }
        if (n.isType('^', ' ', 'b')) {
          return 'w';
        }
        return 'l';
      }, this);
      above = neighbourSignificance(0, -1);
      right = neighbourSignificance(1, 0);
      below = neighbourSignificance(0, 1);
      left = neighbourSignificance(-1, 0);
      if (above === 'l' && below === 'l' && right === 'l' && left === 'l') {
        return this.setTile(30, 2);
      } else if (above === 'l' && below === 'l' && right === 'w' && left === 'l') {
        return this.setTile(26, 2);
      } else if (above === 'l' && below === 'l' && right === 'l' && left === 'w') {
        return this.setTile(27, 2);
      } else if (above === 'l' && below === 'w' && right === 'l' && left === 'l') {
        return this.setTile(28, 2);
      } else if (above === 'w' && below === 'l' && right === 'l' && left === 'l') {
        return this.setTile(29, 2);
      } else if (above === 'l' && left === 'l') {
        return this.setTile(6, 3);
      } else if (above === 'l' && right === 'l') {
        return this.setTile(7, 3);
      } else if (below === 'l' && left === 'l') {
        return this.setTile(8, 3);
      } else if (below === 'l' && right === 'l') {
        return this.setTile(9, 3);
      } else if (below === 'l' && above === 'l' && below === 'l') {
        return this.setTile(0, 3);
      } else if (left === 'l' && right === 'l') {
        return this.setTile(1, 3);
      } else if (left === 'l') {
        return this.setTile(2, 3);
      } else if (below === 'l') {
        return this.setTile(3, 3);
      } else if (right === 'l') {
        return this.setTile(4, 3);
      } else if (above === 'l') {
        return this.setTile(5, 3);
      } else {
        return this.setTile(1, 0);
      }
    };
    MapCell.prototype.retileRoad = function() {
      var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
      neighbourSignificance = __bind(function(dx, dy) {
        var n;
        n = this.neigh(dx, dy);
        if (n.isType('=')) {
          return 'r';
        }
        if (n.isType('^', ' ', 'b')) {
          return 'w';
        }
        return 'l';
      }, this);
      above = neighbourSignificance(0, -1);
      aboveRight = neighbourSignificance(1, -1);
      right = neighbourSignificance(1, 0);
      belowRight = neighbourSignificance(1, 1);
      below = neighbourSignificance(0, 1);
      belowLeft = neighbourSignificance(-1, 1);
      left = neighbourSignificance(-1, 0);
      aboveLeft = neighbourSignificance(-1, -1);
      if (aboveLeft !== 'r' && above === 'r' && aboveRight !== 'r' && left === 'r' && right === 'r' && belowLeft !== 'r' && below === 'r' && belowRight !== 'r') {
        return this.setTile(11, 0);
      } else if (above === 'r' && left === 'r' && right === 'r' && below === 'r') {
        return this.setTile(10, 0);
      } else if (left === 'w' && right === 'w' && above === 'w' && below === 'w') {
        return this.setTile(26, 0);
      } else if (right === 'r' && below === 'r' && left === 'w' && above === 'w') {
        return this.setTile(20, 0);
      } else if (left === 'r' && below === 'r' && right === 'w' && above === 'w') {
        return this.setTile(21, 0);
      } else if (above === 'r' && left === 'r' && below === 'w' && right === 'w') {
        return this.setTile(22, 0);
      } else if (right === 'r' && above === 'r' && left === 'w' && below === 'w') {
        return this.setTile(23, 0);
      } else if (above === 'w' && below === 'w') {
        return this.setTile(24, 0);
      } else if (left === 'w' && right === 'w') {
        return this.setTile(25, 0);
      } else if (above === 'w' && below === 'r') {
        return this.setTile(16, 0);
      } else if (right === 'w' && left === 'r') {
        return this.setTile(17, 0);
      } else if (below === 'w' && above === 'r') {
        return this.setTile(18, 0);
      } else if (left === 'w' && right === 'r') {
        return this.setTile(19, 0);
      } else if (right === 'r' && below === 'r' && above === 'r' && (aboveRight === 'r' || belowRight === 'r')) {
        return this.setTile(27, 0);
      } else if (left === 'r' && right === 'r' && below === 'r' && (belowLeft === 'r' || belowRight === 'r')) {
        return this.setTile(28, 0);
      } else if (left === 'r' && above === 'r' && below === 'r' && (belowLeft === 'r' || aboveLeft === 'r')) {
        return this.setTile(29, 0);
      } else if (left === 'r' && right === 'r' && above === 'r' && (aboveRight === 'r' || aboveLeft === 'r')) {
        return this.setTile(30, 0);
      } else if (left === 'r' && right === 'r' && below === 'r') {
        return this.setTile(12, 0);
      } else if (left === 'r' && above === 'r' && below === 'r') {
        return this.setTile(13, 0);
      } else if (left === 'r' && right === 'r' && above === 'r') {
        return this.setTile(14, 0);
      } else if (right === 'r' && above === 'r' && below === 'r') {
        return this.setTile(15, 0);
      } else if (below === 'r' && right === 'r' && belowRight === 'r') {
        return this.setTile(6, 0);
      } else if (below === 'r' && left === 'r' && belowLeft === 'r') {
        return this.setTile(7, 0);
      } else if (above === 'r' && left === 'r' && aboveLeft === 'r') {
        return this.setTile(8, 0);
      } else if (above === 'r' && right === 'r' && aboveRight === 'r') {
        return this.setTile(9, 0);
      } else if (below === 'r' && right === 'r') {
        return this.setTile(2, 0);
      } else if (below === 'r' && left === 'r') {
        return this.setTile(3, 0);
      } else if (above === 'r' && left === 'r') {
        return this.setTile(4, 0);
      } else if (above === 'r' && right === 'r') {
        return this.setTile(5, 0);
      } else if (right === 'r' || left === 'r') {
        return this.setTile(0, 1);
      } else if (above === 'r' || below === 'r') {
        return this.setTile(1, 1);
      } else {
        return this.setTile(10, 0);
      }
    };
    MapCell.prototype.retileForest = function() {
      var above, below, left, right;
      above = this.neigh(0, -1).isType('#');
      right = this.neigh(1, 0).isType('#');
      below = this.neigh(0, 1).isType('#');
      left = this.neigh(-1, 0).isType('#');
      if (!above && !left && right && below) {
        return this.setTile(9, 9);
      } else if (!above && left && !right && below) {
        return this.setTile(10, 9);
      } else if (above && left && !right && !below) {
        return this.setTile(11, 9);
      } else if (above && !left && right && !below) {
        return this.setTile(12, 9);
      } else if (above && !left && !right && !below) {
        return this.setTile(16, 9);
      } else if (!above && !left && !right && below) {
        return this.setTile(15, 9);
      } else if (!above && left && !right && !below) {
        return this.setTile(14, 9);
      } else if (!above && !left && right && !below) {
        return this.setTile(13, 9);
      } else if (!above && !left && !right && !below) {
        return this.setTile(8, 9);
      } else {
        return this.setTile(3, 1);
      }
    };
    MapCell.prototype.retileBoat = function() {
      var above, below, left, neighbourSignificance, right;
      neighbourSignificance = __bind(function(dx, dy) {
        var n;
        n = this.neigh(dx, dy);
        if (n.isType('^', ' ', 'b')) {
          return 'w';
        }
        return 'l';
      }, this);
      above = neighbourSignificance(0, -1);
      right = neighbourSignificance(1, 0);
      below = neighbourSignificance(0, 1);
      left = neighbourSignificance(-1, 0);
      if (above !== 'w' && left !== 'w') {
        return this.setTile(15, 6);
      } else if (above !== 'w' && right !== 'w') {
        return this.setTile(16, 6);
      } else if (below !== 'w' && right !== 'w') {
        return this.setTile(17, 6);
      } else if (below !== 'w' && left !== 'w') {
        return this.setTile(14, 6);
      } else if (left !== 'w') {
        return this.setTile(12, 6);
      } else if (right !== 'w') {
        return this.setTile(13, 6);
      } else if (below !== 'w') {
        return this.setTile(10, 6);
      } else {
        return this.setTile(11, 6);
      }
    };
    return MapCell;
  }();
  MapView = function() {
    function MapView() {}
    MapView.prototype.onRetile = function(cell, tx, ty) {};
    return MapView;
  }();
  MapObject = function() {
    function MapObject(map) {
      this.map = map;
      this.cell = this.map.cells[this.y][this.x];
    }
    return MapObject;
  }();
  Pillbox = function() {
    function Pillbox(map, x, y, owner_idx, armour, speed) {
      this.x = x;
      this.y = y;
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.speed = speed;
      Pillbox.__super__.constructor.apply(this, arguments);
    }
    __extends(Pillbox, MapObject);
    return Pillbox;
  }();
  Base = function() {
    function Base(map, x, y, owner_idx, armour, shells, mines) {
      this.x = x;
      this.y = y;
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.shells = shells;
      this.mines = mines;
      Base.__super__.constructor.apply(this, arguments);
    }
    __extends(Base, MapObject);
    return Base;
  }();
  Start = function() {
    function Start(map, x, y, direction) {
      this.x = x;
      this.y = y;
      this.direction = direction;
      Start.__super__.constructor.apply(this, arguments);
    }
    __extends(Start, MapObject);
    return Start;
  }();
  Map = function() {
    function Map() {
      var row, x, y;
      this.view = new MapView();
      this.pills = [];
      this.bases = [];
      this.starts = [];
      this.cells = new Array(MAP_SIZE_TILES);
      for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
        row = this.cells[y] = new Array(MAP_SIZE_TILES);
        for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
          row[x] = new this.CellClass(this, x, y);
        }
      }
    }
    Map.prototype.CellClass = MapCell;
    Map.prototype.PillboxClass = Pillbox;
    Map.prototype.BaseClass = Base;
    Map.prototype.StartClass = Start;
    Map.prototype.setView = function(view) {
      this.view = view;
      return this.retile();
    };
    Map.prototype.cellAtTile = function(x, y) {
      var cell, _ref;
      if (cell = (_ref = this.cells[y]) != null ? _ref[x] : void 0) {
        return cell;
      } else {
        return new this.CellClass(this, x, y, {
          isDummy: true
        });
      }
    };
    Map.prototype.each = function(cb, sx, sy, ex, ey) {
      var row, x, y;
      if (!((sx != null) && sx >= 0)) {
        sx = 0;
      }
      if (!((sy != null) && sy >= 0)) {
        sy = 0;
      }
      if (!((ex != null) && ex < MAP_SIZE_TILES)) {
        ex = MAP_SIZE_TILES - 1;
      }
      if (!((ey != null) && ey < MAP_SIZE_TILES)) {
        ey = MAP_SIZE_TILES - 1;
      }
      for (y = sy; (sy <= ey ? y <= ey : y >= ey); (sy <= ey ? y += 1 : y -= 1)) {
        row = this.cells[y];
        for (x = sx; (sx <= ex ? x <= ex : x >= ex); (sx <= ex ? x += 1 : x -= 1)) {
          cb(row[x]);
        }
      }
      return this;
    };
    Map.prototype.clear = function(sx, sy, ex, ey) {
      return this.each(function(cell) {
        cell.type = TERRAIN_TYPES['^'];
        return cell.mine = cell.isEdgeCell();
      }, sx, sy, ex, ey);
    };
    Map.prototype.retile = function(sx, sy, ex, ey) {
      return this.each(function(cell) {
        return cell.retile();
      }, sx, sy, ex, ey);
    };
    Map.prototype.findCenterCell = function() {
      var b, l, r, t, x, y;
      t = l = MAP_SIZE_TILES - 1;
      b = r = 0;
      this.each(function(c) {
        if (l > c.x) {
          l = c.x;
        }
        if (r < c.x) {
          r = c.x;
        }
        if (t > c.y) {
          t = c.y;
        }
        if (b < c.y) {
          return b = c.y;
        }
      });
      if (l > r) {
        t = l = 0;
        b = r = MAP_SIZE_TILES - 1;
      }
      x = round(l + (r - l) / 2);
      y = round(t + (b - t) / 2);
      return this.cellAtTile(x, y);
    };
    Map.prototype.dump = function(options) {
      var b, bases, c, consecutiveCells, data, encodeNibbles, ensureRunSpace, ex, flushRun, flushSequence, p, pills, run, s, seq, starts, sx, y, _fn, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _results;
      options || (options = {});
      consecutiveCells = function(row, cb) {
        var cell, count, currentType, num, startx, x, _len;
        currentType = null;
        startx = null;
        count = 0;
        for (x = 0, _len = row.length; x < _len; x++) {
          cell = row[x];
          num = cell.getNumericType();
          if (currentType === num) {
            count++;
            continue;
          }
          if (currentType != null) {
            cb(currentType, count, startx);
          }
          currentType = num;
          startx = x;
          count = 1;
        }
        if (currentType != null) {
          cb(currentType, count, startx);
        }
        return;
      };
      encodeNibbles = function(nibbles) {
        var i, nibble, octets, val, _len;
        octets = [];
        val = null;
        for (i = 0, _len = nibbles.length; i < _len; i++) {
          nibble = nibbles[i];
          nibble = nibble & 0x0F;
          if (i % 2 === 0) {
            val = nibble << 4;
          } else {
            octets.push(val + nibble);
            val = null;
          }
        }
        if (val != null) {
          octets.push(val);
        }
        return octets;
      };
      pills = options.noPills ? [] : this.pills;
      bases = options.noBases ? [] : this.bases;
      starts = options.noStarts ? [] : this.starts;
      data = function() {
        _ref = 'BMAPBOLO';
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(c.charCodeAt(0));
        }
        return _results;
      }();
      data.push(1, pills.length, bases.length, starts.length);
      for (_j = 0, _len2 = pills.length; _j < _len2; _j++) {
        p = pills[_j];
        data.push(p.x, p.y, p.owner_idx, p.armour, p.speed);
      }
      for (_k = 0, _len3 = bases.length; _k < _len3; _k++) {
        b = bases[_k];
        data.push(b.x, b.y, b.owner_idx, b.armour, b.shells, b.mines);
      }
      for (_l = 0, _len4 = starts.length; _l < _len4; _l++) {
        s = starts[_l];
        data.push(s.x, s.y, s.direction);
      }
      run = seq = sx = ex = y = null;
      flushRun = function() {
        var octets;
        if (run == null) {
          return;
        }
        flushSequence();
        octets = encodeNibbles(run);
        data.push(octets.length + 4, y, sx, ex);
        data = data.concat(octets);
        return run = null;
      };
      ensureRunSpace = function(numNibbles) {
        if ((255 - 4) * 2 - run.length >= numNibbles) {
          return;
        }
        flushRun();
        run = [];
        return sx = ex;
      };
      flushSequence = function() {
        var localSeq;
        if (seq == null) {
          return;
        }
        localSeq = seq;
        seq = null;
        ensureRunSpace(localSeq.length + 1);
        run.push(localSeq.length - 1);
        run = run.concat(localSeq);
        return ex += localSeq.length;
      };
      _ref2 = this.cells;
      _fn = function(row) {
        y = row[0].y;
        run = sx = ex = seq = null;
        return consecutiveCells(row, function(type, count, x) {
          var seqLen, _results;
          if (type === -1) {
            flushRun();
            return;
          }
          if (run == null) {
            run = [];
            sx = ex = x;
          }
          if (count > 2) {
            flushSequence();
            while (count > 2) {
              ensureRunSpace(2);
              seqLen = min(count, 9);
              run.push(seqLen + 6, type);
              ex += seqLen;
              count -= seqLen;
            }
          }
          _results = [];
          while (count > 0) {
            if (seq == null) {
              seq = [];
            }
            seq.push(type);
            if (seq.length === 8) {
              flushSequence();
            }
            _results.push(count--);
          }
          return _results;
        });
      };
      for (_m = 0, _len5 = _ref2.length; _m < _len5; _m++) {
        row = _ref2[_m];
        _fn(row);
      }
      flushRun();
      data.push(4, 0xFF, 0xFF, 0xFF);
      return data;
    };
    Map.load = function(buffer) {
      var args, basesData, c, dataLen, ex, filePos, i, magic, map, numBases, numPills, numStarts, pillsData, readBytes, run, runPos, seqLen, startsData, sx, takeNibble, type, version, x, y, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _ref5, _results, _results2, _results3, _results4, _results5, _results6;
      filePos = 0;
      readBytes = function(num, msg) {
        var sub, x, _i, _len, _ref, _results;
        sub = function() {
          try {
            _ref = buffer.slice(filePos, filePos + num);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              x = _ref[_i];
              _results.push(x);
            }
            return _results;
          } catch (e) {
            throw msg;
          }
        }();
        filePos += num;
        return sub;
      };
      magic = readBytes(8, "Not a Bolo map.");
      _ref = 'BMAPBOLO';
      for (i = 0, _len = _ref.length; i < _len; i++) {
        c = _ref[i];
        if (c.charCodeAt(0) !== magic[i]) {
          throw "Not a Bolo map.";
        }
      }
      _ref2 = readBytes(4, "Incomplete header"), version = _ref2[0], numPills = _ref2[1], numBases = _ref2[2], numStarts = _ref2[3];
      if (version !== 1) {
        throw "Unsupported map version: " + version;
      }
      map = new this();
      pillsData = function() {
        _results = [];
        for (i = 0; (0 <= numPills ? i < numPills : i > numPills); (0 <= numPills ? i += 1 : i -= 1)) {
          _results.push(readBytes(5, "Incomplete pillbox data"));
        }
        return _results;
      }();
      basesData = function() {
        _results2 = [];
        for (i = 0; (0 <= numBases ? i < numBases : i > numBases); (0 <= numBases ? i += 1 : i -= 1)) {
          _results2.push(readBytes(6, "Incomplete base data"));
        }
        return _results2;
      }();
      startsData = function() {
        _results3 = [];
        for (i = 0; (0 <= numStarts ? i < numStarts : i > numStarts); (0 <= numStarts ? i += 1 : i -= 1)) {
          _results3.push(readBytes(3, "Incomplete player start data"));
        }
        return _results3;
      }();
      while (true) {
        _ref3 = readBytes(4, "Incomplete map data"), dataLen = _ref3[0], y = _ref3[1], sx = _ref3[2], ex = _ref3[3];
        dataLen -= 4;
        if (dataLen === 0 && y === 0xFF && sx === 0xFF && ex === 0xFF) {
          break;
        }
        run = readBytes(dataLen, "Incomplete map data");
        runPos = 0;
        takeNibble = function() {
          var index, nibble;
          index = floor(runPos);
          nibble = index === runPos ? (run[index] & 0xF0) >> 4 : run[index] & 0x0F;
          runPos += 0.5;
          return nibble;
        };
        x = sx;
        while (x < ex) {
          seqLen = takeNibble();
          if (seqLen < 8) {
            for (i = 1, _ref4 = seqLen + 1; (1 <= _ref4 ? i <= _ref4 : i >= _ref4); (1 <= _ref4 ? i += 1 : i -= 1)) {
              map.cellAtTile(x++, y).setType(takeNibble(), void 0, -1);
            }
          } else {
            type = takeNibble();
            for (i = 1, _ref5 = seqLen - 6; (1 <= _ref5 ? i <= _ref5 : i >= _ref5); (1 <= _ref5 ? i += 1 : i -= 1)) {
              map.cellAtTile(x++, y).setType(type, void 0, -1);
            }
          }
        }
      }
      map.pills = function() {
        _results4 = [];
        for (_i = 0, _len2 = pillsData.length; _i < _len2; _i++) {
          args = pillsData[_i];
          _results4.push((function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(map.PillboxClass, [map].concat(__slice.call(args)), function() {}));
        }
        return _results4;
      }();
      map.bases = function() {
        _results5 = [];
        for (_j = 0, _len3 = basesData.length; _j < _len3; _j++) {
          args = basesData[_j];
          _results5.push((function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(map.BaseClass, [map].concat(__slice.call(args)), function() {}));
        }
        return _results5;
      }();
      map.starts = function() {
        _results6 = [];
        for (_k = 0, _len4 = startsData.length; _k < _len4; _k++) {
          args = startsData[_k];
          _results6.push((function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(map.StartClass, [map].concat(__slice.call(args)), function() {}));
        }
        return _results6;
      }();
      return map;
    };
    Map.extended = function(child) {
      if (!child.load) {
        return child.load = this.load;
      }
    };
    return Map;
  }();
  exports.TERRAIN_TYPES = TERRAIN_TYPES;
  exports.MapView = MapView;
  exports.Map = Map;
}).call(this);

});
require.module('bolo/net', function(module, exports, require) {
(function() {
  exports.SYNC_MESSAGE = 's'.charCodeAt(0);
  exports.WELCOME_MESSAGE = 'W'.charCodeAt(0);
  exports.CREATE_MESSAGE = 'C'.charCodeAt(0);
  exports.DESTROY_MESSAGE = 'D'.charCodeAt(0);
  exports.MAPCHANGE_MESSAGE = 'M'.charCodeAt(0);
  exports.UPDATE_MESSAGE = 'U'.charCodeAt(0);
  exports.TINY_UPDATE_MESSAGE = 'u'.charCodeAt(0);
  exports.SOUNDEFFECT_MESSAGE = 'S'.charCodeAt(0);
  exports.START_TURNING_CCW = 'L';
  exports.STOP_TURNING_CCW = 'l';
  exports.START_TURNING_CW = 'R';
  exports.STOP_TURNING_CW = 'r';
  exports.START_ACCELERATING = 'A';
  exports.STOP_ACCELERATING = 'a';
  exports.START_BRAKING = 'B';
  exports.STOP_BRAKING = 'b';
  exports.START_SHOOTING = 'S';
  exports.STOP_SHOOTING = 's';
  exports.INC_RANGE = 'I';
  exports.DEC_RANGE = 'D';
  exports.BUILD_ORDER = 'O';
}).call(this);

});
require.module('bolo/sounds', function(module, exports, require) {
(function() {
  exports.BIG_EXPLOSION = 0;
  exports.BUBBLES = 1;
  exports.FARMING_TREE = 2;
  exports.HIT_TANK = 3;
  exports.MAN_BUILDING = 4;
  exports.MAN_DYING = 5;
  exports.MAN_LAY_MINE = 6;
  exports.MINE_EXPLOSION = 7;
  exports.SHOOTING = 8;
  exports.SHOT_BUILDING = 9;
  exports.SHOT_TREE = 10;
  exports.TANK_SINKING = 11;
}).call(this);

});
require.module('bolo/objects/world_pillbox', function(module, exports, require) {
(function() {
  var BoloObject, PI, Shell, TILE_SIZE_WORLD, WorldPillbox, ceil, cos, distance, heading, max, min, round, sin, sounds, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  min = Math.min, max = Math.max, round = Math.round, ceil = Math.ceil, PI = Math.PI, cos = Math.cos, sin = Math.sin;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  _ref = require('../helpers'), distance = _ref.distance, heading = _ref.heading;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Shell = require('./shell');
  WorldPillbox = function() {
    function WorldPillbox(world_or_map, x, y, owner_idx, armour, speed) {
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.speed = speed;
      if (arguments.length === 1) {
        this.world = world_or_map;
      } else {
        this.x = (x + 0.5) * TILE_SIZE_WORLD;
        this.y = (y + 0.5) * TILE_SIZE_WORLD;
      }
      this.on('netUpdate', __bind(function(changes) {
        var _ref;
        if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y')) {
          this.updateCell();
        }
        if (changes.hasOwnProperty('inTank') || changes.hasOwnProperty('carried')) {
          this.updateCell();
        }
        if (changes.hasOwnProperty('owner')) {
          this.updateOwner();
        }
        if (changes.hasOwnProperty('armour')) {
          return (_ref = this.cell) != null ? _ref.retile() : void 0;
        }
      }, this));
    }
    __extends(WorldPillbox, BoloObject);
    WorldPillbox.prototype.updateCell = function() {
      if (this.cell != null) {
        delete this.cell.pill;
        this.cell.retile();
      }
      if (this.inTank || this.carried) {
        return this.cell = null;
      } else {
        this.cell = this.world.map.cellAtWorld(this.x, this.y);
        this.cell.pill = this;
        return this.cell.retile();
      }
    };
    WorldPillbox.prototype.updateOwner = function() {
      var _ref;
      if (this.owner) {
        this.owner_idx = this.owner.$.tank_idx;
        this.team = this.owner.$.team;
      } else {
        this.owner_idx = this.team = 255;
      }
      return (_ref = this.cell) != null ? _ref.retile() : void 0;
    };
    WorldPillbox.prototype.serialization = function(isCreate, p) {
      p('O', 'owner');
      p('f', 'inTank');
      p('f', 'carried');
      p('f', 'haveTarget');
      if (!(this.inTank || this.carried)) {
        p('H', 'x');
        p('H', 'y');
      } else {
        this.x = this.y = null;
      }
      p('B', 'armour');
      p('B', 'speed');
      p('B', 'coolDown');
      return p('B', 'reload');
    };
    WorldPillbox.prototype.placeAt = function(cell) {
      var _ref;
      this.inTank = this.carried = false;
      _ref = cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      this.updateCell();
      return this.reset();
    };
    WorldPillbox.prototype.spawn = function() {
      return this.reset();
    };
    WorldPillbox.prototype.reset = function() {
      this.coolDown = 32;
      return this.reload = 0;
    };
    WorldPillbox.prototype.anySpawn = function() {
      return this.updateCell();
    };
    WorldPillbox.prototype.update = function() {
      var d, direction, rad, tank, target, targetDistance, x, y, _i, _j, _len, _len2, _ref, _ref2, _ref3;
      if (this.inTank || this.carried) {
        return;
      }
      if (this.armour === 0) {
        this.haveTarget = false;
        _ref = this.world.tanks;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tank = _ref[_i];
          if (tank.armour !== 255) {
            if (tank.cell === this.cell) {
              this.inTank = true;
              this.x = this.y = null;
              this.updateCell();
              this.ref('owner', tank);
              this.updateOwner();
              break;
            }
          }
        }
        return;
      }
      this.reload = min(this.speed, this.reload + 1);
      if (--this.coolDown === 0) {
        this.coolDown = 32;
        this.speed = min(100, this.speed + 1);
      }
      if (this.reload < this.speed) {
        return;
      }
      target = null;
      targetDistance = Infinity;
      _ref2 = this.world.tanks;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        tank = _ref2[_j];
        if (tank.armour !== 255 && !((_ref3 = this.owner) != null ? _ref3.$.isAlly(tank) : void 0)) {
          d = distance(this, tank);
          if (d <= 2048 && d < targetDistance) {
            target = tank;
            targetDistance = d;
          }
        }
      }
      if (!target) {
        return this.haveTarget = false;
      }
      if (this.haveTarget) {
        rad = (256 - target.getDirection16th() * 16) * 2 * PI / 256;
        x = target.x + targetDistance / 32 * round(cos(rad) * ceil(target.speed));
        y = target.y + targetDistance / 32 * round(sin(rad) * ceil(target.speed));
        direction = 256 - heading(this, {
          x: x,
          y: y
        }) * 256 / (2 * PI);
        this.world.spawn(Shell, this, {
          direction: direction
        });
        this.soundEffect(sounds.SHOOTING);
      }
      this.haveTarget = true;
      return this.reload = 0;
    };
    WorldPillbox.prototype.aggravate = function() {
      this.coolDown = 32;
      return this.speed = max(6, round(this.speed / 2));
    };
    WorldPillbox.prototype.takeShellHit = function(shell) {
      this.aggravate();
      this.armour = max(0, this.armour - 1);
      this.cell.retile();
      return sounds.SHOT_BUILDING;
    };
    WorldPillbox.prototype.takeExplosionHit = function() {
      this.armour = max(0, this.armour - 5);
      return this.cell.retile();
    };
    WorldPillbox.prototype.repair = function(trees) {
      var used;
      used = min(trees, ceil((15 - this.armour) / 4));
      this.armour = min(15, this.armour + used * 4);
      this.cell.retile();
      return used;
    };
    return WorldPillbox;
  }();
  module.exports = WorldPillbox;
}).call(this);

});
require.module('bolo/helpers', function(module, exports, require) {
(function() {
  var atan2, distance, extend, heading, sqrt;
  sqrt = Math.sqrt, atan2 = Math.atan2;
  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  distance = exports.distance = function(a, b) {
    var dx, dy;
    dx = a.x - b.x;
    dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
  };
  heading = exports.heading = function(a, b) {
    return atan2(b.y - a.y, b.x - a.x);
  };
}).call(this);

});
require.module('bolo/object', function(module, exports, require) {
(function() {
  var BoloObject, NetWorldObject;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  NetWorldObject = require('villain/world/net/object');
  BoloObject = function() {
    function BoloObject() {
      BoloObject.__super__.constructor.apply(this, arguments);
    }
    __extends(BoloObject, NetWorldObject);
    BoloObject.prototype.styled = null;
    BoloObject.prototype.team = null;
    BoloObject.prototype.x = null;
    BoloObject.prototype.y = null;
    BoloObject.prototype.soundEffect = function(sfx) {
      return this.world.soundEffect(sfx, this.x, this.y, this);
    };
    BoloObject.prototype.getTile = function() {};
    return BoloObject;
  }();
  module.exports = BoloObject;
}).call(this);

});
require.module('villain/world/net/object', function(module, exports, require) {
(function() {
  var NetWorldObject, WorldObject;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  WorldObject = require('../object');
  NetWorldObject = function() {
    function NetWorldObject() {
      NetWorldObject.__super__.constructor.apply(this, arguments);
    }
    __extends(NetWorldObject, WorldObject);
    NetWorldObject.prototype.charId = null;
    NetWorldObject.prototype.serialization = function(isCreate, p) {};
    NetWorldObject.prototype.netSpawn = function() {};
    NetWorldObject.prototype.anySpawn = function() {};
    return NetWorldObject;
  }();
  module.exports = NetWorldObject;
}).call(this);

});
require.module('villain/world/object', function(module, exports, require) {
(function() {
  var EventEmitter, WorldObject;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  EventEmitter = require('events').EventEmitter;
  WorldObject = function() {
    function WorldObject(world) {
      this.world = world;
    }
    __extends(WorldObject, EventEmitter);
    WorldObject.prototype.world = null;
    WorldObject.prototype.idx = null;
    WorldObject.prototype.updatePriority = 0;
    WorldObject.prototype.spawn = function() {};
    WorldObject.prototype.update = function() {};
    WorldObject.prototype.destroy = function() {};
    WorldObject.prototype.ref = function(attribute, other) {
      var r, _ref, _ref2;
      if (((_ref = this[attribute]) != null ? _ref.$ : void 0) === other) {
        return this[attribute];
      }
      if ((_ref2 = this[attribute]) != null) {
        _ref2.clear();
      }
      if (!other) {
        return;
      }
      this[attribute] = r = {
        $: other,
        owner: this,
        attribute: attribute
      };
      r.events = {};
      r.on = function(event, listener) {
        var _base;
        other.on(event, listener);
        ((_base = r.events)[event] || (_base[event] = [])).push(listener);
        return r;
      };
      r.clear = function() {
        var event, listener, listeners, _i, _len, _ref;
        _ref = r.events;
        for (event in _ref) {
          if (!__hasProp.call(_ref, event)) continue;
          listeners = _ref[event];
          for (_i = 0, _len = listeners.length; _i < _len; _i++) {
            listener = listeners[_i];
            other.removeListener(event, listener);
          }
        }
        r.owner.removeListener('finalize', r.clear);
        return r.owner[r.attribute] = null;
      };
      r.on('finalize', r.clear);
      r.owner.on('finalize', r.clear);
      return r;
    };
    return WorldObject;
  }();
  module.exports = WorldObject;
}).call(this);

});
require.module('events', function(module, exports, require) {
// This is an extract from node.js, which is MIT-licensed.
// © 2009, 2010 Ryan Lienhart Dahl.
// Slightly adapted for a browser environment by Stéphan Kochen.

var EventEmitter = exports.EventEmitter = function() {};

var isArray = Array.isArray || function(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
};

EventEmitter.prototype.emit = function (type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1];
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    if (arguments.length <= 3) {
      // fast case
      handler.call(this, arguments[1], arguments[2]);
    } else {
      // slower
      var args = Array.prototype.slice.call(arguments, 1);
      handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);


    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit("newListener", type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {
    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function (type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});
require.module('bolo/objects/shell', function(module, exports, require) {
(function() {
  var BoloObject, Destructable, Explosion, MineExplosion, PI, Shell, TILE_SIZE_WORLD, cos, distance, floor, round, sin;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, floor = Math.floor, cos = Math.cos, sin = Math.sin, PI = Math.PI;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  Explosion = require('./explosion');
  MineExplosion = require('./mine_explosion');
  Destructable = function() {
    function Destructable() {}
    Destructable.prototype.takeShellHit = function(shell) {};
    return Destructable;
  }();
  Shell = function() {
    function Shell(world) {
      this.world = world;
      this.spawn = __bind(this.spawn, this);;
      this.on('netSync', __bind(function() {
        return this.updateCell();
      }, this));
    }
    __extends(Shell, BoloObject);
    Shell.prototype.updatePriority = 20;
    Shell.prototype.styled = false;
    Shell.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('B', 'direction');
        p('O', 'owner');
        p('O', 'attribution');
        p('f', 'onWater');
      }
      p('H', 'x');
      p('H', 'y');
      return p('B', 'lifespan');
    };
    Shell.prototype.updateCell = function() {
      return this.cell = this.world.map.cellAtWorld(this.x, this.y);
    };
    Shell.prototype.getDirection16th = function() {
      return round((this.direction - 1) / 16) % 16;
    };
    Shell.prototype.getTile = function() {
      var tx;
      tx = this.getDirection16th();
      return [tx, 4];
    };
    Shell.prototype.spawn = function(owner, options) {
      var _ref;
      options || (options = {});
      this.ref('owner', owner);
      if (this.owner.$.hasOwnProperty('owner_idx')) {
        this.ref('attribution', (_ref = this.owner.$.owner) != null ? _ref.$ : void 0);
      } else {
        this.ref('attribution', this.owner.$);
      }
      this.direction = options.direction || this.owner.$.direction;
      this.lifespan = (options.range || 7) * TILE_SIZE_WORLD / 32 - 2;
      this.onWater = options.onWater || false;
      this.x = this.owner.$.x;
      this.y = this.owner.$.y;
      return this.move();
    };
    Shell.prototype.update = function() {
      var collision, mode, sfx, victim, x, y, _ref;
      this.move();
      collision = this.collide();
      if (collision) {
        mode = collision[0], victim = collision[1];
        sfx = victim.takeShellHit(this);
        if (mode === 'cell') {
          _ref = this.cell.getWorldCoordinates(), x = _ref[0], y = _ref[1];
          this.world.soundEffect(sfx, x, y);
        } else {
          x = this.x, y = this.y;
          victim.soundEffect(sfx);
        }
        return this.asplode(x, y, mode);
      } else if (this.lifespan-- === 0) {
        return this.asplode(this.x, this.y, 'eol');
      }
    };
    Shell.prototype.move = function() {
      this.radians || (this.radians = (256 - this.direction) * 2 * PI / 256);
      this.x += round(cos(this.radians) * 32);
      this.y += round(sin(this.radians) * 32);
      return this.updateCell();
    };
    Shell.prototype.collide = function() {
      var base, pill, tank, terrainCollision, x, y, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if ((pill = this.cell.pill) && pill.armour > 0 && pill !== ((_ref = this.owner) != null ? _ref.$ : void 0)) {
        _ref2 = this.cell.getWorldCoordinates(), x = _ref2[0], y = _ref2[1];
        if (distance(this, {
          x: x,
          y: y
        }) <= 127) {
          return ['cell', pill];
        }
      }
      _ref3 = this.world.tanks;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        tank = _ref3[_i];
        if (tank !== ((_ref4 = this.owner) != null ? _ref4.$ : void 0) && tank.armour !== 255) {
          if (distance(this, tank) <= 127) {
            return ['tank', tank];
          }
        }
      }
      if (((_ref5 = this.attribution) != null ? _ref5.$ : void 0) === ((_ref6 = this.owner) != null ? _ref6.$ : void 0) && (base = this.cell.base) && base.armour > 4) {
        if (this.onWater || (((base != null ? base.owner : void 0) != null) && !base.owner.$.isAlly((_ref7 = this.attribution) != null ? _ref7.$ : void 0))) {
          return ['cell', base];
        }
      }
      terrainCollision = this.onWater ? !this.cell.isType('^', ' ', '%') : this.cell.isType('|', '}', '#', 'b');
      if (terrainCollision) {
        return ['cell', this.cell];
      }
    };
    Shell.prototype.asplode = function(x, y, mode) {
      var builder, tank, _i, _len, _ref, _ref2;
      _ref = this.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (builder = tank.builder.$) {
          if ((_ref2 = builder.order) !== builder.states.inTank && _ref2 !== builder.states.parachuting) {
            if (mode === 'cell') {
              if (builder.cell === this.cell) {
                builder.kill();
              }
            } else {
              if (distance(this, builder) < (TILE_SIZE_WORLD / 2)) {
                builder.kill();
              }
            }
          }
        }
      }
      this.world.spawn(Explosion, x, y);
      this.world.spawn(MineExplosion, this.cell);
      return this.world.destroy(this);
    };
    return Shell;
  }();
  module.exports = Shell;
}).call(this);

});
require.module('bolo/objects/explosion', function(module, exports, require) {
(function() {
  var BoloObject, Explosion, floor;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  floor = Math.floor;
  BoloObject = require('../object');
  Explosion = function() {
    function Explosion() {
      Explosion.__super__.constructor.apply(this, arguments);
    }
    __extends(Explosion, BoloObject);
    Explosion.prototype.styled = false;
    Explosion.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      return p('B', 'lifespan');
    };
    Explosion.prototype.getTile = function() {
      switch (floor(this.lifespan / 3)) {
        case 7:
          return [20, 3];
        case 6:
          return [21, 3];
        case 5:
          return [20, 4];
        case 4:
          return [21, 4];
        case 3:
          return [20, 5];
        case 2:
          return [21, 5];
        case 1:
          return [18, 4];
        default:
          return [19, 4];
      }
    };
    Explosion.prototype.spawn = function(x, y) {
      this.x = x;
      this.y = y;
      return this.lifespan = 23;
    };
    Explosion.prototype.update = function() {
      if (this.lifespan-- === 0) {
        return this.world.destroy(this);
      }
    };
    return Explosion;
  }();
  module.exports = Explosion;
}).call(this);

});
require.module('bolo/objects/mine_explosion', function(module, exports, require) {
(function() {
  var BoloObject, Explosion, MineExplosion, TILE_SIZE_WORLD, distance, sounds;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Explosion = require('./explosion');
  MineExplosion = function() {
    function MineExplosion() {
      MineExplosion.__super__.constructor.apply(this, arguments);
    }
    __extends(MineExplosion, BoloObject);
    MineExplosion.prototype.styled = null;
    MineExplosion.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      return p('B', 'lifespan');
    };
    MineExplosion.prototype.spawn = function(cell) {
      var _ref;
      _ref = cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      return this.lifespan = 10;
    };
    MineExplosion.prototype.anySpawn = function() {
      return this.cell = this.world.map.cellAtWorld(this.x, this.y);
    };
    MineExplosion.prototype.update = function() {
      if (this.lifespan-- === 0) {
        if (this.cell.mine) {
          this.asplode();
        }
        return this.world.destroy(this);
      }
    };
    MineExplosion.prototype.asplode = function() {
      var builder, tank, _i, _len, _ref, _ref2;
      this.cell.setType(null, false, 0);
      this.cell.takeExplosionHit();
      _ref = this.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.armour !== 255 && distance(this, tank) < 384) {
          tank.takeMineHit();
        }
        builder = tank.builder.$;
        if ((_ref2 = builder.order) !== builder.states.inTank && _ref2 !== builder.states.parachuting) {
          if (distance(this, builder) < (TILE_SIZE_WORLD / 2)) {
            builder.kill();
          }
        }
      }
      this.world.spawn(Explosion, this.x, this.y);
      this.soundEffect(sounds.MINE_EXPLOSION);
      return this.spread();
    };
    MineExplosion.prototype.spread = function() {
      var n;
      n = this.cell.neigh(1, 0);
      if (!n.isEdgeCell()) {
        this.world.spawn(MineExplosion, n);
      }
      n = this.cell.neigh(0, 1);
      if (!n.isEdgeCell()) {
        this.world.spawn(MineExplosion, n);
      }
      n = this.cell.neigh(-1, 0);
      if (!n.isEdgeCell()) {
        this.world.spawn(MineExplosion, n);
      }
      n = this.cell.neigh(0, -1);
      if (!n.isEdgeCell()) {
        return this.world.spawn(MineExplosion, n);
      }
    };
    return MineExplosion;
  }();
  module.exports = MineExplosion;
}).call(this);

});
require.module('bolo/objects/world_base', function(module, exports, require) {
(function() {
  var BoloObject, TILE_SIZE_WORLD, WorldBase, distance, max, min, sounds;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  min = Math.min, max = Math.max;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  sounds = require('../sounds');
  WorldBase = function() {
    function WorldBase(world_or_map, x, y, owner_idx, armour, shells, mines) {
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.shells = shells;
      this.mines = mines;
      if (arguments.length === 1) {
        this.world = world_or_map;
      } else {
        this.x = (x + 0.5) * TILE_SIZE_WORLD;
        this.y = (y + 0.5) * TILE_SIZE_WORLD;
        world_or_map.cellAtTile(x, y).setType('=', false, -1);
      }
      this.on('netUpdate', __bind(function(changes) {
        if (changes.hasOwnProperty('owner')) {
          return this.updateOwner();
        }
      }, this));
    }
    __extends(WorldBase, BoloObject);
    WorldBase.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      p('O', 'owner');
      p('O', 'refueling');
      if (this.refueling) {
        p('B', 'refuelCounter');
      }
      p('B', 'armour');
      p('B', 'shells');
      return p('B', 'mines');
    };
    WorldBase.prototype.updateOwner = function() {
      if (this.owner) {
        this.owner_idx = this.owner.$.tank_idx;
        this.team = this.owner.$.team;
      } else {
        this.owner_idx = this.team = 255;
      }
      return this.cell.retile();
    };
    WorldBase.prototype.anySpawn = function() {
      this.cell = this.world.map.cellAtWorld(this.x, this.y);
      return this.cell.base = this;
    };
    WorldBase.prototype.update = function() {
      var amount;
      if (this.refueling && (this.refueling.$.cell !== this.cell || this.refueling.$.armour === 255)) {
        this.ref('refueling', null);
      }
      if (!this.refueling) {
        return this.findSubject();
      }
      if (--this.refuelCounter !== 0) {
        return;
      }
      if (this.armour > 0 && this.refueling.$.armour < 40) {
        amount = min(5, this.armour, 40 - this.refueling.$.armour);
        this.refueling.$.armour += amount;
        this.armour -= amount;
        return this.refuelCounter = 46;
      } else if (this.shells > 0 && this.refueling.$.shells < 40) {
        this.refueling.$.shells += 1;
        this.shells -= 1;
        return this.refuelCounter = 7;
      } else if (this.mines > 0 && this.refueling.$.mines < 40) {
        this.refueling.$.mines += 1;
        this.mines -= 1;
        return this.refuelCounter = 7;
      } else {
        return this.refuelCounter = 1;
      }
    };
    WorldBase.prototype.findSubject = function() {
      var canClaim, other, tank, tanks, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _results;
      tanks = function() {
        _ref = this.world.tanks;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tank = _ref[_i];
          if (tank.armour !== 255 && tank.cell === this.cell) {
            _results.push(tank);
          }
        }
        return _results;
      }.call(this);
      for (_j = 0, _len2 = tanks.length; _j < _len2; _j++) {
        tank = tanks[_j];
        if ((_ref2 = this.owner) != null ? _ref2.$.isAlly(tank) : void 0) {
          this.ref('refueling', tank);
          this.refuelCounter = 46;
          break;
        } else {
          canClaim = true;
          for (_k = 0, _len3 = tanks.length; _k < _len3; _k++) {
            other = tanks[_k];
            if (other !== tank) {
              if (!tank.isAlly(other)) {
                canClaim = false;
              }
            }
          }
          if (canClaim) {
            this.ref('owner', tank);
            this.updateOwner();
            this.owner.on('destroy', __bind(function() {
              this.ref('owner', null);
              return this.updateOwner();
            }, this));
            this.ref('refueling', tank);
            this.refuelCounter = 46;
            break;
          }
        }
      }
      return;
    };
    WorldBase.prototype.takeShellHit = function(shell) {
      var pill, _i, _len, _ref, _ref2;
      if (this.owner) {
        _ref = this.world.map.pills;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pill = _ref[_i];
          if (!(pill.inTank || pill.carried) && pill.armour > 0) {
            if (((_ref2 = pill.owner) != null ? _ref2.$.isAlly(this.owner.$) : void 0) && distance(this, pill) <= 2304) {
              pill.aggravate();
            }
          }
        }
      }
      this.armour = max(0, this.armour - 5);
      return sounds.SHOT_BUILDING;
    };
    return WorldBase;
  }();
  module.exports = WorldBase;
}).call(this);

});
require.module('bolo/objects/flood_fill', function(module, exports, require) {
(function() {
  var BoloObject, FloodFill;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  BoloObject = require('../object');
  FloodFill = function() {
    function FloodFill() {
      FloodFill.__super__.constructor.apply(this, arguments);
    }
    __extends(FloodFill, BoloObject);
    FloodFill.prototype.styled = null;
    FloodFill.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      return p('B', 'lifespan');
    };
    FloodFill.prototype.spawn = function(cell) {
      var _ref;
      _ref = cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      return this.lifespan = 16;
    };
    FloodFill.prototype.anySpawn = function() {
      this.cell = this.world.map.cellAtWorld(this.x, this.y);
      return this.neighbours = [this.cell.neigh(1, 0), this.cell.neigh(0, 1), this.cell.neigh(-1, 0), this.cell.neigh(0, -1)];
    };
    FloodFill.prototype.update = function() {
      if (this.lifespan-- === 0) {
        this.flood();
        return this.world.destroy(this);
      }
    };
    FloodFill.prototype.canGetWet = function() {
      var n, result, _i, _len, _ref;
      result = false;
      _ref = this.neighbours;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        n = _ref[_i];
        if (!(n.base || n.pill) && n.isType(' ', '^', 'b')) {
          result = true;
          break;
        }
      }
      return result;
    };
    FloodFill.prototype.flood = function() {
      if (this.canGetWet()) {
        this.cell.setType(' ', false);
        return this.spread();
      }
    };
    FloodFill.prototype.spread = function() {
      var n, _i, _len, _ref;
      _ref = this.neighbours;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        n = _ref[_i];
        if (!(n.base || n.pill) && n.isType('%')) {
          this.world.spawn(FloodFill, n);
        }
      }
      return;
    };
    return FloodFill;
  }();
  module.exports = FloodFill;
}).call(this);

});
require.module('bolo/client/everard', function(module, exports, require) {
(function() {
  module.exports = 'Qk1BUEJPTE8BEAsQW5H/D2Vjbv8PZV90/w9lVHX/D2VwbP8PZYFr/w9lq27/D2WueP8PZa58/w9l\nmpL/D2Veh/8PZWmJ/w9lcYn/D2Vsf/8PZWx4/w9lrYn/D2WBaP9aWlqvaf9aWlpWbv9aWlquev9a\nWlp5e/9aWlpsfP9aWlqLff9aWlpti/9aWlpVjf9aWlqlkv9aWlp+mP9aWlpMjABMfABcZA1sZAx8\nZAyMZAycZAysZAu4fAi4jAisnAWcnASMnAR8nARsnARcnAMQZk608fHx8fHx8fHx8fGRGGdNtaH0\ntNUB8PCQkgGSAeIB4vHh8pKRHWhNtZGU9YUE1QHnlOcAxIIB4gHiAfKygdKQkoEfaU21gZT1lQTV\nAde05wSSgYIB4pHCAfKC8ZEAhJKBIGpNtYGEhfSFBNUBx9TXBIeC8bKBooHiofICgQSBgoEja021\ngQSFhNUEhQTVAbf0xwSXEhwrGSAaIBwqGCAfKSFCsSBsTbWBBIUE5QSFBNWRl/TUl/KSsaIBkqGy\ngfKCBKKBIG1NtYEEhQSFpIUEhQT1AZf0xwT3t7LxAfIB8oIEooEjbk21gQSFBIWEFUhQSFBKUHpQ\nGn1NcE9/fCAfKioeIEooECBvTbWBBIUEtQSFBIUE9QG3tOcE9/eygZL3p5HCBKKBIXBNtYEEhQS1\nBIUEhQT1gbeU9wT394eSAaL3x5GiBKKBIHFNtYEEhdSFBIUE9RUffXIED355CHAff3lwGiBKKBAe\nck21gQT1hQSFBPUVH31wD09JQQeB9/eXsQSBgoEdc021gQT1hQSFBPUVH31yBA9+dAQHH399eAFA\nsRl0TbWB9KSFFH9QH35wT39wD09PS0AJKBAddU21gbUH9QTl8QGH4QTx8RFJH394eFlxBICSgSJ2\nTbWB9cUE1fGx0ATw8EBAEIcFlwCHhYcQeFl4WnFHooEgd021gfWFtLXx0QD0pAD0pDAQeVx4WXhR\ncKcAhwS3gSJ4TbXhtQTl8QLREE8IAkBNAEkDQBCHBYcldZeF96cEt4EleU21gbcBtQTl8eEgQPRA\nQEC0AJRAQBCHBYclBaeFl5XHBLWBJnpNtYG3AaUQSQtfHhkATwJASQBLBUBAELeVhwCHhceVhwSH\nlYEje021gbcBpQD09PSUAJQgQJQgQNRwQEAQX3p4W3JXWXtYECd8TbWBtwGlkBQLXxAtEQSwRAQE\nkASwdAQEBAEQhYeF9wW3JXXngSd9TbWBtwHVBMXx4SBAtCBAtAC0cEBAQBAJUHhZeVt5VHV1e1h4\nECp+TbWBtwHVBIXx8ZEwQEsATQBNB0BAEFcVeFlwWnBYcFl3V1dXVwWHgSd/TbWBtwGFsQSRp+EC\n0UBAQPSEAPRAQBCHpZeVB5UXWXNXV7WHgSeATbWBt6GgBKeV8dFwQEBATQBPBUBAEPcFpwWHBZd1\ndXV1cFh4ECSBTbWB96AEp5UH8aFAEECUANQgQNRAQECh15W3lUdXV7WHgSOCTbWB94CHBNUH8ZFC\nAQTwBJAkBLB0BAQBAHsffHJXXngQI4NNtYHwgIcElcfxAYIgEPSEAJQAtACUQEAQt+HnFXxZeBAf\nhE21gfCAhwTVhwGSsZIQHQBLAE0ATQEQ95fB97eBHIVNtYEAxwC3BKeVhwHyggCRAPQA9PSE98fx\n4R6GTbWBEHoAewF01YcB8oKQAfDw8AGHBPe3gPe3gR6HTbWBIHCnALc0V1t4HyogDx8fGBhwT3x4\nD3p4EByITbWBMHB6C3BNUHgfKyAfeg9+cE98eA95eRAeiU21gZD3IECXlRcfLCAYcAt8D3xxBPCA\nl7D3B5Efik21gQeAB4DHAPT09LSHAKcAhwD09MQwcHsPcHkQK4tNtYEHgAeAxyBAh4CXAaKQFAwk\nFwcKcApwCHAPeHBKCRBIEwQH0PcHkSaMTbWBB4AHgOQAh4CXAaKwwgGXEHwAew94eUEQkQSBAPQA\n94eBKo1NtYEHgAeAFH0IeAh4GSkPJhcHBw9/engCQQkQSBgBQMcQegh4WHgQK45NtYEHgAeAh/CA\nB4GSoPKBpwCHhccA15AHgCQQkQShFAxwCnAIeFh4ECmPTbWBhyBwh4CngIcAhwGioPISGnANegh6\nUXCXgCQQ4QSwB9CHhYeBKZBNtYGHMHB5AHgAeAhwCHAZKw8hIafwtwWHhZCHEE0aSAhwDHANeBAo\nkU21gYeQRwcHgASAhxB4GSsPISGnsPeFhwWAlwCk0QSAB/AXC3gQKpJNtYGnUHBweAB4CHIHGnsP\ncH8YH3hYcVCXAIShAqEUCXEEhwCnALeBKJNNtYEHoEcHB4AHgAeAFxp7D3hwHnwbeFhwCXgJShxJ\nCXkAeAt4ECaUTbWBB6BHBweAB4AnB4GnsJehpwH3p7G3gAeQBPGAFAp8C3kQIpVNtYGXAIcwcHgK\ncgcbewh8GXAffnoceAlNEgdKD3l5ECCWTbWRhwCnEHgAegFxt7CHwZcB9/cH8fGBEH9ATHoQHZdN\ntZGH8Aeggbewl6GnAfeHkfengPERDygrexAbmE21sfCXgAHHsKeBtwH34feHAPERDygpfRAQmU60\n8fHx8fHx8fHx8fGRBP///w=='.split('\n').join('');
}).call(this);

});
require.module('bolo/objects/all', function(module, exports, require) {
(function() {
  exports.registerWithWorld = function(w) {
    w.registerType(require('./world_pillbox'));
    w.registerType(require('./world_base'));
    w.registerType(require('./flood_fill'));
    w.registerType(require('./tank'));
    w.registerType(require('./explosion'));
    w.registerType(require('./mine_explosion'));
    w.registerType(require('./shell'));
    w.registerType(require('./fireball'));
    return w.registerType(require('./builder'));
  };
}).call(this);

});
require.module('bolo/objects/tank', function(module, exports, require) {
(function() {
  var BoloObject, Builder, Explosion, Fireball, MineExplosion, PI, Shell, TILE_SIZE_WORLD, Tank, ceil, cos, distance, floor, max, min, round, sin, sounds, sqrt;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, floor = Math.floor, ceil = Math.ceil, min = Math.min, sqrt = Math.sqrt, max = Math.max, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Explosion = require('./explosion');
  MineExplosion = require('./mine_explosion');
  Shell = require('./shell');
  Fireball = require('./fireball');
  Builder = require('./builder');
  Tank = function() {
    function Tank(world) {
      this.world = world;
      this.on('netUpdate', __bind(function(changes) {
        if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y') || changes.armour === 255) {
          return this.updateCell();
        }
      }, this));
    }
    __extends(Tank, BoloObject);
    Tank.prototype.styled = true;
    Tank.prototype.anySpawn = function() {
      this.updateCell();
      this.world.addTank(this);
      return this.on('finalize', __bind(function() {
        return this.world.removeTank(this);
      }, this));
    };
    Tank.prototype.updateCell = function() {
      return this.cell = (this.x != null) && (this.y != null) ? this.world.map.cellAtWorld(this.x, this.y) : null;
    };
    Tank.prototype.reset = function() {
      var startingPos, _ref;
      startingPos = this.world.map.getRandomStart();
      _ref = startingPos.cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      this.direction = startingPos.direction * 16;
      this.updateCell();
      this.speed = 0.00;
      this.slideTicks = 0;
      this.slideDirection = 0;
      this.accelerating = false;
      this.braking = false;
      this.turningClockwise = false;
      this.turningCounterClockwise = false;
      this.turnSpeedup = 0;
      this.shells = 40;
      this.mines = 0;
      this.armour = 40;
      this.trees = 0;
      this.reload = 0;
      this.shooting = false;
      this.firingRange = 7;
      this.waterTimer = 0;
      return this.onBoat = true;
    };
    Tank.prototype.serialization = function(isCreate, p) {
      var _ref;
      if (isCreate) {
        p('B', 'team');
        p('O', 'builder');
      }
      p('B', 'armour');
      if (this.armour === 255) {
        p('O', 'fireball');
        this.x = this.y = null;
        return;
      } else {
        if ((_ref = this.fireball) != null) {
          _ref.clear();
        }
      }
      p('H', 'x');
      p('H', 'y');
      p('B', 'direction');
      p('B', 'speed', {
        tx: function(v) {
          return v * 4;
        },
        rx: function(v) {
          return v / 4;
        }
      });
      p('B', 'slideTicks');
      p('B', 'slideDirection');
      p('B', 'turnSpeedup', {
        tx: function(v) {
          return v + 50;
        },
        rx: function(v) {
          return v - 50;
        }
      });
      p('B', 'shells');
      p('B', 'mines');
      p('B', 'trees');
      p('B', 'reload');
      p('B', 'firingRange', {
        tx: function(v) {
          return v * 2;
        },
        rx: function(v) {
          return v / 2;
        }
      });
      p('B', 'waterTimer');
      p('f', 'accelerating');
      p('f', 'braking');
      p('f', 'turningClockwise');
      p('f', 'turningCounterClockwise');
      p('f', 'shooting');
      return p('f', 'onBoat');
    };
    Tank.prototype.getDirection16th = function() {
      return round((this.direction - 1) / 16) % 16;
    };
    Tank.prototype.getSlideDirection16th = function() {
      return round((this.slideDirection - 1) / 16) % 16;
    };
    Tank.prototype.getCarryingPillboxes = function() {
      var pill, _i, _len, _ref, _ref2, _results;
      _ref = this.world.map.pills;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pill = _ref[_i];
        if (pill.inTank && ((_ref2 = pill.owner) != null ? _ref2.$ : void 0) === this) {
          _results.push(pill);
        }
      }
      return _results;
    };
    Tank.prototype.getTile = function() {
      var tx, ty;
      tx = this.getDirection16th();
      ty = this.onBoat ? 1 : 0;
      return [tx, ty];
    };
    Tank.prototype.isAlly = function(other) {
      return other === this || (this.team !== 255 && other.team === this.team);
    };
    Tank.prototype.increaseRange = function() {
      return this.firingRange = min(7, this.firingRange + 0.5);
    };
    Tank.prototype.decreaseRange = function() {
      return this.firingRange = max(1, this.firingRange - 0.5);
    };
    Tank.prototype.takeShellHit = function(shell) {
      var largeExplosion;
      this.armour -= 5;
      if (this.armour < 0) {
        largeExplosion = this.shells + this.mines > 20;
        this.ref('fireball', this.world.spawn(Fireball, this.x, this.y, shell.direction, largeExplosion));
        this.kill();
      } else {
        this.slideTicks = 8;
        this.slideDirection = shell.direction;
        if (this.onBoat) {
          this.onBoat = false;
          this.speed = 0;
          if (this.cell.isType('^')) {
            this.sink();
          }
        }
      }
      return sounds.HIT_TANK;
    };
    Tank.prototype.takeMineHit = function() {
      var largeExplosion;
      this.armour -= 10;
      if (this.armour < 0) {
        largeExplosion = this.shells + this.mines > 20;
        this.ref('fireball', this.world.spawn(Fireball, this.x, this.y, this.direction, largeExplosion));
        return this.kill();
      } else if (this.onBoat) {
        this.onBoat = false;
        this.speed = 0;
        if (this.cell.isType('^')) {
          return this.sink();
        }
      }
    };
    Tank.prototype.spawn = function(team) {
      this.team = team;
      this.reset();
      return this.ref('builder', this.world.spawn(Builder, this));
    };
    Tank.prototype.update = function() {
      if (this.death()) {
        return;
      }
      this.shootOrReload();
      this.turn();
      this.accelerate();
      this.fixPosition();
      return this.move();
    };
    Tank.prototype.destroy = function() {
      this.dropPillboxes();
      return this.world.destroy(this.builder.$);
    };
    Tank.prototype.death = function() {
      if (this.armour !== 255) {
        return false;
      }
      if (this.world.authority && --this.respawnTimer === 0) {
        delete this.respawnTimer;
        this.reset();
        return false;
      }
      return true;
    };
    Tank.prototype.shootOrReload = function() {
      if (this.reload > 0) {
        this.reload--;
      }
      if (!(this.shooting && this.reload === 0 && this.shells > 0)) {
        return;
      }
      this.shells--;
      this.reload = 13;
      this.world.spawn(Shell, this, {
        range: this.firingRange,
        onWater: this.onBoat
      });
      return this.soundEffect(sounds.SHOOTING);
    };
    Tank.prototype.turn = function() {
      var acceleration, maxTurn;
      maxTurn = this.cell.getTankTurn(this);
      if (this.turningClockwise === this.turningCounterClockwise) {
        this.turnSpeedup = 0;
        return;
      }
      if (this.turningCounterClockwise) {
        acceleration = maxTurn;
        if (this.turnSpeedup < 10) {
          acceleration /= 2;
        }
        if (this.turnSpeedup < 0) {
          this.turnSpeedup = 0;
        }
        this.turnSpeedup++;
      } else {
        acceleration = -maxTurn;
        if (this.turnSpeedup > -10) {
          acceleration /= 2;
        }
        if (this.turnSpeedup > 0) {
          this.turnSpeedup = 0;
        }
        this.turnSpeedup--;
      }
      this.direction += acceleration;
      while (this.direction < 0) {
        this.direction += 256;
      }
      if (this.direction >= 256) {
        return this.direction %= 256;
      }
    };
    Tank.prototype.accelerate = function() {
      var acceleration, maxSpeed;
      maxSpeed = this.cell.getTankSpeed(this);
      if (this.speed > maxSpeed) {
        acceleration = -0.25;
      } else if (this.accelerating === this.braking) {
        acceleration = 0.00;
      } else if (this.accelerating) {
        acceleration = 0.25;
      } else {
        acceleration = -0.25;
      }
      if (acceleration > 0.00 && this.speed < maxSpeed) {
        return this.speed = min(maxSpeed, this.speed + acceleration);
      } else if (acceleration < 0.00 && this.speed > 0.00) {
        return this.speed = max(0.00, this.speed + acceleration);
      }
    };
    Tank.prototype.fixPosition = function() {
      var halftile, other, _i, _len, _ref, _results;
      if (this.cell.getTankSpeed(this) === 0) {
        halftile = TILE_SIZE_WORLD / 2;
        if (this.x % TILE_SIZE_WORLD >= halftile) {
          this.x++;
        } else {
          this.x--;
        }
        if (this.y % TILE_SIZE_WORLD >= halftile) {
          this.y++;
        } else {
          this.y--;
        }
        this.speed = max(0.00, this.speed - 1);
      }
      _ref = this.world.tanks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        other = _ref[_i];
        if (other !== this && other.armour !== 255) {
          _results.push(distance(this, other) <= 255 ? (other.x < this.x ? this.x++ : this.x--, other.y < this.y ? this.y++ : this.y--) : void 0);
        }
      }
      return _results;
    };
    Tank.prototype.move = function() {
      var ahead, dx, dy, newx, newy, oldcell, rad, slowDown;
      dx = dy = 0;
      if (this.speed > 0) {
        rad = (256 - this.getDirection16th() * 16) * 2 * PI / 256;
        dx += round(cos(rad) * ceil(this.speed));
        dy += round(sin(rad) * ceil(this.speed));
      }
      if (this.slideTicks > 0) {
        rad = (256 - this.getSlideDirection16th() * 16) * 2 * PI / 256;
        dx += round(cos(rad) * 16);
        dy += round(sin(rad) * 16);
        this.slideTicks--;
      }
      newx = this.x + dx;
      newy = this.y + dy;
      slowDown = true;
      if (dx !== 0) {
        ahead = dx > 0 ? newx + 64 : newx - 64;
        ahead = this.world.map.cellAtWorld(ahead, newy);
        if (ahead.getTankSpeed(this) !== 0) {
          slowDown = false;
          if (!(this.onBoat && !ahead.isType(' ', '^') && this.speed < 16)) {
            this.x = newx;
          }
        }
      }
      if (dy !== 0) {
        ahead = dy > 0 ? newy + 64 : newy - 64;
        ahead = this.world.map.cellAtWorld(newx, ahead);
        if (ahead.getTankSpeed(this) !== 0) {
          slowDown = false;
          if (!(this.onBoat && !ahead.isType(' ', '^') && this.speed < 16)) {
            this.y = newy;
          }
        }
      }
      if (!(dx === 0 && dy === 0)) {
        if (slowDown) {
          this.speed = max(0.00, this.speed - 1);
        }
        oldcell = this.cell;
        this.updateCell();
        if (oldcell !== this.cell) {
          this.checkNewCell(oldcell);
        }
      }
      if (!this.onBoat && this.speed <= 3 && this.cell.isType(' ')) {
        if (++this.waterTimer === 15) {
          if (this.shells !== 0 || this.mines !== 0) {
            this.soundEffect(sounds.BUBBLES);
          }
          this.shells = max(0, this.shells - 1);
          this.mines = max(0, this.mines - 1);
          return this.waterTimer = 0;
        }
      } else {
        return this.waterTimer = 0;
      }
    };
    Tank.prototype.checkNewCell = function(oldcell) {
      if (this.onBoat) {
        if (!this.cell.isType(' ', '^')) {
          this.leaveBoat(oldcell);
        }
      } else {
        if (this.cell.isType('^')) {
          return this.sink();
        }
        if (this.cell.isType('b')) {
          this.enterBoat();
        }
      }
      if (this.cell.mine) {
        return this.world.spawn(MineExplosion, this.cell);
      }
    };
    Tank.prototype.leaveBoat = function(oldcell) {
      var x, y;
      if (this.cell.isType('b')) {
        this.cell.setType(' ', false, 0);
        x = (this.cell.x + 0.5) * TILE_SIZE_WORLD;
        y = (this.cell.y + 0.5) * TILE_SIZE_WORLD;
        this.world.spawn(Explosion, x, y);
        return this.world.soundEffect(sounds.SHOT_BUILDING, x, y);
      } else {
        if (oldcell.isType(' ')) {
          oldcell.setType('b', false, 0);
        }
        return this.onBoat = false;
      }
    };
    Tank.prototype.enterBoat = function() {
      this.cell.setType(' ', false, 0);
      return this.onBoat = true;
    };
    Tank.prototype.sink = function() {
      this.world.soundEffect(sounds.TANK_SINKING, this.x, this.y);
      return this.kill();
    };
    Tank.prototype.kill = function() {
      this.dropPillboxes();
      this.x = this.y = null;
      this.armour = 255;
      return this.respawnTimer = 255;
    };
    Tank.prototype.dropPillboxes = function() {
      var cell, delta, ey, pill, pills, sy, width, x, y;
      pills = this.getCarryingPillboxes();
      if (pills.length === 0) {
        return;
      }
      x = this.cell.x;
      sy = this.cell.y;
      width = sqrt(pills.length);
      delta = floor(width / 2);
      width = round(width);
      x -= delta;
      sy -= delta;
      ey = sy + width;
      while (pills.length !== 0) {
        for (y = sy; (sy <= ey ? y < ey : y > ey); (sy <= ey ? y += 1 : y -= 1)) {
          cell = this.world.map.cellAtTile(x, y);
          if ((cell.base != null) || (cell.pill != null) || cell.isType('|', '}', 'b')) {
            continue;
          }
          if (!(pill = pills.pop())) {
            return;
          }
          pill.placeAt(cell);
        }
        x += 1;
      }
      return;
    };
    return Tank;
  }();
  module.exports = Tank;
}).call(this);

});
require.module('bolo/objects/fireball', function(module, exports, require) {
(function() {
  var BoloObject, Explosion, Fireball, PI, TILE_SIZE_WORLD, cos, round, sin, sounds;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, cos = Math.cos, sin = Math.sin, PI = Math.PI;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  sounds = require('../sounds');
  BoloObject = require('../object');
  Explosion = require('./explosion');
  Fireball = function() {
    function Fireball() {
      Fireball.__super__.constructor.apply(this, arguments);
    }
    __extends(Fireball, BoloObject);
    Fireball.prototype.styled = null;
    Fireball.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('B', 'direction');
        p('f', 'largeExplosion');
      }
      p('H', 'x');
      p('H', 'y');
      return p('B', 'lifespan');
    };
    Fireball.prototype.getDirection16th = function() {
      return round((this.direction - 1) / 16) % 16;
    };
    Fireball.prototype.spawn = function(x, y, direction, largeExplosion) {
      this.x = x;
      this.y = y;
      this.direction = direction;
      this.largeExplosion = largeExplosion;
      return this.lifespan = 80;
    };
    Fireball.prototype.update = function() {
      if (this.lifespan-- % 2 === 0) {
        if (this.wreck()) {
          return;
        }
        this.move();
      }
      if (this.lifespan === 0) {
        this.explode();
        return this.world.destroy(this);
      }
    };
    Fireball.prototype.wreck = function() {
      var cell;
      this.world.spawn(Explosion, this.x, this.y);
      cell = this.world.map.cellAtWorld(this.x, this.y);
      if (cell.isType('^')) {
        this.world.destroy(this);
        this.soundEffect(sounds.TANK_SINKING);
        return true;
      } else if (cell.isType('b')) {
        cell.setType(' ');
        this.soundEffect(sounds.SHOT_BUILDING);
      } else if (cell.isType('#')) {
        cell.setType('.');
        this.soundEffect(sounds.SHOT_TREE);
      }
      return false;
    };
    Fireball.prototype.move = function() {
      var ahead, dx, dy, newx, newy, radians;
      if (this.dx == null) {
        radians = (256 - this.direction) * 2 * PI / 256;
        this.dx = round(cos(radians) * 48);
        this.dy = round(sin(radians) * 48);
      }
      dx = this.dx, dy = this.dy;
      newx = this.x + dx;
      newy = this.y + dy;
      if (dx !== 0) {
        ahead = dx > 0 ? newx + 24 : newx - 24;
        ahead = this.world.map.cellAtWorld(ahead, newy);
        if (!ahead.isObstacle()) {
          this.x = newx;
        }
      }
      if (dy !== 0) {
        ahead = dy > 0 ? newy + 24 : newy - 24;
        ahead = this.world.map.cellAtWorld(newx, ahead);
        if (!ahead.isObstacle()) {
          return this.y = newy;
        }
      }
    };
    Fireball.prototype.explode = function() {
      var builder, cell, cells, dx, dy, tank, x, y, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
      cells = [this.world.map.cellAtWorld(this.x, this.y)];
      if (this.largeExplosion) {
        dx = this.dx > 0 ? 1 : -1;
        dy = this.dy > 0 ? 1 : -1;
        cells.push(cells[0].neigh(dx, 0));
        cells.push(cells[0].neigh(0, dy));
        cells.push(cells[0].neigh(dx, dy));
        this.soundEffect(sounds.BIG_EXPLOSION);
      } else {
        this.soundEffect(sounds.MINE_EXPLOSION);
      }
      _results = [];
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        cell.takeExplosionHit();
        _ref = this.world.tanks;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          tank = _ref[_j];
          if (builder = tank.builder.$) {
            if ((_ref2 = builder.order) !== builder.states.inTank && _ref2 !== builder.states.parachuting) {
              if (builder.cell === cell) {
                builder.kill();
              }
            }
          }
        }
        _ref3 = cell.getWorldCoordinates(), x = _ref3[0], y = _ref3[1];
        _results.push(this.world.spawn(Explosion, x, y));
      }
      return _results;
    };
    return Fireball;
  }();
  module.exports = Fireball;
}).call(this);

});
require.module('bolo/objects/builder', function(module, exports, require) {
(function() {
  var BoloObject, Builder, MineExplosion, TILE_SIZE_WORLD, ceil, cos, distance, floor, heading, min, round, sin, sounds, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, floor = Math.floor, ceil = Math.ceil, min = Math.min, cos = Math.cos, sin = Math.sin;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  _ref = require('../helpers'), distance = _ref.distance, heading = _ref.heading;
  BoloObject = require('../object');
  sounds = require('../sounds');
  MineExplosion = require('./mine_explosion');
  Builder = function() {
    function Builder(world) {
      this.world = world;
      this.on('netUpdate', __bind(function(changes) {
        if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y')) {
          return this.updateCell();
        }
      }, this));
    }
    __extends(Builder, BoloObject);
    Builder.prototype.states = {
      inTank: 0,
      waiting: 1,
      returning: 2,
      parachuting: 3,
      actions: {
        _min: 10,
        forest: 10,
        road: 11,
        repair: 12,
        boat: 13,
        building: 14,
        pillbox: 15,
        mine: 16
      }
    };
    Builder.prototype.styled = true;
    Builder.prototype.updateCell = function() {
      return this.cell = (this.x != null) && (this.y != null) ? this.world.map.cellAtWorld(this.x, this.y) : null;
    };
    Builder.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('O', 'owner');
      }
      p('B', 'order');
      if (this.order === this.states.inTank) {
        this.x = this.y = null;
      } else {
        p('H', 'x');
        p('H', 'y');
        p('H', 'targetX');
        p('H', 'targetY');
        p('B', 'trees');
        p('O', 'pillbox');
        p('f', 'hasMine');
      }
      if (this.order === this.states.waiting) {
        return p('B', 'waitTimer');
      }
    };
    Builder.prototype.getTile = function() {
      if (this.order === this.states.parachuting) {
        return [16, 1];
      } else {
        return [17, floor(this.animation / 3)];
      }
    };
    Builder.prototype.performOrder = function(action, trees, cell) {
      var pill, _ref;
      if (this.order !== this.states.inTank) {
        return;
      }
      if (!(this.owner.$.onBoat || this.owner.$.cell === cell || this.owner.$.cell.getManSpeed(this) > 0)) {
        return;
      }
      pill = null;
      if (action === 'mine') {
        if (this.owner.$.mines === 0) {
          return;
        }
        trees = 0;
      } else {
        if (this.owner.$.trees < trees) {
          return;
        }
        if (action === 'pillbox') {
          if (!(pill = this.owner.$.getCarryingPillboxes().pop())) {
            return;
          }
          pill.inTank = false;
          pill.carried = true;
        }
      }
      this.trees = trees;
      this.hasMine = action === 'mine';
      this.ref('pillbox', pill);
      if (this.hasMine) {
        this.owner.$.mines--;
      }
      this.owner.$.trees -= trees;
      this.order = this.states.actions[action];
      this.x = this.owner.$.x;
      this.y = this.owner.$.y;
      _ref = cell.getWorldCoordinates(), this.targetX = _ref[0], this.targetY = _ref[1];
      return this.updateCell();
    };
    Builder.prototype.kill = function() {
      var startingPos, _ref, _ref2, _ref3;
      if (!this.world.authority) {
        return;
      }
      this.soundEffect(sounds.MAN_DYING);
      this.order = this.states.parachuting;
      this.trees = 0;
      this.hasMine = false;
      if (this.pillbox) {
        this.pillbox.$.placeAt(this.cell);
        this.ref('pillbox', null);
      }
      if (this.owner.$.armour === 255) {
        _ref = [this.x, this.y], this.targetX = _ref[0], this.targetY = _ref[1];
      } else {
        _ref2 = [this.owner.$.x, this.owner.$.y], this.targetX = _ref2[0], this.targetY = _ref2[1];
      }
      startingPos = this.world.map.getRandomStart();
      return _ref3 = startingPos.cell.getWorldCoordinates(), this.x = _ref3[0], this.y = _ref3[1], _ref3;
    };
    Builder.prototype.spawn = function(owner) {
      this.ref('owner', owner);
      return this.order = this.states.inTank;
    };
    Builder.prototype.anySpawn = function() {
      this.team = this.owner.$.team;
      return this.animation = 0;
    };
    Builder.prototype.update = function() {
      if (this.order === this.states.inTank) {
        return;
      }
      this.animation = (this.animation + 1) % 9;
      switch (this.order) {
        case this.states.waiting:
          if (this.waitTimer-- === 0) {
            return this.order = this.states.returning;
          }
          break;
        case this.states.parachuting:
          return this.parachutingIn({
            x: this.targetX,
            y: this.targetY
          });
        case this.states.returning:
          if (this.owner.$.armour !== 255) {
            return this.move(this.owner.$, 128, 160);
          }
          break;
        default:
          return this.move({
            x: this.targetX,
            y: this.targetY
          }, 16, 144);
      }
    };
    Builder.prototype.move = function(target, targetRadius, boatRadius) {
      var ahead, dx, dy, movementAxes, newx, newy, onBoat, rad, speed, targetCell;
      speed = this.cell.getManSpeed(this);
      onBoat = false;
      targetCell = this.world.map.cellAtWorld(this.targetX, this.targetY);
      if (speed === 0 && this.cell === targetCell) {
        speed = 16;
      }
      if (this.owner.$.armour !== 255 && this.owner.$.onBoat && distance(this, this.owner.$) < boatRadius) {
        onBoat = true;
        speed = 16;
      }
      speed = min(speed, distance(this, target));
      rad = heading(this, target);
      newx = this.x + (dx = round(cos(rad) * ceil(speed)));
      newy = this.y + (dy = round(sin(rad) * ceil(speed)));
      movementAxes = 0;
      if (dx !== 0) {
        ahead = this.world.map.cellAtWorld(newx, this.y);
        if (onBoat || ahead === targetCell || ahead.getManSpeed(this) > 0) {
          this.x = newx;
          movementAxes++;
        }
      }
      if (dy !== 0) {
        ahead = this.world.map.cellAtWorld(this.x, newy);
        if (onBoat || ahead === targetCell || ahead.getManSpeed(this) > 0) {
          this.y = newy;
          movementAxes++;
        }
      }
      if (movementAxes === 0) {
        return this.order = this.states.returning;
      } else {
        this.updateCell();
        if (distance(this, target) <= targetRadius) {
          return this.reached();
        }
      }
    };
    Builder.prototype.reached = function() {
      var used;
      if (this.order === this.states.returning) {
        this.order = this.states.inTank;
        this.x = this.y = null;
        if (this.pillbox) {
          this.pillbox.$.inTank = true;
          this.pillbox.$.carried = false;
          this.ref('pillbox', null);
        }
        this.owner.$.trees = min(40, this.owner.$.trees + this.trees);
        this.trees = 0;
        if (this.hasMine) {
          this.owner.$.mines = min(40, this.owner.$.mines + 1);
        }
        this.hasMine = false;
        return;
      }
      if (this.cell.mine) {
        this.world.spawn(MineExplosion, this.cell);
        this.order = this.states.waiting;
        this.waitTimer = 20;
        return;
      }
      switch (this.order) {
        case this.states.actions.forest:
          if (this.cell.base || this.cell.pill || !this.cell.isType('#')) {
            break;
          }
          this.cell.setType('.');
          this.trees = 4;
          this.soundEffect(sounds.FARMING_TREE);
          break;
        case this.states.actions.road:
          if (this.cell.base || this.cell.pill || this.cell.isType('|', '}', 'b', '^', '#', '=')) {
            break;
          }
          if (this.cell.isType(' ') && this.cell.hasTankOnBoat()) {
            break;
          }
          this.cell.setType('=');
          this.trees = 0;
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.repair:
          if (this.cell.pill) {
            used = this.cell.pill.repair(this.trees);
            this.trees -= used;
          } else if (this.cell.isType('}')) {
            this.cell.setType('|');
            this.trees = 0;
          } else {
            break;
          }
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.boat:
          if (!(this.cell.isType(' ') && !this.cell.hasTankOnBoat())) {
            break;
          }
          this.cell.setType('b');
          this.trees = 0;
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.building:
          if (this.cell.base || this.cell.pill || this.cell.isType('b', '^', '#', '}', '|', ' ')) {
            break;
          }
          this.cell.setType('|');
          this.trees = 0;
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.pillbox:
          if (this.cell.pill || this.cell.base || this.cell.isType('b', '^', '#', '|', '}', ' ')) {
            break;
          }
          this.pillbox.$.armour = 15;
          this.trees = 0;
          this.pillbox.$.placeAt(this.cell);
          this.ref('pillbox', null);
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.mine:
          if (this.cell.base || this.cell.pill || this.cell.isType('^', ' ', '|', 'b', '}')) {
            break;
          }
          this.cell.setType(null, true, 0);
          this.hasMine = false;
          this.soundEffect(sounds.MAN_LAY_MINE);
      }
      this.order = this.states.waiting;
      return this.waitTimer = 20;
    };
    Builder.prototype.parachutingIn = function(target) {
      var rad;
      if (distance(this, target) <= 16) {
        return this.order = this.states.returning;
      } else {
        rad = heading(this, target);
        this.x += round(cos(rad) * 3);
        this.y += round(sin(rad) * 3);
        return this.updateCell();
      }
    };
    return Builder;
  }();
  module.exports = Builder;
}).call(this);

});
require.module('bolo/client/base64', function(module, exports, require) {
(function() {
  var decodeBase64;
  decodeBase64 = function(input) {
    var c, cc, i, output, outputIndex, outputLength, quad, quadIndex, tail, _len;
    if (input.length % 4 !== 0) {
      throw new Error("Invalid base64 input length, not properly padded?");
    }
    outputLength = input.length / 4 * 3;
    tail = input.substr(-2);
    if (tail[0] === '=') {
      outputLength--;
    }
    if (tail[1] === '=') {
      outputLength--;
    }
    output = new Array(outputLength);
    quad = new Array(4);
    outputIndex = 0;
    for (i = 0, _len = input.length; i < _len; i++) {
      c = input[i];
      cc = c.charCodeAt(0);
      quadIndex = i % 4;
      quad[quadIndex] = function() {
        if (65 <= cc && cc <= 90) {
          return cc - 65;
        } else if (97 <= cc && cc <= 122) {
          return cc - 71;
        } else if (48 <= cc && cc <= 57) {
          return cc + 4;
        } else if (cc === 43) {
          return 62;
        } else if (cc === 47) {
          return 63;
        } else if (cc === 61) {
          return -1;
        } else {
          throw new Error("Invalid base64 input character: " + c);
        }
      }();
      if (quadIndex !== 3) {
        continue;
      }
      output[outputIndex++] = ((quad[0] & 0x3F) << 2) + ((quad[1] & 0x30) >> 4);
      if (quad[2] !== -1) {
        output[outputIndex++] = ((quad[1] & 0x0F) << 4) + ((quad[2] & 0x3C) >> 2);
      }
      if (quad[3] !== -1) {
        output[outputIndex++] = ((quad[2] & 0x03) << 6) + (quad[3] & 0x3F);
      }
    }
    return output;
  };
  exports.decodeBase64 = decodeBase64;
}).call(this);

});
require.module('bolo/client/world/mixin', function(module, exports, require) {
(function() {
  var BoloClientWorldMixin, BoloWorldMixin, DefaultRenderer, Loop, Progress, SoundKit, TICK_LENGTH_MS, Vignette, helpers;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Loop = require('villain/loop');
  Progress = require('../progress');
  Vignette = require('../vignette');
  SoundKit = require('../soundkit');
  DefaultRenderer = require('../renderer/offscreen_2d');
  TICK_LENGTH_MS = require('../../constants').TICK_LENGTH_MS;
  helpers = require('../../helpers');
  BoloWorldMixin = require('../../world_mixin');
  BoloClientWorldMixin = {
    start: function() {
      var vignette;
      vignette = new Vignette();
      return this.waitForCache(vignette, __bind(function() {
        return this.loadResources(vignette, __bind(function() {
          return this.loaded(vignette);
        }, this));
      }, this));
    },
    waitForCache: function(vignette, callback) {
      var afterCache, cache;
      if (typeof applicationCache == "undefined" || applicationCache === null) {
        return callback();
      }
      vignette.message('Checking for newer versions');
      cache = $(applicationCache);
      cache.bind('downloading.bolo', function() {
        vignette.message('Downloading latest version');
        vignette.showProgress();
        return cache.bind('progress.bolo', function(p) {
          return vignette.progress(p);
        });
      });
      cache.bind('updateready.bolo', function() {
        vignette.hideProgress();
        vignette.message('Reloading latest version');
        return location.reload();
      });
      afterCache = function() {
        vignette.hideProgress();
        cache.unbind('.bolo');
        return callback();
      };
      cache.bind('cached.bolo', afterCache);
      return cache.bind('noupdate.bolo', afterCache);
    },
    loadResources: function(vignette, callback) {
      var progress;
      vignette.message('Loading resources');
      progress = new Progress();
      this.images = {};
      this.loadImages(__bind(function(name) {
        var img;
        this.images[name] = img = new Image();
        $(img).load(progress.add());
        return img.src = "images/" + name + ".png";
      }, this));
      this.soundkit = new SoundKit();
      this.loadSounds(__bind(function(name) {
        var i, methodName, parts, src, _ref;
        src = "sounds/" + name + ".ogg";
        parts = name.split('_');
        for (i = 1, _ref = parts.length; (1 <= _ref ? i < _ref : i > _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1);
        }
        methodName = parts.join('');
        return this.soundkit.load(methodName, src, progress.add());
      }, this));
      if (typeof applicationCache == "undefined" || applicationCache === null) {
        vignette.showProgress();
        progress.on('progress', function(p) {
          return vignette.progress(p);
        });
      }
      progress.on('complete', function() {
        vignette.hideProgress();
        return callback();
      });
      return progress.wrapUp();
    },
    loadImages: function(i) {
      i('base');
      i('styled');
      return i('overlay');
    },
    loadSounds: function(s) {
      s('big_explosion_far');
      s('big_explosion_near');
      s('bubbles');
      s('farming_tree_far');
      s('farming_tree_near');
      s('hit_tank_far');
      s('hit_tank_near');
      s('hit_tank_self');
      s('man_building_far');
      s('man_building_near');
      s('man_dying_far');
      s('man_dying_near');
      s('man_lay_mine_near');
      s('mine_explosion_far');
      s('mine_explosion_near');
      s('shooting_far');
      s('shooting_near');
      s('shooting_self');
      s('shot_building_far');
      s('shot_building_near');
      s('shot_tree_far');
      s('shot_tree_near');
      s('tank_sinking_far');
      return s('tank_sinking_near');
    },
    commonInitialization: function() {
      this.renderer = new DefaultRenderer(this);
      this.map.world = this;
      this.map.setView(this.renderer);
      this.boloInit();
      this.loop = new Loop(this);
      this.loop.tickRate = TICK_LENGTH_MS;
      this.increasingRange = false;
      this.decreasingRange = false;
      this.rangeAdjustTimer = 0;
      this.input = $('<input/>', {
        id: 'input-dummy',
        type: 'text',
        autocomplete: 'off'
      });
      this.input.insertBefore(this.renderer.canvas).focus();
      return this.input.add(this.renderer.canvas).add('#tool-select label').keydown(__bind(function(e) {
        e.preventDefault();
        switch (e.which) {
          case 90:
            return this.increasingRange = true;
          case 88:
            return this.decreasingRange = true;
          default:
            return this.handleKeydown(e);
        }
      }, this)).keyup(__bind(function(e) {
        e.preventDefault();
        switch (e.which) {
          case 90:
            return this.increasingRange = false;
          case 88:
            return this.decreasingRange = false;
          default:
            return this.handleKeyup(e);
        }
      }, this));
    },
    idle: function() {
      return this.renderer.draw();
    },
    failure: function(message) {
      var _ref;
      if ((_ref = this.loop) != null) {
        _ref.stop();
      }
      return $('<div/>').text(message).dialog({
        modal: true,
        dialogClass: 'unclosable'
      });
    },
    checkBuildOrder: function(action, cell) {
      var builder, flexible, pills, trees, _ref;
      builder = this.player.builder.$;
      if (builder.order !== builder.states.inTank) {
        return [false];
      }
      if (cell.mine) {
        return [false];
      }
      _ref = function() {
        switch (action) {
          case 'forest':
            if (cell.base || cell.pill || !cell.isType('#')) {
              return [false];
            } else {
              return ['forest', 0];
            }
            break;
          case 'road':
            if (cell.base || cell.pill || cell.isType('|', '}', 'b', '^')) {
              return [false];
            } else if (cell.isType('#')) {
              return ['forest', 0];
            } else if (cell.isType('=')) {
              return [false];
            } else if (cell.isType(' ') && cell.hasTankOnBoat()) {
              return [false];
            } else {
              return ['road', 2];
            }
            break;
          case 'building':
            if (cell.base || cell.pill || cell.isType('b', '^')) {
              return [false];
            } else if (cell.isType('#')) {
              return ['forest', 0];
            } else if (cell.isType('}')) {
              return ['repair', 1];
            } else if (cell.isType('|')) {
              return [false];
            } else if (cell.isType(' ')) {
              if (cell.hasTankOnBoat()) {
                return [false];
              } else {
                return ['boat', 20];
              }
            } else if (cell === this.player.cell) {
              return [false];
            } else {
              return ['building', 2];
            }
            break;
          case 'pillbox':
            if (cell.pill) {
              if (cell.pill.armour === 16) {
                return [false];
              } else if (cell.pill.armour >= 11) {
                return ['repair', 1, true];
              } else if (cell.pill.armour >= 7) {
                return ['repair', 2, true];
              } else if (cell.pill.armour >= 3) {
                return ['repair', 3, true];
              } else if (cell.pill.armour < 3) {
                return ['repair', 4, true];
              }
            } else if (cell.isType('#')) {
              return ['forest', 0];
            } else if (cell.base || cell.isType('b', '^', '|', '}', ' ')) {
              return [false];
            } else if (cell === this.player.cell) {
              return [false];
            } else {
              return ['pillbox', 4];
            }
            break;
          case 'mine':
            if (cell.base || cell.pill || cell.isType('^', ' ', '|', 'b', '}')) {
              return [false];
            } else {
              return ['mine'];
            }
        }
      }.call(this), action = _ref[0], trees = _ref[1], flexible = _ref[2];
      if (!action) {
        return [false];
      }
      if (action === 'mine') {
        if (this.player.mines === 0) {
          return [false];
        }
        return ['mine'];
      }
      if (action === 'pill') {
        pills = this.player.getCarryingPillboxes();
        if (pills.length === 0) {
          return [false];
        }
      }
      if (this.player.trees < trees) {
        if (!flexible) {
          return [false];
        }
        trees = this.player.trees;
      }
      return [action, trees, flexible];
    }
  };
  helpers.extend(BoloClientWorldMixin, BoloWorldMixin);
  module.exports = BoloClientWorldMixin;
}).call(this);

});
require.module('villain/loop', function(module, exports, require) {
(function() {
  var Loop;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Loop = function() {
    function Loop(handler) {
      this.handler = handler;
      this.timer = null;
    }
    Loop.prototype.tickRate = 50;
    Loop.prototype.start = function() {
      var last;
      if (this.timer) {
        return;
      }
      last = Date.now();
      this.timer = setInterval(__bind(function() {
        var now;
        now = Date.now();
        while (now - last >= this.tickRate) {
          this.handler.tick();
          last += this.tickRate;
        }
        return this.handler.idle();
      }, this), this.tickRate);
      return;
    };
    Loop.prototype.stop = function() {
      if (!this.timer) {
        return;
      }
      clearInterval(this.timer);
      return this.timer = null;
    };
    return Loop;
  }();
  module.exports = Loop;
}).call(this);

});
require.module('bolo/client/progress', function(module, exports, require) {
(function() {
  var EventEmitter, Progress;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  Progress = function() {
    function Progress(initialAmount) {
      this.lengthComputable = true;
      this.loaded = 0;
      this.total = initialAmount != null ? initialAmount : 0;
      this.wrappingUp = false;
    }
    __extends(Progress, EventEmitter);
    Progress.prototype.add = function() {
      var amount, args, cb;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof args[0] === 'number') {
        amount = args.shift();
      } else {
        amount = 1;
      }
      if (typeof args[0] === 'function') {
        cb = args.shift();
      } else {
        cb = null;
      }
      this.total += amount;
      this.emit('progress', this);
      return __bind(function() {
        this.step(amount);
        return typeof cb === "function" ? cb() : void 0;
      }, this);
    };
    Progress.prototype.step = function(amount) {
      if (amount == null) {
        amount = 1;
      }
      this.loaded += amount;
      this.emit('progress', this);
      return this.checkComplete();
    };
    Progress.prototype.set = function(total, loaded) {
      this.total = total;
      this.loaded = loaded;
      this.emit('progress', this);
      return this.checkComplete();
    };
    Progress.prototype.wrapUp = function() {
      this.wrappingUp = true;
      return this.checkComplete();
    };
    Progress.prototype.checkComplete = function() {
      if (!(this.wrappingUp && this.loaded >= this.total)) {
        return;
      }
      return this.emit('complete');
    };
    return Progress;
  }();
  module.exports = Progress;
}).call(this);

});
require.module('bolo/client/vignette', function(module, exports, require) {
(function() {
  var Vignette;
  Vignette = function() {
    function Vignette() {
      this.container = $('<div class="vignette"/>').appendTo('body');
      this.messageLine = $('<div class="vignette-message"/>').appendTo(this.container);
    }
    Vignette.prototype.message = function(text) {
      return this.messageLine.text(text);
    };
    Vignette.prototype.showProgress = function() {};
    Vignette.prototype.hideProgress = function() {};
    Vignette.prototype.progress = function(p) {};
    Vignette.prototype.destroy = function() {
      this.container.remove();
      return this.container = this.messageLine = null;
    };
    return Vignette;
  }();
  module.exports = Vignette;
}).call(this);

});
require.module('bolo/client/soundkit', function(module, exports, require) {
(function() {
  var SoundKit;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  SoundKit = function() {
    function SoundKit() {
      var dummy;
      this.sounds = {};
      this.isSupported = false;
      if (typeof Audio != "undefined" && Audio !== null) {
        dummy = new Audio();
        this.isSupported = dummy.canPlayType != null;
      }
    }
    SoundKit.prototype.register = function(name, url) {
      this.sounds[name] = url;
      return this[name] = __bind(function() {
        return this.play(name);
      }, this);
    };
    SoundKit.prototype.load = function(name, url, cb) {
      var loader;
      this.register(name, url);
      if (!this.isSupported) {
        return typeof cb === "function" ? cb() : void 0;
      }
      loader = new Audio();
      if (cb) {
        $(loader).one('canplaythrough', cb);
      }
      $(loader).one('error', __bind(function(e) {
        switch (e.code) {
          case e.MEDIA_ERR_SRC_NOT_SUPPORTED:
            this.isSupported = false;
            return typeof cb === "function" ? cb() : void 0;
        }
      }, this));
      loader.src = url;
      return loader.load();
    };
    SoundKit.prototype.play = function(name) {
      var effect;
      if (!this.isSupported) {
        return;
      }
      effect = new Audio();
      effect.src = this.sounds[name];
      effect.play();
      return effect;
    };
    return SoundKit;
  }();
  module.exports = SoundKit;
}).call(this);

});
require.module('bolo/client/renderer/offscreen_2d', function(module, exports, require) {
(function() {
  var CachedSegment, Common2dRenderer, MAP_SIZE_SEGMENTS, MAP_SIZE_TILES, Offscreen2dRenderer, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_TILES, TILE_SIZE_PIXELS, floor, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  floor = Math.floor;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, MAP_SIZE_TILES = _ref.MAP_SIZE_TILES;
  Common2dRenderer = require('./common_2d');
  SEGMENT_SIZE_TILES = 16;
  MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES;
  SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXELS;
  CachedSegment = function() {
    function CachedSegment(renderer, x, y) {
      this.renderer = renderer;
      this.sx = x * SEGMENT_SIZE_TILES;
      this.sy = y * SEGMENT_SIZE_TILES;
      this.ex = this.sx + SEGMENT_SIZE_TILES - 1;
      this.ey = this.sy + SEGMENT_SIZE_TILES - 1;
      this.psx = x * SEGMENT_SIZE_PIXEL;
      this.psy = y * SEGMENT_SIZE_PIXEL;
      this.pex = this.psx + SEGMENT_SIZE_PIXEL - 1;
      this.pey = this.psy + SEGMENT_SIZE_PIXEL - 1;
      this.canvas = null;
    }
    CachedSegment.prototype.isInView = function(sx, sy, ex, ey) {
      if (ex < this.psx || ey < this.psy) {
        return false;
      } else if (sx > this.pex || sy > this.pey) {
        return false;
      } else {
        return true;
      }
    };
    CachedSegment.prototype.build = function() {
      this.canvas = $('<canvas/>')[0];
      this.canvas.width = this.canvas.height = SEGMENT_SIZE_PIXEL;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.translate(-this.psx, -this.psy);
      return this.renderer.world.map.each(__bind(function(cell) {
        return this.onRetile(cell, cell.tile[0], cell.tile[1]);
      }, this), this.sx, this.sy, this.ex, this.ey);
    };
    CachedSegment.prototype.clear = function() {
      return this.canvas = this.ctx = null;
    };
    CachedSegment.prototype.onRetile = function(cell, tx, ty) {
      var obj, _ref;
      if (!this.canvas) {
        return;
      }
      if (obj = cell.pill || cell.base) {
        return this.renderer.drawStyledTile(cell.tile[0], cell.tile[1], (_ref = obj.owner) != null ? _ref.$.team : void 0, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx);
      } else {
        return this.renderer.drawTile(cell.tile[0], cell.tile[1], cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx);
      }
    };
    return CachedSegment;
  }();
  Offscreen2dRenderer = function() {
    function Offscreen2dRenderer() {
      Offscreen2dRenderer.__super__.constructor.apply(this, arguments);
    }
    __extends(Offscreen2dRenderer, Common2dRenderer);
    Offscreen2dRenderer.prototype.setup = function() {
      var row, x, y, _results, _results2;
      Offscreen2dRenderer.__super__.setup.apply(this, arguments);
      this.cache = new Array(MAP_SIZE_SEGMENTS);
      _results = [];
      for (y = 0; (0 <= MAP_SIZE_SEGMENTS ? y < MAP_SIZE_SEGMENTS : y > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? y += 1 : y -= 1)) {
        row = this.cache[y] = new Array(MAP_SIZE_SEGMENTS);
        _results.push(function() {
          _results2 = [];
          for (x = 0; (0 <= MAP_SIZE_SEGMENTS ? x < MAP_SIZE_SEGMENTS : x > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? x += 1 : x -= 1)) {
            _results2.push(row[x] = new CachedSegment(this, x, y));
          }
          return _results2;
        }.call(this));
      }
      return _results;
    };
    Offscreen2dRenderer.prototype.onRetile = function(cell, tx, ty) {
      var segx, segy;
      cell.tile = [tx, ty];
      segx = floor(cell.x / SEGMENT_SIZE_TILES);
      segy = floor(cell.y / SEGMENT_SIZE_TILES);
      return this.cache[segy][segx].onRetile(cell, tx, ty);
    };
    Offscreen2dRenderer.prototype.drawMap = function(sx, sy, w, h) {
      var alreadyBuiltOne, ex, ey, row, segment, _i, _j, _len, _len2, _ref;
      ex = sx + w - 1;
      ey = sy + h - 1;
      alreadyBuiltOne = false;
      _ref = this.cache;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          segment = row[_j];
          if (!segment.isInView(sx, sy, ex, ey)) {
            if (segment.canvas) {
              segment.clear();
            }
            continue;
          }
          if (!segment.canvas) {
            if (alreadyBuiltOne) {
              continue;
            }
            segment.build();
            alreadyBuiltOne = true;
          }
          this.ctx.drawImage(segment.canvas, 0, 0, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL, segment.psx, segment.psy, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL);
        }
      }
      return;
    };
    return Offscreen2dRenderer;
  }();
  module.exports = Offscreen2dRenderer;
}).call(this);

});
require.module('bolo/client/renderer/common_2d', function(module, exports, require) {
(function() {
  var BaseRenderer, Common2dRenderer, PI, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, cos, distance, heading, min, round, sin, _ref, _ref2;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  min = Math.min, round = Math.round, PI = Math.PI, sin = Math.sin, cos = Math.cos;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
  _ref2 = require('../../helpers'), distance = _ref2.distance, heading = _ref2.heading;
  BaseRenderer = require('./base');
  TEAM_COLORS = require('../../team_colors');
  Common2dRenderer = function() {
    function Common2dRenderer() {
      Common2dRenderer.__super__.constructor.apply(this, arguments);
    }
    __extends(Common2dRenderer, BaseRenderer);
    Common2dRenderer.prototype.setup = function() {
      var ctx, imageData, img, temp;
      try {
        this.ctx = this.canvas[0].getContext('2d');
        this.ctx.drawImage;
      } catch (e) {
        throw "Could not initialize 2D canvas: " + e.message;
      }
      img = this.images.overlay;
      temp = $('<canvas/>')[0];
      temp.width = img.width;
      temp.height = img.height;
      ctx = temp.getContext('2d');
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, img.width, img.height);
      this.overlay = imageData.data;
      return this.prestyled = {};
    };
    Common2dRenderer.prototype.drawTile = function(tx, ty, dx, dy, ctx) {
      return (ctx || this.ctx).drawImage(this.images.base, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
    };
    Common2dRenderer.prototype.createPrestyled = function(color) {
      var base, ctx, data, factor, height, i, imageData, source, width, x, y;
      base = this.images.styled;
      width = base.width, height = base.height;
      source = $('<canvas/>')[0];
      source.width = width;
      source.height = height;
      ctx = source.getContext('2d');
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(base, 0, 0);
      imageData = ctx.getImageData(0, 0, width, height);
      data = imageData.data;
      for (x = 0; (0 <= width ? x < width : x > width); (0 <= width ? x += 1 : x -= 1)) {
        for (y = 0; (0 <= height ? y < height : y > height); (0 <= height ? y += 1 : y -= 1)) {
          i = 4 * (y * width + x);
          factor = this.overlay[i] / 255;
          data[i + 0] = round(factor * color.r + (1 - factor) * data[i + 0]);
          data[i + 1] = round(factor * color.g + (1 - factor) * data[i + 1]);
          data[i + 2] = round(factor * color.b + (1 - factor) * data[i + 2]);
          data[i + 3] = min(255, data[i + 3] + this.overlay[i]);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      return source;
    };
    Common2dRenderer.prototype.drawStyledTile = function(tx, ty, style, dx, dy, ctx) {
      var color, source;
      if (!(source = this.prestyled[style])) {
        source = (color = TEAM_COLORS[style]) ? this.prestyled[style] = this.createPrestyled(color) : this.images.styled;
      }
      return (ctx || this.ctx).drawImage(source, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
    };
    Common2dRenderer.prototype.centerOn = function(x, y, cb) {
      var height, left, top, width, _ref;
      this.ctx.save();
      _ref = this.getViewAreaAtWorld(x, y), left = _ref[0], top = _ref[1], width = _ref[2], height = _ref[3];
      this.ctx.translate(-left, -top);
      cb(left, top, width, height);
      return this.ctx.restore();
    };
    Common2dRenderer.prototype.drawBuilderIndicator = function(b) {
      var dist, offset, player, px, py, rad, x, y;
      player = b.owner.$;
      if ((dist = distance(player, b)) <= 128) {
        return;
      }
      px = player.x / PIXEL_SIZE_WORLD;
      py = player.y / PIXEL_SIZE_WORLD;
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = min(1.0, (dist - 128) / 1024);
      offset = min(50, dist / 10240 * 50) + 32;
      rad = heading(player, b);
      this.ctx.beginPath();
      this.ctx.moveTo(x = px + cos(rad) * offset, y = py + sin(rad) * offset);
      rad += PI;
      this.ctx.lineTo(x + cos(rad - 0.4) * 10, y + sin(rad - 0.4) * 10);
      this.ctx.lineTo(x + cos(rad + 0.4) * 10, y + sin(rad + 0.4) * 10);
      this.ctx.closePath();
      this.ctx.fillStyle = 'yellow';
      this.ctx.fill();
      return this.ctx.restore();
    };
    Common2dRenderer.prototype.drawNames = function() {
      var dist, metrics, player, tank, x, y, _i, _len, _ref;
      this.ctx.save();
      this.ctx.strokeStyle = this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textBaselines = 'alphabetic';
      this.ctx.textAlign = 'left';
      player = this.world.player;
      _ref = this.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.name && tank.armour !== 255 && tank !== player) {
          if (player) {
            if ((dist = distance(player, tank)) <= 768) {
              continue;
            }
            this.ctx.globalAlpha = min(1.0, (dist - 768) / 1536);
          } else {
            this.ctx.globalAlpha = 1.0;
          }
          metrics = this.ctx.measureText(tank.name);
          this.ctx.beginPath();
          this.ctx.moveTo(x = round(tank.x / PIXEL_SIZE_WORLD) + 16, y = round(tank.y / PIXEL_SIZE_WORLD) - 16);
          this.ctx.lineTo(x += 12, y -= 9);
          this.ctx.lineTo(x + metrics.width, y);
          this.ctx.stroke();
          this.ctx.fillText(tank.name, x, y - 2);
        }
      }
      return this.ctx.restore();
    };
    return Common2dRenderer;
  }();
  module.exports = Common2dRenderer;
}).call(this);

});
require.module('bolo/client/renderer/base', function(module, exports, require) {
(function() {
  var BaseRenderer, MAP_SIZE_PIXELS, PI, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, cos, max, min, round, sin, sounds, sqrt, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty;
  min = Math.min, max = Math.max, round = Math.round, cos = Math.cos, sin = Math.sin, PI = Math.PI, sqrt = Math.sqrt;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD, MAP_SIZE_PIXELS = _ref.MAP_SIZE_PIXELS;
  sounds = require('../../sounds');
  TEAM_COLORS = require('../../team_colors');
  BaseRenderer = function() {
    function BaseRenderer(world) {
      this.world = world;
      this.images = this.world.images;
      this.soundkit = this.world.soundkit;
      this.canvas = $('<canvas/>').appendTo('body');
      this.lastCenter = this.world.map.findCenterCell().getWorldCoordinates();
      this.mouse = [0, 0];
      this.canvas.click(__bind(function(e) {
        return this.handleClick(e);
      }, this));
      this.canvas.mousemove(__bind(function(e) {
        return this.mouse = [e.pageX, e.pageY];
      }, this));
      this.setup();
      this.handleResize();
      $(window).resize(__bind(function() {
        return this.handleResize();
      }, this));
    }
    BaseRenderer.prototype.setup = function() {};
    BaseRenderer.prototype.centerOn = function(x, y, cb) {};
    BaseRenderer.prototype.drawTile = function(tx, ty, sdx, sdy) {};
    BaseRenderer.prototype.drawStyledTile = function(tx, ty, style, sdx, sdy) {};
    BaseRenderer.prototype.drawMap = function(sx, sy, w, h) {};
    BaseRenderer.prototype.drawBuilderIndicator = function(builder) {};
    BaseRenderer.prototype.onRetile = function(cell, tx, ty) {};
    BaseRenderer.prototype.draw = function() {
      var x, y, _ref, _ref2, _ref3;
      if (this.world.player) {
        _ref = this.world.player, x = _ref.x, y = _ref.y;
        if (this.world.player.fireball != null) {
          _ref2 = this.world.player.fireball.$, x = _ref2.x, y = _ref2.y;
        }
      } else {
        x = y = null;
      }
      if (!((x != null) && (y != null))) {
        _ref3 = this.lastCenter, x = _ref3[0], y = _ref3[1];
      } else {
        this.lastCenter = [x, y];
      }
      this.centerOn(x, y, __bind(function(left, top, width, height) {
        var obj, ox, oy, tx, ty, _i, _len, _ref, _ref2;
        this.drawMap(left, top, width, height);
        _ref = this.world.objects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          if ((obj.styled != null) && (obj.x != null) && (obj.y != null)) {
            _ref2 = obj.getTile(), tx = _ref2[0], ty = _ref2[1];
            ox = round(obj.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
            oy = round(obj.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
            switch (obj.styled) {
              case true:
                this.drawStyledTile(tx, ty, obj.team, ox, oy);
                break;
              case false:
                this.drawTile(tx, ty, ox, oy);
            }
          }
        }
        return this.drawOverlay();
      }, this));
      if (this.hud) {
        return this.updateHud();
      }
    };
    BaseRenderer.prototype.playSound = function(sfx, x, y, owner) {
      var dist, dx, dy, mode, name;
      mode = this.world.player && owner === this.world.player ? 'Self' : (dx = x - this.lastCenter[0], dy = y - this.lastCenter[1], dist = sqrt(dx * dx + dy * dy), dist > 40 * TILE_SIZE_WORLD ? 'None' : dist > 15 * TILE_SIZE_WORLD ? 'Far' : 'Near');
      if (mode === 'None') {
        return;
      }
      name = function() {
        switch (sfx) {
          case sounds.BIG_EXPLOSION:
            return "bigExplosion" + mode;
            break;
          case sounds.BUBBLES:
            if (mode === 'Self') {
              return "bubbles";
            }
            break;
          case sounds.FARMING_TREE:
            return "farmingTree" + mode;
            break;
          case sounds.HIT_TANK:
            return "hitTank" + mode;
            break;
          case sounds.MAN_BUILDING:
            return "manBuilding" + mode;
            break;
          case sounds.MAN_DYING:
            return "manDying" + mode;
            break;
          case sounds.MAN_LAY_MINE:
            if (mode === 'Near') {
              return "manLayMineNear";
            }
            break;
          case sounds.MINE_EXPLOSION:
            return "mineExplosion" + mode;
            break;
          case sounds.SHOOTING:
            return "shooting" + mode;
            break;
          case sounds.SHOT_BUILDING:
            return "shotBuilding" + mode;
            break;
          case sounds.SHOT_TREE:
            return "shotTree" + mode;
            break;
          case sounds.TANK_SINKING:
            return "tankSinking" + mode;
        }
      }();
      if (name) {
        return this.soundkit[name]();
      }
    };
    BaseRenderer.prototype.handleResize = function() {
      this.canvas[0].width = window.innerWidth;
      this.canvas[0].height = window.innerHeight;
      this.canvas.css({
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px'
      });
      return $('body').css({
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px'
      });
    };
    BaseRenderer.prototype.handleClick = function(e) {
      var action, cell, flexible, mx, my, trees, _ref, _ref2;
      e.preventDefault();
      this.world.input.focus();
      if (!this.currentTool) {
        return;
      }
      _ref = this.mouse, mx = _ref[0], my = _ref[1];
      cell = this.getCellAtScreen(mx, my);
      _ref2 = this.world.checkBuildOrder(this.currentTool, cell), action = _ref2[0], trees = _ref2[1], flexible = _ref2[2];
      if (action) {
        return this.world.buildOrder(action, trees, cell);
      }
    };
    BaseRenderer.prototype.getViewAreaAtWorld = function(x, y) {
      var height, left, top, width, _ref;
      _ref = this.canvas[0], width = _ref.width, height = _ref.height;
      left = round(x / PIXEL_SIZE_WORLD - width / 2);
      left = max(0, min(MAP_SIZE_PIXELS - width, left));
      top = round(y / PIXEL_SIZE_WORLD - height / 2);
      top = max(0, min(MAP_SIZE_PIXELS - height, top));
      return [left, top, width, height];
    };
    BaseRenderer.prototype.getCellAtScreen = function(x, y) {
      var cameraX, cameraY, height, left, top, width, _ref, _ref2;
      _ref = this.lastCenter, cameraX = _ref[0], cameraY = _ref[1];
      _ref2 = this.getViewAreaAtWorld(cameraX, cameraY), left = _ref2[0], top = _ref2[1], width = _ref2[2], height = _ref2[3];
      return this.world.map.cellAtPixel(left + x, top + y);
    };
    BaseRenderer.prototype.drawOverlay = function() {
      var b, player;
      if ((player = this.world.player) && player.armour !== 255) {
        b = player.builder.$;
        if (!(b.order === b.states.inTank || b.order === b.states.parachuting)) {
          this.drawBuilderIndicator(b);
        }
        this.drawReticle();
      }
      this.drawNames();
      return this.drawCursor();
    };
    BaseRenderer.prototype.drawReticle = function() {
      var distance, rad, x, y;
      distance = this.world.player.firingRange * TILE_SIZE_PIXELS;
      rad = (256 - this.world.player.direction) * 2 * PI / 256;
      x = round(this.world.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXELS / 2;
      y = round(this.world.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXELS / 2;
      return this.drawTile(17, 4, x, y);
    };
    BaseRenderer.prototype.drawCursor = function() {
      var cell, mx, my, _ref;
      _ref = this.mouse, mx = _ref[0], my = _ref[1];
      cell = this.getCellAtScreen(mx, my);
      return this.drawTile(18, 6, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS);
    };
    BaseRenderer.prototype.initHud = function() {
      this.hud = $('<div/>').appendTo('body');
      this.initHudTankStatus();
      this.initHudPillboxes();
      this.initHudBases();
      this.initHudToolSelect();
      this.initHudNotices();
      return this.updateHud();
    };
    BaseRenderer.prototype.initHudTankStatus = function() {
      var bar, container, indicator, _i, _len, _ref;
      container = $('<div/>', {
        id: 'tankStatus'
      }).appendTo(this.hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      this.tankIndicators = {};
      _ref = ['shells', 'mines', 'armour', 'trees'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        indicator = _ref[_i];
        bar = $('<div/>', {
          "class": 'gauge',
          id: "tank-" + indicator
        }).appendTo(container);
        this.tankIndicators[indicator] = $('<div class="gauge-content"></div>').appendTo(bar);
      }
      return;
    };
    BaseRenderer.prototype.initHudPillboxes = function() {
      var container, node, pill, _i, _len, _ref, _results;
      container = $('<div/>', {
        id: 'pillStatus'
      }).appendTo(this.hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      this.pillIndicators = function() {
        _ref = this.world.map.pills;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pill = _ref[_i];
          node = $('<div/>', {
            "class": 'pill'
          }).appendTo(container);
          _results.push([node, pill]);
        }
        return _results;
      }.call(this);
      return;
    };
    BaseRenderer.prototype.initHudBases = function() {
      var base, container, node, _i, _len, _ref, _results;
      container = $('<div/>', {
        id: 'baseStatus'
      }).appendTo(this.hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      this.baseIndicators = function() {
        _ref = this.world.map.bases;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          base = _ref[_i];
          node = $('<div/>', {
            "class": 'base'
          }).appendTo(container);
          _results.push([node, base]);
        }
        return _results;
      }.call(this);
      return;
    };
    BaseRenderer.prototype.initHudToolSelect = function() {
      var tools, _fn, _i, _len, _ref;
      this.currentTool = null;
      tools = $('<div id="tool-select" />').appendTo(this.hud);
      _ref = ['forest', 'road', 'building', 'pillbox', 'mine'];
      _fn = function(toolType) {
        var label, tool, toolname;
        toolname = "tool-" + toolType;
        tool = $('<input/>', {
          type: 'radio',
          name: 'tool',
          id: toolname
        }).appendTo(tools);
        label = $('<label/>', {
          "for": toolname
        }).appendTo(tools);
        label.append($('<span/>', {
          "class": "bolo-tool bolo-" + toolname
        }));
        return tool.click(__bind(function(e) {
          if (this.currentTool === toolType) {
            this.currentTool = null;
            tools.find('input').removeAttr('checked');
            tools.buttonset('refresh');
          } else {
            this.currentTool = toolType;
          }
          return this.world.input.focus();
        }, this));
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        toolType = _ref[_i];
        _fn.call(this, toolType);
      }
      return tools.buttonset();
    };
    BaseRenderer.prototype.initHudNotices = function() {
      if (location.hostname.split('.')[1] === 'github') {
        $('<div/>').html('This is a work-in-progress; less than alpha quality!<br>\nTo see multiplayer in action, follow instructions on Github.').css({
          'position': 'absolute',
          'top': '70px',
          'left': '0px',
          'width': '100%',
          'text-align': 'center',
          'font-family': 'monospace',
          'font-size': '16px',
          'font-weight': 'bold',
          'color': 'white'
        }).appendTo(this.hud);
      }
      if (location.hostname.split('.')[1] === 'github' || location.hostname.substr(-6) === '.no.de') {
        return $('<a href="http://github.com/stephank/orona"></a>').css({
          'position': 'absolute',
          'top': '0px',
          'right': '0px'
        }).html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">').appendTo(this.hud);
      }
    };
    BaseRenderer.prototype.updateHud = function() {
      var base, color, node, p, pill, prop, statuskey, value, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _results;
      _ref = this.pillIndicators;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], node = _ref2[0], pill = _ref2[1];
        statuskey = "" + pill.inTank + ";" + pill.carried + ";" + pill.armour + ";" + pill.team;
        if (pill.hudStatusKey === statuskey) {
          continue;
        }
        pill.hudStatusKey = statuskey;
        if (pill.inTank || pill.carried) {
          node.attr('status', 'carried');
        } else if (pill.armour === 0) {
          node.attr('status', 'dead');
        } else {
          node.attr('status', 'healthy');
        }
        color = TEAM_COLORS[pill.team] || {
          r: 112,
          g: 112,
          b: 112
        };
        node.css({
          'background-color': "rgb(" + color.r + "," + color.g + "," + color.b + ")"
        });
      }
      _ref3 = this.baseIndicators;
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        _ref4 = _ref3[_j], node = _ref4[0], base = _ref4[1];
        statuskey = "" + base.armour + ";" + base.team;
        if (base.hudStatusKey === statuskey) {
          continue;
        }
        base.hudStatusKey = statuskey;
        if (base.armour <= 9) {
          node.attr('status', 'vulnerable');
        } else {
          node.attr('status', 'healthy');
        }
        color = TEAM_COLORS[base.team] || {
          r: 112,
          g: 112,
          b: 112
        };
        node.css({
          'background-color': "rgb(" + color.r + "," + color.g + "," + color.b + ")"
        });
      }
      p = this.world.player;
      p.hudLastStatus || (p.hudLastStatus = {});
      _ref5 = this.tankIndicators;
      _results = [];
      for (prop in _ref5) {
        if (!__hasProp.call(_ref5, prop)) continue;
        node = _ref5[prop];
        value = p.armour === 255 ? 0 : p[prop];
        if (p.hudLastStatus[prop] === value) {
          continue;
        }
        p.hudLastStatus[prop] = value;
        _results.push(node.css({
          height: "" + (round(value / 40 * 100)) + "%"
        }));
      }
      return _results;
    };
    return BaseRenderer;
  }();
  module.exports = BaseRenderer;
}).call(this);

});
require.module('bolo/team_colors', function(module, exports, require) {
(function() {
  var TEAM_COLORS;
  TEAM_COLORS = [
    {
      r: 255,
      g: 0,
      b: 0,
      name: 'red'
    }, {
      r: 0,
      g: 0,
      b: 255,
      name: 'blue'
    }, {
      r: 0,
      g: 255,
      b: 0,
      name: 'green'
    }, {
      r: 0,
      g: 255,
      b: 255,
      name: 'cyan'
    }, {
      r: 255,
      g: 255,
      b: 0,
      name: 'yellow'
    }, {
      r: 255,
      g: 0,
      b: 255,
      name: 'magenta'
    }
  ];
  module.exports = TEAM_COLORS;
}).call(this);

});
require.module('bolo/world_mixin', function(module, exports, require) {
(function() {
  var BoloWorldMixin;
  BoloWorldMixin = {
    boloInit: function() {
      return this.tanks = [];
    },
    addTank: function(tank) {
      tank.tank_idx = this.tanks.length;
      this.tanks.push(tank);
      if (this.authority) {
        return this.resolveMapObjectOwners();
      }
    },
    removeTank: function(tank) {
      var i, _ref, _ref2;
      this.tanks.splice(tank.tank_idx, 1);
      for (i = _ref = tank.tank_idx, _ref2 = this.tanks.length; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
        this.tanks[i].tank_idx = i;
      }
      if (this.authority) {
        return this.resolveMapObjectOwners();
      }
    },
    getAllMapObjects: function() {
      return this.map.pills.concat(this.map.bases);
    },
    spawnMapObjects: function() {
      var obj, _i, _len, _ref;
      _ref = this.getAllMapObjects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        obj.world = this;
        this.insert(obj);
        obj.spawn();
        obj.anySpawn();
      }
      return;
    },
    resolveMapObjectOwners: function() {
      var obj, _i, _len, _ref, _ref2;
      _ref = this.getAllMapObjects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        obj.ref('owner', this.tanks[obj.owner_idx]);
        if ((_ref2 = obj.cell) != null) {
          _ref2.retile();
        }
      }
      return;
    }
  };
  module.exports = BoloWorldMixin;
}).call(this);

});
require.module('bolo/client/world/client', function(module, exports, require) {
(function() {
  var BoloClientWorld, ClientWorld, JOIN_DIALOG_TEMPLATE, WorldBase, WorldMap, WorldPillbox, allObjects, decodeBase64, helpers, net, unpack;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  ClientWorld = require('villain/world/net/client');
  WorldMap = require('../../world_map');
  allObjects = require('../../objects/all');
  WorldPillbox = require('../../objects/world_pillbox');
  WorldBase = require('../../objects/world_base');
  unpack = require('../../struct').unpack;
  decodeBase64 = require('../base64').decodeBase64;
  net = require('../../net');
  helpers = require('../../helpers');
  JOIN_DIALOG_TEMPLATE = "<div id=\"join-dialog\">\n  <div>\n    <p>What is your name?</p>\n    <p><input type=\"text\" id=\"join-nick-field\" name=\"join-nick-field\" maxlength=20></input></p>\n  </div>\n  <div id=\"join-team\">\n    <p>Choose a side:</p>\n    <p>\n      <input type=\"radio\" id=\"join-team-red\" name=\"join-team\" value=\"red\"></input>\n      <label for=\"join-team-red\"><span class=\"bolo-team bolo-team-red\"></span></label>\n      <input type=\"radio\" id=\"join-team-blue\" name=\"join-team\" value=\"blue\"></input>\n      <label for=\"join-team-blue\"><span class=\"bolo-team bolo-team-blue\"></span></label>\n    </p>\n  </div>\n  <div>\n    <p><input type=\"button\" name=\"join-submit\" id=\"join-submit\" value=\"Join game\"></input></p>\n  </div>\n</div>";
  BoloClientWorld = function() {
    function BoloClientWorld() {
      BoloClientWorld.__super__.constructor.apply(this, arguments);
      this.mapChanges = {};
      this.processingServerMessages = false;
    }
    __extends(BoloClientWorld, ClientWorld);
    BoloClientWorld.prototype.authority = false;
    BoloClientWorld.prototype.loaded = function(vignette) {
      var m, path, ws;
      this.vignette = vignette;
      this.vignette.message('Connecting to the multiplayer game');
      this.heartbeatTimer = 0;
      if (m = /^\?([a-z]{20})$/.exec(location.search)) {
        path = "/match/" + m[1];
      } else if (location.search) {
        return this.vignette.message('Invalid game ID');
      } else {
        path = "/demo";
      }
      this.ws = new WebSocket("ws://" + location.host + path);
      ws = $(this.ws);
      ws.one('open.bolo', __bind(function() {
        return this.connected();
      }, this));
      return ws.one('close.bolo', __bind(function() {
        return this.failure('Connection lost');
      }, this));
    };
    BoloClientWorld.prototype.connected = function() {
      var ws;
      this.vignette.message('Waiting for the game map');
      ws = $(this.ws);
      return ws.one('message.bolo', __bind(function(e) {
        return this.receiveMap(e.originalEvent);
      }, this));
    };
    BoloClientWorld.prototype.receiveMap = function(e) {
      this.map = WorldMap.load(decodeBase64(e.data));
      this.commonInitialization();
      this.vignette.message('Waiting for the game state');
      return $(this.ws).bind('message.bolo', __bind(function(e) {
        return this.handleMessage(e.originalEvent);
      }, this));
    };
    BoloClientWorld.prototype.synchronized = function() {
      var blue, disadvantaged, red, tank, _i, _len, _ref;
      this.rebuildMapObjects();
      this.vignette.destroy();
      this.vignette = null;
      this.loop.start();
      red = blue = 0;
      _ref = this.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.team === 0) {
          red++;
        }
        if (tank.team === 1) {
          blue++;
        }
      }
      disadvantaged = blue < red ? 'blue' : 'red';
      this.joinDialog = $(JOIN_DIALOG_TEMPLATE).dialog({
        dialogClass: 'unclosable'
      });
      return this.joinDialog.find('#join-nick-field').val($.cookie('nick') || '').focus().keydown(__bind(function(e) {
        if (e.which === 13) {
          return this.join();
        }
      }, this)).end().find("#join-team-" + disadvantaged).attr('checked', 'checked').end().find("#join-team").buttonset().end().find('#join-submit').button().click(__bind(function() {
        return this.join();
      }, this));
    };
    BoloClientWorld.prototype.join = function() {
      var nick, team;
      nick = this.joinDialog.find('#join-nick-field').val();
      team = this.joinDialog.find('#join-team input[checked]').val();
      team = function() {
        switch (team) {
          case 'red':
            return 0;
          case 'blue':
            return 1;
          default:
            return -1;
        }
      }();
      if (!(nick && team !== -1)) {
        return;
      }
      $.cookie('nick', nick);
      this.joinDialog.dialog('destroy');
      this.joinDialog = null;
      this.ws.send(JSON.stringify({
        command: 'join',
        nick: nick,
        team: team
      }));
      return this.input.focus();
    };
    BoloClientWorld.prototype.receiveWelcome = function(tank) {
      this.player = tank;
      this.renderer.initHud();
      return this.initChat();
    };
    BoloClientWorld.prototype.tick = function() {
      BoloClientWorld.__super__.tick.apply(this, arguments);
      if (this.increasingRange !== this.decreasingRange) {
        if (++this.rangeAdjustTimer === 6) {
          if (this.increasingRange) {
            this.ws.send(net.INC_RANGE);
          } else {
            this.ws.send(net.DEC_RANGE);
          }
          this.rangeAdjustTimer = 0;
        }
      } else {
        this.rangeAdjustTimer = 0;
      }
      if (++this.heartbeatTimer === 10) {
        this.heartbeatTimer = 0;
        return this.ws.send('');
      }
    };
    BoloClientWorld.prototype.failure = function(message) {
      if (this.ws) {
        this.ws.close();
        $(this.ws).unbind('.bolo');
        this.ws = null;
      }
      return BoloClientWorld.__super__.failure.apply(this, arguments);
    };
    BoloClientWorld.prototype.soundEffect = function(sfx, x, y, owner) {};
    BoloClientWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {
      if (this.processingServerMessages) {
        return;
      }
      if (this.mapChanges[cell.idx] == null) {
        cell._net_oldType = oldType;
        cell._net_hadMine = hadMine;
        cell._net_oldLife = oldLife;
        this.mapChanges[cell.idx] = cell;
      }
      return;
    };
    BoloClientWorld.prototype.initChat = function() {
      this.chatMessages = $('<div/>', {
        id: 'chat-messages'
      }).appendTo(this.renderer.hud);
      this.chatContainer = $('<div/>', {
        id: 'chat-input'
      }).appendTo(this.renderer.hud).hide();
      return this.chatInput = $('<input/>', {
        type: 'text',
        name: 'chat',
        maxlength: 140
      }).appendTo(this.chatContainer).keydown(__bind(function(e) {
        return this.handleChatKeydown(e);
      }, this));
    };
    BoloClientWorld.prototype.openChat = function(options) {
      options || (options = {});
      this.chatContainer.show();
      return this.chatInput.val('').focus().team = options.team;
    };
    BoloClientWorld.prototype.commitChat = function() {
      this.ws.send(JSON.stringify({
        command: this.chatInput.team ? 'teamMsg' : 'msg',
        text: this.chatInput.val()
      }));
      return this.closeChat();
    };
    BoloClientWorld.prototype.closeChat = function() {
      this.chatContainer.hide();
      return this.input.focus();
    };
    BoloClientWorld.prototype.receiveChat = function(who, text, options) {
      var element;
      options || (options = {});
      element = options.team ? $('<p/>', {
        "class": 'msg-team'
      }).text("<" + who.name + "> " + text) : $('<p/>', {
        "class": 'msg'
      }).text("<" + who.name + "> " + text);
      this.chatMessages.append(element);
      return window.setTimeout(__bind(function() {
        return element.remove();
      }, this), 7000);
    };
    BoloClientWorld.prototype.handleKeydown = function(e) {
      if (!(this.ws && this.player)) {
        return;
      }
      switch (e.which) {
        case 32:
          return this.ws.send(net.START_SHOOTING);
        case 37:
          return this.ws.send(net.START_TURNING_CCW);
        case 38:
          return this.ws.send(net.START_ACCELERATING);
        case 39:
          return this.ws.send(net.START_TURNING_CW);
        case 40:
          return this.ws.send(net.START_BRAKING);
        case 84:
          return this.openChat();
        case 82:
          return this.openChat({
            team: true
          });
      }
    };
    BoloClientWorld.prototype.handleKeyup = function(e) {
      if (!(this.ws && this.player)) {
        return;
      }
      switch (e.which) {
        case 32:
          return this.ws.send(net.STOP_SHOOTING);
        case 37:
          return this.ws.send(net.STOP_TURNING_CCW);
        case 38:
          return this.ws.send(net.STOP_ACCELERATING);
        case 39:
          return this.ws.send(net.STOP_TURNING_CW);
        case 40:
          return this.ws.send(net.STOP_BRAKING);
      }
    };
    BoloClientWorld.prototype.handleChatKeydown = function(e) {
      if (!(this.ws && this.player)) {
        return;
      }
      switch (e.which) {
        case 13:
          this.commitChat();
          break;
        case 27:
          this.closeChat();
          break;
        default:
          return;
      }
      return e.preventDefault();
    };
    BoloClientWorld.prototype.buildOrder = function(action, trees, cell) {
      if (!(this.ws && this.player)) {
        return;
      }
      trees || (trees = 0);
      return this.ws.send([net.BUILD_ORDER, action, trees, cell.x, cell.y].join(','));
    };
    BoloClientWorld.prototype.handleMessage = function(e) {
      var ate, command, data, error, length, message, pos, _i, _len, _ref;
      error = null;
      if (e.data.charAt(0) === '{') {
        try {
          this.handleJsonCommand(JSON.parse(e.data));
        } catch (e) {
          error = e;
        }
      } else if (e.data.charAt(0) === '[') {
        try {
          _ref = JSON.parse(e.data);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            message = _ref[_i];
            this.handleJsonCommand(message);
          }
        } catch (e) {
          error = e;
        }
      } else {
        this.netRestore();
        try {
          data = decodeBase64(e.data);
          pos = 0;
          length = data.length;
          this.processingServerMessages = true;
          while (pos < length) {
            command = data[pos++];
            ate = this.handleBinaryCommand(command, data, pos);
            pos += ate;
          }
          this.processingServerMessages = false;
          if (pos !== length) {
            error = new Error("Message length mismatch, processed " + pos + " out of " + length + " bytes");
          }
        } catch (e) {
          error = e;
        }
      }
      if (error) {
        this.failure('Connection lost (protocol error)');
        if (typeof console != "undefined" && console !== null) {
          console.log("Following exception occurred while processing message:", e.data);
        }
        throw error;
      }
    };
    BoloClientWorld.prototype.handleBinaryCommand = function(command, data, offset) {
      var ascii, bytes, cell, code, idx, life, mine, owner, sfx, tank_idx, x, y, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      switch (command) {
        case net.SYNC_MESSAGE:
          this.synchronized();
          return 0;
          break;
        case net.WELCOME_MESSAGE:
          _ref = unpack('H', data, offset), tank_idx = _ref[0][0], bytes = _ref[1];
          this.receiveWelcome(this.objects[tank_idx]);
          return bytes;
          break;
        case net.CREATE_MESSAGE:
          return this.netSpawn(data, offset);
        case net.DESTROY_MESSAGE:
          return this.netDestroy(data, offset);
        case net.MAPCHANGE_MESSAGE:
          _ref2 = unpack('BBBBf', data, offset), _ref3 = _ref2[0], x = _ref3[0], y = _ref3[1], code = _ref3[2], life = _ref3[3], mine = _ref3[4], bytes = _ref2[1];
          ascii = String.fromCharCode(code);
          cell = this.map.cells[y][x];
          cell.setType(ascii, mine);
          cell.life = life;
          return bytes;
          break;
        case net.SOUNDEFFECT_MESSAGE:
          _ref4 = unpack('BHHH', data, offset), _ref5 = _ref4[0], sfx = _ref5[0], x = _ref5[1], y = _ref5[2], owner = _ref5[3], bytes = _ref4[1];
          this.renderer.playSound(sfx, x, y, this.objects[owner]);
          return bytes;
          break;
        case net.TINY_UPDATE_MESSAGE:
          _ref6 = unpack('H', data, offset), idx = _ref6[0][0], bytes = _ref6[1];
          bytes += this.netUpdate(this.objects[idx], data, offset + bytes);
          return bytes;
          break;
        case net.UPDATE_MESSAGE:
          return this.netTick(data, offset);
        default:
          throw new Error("Bad command '" + command + "' from server, at offset " + (offset - 1));
      }
    };
    BoloClientWorld.prototype.handleJsonCommand = function(data) {
      switch (data.command) {
        case 'nick':
          return this.objects[data.idx].name = data.nick;
        case 'msg':
          return this.receiveChat(this.objects[data.idx], data.text);
        case 'teamMsg':
          return this.receiveChat(this.objects[data.idx], data.text, {
            team: true
          });
        default:
          throw new Error("Bad JSON command '" + data.command + "' from server.");
      }
    };
    BoloClientWorld.prototype.rebuildMapObjects = function() {
      var obj, _i, _len, _ref, _ref2;
      this.map.pills = [];
      this.map.bases = [];
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (obj instanceof WorldPillbox) {
          this.map.pills.push(obj);
        } else if (obj instanceof WorldBase) {
          this.map.bases.push(obj);
        } else {
          continue;
        }
        if ((_ref2 = obj.cell) != null) {
          _ref2.retile();
        }
      }
      return;
    };
    BoloClientWorld.prototype.netRestore = function() {
      var cell, idx, _ref;
      BoloClientWorld.__super__.netRestore.apply(this, arguments);
      _ref = this.mapChanges;
      for (idx in _ref) {
        if (!__hasProp.call(_ref, idx)) continue;
        cell = _ref[idx];
        cell.setType(cell._net_oldType, cell._net_hadMine);
        cell.life = cell._net_oldLife;
      }
      return this.mapChanges = {};
    };
    return BoloClientWorld;
  }();
  helpers.extend(BoloClientWorld.prototype, require('./mixin'));
  allObjects.registerWithWorld(BoloClientWorld.prototype);
  module.exports = BoloClientWorld;
}).call(this);

});
require.module('villain/world/net/client', function(module, exports, require) {
(function() {
  var BaseWorld, ClientWorld, buildUnpacker, unpack, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  BaseWorld = require('../base');
  _ref = require('../../struct'), unpack = _ref.unpack, buildUnpacker = _ref.buildUnpacker;
  ClientWorld = function() {
    function ClientWorld() {
      ClientWorld.__super__.constructor.apply(this, arguments);
      this.changes = [];
    }
    __extends(ClientWorld, BaseWorld);
    ClientWorld.prototype.registerType = function(type) {
      if (!this.hasOwnProperty('types')) {
        this.types = [];
      }
      return this.types.push(type);
    };
    ClientWorld.prototype.spawn = function() {
      var args, obj, type;
      type = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      obj = this.insert(new type(this));
      this.changes.unshift(['create', obj.idx, obj]);
      obj._net_transient = true;
      obj.spawn.apply(obj, args);
      obj.anySpawn();
      return obj;
    };
    ClientWorld.prototype.update = function(obj) {
      obj.update();
      obj.emit('update');
      obj.emit('anyUpdate');
      return obj;
    };
    ClientWorld.prototype.destroy = function(obj) {
      this.changes.unshift(['destroy', obj.idx, obj]);
      this.remove(obj);
      obj.emit('destroy');
      if (obj._net_transient) {
        obj.emit('finalize');
      }
      return obj;
    };
    ClientWorld.prototype.netRestore = function() {
      var i, idx, obj, type, _i, _len, _len2, _ref, _ref2, _ref3;
      if (this.changes.length <= 0) {
        return;
      }
      _ref = this.changes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], type = _ref2[0], idx = _ref2[1], obj = _ref2[2];
        switch (type) {
          case 'create':
            if (obj.transient && !obj._net_revived) {
              obj.emit('finalize');
            }
            this.objects.splice(idx, 1);
            break;
          case 'destroy':
            obj._net_revived = true;
            this.objects.splice(idx, 0, obj);
        }
      }
      this.changes = [];
      _ref3 = this.objects;
      for (i = 0, _len2 = _ref3.length; i < _len2; i++) {
        obj = _ref3[i];
        obj.idx = i;
      }
      return;
    };
    ClientWorld.prototype.netSpawn = function(data, offset) {
      var obj, type;
      type = this.types[data[offset]];
      obj = this.insert(new type(this));
      obj._net_transient = false;
      obj._net_new = true;
      return 1;
    };
    ClientWorld.prototype.netUpdate = function(obj, data, offset) {
      var bytes, changes, _ref;
      _ref = this.deserialize(obj, data, offset, obj._net_new), bytes = _ref[0], changes = _ref[1];
      if (obj._net_new) {
        obj.netSpawn();
        obj.anySpawn();
        obj._net_new = false;
      } else {
        obj.emit('netUpdate', changes);
        obj.emit('anyUpdate');
      }
      obj.emit('netSync');
      return bytes;
    };
    ClientWorld.prototype.netDestroy = function(data, offset) {
      var bytes, obj, obj_idx, _ref;
      _ref = unpack('H', data, offset), obj_idx = _ref[0][0], bytes = _ref[1];
      obj = this.objects[obj_idx];
      if (!obj._net_new) {
        obj.emit('netDestroy');
        obj.emit('anyDestroy');
        obj.emit('finalize');
      }
      this.remove(obj);
      return bytes;
    };
    ClientWorld.prototype.netTick = function(data, offset) {
      var bytes, obj, _i, _len, _ref;
      bytes = 0;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        bytes += this.netUpdate(obj, data, offset + bytes);
      }
      return bytes;
    };
    ClientWorld.prototype.deserialize = function(obj, data, offset, isCreate) {
      var changes, unpacker;
      unpacker = buildUnpacker(data, offset);
      changes = {};
      obj.serialization(isCreate, __bind(function(specifier, attribute, options) {
        var oldValue, other, value, _ref;
        options || (options = {});
        if (specifier === 'O') {
          other = this.objects[unpacker('H')];
          if ((oldValue = (_ref = obj[attribute]) != null ? _ref.$ : void 0) !== other) {
            changes[attribute] = oldValue;
            obj.ref(attribute, other);
          }
        } else {
          value = unpacker(specifier);
          if (options.rx != null) {
            value = options.rx(value);
          }
          if ((oldValue = obj[attribute]) !== value) {
            changes[attribute] = oldValue;
            obj[attribute] = value;
          }
        }
        return;
      }, this));
      return [unpacker.finish(), changes];
    };
    return ClientWorld;
  }();
  module.exports = ClientWorld;
}).call(this);

});
require.module('villain/struct', function(module, exports, require) {
(function() {
  var buildPacker, buildUnpacker, fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
  toUint8 = function(n) {
    return [n & 0xFF];
  };
  toUint16 = function(n) {
    return [(n & 0xFF00) >> 8, n & 0x00FF];
  };
  toUint32 = function(n) {
    return [(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, n & 0x000000FF];
  };
  fromUint8 = function(d, o) {
    return d[o];
  };
  fromUint16 = function(d, o) {
    return (d[o] << 8) + d[o + 1];
  };
  fromUint32 = function(d, o) {
    return (d[o] << 24) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3];
  };
  buildPacker = function() {
    var bitIndex, bits, data, flushBitFields, retval;
    data = [];
    bits = null;
    bitIndex = 0;
    flushBitFields = function() {
      if (bits === null) {
        return;
      }
      data.push(bits);
      return bits = null;
    };
    retval = function(type, value) {
      if (type === 'f') {
        if (bits === null) {
          bits = !!value ? 1 : 0;
          return bitIndex = 1;
        } else {
          if (!!value) {
            bits |= 1 << bitIndex;
          }
          bitIndex++;
          if (bitIndex === 8) {
            return flushBitFields();
          }
        }
      } else {
        flushBitFields();
        return data = data.concat(function() {
          switch (type) {
            case 'B':
              return toUint8(value);
            case 'H':
              return toUint16(value);
            case 'I':
              return toUint32(value);
            default:
              throw new Error("Unknown format character " + type);
          }
        }());
      }
    };
    retval.finish = function() {
      flushBitFields();
      return data;
    };
    return retval;
  };
  buildUnpacker = function(data, offset) {
    var bitIndex, idx, retval;
    offset || (offset = 0);
    idx = offset;
    bitIndex = 0;
    retval = function(type) {
      var bit, bytes, value, _ref;
      if (type === 'f') {
        bit = (1 << bitIndex) & data[idx];
        value = bit > 0;
        bitIndex++;
        if (bitIndex === 8) {
          idx++;
          bitIndex = 0;
        }
      } else {
        if (bitIndex !== 0) {
          idx++;
          bitIndex = 0;
        }
        _ref = function() {
          switch (type) {
            case 'B':
              return [fromUint8(data, idx), 1];
            case 'H':
              return [fromUint16(data, idx), 2];
            case 'I':
              return [fromUint32(data, idx), 4];
            default:
              throw new Error("Unknown format character " + type);
          }
        }(), value = _ref[0], bytes = _ref[1];
        idx += bytes;
      }
      return value;
    };
    retval.finish = function() {
      if (bitIndex !== 0) {
        idx++;
      }
      return idx - offset;
    };
    return retval;
  };
  pack = function(fmt) {
    var i, packer, type, value, _len;
    packer = buildPacker();
    for (i = 0, _len = fmt.length; i < _len; i++) {
      type = fmt[i];
      value = arguments[i + 1];
      packer(type, value);
    }
    return packer.finish();
  };
  unpack = function(fmt, data, offset) {
    var type, unpacker, values, _i, _len, _results;
    unpacker = buildUnpacker(data, offset);
    values = function() {
      _results = [];
      for (_i = 0, _len = fmt.length; _i < _len; _i++) {
        type = fmt[_i];
        _results.push(unpacker(type));
      }
      return _results;
    }();
    return [values, unpacker.finish()];
  };
  exports.buildPacker = buildPacker;
  exports.buildUnpacker = buildUnpacker;
  exports.pack = pack;
  exports.unpack = unpack;
}).call(this);

});
require.module('bolo/struct', function(module, exports, require) {
(function() {
  var buildPacker, buildUnpacker, fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
  toUint8 = function(n) {
    return [n & 0xFF];
  };
  toUint16 = function(n) {
    return [(n & 0xFF00) >> 8, n & 0x00FF];
  };
  toUint32 = function(n) {
    return [(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, n & 0x000000FF];
  };
  fromUint8 = function(d, o) {
    return d[o];
  };
  fromUint16 = function(d, o) {
    return (d[o] << 8) + d[o + 1];
  };
  fromUint32 = function(d, o) {
    return (d[o] << 24) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3];
  };
  buildPacker = function() {
    var bitIndex, bits, data, flushBitFields, retval;
    data = [];
    bits = null;
    bitIndex = 0;
    flushBitFields = function() {
      if (bits === null) {
        return;
      }
      data.push(bits);
      return bits = null;
    };
    retval = function(type, value) {
      if (type === 'f') {
        if (bits === null) {
          bits = !!value ? 1 : 0;
          return bitIndex = 1;
        } else {
          if (!!value) {
            bits |= 1 << bitIndex;
          }
          bitIndex++;
          if (bitIndex === 8) {
            return flushBitFields();
          }
        }
      } else {
        flushBitFields();
        return data = data.concat(function() {
          switch (type) {
            case 'B':
              return toUint8(value);
            case 'H':
              return toUint16(value);
            case 'I':
              return toUint32(value);
            default:
              throw new Error("Unknown format character " + type);
          }
        }());
      }
    };
    retval.finish = function() {
      flushBitFields();
      return data;
    };
    return retval;
  };
  buildUnpacker = function(data, offset) {
    var bitIndex, idx, retval;
    offset || (offset = 0);
    idx = offset;
    bitIndex = 0;
    retval = function(type) {
      var bit, bytes, value, _ref;
      if (type === 'f') {
        bit = (1 << bitIndex) & data[idx];
        value = bit > 0;
        bitIndex++;
        if (bitIndex === 8) {
          idx++;
          bitIndex = 0;
        }
      } else {
        if (bitIndex !== 0) {
          idx++;
          bitIndex = 0;
        }
        _ref = function() {
          switch (type) {
            case 'B':
              return [fromUint8(data, idx), 1];
            case 'H':
              return [fromUint16(data, idx), 2];
            case 'I':
              return [fromUint32(data, idx), 4];
            default:
              throw new Error("Unknown format character " + type);
          }
        }(), value = _ref[0], bytes = _ref[1];
        idx += bytes;
      }
      return value;
    };
    retval.finish = function() {
      if (bitIndex !== 0) {
        idx++;
      }
      return idx - offset;
    };
    return retval;
  };
  pack = function(fmt) {
    var i, packer, type, value, _len;
    packer = buildPacker();
    for (i = 0, _len = fmt.length; i < _len; i++) {
      type = fmt[i];
      value = arguments[i + 1];
      packer(type, value);
    }
    return packer.finish();
  };
  unpack = function(fmt, data, offset) {
    var type, unpacker, values, _i, _len, _results;
    unpacker = buildUnpacker(data, offset);
    values = function() {
      _results = [];
      for (_i = 0, _len = fmt.length; _i < _len; _i++) {
        type = fmt[_i];
        _results.push(unpacker(type));
      }
      return _results;
    }();
    return [values, unpacker.finish()];
  };
  exports.buildPacker = buildPacker;
  exports.buildUnpacker = buildUnpacker;
  exports.pack = pack;
  exports.unpack = unpack;
}).call(this);

});
