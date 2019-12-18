/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var LOGGING_ENABLED = !1,
    MEDIA_PLAYER_STATE_ALIASES = {
        "-1": "unstarted",
        "0": "ended",
        1: "playing",
        2: "paused",
        3: "buffering",
        5: "video cued"
    },
    MINIMUM_WAIT_BETWEEN_NOTIFIES_MS = 20,
    port, notifyTimeout;
connectPort();
notifySidewise();
window.addEventListener("popstate", onLocationOrHistoryChanged);
window.addEventListener("DOMContentLoaded", onDOMContentLoaded);

function onDOMContentLoaded() {
    log("onDOMContentLoaded");
    setUpTitleObserver();
    setUpMessageListener();
    setUpMediaMonitors()
}

function setUpMessageListener() {
    window.addEventListener("message", function (a) {
        a.source == window && receivePageEvent(a.data)
    })
}

function setUpTitleObserver() {
    var a = document.querySelector("head");
    a ? (new window.WebKitMutationObserver(function () {
        notifySidewise()
    })).observe(a, {
        attributes: !0,
        subtree: !0,
        characterData: !0,
        childList: !0
    }) : log("Page does not have head element")
}

function connectPort() {
    port = chrome.runtime.connect({
        name: "content_script"
    });
    log("connection", port);
    port.onMessage.addListener(function (a) {
        log("message", a.op, a.action, a);
        switch (a.op) {
            case "getPageDetails":
                sendPageDetails(a)
        }
    });
    port.onDisconnect.addListener(function () {
        log("disconnect", port)
    })
}

function onLocationOrHistoryChanged(a) {
    log(a.type, a);
    notifySidewise()
}

function notifySidewise() {
    clearTimeout(notifyTimeout);
    notifyTimeout = setTimeout(function () {
        sendPageDetails({
            action: "store"
        })
    }, MINIMUM_WAIT_BETWEEN_NOTIFIES_MS)
}

function sendPageDetails(a) {
    a.op = "getPageDetails";
    a.title = document.title;
    a.referrer = document.referrer;
    a.historylength = history.length;
    a.sessionGuid = getSessionGuid();
    var b = document.querySelector("head > link[rel=icon], head > link[rel=favicon]");
    b && (a.favicon = b.href);
    b = JSON.stringify(a);
    sessionStorage.sidewiseLastDetailsSent == b ? log("skipping notify message send because details have not changed from last time they were sent") : (sessionStorage.sidewiseLastDetailsSent = b, log("pushing details via sendMessage",
        b), chrome.runtime.sendMessage(a))
}

function getSessionGuid() {
    var a = sessionStorage.sidewiseGuid;
    a || (a = generateGuid(), sessionStorage.sidewiseGuid = a);
    return a
}

function generateGuid() {
    var a = Math.random().toString(36);
    return a.substring(2, 6) + "-" + a.substring(6, 15) + "-" + Math.random().toString(36).substring(2, 15)
}

function injectPageScript(a) {
    var a = "(" + a + ")();",
        b = document.createElement("script");
    b.textContent = a;
    (document.head || document.documentElement).appendChild(b);
    b.parentNode.removeChild(b)
}

function injectPageScriptSendEventFn() {
    injectPageScript(function () {
        window.sidewise_sendEvent = function (a, b) {
            window.postMessage({
                name: a,
                value: b
            }, "*")
        };
        window.sidewise_sendMediaUpdateEvent = function (a, b) {
            window.sidewise_sendEvent("updateMediaState", a + "," + b)
        }
    })
}

function receivePageEvent(a) {
    var b = a.name,
        a = a.value;
    switch (b) {
        case "updateMediaState":
            b = a.split(",");
            chrome.runtime.sendMessage({
                op: "updateMediaState",
                state: MEDIA_PLAYER_STATE_ALIASES[b[0]] || b[0],
                time: parseFloat(b[1])
            });
            break;
        default:
            throw Error("Unrecognized event name: " + b);
    }
}

