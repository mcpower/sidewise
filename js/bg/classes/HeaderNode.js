/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var HeaderNode=function(){this.$base();this.elemType="header";this.id="h"+this.UUID;this.collecting=!1};HeaderNode.prototype={};extendClass(HeaderNode,PageTreeNode,HeaderNode.prototype);
