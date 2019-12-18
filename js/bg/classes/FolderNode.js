/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var FolderNode = function (a) {
    this.$base();
    this.elemType = "folder";
    this.id = "f" + this.UUID;
    this.title = "";
    this.label = a
};
extendClass(FolderNode, PageTreeNode, {});
