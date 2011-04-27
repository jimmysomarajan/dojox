define(["dojo", "dijit", "dojox", "dijit/_WidgetBase"], function(dojo, dijit, dojox){

	dojo.getObject("mobile", true, dojox);

// summary:
//		Mobile Widgets
// description:
//		This module provides a number of widgets that can be used to build
//		web-based applications for mobile devices such as iPhone or Android.
//		These widgets work best with webkit-based browsers, such as Safari or
//		Chrome, since webkit-specific CSS3 features are used.
//		However, the widgets should work in a "graceful degradation" manner
//		even on non-CSS3 browsers, such as IE or Firefox. In that case,
//		fancy effects, such as animation, gradient color, or round corner
//		rectangle, may not work, but you can still operate your application.
//
//		Furthermore, as a separate file, a compatibility module,
//		dojox.mobile.compat, is available that simulates some of CSS3 features
//		used in this module. If you use the compatibility module, fancy visual
//		effects work better even on non-CSS3 browsers.
//
//		Note that use of dijit._Templated and dojo.query was intentionally
//		avoided to reduce download code size.

(function(){
	var d = dojo;
	var ua = navigator.userAgent;

	// BlackBerry (OS 6 or later only)
	d.isBB = ua.indexOf("BlackBerry") >= 0 && parseFloat(ua.split("Version/")[1]) || undefined;

	// Android
	d.isAndroid = parseFloat(ua.split("Android ")[1]) || undefined;

	// iPhone, iPod, or iPad
	// If iPod or iPad is detected, in addition to dojo.isIPod or dojo.isIPad,
	// dojo.isIPhone will also have iOS version number.
	if(ua.match(/(iPhone|iPod|iPad)/)){
		var p = "is" + RegExp.$1.replace(/i/, 'I');
		var v = ua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
		d.isIPhone = d[p] = parseFloat(v.replace(/_/, '.').replace(/_/g, ''));
	}

	var html = d.doc.documentElement;
	html.className += d.trim([
		d.isBB ? "dj_bb" : "",
		d.isAndroid ? "dj_android" : "",
		d.isIPhone ? "dj_iphone" : "",
		d.isIPod ? "dj_ipod" : "",
		d.isIPad ? "dj_ipad" : ""
	].join(" ").replace(/ +/g," "));
})();

var dm = dojox.mobile;

dm.getScreenSize = function(){
	return {
		h: dojo.global.innerHeight || dojo.doc.documentElement.clientHeight,
		w: dojo.global.innerWidth || dojo.doc.documentElement.clientWidth
	};
};

dm.updateOrient = function(){
	var dim = dm.getScreenSize();
	dojo.replaceClass(dojo.doc.documentElement,
					  dim.h > dim.w ? "dj_portrait" : "dj_landscape",
					  dim.h > dim.w ? "dj_landscape" : "dj_portrait");
};
dm.updateOrient();

dm.tabletSize = 500;
dm.detectScreenSize = function(){
	var dim = dm.getScreenSize();
	var sz = Math.min(dim.w, dim.h);
	var from, to;
	if(sz >= dm.tabletSize && (!this._sz || this._sz < dm.tabletSize)){
		from = "phone";
		to = "tablet";
	}else if(sz < dm.tabletSize && (!this._sz || this._sz >= dm.tabletSize)){
		from = "tablet";
		to = "phone";
	}
	if(to){
		dojo.replaceClass(dojo.doc.documentElement, "dj_"+to, "dj_"+from);
		dojo.publish("/dojox/mobile/screenSize/"+to, [dim]);
	}
	this._sz = sz;
};

dm.setupIcon = function(/*DomNode*/iconNode, /*String*/iconPos){
	if(iconNode && iconPos){
		var arr = dojo.map(iconPos.split(/[ ,]/),
								function(item){ return item - 0; });
		var t = arr[0]; // top
		var r = arr[1] + arr[2]; // right
		var b = arr[0] + arr[3]; // bottom
		var l = arr[1]; // left
		iconNode.style.clip = "rect("+t+"px "+r+"px "+b+"px "+l+"px)";
		iconNode.style.top = dojo.style(iconNode, "top") - t + "px";
		iconNode.style.left = dojo.style(iconNode.parentNode, "paddingLeft") - l + "px";
	}
};

dm.hideAddressBarWait = 1000; // [ms]
dm.hideAddressBar = function(/*Event?*/evt, /*Boolean?*/doResize){
	dojo.body().style.minHeight = "1000px"; // to ensure enough height for scrollTo to work
	setTimeout(function(){ scrollTo(0, 1); }, 100);
	setTimeout(function(){ scrollTo(0, 1); }, 400);
	setTimeout(function(){
		scrollTo(0, 1);
		// re-define the min-height with the actual height
		dojo.body().style.minHeight = dm.getScreenSize().h + "px";
		if(doResize !== false){ dm.resizeAll(); }
	}, dm.hideAddressBarWait);
};

dm.resizeAll = function(/*Event?*/evt, /*Widget?*/root){
	// summary:
	//		Call the resize() method of all the top level resizable widgets.
	// description:
	//		Find all widgets that do not have a parent or the parent does not
	//		have the resize() method, and call resize() for them.
	//		If a widget has a parent that has resize(), call of the widget's
	//		resize() is its parent's responsibility.
	// evt:
	//		Native event object
	// root:
	//		If specified, search the specified widget recursively for top level
	//		resizable widgets.
	//		root.resize() is always called regardless of whether root is a
	//		top level widget or not.
	//		If omitted, search the entire page.
	dojo.publish("/dojox/mobile/resizeAll", [evt, root]);
	dm.updateOrient();
	dm.detectScreenSize();
	var isTopLevel = function(w){
		var parent = w.getParent && w.getParent();
		return !!((!parent || !parent.resize) && w.resize);
	};
	var resizeRecursively = function(w){
		dojo.forEach(w.getChildren(), function(child){
			if(isTopLevel(child)){ child.resize(); }
			resizeRecursively(child);
		});
	};
	if(root){
		if(root.resize){ root.resize(); }
		resizeRecursively(root);
	}else{
		dijit.registry.filter(isTopLevel).forEach(function(w){
			w.resize();
		});
	}
};

dm.openWindow = function(url, target){
	dojo.global.open(url, target || "_blank");
};

dm.createDomButton = function(/*DomNode*/refNode, /*Object?*/style, /*DomNode?*/toNode){
	var s = refNode.className;
	var node = toNode || refNode;
	if(s.match(/(mblDomButton\w+)/) && s.indexOf("/") === -1){
		var btnClass = RegExp.$1;
		var nDiv = 4;
		if(s.match(/(mblDomButton\w+_(\d+))/)){
			nDiv = RegExp.$2 - 0;
		}
		for(var i = 0, p = node; i < nDiv; i++){
			p = p.firstChild || dojo.create("DIV", null, p);
		}
		if(toNode){
			setTimeout(function(){
				dojo.removeClass(refNode, btnClass);
			}, 0);
			dojo.addClass(toNode, btnClass);
		}
	}else if(s.indexOf(".") !== -1){ // file name
		dojo.create("IMG", {src:s}, node);
	}else{
		return null;
	}
	dojo.addClass(node, "mblDomButton");
	dojo.style(node, style);
	return node;
};

if(dojo.config.parseOnLoad){
	dojo.ready(90, function(){
		// avoid use of dojo.query
		/*
		var list = dojo.query('[lazy=true] [dojoType]', null);
		list.forEach(function(node, index, nodeList){
			node.setAttribute("__dojoType", node.getAttribute("dojoType"));
			node.removeAttribute("dojoType");
		});
		*/
	
		var nodes = dojo.body().getElementsByTagName("*");
		var i, len, s;
		len = nodes.length;
		for(i = 0; i < len; i++){
			s = nodes[i].getAttribute("dojoType");
			if(s){
				if(nodes[i].parentNode.getAttribute("lazy") == "true"){
					nodes[i].setAttribute("__dojoType", s);
					nodes[i].removeAttribute("dojoType");
				}
			}
		}
	});
}

dojo.addOnLoad(function(){
	dm.detectScreenSize();
	if(dojo.config["mblApplyPageStyles"] !== false){
		dojo.addClass(dojo.doc.documentElement, "mobile");
		if(dojo.isAndroid >= 2.2){ // workaround for android screen flicker problem
			dojo.doc.documentElement.style.webkitBackfaceVisibility = "hidden";
		}
	}

	//	You can disable hiding the address bar with the following djConfig.
	//	var djConfig = { mblHideAddressBar: false };
	var f = dm.resizeAll;
	if(dojo.config["mblHideAddressBar"] !== false &&
		navigator.appVersion.indexOf("Mobile") != -1 ||
		dojo.config["mblForceHideAddressBar"] === true){
		dm.hideAddressBar();
		if(dojo.config["mblAlwaysHideAddressBar"] === true){
			f = dm.hideAddressBar;
		}
	}
	dojo.connect(null, (dojo.global.onorientationchange !== undefined && !dojo.isAndroid)
		? "onorientationchange" : "onresize", null, f);

	// avoid use of dojo.query
	/*
	var list = dojo.query('[__dojoType]', null);
	list.forEach(function(node, index, nodeList){
		node.setAttribute("dojoType", node.getAttribute("__dojoType"));
		node.removeAttribute("__dojoType");
	});
	*/

	var nodes = dojo.body().getElementsByTagName("*");
	var i, len = nodes.length, s;
	for(i = 0; i < len; i++){
		s = nodes[i].getAttribute("__dojoType");
		if(s){
			nodes[i].setAttribute("dojoType", s);
			nodes[i].removeAttribute("__dojoType");
		}
	}

	if(dojo.hash){
		// find widgets under root recursively
		var findWidgets = function(root){
			var arr;
			arr = dijit.findWidgets(root);
			var widgets = arr;
			for(var i = 0; i < widgets.length; i++){
				arr = arr.concat(findWidgets(widgets[i].containerNode));
			}
			return arr;
		};
		dojo.subscribe("/dojo/hashchange", null, function(value){
			var view = dm.currentView;
			if(!view){ return; }
			var params = dm._params;
			if(!params){ // browser back/forward button was pressed
				var moveTo = value ? value : dm._defaultView.id;
				var widgets = findWidgets(view.domNode);
				var dir = 1, transition = "slide";
				for(i = 0; i < widgets.length; i++){
					var w = widgets[i];
					if("#"+moveTo == w.moveTo){
						// found a widget that has the given moveTo
						transition = w.transition;
						dir = (w instanceof dm.Heading) ? -1 : 1;
						break;
					}
				}
				params = [ moveTo, dir, transition ];
			}
			view.performTransition.apply(view, params);
			dm._params = null;
		});
	}

	dojo.body().style.visibility = "visible";
});

dijit.getEnclosingWidget = function(node){
	while(node && node.tagName !== "BODY"){
		if(node.getAttribute && node.getAttribute("widgetId")){
			return dijit.registry.byId(node.getAttribute("widgetId"));
		}
		node = node._parentNode || node.parentNode;
	}
	return null;
};

dojo.extend(dijit._WidgetBase, {
	_cv: function(s){ return s; } // convert the given string
});

(function(){
	// feature detection
	if(dojo.isWebKit){
		dm.hasTouch = (typeof dojo.doc.documentElement.ontouchstart != "undefined" &&
			navigator.appVersion.indexOf("Mobile") != -1);
	}
})();

return dm.common;
});