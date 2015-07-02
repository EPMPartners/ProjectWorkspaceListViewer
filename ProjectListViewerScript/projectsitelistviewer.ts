//IE 8 doesn't recognize Date.now
Date.now = Date.now || function () { return +new Date; }; 

declare var L_Menu_BaseUrl: string;
module epm {
    'use strict'
    export interface IProjectSiteListViewer {
        get_TargetList(listName: string, viewPath: string);
    }

    export class ProjectSiteListViewer {
        static workspace = 'PROJECT_WORKSPACE_URL';
        static issues = 'PROJECT_ISSUES_URL';
        static risks = 'PROJECT_RISKS_URL';
        static documents = 'PROJECT_DOCUMENTS_URL';
        static deliverables = 'PROJECT_COMMITMENTS_URL';
        static defaultListView = 'AllItems.aspx';
        static dialogIndicator = '?IsDlg=1';
        public useStandardList: boolean = true;
        public targetListName: string;
        public targetViewName: string;
        private iFrameName: string;
        private spinnerElement: HTMLImageElement;
        private spinnerCreated = false;
        private isLibrary = false;
        public projectId: string;
        constructor(private parentElementId: string, private waitingImagePath?: string) {
            var part = parentElementId.substring(0, 1)
            if (part != '#') {
                this.iFrameName = parentElementId + 'iFrame';
                this.parentElementId = '#' + parentElementId;
            }
            else {

                this.iFrameName = parentElementId.substr(1) + 'iframe';
            }

        }

