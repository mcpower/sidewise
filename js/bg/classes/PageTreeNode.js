/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var PageTreeNode=function(){this.$base();this.label=this.title="";this.restorable=this.hibernated=this.collapsed=this.highlighted=!1;this.createdOn=Date.now()};PageTreeNode.prototype={isTab:function(){return!1}};extendClass(PageTreeNode,DataTreeNode,PageTreeNode.prototype);
