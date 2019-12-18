/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var ASSOCIATE_PAGES_CHECK_INTERVAL_MS = 1E3,
    ASSOCIATE_PAGES_CHECK_INTERVAL_MS_SLOW = 1E4,
    ASSOCIATE_STUBBORN_TAB_FALLBACK_THRESHOLD_MS = 15E3,
    ASSOCIATE_STUBBORN_TAB_FALLBACK_THRESHOLD_ITERATIONS = ASSOCIATE_STUBBORN_TAB_FALLBACK_THRESHOLD_MS / ASSOCIATE_PAGES_CHECK_INTERVAL_MS,
    CLEANUP_AFTER_ASSOCIATION_RUN_DELAY_MS = 500,
    CLEANUP_AFTER_ASSOCIATE_EXISTING_PAGE_DELAY_MS = 5E3,
    ASSOCIATE_GET_DETAILS_MAX_RETRIES = 30,
    ASSOCIATE_GET_DETAILS_RETRY_WAIT_MS = 1500,
    CHROME_BLANKABLE_REFERRER_REGEXP = RegExp(/^http.+google.+\/(search\?.*sugexp=chrome,mod=\d+\&sourceid=chrome|url\?.*source=web)/),
    associationRuns = {},
    associationStubbornTabIds = {},
    associationConcurrentRuns = 0,
    associationGetDetailsRetryList = {};

function startAssociationRun() {
    0 < associationConcurrentRuns || (fixBadNodes(), chrome.tabs.query({}, function (b) {
        if (!(0 < associationConcurrentRuns)) {
            var a = generateGuid(),
                c = {
                    runId: a,
                    total: 0,
                    count: 0,
                    tabIds: []
                };
            associationRuns[a] = c;
            associationConcurrentRuns++;
            log("Starting a new association run", "runId", a, "runInfo", c);
            for (var f in b) {
                var d = b[f];
                sidebarHandler.tabId == d.id || d.url == chrome.extension.getURL("/sidebar.html") || tree.getNode(["chromeId", d.id]) || tryAssociateTab(c, d) || c.total++
            }
            0 == c.total ? (log("No unassociated tabs left to associate; ending association run and doing parent window guessing"),
                endAssociationRun(a)) : (log("Started association process, tabs in queue: " + c.total), TimeoutManager.reset(a, function () {
                associatePagesCheck(a)
            }, ASSOCIATE_PAGES_CHECK_INTERVAL_MS))
        }
    }))
}

function endAssociationRun(b) {
    log("Ending association run", b, associationRuns[b]);
    delete associationRuns[b];
    associationConcurrentRuns--;
    tree.rebuildTabIndex();
    rectifyAssociations(CLEANUP_AFTER_ASSOCIATION_RUN_DELAY_MS);
    try {
        TimeoutManager.clear(b)
    } catch (a) {
        if ("A timeout with the given label does not exist" != a.message) throw a;
    }
}

function tryAssociateTab(b, a, c) {
    var f = b.runId;
    if (a.incognito) return !1;
    if (!c && isNewTabUrl(a.url) && 0 == a.index && !a.pinned) return chrome.tabs.query({
        windowId: a.windowId
    }, function (c) {
        1 == c.length ? tree.addTabToWindow(a, new PageNode(a)) : tryAssociateTab(b, a, !0)
    }), !1;
    if (tryFastAssociateTab(a, !0)) return !0;
    if (isNewTabUrl(a.url)) return tree.addTabToWindow(a, new PageNode(a)), !0;
    if (!isScriptableUrl(a.url)) return log("Doing blind association for non scriptable tab", a.id, a.url), associateTabToPageNode(f, a), !0;
    b.tabIds.push(a.id);
    getPageDetails(a.id, {
        action: "associate",
        runId: f
    }) || log("Port does not exist for association yet", "tabId", a.id, "runId", f);
    return !1
}

