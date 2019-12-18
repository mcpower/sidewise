/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var IS_UNSCRIPTABLE_URL_REGEX = RegExp(/^((data|about|file|view-source|chrome.*):|https?:\/\/chrome.google.com\/webstore)/),
    SECOND_MS = 1E3,
    MINUTE_MS = 60 * SECOND_MS,
    HOUR_MS = 60 * MINUTE_MS,
    DAY_MS = 24 * HOUR_MS,
    WEEK_MS = 7 * DAY_MS,
    MONTH_MS = 4 * WEEK_MS,
    YEAR_MS = 365 * DAY_MS,
    URL_FAVICON_REPLACEMENTS = {
        "chrome://chrome/extensions": "/images/favicon/extensions.png",
        "chrome://chrome/extensions/": "/images/favicon/extensions.png",
        "chrome://extensions/": "/images/favicon/extensions.png",
        "chrome://chrome/settings/": "/images/favicon/settings.png",
        "chrome://settings/": "/images/favicon/settings.png",
        "chrome://downloads/": "/images/favicon/downloads.png",
        "chrome://bookmarks/": "/images/favicon/bookmarks.png",
        "chrome://chrome/history/": "/images/favicon/history.png",
        "chrome://history/": "/images/favicon/history.png",
        "chrome://newtab/": "/images/favicon/newtab.png"
    };
URL_FAVICON_REPLACEMENTS[(chrome.extension || window.parent.chrome.extension).getURL("/options.html")] = "/images/sidewise_icon_16.png";
URL_FAVICON_REPLACEMENTS[(chrome.extension || window.parent.chrome.extension).getURL("/options_install.html")] = "/images/sidewise_icon_16.png";
URL_FAVICON_REPLACEMENTS[(chrome.extension || window.parent.chrome.extension).getURL("/options_install.html?page=donate")] = "/images/sidewise_icon_16.png";
var URL_TITLE_REPLACEMENTS = {
        "chrome://chrome/extensions": getMessage("tabTitle_Extensions"),
        "chrome://chrome/extensions/": getMessage("tabTitle_Extensions"),
        "chrome://extensions/": getMessage("tabTitle_Extensions"),
        "chrome://chrome/settings/": getMessage("tabTitle_Settings"),
        "chrome://settings/": getMessage("tabTitle_Settings"),
        "chrome://downloads/": getMessage("tabTitle_Downloads"),
        "chrome://bookmarks/": getMessage("tabTitle_BookmarkManager"),
        "chrome://chrome/history/": getMessage("tabTitle_History"),
        "chrome://history/": getMessage("tabTitle_History"),
        "chrome://newtab/": getMessage("tabTitle_NewTab")
    },
    PLATFORM = identifyPlatform();

function getBestFavIconUrl(a, c) {
    var b = URL_FAVICON_REPLACEMENTS[c];
    return b ? b : a && "" != a ? a : "chrome://favicon/"
}

function getChromeFavIconUrl(a) {
    return "chrome://favicon/" + dropUrlHash(a)
}

function isStaticFavIconUrl(a) {
    return !a || "" == a || 0 == a.indexOf("chrome://favicon") ? !1 : !0
}

function getBestPageTitle(a, c) {
    var b = URL_TITLE_REPLACEMENTS[c];
    return b ? b : a && "" != a ? a : c
}

function isScriptableUrl(a) {
    return "" !== a && !IS_UNSCRIPTABLE_URL_REGEX.test(a)
}

function isExtensionUrl(a) {
    return 0 == a.indexOf("chrome-extension://")
}

function isNewTabUrl(a) {
    return "chrome://newtab" === a.substr(0, 15)
}

