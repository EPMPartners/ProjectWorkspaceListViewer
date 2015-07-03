# ProjectWorkspaceListViewer
A replacement to the Project Workspace List Viewer in Project Server 2010.

As a way to display project site information within Project Server, Project Server Pages the Project Workspace List Viewer was
a webpart part of the Project Server 2010 SDK.  This webpart is not available with Project Server 2013 and Project Online.  However, many users like the integration between Project Detail Pages (PDP)'s and project sites.   

This version is all javascript and has been tested with Project Server 2010 (to prepare for migrations), Projet Server 2013, 
and Project Online.

Two solutions exist, the ProjectListViewerScript, which is the raw script via TypeScript.  The other project is a SharePoint 2013 
sandbox solution used to deploy and provide a similar PDP designer user experience as the old 2010 Farm solution.

The technique used is to query project PSI to get the project site url.  Then display in a iframe and respond to iframe child events
to make it fit nicely.
