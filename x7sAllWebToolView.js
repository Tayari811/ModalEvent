import {LightningElement,api,wire,track} from 'lwc';
import WebTool from '@salesforce/resourceUrl/NCPWebtoollogo';
import WebToolReferenceGuide from '@salesforce/resourceUrl/WebToolReferenceGuideIcon';
import ICON_PATH from '@salesforce/resourceUrl/ncp_icons';
import getViewList from '@salesforce/apex/x7sWebToolListController.getViewList';
import {reduceErrors,registerListener,showToast,unregisterAllListeners} from "c/x7sShrUtils";
import {NavigationMixin} from 'lightning/navigation';
import updateListRecord from "@salesforce/apex/x7sWebToolListController.updateListRecord";
import getIsRecordSavedForViewRecords from '@salesforce/apex/x7sWebToolListController.getIsRecordSavedForViewRecords';
import {getObjectInfo} from 'lightning/uiObjectInfoApi';
import {getPicklistValues} from 'lightning/uiObjectInfoApi';
import WEB_TOOL_OBJECT from '@salesforce/schema/Web_Tool__c';
import SHIPMENT_CYCLE_FIELD from '@salesforce/schema/Web_Tool__c.Shipment_Cycle__c';
import SEGMENT_FIELD from '@salesforce/schema/Web_Tool__c.Segment__c';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import NCPSegmentModal from 'c/nCPSegmentModal';
import USER_ACCOUNT_NAME from '@salesforce/schema/User.User_Account_name__c';
import uId from '@salesforce/user/Id';
import CONTACT_ID from '@salesforce/schema/User.Contact.Id';
import EMPLOYEEPORTAL_URL from '@salesforce/label/c.EmployeeWebToolRequest';
//changes added by santosh start

import USER_PROFILE from '@salesforce/schema/User.Profile.Name';
import FEFERATION_ID from '@salesforce/schema/User.FederationIdentifier';
import USER_TYPE from '@salesforce/schema/User.UserType'

//changes added by santosh End
import {getRecord} from 'lightning/uiRecordApi';
import communityBasePath from '@salesforce/community/basePath';
import {createRecord} from 'lightning/uiRecordApi';
import REGISTERED_WEB_TOOL_OBJECT from '@salesforce/schema/Registered_Webtool__c';
import CUSTOMER_FIELD from '@salesforce/schema/Registered_Webtool__c.Customer__c';
import WEB_TOOl_FIELD from '@salesforce/schema/Registered_Webtool__c.Web_Tool__c';
import createRegisteredWebToolRecord from "@salesforce/apex/x7sWebToolListController.createRegisteredWebToolRecord";


//Added By Sivesh Start
import createApplicationAccessRequest from "@salesforce/apex/x7sWebToolListController.createApplicationAccessRequest";
import title from '@salesforce/label/c.PrimaryAccess';
import fetchCurrentUserContact from '@salesforce/apex/currentUserInfoCtrl.fetchCurrentUserContact';

//Added By Sivesh End 
export default class X7sAllWebToolView extends NavigationMixin(LightningElement) {
    WebToolReferenceGuideIcon = WebToolReferenceGuide;

    launchIcon = ICON_PATH + '/ncp_icons/PNG/icon-launch.png';
    lockIcon = ICON_PATH + '/ncp_icons/PNG/icon-lock.png';
    olaunchIcon = ICON_PATH + '/ncp_icons/PNG/launch.png';
    olockIcon = ICON_PATH + '/ncp_icons/PNG/lock.png';

    @api objectApiName;
    @api fields;
    @api showFilter;
    @api showQuickReferenceGuideFilter;
    @api showWebToolICanAccessFilter;
    @api showFavouriteRecord;
    @api filterField;
    @api bookmarkedSuccessMessage;
    @api bookmarkedUnSuccessMessage;
    @api recordSize;
    @track result;
    @track webToolResult;
    @track isRecordSavedResult;
    @track webToolFilterResult;
    visibleResult;
    hideSpinner = true;
    nameValue;
    selectfilterValue = [];
    totalRecord;
    @track displayNoResult = false;
    toastLabel = 'WebTool Bookmarks';
    userCompany;
    contactId;
    federationid;
    profilename;
    usertype;
    userId = uId;
    updateBookmark = false;
    isEmployee = false;
    employeeportalurl = EMPLOYEEPORTAL_URL;
    successMessage = 'Access has been granted to {webToolName}';
    event2;
    defaultValuePicklist = '';
    @track displayResetButton = false;




