/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var DataTreeRootNode = function (a) {
    this.$base();
    this.type = "root";
    this.isRoot = !0;
    this.hostTree = a
};
extendClass(DataTreeRootNode, DataTreeNode, {});
