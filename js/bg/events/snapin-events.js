/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

function registerSnapInEvents(){chrome.extension.onRequestExternal.addListener(onRequestExternal)}function onRequestExternal(a,b){sidebarHandler.sidebarPanes.sidebarHost.manager.addSidebarPane(b.id,a.label,a.icon,a.url)};