    //Added By Sivesh Start 
    label = {title};
    @track showError = false;
    @track pendingApproval = false;
    @track noContact = false;
    @track isShowModal = false;
    @track isLoading = false;

    hideModalBox(event) {
        console.log('Test');
        this.isShowModal = false;
        this.showError = false;
    }

    // Added By Sivesh End

    @wire(getRecord, {
        recordId: '$userId',
        fields: [USER_ACCOUNT_NAME, CONTACT_ID, USER_PROFILE, FEFERATION_ID, USER_TYPE]
    })
    wiredUser({
        data,
        error
    }) {
        console.log('profile data', data);
        if (data) {
            this.userCompany = data.fields?.User_Account_name__c?.value;
            this.contactId = data.fields?.Contact?.value?.fields?.Id?.value;
            this.profilename = data.fields?.Profile?.value?.fields?.Name?.value;
            this.federationid = data.fields?.FederationIdentifier?.value;
            this.usertype = data.fields?.UserType?.value;
            console.log(this.usertype);
            if (this.usertype == "PowerCustomerSuccess") {
                this.isEmployee = false;
                console.log('coming into if', this.isEmployee);
            } else {
                this.isEmployee = true;
                console.log('coming into else', this.isEmployee);
            }
        } else if (error) {
            console.log("Profile Error: ", error);
        }
    }

    get currentPage() {
        let currentUrl = window.location.href;
        if (currentUrl.toString().includes("all-web-tools")) {
            return 'All Web Tools';
        } else {
            return 'My Web Tools';
        }
    }

    // getting the default record type id, if you dont' then it will get master
    @wire(getObjectInfo, {
        objectApiName: WEB_TOOL_OBJECT
    })
    webToolMetadata;

    get bookmarkIcon() {
        return ICON_PATH + '/ncp_icons/SVG/icon-bookmark.svg';
    }

    get activeBookmarkIcon() {
        return ICON_PATH + '/ncp_icons/SVG/icon-bookmark-active.svg';
    }

    //Commented by Sivesh Start
    connectedCallback() {
        this.getSelectedFilterForMyWebToolPage();
        this.getViewList();
    } //Commented By Sivesh End

    getSelectedFilterForMyWebToolPage() {
        if (this.showWebToolICanAccessFilter) {
            this.addValueToFilter(true, 'webToolAccessFilter');
        }
        if (this.showQuickReferenceGuideFilter) {
            this.addValueToFilter(true, 'Has_Reference_guide__c');
        }
    }

    getViewList() {
        this.hideSpinner = false;
        getViewList({
            objectName: this.objectApiName,
            fields: this.fields,
            filterFields: this.filterField,
            selectedFilter: JSON.stringify(this.selectfilterValue)
        }).then(result => {
            this.result = result.webToolRecord;
            this.totalRecord = this.result.length;
            if (this.result.length == 0) {
                this.displayNoResult = true;
            } else {
                this.displayNoResult = false;
            }

            console.log('this.selectfilterValue.length ' + this.selectfilterValue.length);
            console.log('this.selectfilterValue ' + JSON.stringify(this.selectfilterValue));
            if (this.showWebToolICanAccessFilter && this.selectfilterValue.length == 1) {
                this.displayResetButton = false;
            } else if (this.showQuickReferenceGuideFilter && this.selectfilterValue.length == 1) {
                this.displayResetButton = false;
            } else if (!this.showQuickReferenceGuideFilter && !this.showWebToolICanAccessFilter && this.selectfilterValue.length == 0) {
                this.displayResetButton = false;
            } else if (this.selectfilterValue.length == 0) {
                this.displayResetButton = false;
            } else {
                this.displayResetButton = true;
            }

            this.webToolResult = result.webToolAccessibleRecord;
            this.isRecordSavedResult = result.webToolFavouriteRecord;
            this.webToolFilterResult = result.webToolFilterRecord;
            this.updateWebToolFilterResult();

            for (let i = 0; i < this.result.length; i++) {
                this.result[i].detailUrl = '/s/web-tool/' + this.result[i].Id;
                this.result[i].webToolLogo = WebTool + '/Icons/' + this.result[i].Web_Tool_Logo_Label__c + '.png';
                if (this.webToolResult) {
                    let registeredWebToolRecord = this.webToolResult.find(item => item === this.result[i].Id);
                    if (registeredWebToolRecord == undefined) {
                        this.result[i].displayRequestAccess = true;
                        this.result[i].displayWebToolUrl = false;
                    } else {
                        this.result[i].displayRequestAccess = false;
                        if (this.result[i].Web_Tool_URL__c == undefined) {
                            this.result[i].displayWebToolUrl = false;
                        } else {
                            this.result[i].displayWebToolUrl = true;
                        }
                    }
                    if (this.result[i].INITIAL_PROVISIONING__c == 'Automatic') {
                        this.result[i].iInitialProvisioningAutomatic = true;
                    } else {
                        this.result[i].iInitialProvisioningAutomatic = false;
                    }
                }

                if (this.isRecordSavedResult) {
                    let savedRecord = this.isRecordSavedResult.find(item => item === this.result[i].Id);
                    if (savedRecord == undefined) {
                        this.result[i].selected = false;
                    } else {
                        this.result[i].selected = true;
                    }
                }
            }
            this.hideSpinner = true;
        }).catch(error => {
            this.hideSpinner = true;
            console.log('this.error ' + JSON.stringify(error));
            console.log('this.error ' + error);
            console.error(reduceErrors(error));
        }).finally(() => {
            this.hideSpinner = true;
        });
    }

