/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var bg, settings;

function initSidebarPane() {
    void 0 === chrome.extension && (chrome = window.parent.chrome);
    bg = chrome.extension.getBackgroundPage();
    settings = bg.settings;
    $ && $.fx && ($.fx.off = !settings.get("animationEnabled"))
};
