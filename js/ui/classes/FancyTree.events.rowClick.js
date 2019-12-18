/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

FancyTree.prototype.rowMouseDownHandler = function (b) {
    b.data.treeObj.usingFastTooltip = !1;
    if (b.data.onMiddleClick && 2 == b.which) return !1
};
FancyTree.prototype.rowMouseUpHandler = function (b) {
    var a = b.data.treeObj;
    if (!a.dragging)
        if (a.ignoreNextRowMouseUpEvent) a.ignoreNextRowMouseUpEvent = !1;
        else {
            var c = $(this),
                c = a.getParentRowNode(c);
            b.data.row = c;
            a.hideTooltip();
            if (2 == b.which) b.data.onMiddleClick && (a.contextMenuShown && a.disableContextMenu.call(a), b.data.onMiddleClick(b));
            else if (1 == b.which)
                if (b.ctrlKey || b.shiftKey) a.contextMenuShown && a.disableContextMenu.call(a), a.rowMultiSelectionClickHandler(b);
                else if (a.contextMenuShown && (a.clearMultiSelection.call(a),
                    a.disableContextMenu.call(a)), a.clearMultiSelection(), !1 !== b.data.autofocusOnClick && a.focusRow(c), b.data.onClick) {
                var d = b.data;
                a.resetDragDropState(function () {
                    b.data = d;
                    b.data.onClick(b)
                })
            }
        }
};
FancyTree.prototype.rowMultiSelectionClickHandler = function (b) {
    if (!1 !== b.data.multiselectable) {
        var a = b.data.row,
            c = b.data.treeObj,
            d = c.focusedRow.attr("id"),
            e = c.lastMultiSelectedToId || d,
            a = a.attr("id"),
            g = c.getRow(e),
            f = c.getRow(a);
        if (b.ctrlKey) {
            c.lastMultiSelectedFromId = null;
            if (b.shiftKey) c.addMultiSelectionBetween(g, f);
            else {
                if (0 == c.multiSelection.length) {
                    if (d == a) return;
                    c.toggleMultiSelectionSingle(c.focusedRow)
                }
                c.toggleMultiSelectionSingle(f)
            }
            c.lastMultiSelectedToId = a
        } else b.shiftKey && e && (c.lastMultiSelectedFromId ||
            c.clearMultiSelection(), c.addMultiSelectionBetween(g, f), c.lastMultiSelectedFromId = e, c.lastMultiSelectedToId = a)
    }
};
FancyTree.prototype.rowDoubleClickHandler = function (b) {
    if (1 == b.which && !b.ctrlKey && !b.shiftKey) {
        var a = b.data.treeObj;
        if (!a.ignoreDoubleClickEvent) {
            var c = $(this),
                c = a.getParentRowNode(c);
            a.hideTooltip();
            b.data.row = c;
            b.data.onDoubleClick(b)
        }
    }
};
FancyTree.prototype.rowButtonClickHandler = function (b) {
    var a = b.data.treeObj;
    a.contextMenuShown && a.disableContextMenu.call(a);
    1 == b.which && (0 < a.multiSelection.length && a.clearMultiSelection(), $("#ftSimpleTip").hide(), b.data.row = $(this).closest(".ftRowNode"), b.data.onClick(b), a.ignoreNextRowMouseUpEvent = !0, a.resetDragDropState(), a.ignoreDoubleClickEvent = !0, a.ignoreDoubleClickEventResetTimer && clearTimeout(a.ignoreDoubleClickEventResetTimer), a.ignoreDoubleClickEventResetTimer = setTimeout(function () {
        a.ignoreDoubleClickEvent = !1
    }, 500))
};
