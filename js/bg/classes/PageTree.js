/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var PAGETREE_ONMODIFIED_DELAY_ON_STARTUP_MS = 1500,
    PAGETREE_ONMODIFIED_DELAY_AFTER_STARTUP_MS = 1E3,
    PAGETREE_ONMODIFIED_STARTUP_DURATION_MS = 2E4,
    CONFORM_TAB_INDEX_DELAY_MS = 5500,
    CONFORM_ALL_TAB_INDEX_DELAY_MS = 5E3,
    PageTree = function (a, c) {
        this.$base(["id", "chromeId"]);
        this.callbackProxyFn = a;
        this.lastFocusedTabId = this.focusedTabId = null;
        this.tabIndexes = {};
        this.onModified = this._onPageTreeModified;
        this.awakeningPages = [];
        this.onModifiedDelayed = c;
        this.onModifiedDelayedWaitMs = PAGETREE_ONMODIFIED_DELAY_ON_STARTUP_MS;
        var b = this;
        setTimeout(function () {
            b.onModifiedDelayedWaitMs = PAGETREE_ONMODIFIED_DELAY_AFTER_STARTUP_MS
        }, PAGETREE_ONMODIFIED_STARTUP_DURATION_MS)
    };
PageTree.prototype = {
    addNode: function (a, c, b, d) {
        if (this.getNode(a.id)) throw Error("A node with this id already exists in the tree", a.id, a);
        a instanceof WindowNode && (this.tabIndexes[a.windowId] = []);
        var e;
        c && (e = this.getNode(c));
        if (d && (!b && a.isTab()) && (c = a.index, d = this.tabIndexes[a.windowId]))(c = d[c]) && c.parent === e && (b = c);
        b = this.$super("addNode")(a, e, b);
        this.callbackProxyFn("add", {
            element: a,
            parentId: b[1] ? b[1].id : void 0,
            beforeSiblingId: b[2] ? b[2].id : void 0
        });
        this.addToTabIndex(a);
        return b
    },
    addNodeRel: function (a,
        c, b) {
        c = this.$super("addNodeRel")(a, c, b);
        this.callbackProxyFn("add", {
            element: a,
            parentId: c[1] ? c[1].id : void 0,
            beforeSiblingId: c[2] ? c[2].id : void 0
        });
        this.addToTabIndex(a);
        return c
    },
    updateNode: function (a, c, b) {
        a = this.getNode(a);
        if (!a) throw Error("Could not find node to update");
        var d = a.id;
        this.$super("updateNode")(a, c, b);
        this.callbackProxyFn("update", {
            id: d,
            element: c
        });
        return a
    },
    removeNode: function (a, c) {
        var b = this.getNode(a);
        if (!b) throw Error("Node not found to remove");
        b.removedAt = Date.now();
        b.parent instanceof
        WindowNode || (b.removedFromParentId = b.parent.id);
        var d = b.topParent();
        b.removedFromTopParentId = d ? d.id : null;
        if (d = b.beforeSibling()) d.removedAfterSiblingId = b.id;
        if (d = b.afterSibling()) d.removedBeforeSiblingId = b.id;
        this.removeFromTabIndex(b);
        if (c)
            for (var d = this.filter(function (a) {
                    return a
                }, b.children), e = d.length - 1; 0 <= e; e--) this.removeFromTabIndex(d[e]), d[e].removedAt = Date.now();
        else if (!(b instanceof WindowNode))
            for (e = 0; e < b.children.length; e++) b.children[e].removedPreviousParentId = b.id;
        b = this.$super("removeNode")(b,
            c);
        this.callbackProxyFn("remove", {
            element: b,
            removeChildren: c || !1
        });
        return b
    },
    moveNode: function (a, c, b, d, e, g) {
        var f = this.getNode(a),
            h = this.getNode(c);
        if (g && !b && f.isTab()) {
            var i = this.tabIndexes[f.windowId][f.index];
            if (i) {
                if (i === f && h === i.parent) {
                    log("moveNode would move node to same position after compensating for preferChromeTabIndex, doing nothing", a, c);
                    return
                }
                this.getNodeEx(i).parent === h && (b = i)
            }
        }
        log("moving node", "moving", f, "parent", h, "beforeSiblingMatcher", b, "keepChildren", d, "preferChromeTabIndex",
            g);
        if (d)
            for (var j = this.filter(function (a) {
                    return a instanceof PageNode
                }, f.children), a = j.length - 1; 0 <= a; a--) this.removeFromTabIndex(j[a]);
        this.removeFromTabIndex(f);
        h = this.$super("moveNode")(f, h, b, d);
        this.addToTabIndex(f);
        if (d)
            for (a = 0; a < j.length; a++) this.addToTabIndex(j[a]);
        void 0 !== h && this.callbackProxyFn("move", {
            element: h[0],
            newParentId: c ? h[1].id : void 0,
            beforeSiblingId: b ? h[2].id : void 0,
            keepChildren: d || !1,
            callbackBlocked: e
        });
        return h
    },
    moveNodeRel: function (a, c, b, d, e) {
        var g = this.getNode(a);
        if (!g) throw Error("Could not find node to move",
            a, c, b);
        var f;
        g.parent && !g.parent.isRoot && (f = g.parent);
        if (d)
            for (var h = this.filter(function (a) {
                    return a instanceof PageNode
                }, g.children), a = h.length - 1; 0 <= a; a--) this.removeFromTabIndex(h[a]);
        this.removeFromTabIndex(g);
        c = this.$super("moveNodeRel")(g, c, b, d);
        this.addToTabIndex(g);
        if (d)
            for (a = 0; a < h.length; a++) this.addToTabIndex(h[a]);
        void 0 !== c && (this.callbackProxyFn("move", {
            element: c[0],
            newParentId: c[1] ? c[1].id : void 0,
            beforeSiblingId: c[2] ? c[2].id : void 0,
            keepChildren: d || !1,
            callbackBlocked: e
        }), f && (f.collapsed &&
            0 == f.children.length) && this.updateNode(f, {
            collapsed: !1
        }));
        return c
    },
    mergeNodes: function (a, c) {
        var b = this.$super("mergeNodes")(a, c);
        void 0 !== b && this.callbackProxyFn("merge", {
            fromId: b.fromId,
            toId: b.toId
        });
        this.rebuildTabIndex();
        return b
    },
    expandNode: function (a) {
        a = this.getNode(a);
        if (!a) throw Error("Could not find node to expand");
        a.collapsed && (a.collapsed = !1, this.callbackProxyFn("expand", {
            id: a.id
        }))
    },
    collapseNode: function (a) {
        a = this.getNode(a);
        if (!a) throw Error("Could not find node to collapse");
        a.collapsed ||
            (a.collapsed = !0, this.callbackProxyFn("collapse", {
                id: a.id
            }))
    },
    focusPage: function (a) {
        log(a);
        var c = this.getNode(["chromeId", a]);
        c ? (a != this.focusedTabId && (this.lastFocusedTabId = this.focusedTabId, this.focusedTabId = a), this.callbackProxyFn("focusPage", {
            id: c.id
        }), c.unread && this.updatePage(c, {
            unread: !1
        })) : log("Page node does not exist to be focused yet", "tabId", a)
    },
    updatePage: function (a, c) {
        log(a, c);
        var b = "number" == typeof a ? this.getNode(["chromeId", a]) : this.getNode(a);
        this.updateNode(b, c);
        return b
    },
    hibernatePages: function (a,
        c) {
        log(a);
        for (var b = a.length - 1; 0 <= b; b--) this.hibernatePage(a[b], c)
    },
    hibernatePage: function (a, c) {
        function b() {
            chrome.tabs.remove(a);
            tree.removeFromTabIndex(d);
            e.updateLastModified()
        }
        var d = this.updatePage(["chromeId", a], {
                hibernated: !0,
                restorable: !1,
                chromeId: null,
                status: "complete",
                mediaState: null,
                mediaTime: null,
                audible: null,
            }),
            e = this;
        c ? b() : chrome.tabs.query({
            windowType: "normal"
        }, function (c) {
            c = c.filter(function (b) {
                return b.id != a
            });
            0 == c.length ? chrome.tabs.create({
                url: "chrome://newtab"
            }, function () {
                b();
                settings.get("shown_prompt_hibernatingLastTab") ||
                    (settings.set("shown_prompt_hibernatingLastTab", !0), alert(getMessage("prompt_hibernatingLastTab")))
            }) : b()
        })
    },
    awakenPages: function (a, c) {
        log(a);
        for (var b = {}, d = 0, e = a.length - 1; 0 <= e; e--) {
            var g = this.getNodeEx(a[e]),
                f = g.ancestors[0];
            if (!(f instanceof WindowNode)) throw Error("Tried to awakenPages() but page is not contained under a WindowNode");
            b[f.id] || (b[f.id] = {
                windowNode: f,
                pageNodes: []
            }, d++);
            b[f.id].pageNodes.push(g.node)
        }
        var e = 0,
            h;
        for (h in b) b.hasOwnProperty(h) && (this.awakenPageNodes(b[h].pageNodes, b[h].windowNode,
            0 == e ? c : !1), e++);
        this.updateLastModified()
    },
    awakenWindow: function (a, c) {
        log(a);
        var b = this.getNode(a),
            d = this.filter(function (a) {
                return !(a instanceof PageNode && a.hibernated) ? !1 : c ? c(a) : !0
            }, b.children).reverse();
        this.awakenPageNodes(d, b);
        this.updateLastModified()
    },
    hibernateWindow: function (a) {
        function c() {
            for (var a = 0; a < b.length; a++) e.hibernatePage(b[a].chromeId, !0)
        }
        log(a);
        var a = this.getNode(a),
            b = this.filter(function (a) {
                return a instanceof PageNode && !a.hibernated
            }, a.children),
            d = b.map(function (a) {
                return a.chromeId
            }),
            e = this;
        chrome.tabs.query({
            windowType: "normal"
        }, function (a) {
            a = a.filter(function (a) {
                return -1 == d.indexOf(a.id)
            });
            0 == a.length ? chrome.tabs.create({
                url: "chrome://newtab"
            }, function () {
                c();
                settings.get("shown_prompt_hibernatingLastTab") || (alert(getMessage("prompt_hibernatingLastTab")), settings.set("shown_prompt_hibernatingLastTab", !0))
            }) : c()
        });
        this.updateLastModified()
    },
    awakenPageNodes: function (a, c, b) {
        var d = this,
            e = a.map(function (a) {
                return a.url
            });
        a.forEach(function (a) {
            d.awakeningPages.push(a)
        });
        if (c.hibernated) {
            var g =
                sidebarHandler.getIdealNewWindowMetrics(),
                a = clone(g);
            a.type = "normal";
            a.url = e;
            var e = first(tree.tree, function (a) {
                    return a instanceof WindowNode && "normal" == a.type && !a.hibernated && 1 == a.children.length && 0 == a.children[0].children.length && isNewTabUrl(a.children[0].url) && !a.children[0].hibernated
                }),
                f, h;
            e && (h = e[1].chromeId, f = e[1].children[0].chromeId, a.tabId = f);
            chrome.windows.create(a, function (a) {
                f && chrome.tabs.remove(f, function () {
                    if (sidebarHandler.dockState != "undocked" && (!sidebarHandler.dockWindowId || sidebarHandler.dockWindowId ==
                            h)) sidebarHandler.dockWindowId = a.id
                });
                chrome.windows.update(a.id, g);
                var b = d.getNode(["chromeId", a.id]);
                log(b);
                b && d.mergeNodes(b, c);
                d.setWindowToAwake(c, a.id);
                d.expandNode(c);
                rectifyAssociations(1E3)
            })
        } else {
            var d = this,
                i = c.chromeId;
            a.forEach(function (a) {
                var c, e, f = a.following(function (b) {
                    return b.isTab() && b.windowId == a.windowId
                });
                if (f) log("looking up tab index for next tab", f.id), c = d.getTabIndex(f);
                else if (e = a.preceding(function (b) {
                        return b.isTab() && b.windowId == a.windowId
                    })) log("looking up tab index for preceding tab",
                    e.id), c = d.getTabIndex(e), void 0 !== c && (c += 1);
                void 0 === c && (f ? (log("fallback on next.index", f.id, f.index), c = f.index) : e && (log("fallback on prev.index", e.id, e.index), c = e.index + 1), void 0 === c && (c = 99999));
                log("awakening", a.url, "windowId", i, "index", c);
                chrome.tabs.create({
                    url: a.url,
                    windowId: i,
                    active: b || !1,
                    pinned: a.pinned,
                    index: c
                }, function () {
                    rectifyAssociations(1E3)
                })
            })
        }
    },
    setWindowToAwake: function (a, c) {
        this.updateNode(a, {
            chromeId: c,
            restored: !0,
            restorable: !1,
            hibernated: !1,
            old: !1,
            title: WINDOW_DEFAULT_TITLE
        })
    },
    addTabToWindow: function (a, c, b) {
        var c = c || new PageNode(a),
            d = this.getNode(["chromeId", a.windowId]);
        this.getNode(function (a) {
            return a === c
        }) && (log("page node is already in tree, remove it before adding it back to tree under new windowId", c.id, a.windowId), this.removeNode(c, !1));
        if (d) log("window node exists, add page to it", c.id, d.id);
        else {
            log("window node does not exist, create it then add page to it", c.id, a.windowId);
            d = new WindowNode({
                id: a.windowId,
                incognito: a.incognito,
                type: "normal"
            });
            this.addNode(d);
            var e = this;
            chrome.windows.get(a.windowId, function (a) {
                e.updateNode.call(e, d, {
                    type: a.type
                })
            })
        }
        this.addNode(c, d);
        log("window node now", this.getNode(["chromeId", a.windowId]));
        b && b(c, d)
    },
    getTabIndex: function (a) {
        var c = this.getWindowTabIndexArray(a.windowId);
        if (c) return a = c.indexOf(a), -1 == a ? void 0 : a
    },
    getTabByIndex: function (a, c) {
        var b = this.getWindowTabIndexArray(a);
        if (b) return b[c]
    },
    getWindowTabIndexArray: function (a) {
        return this.tabIndexes[a]
    },
    getWindowIndexedTabsCount: function (a) {
        if (a = this.getWindowTabIndexArray(a)) return a.length
    },
    addToTabIndex: function (a) {
        if (a.isTab()) {
            var c = a.topParent();
            if (c instanceof WindowNode) {
                this.tabIndexes[c.chromeId] || (this.tabIndexes[c.chromeId] = []);
                var b = a.index;
                b >= this.tabIndexes[c.chromeId].length ? this.tabIndexes[c.chromeId].push(a) : this.tabIndexes[c.chromeId].splice(b, 0, a)
            }
        }
    },
    removeFromTabIndex: function (a) {
        if (a instanceof PageNode) {
            var c = a.windowId;
            if (c) {
                if (this.tabIndexes[c]) {
                    a = this.tabIndexes[c].indexOf(a);
                    if (a > -1) {
                        this.tabIndexes[c].splice(a, 1);
                        if (this.tabIndexes[c].length === 0) {
                            delete this.tabIndexes[c];
                        }
                    }
                } else {
                    if (!a.hibernated && !a.url.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
                        console.warn("No tab index found for windowId " + c, "node", a.id, a, this.tabIndexes);
                    }
                }
            } else {
                console.warn("No windowId found on node", a.id, a);
            }
        }
    },
    rebuildTreeByTabIndex: function (a) {
        var c = this;
        a ? this.rebuildPageNodeWindowIds(function () {
            c.reorganizeTreeByTabIndex();
            c.rebuildTabIndex();
            c.conformAllChromeTabIndexes(!0)
        }) : TimeoutManager.reset("rebuildTreeByTabIndex", function () {
            c.rebuildTreeByTabIndex(!0)
        }, 2500)
    },
    rebuildTabIndex: function () {
        this.tabIndexes = this.groupBy(function (a) {
            if (a.isTab()) return a.windowId
        })
    },
    reorganizeTreeByTabIndex: function () {
        for (var a = this.filter(function (a) {
                return a.isTab()
            }).reverse(), c = 0; c < a.length; c++) {
            var b = a[c],
                d = this.getNode(function (a) {
                    return a.isTab() && a !== b && a.windowId == b.windowId && a.index == b.index + 1
                });
            if (d) {
                d.preceding(function (a) {
                    return a.isTab() && a.windowId == b.windowId
                }) !== b && (log("Moving misplaced page to before", b, b.id, b.index, b.windowId, "before", d, d.id, d.index, d.windowId), this.moveNodeRel(b, "before", d));
                break
            }
            if (d = this.getNode(function (a) {
                    return a.isTab() && a !== b && a.windowId ==
                        b.windowId && a.index == b.index - 1
                })) {
                d.following(function (a) {
                    return a.isTab() && a.windowId == b.windowId
                }) !== b && (log("Moving misplaced page to after", b, b.id, b.index, b.windowId, "after", d, d.id, d.index, d.windowId), this.moveNodeRel(b, "after", d));
                break
            }
        }
    },
    rebuildPageNodeWindowIds: function (a) {
        var c = this;
        chrome.tabs.query({}, function (b) {
            for (var d in b) {
                var e = b[d],
                    g = c.getNode(["chromeId", e.id]);
                g && (g.windowId = e.windowId, g.index = e.index)
            }
            a && a()
        })
    },
    validateTabIndexes: function () {
        for (var a = this.filter(function (a) {
                    return a.isTab()
                }),
                c = 0; c < a.length; c++) {
            var b = a[c];
            if (b.index != this.getTabIndex(b)) {
                a = this.getTabByIndex(b.windowId, b.index);
                console.error("Validation error for tab index", "tab", b, "tab.id", b.id, "tab.index", b.index, "getTabIndex", this.getTabIndex(b), "getTabIndex(tab.index)", a, a.id, a.index);
                console.error("tree dump", this.dump());
                console.error("index dump", this.dumpTabIndexes());
                break
            }
        }
    },
    conformChromeTabIndexForPageNode: function (a, c, b, d) {
        if (d) {
            if (a.isTab() && a.chromeId) {
                var e = a.topParent();
                e instanceof WindowNode && (g = this,
                    chrome.tabs.get(a.chromeId, function (c) {
                        b || g.rebuildTabIndex();
                        if (c) {
                            var d = g.tabIndexes[e.chromeId];
                            d ? (d = d.indexOf(a), c.index != d && (log("Conforming chrome tab index", "id", c.id, "tab.index", c.index, "target index", d), expectingTabMoves.push(c.id), chrome.tabs.move(c.id, {
                                index: d
                            }, function () {
                                setTimeout(function () {
                                    removeFromExpectingTabMoves(c.id)
                                }, 250)
                            }))) : log("Could not find index", e.id, e.chromeId, e)
                        } else log("Tab not found to conform", a.id)
                    }))
            }
            c && this.conformChromeTabIndexForNodeArray(a.children, !0, b)
        } else {
            var g =
                this;
            TimeoutManager.reset("conformChromeTabIndexForPageNode_" + generateGuid(), function () {
                g.conformChromeTabIndexForPageNode(a, c, b, !0)
            }, CONFORM_TAB_INDEX_DELAY_MS)
        }
    },
    conformChromeTabIndexForNodeArray: function (a, c, b) {
        b || this.rebuildTabIndex();
        for (b = 0; b < a.length; b++) this.conformChromeTabIndexForPageNode(a[b], c, !0, !0)
    },
    conformAllChromeTabIndexes: function (a) {
        if (a) {
            this.rebuildTabIndex();
            for (var a = this.tree.filter(function (a) {
                    return a instanceof WindowNode && !a.hibernated
                }), c = 0; c < a.length; c++) this.conformChromeTabIndexForNodeArray(a[c].children,
                !0, !0)
        } else {
            var b = this;
            TimeoutManager.reset("conformAllChromeTabIndexes", function () {
                b.conformAllChromeTabIndexes(!0)
            }, CONFORM_ALL_TAB_INDEX_DELAY_MS)
        }
    },
    updatePageIndex: function (a, c, b, d) {
        log("updating page index", a, c, b, d);
        a = this.getNode(["chromeId", a]);
        tree.updateNode(a, {
            windowId: c
        });
        d < b ? (a.index = d, b = this.tabIndexes[c][d]) : (a.index = d, b = this.tabIndexes[c][d + 1]);
        b ? (log("moving to before by index", a.id, "before", b.id), this.moveNodeRel(a, "before", b)) : (log("moving to append by index", a.id, "append to", c),
            this.moveNodeRel(a, "append", this.getNode(["chromeId", c])))
    },
    clear: function () {
        this.root = new DataTreeRootNode(this);
        this.tree = this.root.children;
        this.indexes = {
            id: {},
            chromeId: {}
        };
        this.tabIndexes = {};
        this.updateLastModified()
    },
    dump: function () {
        var a = this;
        return this.reduce(function (c, b, d) {
            var e = a.getNodeEx(b).ancestors[0];
            (e = a.tabIndexes[e.chromeId]) ? (e = e.indexOf(b), -1 == e && (e = "---")) : e = "---";
            return c + "\n" + padStringLeft(e, 3) + "/" + padStringLeft(b.index, 3) + "|" + padStringLeft(b.id, 30) + ": " + Array(-3 + 4 * (1 + d)).join(" ") +
                (b instanceof PageNode ? b.title : "window " + b.type + (b.incognito ? " incognito" : "")) + " @" + b.historylength + " R:" + b.referrer
        }, "")
    },
    dumpTabIndexes: function () {
        var a = "",
            c;
        for (c in this.tabIndexes)
            for (var a = a + (c + ":\n"), b = this.tabIndexes[c], d = 0; d < b.length; d++) var e = b[d],
                a = a + ("  " + e.id + ":" + d + "(" + e.index + ") " + e.url + "\n");
        return a
    },
    _onPageTreeModified: function () {
        if (this.onModifiedDelayed) {
            var a = this;
            TimeoutManager.reset("onModifiedPageTree_" + this.name, function () {
                    a.conformAllChromeTabIndexes();
                    a.rebuildPageNodeWindowIds(function () {
                        a.onModifiedDelayed()
                    })
                },
                this.onModifiedDelayedWaitMs)
        }
    },
    disableCallbacks: function () {
        this.callbackProxyFn = function () {};
        this.onModified = function () {};
        this.onModifiedDelayed = function () {};
        TimeoutManager.clear("onModifiedPageTree_" + this.name)
    },
    getPageIdMatcherFn: function () {
        return this.getIdMatcherFn(chromeId)
    },
    getWindowIdMatcherFn: function () {
        return this.getIdMatcherFn(chromeId)
    },
    getIdMatcherFn: function (a) {
        return this.getKeyMatcherFn("id", a)
    }
};
extendClass(PageTree, DataTree, PageTree.prototype);