    disconnectedCallback() {
        clearInterval(this.event2);
    }

    requestAccess(event) {
        
        //this.isLoading = true; /*Added By Sivesh*/

        let recordId = event.currentTarget.dataset.id;
        let itemName = event.currentTarget.dataset.name;
        this.sendgoogletracking({
            eventAction: `Navigate To ${itemName} Request Access Page`,
            eventLabel: `${this.currentPage} - Request Access Click`
        });
        let webToolRecord = this.result.find(item => item.Id === recordId);
        console.log('webToolRecord '+webToolRecord);
        if (webToolRecord != undefined && webToolRecord.INITIAL_PROVISIONING__c == 'Automatic') {
            this.createRegisteredWebTool(this.contactId, recordId, itemName);
            this.isLoading = false; //Added by Santosh
        } else {

            // Commented by Sivesh Start
            /*//Bhagavan - Code Start
     
      this[NavigationMixin.GenerateUrl]({
        type: "comm__namedPage",
        attributes: {
            pageName: 'requestaccess'
        }

    }).then(generatedUrl => {
        window.open(generatedUrl, "_self"); 
    }); 

    //Bhagavan - Code END*/

            /*  this[NavigationMixin.GenerateUrl]({
                  type: 'standard__webPage',
                  attributes: {
                      url:   '/customerportal/s/requestaccess/' 
                  }
              }).then(generatedUrl => {
                  window.open(generatedUrl,"_self");
              });*/ // Commented By Sivesh End



            // Added By Sivesh Start
            console.log('label' + title);
            if (title.includes(itemName)) {
                console.log('test1' + itemName);
                this.tileName = itemName;
                this.isLoading = false;

                // Added by Saim Start
                //this stores which primary webtool the user is requesting access for in session storage to enable the toggle on request access page
                window.sessionStorage.setItem(
                    'selectedWebtool',
                    itemName
                );
                // Added by Saim end
                this.showError = true; //Added After Review
                this.pendingApproval = true; //Added After Review
                this.noContact = false; //Added After Review
                //Changes added by Tayari to prevent redirection to request access page START
                /*this[NavigationMixin.GenerateUrl]({
                    type: "comm__namedPage",
                    attributes: {
                        pageName: 'requestaccess'
                    }
            
                }).then(generatedUrl => {
                    window.open(generatedUrl, "_self"); 
                }); */
                //Changes added by Tayari to prevent redirection to request access page END
            } else {
                
                createApplicationAccessRequest({
                        additionalAccess: itemName
                    })
                    .then(result => {
                        console.log('@@@@@@@2' + JSON.stringify(result));
                        if (result === true) {
                            //this.inputString = itemName;
                            console.log('result1' + JSON.stringify(result));
                            console.log('itemName' + itemName);
                            this.isShowModal = true;
                            this.isLoading = false;
                        } else {
                            console.log('Hello');
                            fetchCurrentUserContact()
                                .then(result => {
                                    if (result === true) {
                                        console.log('Am in');
                                        this.showError = true; //Added After Review
                                        this.pendingApproval = true; //Added After Review
                                        this.isLoading = false;
                                        /*const event = new ShowToastEvent({
                                            title: 'Error',
                                            message: 'Oops! It looks like a request for access is still pending approval. Please allow 24 - 48 hours for access approval.',
                                            variant: 'Error'
                                        });
                                        this.dispatchEvent(event);*/
                                        /*Commented after Review*/
                                    } else {
                                        this.showError = true; //Added After Review
                                        this.noContact = true; //Added After Review
                                        this.isLoading = false;
                                        /*const event = new ShowToastEvent({
                                            title: 'Error',
                                            message: 'Contact is not found. Please contact to your System Administrator',
                                            variant: 'Error'
                                        });
                                        this.dispatchEvent(event);*/
                                        /*Commented after Review*/
                                    }
                                })

                        }

                    })
                    .catch(error => {
                        console.log('error' + error);
                        this.isLoading = false;
                        const event = new ShowToastEvent({
                            title: 'Error',
                            message: 'This Page is having errors. Please contact your System Administrator',
                            variant: 'Error'
                        });
                        this.dispatchEvent(event);

                    })
            }

            // Added By Sivesh End



        }
    }

