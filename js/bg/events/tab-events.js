/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var TAB_REMOVE_SAVE_TREE_DELAY_MS = 3E3,
    SMART_FOCUS_DISABLE_FOR_TABS_CREATED_IN_LAST_MS = 8E3,
    expectingSmartFocusTabId = null,
    expectingTabMoves = [];

function registerTabEvents() {
    chrome.tabs.onCreated.addListener(onTabCreated);
    chrome.tabs.onRemoved.addListener(onTabRemoved);
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onMoved.addListener(onTabMoved);
    chrome.tabs.onActivated.addListener(onTabActivated);
    chrome.tabs.onDetached.addListener(onTabDetached);
    chrome.tabs.onAttached.addListener(onTabAttached);
    chrome.tabs.onHighlighted.addListener(onTabHighlighted)
}

function onTabCreated(a) {
    log(a, a.id);
    if (a.url === "") {
        if (a.pendingUrl === undefined) {
            // Chrome 79 bug where target="_blank" links have no URL
            // TODO: check for infinite loops here
            chrome.tabs.get(a.id, onTabCreated);
            return;
        } else {
            a.url = a.pendingUrl;
        }
    }
    if (!monitorInfo.isDetecting())
        if (sidebarHandler.creatingSidebar && a.url == sidebarHandler.sidebarUrl) log("ignoring creation of the sidebar");
        else {
            var c = !1;
            if (expectingNavigationTabIdSwap)
                if (0 <= expectingNavigationPossibleNewTabIds.indexOf(a.id)) {
                    if (expectingNavigationOldTabId) {
                        var b = tree.getNode(["chromeId", expectingNavigationOldTabId]);
                        if (b) {
                            log("Swapping in new tab id and url", "old", expectingNavigationOldTabId, "new", a.id, "found page node", b);
                            tree.updatePage(b, {
                                chromeId: a.id,
                                url: a.url,
                                windowId: a.windowId
                            });
                            refreshPageStatus(b);
                            resetExpectingNavigation();
                            return
                        }
                        log("Old page for swap no longer exists, so adding as new node", "old", expectingNavigationOldTabId, "new", a.id)
                    } else log("No tab closed just before the preloaded tab was created so creating preloaded as new node");
                    c = !0;
                    resetExpectingNavigation()
                } else log("Was expecting a tab id swap, but some other tab was created in the meantime");
            if (b = first(tree.awakeningPages, function (b) {
                    return b.url == a.url
                })) c = b[0], b = b[1], log("associating waking tab to existing hibernated page element",
                a, b), tree.updatePage(b, {
                chromeId: a.id,
                windowId: a.windowId,
                hibernated: !1,
                unread: !0,
                status: "preload"
            }), refreshPageStatus(b), tree.awakeningPages.splice(c, 1), fixPinnedUnpinnedTabOrder(b), tree.rebuildTabIndex();
            else if (isNewTabUrl(a.url) && !a.pinned && tree.getWindowIndexedTabsCount(a.windowId) == a.index) {
                b = tree.getNode(["chromeId", a.windowId]).children;
                if (0 < b.length && (b = b[b.length - 1], 0 == b.children.length && b.hibernated && b.restorable && b.url == a.url && !b.pinned)) {
                    restoreAssociatedPage(a, b);
                    log("New Tab associated to hibernated last-in-window New Tab node");
                    return
                }
                b = new PageNode(a, "complete");
                b.unread = !0;
                b.initialCreation = !1;
                tree.addTabToWindow(a, b);
                log("New Tab added to end of window")
            } else if (!tryFastAssociateTab(a, !1))
                if (b = new PageNode(a, "preload"), b.unread = !0, b.initialCreation = !1, refreshPageStatus(b), a.url && 0 == a.url.indexOf("view-source:") && a.openerTabId) tree.addNode(b, ["chromeId", a.openerTabId], void 0, !0);
                else if (a.url && !isScriptableUrl(a.url)) {
                log("Adding non scriptable tab to tree via association attempt", a.id, a, a.url);
                if (c = tree.getNode(["chromeId",
                        a.windowId
                    ]))
                    if (0 == a.index) tree.addNodeRel(b, "prepend", c);
                    else {
                        var d = tree.getTabByIndex(a.windowId, a.index);
                        d ? tree.addNodeRel(b, "before", d) : tree.addNodeRel(b, "append", c)
                    }
                else tree.addTabToWindow(a, b);
                associateExistingToRestorablePageNode(a)
            } else if (b.initialCreation = !0, c) log("Preloaded tab created as normal new tab, adding to end of window like normal alt+enter"), tree.addTabToWindow(a, b), tree.conformAllChromeTabIndexes(!0);
            else if (tree.focusedTabId == a.id && (log("Trying to counteract potential late-firing smart focus"),
                    chrome.tabs.update(a.id, {
                        active: !0
                    })), c = tree.getWindowTabIndexArray(a.windowId), c || (c = [], log("Could not obtain winTabs for windowId " + a.windowId)), a.openerTabId) {
                var e = tree.getNode(["chromeId", a.openerTabId]);
                if (e) {
                    var f = c[a.index - 1];
                    if (f) {
                        if (e === f) {
                            log("openerTabId corresponds to preceding page by index; making a child of opener " + e);
                            tree.addNodeRel(b, "prepend", e);
                            return
                        }
                        if (e === f.parent) {
                            log("openerTabId corresponds to parent of preceding page by index; inserting after preceding " + f.id);
                            tree.addNodeRel(b,
                                "after", f);
                            return
                        }
                    }(d = c[a.index]) ? (log("openerTabId does not correspond to preceding page nor its parent; insert purely by index before following node " + d.id), tree.addNodeRel(b, "before", d)) : 0 < c.length && a.index == c.length ? (log("Tab appears to be created as last tab in window, so just appending it to the window"), tree.addTabToWindow(a, b)) : (log("Could not find insert position on tab index basis, resorting to simple parent-append", e, d, f, c), tree.addNodeRel(b, "append", e), tree.conformAllChromeTabIndexes(!1))
                } else log("Could not find node matching openerTabId; just adding tab to window",
                    "openerTabId", openerTabId), tree.addTabToWindow(a, b), tree.conformAllChromeTabIndexes(!1)
            } else {
                e = c[a.index - 1];
                d = c[a.index];
                if (e && d) {
                    if (e.chromeId == tree.focusedTabId) {
                        log("Making child of previous by index because previous is also focused tab");
                        tree.addNodeRel(b, "prepend", e);
                        return
                    }
                    if (e.parent && e.parent.chromeId == tree.focusedTabId) {
                        log("Making sibling after previous-by-index because PBI's parent is focused tab");
                        tree.addNodeRel(b, "after", e);
                        return
                    }
                }
                d ? (log("No openerTabId and index is in middle of window's tabs; inserting before " +
                    d.id, d), tree.addNodeRel(b, "before", d)) : e ? (log("Place after previous by index", e.id, e), 0 < e.children.length ? tree.addNodeRel(b, "prepend", e) : tree.addNodeRel(b, "after", e)) : (log("nextByIndex not found though it should have been; just adding tab to window and scheduling full rebuild"), tree.addTabToWindow(a, b), tree.conformAllChromeTabIndexes(!1))
            }
        }
}

