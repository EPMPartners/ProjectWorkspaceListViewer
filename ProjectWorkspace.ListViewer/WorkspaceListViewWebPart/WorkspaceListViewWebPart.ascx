<%@ Assembly Name="$SharePoint.Project.AssemblyFullName$" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> 
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> 
<%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="asp" Namespace="System.Web.UI" Assembly="System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" %>
<%@ Import Namespace="Microsoft.SharePoint" %> 
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="WorkspaceListViewWebPart.ascx.cs" Inherits="ProjectWorkspace.ListViewer.VisualWebPart.WorkspaceListViewWebPart" %>
<asp:Literal ID="ScriptParamLiteral" runat="server">

</asp:Literal>

<script type="text/javascript">

    (function () {
        if (this.epmvar) {
            if (typeof jQuery == 'undefined') {
                var jqueryPath = getProjectSiteViewerComponent('jquery-1.10.2.min.js');
                document.write('<script type="text/javascript" src="' + jqueryPath + '"><\/script>');
            }
            if (typeof epm == 'undefined') {
                var epmPath = getProjectSiteViewerComponent('projectsitelistviewer.js');
                document.write('<script type="text/javascript" src="' + epmPath + '"><\/script>');
            }
            function getProjectSiteViewerComponent(name) {
                return location.protocol + "//" + location.host + L_Menu_BaseUrl + "/SiteAssets/projectsitelistviewer/scripts/" + name;
            }
            var lpck = 0;

            function TryGetProjectSiteResult() {
                if (typeof epm == 'undefined') {
                    setTimeout(function () {
                        if (lpck < 62) {
                            lpck++;
                            TryGetProjectSiteResult();
                        }
                    }, 150)
                }
                else {
                    GetProjectSiteResult();
                }
            }
            function ParseListName(listName) {
                var rvalue;
                if (listName) {
                    rvalue = listName;
                    var ln = listName.toLowerCase();
                    if (ln == 'issue' || ln == 'issues') {
                        rvalue = epm.ProjectSiteListViewer.issues;
                    }
                    else {
                        if (ln == 'risk' || ln == 'risks') {
                            rvalue = epm.ProjectSiteListViewer.risks;
                        }
                        else {
                            if (ln == 'documents' || ln == 'document' || ln == 'document library' || ln == 'shared%20documents' || ln == 'shared documents') {
                                rvalue = epm.ProjectSiteListViewer.documents;
                            }
                            else {
                                if (ln == 'deliverables' || ln == 'deliverable') {
                                    rvalue = epm.ProjectSiteListViewer.deliverables;
                                }
                            }
                        }
                    }

                }
                else {
                    rvalue = epm.ProjectSiteListViewer.risks;
                }
                return rvalue;
            }
            var projViewer;
            function GetProjectSiteResult() {
                var loadingImage = getProjectSiteViewerComponent('ajax-loader.gif');
                projViewer = new epm.ProjectSiteListViewer(this.epmvar.parentDiv, loadingImage);
                var listToUse = ParseListName(this.epmvar.listName);
                projViewer.get_TargetList(listToUse, this.epmvar.viewName);
            }

            ExecuteOrDelayUntilScriptLoaded(TryGetProjectSiteResult, "sp.js");
        }
    })();
</script>