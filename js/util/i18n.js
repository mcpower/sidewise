/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

function setI18NText(){$("[i18n]").each(function(a,c){c.innerHTML=getMessage(c.attributes.i18n.value)})}function getMessage(a,c){var b=(chrome.i18n||window.parent.chrome.i18n).getMessage(a,c);return a.match(/^prompt_/)?transformPromptMessage(b):b.match(/^#/)?transformMessage(b.slice(1)):b.match(/^!#/)?"!"+transformMessage(b.slice(2)):b}
function transformMessage(a){a=a.replace(/:\/\//g,"URL_PROTOCOL_SEPARATOR");a=a.replace(/\s*\/\/\s*/g,"\n");a=a.replace(/URL_PROTOCOL_SEPARATOR/g,"://");return marked(a)}function transformPromptMessage(a){return a.replace(/\s*\/\/\s*/g,"\n\n")};