function tryFastAssociateTab(b, a) {
    var c = tree.getNode(["chromeId", b.windowId]),
        c = tree.filter(function (c) {
            return c instanceof PageNode && c.hibernated && (!a || c.restorable) && b.url == c.url && b.index == c.index && b.incognito == c.incognito && b.pinned == c.pinned
        }, c ? c.children : void 0);
    if (1 == c.length || 0 < c.length && !isScriptableUrl(b.url)) return c = c[0], log("doing fast associate", b, c, b.id, c.id, "pinned states", b.pinned.toString(), c.pinned.toString()), restoreAssociatedPage(b, c), isScriptableUrl(b.url) && getPageDetails(b.id, {
        action: "store"
    }), c
}

function tryAssociateExistingToRestorablePageNode(b) {
    var a = b.chromeId;
    if (a)
        if (getPageDetails(a, {
                action: "associate_existing"
            })) delete associationGetDetailsRetryList[a];
        else {
            var c = b.id;
            (b = tree.getNode(c)) ? (c = associationGetDetailsRetryList[a] || 0, c >= ASSOCIATE_GET_DETAILS_MAX_RETRIES ? (console.error("Exceeded max retries for getting page details", a, b), delete associationGetDetailsRetryList[a]) : (log("Port does not exist for existing-to-restorable association yet, retrying shortly", "tabId", a, "existing page",
                b), associationGetDetailsRetryList[a] = c + 1, setTimeout(function () {
                tryAssociateExistingToRestorablePageNode(b)
            }, ASSOCIATE_GET_DETAILS_RETRY_WAIT_MS))) : log("Page no longer exists to get page details from", c)
        }
    else console.error("tabId not available for provided existingPage", b.id, b)
}

function associateExistingToRestorablePageNode(b, a, c, f) {
    var d = b.id,
        g = tree.getNode(["chromeId", d]);
    log("associating existing to restorable", "tabId", d, "existing", g, "referrer", a, "historylength", c);
    if (f && (f = recentlyClosedTree.getNode(["sessionGuid", f]))) {
        moveReopenedNode(g, f);
        return
    }(f = findPageNodeForAssociation({
        mustBeHibernated: !0,
        mustBeRestorable: !0,
        url: b.url,
        referrer: a,
        historylength: c,
        pinned: b.pinned,
        incognito: b.incognito
    })) ? (log("Restorable match found", "match", f, "match.id", f.id), tree.mergeNodes(g,
        f), restoreAssociatedPage(b, f), void 0 !== a && (f.referrer = a), void 0 !== c && (f.historylength = c), rectifyAssociations(CLEANUP_AFTER_ASSOCIATE_EXISTING_PAGE_DELAY_MS)) : log("No restorable match found")
}

function rectifyAssociations(b) {
    TimeoutManager.reset("rectifyAssociations", function () {
        tree.rebuildPageNodeWindowIds(function () {
            associateWindowstoWindowNodes(!0, !1, function () {
                disambiguatePageNodesByWindowId();
                associateWindowstoWindowNodes(true, true, function () {
                    disambiguatePageNodesByWindowId();
                    associateWindowstoWindowNodes(false, true, function () {
                        disambiguatePageNodesByWindowId();
                        associateWindowstoWindowNodes(false, false, function () {
                            disambiguatePageNodesByWindowId();
                            movePageNodesToCorrectWindows(function () {
                                fixBadNodes();
                                removeZeroChildWindowNodes();
                                tree.rebuildPageNodeWindowIds(function () {
                                    tree.rebuildTabIndex();
                                    tree.rebuildIndexes();
                                    tree.rebuildParents();
                                    fixAllPinnedUnpinnedTabOrder();
                                    swapPageNodesByIndex();
                                    tree.conformAllChromeTabIndexes(true);
                                    tree.conformAllChromeTabIndexes(false);
                                    var a = settings.get("backupPageTree", []);
                                    (!a || a.length == 0) && backupPageTree(true);
                                    log("Rectification complete")
                                })
                            })
                        })
                    })
                })
            })
        })
    }, b || 1)
}

