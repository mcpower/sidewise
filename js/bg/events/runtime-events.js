/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

function registerRuntimeEvents(){chrome.runtime.onSuspend.addListener(onRuntimeSuspend);chrome.runtime.onSuspendCanceled.addListener(onRuntimeSuspendCanceled)}function onRuntimeSuspend(){shutdownSidewise()}function onRuntimeSuspendCanceled(){restartSidewise()};
