/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var bg;$(document).ready(function(){bg=chrome.extension.getBackgroundPage();bg.IconTesterDomWindow=window});function testIcon(a){a=$("<img>",{width:16,height:16,src:a});$("body").append(a)};
