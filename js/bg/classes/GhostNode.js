/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var GhostNode=function(a,b){this.$base();this.elemType="ghost";this.id=a;this.ghostType=b;this.alive=!0};GhostNode.prototype={};extendClass(GhostNode,DataTreeNode,GhostNode.prototype);
