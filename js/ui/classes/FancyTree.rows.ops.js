/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

FancyTree.prototype.getRow = function (a) {
    if (a instanceof jQuery) return a;
    var b = $("#" + a);
    if (0 == b.length) throw Error("Could not find element with id " + a);
    return b
};
FancyTree.prototype.addRow = function (a, b, c) {
    c ? (b = this.getRow(c), b.before(a), b = b.parent()) : (b = b ? this.getRow(b) : this.root, b.children(".ftChildren").append(a));
    this.updateRowExpander(b);
    this.formatLineageTitles(b)
};
FancyTree.prototype.removeRow = function (a, b, c, e) {
    var a = this.getRow(a),
        f = a.parent().parent(),
        d = a.following(".ftRowNode"),
        g = a.preceding(".ftRowNode");
    this.getButtons(a).each(function (a, b) {
        var c = $(b).data("tooltip");
        if (c) c.onShow(function () {
            this.hide()
        })
    });
    if (b) {
        var i = this;
        a.find(".ftRowNode").each(function (a, b) {
            i.removeMultiSelectionSingle($(b))
        });
        a.remove()
    } else b = this.getChildrenContainer(a).children(), a.replaceWith(b), this.formatRowTitle(b);
    e || this.removeMultiSelectionSingle(a);
    this.hideTooltip();
    !0 !== c && (this.updateRowExpander(f), this.formatLineageTitles(f.add(d).add(g)))
};
FancyTree.prototype.moveRow = function (a, b, c, e, f) {
    var d = this.getRow(a),
        g = d.parent().parent(),
        i = d.parents(".ftRowNode"),
        b = b ? this.getRow(b) : this.root;
    this.removeRow(a, e, !0, !0);
    var a = this.getChildrenContainer(b),
        h;
    if (c) {
        h = this.getRow(c);
        h = a.children("#" + h.attr("id"));
        if (0 == h.length) throw Error("Could not find sibling " + c);
        h.before(d)
    } else a.append(d);
    if (!f) {
        this.setRowButtonTooltips(d);
        this.setDraggableDroppable(d);
        if (e) {
            var j = this;
            d.find(".ftRowNode").each(function (a, b) {
                j.setDraggableDroppable($(b))
            })
        }
        this.updateRowExpander(g);
        this.updateRowExpander(b);
        this.updateRowExpander(d);
        this.formatLineageTitles(g);
        this.formatLineageTitles(b)
    }
    return {
        row: d,
        parent: b,
        beforeSibling: h,
        keepChildren: e,
        oldAncestors: i
    }
};
FancyTree.prototype.moveRowRel = function (a, b, c, e, f) {
    var d = this.getRow(a);
    if (!d) throw Error("Could not find row to move with id " + JSON.stringify(a));
    a = this.getRow(c);
    if (!a) throw Error("Could find row to move to with toId " + JSON.stringify(c));
    var c = this.getParentRowNode(d.parent()),
        g = d.parents(".ftRowNode");
    this.removeRow(d, e, !0, !0);
    if ("before" == b) a.before(d);
    else if ("after" == b) a.after(d);
    else if ("prepend" == b) a.children(".ftChildren").prepend(d);
    else if ("append" == b) a.children(".ftChildren").append(d);
    else throw Error("Unrecognized relation " + b);
    var i = this.getParentRowNode(d.parent()),
        h = d.prev(),
        j = d.next();
    0 == h.length && (h = void 0);
    0 == j.length && (j = void 0);
    f || (this.setRowButtonTooltips(d), this.setDraggableDroppable(d), this.updateRowExpander(c), this.updateRowExpander(i), this.updateRowExpander(d), this.formatLineageTitles(c), this.formatLineageTitles(i));
    return {
        $row: d,
        relation: b,
        $to: a,
        $newParent: i,
        $newBeforeSibling: h,
        $newAfterSibling: j,
        $oldAncestors: g,
        keepChildren: e,
        staticMove: !1
    }
};
FancyTree.prototype.updateRow = function (a, b) {
    var c = this.getRow(a),
        e = this.getInnerRow(c);
    c.attr(b);
    b.icon && e.children(".ftRowIcon").attr("src", b.icon);
    this.getRowTypeParams(c).onFormatTitle(c)
};
FancyTree.prototype.focusRow = function (a) {
    var a = this.getRow(a),
        b = a.attr("id");
    if (this.focusedRow != a && (this.focusedRow && (this.focusedRow.removeClass("ftFocused"), this.root.find(".ftChildFocused").removeClass("ftChildFocused")), this.lastMultiSelectedFromId = this.lastMultiSelectedToId = b, this.focusedRow = a, a.addClass("ftFocused"), a.parents(".ftRowNode").addClass("ftChildFocused"), a = this.getInnerRow(a), this.scrollToRowTimeout && clearTimeout(this.scrollToRowTimeout), a = this.scrollDistanceRequired(a, this.root,
            this.scrollTargetElem))) a = (0 < a ? "+" : "-") + "=" + (Math.abs(a) + 2), this.scrollTargetElem.scrollTo(a, {
        duration: 0
    })
};
FancyTree.prototype.expandRow = function (a) {
    var b = this,
        c = this.getRow(a),
        e = !c.hasClass("ftCollapsed");
    if (e) return !1;
    var a = this.getChildrenContainer(c),
        f = this.getRowTypeParams(c),
        d = f.onExpanderClick,
        g = f.onFormatTitle;
    a.slideDown(100, function () {
        c.removeClass("ftCollapsed");
        d && d({
            data: {
                treeObj: b,
                row: c,
                expanded: !e
            }
        });
        g(c)
    });
    return !0
};
FancyTree.prototype.collapseRow = function (a) {
    var b = this,
        c = this.getRow(a),
        e = !c.hasClass("ftCollapsed");
    if (!e) return !1;
    var a = this.getChildrenContainer(c),
        f = this.getRowTypeParams(c),
        d = f.onExpanderClick,
        g = f.onFormatTitle;
    a.slideUp(100, function () {
        c.addClass("ftCollapsed");
        d && d({
            data: {
                treeObj: b,
                row: c,
                expanded: !e
            }
        });
        g(c)
    });
    return !0
};
FancyTree.prototype.toggleExpandRow = function (a) {
    var b = this,
        c = this.getRow(a),
        a = this.getChildrenContainer(c),
        e = this.getRowTypeParams(c),
        f = e.onExpanderClick,
        d = e.onFormatTitle,
        g = !c.hasClass("ftCollapsed");
    a.slideToggle(100, function () {
        g ? c.addClass("ftCollapsed") : c.removeClass("ftCollapsed");
        f && f({
            data: {
                treeObj: b,
                row: c,
                expanded: !g
            }
        });
        d(c)
    });
    return g
};
FancyTree.prototype.mergeRows = function (a, b) {
    var c = this.getRow(a),
        e = this.getRow(b);
    this.getChildrenContainer(e).append(this.getChildrenContainer(c).children());
    c.remove();
    this.updateRowExpander(e);
    this.formatLineageTitles(e)
};
FancyTree.prototype.clear = function () {
    this.getChildrenContainer(this.root).empty()
};
