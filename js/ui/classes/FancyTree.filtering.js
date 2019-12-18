/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

FancyTree.prototype.onFilterStatusClick = function (a) {
    a = a.data.treeObj;
    a.filterElem.children(".ftFilterInput").val("").trigger("keyup");
    return a.filtering = !1
};
FancyTree.prototype.onFilterBoxModified = function (a) {
    27 == a.keyCode && (a.target.value = "");
    var e = a.target.value || "",
        d = a.data.treeObj;
    d.handleHideTooltipEvent(a);
    clearTimeout(d.applyFilterTimer);
    d.applyFilterTimer = setTimeout(function () {
        d.applyFilter.call(a.data.treeObj, e)
    }, 100)
};
FancyTree.prototype.applyFilter = function (a) {
    this.root.find(".ftFilteredIn > .ftItemRow > .ftItemRowContent > .ftInnerRow > .ftItemText").children().each(function (a, c) {
        var b = $(c);
        b.text(b.text())
    });
    this.root.find(".ftFilteredIn").removeClass("ftFilteredIn");
    if (0 == a.length) this.filtering = !1, this.root.removeClass("ftFiltering"), this.filterStatusElem.hide();
    else {
        this.filtering = !0;
        var e = this.useAdvancedFiltering,
            d = a.replace('"', '\\"');
        if (e) var a = a.replace(/ /g, ""),
            i = a.split("").join(".*").replace('"',
                '\\"');
        else var g = a.split(" "),
            i = g.join(".*").replace('"', '\\"');
        var i = '.ftItemText:regexicontains("' + i + '")',
            f = this.root.find(i).closest(".ftRowNode");
        this.highlightMatches.call(this, f, a, g, e);
        for (var c in this.rowTypes)
            if ((a = this.rowTypes[c].filterByExtraParams) && 0 < a.length)
                for (var b in a) i = ".ftRowNode[" + a[b] + '*="' + d + '"]', f = f.add(this.root.find(i));
        f.each(function (a, b) {
            $(b).addClass("ftFilteredIn")
        });
        this.root.addClass("ftFiltering");
        this.filterStatusElem.show()
    }
};
FancyTree.prototype.highlightMatches = function (a, e, d, i) {
    var g = this;
    a.each(function (a, c) {
        var b = $(c).find(".ftItemRow > .ftItemRowContent > .ftInnerRow > .ftItemText");
        i ? g.highlightMatchChars.call(this, b, e) : g.highlightMatchWords.call(this, b, d)
    })
};
FancyTree.prototype.highlightMatchChars = function (a, e) {
    var d = 0;
    a.children().each(function (a, g) {
        var f = $(g),
            c = f.text(),
            b = "";
        if (d == e.length) b = c;
        else
            for (var h in c)
                if (e[d].toLowerCase() == c[h].toLowerCase() ? (b += '<span class="ftHighlightChar">' + c[h] + "</span>", d++) : b += c[h], d == e.length) {
                    b += c.slice(parseInt(h) + 1);
                    break
                } f.html(b)
    })
};
FancyTree.prototype.highlightMatchWords = function (a, e) {
    var d = 0;
    a.children().each(function (a, g) {
        for (var f = $(g), c = f.text(), b = "", h = d; h < e.length; h++) {
            var k = e[h],
                j = c.toLowerCase().indexOf(k);
            if (-1 < j) b += c.slice(0, j) + '<span class="ftHighlightChar">' + c.slice(j, j + k.length) + "</span>", c = c.slice(j + k.length), d++;
            else break
        }
        f.html(b + c)
    })
};
