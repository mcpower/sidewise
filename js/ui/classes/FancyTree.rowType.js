/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

FancyTree.prototype.getRowTypeParams = function (b) {
    return this.rowTypes[b.attr("rowtype")]
};
FancyTree.prototype.addRowType = function (b, a) {
    var d = this;
    a.name = b;
    this.rowTypes[b] = a;
    a.allowAtTopLevel = void 0 === a.allowAtTopLevel ? !0 : a.allowAtTopLevel;
    a.allowAtChildLevel = void 0 === a.allowAtChildLevel ? !0 : a.allowAtChildLevel;
    a.allowClickOnScroll && (this.allowClickOnScrollSelector = (this.allowClickOnScrollSelector ? this.allowClickOnScrollSelector + "," : "") + ".ftRowNode[rowtype=" + b + "]");
    var f = a.onFormatTitle || this.defaultFormatTitleHandler;
    a.onFormatTitle = function (a) {
        f.call(d, a, d.getInnerRow(a).children(".ftItemText"))
    };
    var c = ".ftRowNode[rowtype=" + b + "] > .ftItemRow > .ftItemRowContent";
    a.treeObj = this;
    $(document).on("mousedown", c, a, this.rowMouseDownHandler).on("mouseup", c, a, this.rowMouseUpHandler).on("dblclick", c, a, this.rowDoubleClickHandler);
    for (var e in a.buttons) {
        var c = ".ftButton__" + b + "_" + a.buttons[e].id,
            g = {
                treeObj: this,
                onClick: a.buttons[e].onClick
            };
        $(document).on("mouseup", c, g, this.rowButtonClickHandler)
    }
    a.baseElement = this.buildRowTypeElem(b);
    !1 !== a.multiselectable && this.multiSelectableRowTypes.push(b);
    a.allowedDropTargets &&
        0 != a.allowedDropTargets.length && (a.draggableParams = this.getDraggableParams(), a.droppableParams = this.getDroppableParams(a.allowedDropTargets))
};
