/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var PageNode = function (a, b) {
    this.$base();
    this.id = "p" + this.UUID;
    this.elemType = "page";
    this.referrer = "";
    this.historylength = 1;
    this.unread = this.placed = !1;
    this.smartFocusParentTabId = null;
    this.restored = this.initialCreation = !1;
    this.incognito = a.incognito || !1;
    this.mediaTime = this.mediaState = this.sessionGuid = this.audible = null;
    this.restorable = this.restored = !1;
    if (a) {
        var c = a.url ? dropUrlHash(a.url) : "";
        this.chromeId = a.id;
        this.windowId = a.windowId;
        this.openerTabId = a.openerTabId;
        this.index = a.index;
        this.url = a.url;
        this.favicon = getBestFavIconUrl(a.favIconUrl,
            c);
        this.title = getBestPageTitle(a.title, a.url);
        this.status = b || a.status;
        this.pinned = a.pinned
    } else this.hibernated = !0, this.title = this.favicon = this.url = this.index = this.openerTabId = this.windowId = this.chromeId = null, this.status = b || "complete", this.pinned = !1
};
PageNode.prototype = {
    isTab: function () {
        return !this.hibernated
    }
};
extendClass(PageNode, PageTreeNode, PageNode.prototype);