function associatePagesCheck(b) {
    var a = associationRuns[b];
    if (a) {
        log("associatePagesCheck", "total", a.total, "count", a.count, "tabIds", a.tabIds);
        log("stubborn tabs list before update", JSON.stringify(associationStubbornTabIds));
        for (var c in a.tabIds) {
            var f = a.tabIds[c],
                d = (associationStubbornTabIds[f] || 0) + 1;
            d >= ASSOCIATE_STUBBORN_TAB_FALLBACK_THRESHOLD_ITERATIONS ? chrome.tabs.get(f, function (a) {
                    log("Using fallback association for stubborn tab", "tabId", a.id, "runId", b);
                    associateTabToPageNode(b, a)
                }) : associationStubbornTabIds[f] =
                d
        }
        log("stubborn tabs list after update", JSON.stringify(associationStubbornTabIds));
        endAssociationRun(b);
        startAssociationRun()
    } else log("Association run is already ended", b)
}

function associateTabToPageNode(b, a, c, f) {
    log("Associating tab", "runId", b, "tabId", a.id, "url", a.url, "referrer", c, "historylength", f, "associationRuns", associationRuns);
    var d = associationRuns[b];
    d && (d.tabIds.splice(d.tabIds.indexOf(a.id), 0), TimeoutManager.reset(b, function () {
        associatePagesCheck(b)
    }, ASSOCIATE_PAGES_CHECK_INTERVAL_MS), d.count++);
    tree.getNode(["chromeId", a.id]) || ((d = findPageNodeForAssociation({
        mustBeHibernated: !0,
        mustBeRestorable: !0,
        topParentMustBeRealOrRestorableWindow: !0,
        url: a.url,
        referrer: c,
        historylength: f,
        pinned: a.pinned,
        incognito: a.incognito
    })) ? (log("matching PageNode found, restoring", a.id, a, "match", d.id, d, "pinned states", a.pinned.toString(), d.pinned.toString()), restoreAssociatedPage(a, d)) : (log("no matching PageNode found, adding to a new window", a.id, a), tree.addTabToWindow(a, void 0, function (b) {
        tree.updateNode(b, {
            referrer: c || "",
            historylength: f || 1
        });
        a.active && focusTracker.getFocused() == a.windowId && tree.focusPage(a.id)
    })))
}

function restoreAssociatedPage(b, a) {
    log("restoring associated page", "tab", b.id, b, "page", a.id, a, b.url, a.url);
    tree.updateNode(a, {
        restored: !0,
        hibernated: !1,
        restorable: !1,
        chromeId: b.id,
        windowId: b.windowId,
        index: b.index,
        pinned: b.pinned
    });
    chrome.tabs.get(b.id, function (b) {
        tree.updateNode(a, {
            status: b.status
        })
    });
    b.active && focusTracker.getFocused() == b.windowId && tree.focusPage(b.id);
    var c = a.topParent();
    restoreParentWindowViaUniqueChildPageNode(c, a, b.windowId);
    fixPinnedUnpinnedTabOrder(a);
    return a
}

function restoreParentWindowViaUniqueChildPageNode(b, a, c) {
    b instanceof WindowNode && b.hibernated && !findPageNodeForAssociation({
        url: a.url,
        title: a.title,
        referrer: a.referrer,
        historylength: a.historylength,
        notMatchingNode: a,
        pinned: a.pinned,
        incognito: a.incognito
    }) && ((a = tree.getNode(["chromeId", c])) && tree.mergeNodes(a, b), tree.updateNode(b, {
        restorable: !1,
        hibernated: !1,
        chromeId: c,
        title: WINDOW_DEFAULT_TITLE
    }), tree.expandNode(b))
}

