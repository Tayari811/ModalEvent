import { LightningElement, api, track, wire } from 'lwc';
import patronCode from '@salesforce/resourceUrl/patron_code_examples';
import Miscellaneous_PC_MSG from '@salesforce/label/c.CR_Miscellaneous_PC_MSG';
import CR_Lock_MSG from '@salesforce/label/c.CR_Lock_MSG';
import CR_Coworker_app_err_msg from '@salesforce/label/c.CR_Coworker_app_err_msg';
import CR_Coworker_Same_level_access from '@salesforce/label/c.CR_Coworker_Same_level_access';
import CR_App_Request_As_Coworker from '@salesforce/label/c.CR_App_Request_As_Coworker';
import AccessHeading from '@salesforce/label/c.CR_Access_Heading';
import CR_UI_Patron1_Error from '@salesforce/label/c.CR_UI_Patron1_Error';
import CR_UI_PSF_Card_ERROR from '@salesforce/label/c.CR_UI_PSF_Card_ERROR';
import CR_UI_Patron2_Error from '@salesforce/label/c.CR_UI_Patron2_Error';
import CR_UI_SR_Station_Error from '@salesforce/label/c.CR_UI_SR_Station_Error';
import CR_UI_MDI_Station_Error from '@salesforce/label/c.CR_UI_MDI_Station_Error';
import CR_UI_Additional_App_Error from '@salesforce/label/c.CR_UI_Additional_App_Error';
import CR_UI_Empty_Error from '@salesforce/label/c.CR_UI_Empty_Error';
import retrieveRecords from '@salesforce/apex/LQ_CustomerRegistrationSOQL.retrieveRecords';
import retrieveApplicationRecords from '@salesforce/apex/LQ_CustomerRegistrationSOQL.retrieveApplicationRecords';
import retrieveAllApplicationRecords from '@salesforce/apex/LQ_CustomerRegistrationSOQL.retrieveAllApplicationRecords';
import getResults from '@salesforce/apex/LQ_CustomerRegistrationSOQL.getResults';
import isValidBNSFId from '@salesforce/apex/LQ_MultiSelectLookupController.isValidBNSFId';
import fetchUser from '@salesforce/apex/currentUserInfoCtrl.fetchUser';
import fetchCurrentUserContact from '@salesforce/apex/currentUserInfoCtrl.fetchCurrentUserContact';
import createApplicationAccessRequest from '@salesforce/apex/LQ_MultiSelectLookupController.createApplicationAccessRequest';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//Start - Added by Sivesh For B-360789
import railCarEquipmentType from "@salesforce/schema/Application_Access_Request__c.Railcar_Equipment_Type__c";
import applicationAccessRequestObject from '@salesforce/schema/Application_Access_Request__c';
import {getObjectInfo} from 'lightning/uiObjectInfoApi';
import {getPicklistValues} from 'lightning/uiObjectInfoApi';
//End - Added by Sivesh For B-360789


let i=0;
export default class lqRequestAccessUi extends NavigationMixin (LightningElement) {

    redirect = false;
    patronCodeImg = patronCode;
    @track globalSelectedItems = []; //holds all the selected checkbox items
    //start: following parameters to be passed from calling component
    @api objectApiName = 'Patron_code__c';
    @api fieldApiNames = 'Id,Code__c';
    @api filterFieldApiName = 'Code__c';
    @api LoadingTextPatron = false;
   
    //Label
    MiscellaneousPCMSG = Miscellaneous_PC_MSG;
    accessHeading = AccessHeading;
    //end---->
    @track items = []; //holds all records retrieving from database
    @track selectedItems = []; //holds only selected checkbox items that is being displayed based on search
    coworkerApps =[]; //holds current user application access list
    existingUserApps=[];//holds currentuser application access list
    @track additionalApps =[];
    //since values on checkbox deselection is difficult to track, so workaround to store previous values.
    //clicking on +ADD button, first previousSelectedItems items to be deleted and then selectedItems to be added into globalSelectedItems
    @track previousSelectedItems = []; 
    @track value = []; //this holds checkbox values (Ids) which will be shown as selected
    @track page = 1; //it holds first page number
    perpage = 5;
    @track isLoading = false;
    @track pages = [];
    @track applicationAccessDetails = {
        'MVFIDisabled': false,
        'PSFDisabled': false,
        'orderRailcarsDisabled': false,
        'SRBDisabled': false,
        'SRRDisabled': false,
        'MDIDisabled': false,
        'ShowMVFIDisabledMessage': false,
        'ShowPSFDisabledMessage': false,
        'ShoworderRailcarsDisabledMessage': false,
        'ShowSRBDisabledMessage': false,
        'ShowSRRDisabledMessage': false,
        'ShowMDIDisabledMessage': false
    }
    @track isDisplayInfoForSubmit = false;
    @track isPrimaryAppAccessSame = false;
    
    set_size = 5;
    searchInput ='';    //captures the text to be searched from user input
    isDialogDisplay = false; //based on this flag dialog box will be displayed with checkbox items
    isDisplayMessage = false; //to show 'No records found' message
    isDisplayAppErrorMessage = false;//to show if coworker dont have apps
    isDisplayBNSFErrorMessage = false;//to show error message when user enter wrong bnsf id
    isDisplayOWNIDErrorMessage = false;//to show error message when user enter his/her own id
    coworkerId = '';//holds the coworkerid
    userFID = '';//hold logged in user's federation ID
    isAppsAvailable = false;
    isCoworkerIdUsed = false;
    isCoworkerAvailable = true;
    manageVariousInvoiceCheck = false;
    payStorageFees = false;
    orderRailcars = false;
    createSubmitRail = false;
    releaseEquipment = false;
    manageDemurrageInvoice = false;
    MVFIAccess = false;
    MVFIAccessManual = false;
    CoworkerMVFIAccess = false;
    MVFIPatronCode = '';
    PSFAccess = false;
    PSFAccessManual = false;
    coworkerPSFAccess = false;
    PSFPatroncode = '';
    orderRailcarsAccess = false;
    coworkerorderRailcarsAccess = false;
    SRBAccess = false;
    coworkerSRBAccess = false;
    SRRAccess = false;
    SRRAccessManual = false;
    coworkerSRRAccess = false;
    SRRStations = '';
    MDIAccess = false;
    MDIAccessManual = false;
    coworkerMDIAccess = false;
    MDIStations = '';
    additionalApplication = '';
    comments = '';
    creditCard = false;
    BNSFCredit = false;
    MVFIpatronVal='';
    SRRStationVal='';
    MIDStationVal='';
    additionalApplicationVal='';
    loaded = false;
    AppLockedMsg = CR_Lock_MSG;
    CoworkerAppErrorMsg = CR_Coworker_app_err_msg;
    CoworkerSameLevelAccErrorMsg=CR_Coworker_Same_level_access;
    SubmitAccReqAsCoworker=CR_App_Request_As_Coworker;
    //Station__c multiselect variables
    @api LoadingTextStation = false;
    @track globalSelectedItemsStation = [];
    @api stationObjectApiName = 'Station__c';
    @api stationfieldApiNames = 'Id,City_and_State__c';
    @api stationfilterFieldApiName = 'City_and_State__c';
    @track stationitems = [];
    @track stationSelectedItems = [];
	@track previousStationSelectedItems = []; 
    @track valueStation = [];
    searchInputStation ='';   
    isDialogDisplayStation = false; 
    isDisplayMessageStation = false;

