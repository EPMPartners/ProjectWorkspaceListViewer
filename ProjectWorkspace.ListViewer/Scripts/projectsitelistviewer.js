//IE 8 doesn't recognize Date.now
Date.now = Date.now || function () {
    return +new Date;
};
var epm;
(function (epm) {
    'use strict';
    var ProjectSiteListViewer = (function () {
        function ProjectSiteListViewer(parentElementId, waitingImagePath) {
            var _this = this;
            this.parentElementId = parentElementId;
            this.waitingImagePath = waitingImagePath;
            this.useStandardList = true;
            this.spinnerCreated = false;
            this.isLibrary = false;
            this.showImageIfavailable = function () {
                _this.spinnerElement = document.getElementById(_this.iFrameName + 'wait');
                if (_this.spinnerElement) {
                    _this.spinnerElement.style.display = "block";
                }
                else {
                    if (_this.waitingImagePath && _this.waitingImagePath.length > 0) {
                        _this.spinnerElement = document.createElement('img');
                        _this.spinnerElement.id = _this.iFrameName + 'wait';
                        _this.spinnerElement.alt = "Loading";
                        _this.spinnerElement.style.display = "block";
                        _this.spinnerElement.src = _this.waitingImagePath;
                        jQuery(_this.parentElementId).append(_this.spinnerElement);
                    }
                }
            };
            this.hideImageIfavailable = function () {
                if (_this.spinnerElement) {
                    _this.spinnerElement.style.display = 'none';
                }
            };
            this.get_WebServicePath = function () {
                var projectPath = '/_vti_bin/psi/wssinterop.asmx';
                var url = location.protocol + "//" + location.host + L_Menu_BaseUrl;
                return url + projectPath;
            };
            this.determineifStandardList = function (listName) {
                var rvalue = listName;
                if (rvalue.length > 7) {
                    var part = listName.substring(0, 8);
                    if (part != 'PROJECT_') {
                        _this.useStandardList = false;
                    }
                    else {
                        _this.useStandardList = true;
                    }
                }
                else {
                    _this.useStandardList = false;
                }
            };
            this.get_TargetList = function (listName, isLibrary, viewPath) {
                _this.isLibrary = isLibrary;
                if (viewPath) {
                    _this.targetViewName = viewPath;
                }
                else {
                    _this.targetViewName = epm.ProjectSiteListViewer.defaultListView;
                }
                if (_this.targetViewName.indexOf(".aspx") < 1) {
                    _this.targetViewName = _this.targetViewName = ".aspx";
                }
                var viewPart = _this.targetViewName.substring(0, 1);
                if (viewPart == '/') {
                    _this.targetListName = _this.targetListName.substr(1);
                }
                _this.targetListName = listName;
                _this.determineifStandardList(listName);
                _this.projectId = _this.get_ProjectIdFromQueryString();
                if (_this.projectId) {
                    //
                    _this.showImageIfavailable();
                    var storedValue = _this.TryGetFromStorage(_this.projectId, listName, _this.targetViewName);
                    if (storedValue && storedValue.length > 6) {
                        _this.createIFrame(storedValue);
                    }
                    else {
                        var path = _this.get_WebServicePath();
                        var soapRequest = _this.get_ProjectSoapMarkup(_this.projectId);
                        $.ajax({
                            type: "POST",
                            url: path,
                            contentType: "text/xml;",
                            dataType: "xml",
                            data: soapRequest,
                            headers: { 'SOAPAction': 'http://schemas.microsoft.com/office/project/server/webservices/WssInterop/ReadWssData' },
                            success: _this.projectDataRetreived,
                            error: _this.retreivalError
                        });
                    }
                }
            };
            this.hideChildRibbon = function (childLocation) {
                var rvalue = true;
                if (childLocation) {
                    if (childLocation.indexOf('/EditForm.aspx') > 0 || childLocation.indexOf('/DispForm.aspx') > 0 || childLocation.indexOf('/User.aspx') > 0 || childLocation.indexOf('/NewForm.aspx') > 0 || childLocation.indexOf('/Workflow.aspx') > 0 || childLocation.indexOf('/people.aspx') > 0) {
                        rvalue = false;
                    }
                }
                return rvalue;
            };
            this.createIFrame = function (iFrameUrl) {
                var newFrame = document.createElement('iframe');
                newFrame.id = _this.iFrameName;
                newFrame.src = iFrameUrl;
                newFrame.width = "100%";
                newFrame.frameBorder = "0";
                newFrame.style.minHeight = "600px";
                newFrame.style.display = "none";
                //newFrame.setAttribute('onload', 'stripFrameHeader();')
                $(_this.parentElementId).append(newFrame);
                //hide ribbon (@);
                var nFrame = document.getElementById(_this.iFrameName);
                nFrame.onload = function () {
                    _this.hideImageIfavailable();
                    var nFrame = document.getElementById(_this.iFrameName);
                    nFrame.contentWindow.onerror = function () {
                        nFrame.contentDocument.location.href = _this.originalIFrameUrl;
                    };
                    nFrame.contentWindow.onbeforeunload = function () {
                        //prevent the flash of the ribbon
                        _this.showImageIfavailable();
                        newFrame.style.display = "none";
                    };
                    try {
                        var currentFrameLocation = nFrame.contentDocument.location.href;
                        var hideRibbon = _this.hideChildRibbon(currentFrameLocation);
                        if (hideRibbon) {
                            //var divNode = nFrame.contentDocument.createElement("div");
                            //divNode.innerHTML = "<style type='text/css' > #s4-ribbonrow {display: none!important; } </style>";
                            var style = nFrame.contentDocument.createElement("style");
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
                        _this.ClearLocalStorage(_this.projectId, _this.targetListName, _this.targetViewName);
                        console.log('error building iframe:  ' + JSON.stringify(err));
                    }
                    newFrame.style.display = "block";
                };
            };
            this.projectDataRetreived = function (data, status, req) {
                var targetListPath = '';
                var searchTerm = '';
                if (_this.useStandardList) {
                    searchTerm = _this.targetListName;
                }
                else {
                    searchTerm = epm.ProjectSiteListViewer.workspace;
                }
                try {
                    targetListPath = $(req.responseXML).find(searchTerm).first().text();
                    if (targetListPath) {
                        if (!_this.useStandardList) {
                            if (_this.isLibrary) {
                                _this.originalIFrameUrl = targetListPath + '/' + _this.targetListName + '/Forms/' + _this.targetViewName + epm.ProjectSiteListViewer.dialogIndicator;
                            }
                            else {
                                _this.originalIFrameUrl = targetListPath + '/Lists/' + _this.targetListName + '/' + _this.targetViewName + epm.ProjectSiteListViewer.dialogIndicator;
                            }
                        }
                        else {
                            _this.originalIFrameUrl = targetListPath.replace(epm.ProjectSiteListViewer.defaultListView, _this.targetViewName) + epm.ProjectSiteListViewer.dialogIndicator;
                            ;
                        }
                        _this.SaveToStorage(_this.projectId, _this.targetListName, _this.targetViewName, _this.originalIFrameUrl);
                        _this.createIFrame(_this.originalIFrameUrl);
                    }
                }
                catch (err) {
                    $(_this.parentElementId).html(err);
                }
            };
            var part = parentElementId.substring(0, 1);
            if (part != '#') {
                this.iFrameName = parentElementId + 'iFrame';
                this.parentElementId = '#' + parentElementId;
            }
            else {
                this.iFrameName = parentElementId.substr(1) + 'iframe';
            }
        }
        ProjectSiteListViewer.prototype.SaveToStorage = function (projectId, listname, viewname, originalIFrameUrl, expires) {
            //alwa 
            if (window.localStorage) {
                if (expires === undefined || expires === null) {
                    expires = (1000 * 120 * 60 * 60); // default: 5 days
                }
                else {
                    expires = Math.abs(expires); //make sure it's positive
                }
                var now = Date.now(); //epoch time, lets deal only with integer
                var schedule = now + expires;
                var key = this.getKeyFromListNameAndView(projectId, listname, viewname);
                var expireKey = key + '_expiresIn';
                window.localStorage.setItem(key, originalIFrameUrl);
                window.localStorage.setItem(expireKey, schedule.toString());
            }
        };
        ProjectSiteListViewer.prototype.getKeyFromListNameAndView = function (projectId, listName, ViewName) {
            return projectId + "|" + listName.replace(" ", "") + ViewName.replace(" ", "");
        };
        ProjectSiteListViewer.prototype.ClearLocalStorage = function (projectId, listName, viewName) {
            var key = this.getKeyFromListNameAndView(projectId, listName, viewName);
            var expireKey = key + '_expiresIn';
            window.localStorage.removeItem(expireKey);
            window.localStorage.removeItem(key);
        };
        ProjectSiteListViewer.prototype.TryGetFromStorage = function (projectId, listname, viewname) {
            var rvalue = "";
            if (window.localStorage) {
                var now = Date.now(); //epoch time, lets deal only with integer
                var key = this.getKeyFromListNameAndView(projectId, listname, viewname);
                var expireKey = key + '_expiresIn';
                var expiresIn = localStorage.getItem(expireKey);
                if (expiresIn === undefined || expiresIn === null) {
                    expiresIn = 0;
                }
                try {
                    if (expiresIn < now) {
                        window.localStorage.removeItem(expireKey);
                        window.localStorage.removeItem(key);
                    }
                    else {
                        rvalue = window.localStorage.getItem(key);
                    }
                }
                catch (e) {
                    console.log('getStorage: Error reading key [' + key + '] from localStorage: ' + JSON.stringify(e));
                }
            }
            return rvalue;
        };
        ProjectSiteListViewer.prototype.get_ProjectIdFromQueryString = function () {
            JSRequest.EnsureSetup();
            var projuid = JSRequest.QueryString["ProjUid"];
            if (projuid == undefined) {
                projuid = JSRequest.QueryString["projuid"];
            }
            return projuid;
        };
        ProjectSiteListViewer.prototype.get_ProjectSoapMarkup = function (projectId) {
            var envelop = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><ReadWssData xmlns="http://schemas.microsoft.com/office/project/server/webservices/WssInterop/"><projectUID>' + projectId + '</projectUID></ReadWssData></soap:Body></soap:Envelope>';
            return envelop;
        };
        ProjectSiteListViewer.prototype.retreivalError = function (data, status, req) {
            this.hideImageIfavailable();
            var error = req.responseText + " " + status;
            $(this.parentElementId).html(error);
        };
        ProjectSiteListViewer.workspace = 'PROJECT_WORKSPACE_URL';
        ProjectSiteListViewer.issues = 'PROJECT_ISSUES_URL';
        ProjectSiteListViewer.risks = 'PROJECT_RISKS_URL';
        ProjectSiteListViewer.documents = 'PROJECT_DOCUMENTS_URL';
        ProjectSiteListViewer.deliverables = 'PROJECT_COMMITMENTS_URL';
        ProjectSiteListViewer.defaultListView = 'AllItems.aspx';
        ProjectSiteListViewer.dialogIndicator = '?IsDlg=1';
        return ProjectSiteListViewer;
    })();
    epm.ProjectSiteListViewer = ProjectSiteListViewer;
})(epm || (epm = {}));
//# sourceMappingURL=projectsitelistviewer.js.map