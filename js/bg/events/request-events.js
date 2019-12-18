/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var GET_PAGE_DETAILS_SCRIPT = "chrome.runtime.sendMessage( { op: 'getPageDetails', referrer: document.referrer, historylength: history.length, title: document.title, action: '<ACTION>' }, function() { console.log('++++++++++++++++++++++'); } );",
    GET_IS_FULL_SCREEN_SCRIPT = "chrome.runtime.sendMessage({ op: 'getIsFullScreen', isFullScreen: document.webkitIsFullScreen });",
    connectedTabs = {};

function registerRequestEvents() {
    chrome.runtime.onMessage.addListener(onMessage);
    chrome.runtime.onConnect.addListener(onConnectPort)
}

function onConnectPort(a) {
    log("onConnect", a);
    a.sender.tab && (connectedTabs[a.sender.tab.id] = a, a.onMessage.addListener(function (b) {
        onPortMessage(a, b)
    }), a.onDisconnect.addListener(function () {
        onPortDisconnect(a)
    }))
}

function onPortMessage(a, b) {
    switch (b.op) {
        case "getPageDetails":
            onGetPageDetailsMessage(a.sender.tab, b)
    }
}

function onPortDisconnect(a) {
    if (a.sender.tab && (connectedTabs[a.sender.tab.id] && delete connectedTabs[a.sender.tab.id], expectingNavigationTabIdSwap)) {
        var b = expectingNavigationPossibleNewTabIds.indexOf(a.sender.tab.id);
        0 <= b && (log("Removed preloading tab from expected nav swap list", a.sender.tab.id), expectingNavigationPossibleNewTabIds.splice(b, 1), log("Remaining list", expectingNavigationPossibleNewTabIds));
        0 == expectingNavigationPossibleNewTabIds.length && (log("No more preloading tabs on the expected list, cancelling expectation"),
            resetExpectingNavigation())
    }
}

function getPort(a) {
    return connectedTabs[a]
}

function onMessage(a, b) {
    log(a, b);
    if (b.tab) switch (a.op) {
        case "getPageDetails":
            onGetPageDetailsMessage(b.tab, a);
            break;
        case "getIsFullScreen":
            onGetIsFullScreenMessage(b.tab, a);
            break;
        case "updateMediaState":
            onGetUpdateMediaStateMessage(b.tab, a);
            break;
        default:
            throw Error("Unrecognized onMessage op " + a.op);
    }
}

function onGetUpdateMediaStateMessage(a, b) {
    var c = tree.getNode(["chromeId", a.id]);
    c ? tree.updateNode(c, {
        mediaState: b.state,
        mediaTime: b.time
    }, !0) : console.error("Cannot find page for updating media state " + a.id)
}

function getIsFullScreen(a) {
    executeContentScript(a.url, a.id, GET_IS_FULL_SCREEN_SCRIPT)
}

function onGetIsFullScreenMessage(a, b) {
    b.isFullScreen ? log("Denying auto-raise of sidebar because current window's tab is in fullscreen mode") : sidebarHandler.sidebarExists() ? (log("Auto-raising sidebar because current window's tab is NOT in fullscreen mode"), chrome.windows.update(sidebarHandler.windowId, {
        focused: !0
    }, function () {
        chrome.windows.update(focusTracker.getFocused(), {
            focused: !0
        })
    })) : log("Denying auto-raise of sidebar because it has ceased to exist")
}

function getPageDetails(a, b) {
    var c = getPort(a);
    if (!c) return log("Cannot get page details due to unavailable port for tab", "tabId", a), !1;
    b.op = "getPageDetails";
    try {
        c.postMessage(b)
    } catch (d) {
        return console.error(d), !1
    }
    return !0
}

function onGetPageDetailsMessage(a, b) {
    var c = a.id,
        d = tree.getNode(["chromeId", c]);
    switch (b.action) {
        case "store":
            if (void 0 === d) {
                log("Page not in tree, probably because Chrome is just preloading it");
                return
            }
            c = {
                referrer: b.referrer,
                historylength: b.historylength,
                sessionGuid: b.sessionGuid
            };
            b.title && (c.title = b.title);
            b.favicon && "complete" == d.status && (c.favicon = b.favicon);
            tree.updatePage(d, c);
            break;
        case "associate":
            associationStubbornTabIds = {};
            associateTabToPageNode(b.runId, a, b.referrer, b.historylength);
            break;
        case "associate_existing":
            associateExistingToRestorablePageNode(a, b.referrer, b.historylength, b.sessionGuid);
            break;
        case "find_parent":
            var e = tree.getNode(function (a) {
                return a instanceof PageNode && a !== d && dropUrlHash(a.url) == b.referrer && a.windowId === d.windowId
            });
            log("find_parent", "page.id", d.id, "msg.referrer", b.referrer, "msg.historylength", b.historylength, "parent found", e);
            if (e && (!d.pinned && !e.following(function (a) {
                    return a.isTab() && a.pinned
                }, e.topParent()) || d.pinned && !e.preceding(function (a) {
                    return a.isTab() &&
                        !a.pinned
                }, e.topParent()))) log("making " + c + " a child of " + e.id), tree.moveNode(d, e, void 0, !0);
            c = {
                placed: !0,
                referrer: b.referrer,
                historylength: b.historylength,
                sessionGuid: b.sessionGuid
            };
            b.title && (c.title = b.title);
            log("find_parent updating page node", d.id, "page", d, "new details", c);
            tree.updateNode(d, c);
            tree.conformAllChromeTabIndexes();
            break;
        default:
            throw Error("Unknown msg.action");
    }
    return !0
};
