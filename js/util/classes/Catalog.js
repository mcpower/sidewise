/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var Catalog = function (a) {
    this.items = a || []
};
Catalog.prototype = {
    getItem: function (a) {
        return firstElem(this.items, function (b) {
            return b.id == a
        })
    },
    getIds: function () {
        return this.items.map(function (a) {
            return a.id
        })
    },
    appendItem: function (a) {
        if (this.getItem(a.id)) throw Error("Item already exists in catalog with id " + a.id);
        this.items.push(a);
        return a
    },
    removeItem: function (a) {
        var b = first(this.items, function (b) {
            return b.id == a
        });
        if (!b) throw Error("Could not find item to remove with id " + a);
        this.items.splice(b[0], 1)
    },
    reorderItem: function (a, b) {
        for (var c, e, d =
                0; d < this.items.length; d++)
            if (e = this.items[d], e.id == a) {
                c = d;
                break
            } if (void 0 === c) throw Error("Could not find item by id " + a);
        this.items.splice(c, 1);
        this.items.splice(b, 0, e)
    },
    loadState: function (a, b) {
        this.items = settings.get(a, b || [])
    },
    saveState: function (a) {
        for (var b = [], c = 0; c < this.items.length; c++) b.push({
            id: this.items[c].id,
            enabled: this.items[c].enabled
        });
        settings.set(a, b)
    }
};