    //MDI Stations variables
    @api LoadingTextMDI = false;
    @track globalSelectedItemsMDIStation = [];
    @api mdiStationObjectApiName = 'Station__c';
    @api mdiStationfieldApiNames = 'Id,City_and_State__c';
    @api mdiStationfilterFieldApiName = 'City_and_State__c';
    @track mdiStationitems = [];
    @track mdiStationSelectedItems = [];
	@track previousmdiStationSelectedItems = []; 
    @track valueMDIStation = [];
    searchInputMDIStation ='';   
    isDialogDisplayMDIStation = false; 
    isDisplayMessageMDIStation = false;

    //Additonal application related variables start
    isAdditionalApplicationUsed = false;
    @track globalSelectedItemsSearchApplication = [];
    @api searchApplicationfieldApiNames = 'Id,Name';
    @api searchApplicationfilterFieldApiName = 'Name';
    @track searchApplicationitems = [];
    @track searchApplicationSelectedItems = [];
    @track previoussearchApplicationSelectedItems = []; 
    @track valueSearchApplication = [];
    searchInputSearchApplication ='';
    isDisplayMessageSearchApplication = false; 
    //Additional application realted variables end

    //Single Patron Code Variable *START*
    @api objectName = 'Patron_code__c';//Object to retrieve single patron code list
    @api fieldName = 'Code__c';//field which contain patron code values
    @api selectRecordId = '';//This will contain selected single patron code's ID
    @api selectRecordName;//This will contain selected single patron code's Name
    @api searchRecords = [];//This will contain all retrieved records from patron code object
    @api LoadingText = false;//this variable will be used to display Loading message or not
    @track txtclassname = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    @track messageFlag = false;
    @track clearIconFlag = false;
    @track inputReadOnly = false;
    @track searchIcon='search';
    //Single Patron Code Variable *END*

    //Retrieve custom metadata records for main appliation
    //Disabled Toggle button variable  START
    MVFIDisabled = false;
    PSFDisabled = false;
    orderRailcarsDisabled =false;
    SRBDisabled = false;
    SRRDisabled = false;
    MDIDisabled = false;
    //Disabled Toggle button variable  END

    // Start - Added by Tayari For B-360552
    @track showError = false;
    @track noContact = false;


    // Start - Added by Tayari For B-360552

