/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

function registerBrowserActionEvents(){chrome.browserAction.onClicked.addListener(onBrowserActionClicked)}
function onBrowserActionClicked(){var a=settings.get("browserActionButtonBehavior");log("browser action button clicked","configured action:",a);!sidebarHandler.creatingSidebar&&!sidebarHandler.removeInProgress&&(sidebarHandler.sidebarExists()?"toggle"==a?sidebarHandler.remove():"undocked"==sidebarHandler.dockState?chrome.windows.update(sidebarHandler.windowId,{focused:!0}):sidebarHandler.dockWindowId!=focusTracker.getFocused()?sidebarHandler.redock(focusTracker.getFocused()):chrome.windows.update(sidebarHandler.windowId,
{focused:!0}):sidebarHandler.createWithDockState(settings.get("dockState")))};