function setUpMediaMonitors() {
    injectPageScriptSendEventFn();
    injectYouTubeMonitoring();
    injectVimeoMonitoring();
    injectPageScript(jwPlayerEmbedScript);
    injectPageScript(html5VideoScript)
}

function injectYouTubeMonitoring() {
    var a = null !== document.location.href.match(/https?:\/\/.*?youtube\..+?\//),
        b = null !== document.querySelector('iframe[src*="youtube."],embed[src*="youtube."]');
    if (a || b) injectPageScript(youTubeCommonScript), a ? injectPageScript(youTubePageScript) : setTimeout(function () {
        injectPageScript(youTubePlayerEmbedScript)
    }, 4E3)
}

function youTubeCommonScript() {
    clearTimeout(window.sidewise_missedOnYoutubePlayerReadyTimer);
    clearInterval(window.sidewise_onVideoPlayingIntervalTimer);
    window.sidewise_onYouTubePlayerStateChange = function (a, b) {
        var c, g;
        "number" == typeof a ? (c = b instanceof HTMLElement ? b : window.sidewise_ytplayer, g = a) : (c = a.target, g = a.data);
        1 == g ? window.sidewise_onVideoPlayingIntervalTimer || (window.sidewise_onVideoPlayingIntervalTimer = setInterval(function () {
                window.sidewise_sendMediaUpdateEvent(g, c.getCurrentTime())
            }, 500)) :
            (clearInterval(window.sidewise_onVideoPlayingIntervalTimer), window.sidewise_onVideoPlayingIntervalTimer = null);
        window.sidewise_sendMediaUpdateEvent(g, c.getCurrentTime())
    }
}

function youTubePageScript() {
    window.onYouTubePlayerReady = function () {
        window.sidewise_ytplayer || (window.sidewise_onVideoPlayingIntervalTimer = null, window.sidewise_missedOnYoutubePlayerReadyTimer = null, window.sidewise_ytplayer = document.getElementById("movie_player"), window.sidewise_ytplayer || (window.sidewise_ytplayer = document.getElementById("movie_player-flash")), window.sidewise_ytplayer ? window.sidewise_ytplayer.addEventListener("onStateChange", "sidewise_onYouTubePlayerStateChange") : window.sidewise_missedOnYouTubePlayerReadyTimer =
            setTimeout(window.onYouTubePlayerReady, 5E3))
    }
}

function youTubePlayerEmbedScript() {
    window.getFrameId = function (a) {
        var b = document.getElementById(a);
        if (b) {
            if (/^iframe$/i.test(b.tagName)) return a;
            b = b.getElementsByTagName("iframe");
            if (!b.length) return null;
            for (var c = 0; c < b.length && !/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com(\/|$)/i.test(b[c].src); c++);
            b = b[c];
            if (b.id) return b.id;
            do a += "-frame"; while (document.getElementById(a));
            return b.id = a
        }
        return null
    };
    var a, b = [],
        c = !1;
    a = function (a, e) {
        if (!0 === a) {
            c = !0;
            for (var f = 0; f < b.length; f++) b.shift()()
        } else if ("function" ==
            typeof a)
            if (c) a();
            else b[e ? "unshift" : "push"](a)
    };
    window.onYouTubePlayerAPIReady = function () {
        a(!0)
    };
    var g = document.querySelectorAll('iframe[src*="youtube."]'),
        h = document.querySelectorAll('embed[src*="youtube."]');
    if (!(0 == g.length && 0 == h.length)) {
        var j = document.createElement("script");
        j.src = "http://www.youtube.com/player_api";
        var f = document.getElementsByTagName("script")[0];
        f.parentNode.insertBefore(j, f);
        var k = function (a) {
            return function (b) {
                window.sidewise_onYouTubePlayerStateChange(b, a)
            }
        };
        a(function () {
            for (var a =
                    0; a < g.length; a++) {
                var b = g[a];
                b.id || (b.id = Math.random().toString(26).slice(2));
                (b = getFrameId(b.id)) && new YT.Player(b, {
                    events: {
                        onStateChange: sidewise_onYouTubePlayerStateChange
                    }
                })
            }
            for (a = 0; a < h.length; a++) {
                b = h[a];
                b.id || (b.id = Math.random().toString(26).slice(2));
                var c = "sidewise_onYouTubePlayerStateChange_" + b.id;
                window[c] = k(b);
                h[a].addEventListener("onStateChange", c)
            }
        })
    }
}

function jwPlayerEmbedScript() {
    "function" == typeof jwplayer && (window.sidewise_onJwPlayerCheck = function () {
        var a = jwplayer();
        if (a) {
            try {
                var b = a.getState()
            } catch (c) {
                return
            }
            if (b && (b = b.toLowerCase(), a = a.getPosition(), "playing" == b || b != window.sidewise_jwPlayerLastState)) window.sidewise_sendMediaUpdateEvent(b, a), window.sidewise_jwPlayerLastState = b
        }
    }, window.sidewise_onJwPlayerCheckInterval && clearInterval(window.sidewise_onJwPlayerCheckInterval), window.sidewise_onJwPlayerCheckInterval = setInterval(window.sidewise_onJwPlayerCheck,
        500))
}
var vimeoPageCheckInterval = null;

function injectVimeoMonitoring() {
    document.location.href.match(/https?:\/\/.*?vimeo\..+?\//) ? (clearInterval(vimeoPageCheckInterval), vimeoPageCheckInterval = setInterval(function () {
        document.querySelector("object[type*=flash][data*=moogaloop]") && (clearInterval(vimeoPageCheckInterval), injectPageScript(vimeoPageScript))
    }, 1E3), setTimeout(function () {
        clearInterval(vimeoPageCheckInterval)
    }, 2E4)) : document.querySelector('iframe[src*="player.vimeo."]') && injectPageScript(vimeoPlayerEmbedScript)
}

