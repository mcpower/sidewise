/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

(function () {
    function t(a, b) {
        return "!" !== a[0][0] ? '<a href="' + g(b.href) + '"' + (b.title ? ' title="' + g(b.title) + '"' : "") + ">" + c.lexer(a[1]) + "</a>" : '<img src="' + g(b.href) + '" alt="' + g(a[1]) + '"' + (b.title ? ' title="' + g(b.title) + '"' : "") + ">"
    }

    function l() {
        return f = m.pop()
    }

    function o() {
        switch (f.type) {
            case "space":
                return "";
            case "hr":
                return "<hr>\n";
            case "heading":
                return "<h" + f.depth + ">" + c.lexer(f.text) + "</h" + f.depth + ">\n";
            case "code":
                return k.highlight && (f.code = k.highlight(f.text, f.lang), null != f.code && f.code !== f.text &&
                    (f.escaped = !0, f.text = f.code)), f.escaped || (f.text = g(f.text, !0)), "<pre><code" + (f.lang ? ' class="lang-' + f.lang + '"' : "") + ">" + f.text + "</code></pre>\n";
            case "blockquote_start":
                for (var a = "";
                    "blockquote_end" !== l().type;) a += o();
                return "<blockquote>\n" + a + "</blockquote>\n";
            case "list_start":
                for (var b = f.ordered ? "ol" : "ul", a = "";
                    "list_end" !== l().type;) a += o();
                return "<" + b + ">\n" + a + "</" + b + ">\n";
            case "list_item_start":
                for (a = "";
                    "list_item_end" !== l().type;) a += "text" === f.type ? u() : o();
                return "<li>" + a + "</li>\n";
            case "loose_item_start":
                for (a =
                    "";
                    "list_item_end" !== l().type;) a += o();
                return "<li>" + a + "</li>\n";
            case "html":
                return k.sanitize ? c.lexer(f.text) : !f.pre && !k.pedantic ? c.lexer(f.text) : f.text;
            case "paragraph":
                return "<p>" + c.lexer(f.text) + "</p>\n";
            case "text":
                return "<p>" + u() + "</p>\n"
        }
    }

    function u() {
        for (var a = f.text, b;
            (b = m[m.length - 1]) && "text" === b.type;) a += "\n" + l().text;
        return c.lexer(a)
    }

    function v(a) {
        m = a.reverse();
        for (a = ""; l();) a += o();
        f = m = null;
        return a
    }

    function g(a, b) {
        return a.replace(!b ? /&(?!#?\w+;)/g : /&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g,
            "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
    }

    function s(a) {
        for (var b = "", z = a.length, c = 0, f; c < z; c++) f = a.charCodeAt(c), 0.5 < Math.random() && (f = "x" + f.toString(16)), b += "&#" + f + ";";
        return b
    }

    function w() {
        return "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+"
    }

    function n(a, b) {
        a = a.source;
        b = b || "";
        return function A(c, d) {
            if (!c) return RegExp(a, b);
            a = a.replace(c, d.source || d);
            return A
        }
    }

    function p() {}

    function i(c, b) {
        q(b);
        return v(a.lexer(c))
    }

    function q(f) {
        f || (f = x);
        k !== f && ((k = f, k.gfm ? (a.fences = a.gfm.fences, a.paragraph = a.gfm.paragraph, c.text = c.gfm.text, c.url = c.gfm.url) : (a.fences = a.normal.fences, a.paragraph = a.normal.paragraph, c.text = c.normal.text, c.url = c.normal.url), k.pedantic) ? (c.em = c.pedantic.em, c.strong = c.pedantic.strong) : (c.em = c.normal.em, c.strong = c.normal.strong))
    }
    var a = {
        newline: /^\n+/,
        code: /^( {4}[^\n]+\n*)+/,
        fences: p,
        hr: /^( *[-*_]){3,} *(?:\n+|$)/,
        heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
        lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
        blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
        list: /^( *)(bull) [^\0]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
        html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
        def: /^ *\[([^\]]+)\]: *([^\s]+)(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
        paragraph: /^([^\n]+\n?(?!body))+\n*/,
        text: /^[^\n]+/,
        bullet: /(?:[*+-]|\d+\.)/,
        item: /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/
    };
    a.item = n(a.item, "gm")(/bull/g, a.bullet)();
    a.list = n(a.list)(/bull/g, a.bullet)("hr", /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)();
    a.html = n(a.html)("comment",
        /<\!--[^\0]*?--\>/)("closed", /<(tag)[^\0]+?<\/\1>/)("closing", /<tag(?!:\/|@)\b(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g, w())();
    var B = a,
        r;
    r = a.paragraph.source;
    var y = [];
    (function b(c) {
        c = a[c] ? a[c].source : c;
        y.push(c.replace(/(^|[^\[])\^/g, "$1"));
        return b
    })("hr")("heading")("lheading")("blockquote")("<" + w())("def");
    r = RegExp(r.replace("body", y.join("|")));
    B.paragraph = r;
    a.normal = {
        fences: a.fences,
        paragraph: a.paragraph
    };
    a.gfm = {
        fences: /^ *``` *(\w+)? *\n([^\0]+?)\s*``` *(?:\n+|$)/,
        paragraph: /^/
    };
    a.gfm.paragraph =
        n(a.paragraph)("(?!", "(?!" + a.gfm.fences.source.replace(/(^|[^\[])\^/g, "$1") + "|")();
    a.lexer = function (b) {
        var c = [];
        c.links = {};
        b = b.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
        return a.token(b, c, !0)
    };
    a.token = function (b, c, f) {
        for (var b = b.replace(/^ +$/gm, ""), h, d, e, j, g, i; b;) {
            if (e = a.newline.exec(b)) b = b.substring(e[0].length), 1 < e[0].length && c.push({
                type: "space"
            });
            if (e = a.code.exec(b)) b = b.substring(e[0].length), e = e[0].replace(/^ {4}/gm, ""), c.push({
                type: "code",
                text: !k.pedantic ? e.replace(/\n+$/, "") : e
            });
            else if (e =
                a.fences.exec(b)) b = b.substring(e[0].length), c.push({
                type: "code",
                lang: e[1],
                text: e[2]
            });
            else if (e = a.heading.exec(b)) b = b.substring(e[0].length), c.push({
                type: "heading",
                depth: e[1].length,
                text: e[2]
            });
            else if (e = a.lheading.exec(b)) b = b.substring(e[0].length), c.push({
                type: "heading",
                depth: "=" === e[2] ? 1 : 2,
                text: e[1]
            });
            else if (e = a.hr.exec(b)) b = b.substring(e[0].length), c.push({
                type: "hr"
            });
            else if (e = a.blockquote.exec(b)) b = b.substring(e[0].length), c.push({
                type: "blockquote_start"
            }), e = e[0].replace(/^ *> ?/gm, ""), a.token(e,
                c, f), c.push({
                type: "blockquote_end"
            });
            else if (e = a.list.exec(b)) {
                b = b.substring(e[0].length);
                c.push({
                    type: "list_start",
                    ordered: isFinite(e[2])
                });
                e = e[0].match(a.item);
                h = !1;
                i = e.length;
                for (g = 0; g < i; g++) j = e[g], d = j.length, j = j.replace(/^ *([*+-]|\d+\.) +/, ""), ~j.indexOf("\n ") && (d -= j.length, j = !k.pedantic ? j.replace(RegExp("^ {1," + d + "}", "gm"), "") : j.replace(/^ {1,4}/gm, "")), d = h || /\n\n(?!\s*$)/.test(j), g !== i - 1 && (h = "\n" === j[j.length - 1], d || (d = h)), c.push({
                        type: d ? "loose_item_start" : "list_item_start"
                    }), a.token(j, c),
                    c.push({
                        type: "list_item_end"
                    });
                c.push({
                    type: "list_end"
                })
            } else if (e = a.html.exec(b)) b = b.substring(e[0].length), c.push({
                type: "html",
                pre: "pre" === e[1],
                text: e[0]
            });
            else if (f && (e = a.def.exec(b))) b = b.substring(e[0].length), c.links[e[1].toLowerCase()] = {
                href: e[2],
                title: e[3]
            };
            else if (f && (e = a.paragraph.exec(b))) b = b.substring(e[0].length), c.push({
                type: "paragraph",
                text: e[0]
            });
            else if (e = a.text.exec(b)) b = b.substring(e[0].length), c.push({
                type: "text",
                text: e[0]
            })
        }
        return c
    };
    var c = {
        escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
        autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
        url: p,
        tag: /^<\!--[^\0]*?--\>|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
        link: /^!?\[(inside)\]\(href\)/,
        reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
        nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
        strong: /^__([^\0]+?)__(?!_)|^\*\*([^\0]+?)\*\*(?!\*)/,
        em: /^\b_((?:__|[^\0])+?)_\b|^\*((?:\*\*|[^\0])+?)\*(?!\*)/,
        code: /^(`+)([^\0]*?[^`])\1(?!`)/,
        br: /^ {2,}\n(?!\s*$)/,
        text: /^[^\0]+?(?=[\\<!\[_*`]| {2,}\n|$)/,
        _linkInside: /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/,
        _linkHref: /\s*<?([^\s]*?)>?(?:\s+['"]([^\0]*?)['"])?\s*/
    };
    c.link = n(c.link)("inside", c._linkInside)("href", c._linkHref)();
    c.reflink = n(c.reflink)("inside", c._linkInside)();
    c.normal = {
        url: c.url,
        strong: c.strong,
        em: c.em,
        text: c.text
    };
    c.pedantic = {
        strong: /^__(?=\S)([^\0]*?\S)__(?!_)|^\*\*(?=\S)([^\0]*?\S)\*\*(?!\*)/,
        em: /^_(?=\S)([^\0]*?\S)_(?!_)|^\*(?=\S)([^\0]*?\S)\*(?!\*)/
    };
    c.gfm = {
        url: /^(https?:\/\/[^\s]+[^.,:;"')\]\s])/,
        text: /^[^\0]+?(?=[\\<!\[_*`]|https?:\/\/| {2,}\n|$)/
    };
    c.lexer = function (b) {
        for (var a = "", f = m.links, h, d; b;)
            if (d = c.escape.exec(b)) b = b.substring(d[0].length),
                a += d[1];
            else if (d = c.autolink.exec(b)) b = b.substring(d[0].length), "@" === d[2] ? (h = ":" === d[1][6] ? s(d[1].substring(7)) : s(d[1]), d = s("mailto:") + h) : d = h = g(d[1]), a += '<a href="' + d + '">' + h + "</a>";
        else if (d = c.url.exec(b)) b = b.substring(d[0].length), d = h = g(d[1]), a += '<a href="' + d + '">' + h + "</a>";
        else if (d = c.tag.exec(b)) b = b.substring(d[0].length), a += k.sanitize ? g(d[0]) : d[0];
        else if (d = c.link.exec(b)) b = b.substring(d[0].length), a += t(d, {
            href: d[2],
            title: d[3]
        });
        else if ((d = c.reflink.exec(b)) || (d = c.nolink.exec(b))) b = b.substring(d[0].length),
            h = (d[2] || d[1]).replace(/\s+/g, " "), h = f[h.toLowerCase()], !h || !h.href ? (a += d[0][0], b = d[0].substring(1) + b) : a += t(d, h);
        else if (d = c.strong.exec(b)) b = b.substring(d[0].length), a += "<strong>" + c.lexer(d[2] || d[1]) + "</strong>";
        else if (d = c.em.exec(b)) b = b.substring(d[0].length), a += "<em>" + c.lexer(d[2] || d[1]) + "</em>";
        else if (d = c.code.exec(b)) b = b.substring(d[0].length), a += "<code>" + g(d[2], !0) + "</code>";
        else if (d = c.br.exec(b)) b = b.substring(d[0].length), a += "<br>";
        else if (d = c.text.exec(b)) b = b.substring(d[0].length), a +=
            g(d[0]);
        return a
    };
    var m, f;
    p.exec = p;
    var k, x;
    i.options = i.setOptions = function (b) {
        x = b;
        q(b);
        return i
    };
    i.setOptions({
        gfm: !0,
        pedantic: !1,
        sanitize: !1,
        highlight: null
    });
    i.parser = function (b, a) {
        q(a);
        return v(b)
    };
    i.lexer = function (b, c) {
        q(c);
        return a.lexer(b)
    };
    i.parse = i;
    "undefined" !== typeof module ? module.exports = i : this.marked = i
}).call(function () {
    return this || ("undefined" !== typeof window ? window : global)
}());
