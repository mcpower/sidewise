/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var MonitorInfo = function () {
    this.monitors = settings.get("monitorMetrics") || [];
    this.maximizedOffset = settings.get("maximizedOffset") || 0;
    this.detectOnComplete = null;
    this.detectingMonitors = !1;
    this.detectionDOMWindow = this.lastDetectionWindowId = null
};
MonitorInfo.prototype = {
    isKnown: function () {
        return 0 < this.monitors.length
    },
    isDetecting: function () {
        return this.detectingMonitors
    },
    getMonitorFromLeftCoord: function (a) {
        for (var b = 0; b < this.monitors.length; b++) {
            var d = this.monitors[b];
            if (a < d.left + d.width - 1) return d
        }
        console.error("getMonitorFromLeftCoord failed, returning fallback value of the first monitor");
        return this.monitors[0]
    },
    retrieveMonitorMetrics: function (a) {
        var b = this;
        alert(getMessage("prompt_DetectMonitors"));
        log("Detecting multiple monitors");
        this.detectingMonitors = !0;
        this.detectAllMonitorMetrics(function (d, c) {
            b.detectingMonitors = !1;
            a(d, c)
        })
    },
    detectAllMonitorMetrics: function (a) {
        this.monitors = [];
        this.detectOnComplete = a;
        var b = this.getPrimaryMonitorMetrics();
        this.monitors.push(b);
        var d = this;
        this.detectMaximizedOffset.call(d, function () {
            d.detectRightMonitors.call(d, b.left + b.width, b.top, function () {
                d.detectLeftMonitors.call(d, b.left, b.top, function () {
                    a()
                })
            })
        })
    },
    detectMaximizedOffset: function (a) {
        if ("Mac" == PLATFORM) this.maximizedOffset = 0, a();
        else {
            var b =
                this;
            this.createDetectionWindow(screen.availLeft, screen.availTop, function () {
                var d = b.lastDetectionWindowId;
                chrome.windows.update(d, {
                    state: "normal"
                }, function (c) {
                    var e = c.top;
                    chrome.windows.update(d, {
                        state: "maximized"
                    }, function (d) {
                        var c = d.top;
                        b.destroyDetectionWindow.call(b, function () {
                            log("Detected maximized top-offset before and afters", e, c);
                            b.maximizedOffset = e - c;
                            a()
                        })
                    })
                })
            })
        }
    },
    detectRightMonitors: function (a, b, d) {
        var c = this;
        this.createDetectionWindow(a + 10, b + 10, function (e) {
            var g = !1,
                f;
            e.left > a && (g = !0, f =
                c.buildMetricsFromScreen.call(c, c.detectionDOMWindow.screen, a, b), c.monitors.push(f));
            c.destroyDetectionWindow.call(c, function () {
                g ? c.detectRightMonitors.call(c, a + f.width, b, d) : d()
            })
        })
    },
    detectLeftMonitors: function (a, b, d) {
        var c = this;
        this.createDetectionWindow(a - 510, b + 10, function (e) {
            var g = !1,
                f;
            e.left < a && (g = !0, e = c.detectionDOMWindow.screen, f = c.buildMetricsFromScreen.call(c, e, a - e.width, b), c.monitors.push(f));
            c.destroyDetectionWindow.call(c, function () {
                g ? c.detectLeftMonitors.call(c, a - f.width, b, d) : d()
            })
        })
    },
    createDetectionWindow: function (a, b, d) {
        var c = this;
        this.detectingMonitors = !0;
        chrome.windows.create({
            url: "/detect-monitor.html",
            type: "popup",
            left: a,
            top: b,
            width: 500,
            height: 200
        }, function (e) {
            chrome.windows.update(e.id, {
                left: a,
                top: b
            }, function () {
                setTimeout(function () {
                    log("Created detection window", e.id);
                    c.lastDetectionWindowId = e.id;
                    var a = chrome.extension.getViews().filter(function (a) {
                        return "/detect-monitor.html" == a.location.pathname
                    })[0];
                    c.detectionDOMWindow = a;
                    d(e)
                }, 200)
            })
        })
    },
    destroyDetectionWindow: function (a) {
        var b =
            this;
        chrome.windows.remove(this.lastDetectionWindowId, function () {
            b.detectionDOMWindow = null;
            b.detectingMonitors = !1;
            a()
        })
    },
    getPrimaryMonitorMetrics: function () {
        var a = this.buildMetricsFromDOMWindow(window);
        a.primaryMonitor = !0;
        return a
    },
    buildMetricsFromScreen: function (a, b, d) {
        return {
            left: b,
            top: d,
            width: a.width,
            height: a.height,
            availWidth: a.availWidth,
            availHeight: a.availHeight,
            marginLeft: a.availLeft - b,
            marginRight: b + a.width - a.availWidth - a.availLeft
        }
    },
    buildMetricsFromDOMWindow: function (a) {
        return this.buildMetricsFromScreen(a.screen,
            a.screenLeft, a.screenTop)
    },
    saveToSettings: function () {
        log(this.monitors, this.maximizedOffset);
        settings.set("monitorMetrics", this.monitors);
        settings.set("maximizedOffset", this.maximizedOffset)
    }
};