function vimeoPageScript() {
    var a = document.querySelectorAll("object[type*=flash][data*=moogaloop]");
    0 != a.length && (window.sidewise_onVimeoPagePause = function () {
        window.sidewise_sendMediaUpdateEvent("paused", 0)
    }, window.sidewise_onVimeoPageProgress = function (a) {
        "number" == typeof a ? window.sidewise_sendMediaUpdateEvent("playing", a) : window.sidewise_sendMediaUpdateEvent("playing", a.seconds)
    }, setTimeout(function () {
        for (var b = 0; b < a.length; b++) {
            var c = a[b];
            c.api_addEventListener("onProgress", "sidewise_onVimeoPageProgress");
            c.api_addEventListener("onPause", "sidewise_onVimeoPagePause")
        }
    }, 2E3))
}

function vimeoPlayerEmbedScript() {
    var a = document.querySelectorAll('iframe[src*="player.vimeo."]');
    if (0 != a.length) {
        var b, c = function (a) {
                return new c.fn.init(a)
            },
            g = function (a, b, d) {
                if (!d.contentWindow.postMessage) return !1;
                var c = d.getAttribute("src").split("?")[0],
                    a = JSON.stringify({
                        method: a,
                        value: b
                    });
                "//" === c.substr(0, 2) && (c = window.location.protocol + c);
                d.contentWindow.postMessage(a, c)
            },
            h = function (a) {
                var b, d;
                try {
                    b = JSON.parse(a.data), d = b.event || b.method
                } catch (c) {}
                "ready" == d && !k && (k = !0);
                if (a.origin != m) return !1;
                var a = b.value,
                    g = b.data,
                    e = "" === e ? null : b.player_id;
                b = e ? f[e][d] : f[d];
                d = [];
                if (!b) return !1;
                void 0 !== a && d.push(a);
                g && d.push(g);
                e && d.push(e);
                return 0 < d.length ? b.apply(null, d) : b.call()
            },
            j = function (a, b, d) {
                d ? (f[d] || (f[d] = {}), f[d][a] = b) : f[a] = b
            },
            f = {},
            k = !1,
            m = "";
        c.fn = c.prototype = {
            element: null,
            init: function (a) {
                "string" === typeof a && (a = document.getElementById(a));
                this.element = a;
                a = this.element.getAttribute("src");
                "//" === a.substr(0, 2) && (a = window.location.protocol + a);
                for (var a = a.split("/"), b = "", d = 0, c = a.length; d < c; d++) {
                    if (3 >
                        d) b += a[d];
                    else break;
                    2 > d && (b += "/")
                }
                m = b;
                return this
            },
            api: function (a, b) {
                if (!this.element || !a) return !1;
                var d = this.element,
                    c = "" !== d.id ? d.id : null,
                    e = !b || !b.constructor || !b.call || !b.apply ? b : null,
                    f = b && b.constructor && b.call && b.apply ? b : null;
                f && j(a, f, c);
                g(a, e, d);
                return this
            },
            addEvent: function (a, b) {
                if (!this.element) return !1;
                var d = this.element,
                    c = "" !== d.id ? d.id : null;
                j(a, b, c);
                "ready" != a ? g("addEventListener", a, d) : "ready" == a && k && b.call(null, c);
                return this
            },
            removeEvent: function (a) {
                if (!this.element) return !1;
                var b = this.element,
                    c;
                a: {
                    if ((c = "" !== b.id ? b.id : null) && f[c]) {
                        if (!f[c][a]) {
                            c = !1;
                            break a
                        }
                        f[c][a] = null
                    } else {
                        if (!f[a]) {
                            c = !1;
                            break a
                        }
                        f[a] = null
                    }
                    c = !0
                }
                "ready" != a && c && g("removeEventListener", a, b)
            }
        };
        c.fn.init.prototype = c.fn;
        window.addEventListener ? window.addEventListener("message", h, !1) : window.attachEvent("onmessage", h);
        b = window.Froogaloop = window.$f = c;
        window.sidewise_onVimeoPlayProgress = function (a) {
            window.sidewise_sendMediaUpdateEvent("playing", a.seconds)
        };
        window.sidewise_onVimeoPause = function () {
            window.sidewise_sendMediaUpdateEvent("paused",
                0)
        };
        window.sidewise_onVimeoPlayerReady = function (a) {
            b(a).addEvent("playProgress", window.sidewise_onVimeoPlayProgress);
            b(a).addEvent("pause", window.sidewise_onVimeoPause)
        };
        for (h = 0; h < a.length; h++) {
            var e = a[h];
            e.id || (e.id = Math.random().toString(26).slice(2));
            var i = e.src,
                l = 0 <= e.src.indexOf("?") ? "&" : "?"; - 1 == e.src.indexOf(/[\?\&]api=1/) && (i += l + "api=1", l = "&"); - 1 == e.src.indexOf(/[\?\&]player_id=/) && (i += l + "player_id=" + e.id);
            e.src != i && (e.src = i);
            b(e).addEvent("ready", window.sidewise_onVimeoPlayerReady)
        }
    }
}

function html5VideoScript() {
    if (null === document.location.href.match(/https?:\/\/.*?youtube\..+?\//))
        if (window.sidewise_html5videos = document.querySelectorAll("video"), 0 == window.sidewise_html5videos.length) window.sidewise_html5videosRetried || (window.sidewise_html5videosRetried = !0, setTimeout(html5VideoScript, 100));
        else {
            window.sidewise_onHtml5VideoProgress = function (a) {
                a = a.target;
                window.sidewise_sendMediaUpdateEvent(a.paused ? "paused" : "playing", a.currentTime)
            };
            for (var a = 0; a < window.sidewise_html5videos.length; a++) {
                var b =
                    window.sidewise_html5videos[a];
                b.addEventListener("playing", window.sidewise_onHtml5VideoProgress);
                b.addEventListener("progress", window.sidewise_onHtml5VideoProgress);
                b.addEventListener("pause", window.sidewise_onHtml5VideoProgress)
            }
        }
}

function log() {
    LOGGING_ENABLED && console.log.apply(console, arguments)
};
