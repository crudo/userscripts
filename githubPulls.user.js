// ==UserScript==
// @name           Pull requests beautifier
// @description    A brief description of your script
// @author         crudo
// @include        https://github.com/gooddata/*/pulls
// @version        1.7
// ==/UserScript==

var issue_links = document.getElementsByClassName("js-navigation-open");
var issues_uris = [], issues_parents = [];
var href;
for (var i=0; i < issue_links.length; i++) {
href = issue_links[i].getAttribute('href');
    if (href.match(/pull\//)){
        issues_uris.push(window.location.origin + href);
        issues_parents.push(issue_links[i].parentElement);
   }
};

GM_addStyle(
    ".info-base { padding: 0px 5px; color: white; margin-right: 7px; border-radius: 3px; } "+
    ".info-status-success { color: #090; font-size: 15px; }"+
    ".info-status-error { background: #a10; }"+
    ".info-status-unknow { background: #fc3; color: black; }"+
    ".info-branch { color: #333; }"+
    ".info-pullId { color: #333; background: #ddd; }"+
    ".info-unassigned { color: #000; text-transform: uppercase; font-weight: bold; }"+
    ".info-assignee { color: #000; }");

var s = '<li class="info-base ';

var statusOK     = s + 'info-status-success mini-icon mini-icon-confirm"></li>';
var statusFAIL   = s + 'info-status-error">FAIL</li>';
var statusTEST   = s + 'info-status-unknow">???</li>';
var branch_start = s + 'info-branch">';
var pull_id      = s + 'info-pullId">';
var assignee     = s + 'info-assignee mini-icon mini-icon-octocat">';
var unassigned   = s + 'info-unassigned">';

for (var i=0; i < issues_uris.length; i++) {
    var uri = issues_uris[i];
    var parentNode = issues_parents[i];
    (function(urn, node) {
        GM_xmlhttpRequest({
            method: "GET",
            url: urn,
            onload: function(response) {

                var html = response.responseText;
                var buffer = "";

                var doc = document.implementation.createHTMLDocument("");
                doc.body.innerHTML = html;
                var assigneeNode = doc.getElementsByClassName("js-assignee-infobar-item-wrapper")[0];
                var assigneeAnchs = assigneeNode.getElementsByTagName("a");
                var assigneeName = assigneeAnchs && assigneeAnchs[0] && assigneeAnchs[0].innerHTML;

                var userAnchs = doc.getElementById("user-links").getElementsByTagName("a");
                var userName = userAnchs && userAnchs[0] && userAnchs[0].href.match(/\.com\/(.+)/)[1];
                var pullItemNode = node.parentElement;

                var isClosed  = html.match('state-indicator closed');
                var isSuccess = html.match('status-success');
                var isFailure = html.match('status-failure');
                var isTesting = html.match('Determining merge status');

                // can not determine status on closed issues
                if (isClosed) return;

                var targetMaster = html.match(/git checkout (master)/);
                var targetStable = html.match(/git checkout (stable-\d+)/);

                if (targetMaster !== null) buffer += branch_start + 'master</li>';
                if (targetStable !== null) buffer += branch_start + targetStable[1] + '</li>';

                if (!assigneeName) buffer += unassigned + 'unassigned</li>';
                if (assigneeName == userName) buffer += assignee + '</li>';

                buffer += pull_id + urn.match(/\/(\d+)/)[1] + '</li>';

                var metaNode = pullItemNode.getElementsByClassName("list-group-item-meta")[0];
                var li = metaNode.insertBefore(document.createElement('li'), metaNode.firstElementChild);

                if (isTesting) {
                    li.outerHTML = statusTEST;
                    return;
                }

                li.outerHTML = (isFailure !== null ? statusFAIL : statusOK) + buffer;
          }
        });
    }(uri, parentNode));
};