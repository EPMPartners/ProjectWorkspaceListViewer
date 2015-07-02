using System;
using System.ComponentModel;
using System.Text;
using System.Web.UI.WebControls.WebParts;
using Microsoft.SharePoint.WebPartPages;

namespace ProjectWorkspace.ListViewer.VisualWebPart
{
    [ToolboxItem(false)]
    public partial class WorkspaceListViewWebPart : WebPart
    {
        // Uncomment the following SecurityPermission attribute only when doing Performance Profiling on a farm solution
        // using the Instrumentation method, and then remove the SecurityPermission attribute when the code is ready
        // for production. Because the SecurityPermission attribute bypasses the security check for callers of
        // your constructor, it's not recommended for production purposes.
        // [System.Security.Permissions.SecurityPermission(System.Security.Permissions.SecurityAction.Assert, UnmanagedCode = true)]
        public WorkspaceListViewWebPart()
        {
        }
        const string defaultView = "AllItems.aspx";
        private string targetView = defaultView;
        private string listName = "Risks";
        [WebBrowsable(true),
        Category("Config"),
        Description("The page name of view."),
        FriendlyName("View Name"),
       Personalizable(PersonalizationScope.Shared)]
        public string ViewName
        {
            get
            {
                return targetView;
            }
            set
            {
                targetView = value;
            }
        }
        private string hostDiv;
        public string HostDivId
        {
            get
            {
                if (string.IsNullOrEmpty(hostDiv))
                {
                    var id = Guid.NewGuid().ToString();
                    hostDiv = id.Replace("-", "");
                    hostDiv = "f" + hostDiv;
                }
                return hostDiv;
            }
            set
            {
                hostDiv = value;
            }

        }
        [WebBrowsable(true),
        Category("Config"),
        Description("The name of the list or library in Uri."),
        FriendlyName("Library or List Name"),
        Personalizable(PersonalizationScope.Shared)]
        public string ListOrLibraryName
        {
            get
            {
                return listName;
            }
            set
            {
                listName = value;
            }
        }
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);
            InitializeControl();
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            LoadScriptVariables();
        }

        private void LoadScriptVariables()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<div id='" + this.HostDivId + "'></div>");
            sb.AppendLine("<script type='text/javascript'> ");
            sb.AppendLine("this.epmvar = this.epmvar || {};  ");
            sb.AppendLine("this.epmvar.listName = '" + this.listName + "'; ");
            sb.AppendLine("this.epmvar.viewName = '" + this.ViewName + "'; ");
            sb.AppendLine("this.epmvar.parentDiv = '" + this.HostDivId + "'; ");
            sb.AppendLine("</script>");
            this.ScriptParamLiteral.Text = sb.ToString();
        }
    }
}
