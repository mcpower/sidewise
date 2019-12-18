/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var ChromeWindowFocusTracker = function (a) {
    this.init(a)
};
ChromeWindowFocusTracker.prototype = {
    init: function (a) {
        this.windowIds = [];
        this.chromeHasFocus = !1;
        var c = this;
        chrome.windows.getAll(null, function (b) {
            function d() {
                setTimeout(function () {
                    c.init(a)
                }, 5E3)
            }

            function e(b) {
                b ? (c.setFocused(b.id), c.chromeHasFocus = !0, a && a(b)) : d()
            }
            if (b) {
                for (var f in b) c.windowIds.push(b[f].id);
                chrome.windows.getAll(function (a) {
                    !a || 0 == a.length ? d() : chrome.windows.getLastFocused(null, e)
                })
            } else setTimeout(function () {
                c.init(a)
            }, 5E3)
        })
    },
    getFocused: function (a) {
        if (0 == this.windowIds.length) return null;
        a = Math.max(0, this.windowIds.length - (a || 0) - 1);
        return this.windowIds[a]
    },
    setFocused: function (a) {
        if (a != sidebarHandler.windowId) return this.remove(a), this.windowIds.push(a), !0
    },
    remove: function (a) {
        var c = this.windowIds.indexOf(a);
        if (-1 == c) return log("Did not find windowId to remove", a, this.windowIds), !1;
        this.windowIds.splice(c, 1);
        return !0
    },
    getTopFocusableWindow: function (a, c) {
        var b = this.windowIds.length;
        if (0 == b || c >= b) a(null);
        else {
            var c = c || 0,
                d = this;
            chrome.windows.get(this.windowIds[b - c - 1], function (b) {
                b &&
                    "minimized" != b.state && "popup" != b.type ? a(b) : d.getTopFocusableWindow(a, c + 1)
            })
        }
    }
};
