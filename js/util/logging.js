/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var RUNNING_LOG_MAX_SIZE = 1048576,
    RUNNING_LOG_OVERTRIM_PCT = 0.25,
    MAX_JSON_ARG_LENGTH = 250,
    loggingEnabled, logObjectsAsJSON, runningLog = "",
    lastKnownError, log = function () {};
setLoggingState();
startLogTrimmer();
window.onerror = function (a, e, b) {
    writeDiagnosticLog.call(this, {
        "0": "[THROWN ERROR] " + a + " @ " + e + ":" + b + "\n"
    }, lastKnownError ? lastKnownError._stack : void 0);
    lastKnownError = null
};
var nativeError = Error;
Error = function (a) {
    this.message = a;
    this.name = "";
    this._stack = getCallStack();
    lastKnownError = this;
    var e = this;
    setTimeout(function () {
        e === lastKnownError && (lastKnownError = null)
    }, 0)
};
Error.prototype = new nativeError;
Error.prototype.constructor = Error;
var nativeConsoleError = console.error;
console.error = function () {
    nativeConsoleError.apply(console, arguments);
    try {
        arguments["0"] = "[CONSOLE ERROR] " + arguments[0], writeDiagnosticLog.call(this, arguments)
    } catch (a) {
        console.error("Error in custom console.error() handler!", a)
    }
};

function setLoggingState() {
    loggingEnabled = "true" == localStorage.loggingEnabled || !1;
    logObjectsAsJSON = "true" == localStorage.logObjectsAsJSON || !1;
    log = loggingEnabled ? writeAndLogToConsole : function () {}
}

function writeAndLogToConsole() {
    var a = writeDiagnosticLog.call(this, arguments);
    if (console && a) {
        a = getCallStack();
        if ("string" == typeof arguments["0"] || "int" == typeof arguments["0"]) arguments["0"] = arguments["0"] + " @ " + a[0];
        else {
            for (var e = arguments.length - 1; 0 <= e; e--) arguments[(e + 1).toString()] = arguments[e.toString()];
            arguments[0] = a[0];
            arguments.length++
        }
        console.groupCollapsed.apply(console, arguments);
        console.log.apply(console, [a.join("\n")]);
        console.groupEnd()
    }
}

function writeDiagnosticLog(a, e) {
    if (loggingEnabled) {
        var b = [],
            f = [],
            h = window.bg ? !1 : !0,
            g;
        for (g in a) {
            var c = a[g];
            if ("string" == typeof c || "number" == typeof c) b.push(c), h && f.push(c);
            else {
                if (h) {
                    var d;
                    try {
                        c instanceof DataTreeNode ? d = c.elemType + "::" + JSON.stringify({
                            id: c.id,
                            index: c.index,
                            windowId: c.windowId,
                            hibernated: c.hibernated,
                            restorable: c.restorable,
                            incognito: c.incognito,
                            status: c.status,
                            url: c.url,
                            pinned: c.pinned,
                            title: c.title,
                            label: c.label,
                            childrenCount: c.children.length
                        }) : (d = JSON.stringify(c, StringifyReplacer).substring(0,
                            MAX_JSON_ARG_LENGTH), d.length == MAX_JSON_ARG_LENGTH && (d += "...")), f.push(d)
                    } catch (i) {
                        f.push("ERROR CONVERTING TO JSON");
                        b.push(c);
                        continue
                    }
                    if (logObjectsAsJSON) {
                        b.push(d);
                        continue
                    }
                }
                b.push(c)
            }
        }
        e = {
            CallStack: e || getCallStack()
        };
        g = (e.CallStack[0] + "").toString();
        "string" == typeof a[0] ? b.splice(1, 0, "@", g, e, "\n") : b.splice(0, 0, g, e, "\n");
        "\n" == b[b.length - 1] && b.pop();
        if (!h) return b;
        f = f.join(" ");
        runningLog += f.trim() + "\n";
        runningLog = 0 == f.indexOf("---") || 0 == e.CallStack.length ? runningLog + "\n" : runningLog + ("    " + e.CallStack.join("\n    ") +
            "\n\n");
        return b
    }
}

function log_brief() {
    if (loggingEnabled) {
        var a = [],
            e;
        for (e in arguments) {
            var b = arguments[e];
            "string" == typeof b ? (b = b.split("\n"), a.push(b[0] + (1 < b.length ? "..." : ""))) : a.push(b)
        }
        log.apply(this, a)
    }
}

function startLogTrimmer() {
    chrome.extension.getBackgroundPage() === window && setInterval(trimRunningLog, 3E4)
}

function trimRunningLog() {
    runningLog.length >= RUNNING_LOG_MAX_SIZE && (console.log("trimmed running log: before", runningLog.length), runningLog = runningLog.substring(runningLog.length - RUNNING_LOG_MAX_SIZE + RUNNING_LOG_MAX_SIZE * RUNNING_LOG_OVERTRIM_PCT), console.log("trimmed running log: after", runningLog.length))
}

function getCallStack() {
    var a = (new nativeError).stack,
        a = (a + "\n").replace(/^\S[^\(]+?[\n$]/gm, "").replace(/^\s+(at eval )?at\s+/gm, "").replace(/^([^\(]+?)([\n$])/gm, "{anonymous}()@$1$2").replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, "{anonymous}()@$1").replace(/\n+$/gm, ""),
        a = a.split("\n");
    if (0 < a.length)
        for (; a[0] && (0 <= a[0].indexOf("logging.js:") || 0 == a[0].indexOf("Error"));) a.shift(1);
    return a
}
var StringifyReplacer = function (a, e, b, f) {
    return function g(c, d) {
        if ("" === c) return a = [d], b = 0, d;
        switch (typeof d) {
            case "function":
                return "".concat("function ", d.name || "anonymous", "(", Array(d.length + 1).join(",arg").slice(1), "){}");
            case "boolean":
            case "number":
                return d;
            case "string":
                return 0 == d.indexOf("data:image") ? d.substring(0, 16) + "..." : d;
            default:
                if (!d || !g.filter(d) || 255 < ++b) return e;
                f = a.indexOf(d);
                return 0 > f ? a.push(d) && d : "*R" + f
        }
    }
}();
StringifyReplacer.filter = function (a) {
    return a
};
