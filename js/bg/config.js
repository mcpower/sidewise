/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var config = config || {};
config.AVAILABLE_PANES = [{
    enabled: !0,
    id: "pages",
    url: "panes/pages.html",
    label: getMessage("sidebarLabel_Pages"),
    icon: "images/nav/pages.png"
}, {
    enabled: !0,
    id: "closed",
    url: "panes/closed.html",
    label: "Recently closed",
    icon: "images/nav/closed.png"
}, {
    enabled: !0,
    id: "notepad",
    url: "panes/notepad.html",
    label: getMessage("sidebarLabel_Notepad"),
    icon: "images/nav/notepad.png"
}, {
    enabled: !1,
    id: "reddit",
    url: "panes/external-site.html#http://i.reddit.com",
    label: "Reddit",
    icon: "images/nav/reddit.png"
}, {
    enabled: !1,
    id: "grooveshark",
    url: "panes/external-site.html#http://html5.grooveshark.com/#!/music/stations",
    label: "Grooveshark",
    icon: "images/nav/grooveshark.ico"
}];
config.TREE_ONMODIFIED_DELAY_ON_STARTUP_MS = 2500;
config.TREE_ONMODIFIED_DELAY_AFTER_STARTUP_MS = 1E3;
config.TREE_ONMODIFIED_STARTUP_DURATION_MS = 2E4;
config.TREE_ONMODIFIED_SAVE_AFTER_TAB_CLOSE_MS = 5E3;
config.TREE_ONMODIFIED_SAVE_AFTER_WINDOW_CLOSE_MS = 1E4;
config.DENIED_SAVE_TREE_RETRY_MS = 2E3;
config.SAVE_TREE_BACKUP_EVERY_MS = 9E5;
config.MIN_NODES_TO_BACKUP_TREE = 6;
config.SAVE_TREE_INITIAL_BACKUP_AFTER_MS = 15E3;
config.PAGETREE_NODE_TYPES = {
    window: WindowNode,
    page: PageNode,
    folder: FolderNode,
    header: HeaderNode
};
config.GHOSTTREE_NODE_TYPES = {
    ghost: GhostNode
};
config.PREPEND_RECENTLY_CLOSED_GROUP_HEADER_INTERVAL_MS = 750;
config.GROUPING_ROW_COUNT_THRESHOLD = 7;
config.GROUPING_ROW_COUNT_WAIT_THRESHOLD = 8;
config.GROUPING_ROW_COUNT_WAIT_ITERATIONS = 4;
config.RECENTLY_CLOSED_ALLOW_RESTRUCTURING_MS = 10 * MINUTE_MS;
config.RECENTLY_CLOSED_GROUP_AFTER_REMOVE_IDLE_MS = 3 * HOUR_MS;
