// ==UserScript==
// @name           Pull requests beautifier
// @description    A brief description of your script
// @author         crudo
// @include        https://github.com/gooddata/gdc-client/pulls
// @version        1.0
// ==/UserScript==

var issue_links = document.getElementsByClassName("js-navigation-open");
var issues_uris = [], issues_parents = [];
for (var i=0; i < issue_links.length; i++) {
    issues_uris.push(window.location.origin + issue_links[i].getAttribute('href'));
    issues_parents.push(issue_links[i].parentElement);
};

var styles = "font-size: 10px; padding: 1px 3px; position: relative; top: 8px; font-weight: bold; color: white; float: left; margin-right: 7px; border-radius: 3px; background: ";
var statusOK = '<span class="mini-icon mini-icon-confirm" style="'+styles+' transparent; color: #090; font-size: 15px;"></span>';
var statusFAIL = '<span style="'+styles+'#a10;">FAIL</span>';
var statusTEST = '<span style="'+styles+' #fc3; color: black;">???</span>';
var targetBase = '<span style="'+styles+' #transparent; color: #666; font-weight: normal;">';

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
        		var assigneeAnchors = assigneeNode.getElementsByTagName("a");
        		var assigneeName = assigneeAnchors && assigneeAnchors[0] && assigneeAnchors[0].innerHTML;

        		var userAnchors = doc.getElementById("user-links").getElementsByTagName("a");
        		var userName = userAnchors && userAnchors[0] && userAnchors[0].href.match(/\.com\/(.+)/)[1];
        		var pullItemNode = node.parentElement;


        		if (!assigneeName) pullItemNode.style.backgroundColor="rgba(255, 0, 0, 0.1)";
        		if (assigneeName == userName) pullItemNode.style.backgroundColor="rgba(0, 255, 0, 0.1)";

        //		console.log("assignee: ", assigneeName || '-', userName);
        //		console.log("--------------------------------------------------------------------");

                var isClosed = html.match('state-indicator closed');
                var isSuccess = html.match('status-success js-branch-status');
                var isFailure = html.match('status-failure js-branch-status');
                var isTesting = html.match('Determining merge status');

                // can not determine status on closed issues
                if(isClosed) return;

                var targetMaster = html.match(/git checkout (master)/);
                var targetStable = html.match(/git checkout (stable-\d+)/);

                if(targetMaster !== null) buffer += targetBase + 'master</span>';
                if(targetStable !== null) buffer += targetBase + targetStable[1] + '</span>';

                buffer += targetBase + urn.match(/\/(\d+)/)[1] + '</span>';

                var metaNode = node.parentElement.getElementsByClassName("meta")[0];
                var span = metaNode.parentElement.insertBefore(document.createElement('SPAN'), metaNode);

                if(isTesting) {
                    span.outerHTML = statusTEST;
                    return;
                }

                span.outerHTML = (isFailure !== null ? statusFAIL : statusOK) + buffer;
          }
        });
    }(uri, parentNode));
};