function onTabRemoved(a, c, b) {
    if (!monitorInfo.isDetecting() && a != sidebarHandler.tabId) {
        log(a, c, "denyTabSwap", b || !1);
        if (expectingNavigationTabIdSwap && !b)
            if (c.isWindowClosing) log("Window is closing with this tab removal, so stop expecting a tab swap"), resetExpectingNavigation();
            else {
                0 <= expectingNavigationPossibleNewTabIds.indexOf(a) ? (log("Expected preload tab has been removed, so stop expecting a tab swap", a, "not in", expectingPossibleNewTabIds), resetExpectingNavigation()) : (log("Recording expected navigation old tab id " +
                    a + " and retriggering onTabRemoved"), expectingNavigationOldTabId = a, setTimeout(function () {
                    tree.getNode(["chromeId", a]) && onTabRemoved(a, c, !0)
                }, 125));
                return
            } if (b = tree.getNode(["chromeId", a]))
            if (firstTimeInstallTabId == a) tree.removeNode(b), firstTimeInstallTabId = null, settings.get("firstTimeInstallDonatePageShown") || (settings.set("firstTimeInstallDonatePageShown", !0), chrome.tabs.create({
                url: "/options_install.html?page=donate",
                active: !0
            }));
            else {
                if (settings.get("smartFocusOnClose") && sidebarHandler.sidebarExists() &&
                    a == tree.focusedTabId)
                    if (Date.now() - b.createdOn < SMART_FOCUS_DISABLE_FOR_TABS_CREATED_IN_LAST_MS) log("Smart focus skipped due to removing tab being too recently created", (Date.now() - b.createdOn) / 1E3, "seconds old");
                    else {
                        var d = findNextTabToFocus(b, settings.get("smartFocusPrefersCousins"));
                        if (d) {
                            expectingSmartFocusTabId = d.chromeId;
                            TimeoutManager.reset("resetExpectingSmartFocusTabId", function () {
                                expectingSmartFocusTabId = null
                            }, 500);
                            try {
                                log("Smart focus queueing for tab " + d.chromeId, d.id), chrome.tabs.update(d.chromeId, {
                                    active: !0
                                }, function (a) {
                                    expectingSmartFocusTabId = null;
                                    TimeoutManager.clear("resetExpectingSmartFocusTabId");
                                    a ? log("Smart focused tab " + a.id) : (log("Smart focus tab no longer exists, letting Chrome decide"), focusCurrentTabInPageTree(!0))
                                })
                            } catch (e) {
                                log("Smart focus tab no longer exists, letting Chrome decide", d.chromeId), expectingSmartFocusTabId = null, TimeoutManager.clear("resetExpectingSmartFocusTabId")
                            }
                        } else log("Smart focus found nothing suitable, letting Chrome decide")
                    } b.hibernated || (d = b.parent,
                    disallowSavingTreeForDuration(TAB_REMOVE_SAVE_TREE_DELAY_MS), tree.removeNode(b), d instanceof WindowNode && 0 == d.children.length && tree.removeNode(d))
            }
    }
}

