/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

$(document).ready(function () {
    initOptionsPage(postInit)
});

function postInit() {
    "donate" == getURLParameter("page") ? (settings.set("firstTimeInstallDonatePageShown", !0), showCard("donateCard", "Keep Sidewise Alive!")) : (showCard("optionsCard"), $("#version").text(getMessage("text_Version") + " " + getVersion()), styleOptionsNavButton(), $(document).on("click", "#installDoneButton", function () {
        settings.set("firstTimeInstallDonatePageShown", !0);
    }), setTimeout(drawInstallIndicatorArrow, 100))
}

function styleOptionsNavButton() {
    var a = $('img[src="/images/nav/settings.png"]'),
        c = $('<div class="navButton">').append(a.clone());
    a.replaceWith(c)
}

function drawInstallIndicatorArrow() {
    if ("left" == settings.get("dockState")) {
        var a = $("#optionsContainer p").first(),
            c = $("#installIndicatorArrow"),
            b = $('<div id="installIndicatorArrow"/>');
        b.append($('<div id="installIndicatorArrowContent">').html(getMessage("installIndicatorArrowText")));
        c.replaceWith(b);
        b.offset({
            top: a.offset().top,
            left: a.offset().left
        });
        setTimeout(function () {
            b.animate({
                left: -4
            }, 2E3, "easeOutBounce", function () {
                setTimeout(function () {
                    b.fadeOut(300)
                }, 7E3)
            })
        }, 1E3)
    }
};