        private SaveToStorage(projectId: string, listname: string, viewname:string, originalIFrameUrl: string, expires?: number): void {
            //alwa 
     
            if (window.localStorage) {
                if (expires === undefined || expires === null) {
                    expires = (1000 * 120 * 60 * 60);  // default: 5 days
                } else {
                    expires = Math.abs(expires); //make sure it's positive
                }
                var now = Date.now();  //epoch time, lets deal only with integer
                var schedule = now + expires;
                var key = this.getKeyFromListNameAndView(projectId, listname, viewname);
                var expireKey = key + '_expiresIn';
                window.localStorage.setItem(key, originalIFrameUrl);
                window.localStorage.setItem(expireKey, schedule.toString());
            }
        }
        private getKeyFromListNameAndView(projectId: string, listName: string, ViewName: string) {
            return projectId + "|" + listName.replace(" ", "") + ViewName.replace(" ", "");
        }
        private ClearLocalStorage(projectId: string, listName: string, viewName: string) {
            var key = this.getKeyFromListNameAndView(projectId, listName, viewName);
            var expireKey = key + '_expiresIn';
            window.localStorage.removeItem(expireKey);
            window.localStorage.removeItem(key);

        }
        private TryGetFromStorage(projectId: string, listname: string, viewname:string): string {
            var rvalue = "";
            if (window.localStorage) {
                var now = Date.now();  //epoch time, lets deal only with integer
                var key = this.getKeyFromListNameAndView(projectId, listname, viewname);
                var expireKey = key + '_expiresIn';
                var expiresIn = <number>localStorage.getItem(expireKey);
                if (expiresIn === undefined || expiresIn === null) { expiresIn = 0; }
                try {
                    if (expiresIn < now) {// Expired
                        window.localStorage.removeItem(expireKey);
                        window.localStorage.removeItem(key);
                    }
                    else {
                        rvalue = <string>window.localStorage.getItem(key);
                    }
                }
                catch (e) {
                    console.log('getStorage: Error reading key [' + key + '] from localStorage: ' + JSON.stringify(e));
                }
            }
            return rvalue;
        }
        private showImageIfavailable = () => {
            this.spinnerElement = <HTMLImageElement>document.getElementById(this.iFrameName + 'wait');
            if (this.spinnerElement) {
                this.spinnerElement.style.display = "block";
            }
            else {
                if (this.waitingImagePath && this.waitingImagePath.length > 0) {
                    this.spinnerElement = <HTMLImageElement>document.createElement('img');
                    this.spinnerElement.id = this.iFrameName + 'wait';
                    this.spinnerElement.alt = "Loading";
                    this.spinnerElement.style.display = "block";
                    this.spinnerElement.src = this.waitingImagePath;
                    jQuery(this.parentElementId).append(this.spinnerElement);
                }
            }
        }
        private hideImageIfavailable = () => {
            if (this.spinnerElement) {
                this.spinnerElement.style.display = 'none';
            }
        }
        private get_WebServicePath = () => {
            var projectPath = '/_vti_bin/psi/wssinterop.asmx';
            var url = location.protocol + "//" + location.host + L_Menu_BaseUrl;
            return url + projectPath;
        }
        private get_ProjectIdFromQueryString() {
            JSRequest.EnsureSetup();
            var projuid = JSRequest.QueryString["ProjUid"];
            if (projuid == undefined) {
                projuid = JSRequest.QueryString["projuid"];
            }
            return projuid;
        }
        private get_ProjectSoapMarkup(projectId) {
            var envelop = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><ReadWssData xmlns="http://schemas.microsoft.com/office/project/server/webservices/WssInterop/"><projectUID>' +
                projectId + '</projectUID></ReadWssData></soap:Body></soap:Envelope>';
            return envelop;
        }
        private determineifStandardList = (listName: string): void => {
            var rvalue = listName;
            if (rvalue.length > 7) {
                var part = listName.substring(0, 8);
                if (part != 'PROJECT_') {
                    this.useStandardList = false;
                }
                else {
                    this.useStandardList = true;
                }
            }
            else {
                this.useStandardList = false;
            }
        }
        get_TargetList = (listName: string, isLibrary: boolean, viewPath?: string) => {
            this.isLibrary = isLibrary;
            if (viewPath) {
                this.targetViewName = viewPath;
            }
            else {
                this.targetViewName = epm.ProjectSiteListViewer.defaultListView;
            }
            if (this.targetViewName.indexOf(".aspx") < 1) {
                this.targetViewName = this.targetViewName = ".aspx";
            }
            var viewPart = this.targetViewName.substring(0, 1);
            if (viewPart == '/') {
                this.targetListName = this.targetListName.substr(1);
            }
            this.targetListName = listName;
            this.determineifStandardList(listName);
            this.projectId = this.get_ProjectIdFromQueryString();
            if (this.projectId) {
                //
                this.showImageIfavailable();
                var storedValue = this.TryGetFromStorage(this.projectId, listName, this.targetViewName);
                if (storedValue && storedValue.length > 6) {
                    this.createIFrame(storedValue);
                }
                else {

                    var path = this.get_WebServicePath();
                    var soapRequest = this.get_ProjectSoapMarkup(this.projectId);
                    $.ajax({
                        type: "POST",
                        url: path,
                        contentType: "text/xml;",
                        dataType: "xml",
                        data: soapRequest,
                        headers: { 'SOAPAction': 'http://schemas.microsoft.com/office/project/server/webservices/WssInterop/ReadWssData' },
                        success: this.projectDataRetreived,
                        error: this.retreivalError
                    });
                }
            }
        }
        private hideChildRibbon = (childLocation: string): boolean => {
            var rvalue = true;
            if (childLocation) {
                if (childLocation.indexOf('/EditForm.aspx') > 0
                    || childLocation.indexOf('/DispForm.aspx') > 0
                    || childLocation.indexOf('/User.aspx') > 0
                    || childLocation.indexOf('/NewForm.aspx') > 0
                    || childLocation.indexOf('/Workflow.aspx') > 0
                    || childLocation.indexOf('/people.aspx') > 0) {

                    rvalue = false;
                }
            }
            return rvalue;
        }
        private originalIFrameUrl: string;
        private createIFrame = (iFrameUrl: string) => {
            var newFrame = document.createElement('iframe');
            newFrame.id = this.iFrameName;
            newFrame.src = iFrameUrl;
            newFrame.width = "100%";
            newFrame.frameBorder = "0";
            newFrame.style.minHeight = "600px";
            newFrame.style.display = "none";
            //newFrame.setAttribute('onload', 'stripFrameHeader();')
            $(this.parentElementId).append(newFrame);
            //hide ribbon (@);
            var nFrame = document.getElementById(this.iFrameName);
            nFrame.onload = () => {
                this.hideImageIfavailable();
                var nFrame = <HTMLIFrameElement> document.getElementById(this.iFrameName);
                nFrame.contentWindow.onerror = () => {
                    nFrame.contentDocument.location.href = this.originalIFrameUrl;
                }
                nFrame.contentWindow.onbeforeunload = () => {
                    //prevent the flash of the ribbon
                    this.showImageIfavailable();
                    newFrame.style.display = "none";
                }
                try {
                    var currentFrameLocation = nFrame.contentDocument.location.href;
                    var hideRibbon = this.hideChildRibbon(currentFrameLocation);
                    if (hideRibbon) {
                        //var divNode = nFrame.contentDocument.createElement("div");
                        //divNode.innerHTML = "<style type='text/css' > #s4-ribbonrow {display: none!important; } </style>";
                        var style = <any>nFrame.contentDocument.createElement("style");
                        style.type = "text/css";
                        var ua = window.navigator.userAgent;
                        var msie = ua.indexOf('MSIE ');
                        if (msie > 0) {
                            style.styleSheet.cssText = "#s4-ribbonrow{display: none !important; }";
                        }
                        else {
                            style.innerText = "#s4-ribbonrow{display: none !important; }";
                        }
                        nFrame.contentDocument.body.appendChild(style); 

                    }
                }
                catch (err) {
                    this.ClearLocalStorage(this.projectId, this.targetListName, this.targetViewName);
                    console.log('error building iframe:  ' + JSON.stringify(err));
                }

                newFrame.style.display = "block";
            }

        }
        projectDataRetreived = (data, status, req) => {

            var targetListPath = '';
            var searchTerm = '';
            if (this.useStandardList) {
                searchTerm = this.targetListName;
            }
            else {
                searchTerm = epm.ProjectSiteListViewer.workspace;
            }
            try {
                targetListPath = $(req.responseXML)
                    .find(searchTerm).first().text();
                if (targetListPath) {
                    if (!this.useStandardList) {
                        if (this.isLibrary) {
                            this.originalIFrameUrl = targetListPath + '/' + this.targetListName + '/Forms/' + this.targetViewName + epm.ProjectSiteListViewer.dialogIndicator;

                        }
                        else {
                            this.originalIFrameUrl = targetListPath + '/Lists/' + this.targetListName + '/' + this.targetViewName + epm.ProjectSiteListViewer.dialogIndicator;
                        }
                    }
                    else {
                        this.originalIFrameUrl = targetListPath.replace(epm.ProjectSiteListViewer.defaultListView, this.targetViewName) + epm.ProjectSiteListViewer.dialogIndicator;;
                    }
                    this.SaveToStorage(this.projectId, this.targetListName, this.targetViewName, this.originalIFrameUrl);
                    this.createIFrame(this.originalIFrameUrl);
                }
            }
            catch (err) {
                $(this.parentElementId).html(err);
            }
        }
        retreivalError(data, status, req) {
            this.hideImageIfavailable();
            var error = req.responseText + " " + status;
            $(this.parentElementId).html(error);
        }
    }
} 
