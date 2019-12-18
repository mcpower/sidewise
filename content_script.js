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
            window.sidewise_sendEvent("sidewiseUpdateMediaState", a + "," + b)
        }
    })
}

function receivePageEvent(a) {
    var b = a.name,
        a = a.value;
    if (b === undefined) {
        return;
    }
    switch (b) {
        case "sidewiseUpdateMediaState":
            b = a.split(",");
            chrome.runtime.sendMessage({
                op: "updateMediaState",
                state: MEDIA_PLAYER_STATE_ALIASES[b[0]] || b[0],
                time: parseFloat(b[1])
            });
            break;
        default:
            break;
    }
}

function setUpMediaMonitors() {
    injectPageScriptSendEventFn();
    injectPageScript(html5VideoScript)
}

function html5VideoScript() {
    window.sidewise_html5videos = document.querySelectorAll("video");
    if (window.sidewise_html5videos.length === 0) {
        if (!window.sidewise_html5videosRetried) {
            window.sidewise_html5videosRetried = true;
            setTimeout(html5VideoScript, 100);
        }
    } else {
        window.sidewise_onHtml5VideoProgress = function (a) {
            a = a.target;
            window.sidewise_sendMediaUpdateEvent(a.paused ? "paused" : "playing", a.currentTime)
        };
        for (var a = 0; a < window.sidewise_html5videos.length; a++) {
            var b =
                window.sidewise_html5videos[a];
            b.addEventListener("playing", window.sidewise_onHtml5VideoProgress);
            b.addEventListener("progress", window.sidewise_onHtml5VideoProgress);
            b.addEventListener("timeupdate", window.sidewise_onHtml5VideoProgress);
            b.addEventListener("pause", window.sidewise_onHtml5VideoProgress)
        }
    }
}

function log() {
    LOGGING_ENABLED && console.log.apply(console, arguments)
};