function findNextTabToFocus(a, c) {
    var b, d = a.topParent();
    if (!(d instanceof WindowNode && 1 >= d.children.length)) {
        for (var e = 0; e < a.children.length; e++)
            if (b = testNodeForFocus(a.children[e], !0)) return b;
        d = a.afterSiblings();
        for (e = 0; e < d.length; e++)
            if (b = testNodeForFocus(d[e], !0)) return b;
        if ((d = a.preceding(function (a) {
                return a.isTab()
            })) && -1 == a.parents().indexOf(d)) return d;
        if (a.isTab() && (a.parent.isTab() && 1 == a.parent.children.length) && (b = a.chromeId, e = a.parent.chromeId, b == tree.focusedTabId && e == tree.lastFocusedTabId ||
                b == tree.lastFocusedTabId && e == tree.focusedTabId)) return a.parent;
        if (c)
            for (e = a.parent.siblingIndex() + 1; e < a.parent.siblings().length; e++)
                if (0 < a.parent.siblings()[e].children.length && (b = testNodeForFocus(a.parent.siblings()[e].children[0], !0))) return b;
        if (settings.get("smartFocusPrefersParent") && a.parent.isTab()) return a.parent;
        if (b = a.following(function (a) {
                return a.isTab()
            }, a.topParent())) return b;
        if (d) return d
    }
}

function testNodeForFocus(a, c) {
    if (a.isTab()) return a.id;
    if (c && !a.collapsed)
        for (var b = 0; b < a.children.length; b++) {
            var d = testNodeForFocus(a.children[b], !0);
            if (d) return d
        }
}

function onTabUpdated(a, c, b) {
    log(b, c, a);
    if (a != sidebarHandler.tabId && !monitorInfo.isDetecting()) {
        var d = tree.getNode(["chromeId", a]);
        if (d) {
            "preload" == d.status && (log("Clearing checkPageStatuses"), TimeoutManager.clear("checkPageStatus1_" + a), TimeoutManager.clear("checkPageStatus2_" + a), TimeoutManager.clear("checkPageStatus3_" + a));
            var c = b.url ? dropUrlHash(b.url) : "",
                a = getBestPageTitle(b.title, c),
                e, f = isStaticFavIconUrl(d.favicon);
            f ? isStaticFavIconUrl(b.favIconUrl) ? e = getBestFavIconUrl(b.favIconUrl, c) : isScriptableUrl(c) ?
                c && d.url && (c = splitUrl(c), f = splitUrl(d.url), c && f && (e = c.domain != f.domain ? "chrome://favicon/" : d.favicon)) : e = f ? d.favicon : getBestFavIconUrl("", c) : e = getBestFavIconUrl(b.favIconUrl, c);
            !d.placed && !(d.parent instanceof WindowNode) && !b.openerTabId && d.openerTabId ? (c = d.topParent(), (f = first(c.children, function (a) {
                return a instanceof PageNode && !a.hibernated && a.index > d.index
            })) ? (f = f[1], tree.moveNodeRel(d, "before", f)) : tree.moveNodeRel(d, "append", c), d.placed = !0) : !d.placed && (b.openerTabId && !d.openerTabId && d.parent.chromeId !=
                b.openerTabId) && ((c = tree.getNode(["chromeId", b.openerTabId])) ? ((f = first(c.children, function (a) {
                return a.isTab() && a.index > b.index
            })) ? (f = f[1], log("Moving node which now has openerTabId to be ordered child of correct parent", "moving", d.id, "before", f, f.id, "parent", c.id), tree.moveNodeRel(d, "before", f)) : !d.pinned && c.following(function (a) {
                return a.isTab() && a.pinned
            }, c.topParent()) ? log("Denying move-to-child because doing so would put unpinned page before pinned one") : (log("Moving node which now has openerTabId to be NON ordered child of correct parent",
                "moving", d.id, "append", c.id), tree.moveNodeRel(d, "append", c)), d.placed = !0) : console.error("Could not find correct parent by openerTabId " + b.openerTabId));
            tree.updateNode(d, {
                status: b.status,
                url: b.url,
                favicon: e,
                title: a,
                pinned: b.pinned,
                openerTabId: b.openerTabId,
                mediaState: "unstarted",
                mediaTime: 0
            });
            b.url.match(/^chrome-/) && setTimeout(function () {
                chrome.tabs.get(b.id, function (a) {
                    tree.updatePage(b.id, {
                        title: getBestPageTitle(a.title)
                    })
                })
            }, 1E3);
            getPageDetails(b.id, {
                action: "store"
            })
        }
    }
}

