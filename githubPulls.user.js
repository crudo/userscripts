// ==UserScript==
// @name           Pull requests beautifier
// @description    A brief description of your script
// @author         crudo
// @include        https://github.com/gooddata/*/pulls
// @version        1.2
// ==/UserScript==

var issue_links = document.getElementsByClassName("js-navigation-open");
var issues_uris = [], issues_parents = [];
for (var i=0; i < issue_links.length; i++) {
    issues_uris.push(window.location.origin + issue_links[i].getAttribute('href'));
    issues_parents.push(issue_links[i].parentElement);
};

GM_addStyle(
    ".info-base { font-size: 10px; padding: 1px 3px; position: relative; top: 8px; font-weight: bold; color: white; float: left; margin-right: 7px; border-radius: 3px; } "+
    ".info-status-success { color: #090; font-size: 15px; }"+
    ".info-status-error { background: #a10; }"+
    ".info-status-unknow { background: #fc3; color: black; }"+
    ".info-branch { color: #666; font-weight: normal; }"+
    ".info-pullId { color: #e5e5e5; font-weight: normal; right: 10px; font-size: 26px; position: absolute; }");

var s = '<span class="info-base ';

var statusOK     = s + 'info-status-success mini-icon mini-icon-confirm"></span>';
var statusFAIL   = s + 'info-status-error">FAIL</span>';
var statusTEST   = s + 'info-status-unknow">???</span>';
var branch_start = s + 'info-branch">';
var pull_id      = s + 'info-pullId">';

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

                if (!assigneeName) pullItemNode.style.backgroundColor="rgba(255, 0, 0, 0.05)";
                if (assigneeName == userName) pullItemNode.style.backgroundColor="rgba(0, 255, 0, 0.1)";

                var isClosed  = html.match('state-indicator closed');
                var isSuccess = html.match('status-success js-branch-status');
                var isFailure = html.match('status-failure js-branch-status');
                var isTesting = html.match('Determining merge status');

                // can not determine status on closed issues
                if (isClosed) return;

                var targetMaster = html.match(/git checkout (master)/);
                var targetStable = html.match(/git checkout (stable-\d+)/);

                if (targetMaster !== null) buffer += branch_start + 'master</span>';
                if (targetStable !== null) buffer += branch_start + targetStable[1] + '</span>';

                buffer += pull_id + urn.match(/\/(\d+)/)[1] + '</span>';

                var metaNode = pullItemNode.getElementsByClassName("meta")[0];
                var span = metaNode.parentElement.insertBefore(document.createElement('SPAN'), metaNode);

                if (isTesting) {
                    span.outerHTML = statusTEST;
                    return;
                }

                span.outerHTML = (isFailure !== null ? statusFAIL : statusOK) + buffer;
          }
        });
    }(uri, parentNode));
};