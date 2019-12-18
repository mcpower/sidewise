/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var WINDOW_DEFAULT_TITLE = getMessage("text_Window"),
    WindowNode = function (a) {
        this.$base();
        this.elemType = "window";
        this.title = WINDOW_DEFAULT_TITLE;
        this.id = "w" + this.UUID;
        a ? (this.chromeId = a.id, this.incognito = a.incognito, this.type = a.type) : (this.incognito = !1, this.type = "normal", this.hibernated = !0, this.old = this.restorable = this.restored = !1)
    };
extendClass(WindowNode, PageTreeNode, {});
