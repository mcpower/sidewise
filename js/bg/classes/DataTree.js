/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var DataTree = function (a) {
    this.root = new DataTreeRootNode(this);
    this.tree = this.root.children;
    this.onModified = this.lastModified = null;
    this.indexes = {};
    a || (a = []); - 1 == a.indexOf("id") && a.push("id");
    for (var b = a.length - 1; 0 <= b; b--) this.addIndex(a[b])
};
DataTree.prototype = {
    getNode: function (a) {
        if ("string" == typeof a) return a = this.indexes.id[a], !a ? void 0 : a[0];
        if (Array.isArray(a)) {
            var b = this.indexes[a[0]];
            if (!b) return this.getNodeStep(this.getKeyMatcherFn(a[0], a[1]), this.root.children);
            a = b[a[1]];
            return !a ? void 0 : a[0]
        }
        if (a instanceof DataTreeNode) return a;
        if (a instanceof Function) return this.getNodeStep(a, this.root.children);
        console.error("Bad matcher type:", typeof a);
        console.error(a);
        throw Error("Unsupported matcher argument passed");
    },
    getNodeStep: function (a,
        b) {
        for (var c in b) {
            var d = b[c];
            if (a(d)) return d;
            d = this.getNodeStep(a, d.children);
            if (void 0 !== d) return d
        }
    },
    getNodeRel: function (a, b) {
        var c = this.getNode(b),
            d, e;
        if (!c) throw Error("Could not find node matching toMatcher");
        switch (a) {
            case "prepend":
                d = c;
                e = c.children[0];
                break;
            case "append":
                d = c;
                e = void 0;
                break;
            case "before":
                d = c.parent;
                e = c;
                break;
            case "after":
                d = c.parent;
                e = c.afterSibling();
                break;
            default:
                throw Error("Unrecognized relation " + a);
        }
        return {
            parent: d,
            following: e,
            to: c
        }
    },
    getNodeEx: function (a, b) {
        var c;
        if ("string" ==
            typeof a) c = this.getKeyMatcherFn("id", a);
        else if (a instanceof DataTreeNode) c = this.getObjectIdentityMatcher(a);
        else if (a instanceof Function) c = a;
        else throw Error('Unsupported "matcher" argument passed');
        void 0 === b && (b = this.tree);
        return this.getNodeExStep(c, b, [])
    },
    getNodeExStep: function (a, b, c, d, e, f) {
        for (var g in b) {
            var h = b[g],
                j = c.concat(h),
                k = parseInt(g);
            if (a(h, c, d, e, f)) return {
                node: h,
                index: k,
                siblings: b,
                parent: d,
                parentIndex: e,
                parentSiblings: f,
                ancestors: j
            };
            h = this.getNodeExStep(a, h.children, j, h, k, b);
            if (void 0 !==
                h) return h
        }
    },
    addNode: function (a, b, c, d) {
        var e, f;
        if (b && (e = this.getNode(b), !e)) throw console.error(JSON.stringify(b)), Error("For adding node " + a.id + ", could not find element matching parentMatcher");
        if (c) {
            f = this.getNode(c);
            if (!f) throw console.error(c), Error("For adding node " + a.id + ", could not find element matching beforeSiblingMatcher");
            if (e && f.parent !== e) throw Error("For adding node " + a.id + ", specified sibling " + f.id + " is not a child of specified parent " + e.id + "; sibling's real parent is " + f.parent.id);
        }
        e && !e.isRoot ? (f ? e.children.splice(f.siblingIndex(), 0, a) : e.children.push(a), a.parent = e) : f ? (f.siblings().splice(f.siblingIndex(), 0, a), a.parent = f.parent) : (this.tree.push(a), a.parent = this.root);
        a.root = this.root;
        d || this.indexNode(a);
        this.updateLastModified();
        return [a, e, f]
    },
    addNodeRel: function (a, b, c, d) {
        var e, f;
        if (c) f = this.getNodeRel(b, c), e = f.parent, f = f.following;
        else {
            if ("before" == b || "after" == b) throw Error("Cannot add node " + b + " the root node");
            "prepend" == b && (f = this.root.children[0])
        }
        log(a.id, b, c ? c.id :
            "none", "- parent id", e ? e.id : "none", "before sibling id", f ? f.id : "none", a, c);
        return this.addNode(a, e, f, d)
    },
    updateNode: function (a, b, c, d) {
        a = this.getNode(a);
        if (void 0 === a) throw Error("updateNode could not find a matching node to update");
        d || this.updateIndexForNode(a, b);
        for (var e in b) a[e] = b[e];
        c || this.updateLastModified();
        return a
    },
    removeNode: function (a, b, c) {
        var d = this.getNode(a);
        if (!d) throw Error("Could not find requested element to remove matching " + a.toString());
        if (b) {
            if (d.siblings().splice(d.siblingIndex(),
                    1), !c) {
                a = this.filter(function (a) {
                    return a
                }, d.children);
                for (b = a.length - 1; 0 <= b; b--) this.deindexNode(a[b])
            }
        } else d.children.forEach(function (a) {
            a.parent = d.parent
        }), Array.prototype.splice.apply(d.siblings(), [d.siblingIndex(), 1].concat(d.children));
        c || this.deindexNode(d);
        this.updateLastModified();
        return d
    },
    moveNode: function (a, b, c, d) {
        var a = this.getNode(a),
            e = this.getNode(b);
        if (d && void 0 !== tree.getNodeEx(function (a) {
                return a === e
            }, a.children)) log("Denying move; would have created a cycle");
        else return d ? this.removeNode(a,
            !0, !0) : (this.removeNode(a, !1, !0), a.children = []), b = this.addNode(a, e, c, !0), this.updateLastModified(), b
    },
    moveNodeRel: function (a, b, c, d) {
        a = this.getNode(a);
        if (!a) throw Error("Could not find node matching movingMatcher");
        d ? this.removeNode(a, !0, !0) : (this.removeNode(a, !1, !0), a.children = []);
        b = this.getNodeRel(b, c);
        this.updateLastModified();
        return this.addNode(a, b.parent, b.following, !0)
    },
    mergeNodes: function (a, b) {
        var c = this.getNodeEx(a);
        if (!c) throw Error("Could not find fromNode");
        var d = this.getNode(b);
        if (!d) throw Error("Could not find toNode");
        var e = c.node.id,
            f = d.id;
        c.node.children.forEach(function (a) {
            a.parent = d
        });
        d.children = d.children.concat(c.node.children);
        c.siblings.splice(c.index, 1);
        return {
            fromId: e,
            toId: f
        }
    },
    loadTree: function (a, b) {
        b || (b = {
            node: DataTreeNode
        });
        var c = new DataTreeRootNode(this);
        a ? (a instanceof Array ? c.children = a : a = a.children, a = this.mapTree(function (a) {
            var c = b[a.elemType];
            c && (a.__proto__ = c.prototype);
            return a
        }, a), c.children = a) : c.children = [];
        this.root = c;
        this.tree = this.root.children;
        this.rebuildIndexes();
        this.rebuildParents();
        this.lastModified = Date.now()
    },
    rebuildParents: function (a) {
        var b;
        a ? b = a.children : (a = this.root, b = this.tree);
        for (var c = b.length - 1; 0 <= c; c--) b[c].parent = a, b[c].root = this.root, this.rebuildParents(b[c])
    },
    reduce: function (a, b, c) {
        return this.reduceStep(a, b, 0, c || this.tree)
    },
    reduceStep: function (a, b, c, d) {
        for (i in d) var e = d[i],
            b = a(b, e, c),
            b = this.reduceStep(a, b, c + 1, e.children);
        return b
    },
    filter: function (a, b) {
        return this.reduce(function (b, d) {
            return a(d) ? b.concat(d) : b
        }, [], b)
    },
    groupBy: function (a, b) {
        return this.reduce(function (b,
            d) {
            var e = a(d);
            if (!e) return b;
            b[e] || (b[e] = []);
            b[e].push(d);
            return b
        }, {}, b)
    },
    map: function (a, b) {
        return this.reduce(function (b, d) {
            return b.concat(a(d))
        }, [], b)
    },
    mapTree: function (a, b) {
        var c = this;
        return (b || this.tree).map(function (b) {
            var e = b.children,
                b = a(b);
            b.children = c.mapTree(a, e);
            return b
        })
    },
    getCondensedTree: function (a, b) {
        for (var c = b || this.tree, d = [], e = 0; e < c.length; e++) {
            var f = c[e],
                g = this.getCondensedTree(a, f.children);
            a(f) ? d.push({
                node: f,
                children: g
            }) : d = d.concat(g)
        }
        return d
    },
    forEach: function (a, b) {
        this.forEachStep(a,
            0, b || this.tree, void 0)
    },
    forEachStep: function (a, b, c, d) {
        var e = this,
            f = 0;
        c.forEach(function (g) {
            a(g, f++, b, c, d);
            e.forEachStep(a, b + 1, g.children, g)
        })
    },
    addIndex: function (a) {
        this.indexes[a] = {}
    },
    indexNode: function (a) {
        for (var b in this.indexes) {
            var c = a[b];
            if (void 0 !== c) {
                var d = this.indexes[b];
                if (void 0 === d) throw Error("Index not defined for given index key", b);
                var e = d[c];
                void 0 === e && (e = [], d[c] = e);
                e.push(a)
            }
        }
    },
    updateIndexForNode: function (a, b) {
        for (var c in b) {
            var d = this.indexes[c];
            if (void 0 !== d) {
                var e = b[c],
                    f = a[c];
                if (e != f) {
                    if (void 0 !== f) {
                        var g = d[f];
                        if (void 0 !== g) {
                            var h = g.indexOf(a); - 1 < h && (g.splice(h, 1), 0 == g.length && delete d[f])
                        }
                    }
                    void 0 !== e && (f = d[e], void 0 === f && (f = [], d[e] = f), f.push(a))
                }
            }
        }
    },
    deindexNode: function (a) {
        for (var b in this.indexes) {
            var c = a[b];
            if (void 0 !== c) {
                var d = this.indexes[b];
                if (void 0 === d) throw Error("Index not defined for given index key", b);
                var e = d[c];
                if (void 0 !== e) {
                    var f = e.indexOf(a); - 1 < f && (e.splice(f, 1), 0 == e.length && delete d[c])
                }
            }
        }
    },
    rebuildIndexes: function () {
        for (var a in this.indexes) {
            if (void 0 ===
                this.indexes[a]) throw Error("Could not find key in indexes to populate", a);
            this.indexes[a] = this.reduce(function (b, c) {
                var d = c[a];
                if (void 0 === d) return b;
                var e = b[d];
                void 0 === e && (e = [], b[d] = e);
                e.push(c);
                return b
            }, {})
        }
    },
    dump: function () {
        return this.reduce(function (a, b, c) {
            b = clone(b, ["parent", "root", "children"]);
            return a + "\n" + Array(1 + 4 * (1 + c)).join(" ") + JSON.stringify(b)
        }, "")
    },
    clear: function () {
        this.root = new DataTreeRootNode(this);
        this.tree = this.root.children;
        this.indexes = this.indexes.reduce(function (a, b) {
            a[b] = {};
            return a
        }, {});
        this.updateLastModified()
    },
    toString: function () {
        return "[Tree with " + this.tree.length + " top level elements, " + tree.reduce(function (a) {
            return a + 1
        }, 0) + " total elements]"
    },
    updateLastModified: function () {
        this.lastModified = Date.now();
        if (this.onModified) this.onModified()
    },
    disableCallbacks: function () {
        this.onModified = function () {}
    },
    getKeyMatcherFn: function (a, b) {
        return function (c) {
            return c[a] == b
        }
    },
    getObjectIdentityMatcher: function (a) {
        return function (b) {
            return b === a
        }
    }
};
extendClass(DataTree, Object, DataTree.prototype);
