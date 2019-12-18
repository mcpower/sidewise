/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var REFRESH_FAVICON_DELAYED_MS = 3E3,
    S2_FAVICON_UPDATE_DELAY_MS = 0,
    CHROME_FAVICON_UPDATE_DELAY_MS = 1E4,
    expectingNavigationTabIdSwap = !1,
    expectingNavigationOldTabId = null,
    expectingNavigationPossibleNewTabIds = [];

function registerWebNavigationEvents() {
    chrome.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTarget);
    chrome.webNavigation.onCommitted.addListener(onCommitted);
    chrome.webNavigation.onCompleted.addListener(onCompleted);
    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate)
}

function resetExpectingNavigation() {
    expectingNavigationTabIdSwap = !1;
    expectingNavigationOldTabId = null;
    expectingNavigationPossibleNewTabIds = []
}

function onCreatedNavigationTarget(a) {
    if (!(0 < a.frameId || -1 == a.tabId) && !monitorInfo.isDetecting()) {
        var b = tree.getNode(["chromeId", a.tabId]);
        log(a.tabId, a.sourceTabId, a, b, "parent", b.parent.id);
        b.placed = !0;
        if (b.parent instanceof WindowNode) {
            var c = tree.getNode(["chromeId", a.sourceTabId]);
            c ? c.windowId != b.windowId ? log("Not moving because opener and opened tabs are in different windows", c.windowId, b.windowId, c, b, a) : (log("Moving page to be child of its sourceTabId", a.tabId, a.sourceTabId, a), tree.moveNode(b,
                ["chromeId", a.sourceTabId]), tree.conformChromeTabIndexForPageNode(b, !0, !1, !0)) : log("Not moving because could not find sourceTabId " + a.sourceTabId)
        } else log("Not moving because page is already a child of some other page")
    }
}

function onCommitted(a) {
    if (!(0 < a.frameId || -1 == a.tabId) && !monitorInfo.isDetecting()) {
        var b = tree.getNode(["chromeId", a.tabId]);
        log(a.tabId, a, b);
        if (b && !b.placed)
            if (-1 < a.transitionQualifiers.indexOf("from_address_bar") || "auto_bookmark" == a.transitionType) {
                if (!(b.parent instanceof WindowNode)) {
                    a = tree.getNode(["chromeId", b.windowId]);
                    if (!a) throw Error("Could not find WindowNode to put page under that was opened via url bar alt-enter");
                    tree.updatePage(b, {
                        placed: !0
                    });
                    tree.moveNode(b, a)
                }
            } else if ("reload" ==
            a.transitionType) b.initialCreation && tryAssociateExistingToRestorablePageNode(b);
        else if ("link" == a.transitionType && -1 == a.transitionQualifiers.indexOf("client_redirect") && b.openerTabId && b.parent instanceof WindowNode) {
            var a = tree.getNode(["chromeId", b.openerTabId]),
                c = first(a.children, function (a) {
                    return a instanceof PageNode && !a.hibernated && a.unread && a.index > b.index
                });
            b.placed = !0;
            c ? (c = c[1], log("Moving page with link transitionType to be before predicted next-sibling " + c.id, c), tree.moveNodeRel(b, "before",
                c, !0)) : (log("Moving page with link transitionType to be last child of its opener " + a.id), tree.moveNodeRel(b, "append", a, !0))
        }
    }
}

function onBeforeNavigate(a) {
    if (!(0 < a.frameId || -1 == a.tabId)) {
        log(a);
        var b = tree.getNode(["chromeId", a.tabId]);
        if (b) {
            log("Marking existing page as preloading", b);
            tree.updateNode(b, {
                status: "preload"
            });
            var c = function () {
                chrome.tabs.get(a.tabId, function (c) {
                    if (c && (c.hibernated ? tree.updateNode(b, {
                            status: "complete"
                        }) : tree.updateNode(b, {
                            status: c.status
                        }), "complete" == c.status || c.hibernated)) TimeoutManager.clear("checkPageStatus1_" + a.tabId), TimeoutManager.clear("checkPageStatus2_" + a.tabId), TimeoutManager.clear("checkPageStatus3_" +
                        a.tabId)
                })
            };
            TimeoutManager.reset("checkPageStatus1_" + a.tabId, c, 2E3);
            TimeoutManager.reset("checkPageStatus2_" + a.tabId, c, 5E3);
            TimeoutManager.reset("checkPageStatus3_" + a.tabId, c, 15E3)
        } else 0 < associationConcurrentRuns ? log("Not expecting a tab id swap because associationConcurrentRuns == " + associationConcurrentRuns) : (log("Expecting a tab id swap", a.tabId), expectingNavigationTabIdSwap = !0, expectingNavigationPossibleNewTabIds.push(a.tabId))
    }
}

function onCompleted(a) {
    if (!(0 < a.frameId || -1 == a.tabId) && !monitorInfo.isDetecting() && void 0 !== tree.getNode(["chromeId", a.tabId])) log(a), tree.updatePage(a.tabId, {
        placed: !0,
        status: "complete",
        initialCreation: !1
    }), refreshFaviconAndTitle(a.tabId)
}

function refreshFaviconAndTitle(a) {
    chrome.tabs.get(a, function (b) {
        if (b) {
            var c = b.url ? dropUrlHash(b.url) : "";
            isStaticFavIconUrl(b.favIconUrl) ? (c = getBestFavIconUrl(b.favIconUrl, c), tree.updatePage(a, {
                favicon: c,
                title: getBestPageTitle(b.title, b.url)
            })) : setTimeout(function () {
                refreshFaviconTitleLateTimer(a)
            }, REFRESH_FAVICON_DELAYED_MS)
        }
    })
}

function refreshFaviconTitleLateTimer(a) {
    chrome.tabs.get(a, function (b) {
        if (b) {
            var c = getBestPageTitle(b.title, b.url),
                d = b.url ? dropUrlHash(b.url) : "";
            if (isStaticFavIconUrl(b.favIconUrl)) tree.updatePage(a, {
                favicon: getBestFavIconUrl(b.favIconUrl, d),
                title: c
            });
            else {
                if (b = splitUrl(d)) {
                    var e = "http://www.google.com/s2/favicons?domain=" + b.domain;
                    setTimeout(function () {
                        tree.updatePage(a, {
                            favicon: e,
                            title: c
                        })
                    }, S2_FAVICON_UPDATE_DELAY_MS)
                }
                setTimeout(function () {
                    chrome.tabs.get(a, function (b) {
                        if (b) {
                            var c = tree.getNode(["chromeId",
                                a
                            ]);
                            if (c && (!isStaticFavIconUrl(c.favicon) || 0 == c.favicon.indexOf("http://www.google.com/s2/favicons"))) isStaticFavIconUrl(b.favIconUrl) && b.favIconUrl != c.favicon ? tree.updatePage(c, {
                                favicon: b.favIconUrl
                            }) : tree.updatePage(c, {
                                favicon: getChromeFavIconUrl(c.url)
                            })
                        }
                    })
                }, CHROME_FAVICON_UPDATE_DELAY_MS)
            }
        }
    })
};