function findPageNodeForAssociation(b, a) {
    function c(a) {
        if (!(a instanceof PageNode)) return !1;
        var c = !1;
        if (g) {
            if (!isGoogleSearchUrl(a.url)) return !1;
            c = getGoogleTestUrl(a.url) == e
        } else c = d == a.url;
        if (b.mustBeHibernated && !0 !== a.hibernated || (b.mustBeRestorable && !0 !== a.restorable || !c || b.title && a.title != b.title || !(void 0 === b.incognito || a.incognito == b.incognito) || !(void 0 === b.pinned || a.pinned == b.pinned) || !(void 0 === b.historylength || a.historylength == b.historylength) || !(void 0 === b.notMatchingNode || a !== b.notMatchingNode)) ||
            b.topParentMustBeRealOrRestorableWindow && (c = a.topParent(), !(c instanceof WindowNode) || !1 == c.restorable && !0 == c.hibernated)) return !1;
        if (void 0 === b.referrer || b.referrer == a.referrer || b.pinned && a.pinned) return !0;
        (c = a.referrer) && CHROME_BLANKABLE_REFERRER_REGEXP.test(a.referrer) && (c = "");
        return f == c ? !0 : !1
    }
    var f = b.referrer;
    b.referrer && CHROME_BLANKABLE_REFERRER_REGEXP.test(b.referrer) && (f = "");
    var d = b.url,
        g = !1;
    if (isGoogleSearchUrl(d)) var g = !0,
        e = getGoogleTestUrl(d);
    return a ? tree.filter(c) : tree.getNode(c)
}

function isGoogleSearchUrl(b) {
    return b.match(/^https?:\/\/.*google.*\/search\?q=/)
}

