/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

initSidebarPane();
$(document).ready(onReady);

function onReady() {
    setI18NText();
    readFile("http://www.sidewise.info/changelog?embed=1", function (a) {
        $("#latestChanges").html(a)
    });
    $("#showAfterNew").attr("checked", settings.get("showWhatsNewPane", !0));
    $(document).on("click", "#closeButton", function () {
        bg.paneCatalog.removePane("whatsnew");
        bg.paneCatalog.saveState();
        bg.sidebarHandler.sidebarPanes.sidebarHost.manager.removeSidebarPane("whatsnew")
    }).on("click", "#showAfterNew", function () {
        settings.set("showWhatsNewPane", $("#showAfterNew").is(":checked"))
    })
};
