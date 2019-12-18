/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var SidebarNavManager = function (a, b, c, d, e) {
    this.panes = [];
    this.navButtonsContainer = a;
    this.sidebarsContainer = b;
    this.parentContainer = c;
    this.scrollContainer = d;
    this.sidebarElemTag = e;
    this.currentSidebarId = void 0;
    this.scrolling = !1;
    this.enabledPaneCount = 0;
    a = $("<" + this.sidebarElemTag + ' id="sidebarPaddingContainer"/>');
    this.sidebarsContainer.append(a);
    this._setSidebarParentContainerWidth();
    a = {
        manager: this
    };
    $(document).on("mousedown", ".sidebarButton", a, this._onMouseDownSidebarButton).on("mouseup", ".sidebarButton",
        a, this._onMouseUpSidebarButton).on("mouseover", ".sidebarButton", a, this._onMouseOverSidebarButton).on("mouseout", ".sidebarButton", a, this._onMouseOutSidebarButton)
};
SidebarNavManager.prototype = {
    addSidebarPane: function (a, b, c, d, e) {
        for (var f in this.panes)
            if (this.panes[f].id == a) return;
        this.panes.push({
            id: a,
            label: b,
            icon: c,
            url: d,
            enabled: e
        });
        e && (this.enabledPaneCount++, this._createSidebarPaneElements(a))
    },
    addSidebarPanes: function (a) {
        for (var b in a) {
            var c = a[b];
            this.addSidebarPane(c.id, c.label, c.icon, c.url, c.enabled)
        }
    },
    removeSidebarPane: function (a) {
        var b = this.getPaneDetails(a);
        b.enabled && (this.enabledPaneCount--, this._destroySidebarPaneElements(a));
        b = this.panes.indexOf(b);
        this.panes.splice(b, 1);
        this.currentSidebarId == a && this.showSidebarPane(this.panes[0].id)
    },
    enableSidebarPane: function (a) {
        var b = this.getPaneDetails(a);
        if (b.enabled) throw Error("Requested pane is already enabled " + a);
        b.enabled = !0;
        this.enabledPaneCount++;
        this._createSidebarPaneElements(a)
    },
    disableSidebarPane: function (a) {
        var b = this.getPaneDetails(a);
        if (!b.enabled) throw Error("Requested pane is already disabled " + a);
        b.enabled = !1;
        this.enabledPaneCount--;
        this._destroySidebarPaneElements(a);
        this.getPaneDetails(this.currentSidebarId).enabled ?
            this.scrollToCurrentSidebarPane(!0) : (a = this.getFirstEnabledPane()) && this.showSidebarPane(a.id)
    },
    reorderSidebarPane: function (a, b) {
        var c = this.getPaneIndex(a);
        if (c != b) {
            var d = this.panes[c];
            this.panes.splice(c, 1);
            this.panes.splice(b, 0, d);
            d.enabled && (c = this._getEnabledPanesBeforeIndex(b), d = $(".sidebarButton[buttonid=" + a + "]"), d.remove(), this.navButtonsContainer.insertAt(c + 1, d), d.attr("title", d.attr("tooltip-title")), d.tooltip({
                position: "bottom right",
                predelay: 400,
                offset: [15, -24]
            }), d = $("#sidebarContainer__" +
                a), this.sidebarsContainer.insertAt(c, d), this.scrollToCurrentSidebarPane(!0))
        }
    },
    showSidebarPane: function (a) {
        $("#sidebarButtons").children().removeClass("selected");
        $('.sidebarButton[buttonid="' + a + '"]').addClass("selected");
        var b = $("#sidebarContainer__" + a);
        if (0 == b.children().length) {
            var c = this.getPaneDetails(a).url,
                c = $('<iframe src="' + c + '"></iframe>');
            b.append(c)
        }
        b.css("visibility", "visible");
        var d = this.currentSidebarId,
            e = this;
        this.currentSidebarId = a;
        this.scrollToCurrentSidebarPane(!1, function () {
            d !=
                e.currentSidebarId && $("#sidebarContainer__" + d).css("visibility", "hidden")
        });
        d != this.currentSidebarId && settings.set("lastSidebarPaneId", a)
    },
    scrollToCurrentSidebarPane: function (a, b) {
        this.scrolling = !0;
        var c = this,
            d = function () {
                b && b();
                setTimeout(function () {
                    c.scrolling = !1
                }, 0)
            };
        a ? this.scrollContainer.scrollTo("#sidebarContainer__" + this.currentSidebarId, {
            onAfter: d
        }) : this.scrollContainer.scrollTo("#sidebarContainer__" + this.currentSidebarId, 100, {
            onAfter: d
        })
    },
    getPaneDetails: function (a) {
        var b = this.panes.filter(function (b) {
            return b.id == a
        });
        if (1 != b.length) throw Error("Nonexistent or too many matching sidebars found");
        return b[0]
    },
    getPaneIndex: function (a) {
        for (var b = 0; b < this.panes.length; b++)
            if (this.panes[b].id == a) return b;
        throw Error("Could not find index of requested pane " + a);
    },
    getFirstEnabledPane: function () {
        for (var a = 0; a < this.panes.length; a++)
            if (this.panes[a].enabled) return this.panes[a]
    },
    _getEnabledPanesBeforeIndex: function (a) {
        for (var b = 0, c = 0; c < a; c++) this.panes[c].enabled &&
            b++;
        return b
    },
    _createSidebarPaneElements: function (a) {
        var b = this.getPaneIndex(a),
            a = this.panes[b],
            b = this._getEnabledPanesBeforeIndex(b);
        this._createSidebarButton(a.id, a.label, a.icon, b);
        this._createSidebarContainer(a.id, b);
        this._setSidebarParentContainerWidth()
    },
    _destroySidebarPaneElements: function (a) {
        $('.sidebarButton[buttonid="' + a + '"]').remove();
        $("#sidebarContainer__" + a).remove();
        this._setSidebarParentContainerWidth()
    },
    _createSidebarButton: function (a, b, c, d) {
        a = $("<li/>", {
            "class": "sidebarButton",
            "tooltip-title": b,
            title: b,
            buttonid: a
        }).append($("<div/>").append($("<img/>", {
            src: c,
            draggable: !1
        })));
        a.tooltip({
            position: "bottom right",
            predelay: 400,
            offset: [15, -24]
        });
        d = void 0 === d || d >= this.sidebarsContainer.children().length - 1 ? -1 : d + 1;
        this.navButtonsContainer.insertAt(d, a)
    },
    _createSidebarContainer: function (a, b) {
        var c = $("<" + this.sidebarElemTag + ' id="sidebarContainer__' + a + '"/>'),
            b = 999,
            d = this.sidebarsContainer.children().length - 1;
        if (void 0 === b || b >= d) b = d;
        this.sidebarsContainer.insertAt(b, c);
        this._setSidebarParentContainerWidth()
    },
    _setSidebarParentContainerWidth: function () {
        this.parentContainer.width(100 * (this.enabledPaneCount + 1) + "%")
    },
    _onMouseDownSidebarButton: function (a) {
        var b = $(a.target);
        b.hasClass("sidebarButton") || (b = b.closest(".sidebarButton"));
        b.addClass("mousedown");
        b.data("tooltip").hide();
        a.data.manager.showSidebarPane.call(a.data.manager, b.attr("buttonid"));
        a.stopPropagation()
    },
    _onMouseUpSidebarButton: function (a) {
        var b = $(a.target);
        b.hasClass("sidebarButton") || (b = b.closest(".sidebarButton"));
        b.removeClass("mousedown");
        b.data("tooltip").hide();
        a.data.manager.showSidebarPane.call(a.data.manager, b.attr("buttonid"));
        a.stopPropagation()
    },
    _onMouseOverSidebarButton: function (a) {
        if (1 == a.which) {
            var b = $(a.target);
            b.hasClass("sidebarButton") || (b = b.closest(".sidebarButton"));
            b.addClass("mousedown");
            a.stopPropagation()
        }
    },
    _onMouseOutSidebarButton: function (a) {
        var b = $(a.target);
        b.hasClass("sidebarButton") || (b = b.closest(".sidebarButton"));
        b.removeClass("mousedown");
        b.data("tooltip").hide();
        a.stopPropagation()
    }
};