function splitUrl(a) {
    var c = {},
        b = a.match(/(?:()(www\.[^\s\/?#]+\.[^\s\/?#]+)|([^\s:\/?#]+):\/\/([^\s\/?#]*))([^\s?#]*)(?:\?([^\s#]*))?(?:#(\S*))?/);
    if (b) return c.protocol = b[3], c.host = b[4], c.path = b[5], c.query = b[6], c.hash = b[7], b = c.host.match(/([^\.]+\.(org|com|net|info|[a-z]{2,3}(\.[a-z]{2,3})?))$/), c.domain = b ? b[0] : c.host, c;
    if (b = a.match(/(.+):(.+)/)) return c.protocol = b[1], c.host = b[2], c.path = c.host, c.domain = c.host, c
}

function dropUrlHash(a) {
    return a.replace(/#.*$/, "")
}

function getURLParameter(a) {
    return decodeURIComponent((RegExp("[?|&]" + a + "=([^&;]+?)(&|#|;|$)").exec(location.search) || [, ""])[1].replace(/\+/g, "%20")) || null
}

function injectContentScriptInExistingTabs(a) {
    readFile(a, injectScriptInExistingTabs)
}

function injectScriptInExistingTabs(a) {
    chrome.tabs.query({}, function (c) {
        for (var b in c) {
            var d = c[b];
            executeContentScript(d.url, d.id, a)
        }
    })
}

function executeContentScript(a, c, b) {
    isScriptableUrl(a) && chrome.tabs.executeScript(c, {
        code: b
    })
}

function readFile(a, c) {
    var b = new XMLHttpRequest;
    try {
        b.onreadystatechange = function () {
            if (4 == b.readyState)
                if (b.responseText) c(b.responseText);
                else throw Error("No data returned for readFile: " + a);
        }, b.onerror = function (a) {
            console.error(a)
        }, b.open("GET", a, !0), b.send(null)
    } catch (d) {
        console.error(d)
    }
}

function includeScripts(a) {
    $.ajaxSetup({
        async: !1
    });
    a.forEach(function (a) {
        $.getScript(a)
    });
    $.ajaxSetup({
        async: !0
    })
}

function getNumericId(a) {
    return parseInt(a.slice(1))
}

function identifyPlatform() {
    var a = navigator.platform;
    return "MacIntel" == a || "MacPPC" == a ? "Mac" : "Win32" == a || "WinNT" == a ? "Win" : "Unix"
}

function clone(a, c) {
    if (null == a || "object" != typeof a) return a;
    if (a instanceof Date) {
        var b = new Date;
        b.setTime(a.getTime());
        return b
    }
    if (a instanceof Array) {
        for (var b = [], d = a.length, e = 0; e < d; ++e) b[e] = clone(a[e], c);
        return b
    }
    if (a instanceof Object) {
        b = {};
        for (d in a) a.hasOwnProperty(d) && (c instanceof Array && -1 < c.indexOf(d) || (b[d] = clone(a[d], c)));
        return b
    }
    throw Error("Unable to copy obj! Its type isn't supported.");
}

function castObject(a, c) {
    a.__proto__ = c.prototype
}

function mapObjectProps(a, c) {
    var b = [],
        d;
    for (d in a) {
        if (!a.hasOwnProperty(d)) {
            continue;
        }
        var e = c(d, a[d]);
        void 0 !== e && b.push(e)
    }
    return b
}

function copyObjectProps(a, c, b) {
    for (var d in a)
        if (a.hasOwnProperty(d) && (b || !c.hasOwnProperty(d))) c[d] = a[d]
}

function copyObjectSubProps(a, c, b) {
    for (var d in a) a.hasOwnProperty(d) && a[d] instanceof Object && (void 0 === c[d] ? c[d] = a[d] : copyObjectProps(a[d], c[d], b))
}
var EXTEND_CLASS_BANNED_SURROGATE_NAMES = ["constructor", "$base", "$super", "$parent"];

function extendClass(a, c, b) {
    c || (c = Object);
    a.prototype = Object.create(c.prototype);
    a.prototype.constructor = a;
    for (var d in b) b.hasOwnProperty(d) && (a.prototype[d] = b[d]);
    for (d in c.prototype) 0 <= EXTEND_CLASS_BANNED_SURROGATE_NAMES.indexOf(d) || a.prototype.hasOwnProperty(d) || (a.prototype[d] = getExtendClassSurrogateFunction(d));
    a.prototype.$super = function (a) {
        var b = c.prototype[a];
        if ("function" !== typeof b) return b;
        var d = this;
        return function () {
            var a = d.__proto__;
            d.__proto__ = c.prototype;
            try {
                return b.apply(d, arguments)
            } finally {
                d.__proto__ =
                    a
            }
        }
    };
    a.prototype.$parent = c;
    a.prototype.$base = function () {
        this.$super("constructor").apply(this, arguments)
    }
}

function getExtendClassSurrogateFunction(a) {
    return function () {
        return this.$super(a).apply(this, arguments)
    }
}

function remove(a, c, b) {
    b = a.slice((b || c) + 1 || a.length);
    a.length = 0 > c ? a.length + c : c;
    return a.push.apply(a, b)
}

function removeElemFromArray(a, c) {
    var b = a.indexOf(c);
    return -1 == b ? void 0 : a.splice(b, 1)
}

function first(a, c) {
    for (var b = 0; b < a.length; b++)
        if (c(a[b])) return [b, a[b]]
}

function firstElem(a, c) {
    for (var b = 0; b < a.length; b++)
        if (c(a[b])) return a[b]
}

function last(a, c) {
    for (var b = a.length - 1; 0 <= b; b--)
        if (c(a[b])) return [b, a[b]]
}

function groupBy(a, c) {
    for (var b = [], d = a.length - 1; 0 <= d; d--) {
        var e = a[d];
        if (void 0 !== e) {
            var f = c(e);
            b[f] ? b[f].push(e) : b[f] = [e]
        }
    }
    return b
}

function mostFrequent(a) {
    for (var c = {}, b = 0; b < a.length; b++) c[a[b]] = (c[a[b]] || 0) + 1;
    var a = {
            val: a[0],
            count: 1
        },
        d;
    for (d in c) a.count < c[d] && (a = {
        val: d,
        count: c[d]
    });
    return a
}

function clamp(a, c, b) {
    a = a < c ? c : a;
    return a > b ? b : a
}

function formatSecondsAsHMS(a) {
    var a = parseInt(a),
        c = Math.floor(a / 3600),
        b = Math.floor((a - 3600 * c) / 60),
        a = Math.floor(a - 3600 * c - 60 * b);
    9 >= a && (a = "0" + a);
    0 < c ? (c += ":", 9 >= b && (b = "0" + b)) : c = "";
    return "[" + c + b + ":" + a + "]"
}

function daysBetween(a, c) {
    var b = a.getTime(),
        d = c.getTime(),
        b = Math.abs(b - d);
    return Math.round(b / 864E5)
}

function getTimeDeltaAbbreviated(a, c, b) {
    a instanceof Date && (a = a.getTime());
    c instanceof Date && (c = c.getTime());
    var d = c > a ? "" : "-",
        a = Math.abs(c - a);
    return a >= YEAR_MS ? d + Math.floor(a / YEAR_MS) + "y" : a >= WEEK_MS ? d + Math.floor(a / WEEK_MS) + "w" : a >= DAY_MS ? d + Math.floor(a / DAY_MS) + "d" : a >= HOUR_MS ? d + Math.floor(a / HOUR_MS) + "h" : a >= MINUTE_MS ? d + Math.floor(a / MINUTE_MS) + "m" : b ? d + Math.floor(a / SECOND_MS) + "s" : void 0
}

function padStringLeft(a, c) {
    if (void 0 === a) return Array(c + 1).join(" ");
    "string" != typeof a && (a = a.toString());
    return a.length >= c ? a : Array(c - a.length + 1).join(" ") + a
}

function generateGuid() {
    var a = Math.random().toString(36).toUpperCase();
    return a.substring(2, 6) + "-" + a.substring(6, 15) + "-" + Math.random().toString(36).substring(2, 15)
};