function getGoogleTestUrl(b) {
    return b.replace(/sei=[a-zA-Z0-9]+/g, "").replace(/\#.+$/, "")
}

function associateWindowstoWindowNodes(b, a, c) {
    var f = tree.filter(function (a) {
        return "window" == a.elemType && !0 == a.restorable
    });
    0 == f.length ? c && c() : (log("Restorable window set ids", f.map(function (a) {
        return a.id
    })), chrome.tabs.query({}, function (d) {
        for (var g = {}, e = d.length - 1; 0 <= e; e--) g[d[e].windowId] = (g[d[e].windowId] || 0) + 1;
        for (var j = {}, h = {}, e = f.length - 1; 0 <= e; e--) {
            var i = f[e],
                m = tree.reduce(function (a, c) {
                    if (!c.isTab()) return a;
                    var b = c.chromeId,
                        f = first(d, function (a) {
                            return a.id == b
                        })[1],
                        e = f.windowId;
                    if (c.pinned !=
                        f.pinned || c.incognito != f.incognito) return a;
                    h[i.id] = (h[i.id] || 0) + 1;
                    a[e] = (a[e] || 0) + 1 + (c.index == f.index ? 1E-5 : 0);
                    return a
                }, {}, i.children),
                n;
            for (n in m) {
                var l = m[n].toString();
                j[l] ? j[l].push([i, n]) : j[l] = [
                    [i, n]
                ]
            }
        }
        log("Window association counts, window node vs. descendant tabs with matching .windowId", j);
        log("Window association counts, tabs per Chrome window", g);
        log("Window association counts, total tabs per window node", h);
        m = [];
        for (l in j) m.push(parseFloat(l));
        m.sort();
        l = [];
        n = [];
        for (e = m.length - 1; 0 <= e; e--)
            for (var q =
                    j[m[e].toString()], p = q.length - 1; 0 <= p; p--) {
                var k = q[p],
                    i = k[0],
                    k = parseInt(k[1]);
                if (0 <= l.indexOf(k) || 0 <= n.indexOf(i)) log("Skipping win-to-node match because windowId or node has already been restored", i.id, k);
                else if (b && h[i.id] != g[k]) log("Skipping win-to-node match due to differing wake tab child counts", i.id, k, "counts", h[i.id], g[k]);
                else {
                    var o = tree.getNode(["chromeId", k]);
                    if (o)
                        if (a) {
                            log("Merging windows not allowed, though we did find an existing node with this window id already in existence", o.id, i.id);
                            continue
                        } else log("Merging windows", o.id, i.id), mergeWindowsPreservingTabIndexes(o, i), tree.mergeNodes(o, i);
                    log("Restoring window node", i.id, "as window id", k);
                    tree.updateNode(i, {
                        restorable: !1,
                        hibernated: !1,
                        chromeId: k,
                        title: WINDOW_DEFAULT_TITLE
                    });
                    tree.expandNode(i);
                    l.push(k);
                    n.push(i)
                }
            }
        c && c()
    }))
}

function disambiguatePageNodesByWindowId(b) {
    var a = 0;
    void 0 === b && (b = 3);
    var c = tree.groupBy(function (a) {
            if (a.isTab()) {
                var c = a.topParent();
                return !c || a.windowId == c.chromeId ? void 0 : [a.url, a.referrer, a.historylength, a.pinned, a.incognito].join("|")
            }
        }),
        f;
    for (f in c) {
        var d = c[f];
        if (!(2 > d.length))
            for (var g = 0; g < d.length; g++) {
                var e = d[(g + b) % d.length];
                e.topParent();
                var j = e.topParent().chromeId;
                if (e.windowId != j) {
                    a++;
                    var h;
                    h = d.filter(function (a) {
                        return a !== e && a.windowId == j && e.windowId == a.topParent().chromeId && a.index ==
                            e.index
                    });
                    if (0 == h.length && (h = d.filter(function (a) {
                            return a !== e && a.windowId == j && e.windowId == a.topParent().chromeId
                        }), 0 == h.length && (h = d.filter(function (a) {
                            return a !== e && e.windowId == a.topParent().chromeId
                        }), 0 == h.length && (h = d.filter(function (a) {
                            return a !== e && a.windowId == j
                        }), 0 == h.length)))) {
                        log("Disambiguation missed:", a, f, g, e);
                        continue
                    }
                    log("Swapping for disambiguation:", a, "page ids", e.id, h[0].id, ".windowIds", e.windowId, h[0].windowId, "topParentIds", e.topParent().id, h[0].topParent().id, "group", f, d);
                    var i =
                        e.chromeId;
                    tree.updateNode(e, {
                        chromeId: h[0].chromeId
                    });
                    tree.updateNode(h[0], {
                        chromeId: i
                    });
                    i = e.windowId;
                    tree.updateNode(e, {
                        windowId: h[0].windowId
                    });
                    tree.updateNode(h[0], {
                        windowId: i
                    });
                    i = e.index;
                    tree.updateNode(e, {
                        index: h[0].index
                    });
                    tree.updateNode(h[0], {
                        index: i
                    });
                    log("After swap, primary windowid matchup is", e.windowId, e.topParent().chromeId);
                    h = tree.getNode(h[0].id);
                    log("After swap, secondary windowid matchup is", h.windowId, h.topParent().chromeId)
                }
            }
    }
    0 < a && 1 < b && disambiguatePageNodesByWindowId(b - 1)
}

function swapPageNodesByIndex() {
    var b = tree.groupBy(function (a) {
            if (a.isTab()) {
                var c = a.topParent();
                return !c ? void 0 : [c.id, a.url, a.referrer, a.historylength, a.pinned, a.incognito].join("|")
            }
        }),
        a;
    for (a in b) {
        var c = b[a];
        if (!(2 > c.length))
            for (var f = 0; f < c.length; f++) {
                var d = c[f];
                if (d.index != tree.getTabIndex(d)) {
                    var g = c.filter(function (a) {
                        return tree.getTabIndex(a) == d.index
                    });
                    if (0 < g.length) {
                        log("Swapping for index correction:", "page ids", d.id, g[0].id, "indexes", d.index, g[0].index);
                        var e = d.index;
                        tree.updateNode(d, {
                            index: g[0].index
                        });
                        tree.updateNode(g[0], {
                            index: e
                        });
                        e = d.chromeId;
                        tree.updateNode(d, {
                            chromeId: g[0].chromeId
                        });
                        tree.updateNode(g[0], {
                            chromeId: e
                        })
                    }
                }
            }
    }
}

function movePageNodesToCorrectWindows(b) {
    tree.rebuildPageNodeWindowIds(function () {
        chrome.tabs.query({}, function (a) {
            a.forEach(function (a) {
                if (a.url != chrome.extension.getURL("/sidebar.html")) {
                    var b = tree.getNode(["chromeId", a.id]);
                    if (b) {
                        var d = b.topParent();
                        d instanceof WindowNode && !d.isRoot && !d.hibernated && d.chromeId != a.windowId && (log("Page node is under wrong window node, moving it", a.id, b.id, a, b), (d = tree.getNode(function (b) {
                            return b.isTab() && b.windowId == a.windowId && b.topParent().chromeId == a.windowId &&
                                b.index == a.index + 1
                        })) ? (log("Moving", b.id, "before", d), tree.moveNodeRel(b, "before", d)) : (d = tree.getNode(function (b) {
                            return b.isTab() && b.windowId == a.windowId && b.topParent().chromeId == a.windowId && b.index == a.index - 1
                        })) ? (log("Moving", b.id, "after", d), tree.moveNodeRel(b, "after", d)) : (log("Moving", b.id, "to possibly-new window node", a.windowId), tree.addTabToWindow(a, b)))
                    } else console.error("Page with this open tab's id does not exist in tree", a.id, a)
                }
            });
            b && b()
        })
    })
}

function fixBadNodes() {
    for (var b = tree.root.children.filter(function (a) {
            return !(a instanceof WindowNode)
        }), a = b.length - 1; 0 <= a; a--) {
        var c = b[a],
            f = c.preceding(function (a) {
                return a instanceof WindowNode && "popup" != a.type
            });
        f || (f = c.following(function (a) {
            return a instanceof WindowNode && "popup" != a.type
        }));
        f || (log("No window to put bad node into! Creating one...", c.id, c), f = new WindowNode({
            id: c.windowId,
            incognito: c.incognito,
            type: "normal"
        }), tree.addNode(f));
        log("Fixing bad page node", c.id, c, "appending as child to",
            f.id);
        tree.moveNodeRel(c, "append", f, !0)
    }
    b = tree.filter(function (a) {
        return a instanceof WindowNode && a.parent && !a.parent.isRoot
    });
    c = !1;
    for (a = b.length - 1; 0 <= a; a--) c = b[a], log("Fixing bad window node", c.id, c, "appending to root"), tree.moveNodeRel(c, "append", tree.root, !0), c = !0;
    c && movePageNodesToCorrectWindows()
}

function removeZeroChildWindowNodes() {
    for (var b = tree.filter(function (a) {
            return a instanceof WindowNode && 0 == a.children.length
        }), a = !1, c = b.length - 1; 0 <= c; c--) a = b[c], log("Removing zero-child bad window node", a.id, a), tree.removeNode(a), a = !0;
    if (a && sidebarHandler.sidebarExists()) {
        b = b.map(function (a) {
            return a.id
        });
        b.sort();
        a = b[0];
        for (c = 1; c < b.length; c++) {
            if (b[c] == a) {
                try {
                    setTimeout(function () {
                        sidebarHandler.sidebarPanes.pages.location.reload()
                    }, 500)
                } catch (f) {}
                break
            }
            a = b[c]
        }
    }
}

function removeOldWindows() {
    var b = settings.get("rememberOpenPagesBetweenSessions"),
        a = tree.root.children.filter(function (a) {
            return a instanceof WindowNode && a.hibernated && a.restorable && !a.old
        });
    tree.root.children.filter(function (a) {
        return a instanceof WindowNode && a.old
    }).forEach(function (c) {
        c.hibernated && (!b || 0 < a.length) ? tree.removeNode(c, !0) : tree.updateNode(c, {
            old: !1
        })
    })
}

function mergeWindowsPreservingTabIndexes(b, a) {
    for (var c = tree.filter(function () {
            return !0
        }, b.children), f = tree.filter(function () {
            return !0
        }, a.children), d, g = c.length - 1; 0 <= g; g--) {
        var e = c[g];
        if (e.isTab())
            if (0 == e.index) d ? tree.moveNodeRel(e, "after", d) : tree.moveNodeRel(e, "prepend", a), d = e;
            else {
                var j = firstElem(f, function (a) {
                    return a.isTab() && a.index == e.index + 1
                });
                j ? (tree.moveNodeRel(e, "before", j), d = e) : (j = firstElem(f, function (a) {
                    return a.isTab() && a.index == e.index - 1
                })) ? 0 < j.children.length ? tree.moveNodeRel(e, "prepend",
                    j) : (tree.moveNodeRel(e, "after", j), d = e) : (console.warn("Did not find preceding node by index during win merging"), tree.moveNodeRel(e, "append", a))
            }
        else d ? tree.moveNodeRel(e, "after", d) : tree.moveNodeRel(e, "prepend", a), d = e
    }
};
