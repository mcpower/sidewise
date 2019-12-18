/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var TimeoutManager = {
    timeouts: {},
    get: function (a) {
        return this.timeouts[a]
    },
    exists: function (a) {
        return void 0 !== this.timeouts[a]
    },
    set: function (a, b, c) {
        if (this.exists(a)) throw Error("A timeout with the given label has already been set");
        var e = this,
            d = function () {
                b();
                e.del(a)
            },
            f = setTimeout(d, c);
        this.timeouts[a] = {
            id: f,
            fn: d,
            ms: c
        }
    },
    clear: function (a) {
        var b = this.get(a);
        return b ? (clearTimeout(b.id), this.del(a), !0) : !1
    },
    del: function (a) {
        delete this.timeouts[a]
    },
    reset: function (a, b, c) {
        if (this.exists(a)) a = this.get(a),
            clearTimeout(a.id), a.fn = b || a.fn, a.ms = void 0 !== c ? c : a.ms, a.id = setTimeout(a.fn, a.ms);
        else {
            if (!b || !c) throw Error("Tried to reset a timer that does not yet exist, but did not pass fn or timeoutMs");
            this.set(a, b, c)
        }
    }
};
