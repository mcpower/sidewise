/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

FancyTree.prototype.scrollDistanceRequired = function (b, d, e) {
    $(window);
    for (var a = $(b), b = 0, g = a.parents(), c, f = 0; f < g.length; f++)
        if (c = g[f], $(c).is(e)) {
            b = c.scrollTop;
            break
        } e = b + c.offsetHeight;
    c = d.offset().top + b;
    d = a.height();
    a = a.offset().top - c;
    return 0 > a ? a : a + d + b > e ? a + b - e + d : 0
};