    createRegisteredWebTool(ContactId, WebToolId, itemName) {

        createRegisteredWebToolRecord({
            ContactId: ContactId,
            WebToolId: WebToolId
        }).then(registeredWebTool => {
            this.registeredWebToolId = registeredWebTool.id;
            let searchResult = this.result.find(item => item.Id === WebToolId);
            if (searchResult.Web_Tool_URL__c != undefined) {
                this.updateBookmark = true;
                this.getViewList();
                console.log(itemName);
                //ToastMessage
                let suceessMessageForRegisteredWebTool = this.successMessage.replace("{webToolName}", itemName);
                console.log(suceessMessageForRegisteredWebTool);

                /*this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: suceessMessageForRegisteredWebTool,
                        variant: 'success',
                    }),
                );*/
                this.template.querySelector('c-n-c-p_-custom-toast-notification').showToast('success', suceessMessageForRegisteredWebTool, 'utility:success', 4000);

                //changes made by santosh start to stop redirect 
                /* this.event2 = setInterval(() => {
                     //Redirection
                     this[NavigationMixin.GenerateUrl]({
                         type: 'standard__webPage',
                         attributes: {
                             url:   '/customerportal/s/web-tool/'+WebToolId 
                         }
                     }).then(generatedUrl => {
                         window.open(generatedUrl,"_self");
                     });
                 }, 3000);*/

                //changes made by santosh end to stop redirect

            }
        }).catch(error => {
            console.log('this.error ' + JSON.stringify(error));
            console.log('this.error ' + error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating Registered Web Tool Record',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            console.error(reduceErrors(error));
        });

    }

    requestDetailPage(event) {
        let recordId = event.currentTarget.dataset.id;
        let itemName = event.currentTarget.dataset.name;

        this.sendgoogletracking({
            eventAction: `Navigate To ${itemName} Detail Page`,
            eventLabel: `${this.currentPage} - Web Tool Detail / Icon Click`
        });
        /* this[NavigationMixin.GenerateUrl]({
             type: 'standard__webPage',
             attributes: {
                 url:   '/customerportal/s/web-tool/'+recordId 
             }
         }).then(generatedUrl => {
             window.open(generatedUrl,"_self");
         });*/

        /*Santosh code for dynamic webtool url fetch start*/

        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Web_Tool__c',
                actionName: 'view'
            }
        }).then(generatedUrl => {
            window.open(generatedUrl, "_self");
        });

    }

    updateWebToolFilterResult() {
        for (let i = 0; i < this.webToolFilterResult.length; i++) {
            var option = [];
            let opt = {
                label: 'All',
                value: ''
            };
            option.push(opt);
            for (let j = 0; j < this.webToolFilterResult[i].Values.length; j++) {
                let opt = {
                    label: this.webToolFilterResult[i].Values[j],
                    value: this.webToolFilterResult[i].Values[j]
                };
                option.push(opt);
            }
            this.webToolFilterResult[i].Values = option;
        }
    }

    requestLaunchURL(event) {

        let recordId = event.currentTarget.dataset.id;
        let searchResult = this.result.find(item => item.Id === recordId);
        let itemName = event.currentTarget.dataset.name;
        this.sendgoogletracking({
            eventAction: `Navigate To ${itemName} Launch Page`,
            eventLabel: `${this.currentPage} - Launch Click`
        });

        if (searchResult.displayWebToolUrl) {
            this[NavigationMixin.GenerateUrl]({
                type: 'standard__webPage',
                attributes: {
                    url: searchResult.Web_Tool_URL__c
                }
            }).then(generatedUrl => {
                window.open(generatedUrl, "_blank");
            });
        }
    }

    requestLaunchURLEmployee(event) {

        let recordId = event.currentTarget.dataset.id;
        let searchResult = this.result.find(item => item.Id === recordId);
        let itemName = event.currentTarget.dataset.name;
        this.sendgoogletracking({
            eventAction: `Navigate To ${itemName} Launch Page`,
            eventLabel: `${this.currentPage} - Launch Click`
        });

        // if (searchResult.displayWebToolUrl) {
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: searchResult.Web_Tool_URL__c
            }
        }).then(generatedUrl => {
            window.open(generatedUrl, "_blank");
        });
        // }
    }

    handleSavedClick(event) {
        let itemId = event.currentTarget.dataset.id;
        let itemName = event.currentTarget.dataset.name;
        this.unSaved(itemId, itemName);
    }

    unSaved(itemId, itemName) {
        let bookmarkedUnSuccessMessage = this.bookmarkedUnSuccessMessage.replace("{ItemName}", itemName);
        let bookmarkedSuccessMessage = this.bookmarkedSuccessMessage.replace("{ItemName}", itemName);
        updateListRecord({
                recordId: itemId
            })
            .then(result => {
                this.updateBookmark = true;
                this.getViewList();
                if (result) {
                    this.sendgoogletracking({
                        eventAction: `Remove Bookmark from ${itemName} Web Tool`,
                        eventLabel: `${this.currentPage} - Unbookmark Click`
                    });
                    this.template.querySelector('c-n-c-p_-custom-toast-notification').showToast('success', bookmarkedUnSuccessMessage, 'utility:success', 1000);
                    //this.showToast(this.bookmarkedUnSuccessMessage,'success');
                } else {
                    this.sendgoogletracking({
                        eventAction: `Added ${itemName} Web Tool to Bookmark`,
                        eventLabel: `${this.currentPage} - Bookmark Click`
                    });
                    this.template.querySelector('c-n-c-p_-custom-toast-notification').showToast('success', bookmarkedSuccessMessage, 'utility:success', 1000);
                    //this.showToast(this.bookmarkedSuccessMessage,'success');
                }
            })
            .catch(error => {
                console.log('this.error ' + JSON.stringify(error));
                console.log('this.error ' + error);
                console.error(reduceErrors(error));
            });
    }

    showToast(msg, variant) {
        const event = new ShowToastEvent({
            title: this.toastLabel,
            message: msg,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    handleEnter(event) {
        this.updateBookmark = false;
        this.nameValue = event.currentTarget.value;
        this.nameValue = event.currentTarget.value;
        this.addValueToFilter(this.nameValue, 'Name');
        this.sendgoogletracking({
            eventAction: `Searched ${this.nameValue} in List filter search`,
            eventLabel: `${this.currentPage} - List filter search entered`
        });
        this.getViewList();
    }

    addValueToFilter(fieldValue, fieldAPIName) {
        if (this.selectfilterValue == undefined) {
            let obj = {
                "value": fieldValue,
                "fieldAPIName": fieldAPIName
            };
            this.selectfilterValue.push(obj);
        } else {
            if (this.selectfilterValue.some(item => item.fieldAPIName === fieldAPIName)) {
                this.selectfilterValue.forEach(elememt => {
                    if (elememt['fieldAPIName'] === fieldAPIName) {
                        elememt['value'] = fieldValue;
                    }
                });
            } else {
                this.selectfilterValue.push({
                    "value": fieldValue,
                    "fieldAPIName": fieldAPIName
                });
            }
        }
    }

    removeValueFromFilter(arr, attr, value) {
        var i = arr.length;
        while (i--) {
            if (arr[i] &&
                arr[i].hasOwnProperty(attr) &&
                (arguments.length > 2 && arr[i][attr] === value)) {

                arr.splice(i, 1);

            }
        }
        return arr;
    }

    webToolAccessFilter(event) {
        this.updateBookmark = false;

        this.addValueToFilter(event.target.checked, 'webToolAccessFilter');

        if (!event.target.checked && !this.showWebToolICanAccessFilter) {
            this.selectfilterValue = this.removeValueFromFilter(this.selectfilterValue, 'fieldAPIName', 'webToolAccessFilter');
        }

        this.sendgoogletracking({
            eventAction: `Web tools I can access selected`,
            eventLabel: `${this.currentPage} - Web tools I can access selected`
        });
        this.getViewList();
    }

    quickReferenceFilter(event) {
        this.updateBookmark = false;
        this.addValueToFilter(event.target.checked, 'Has_Reference_guide__c');

        if (!event.target.checked && !this.showQuickReferenceGuideFilter) {
            this.selectfilterValue = this.removeValueFromFilter(this.selectfilterValue, 'fieldAPIName', 'Has_Reference_guide__c');
        }

        this.sendgoogletracking({
            eventAction: `Quick reference guide available selected`,
            eventLabel: `${this.currentPage} - Quick reference guide available selected`
        });
        this.getViewList();
    }

    handleChange(event) {
        this.updateBookmark = false;
        this.addValueToFilter(event.currentTarget.value, event.currentTarget.name);
        if (event.currentTarget.value == '') {
            this.selectfilterValue = this.removeValueFromFilter(this.selectfilterValue, 'fieldAPIName', event.currentTarget.name);
        }
        this.sendgoogletracking({
            eventAction: `${event.currentTarget.label} option selected in List filter ${event.currentTarget.label}`,
            eventLabel: `${this.currentPage} - List filter ${event.currentTarget.label} selected`
        });
        this.getViewList();
    }

    updateRecordHandler(event) {
        //this.updateBookmark = false;
        this.visibleResult = [...event.detail.records];
        let paginationClicked = event.detail.paginationClicked;
        if (paginationClicked) {
            let containerChoosen = this.template.querySelector('.NcpAllWebToolView');
            containerChoosen.scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            });
        }
    }

    async openModalPopup() {
        const result = await NCPSegmentModal.open({
            size: 'medium',
            content: '',
        });
        // if modal closed with X button, promise returns result = 'undefined'
        // if modal closed with OK button, promise returns result = 'okay'
        console.log(result);
    }

    /**
     * Method to send google events via window.postMessage
     *  @param {Object} message - Object to send to google analytics
     */
    sendgoogletracking(message) {
        try {
            const {
                eventAction,
                eventLabel
            } = message;
            const host = 'https://' + location.hostname;
            window.postMessage({
                    event: 'SalesForceUser',
                    eventAction: eventAction,
                    eventLabel: eventLabel,
                    eventValue: null,
                    dimensions: {
                        CompanyName: this.userCompany ? this.userCompany : 'Company name not found (' + this.contactId + ')',
                        SalesForceID: this.contactId ? this.contactId : "Not a Community Contact (bnsf user)"
                    },
                    messagetype: 'com.bnsf.googleanalytics'
                },
                host
            );
        } catch (e) {
            console.error(e);
        }
    }

    resetFilter(event) {
        //Reset the search filter
        this.nameValue = '';
        this.addValueToFilter(this.nameValue, 'Name');

        //Reset the Picklist Filter
        this.selectfilterValue = [];

        //Reset the webToolAccessFilter, Reset the quickReferenceFilter, Combobox
        this.updateWebToolFilterResultOnReset();

        this.getSelectedFilterForMyWebToolPage();

        //Referesh the List View
        this.getViewList();
    }

    updateWebToolFilterResultOnReset() {
        //Reset all Combobox       
        this.template.querySelectorAll('lightning-combobox').forEach(each => {
            each.value = '';
        });

        //Reset webTool Access Checkbox
        if (!this.showWebToolICanAccessFilter) {
            this.template.querySelector('input[name="webToolAccessCheckbox"]').checked = false;
        }

        if (this.showWebToolICanAccessFilter) {
            this.template.querySelector('input[name="webToolAccessCheckbox"]').checked = true;
        }

        //Reset Quick reference checkbox
        if (!this.showQuickReferenceGuideFilter) {
            this.template.querySelector('input[name="quickReferenceCheckbox"]').checked = false;
        }

        if (this.showQuickReferenceGuideFilter) {
            this.template.querySelector('input[name="quickReferenceCheckbox"]').checked = true;
        }

    }

    //Added By Sivesh Start
    //Added by Sivesh
   
    // Added by Sivesh End

}