function onTabMoved(a, c) {
    log(a, c);
    if (removeFromExpectingTabMoves(a)) {
        log("Was expecting this tab move, just updating windowId and index");
        var b = tree.getNode(["chromeId", a]);
        tree.removeFromTabIndex(b);
        b.index = c.toIndex;
        b.windowId = c.windowId;
        tree.addToTabIndex(b)
    } else tree.updatePageIndex(a, c.windowId, c.fromIndex, c.toIndex)
}

function removeFromExpectingTabMoves(a) {
    a = expectingTabMoves.indexOf(a);
    return -1 < a ? (expectingTabMoves.splice(a, 1), !0) : !1
}

function onTabActivated(a) {
    var c = a.tabId,
        b = a.windowId;
    log(c, b);
    if (!monitorInfo.isDetecting() && !sidebarHandler.creatingSidebar && sidebarHandler.tabId != c) {
        if (expectingSmartFocusTabId) {
            if (expectingSmartFocusTabId != c) return;
            expectingSmartFocusTabId = null
        }
        if (!tree.focusedTabId || tree.getNode(["chromeId", c])) tree.focusPage(c);
        else {
            var d = tree.focusedTabId;
            chrome.tabs.get(d, function (e) {
                e ? tree.focusPage(c) : (e = tree.getNode(["chromeId", d])) ? (log("Swapping in new tab id and url", "old", d, "new", c, "found page node",
                    e), tree.updatePage(e, {
                    chromeId: c,
                    windowId: b
                }), refreshPageStatus(e), refreshFaviconAndTitle(c), resetExpectingNavigation()) : (log("Focused tab does not have a page node to do preload tab swapping against after tab focused", d, a), tree.focusPage(c))
            })
        }
    }
}

function onTabDetached(a) {
    (a = tree.getNode(["chromeId", a])) && tree.removeFromTabIndex(a)
}

function onTabAttached(a, c) {
    log(a, c);
    var b = tree.getNode(["chromeId", a]);
    if (!b) throw Error("Could not find page with tab id " + a);
    b.windowId = c.newWindowId;
    b.index = c.newPosition;
    if (removeFromExpectingTabMoves(a)) log("Was expecting this tab move, just updating its windowId and index");
    else {
        var d = b.topParent();
        d instanceof WindowNode && !d.hibernated && d.chromeId == c.newWindowId && tree.getTabIndex(b) == c.newPosition ? log("attach move would have no effect, just updating moving.windowId/index, windowId " + c.newWindowId +
            " index " + c.newPosition) : (log("moving node in tree to window " + c.newWindowId + ", to index " + c.newPosition), 0 <= tree.getTabIndex(b) && (log("attached node exists already in tree, removing before doing lookup"), tree.removeFromTabIndex(b)), log("indexes look like this before getting before", b.id, b.index, tree.getWindowTabIndexArray(c.newWindowId)), (d = tree.getTabByIndex(c.newWindowId, b.index)) ? b.following() === d ? log("moving node is already before " + d.id + " in tree, not moving") : (log("moving to before " + d.id,
            d), tree.moveNodeRel(b, "before", d)) : (log("moving to last node under window " + c.newWindowId), tree.moveNodeRel(b, "append", ["chromeId", c.newWindowId])), tree.rebuildPageNodeWindowIds(function () {
            tree.rebuildTabIndex()
        }))
    }
}

function onTabHighlighted(a) {
    var c = tree.getNode(["chromeId", a.windowId]),
        c = c ? c.id : void 0,
        a = a.tabIds.map(function (a) {
            return (a = tree.getNode(["chromeId", a])) ? a.id : void 0
        });
    PageTreeCallbackProxy("multiSelectInWindow", {
        windowNodeId: c,
        pageNodeIds: a
    })
};
