/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

function isScrolledIntoView(b) {
    var a = $(window),
        c = $(b),
        b = a.scrollTop(),
        a = b + a.height(),
        d = c.offset().top,
        c = d + c.height();
    return c >= b && d <= a && c <= a && d >= b
}

function copyTextToClipboard(b) {
    var a = $("<textarea/>");
    a.text(b);
    $("body").append(a);
    a.select();
    document.execCommand("copy");
    a.remove()
};
