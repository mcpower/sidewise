/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var NOTEPAD_AUTOSAVE_DELAY_MS = 1E3,
    TAB_INSERT_STRING = "  ";
initSidebarPane();
$(document).ready(onReady);

function onReady() {
    setI18NText();
    $("#notepad").keyup(onNotepadKeyUp).keydown(onNotepadKeyDown).val(settings.get("notepadContent", "")).focus();
    var a = settings.get("notepadSavedAt");
    a && setLastSavedText(a)
}

function onNotepadKeyUp() {
    TimeoutManager.reset("saveNotepad", saveNotepad, NOTEPAD_AUTOSAVE_DELAY_MS)
}

function onNotepadKeyDown(a) {
    if (9 == a.keyCode) return a.stopPropagation(), $("#notepad").insertAtCaret(TAB_INSERT_STRING), !1;
    if (83 == a.keyCode && a.ctrlKey) return saveNotepad(), a.stopPropagation(), !1
}

function saveNotepad() {
    settings.set("notepadContent", $("#notepad").val());
    var a = Date.now();
    settings.set("notepadSavedAt", a);
    setLastSavedText(a)
}

function setLastSavedText(a) {
    a = (new Date(a)).toString().replace(/ GMT.+/, "");
    $("#lastSavedAt").text(a)
};
