/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var UiDataTree = function (a, b, c, d, g, e) {
    this.$base();
    this.callbackProxyFn = a;
    this.onModified = this._onModified;
    this.onModifiedImmediate = b;
    this.onModifiedDelayed = c;
    this.onModifiedTimer = null;
    this.onModifiedDelayedWaitMs = d;
    var f = this;
    setTimeout(function () {
        f.onModifiedDelayedWaitMs = e
    }, g)
};
UiDataTree.prototype = {
    addNode: function (a, b, c) {
        if (this.getNode(a.id)) throw Error("A node with this id already exists in the tree", a.id, a);
        b = this.$super("addNode")(a, b, c);
        this.callbackProxyFn("add", {
            element: a,
            parentId: b[1] ? b[1].id : void 0,
            beforeSiblingId: b[2] ? b[2].id : void 0
        });
        return b
    },
    addNodeRel: function (a, b, c) {
        b = this.$super("addNodeRel")(a, b, c);
        this.callbackProxyFn("add", {
            element: a,
            parentId: b[1] ? b[1].id : void 0,
            beforeSiblingId: b[2] ? b[2].id : void 0
        });
        return b
    },
    updateNode: function (a, b, c) {
        a = this.$super("updateNode")(a,
            b, c);
        this.callbackProxyFn("update", {
            id: a.id,
            element: b
        });
        return a
    },
    removeNode: function (a, b) {
        var c = this.$super("removeNode")(a, b);
        this.callbackProxyFn("remove", {
            element: c,
            removeChildren: b || !1
        });
        return c
    },
    moveNode: function (a, b, c, d, g) {
        a = this.$super("moveNode")(a, b, c, d);
        void 0 !== a && !g && this.callbackProxyFn("move", {
            element: a[0],
            newParentId: b ? a[1].id : void 0,
            beforeSiblingId: c ? a[2].id : void 0,
            keepChildren: d || !1
        });
        return a
    },
    moveNodeRel: function (a, b, c, d, g) {
        var e = this.getNode(a);
        if (!e) throw Error("Could not find node to move",
            a, b, c);
        var f;
        e.parent && !e.parent.isRoot && (f = e.parent);
        a = this.$super("moveNodeRel")(e, b, c, d);
        void 0 !== a && !g && (this.callbackProxyFn("move", {
            element: a[0],
            newParentId: a[1] ? a[1].id : void 0,
            beforeSiblingId: a[2] ? a[2].id : void 0,
            keepChildren: d || !1
        }), f && (f.collapsed && 0 == f.children.length) && this.updateNode(f, {
            collapsed: !1
        }));
        return a
    },
    mergeNodes: function (a, b) {
        var c = this.$super("mergeNodes")(a, b);
        void 0 !== c && this.callbackProxyFn("merge", {
            fromId: c.fromId,
            toId: c.toId
        });
        return c
    },
    expandNode: function (a) {
        a = this.getNode(a);
        if (!a) throw Error("Could not find node to expand");
        a.collapsed && (a.collapsed = !1, this.callbackProxyFn("expand", {
            id: a.id
        }))
    },
    collapseNode: function (a) {
        a = this.getNode(a);
        if (!a) throw Error("Could not find node to collapse");
        a.collapsed || (a.collapsed = !0, this.callbackProxyFn("collapse", {
            id: a.id
        }))
    },
    removeZeroChildTopNodes: function () {
        for (var a = this.root.children.length - 1; 0 <= a; a--) {
            var b = this.root.children[a];
            0 == b.children.length && this.removeNode(b)
        }
    },
    _onModified: function () {
        if (this.onModifiedImmediate) this.onModifiedImmediate();
        if (this.onModifiedDelayed) {
            var a = this;
            clearTimeout(this.onModifiedTimer);
            this.onModifiedTimer = setTimeout(function () {
                a.onModifiedDelayed()
            }, this.onModifiedDelayedWaitMs)
        }
    },
    disableCallbacks: function () {
        this.$super("disableCallbacks")();
        this.onModifiedDelayed = function () {};
        this.onModifiedImmediate = function () {};
        this.callbackProxyFn = function () {};
        clearTimeout(this.onModifiedTimer)
    }
};
extendClass(UiDataTree, DataTree, UiDataTree.prototype);