    // Start - Added by Sivesh For B-360789
    orderRailCarAccessManual;
    @track isRailCarType;
    @track value;
    railCarOthers;
    @track otherTypeValue;
    otherCarType;
    @wire(getObjectInfo, { objectApiName: applicationAccessRequestObject })
    objectInfo;
    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: railCarEquipmentType
      })
    railCarEquipmentTypeValue;
    onchangeRailCareType(event){
        this.otherCarType = event.detail.value;
        console.log('____this.otherCarType__'+this.otherCarType);
        this.railCarOthers=false;
        if(this.otherCarType == 'Other (please specify)' ){
            this.railCarOthers = true;
        }else {
            this.railCarOthers = false;
        }
        console.log('__this.railCarOthers__'+this.railCarOthers);
    }
    handleInputChangeOtherType(event) {
        this.otherTypeValue = event.detail.value;
    }
    // End- Added by Sivesh For B-360789

    //Single Patron Code logic *START*
    searchField(event) {
        var currentText = event.target.value;
        this.LoadingText = true;
        
        getResults({ ObjectName: this.objectName, fieldName: this.fieldName, value: currentText  })
        .then(result => {
            this.searchRecords= result;
            this.LoadingText = false;
            
            this.txtclassname =  result.length > 0 ? 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
            if(currentText.length > 0 && result.length == 0) {
                this.messageFlag = true;
            }
            else {
                this.messageFlag = false;
            }
 
            if(this.selectRecordId != null && this.selectRecordId.length > 0) {
                this.clearIconFlag = true;
            }
            else {
                this.clearIconFlag = false;
            }
        })
        .catch(error => {
            console.log('-------error-------------'+error);
            console.log(error);
        });
        
    }
    
   setSelectedRecord(event) {
        var currentRecId = event.currentTarget.dataset.id;
        var selectName = event.currentTarget.dataset.name;
        this.txtclassname =  'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        this.clearIconFlag = true;
        this.searchIcon='text';
        this.selectRecordName = event.currentTarget.dataset.name;
        console.log('Mustang'+this.selectRecordName);
        this.selectRecordId = currentRecId;
        this.inputReadOnly = true;
        const selectedEvent = new CustomEvent('selected', { detail: {selectName, currentRecId}, });
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
    
    resetData(event) {
        this.selectRecordName = "";
        this.selectRecordId = "";
        this.searchIcon='search';
        this.inputReadOnly = false;
        this.clearIconFlag = false;
       
    }
    //Single Patron Code logic *END*

    //additional appliation realted logic start
    onchangeSearchInputSearchApplication(event){
        this.searchInputSearchApplication = event.target.value;
        if(this.searchInputSearchApplication.trim().length>0){
            fetchUser()
            .then(result =>{
                this.userFID = result.FederationIdentifier;
                retrieveApplicationRecords({fieldAPINames: this.searchApplicationfieldApiNames,
                            filterFieldAPIName: this.searchApplicationfilterFieldApiName,
                            strInput: this.searchInputSearchApplication,
                            userID : this.userFID
                            })
            .then(result=>{
                this.searchApplicationitems = []; 
                this.valueSearchApplication = [];
                this.previoussearchApplicationSelectedItems = [];
    
                if(result.length>0){
                    result.map(resElement=>{
                        this.searchApplicationitems = [...this.searchApplicationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsSearchApplication.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueSearchApplication.push(element.value);
                                this.previoussearchApplicationSelectedItems.push(element);                      
                            }
                        });
                    });
                    if(this.coworkerApps.some(item =>this.searchApplicationitems.includes(item))){
                        this.searchApplicationitems.removeItem(item);
                    }
                    this.isDisplayMessageSearchApplication = false;
                }
                else{
                    this.isDisplayMessageSearchApplication = true;
                    this.searchApplicationSelectedItems=[];                     
                }
            })
            .catch(error=>{
                this.error = error;
                this.searchApplicationitems = undefined;
            })
            })
            .catch(error => {
                this.error = error;
            })
            
        }
        else{
            fetchUser()
        .then(result =>{
            this.userFID = result.FederationIdentifier;
            retrieveAllApplicationRecords({fieldAPINames: this.searchApplicationfieldApiNames,
                            filterFieldAPIName: this.searchApplicationfilterFieldApiName,
                            userID : this.userFID
                            })
            .then(result=>{ 
                this.searchApplicationitems = []; 
                this.valueSearchApplication = [];
                this.previoussearchApplicationSelectedItems = [];
    
                if(result.length>0){
                    result.map(resElement=>{
                        this.searchApplicationitems = [...this.searchApplicationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsSearchApplication.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueSearchApplication.push(element.value);
                                this.previoussearchApplicationSelectedItems.push(element);                      
                            }
                        });
                    });
                    if(this.coworkerApps.some(item =>this.searchApplicationitems.includes(item))){
                        this.searchApplicationitems.removeItem(item);
                    }
                    this.isDisplayMessageSearchApplication = false;
                }
                else{
                    this.isDisplayMessageSearchApplication = true;
                    this.searchApplicationSelectedItems=[];                     
                }
            })
            .catch(error=>{
                this.error = error;
                this.searchApplicationitems = undefined;
            })
        })
        .catch(error => {
            this.error = error;
        })
            
        }             
    }
    handleCheckboxChangeSearchApplication(event){
        this.isAdditionalApplicationUsed = true;
        let selectItemTemp = event.detail.value;
        let tempAdd = [];
        this.globalSelectedItemsSearchApplication.forEach(obj =>{
            tempAdd.push(obj.value);
            console.log('Value',obj.value);
        })
        if(selectItemTemp.length==0)
        {
            this.isAdditionalApplicationUsed = false;
        }
        else if(selectItemTemp.length>0)
        {
            if(this.globalSelectedItemsSearchApplication.length>0)
            {
                for(let key in selectItemTemp)
                {
                    if(tempAdd.includes(selectItemTemp[key]))
                    {
                        this.isAdditionalApplicationUsed = false;
                        console.log('inside');
                    }
                    else
                    {
                        this.isAdditionalApplicationUsed = true;
                        console.log('outside');
                    }
                }
            }
        }
        
        console.log(' handleCheckboxChangeSearchApplication  value=', event.detail.value);
        console.log('Added App',this.globalSelectedItemsSearchApplication.length);        
        this.searchApplicationSelectedItems = [];
        selectItemTemp.map(p=>{            
            let arr = this.searchApplicationitems.find(element => element.value == p);
            if(arr != undefined){
                this.searchApplicationSelectedItems.push(arr);
            }  
        });
        this.handleDoneClickSearchApplication();    
    }
    handleRemoveRecordSearchApplication(event){        
        const removeItem = event.target.dataset.item; 
        this.globalSelectedItemsSearchApplication = this.globalSelectedItemsSearchApplication.filter(item => item.value  != removeItem);
        const arrItems = this.globalSelectedItemsSearchApplication;
        this.initializeValuesSearchApplication();
        this.valueSearchApplication =[]; 
        const evtCustomEvent = new CustomEvent('remove', {   
            detail: {removeItem,arrItems}
            });
        this.searchApplicationSelectedItems=this.globalSelectedItemsSearchApplication;
        fetchUser()
        .then(result =>{
            this.userFID = result.FederationIdentifier;
            retrieveAllApplicationRecords({fieldAPINames: this.searchApplicationfieldApiNames,
                        filterFieldAPIName: this.searchApplicationfilterFieldApiName,
                        userID : this.userFID
                        })
        .then(result=>{ 
            this.searchApplicationitems = []; 
            this.valueSearchApplication = [];
            this.previoussearchApplicationSelectedItems = [];

            if(result.length>0){
                result.map(resElement=>{
                    this.searchApplicationitems = [...this.searchApplicationitems,{value:resElement.recordId, 
                                                label:resElement.recordName}];
                    this.globalSelectedItemsSearchApplication.map(element =>{
                        if(element.value == resElement.recordId){
                            this.valueSearchApplication.push(element.value);
                            this.previoussearchApplicationSelectedItems.push(element);                      
                        }
                    });
                });
                if(this.coworkerApps.some(item =>this.searchApplicationitems.includes(item))){
                    this.searchApplicationitems.removeItem(item);
                }
                this.isDisplayMessageSearchApplication = false;
            }
            else{
                this.isDisplayMessageSearchApplication = true;
                this.searchApplicationSelectedItems=[];                     
            }
        })
        .catch(error=>{
            this.error = error;
            this.searchApplicationitems = undefined;
        })
        })
        .catch(error => {
            this.error = error;
        })
        
        this.dispatchEvent(evtCustomEvent);
    }
    
    handleDoneClickSearchApplication(event){
        this.isAdditionalApplicationUsed = false;
        this.previoussearchApplicationSelectedItems.map(p=>{
            this.globalSelectedItemsSearchApplication = this.globalSelectedItemsSearchApplication.filter(item => item.value != p.value);
        });
        this.globalSelectedItemsSearchApplication.push(...this.searchApplicationSelectedItems);        
        const arrItems = this.globalSelectedItemsSearchApplication;
        this.previoussearchApplicationSelectedItems = this.searchApplicationSelectedItems;
        this.initializeValuesSearchApplication();
        const evtCustomEvent = new CustomEvent('retrieve', { 
            detail: {arrItems}
            });
        this.dispatchEvent(evtCustomEvent);
    }
    initializeValuesSearchApplication(){
        this.isAdditionalApplicationUsed = false;
    }
    //additional application  realted logic end

    retrieveAdditionApplicationList(){
        //Logic Will come here of additional application
    }

    //Radio Group 
    @track patronCodeVisible=true;
    checkRadioButton = false;


    get optionsRadioGroup(){
        return [
            { label: 'Credit Card', value: 'Credit Card' },
            { label: 'BNSF Credit', value: 'BNSF Credit' },
        ];
    }

    handleRadioChange(event){
        if(event.target.value=='BNSF Credit')
        {
            this.patronCodeVisible=false;
            this.BNSFCredit = true;
        }
        else
        {
            this.patronCodeVisible=true;
            this.creditCard = true;
        }
        this.checkRadioButton=true;
    }
    
    //This method is called when user enters search input. It displays the data from database.
    onchangeSearchInput(event){
        this.LoadingTextPatron = true;
        this.searchInput = event.target.value;
        if(this.searchInput.trim().length>0){
            //retrieve records based on search input
            retrieveRecords({objectName: this.objectApiName,
                            fieldAPINames: this.fieldApiNames,
                            filterFieldAPIName: this.filterFieldApiName,
                            strInput: this.searchInput
                            })
            .then(result=>{
                this.LoadingTextPatron = false; 
                this.items = []; //initialize the array before assigning values coming from apex
                this.value = [];
                this.previousSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        //prepare items array using spread operator which will be used as checkbox options
                        this.items = [...this.items,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        
                        /*since previously choosen items to be retained, so create value array for checkbox group.
                            This value will be directly assigned as checkbox value & will be displayed as checked.
                        */
                        this.globalSelectedItems.map(element =>{
                            if(element.value == resElement.recordId){
                                this.value.push(element.value);
                                this.previousSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDialogDisplay = true; //display dialog
                    this.isDisplayMessage = false;
                }
                else{
                    //display No records found message
                    this.isDialogDisplay = false;
                    this.isDisplayMessage = true;
                    this.selectedItems=[];                    
                }
            })
            .catch(error=>{
                this.error = error;
                this.items = undefined;
                this.isDialogDisplay = false;
            })
        }else{
            this.LoadingTextPatron = false;
            this.isDialogDisplay = false;
            this.isDisplayMessage = false;
        }                
    }

    //This method is called during checkbox value change
    handleCheckboxChange(event){
        let selectItemTemp = event.detail.value;
        
          
        this.selectedItems = []; //it will hold only newly selected checkbox items.        
        
        /* find the value in items array which has been prepared during database call
           and push the key/value inside selectedItems array           
        */
        selectItemTemp.map(p=>{            
            let arr = this.items.find(element => element.value == p);
            if(arr != undefined){
                this.selectedItems.push(arr);
            }  
        });     
        this.handleDoneClick();
    }

    //this method removes the pill item
    handleRemoveRecord(event){        
        const removeItem = event.target.dataset.item;
        
        //this will prepare globalSelectedItems array excluding the item to be removed.
        this.globalSelectedItems = this.globalSelectedItems.filter(item => item.value  != removeItem);
        const arrItems = this.globalSelectedItems;

        //initialize values again
        this.initializeValues();
        this.value =[]; 

        //propagate event to parent component
        const evtCustomEvent = new CustomEvent('remove', {   
            detail: {removeItem,arrItems}
            });
        this.selectedItems=this.globalSelectedItems;
        if(this.searchInput.trim().length>0){
            //retrieve records based on search input
            retrieveRecords({objectName: this.objectApiName,
                            fieldAPINames: this.fieldApiNames,
                            filterFieldAPIName: this.filterFieldApiName,
                            strInput: this.searchInput
                            })
            .then(result=>{
                this.LoadingTextPatron = false; 
                this.items = []; //initialize the array before assigning values coming from apex
                this.value = [];
                this.previousSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        //prepare items array using spread operator which will be used as checkbox options
                        this.items = [...this.items,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        
                        /*since previously choosen items to be retained, so create value array for checkbox group.
                            This value will be directly assigned as checkbox value & will be displayed as checked.
                        */
                        this.globalSelectedItems.map(element =>{
                            if(element.value == resElement.recordId){
                                this.value.push(element.value);
                                this.previousSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDialogDisplay = true; //display dialog
                    this.isDisplayMessage = false;
                }
                else{
                    //display No records found message
                    this.isDialogDisplay = false;
                    this.isDisplayMessage = true;
                    this.selectedItems=[];                    
                }
            })
            .catch(error=>{
                this.error = error;
                this.items = undefined;
                this.isDialogDisplay = false;
            })
        }
        this.dispatchEvent(evtCustomEvent);
    }

    //Done dialog button click event prepares globalSelectedItems which is used to display pills
    handleDoneClick(event){
        //remove previous selected items first as there could be changes in checkbox selection
        this.previousSelectedItems.map(p=>{
            this.globalSelectedItems = this.globalSelectedItems.filter(item => item.value != p.value);
        });
        
        //now add newly selected items to the globalSelectedItems
        this.globalSelectedItems.push(...this.selectedItems);        
        const arrItems = this.globalSelectedItems;
        
        //store current selection as previousSelectionItems
        this.previousSelectedItems = this.selectedItems;
        this.initializeValues();
        
        //propagate event to parent component
        const evtCustomEvent = new CustomEvent('retrieve', { 
            detail: {arrItems}
            });
        this.dispatchEvent(evtCustomEvent);
    }

    //this method initializes values after performing operations
    initializeValues(){        
        //this.isDialogDisplay = false;
    }
    connectedCallback(){
        //variables contain value of toggole buttons for apps
        this.isCoworkerAvailable =true;
        this.isAppsAvailable = false;
         //initialize toggle button values
         this.MVFIAccess = false;
         this.PSFAccess = false;
         this.orderRailcarsAccess =false;
         this.SRBAccess = false;
         this.SRRAccess = false;
         this.MDIAccess = false;
         this.CoworkerMVFIAccess = false;
        this.coworkerMDIAccess = false;
        this.coworkerPSFAccess = false;
        this.coworkerSRBAccess = false;
        this.coworkerSRRAccess = false;
        this.coworkerorderRailcarsAccess = false;
        this.isLoading = true;
        this.existingUserApps =[];
        this.coworkerApps = [];
        //initialize patron code 
        this.selectedItems =[];
        this.globalSelectedItems=[];
        //initialize station code
        this.stationSelectedItems=[];
        this.globalSelectedItemsStation=[];
        //initialize mdi station code
        this.mdiStationSelectedItems=[];
        this.globalSelectedItemsMDIStation=[];
        //initialize additional application list
        this.searchApplicationSelectedItems=[];
        this.globalSelectedItemsSearchApplication=[];
        
        /*Initial load of cowerker Apps Starts*/ 
        //this method used to get current logged in user federation id
        fetchUser()
        .then(result =>{
            //Added by Saim Start
            //set to true to show spinner until all toggles are checked
            this.isLoading = true;
            //Added by Saim End
            this.userFID = result.FederationIdentifier;
            //this method is used to get all apps which user have access 
            isValidBNSFId({
                userID : this.userFID
            })
            .then(result =>{
                    console.log('coworker---'+result.length);
                   //if user dont have any app access then enable coworker input box
                    if(result.length == 0){
                        this.isCoworkerAvailable =false;
                    }
                // add apps to coworkerApps array to display on UI
                else{
                    this.existingUserApps = result;
                    this.coworkerApps = result;
                    //this.isAppsAvailable = true;
                    //Logic for enabling toggle buttons for apps
                    result.forEach(obj =>{
                        if(obj.name__c === 'Account Status'){
                            console.log('__inside Account Status__'+obj.name__c);
                            this.MVFIAccess = true;
                            this.MVFIDisabled = true;
                            this.CoworkerMVFIAccess = true;
                            this.applicationAccessDetails.MVFIDisabled = true;
                            this.applicationAccessDetails.ShowMVFIDisabledMessage = true;
                        }
                        else if(obj.name__c === 'Intermodal Storage'){
                            console.log('__inside Intermodal Storage__'+obj.name__c);
                            this.PSFAccess = true;
                            this.PSFDisabled = true;
                            this.coworkerPSFAccess = true;
                            this.applicationAccessDetails.PSFDisabled = true;
                            this.applicationAccessDetails.ShowPSFDisabledMessage = true;
                        }
                        else if(obj.name__c === 'Railcar Equipment Request'){
                            console.log('__inside Railcar Equipment Request__'+obj.name__c);
                            this.orderRailcarsAccess = true;
                            this.orderRailcarsDisabled = true;
                            this.coworkerorderRailcarsAccess = true;
                            this.applicationAccessDetails.orderRailcarsDisabled = true;
                            this.applicationAccessDetails.ShoworderRailcarsDisabledMessage = true;
                        }
                        else if(obj.name__c === 'Shipping Instructions'){
                            console.log('__inside Shipping Instruction__'+obj.name__c);
                            this.SRBAccess = true;
                            this.SRBDisabled = true;
                            this.coworkerSRBAccess = true;
                            this.applicationAccessDetails.SRBDisabled = true;
                            this.applicationAccessDetails.ShowSRBDisabledMessage = true;
                        }
                        else if(obj.name__c === 'Switch & Release'){
                            console.log('__inside Switch & Release__'+obj.name__c);
                            this.SRRAccess = true;
                            this.SRRDisabled = true;
                            this.coworkerSRRAccess = true;
                            this.applicationAccessDetails.SRRDisabled = true;
                            this.applicationAccessDetails.ShowSRRDisabledMessage = true;
                        }
                        else if(obj.name__c === 'Customer Dwell Management Tool'){
                            console.log('__inside Customer Dwell Management Tool__'+obj.name__c);
                            this.MDIAccess = true;
                            this.MDIDisabled = true;
                            this.coworkerMDIAccess = true;
                            this.applicationAccessDetails.MDIDisabled = true;
                            this.applicationAccessDetails.ShowMDIDisabledMessage = true;
                        }
                    }) 
                }
                //Added by Saim Start
                //Calling method that controls toggles and turning spinner off after retrievals are done
                this.toggleSelectedWebTool();
                this.isLoading = false;
                //Added by Saim End
            })
            .catch(error =>{
              this.error = error;
              //Added by Saim Start
              this.isLoading = false;
              //Added by Saim End
            })
           
        })
        .catch(error => {
            this.error = error;
            //Added by Saim Start
            this.isLoading = false;
            //Added by Saim End
        })


        /**Initial load of Cowker apps ends */
        //Initial load of unique additional application list */START/*
        fetchUser()
        .then(result =>{
            this.userFID = result.FederationIdentifier;
            retrieveAllApplicationRecords({fieldAPINames: this.searchApplicationfieldApiNames,
                            filterFieldAPIName: this.searchApplicationfilterFieldApiName,
                            userID : this.userFID
            })
                .then(result=>{ 
                console.log('result'+result);
                this.searchApplicationitems = []; 
                this.valueSearchApplication = [];
                this.previoussearchApplicationSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        this.searchApplicationitems = [...this.searchApplicationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsSearchApplication.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueSearchApplication.push(element.value);
                                this.previoussearchApplicationSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDisplayMessageSearchApplication = false;
                }
                else{
                    this.isDisplayMessageSearchApplication = true;
                    this.searchApplicationSelectedItems=[];                     
                }
                })
                .catch(error=>{
                this.error = error;
                this.searchApplicationitems = undefined;
                })
        })
        .catch(error => {
            this.error = error;
        })
        
//Initial load of unique additional application list */END/*
       
       
} 
    //this method is used to get apps when user enters coworked id
    handleCoworkerApps(event){
        this.isAppsAvailable = false;
        this.isDisplayOWNIDErrorMessage = false;
        this.isDisplayAppErrorMessage = false;
        this.isDisplayBNSFErrorMessage = false;
        this.isDisplayInfoForSubmit = false;
        this.BNSFCredit = false;
        this.creditCard = false;
        this.isPrimaryAppAccessSame = false;
        //get coworker id
        //this.coworkerId = event.target.value;
        if(this.coworkerId == this.userFID)
        {
            this.isDisplayOWNIDErrorMessage = true;
            this.initializeCoworkerID();
            return;
        }
        //resetting back the disabled status
        if(!this.applicationAccessDetails.MVFIDisabled)
            this.MVFIDisabled = false;
        if(!this.applicationAccessDetails.PSFDisabled)
            this.PSFDisabled = false;
        if(!this.applicationAccessDetails.orderRailcarsDisabled)
            this.orderRailcarsDisabled = false;
        if(!this.applicationAccessDetails.SRBDisabled)
            this.SRBDisabled = false;
        if(!this.applicationAccessDetails.SRRDisabled)
            this.SRRDisabled = false;
        if(!this.applicationAccessDetails.MDIDisabled)
            this.MDIDisabled = false;
        //initialize toggle button values
        if(this.MVFIDisabled == false)
        {
            this.MVFIAccess = false;
        }
        if(this.PSFDisabled == false)
        {
            this.PSFAccess = false;
        }
        if(this.orderRailcarsDisabled == false)
        {
            this.orderRailcarsAccess =false;
        }
        if(this.SRBDisabled == false)
        {
            this.SRBAccess = false;
        }
        if(this.SRRDisabled == false)
        {
            this.SRRAccess = false;
        }
        if(this.MDIDisabled == false)
        {
            this.MDIAccess = false;
        }
        this.MDIAccessManual = false;
        this.SRRAccessManual = false;
        this.PSFAccessManual = false;
        this.orderRailCarAccessManual = false; //Added By Sivesh for B-360789
        this.MVFIAccessManual = false;
        this.coworkerApps =[];
        //initialize patron code 
        this.selectedItems =[];
        this.globalSelectedItems=[];
        //initialize station code
        this.stationSelectedItems=[];
        this.globalSelectedItemsStation=[];
        //initialize mdi station code
        this.mdiStationSelectedItems=[];
        this.globalSelectedItemsMDIStation=[];
        //initialize single patron code
        this.searchIcon='search';
        this.selectRecordName = "";
        this.selectRecordId = "";
        this.inputReadOnly = false;
        this.clearIconFlag = false;
        //initialize radio group options
        //this.patronCodeVisible=true;
        //this.optionsRadioGroup.value='';
        //Initial load of unique additional application list */START/*
        this.globalSelectedItemsSearchApplication=[];
        this.searchApplicationSelectedItems=[];
        fetchUser()
        .then(result =>{
            this.userFID = result.FederationIdentifier;
            retrieveAllApplicationRecords({fieldAPINames: this.searchApplicationfieldApiNames,
                        filterFieldAPIName: this.searchApplicationfilterFieldApiName,
                        userID: this.userFID
                        })
        .then(result=>{ 
            console.log('result'+result);
            this.searchApplicationitems = []; 
            this.valueSearchApplication = [];
            this.previoussearchApplicationSelectedItems = [];

            if(result.length>0){
                result.map(resElement=>{
                    this.searchApplicationitems = [...this.searchApplicationitems,{value:resElement.recordId, 
                                                label:resElement.recordName}];
                    this.globalSelectedItemsSearchApplication.map(element =>{
                        if(element.value == resElement.recordId){
                            this.valueSearchApplication.push(element.value);
                            this.previoussearchApplicationSelectedItems.push(element);                      
                        }
                    });
                });
               //remove apps from additional applicationlist when existing user have access on it 
                this.searchApplicationitems = this.searchApplicationitems.filter(val => !this.coworkerApps.includes(val));
                this.isDisplayMessageSearchApplication = false;
            }
            else{
                this.isDisplayMessageSearchApplication = true;
                this.searchApplicationSelectedItems=[];                     
            }
        })
        .catch(error=>{
            this.error = error;
            this.searchApplicationitems = undefined;
        })
        })
        .catch(error => {
            this.error = error;
        })
         
        //Initial load of unique additional application list */END/*
        /**
         * Get all cowerker apps when user enters cowkerId **STARTS**
         * */
        this.CoworkerMVFIAccess = false;
        this.coworkerMDIAccess = false;
        this.coworkerPSFAccess = false;
        this.coworkerSRBAccess = false;
        this.coworkerSRRAccess = false;
        this.coworkerorderRailcarsAccess = false;
        if(this.coworkerId.trim().length>0){
            //this method is used to get all apps which coworker have access
            isValidBNSFId({
                userID : this.coworkerId
            })
            .then(result =>{
                console.log('result length'+result.length);
                if(result.length == 0){
                         this.isDisplayAppErrorMessage = true;
                         this.isCoworkerIdUsed = false;
                         this.initializeCoworkerID();
                         
                    }
                else if(result.length == 1 && result[0].name__c =='Not valid Coworker Id'){
                    this.isDisplayAppErrorMessage = false;
                         this.isCoworkerIdUsed = true;
                         this.initializeCoworkerID();
                }
                //add apps to coworkerApps array to display on UI
                else{
                    this.coworkerApps = result;
                    this.isAppsAvailable = true;
                    this.isCoworkerIdUsed = true;
                    this.isDisplayInfoForSubmit = true;

                    let isDiffFound = false;
                    //Logic for enabling toggle buttons for apps
                    result.forEach(obj =>{
                        if(obj.name__c === 'Account Status' && this.MVFIDisabled == false){
                            this.MVFIAccess = true;
                            this.CoworkerMVFIAccess = true;
                            isDiffFound = true;
                        }
                        else if(obj.name__c === 'Intermodal Storage' && this.PSFDisabled == false){
                            this.PSFAccess = true;
                            this.coworkerPSFAccess = true;
                            isDiffFound = true;
                        }
                        else if(obj.name__c === 'Railcar Equipment Request' && this.orderRailcarsDisabled == false){
                            this.orderRailcarsAccess = true;
                            this.coworkerorderRailcarsAccess = true;
                            isDiffFound = true;
                        }
                        else if(obj.name__c === 'Shipping Instructions' && this.SRBDisabled == false){
                            this.SRBAccess = true;
                            this.coworkerSRBAccess = true;
                            isDiffFound = true;
                        }
                        else if(obj.name__c === 'Switch & Release' && this.SRRDisabled == false){
                            this.SRRAccess = true;
                            this.coworkerSRRAccess = true;
                            isDiffFound = true;
                        }
                        else if(obj.name__c === 'Customer Dwell Management Tool' && this.MDIDisabled == false){
                            this.MDIAccess = true;
                            this.coworkerMDIAccess = true;
                            isDiffFound = true;
                        }
                    })
                    if(!isDiffFound){
                        this.isPrimaryAppAccessSame = true;
                        this.isDisplayInfoForSubmit = false;
                    }
                    this.MVFIDisabled = true;
                    this.PSFDisabled = true;
                    this.orderRailcarsDisabled = true;
                    this.SRBDisabled = true;
                    this.SRRDisabled = true;
                    this.MDIDisabled = true;
                 }
            })
            .catch(error =>{
                console.log('Error: '+error);
                this.isDisplayBNSFErrorMessage = true;
                this.initializeCoworkerID();
            })
        }
        /**
         * Get all cowerker apps when user enters cowkerId **ENDS**
         * */
        
    }
   
    //Station__c mulitselect Logic
    onchangeSearchInputStation(event){
        this.LoadingTextStation = true;
        this.searchInputStation = event.target.value;
        if(this.searchInputStation.trim().length>0){
            retrieveRecords({objectName: this.stationObjectApiName,
                            fieldAPINames: this.stationfieldApiNames,
                            filterFieldAPIName: this.stationfilterFieldApiName,
                            strInput: this.searchInputStation
                            })
            .then(result=>{
                this.LoadingTextStation = false; 
                this.stationitems = []; 
                this.valueStation = [];
                this.previousStationSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        this.stationitems = [...this.stationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsStation.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueStation.push(element.value);
                                this.previousStationSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDialogDisplayStation = true; //display dialog
                    this.isDisplayMessageStation = false;
                }
                else{
                    this.isDialogDisplayStation = false;
                    this.isDisplayMessageStation = true;
                    this.stationSelectedItems=[];                    
                }
            })
            .catch(error=>{
                this.error = error;
                this.stationitems = undefined;
                this.isDialogDisplayStation = false;
            })
        }else{
            this.isDisplayMessageStation = false;
            this.LoadingTextStation = false;
            this.isDialogDisplayStation = false;
        }                
    }
    handleCheckboxChangeStation(event){
        let selectItemTemp = event.detail.value;
        console.log(' handleCheckboxChangeStation  value=', event.detail.value);        
        this.stationSelectedItems = [];
        selectItemTemp.map(p=>{            
            let arr = this.stationitems.find(element => element.value == p);
            if(arr != undefined){
                this.stationSelectedItems.push(arr);
            }  
        });   
        this.handleDoneClickStation();  
    }
    handleRemoveRecordStation(event){        
        const removeItem = event.target.dataset.item; 
        this.globalSelectedItemsStation = this.globalSelectedItemsStation.filter(item => item.value  != removeItem);
        const arrItems = this.globalSelectedItemsStation;
        this.initializeValuesStation();
        this.valueStation =[]; 
        const evtCustomEvent = new CustomEvent('remove', {   
            detail: {removeItem,arrItems}
            });
        this.stationSelectedItems=this.globalSelectedItemsStation;
        if(this.searchInputStation.trim().length>0){
            retrieveRecords({objectName: this.stationObjectApiName,
                            fieldAPINames: this.stationfieldApiNames,
                            filterFieldAPIName: this.stationfilterFieldApiName,
                            strInput: this.searchInputStation
                            })
            .then(result=>{
                this.LoadingTextStation = false; 
                this.stationitems = []; 
                this.valueStation = [];
                this.previousStationSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        this.stationitems = [...this.stationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsStation.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueStation.push(element.value);
                                this.previousStationSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDialogDisplayStation = true; //display dialog
                    this.isDisplayMessageStation = false;
                }
                else{
                    this.isDialogDisplayStation = false;
                    this.isDisplayMessageStation = true;
                    this.stationSelectedItems=[];                    
                }
            })
            .catch(error=>{
                this.error = error;
                this.stationitems = undefined;
                this.isDialogDisplayStation = false;
            })
        }
        this.dispatchEvent(evtCustomEvent);
    }

    handleDoneClickStation(event){
        this.previousStationSelectedItems.map(p=>{
            this.globalSelectedItemsStation = this.globalSelectedItemsStation.filter(item => item.value != p.value);
        });
        this.globalSelectedItemsStation.push(...this.stationSelectedItems);        
        const arrItems = this.globalSelectedItemsStation;
        this.previousStationSelectedItems = this.stationSelectedItems;
        this.initializeValuesStation();
        const evtCustomEvent = new CustomEvent('retrieve', { 
            detail: {arrItems}
            });
        this.dispatchEvent(evtCustomEvent);
    }
    initializeValuesStation(){      
        //this.isDialogDisplayStation = false;
    }
    

    //MDI Stations Logic
    onchangeSearchInputMDIStation(event){
        this.LoadingTextMDI = true;
        this.searchInputMDIStation = event.target.value;
        if(this.searchInputMDIStation.trim().length>0){
            retrieveRecords({objectName: this.mdiStationObjectApiName,
                            fieldAPINames: this.mdiStationfieldApiNames,
                            filterFieldAPIName: this.mdiStationfilterFieldApiName,
                            strInput: this.searchInputMDIStation
                            })
            .then(result=>{
                this.LoadingTextMDI = false; 
                this.mdiStationitems = []; 
                this.valueMDIStation = [];
                this.previousmdiStationSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        this.mdiStationitems = [...this.mdiStationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsMDIStation.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueMDIStation.push(element.value);
                                this.previousmdiStationSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDialogDisplayMDIStation = true; //display dialog
                    this.isDisplayMessageMDIStation = false;
                }
                else{
                    this.isDialogDisplayMDIStation = false;
                    this.isDisplayMessageMDIStation = true;
                    this.mdiStationSelectedItems=[];                     
                }
            })
            .catch(error=>{
                this.error = error;
                this.mdiStationitems = undefined;
                this.isDialogDisplayMDIStation = false;
            })
        }else{
            this.isDisplayMessageMDIStation = false;
            this.LoadingTextMDI = false;
            this.isDialogDisplayMDIStation = false;
        }                
    }
    handleCheckboxChangeMDIStation(event){
        let selectItemTemp = event.detail.value;
        console.log(' handleCheckboxChangeMDIStation  value=', event.detail.value);        
        this.mdiStationSelectedItems = [];
        selectItemTemp.map(p=>{            
            let arr = this.mdiStationitems.find(element => element.value == p);
            if(arr != undefined){
                this.mdiStationSelectedItems.push(arr);
            }  
        });     
        this.handleDoneClickMDIStation();
    }
    handleRemoveRecordMDIStation(event){        
        const removeItem = event.target.dataset.item; 
        this.globalSelectedItemsMDIStation = this.globalSelectedItemsMDIStation.filter(item => item.value  != removeItem);
        const arrItems = this.globalSelectedItemsMDIStation;
        this.initializeValuesMDIStation();
        this.valueMDIStation =[]; 
        const evtCustomEvent = new CustomEvent('remove', {   
            detail: {removeItem,arrItems}
            });
        this.mdiStationSelectedItems=this.globalSelectedItemsMDIStation;
        if(this.searchInputMDIStation.trim().length>0){
            retrieveRecords({objectName: this.mdiStationObjectApiName,
                            fieldAPINames: this.mdiStationfieldApiNames,
                            filterFieldAPIName: this.mdiStationfilterFieldApiName,
                            strInput: this.searchInputMDIStation
                            })
            .then(result=>{
                this.LoadingTextMDI = false; 
                this.mdiStationitems = []; 
                this.valueMDIStation = [];
                this.previousmdiStationSelectedItems = [];

                if(result.length>0){
                    result.map(resElement=>{
                        this.mdiStationitems = [...this.mdiStationitems,{value:resElement.recordId, 
                                                    label:resElement.recordName}];
                        this.globalSelectedItemsMDIStation.map(element =>{
                            if(element.value == resElement.recordId){
                                this.valueMDIStation.push(element.value);
                                this.previousmdiStationSelectedItems.push(element);                      
                            }
                        });
                    });
                    this.isDialogDisplayMDIStation = true; //display dialog
                    this.isDisplayMessageMDIStation = false;
                }
                else{
                    this.isDialogDisplayMDIStation = false;
                    this.isDisplayMessageMDIStation = true;
                    this.mdiStationSelectedItems=[];                     
                }
            })
            .catch(error=>{
                this.error = error;
                this.mdiStationitems = undefined;
                this.isDialogDisplayMDIStation = false;
            })
        }
        this.dispatchEvent(evtCustomEvent);
    }

    handleDoneClickMDIStation(event){
        this.previousmdiStationSelectedItems.map(p=>{
            this.globalSelectedItemsMDIStation = this.globalSelectedItemsMDIStation.filter(item => item.value != p.value);
        });
        this.globalSelectedItemsMDIStation.push(...this.mdiStationSelectedItems);        
        const arrItems = this.globalSelectedItemsMDIStation;
        this.previousmdiStationSelectedItems = this.mdiStationSelectedItems;
        this.initializeValuesMDIStation();
        const evtCustomEvent = new CustomEvent('retrieve', { 
            detail: {arrItems}
            });
        this.dispatchEvent(evtCustomEvent);
    }
    initializeValuesMDIStation(){        
        //this.isDialogDisplayMDIStation = false;
    }
    initializeCoworkerID(){
        this.coworkerId = '';
    }
    //Get all input fields values
    handleChange(event){
        if(event.target.dataset.id == 'coworkerId'){
            this.coworkerId = event.target.value;
        }
        else if(event.target.dataset.id == 'MVFIAccess'){
            this.MVFIAccess = event.target.checked;
            this.MVFIAccessManual = event.target.checked;
            this.CoworkerMVFIAccess = false;
            this.initializeCoworkerID();
        }
        else if(event.target.dataset.id == 'PSFAccess'){
            this.PSFAccess = event.target.checked;
            this.patronCodeVisible=true;
            this.checkRadioButton = false;
            this.PSFAccessManual = event.target.checked;
            this.coworkerPSFAccess=false;
            if(event.target.checked == false)
            {
                this.creditCard = false;
                this.BNSFCredit = false;
            }
            this.initializeCoworkerID();
        }
        else if(event.target.dataset.id == 'orderRailcarsAccess'){
            console.log('__event.target.dataset.id____'+event.target.dataset.id);
            this.orderRailcarsAccess = event.target.checked;
            this.railCarOthers = false; //sivesh - B-360789
            this.orderRailCarAccessManual = event.target.checked; //sivesh - B-360789
            this.initializeCoworkerID();
        }
        else if(event.target.dataset.id == 'SRBAccess'){
            this.SRBAccess = event.target.checked;
            console.log('value'+event.target.checked);
            console.log('access'+this.SRBAccess);
            this.initializeCoworkerID();
        }
        else if(event.target.dataset.id =='SRRAccess'){
            this.SRRAccess = event.target.checked;
            this.SRRAccessManual = event.target.checked;
            this.coworkerSRRAccess = false;
            this.initializeCoworkerID();
        }
        else if(event.target.dataset.id == 'MDIAccess'){
            this.MDIAccess = event.target.checked;
            this.MDIAccessManual = event.target.checked;
            this.coworkerMDIAccess = false;
            this.initializeCoworkerID();
        }
        else if(event.target.dataset.id == 'comments'){
            this.comments = event.target.value;
        }       
    }
    //creating Application Access Request record logic
    requestSubmit(event){
        console.log('selectRecordName'+this.selectRecordName);
        console.log('__this.orderRailCarAccessManual__'+this.orderRailCarAccessManual+'___this.orderRailcarsAccess__'+this.orderRailcarsAccess);
        //Check required fields
        if(this.MVFIAccess == true && this.CoworkerMVFIAccess == false && this.MVFIAccessManual == true &&(this.globalSelectedItems == null || this.globalSelectedItems == ''))
        {
            const event = new ShowToastEvent({
                title: 'Required Field',
                message: CR_UI_Patron1_Error,
            });
            this.dispatchEvent(event);
            return;
        }
        //Start - Added by Sivesh for B-360789
        else if(this.orderRailcarsAccess == true && this.orderRailCarAccessManual == true && (this.otherCarType == '' || this.otherCarType == null )){ // Aravind-D-63043: added this.orderRailCarAccessManual == true
            const event = new ShowToastEvent({
                title: 'Required Field',
                message: 'Please Fill the Mandatory Fields',
            });
            this.dispatchEvent(event);
            return;
        }
        else if(this.orderRailcarsAccess == true &&
            this.otherCarType == 'Other (please specify)' && this.orderRailCarAccessManual == true &&
             (this.otherTypeValue == '' || this.otherTypeValue == null)){ // Aravind-D-63043: added this.orderRailCarAccessManual == true
                const event = new ShowToastEvent({
                    title: 'Required Field',
                    message: 'Please Fill the Mandatory Fields',
                });
                this.dispatchEvent(event);
                return;
        }
        //End - Added by Sivesh for B-360789
        else if(this.PSFAccess == true && this.coworkerPSFAccess == false && this.PSFAccessManual == true && this.checkRadioButton == false)
        {
            const event = new ShowToastEvent({
                title: 'Required Field',
                message: CR_UI_PSF_Card_ERROR,
            });
            this.dispatchEvent(event);
            return;
        }
        else if(this.coworkerPSFAccess == false && this.PSFAccessManual == true && this.checkRadioButton == true && this.patronCodeVisible == false && (this.selectRecordName == null || this.selectRecordName ==''))
        {
            const event = new ShowToastEvent({
                title: 'Required Field',
                message: CR_UI_Patron2_Error,
            });
            this.dispatchEvent(event);
            return;
        }
        else if(this.SRRAccess == true && this.coworkerSRRAccess == false && this.SRRAccessManual == true && this.globalSelectedItemsStation == '')
        {
            const event = new ShowToastEvent({
                title: 'Required Field',
                message: CR_UI_SR_Station_Error,
            });
            this.dispatchEvent(event);
            return;
        }
        else if(this.MDIAccess == true && this.coworkerMDIAccess == false && this.MDIAccessManual == true && this.globalSelectedItemsMDIStation == '')
        {
            const event = new ShowToastEvent({
                title: 'Required Field',
                message: CR_UI_MDI_Station_Error,
            });
            this.dispatchEvent(event);
            return;
        }
        else if(this.isAdditionalApplicationUsed == true)
        {
            const event = new ShowToastEvent({
                title: 'Error',
                message: CR_UI_Additional_App_Error,
            });
            this.dispatchEvent(event);
            return;
        }
        console.log('global'+this.globalSelectedItemsSearchApplication.length);
        if(this.isCoworkerIdUsed == false && this.globalSelectedItemsSearchApplication.length==0)
        {
            if((this.MVFIAccess == false || this.CoworkerMVFIAccess == true) && (this.PSFAccess == false || this.coworkerPSFAccess == true) && (this.orderRailcarsAccess == false || this.coworkerorderRailcarsAccess == true) && (this.SRBAccess == false || this.coworkerSRBAccess == true) && (this.SRRAccess == false || this.coworkerSRRAccess == true) && (this.MDIAccess == false || this.coworkerMDIAccess))
            {
                const event = new ShowToastEvent({
                    title: 'Error',
                    message: CR_UI_Empty_Error,
                });
                this.dispatchEvent(event);
                return;
            }
        }
        if(this.isCoworkerIdUsed == true && this.globalSelectedItemsSearchApplication.length==0 && this.MVFIAccess == false && this.PSFAccess == false && this.orderRailcarsAccess == false && this.SRBAccess == false && this.SRRAccess == false && this.MDIAccess == false)
        {
            const event = new ShowToastEvent({
                title: 'Error',
                message: CR_UI_Empty_Error,
            });
            this.dispatchEvent(event);
            return;
        }
        this.isLoading = true;
        this.MVFIpatronVal = '';
        this.SRRStationVal ='';
        this.MIDStationVal ='';
        this.additionalApplicationVal ='';
        this.PSFPatroncode = this.selectRecordName;
        var i=1;var j=1;var k=1; var l=1;
    console.log('************');
    //Get patroncode values from UI in MVFIpatronVal
       this.globalSelectedItems.forEach(obj => {
        if(this.globalSelectedItems.length == i){
            this.MVFIpatronVal += obj.label;
        }
        else{
            this.MVFIpatronVal += obj.label+',';
        }
        i++;
       });
       //Get station values from UI in SRRStationVal
      this.globalSelectedItemsStation.forEach(obj => {
        if(this.globalSelectedItemsStation.length == j){
            this.SRRStationVal += obj.label;
        }
        else{
            this.SRRStationVal += obj.label+',';
        }
        j++;
       });
     //Get station values from UI in MDItationVal
      this.globalSelectedItemsMDIStation.forEach(obj => {
        if(this.globalSelectedItemsMDIStation.length == k){
            this.MIDStationVal += obj.label;
        }
        else{
            this.MIDStationVal += obj.label+',';
        }  
        k++;
       });
       
      this.globalSelectedItemsSearchApplication.forEach(obj =>{
          if(this.globalSelectedItemsSearchApplication.length == l){
              this.additionalApplicationVal +=obj.label;
          }
          else{
            this.additionalApplicationVal +=obj.label+',';
          }
          l++;
      }) 
     //Set main app toggle button value false which user has access
     this.existingUserApps.forEach(obj =>{
        if(obj.name__c === 'Account Status'){
            this.MVFIAccess = false;
        }
        else if(obj.name__c === 'Intermodal Storage'){
            this.PSFAccess = false;
        }
        else if(obj.name__c === 'Railcar Equipment Request'){
            this.orderRailcarsAccess = false;
        }
        else if(obj.name__c === 'Shipping Instructions'){
            this.SRBAccess = false;   
        }
        else if(obj.name__c === 'Switch & Release'){
            this.SRRAccess = false;
        }
        else if(obj.name__c === 'Customer Dwell Management Tool'){
            this.MDIAccess = false;
        }
    })   
    console.log('SRRStationVal'+this.creditCard);
    console.log(' this.BNSFCredit '+ this.BNSFCredit);
    console.log('this.PSFPatroncode'+this.PSFPatroncode);
    createApplicationAccessRequest({
           coworkerId : this.coworkerId,
           MVFIAccess : this.MVFIAccess,
           MVFIPatronCode : this.MVFIpatronVal,
           PSFPatronCode : this.PSFPatroncode,
           PSFAccess : this.PSFAccess,
           creditCard : this.creditCard,
           BNSFCreditCard : this.BNSFCredit,
           ORAccess : this.orderRailcarsAccess,
           SRBAccess : this.SRBAccess,
           SRRAccess : this.SRRAccess,
           MDIAccess : this.MDIAccess,
           SRRStation : this.SRRStationVal,
           MIDStation : this.MIDStationVal,
           additionalAccess : this.additionalApplicationVal,
           comments : this.comments,
           strRailCarType : this.otherCarType,
           strRailCarOthers : this.otherTypeValue
        })
        .then(result =>{
            if(result === true)
            {
                this.isLoading = false;
                console.log('result1'+JSON.stringify(result));
                this.redirect = true;
                window.scrollTo(0, 0);
            }else{
                console.log('Hello');
                fetchCurrentUserContact()
                .then(result =>{
                    if(result === true){
                        console.log('Am in');
                        this.isLoading = false;
                        const event = new ShowToastEvent({
                            title: 'Error',
                            message: 'Oops! It looks like a request for access is still pending approval. Please allow 24 - 48 hours for access approval.',
                            variant:'Error'
                        }); 
                        this.dispatchEvent(event); 
                    }
                    else{
                    this.isLoading = false;
                    const event = new ShowToastEvent({
                        title: 'Error',
                        message: 'Contact is not found. Please contact to your System Administrator',
                        variant:'Error'
                    }); 
                    this.dispatchEvent(event);
                }
                })
               
            }
            
        })
        .catch(error =>{
            console.log('error'+error);
            this.isLoading = false;
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'This Page is having errors. Please contact your System Administrator',
                variant:'Error'
            });
            this.dispatchEvent(event);
              
        })
    }
    cancel(event){
        console.log('in cancel');
        this[NavigationMixin.Navigate]({
            type: "comm__namedPage",
            attributes: {
                name: 'Home'
            }
        });
    }
    
    handleDynamicSelect(event) {
        let payload = event.detail.payload;
        this.coworkerId = payload.value;
        this.handleCoworkerApps(null);
    }

    //Added by Saim start
    //retrieves the value stored in session storage which is set at x7sAllwebToolView and x7sWebtoolRequestAccess. The value is set and stored when a customer clicks on request access for ONLY the primary webtools
    //this method retrieves the storage value and enables the toggles based on which webtool was selected
    toggleSelectedWebTool(){
        this.clickedWebtool;
        console.log('Session Storage value: ' + window.sessionStorage.getItem('selectedWebtool'));
        this.clickedWebtool = window.sessionStorage.getItem('selectedWebtool');
        console.log('____this.clickedWebtool__'+this.clickedWebtool+'____this.orderRailcarsDisabled__'+this.orderRailcarsDisabled);
        if(this.clickedWebtool === 'Account Status' && this.MVFIDisabled == false){
            this.MVFIAccess = true;
            this.MVFIAccessManual = true;
            this.showError = true;
        }
        if(this.clickedWebtool === 'Intermodal Storage' && this.PSFDisabled == false){
            this.PSFAccess = true;
            this.PSFAccessManual = true;
        }
        if(this.clickedWebtool === 'Railcar Equipment Request' && this.orderRailcarsDisabled == false){
            this.orderRailcarsAccess = true;
            this.orderRailCarAccessManual = true;// Added By Sivesh for B-360789
        }
        if(this.clickedWebtool === 'Railcar Management Tool' && this.SRRDisabled == false){
            this.SRRAccess = true;
            this.SRRAccessManual = true;
        }
        if(this.clickedWebtool === 'Switch & Release' && this.SRRDisabled == false){
            this.SRRAccess = true;
            this.SRRAccessManual = true;
        }
        if(this.clickedWebtool === 'Shipping Instructions' && this.SRBDisabled == false){
            this.SRBAccess = true;
        }
        if(this.clickedWebtool === 'Shipping Instructions Hazardous' && this.SRBDisabled == false){
            this.SRBAccess = true;
        }
        if(this.clickedWebtool === 'Customer Dwell Management Tool' && this.MDIDisabled == false){
            this.MDIAccess = true;
            this.MDIAccessManual = true;
        }
    }
     //Added by Saim end
}
