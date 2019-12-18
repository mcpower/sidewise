/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var DataTreeNode = function () {
    this.id = this.UUID = generateGuid();
    this.elemType = "node";
    this.children = [];
    this.root = this.parent = null
};
DataTreeNode.prototype = {
    toString: function () {
        return this.elemType + ":" + this.id
    },
    parents: function () {
        for (var a = [], c = this.parent; c;) a.push(c), c = c.parent;
        return a
    },
    topParent: function () {
        for (var a = this; a.parent && !a.parent.isRoot;) a = a.parent;
        return a === this ? null : a
    },
    siblings: function () {
        return this.parent.children
    },
    siblingIndex: function () {
        return this.parent.children.indexOf(this)
    },
    beforeSibling: function () {
        var a = this.siblingIndex() - 1;
        if (!(0 > a)) return this.parent.children[a]
    },
    beforeSiblings: function () {
        return this.siblings().slice(0,
            this.siblingIndex()).reverse()
    },
    afterSibling: function () {
        var a = this.siblingIndex() + 1;
        if (!(a >= this.parent.children.length)) return this.parent.children[a]
    },
    afterSiblings: function () {
        return this.siblings().slice(this.siblingIndex() + 1)
    },
    precedingNodes: function (a) {
        var c = !1,
            b = this;
        a || (a = this.root);
        return this.root.hostTree.filter(function (a) {
            if (a === b) {
                c = true;
                return false
            }
            return c ? false : true
        }, a.children)
    },
    preceding: function (a, c) {
        var b = this.precedingNodes(c);
        if (0 != b.length) {
            if (!a) return b[b.length - 1];
            if (b =
                first(b.reverse(), function (b) {
                    return a(b)
                })) return b[1]
        }
    },
    followingNodes: function (a) {
        var c = !1,
            b = this;
        a || (a = this.root);
        return this.root.hostTree.filter(function (a) {
            if (a === b) {
                c = true;
                return false
            }
            return !c ? false : true
        }, a.children)
    },
    following: function (a, c) {
        var b = this.followingNodes(c);
        if (0 != b.length) {
            if (!a) return b[0];
            if (b = first(b, function (b) {
                    return a(b)
                })) return b[1]
        }
    }
};
extendClass(DataTreeNode, Object, DataTreeNode.prototype);
