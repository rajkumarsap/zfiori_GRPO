sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "../util/MessageController",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (
    BaseController,
    formatter,
    JSONModel,
    Device,
    Filter,
    FilterOperator,
    Sorter,
    MessageController,
    MessageBox,
    Fragment
) {
    "use strict";
    return BaseController.extend("com.wel.goodsreceipt.controller.Master", {
        formatter: formatter,

        onInit: function () {
            // console.log("Master controller || onInit ");

            let oList = this.byId("id_list");
            //let iOriginalBusyDelay = oList.getBusyIndicatorDelay();
            this._oList = oList;
            this._bNavigatingFromDetailPageToMasterPage = false;

            this._oListFilterState = {
                aFilter: [],
                aSearch: [],
                aSort: []
            };
            this._sPurchaseGroupInputFieldValue2;
            this._dateRange = [];
            this._bothFieldsBlank = false;
            this._gPurchaseGrp = null;
            this._gSDate = null;
            this._gEDate = null;
            this._gGrStatus = null;
            this.pgrpItem = "";
            this.PurGroup = null;
            this.PurGroupDesc = "";
            this._gSearchPoValue = null;
            this.bIsthistheFirstTimeUpdateStarted = null;

            // this._bIsPageRefresherd = true;

            this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
            this.getRouter().attachBypassed(this._onBypassed, this);

            let oViewModel = this._createViewModel();
            this.setModel(oViewModel, "masterView");

        },

        _onMasterMatched: async function () {
            this.bIsthistheFirstTimeUpdateStarted = true;
            //console.log("Master Controller || onRouteMatched function ");
            var _self = this;
            //check if routing from detail page
            //console.log("navigationFromDetailPage is true? ", this._bNavigatingFromDetailPageToMasterPage);
            if (!this._bNavigatingFromDetailPageToMasterPage) {
                //console.log("this is first time in master");
                sap.ui.core.BusyIndicator.show();
                try {
                    const sGoodsReceiptSettingPath = '/GoodsReceiptSettingSet';

                    const dataForPurchaseGroup = await this.getDataFromServer(sGoodsReceiptSettingPath);
                    // console.log(dataForPurchaseGroup);

                    const sPath = "/POSet";
                    const urlParam = {
                        "$skip": "0",
                        "$top": "20"
                    };
                    const aFilter = [];
                    let oPoSetData = {};

                    if (dataForPurchaseGroup.results.length && dataForPurchaseGroup.results[0].PurGroup) {
                        this.PurGroup = dataForPurchaseGroup.results[0].PurGroup;
                        aFilter.push(new Filter("PurGroup", FilterOperator.EQ, this.PurGroup));

                        oPoSetData = await this.getDataFromServer(sPath, urlParam, aFilter);
                    } else {
                        oPoSetData = await this.getDataFromServer(sPath, urlParam, aFilter); // no filter sent if purGroup is not present.
                    }
                    sap.ui.core.BusyIndicator.hide();

                    // Below logic is used to show RelIndDesc in the listitem.
                    // If the PO is not approved then it will not show the GrStatus.
                    oPoSetData.results.forEach(POItem => {
                        if (POItem.RelIndDesc === "In Approval process" || POItem.RelIndDesc === "") {
                            POItem.visibilityFlag = false;
                        } else {
                            POItem.visibilityFlag = true;
                        }
                    });

                    var jsonPOListSet = new JSONModel(oPoSetData);
                    _self.getView().byId("id_list").setModel(jsonPOListSet, "PoSetJson");
                    
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide();
                    console.log("ERROR ||POSet", error);
                }
            } else {
                //console.log("this is second time in master coming from Detailpage");
                //console.log("Master || Coming from Detail Page || Restoring the sorting state");
                //restore the state of the list. sorting and filter.
                let oPuschaseOrderTable = this.getView().byId("id_list");
                let aSorters = this._oListFilterState.aSort;
                var oBinding = oPuschaseOrderTable.getBinding("items");
                oBinding.sort(aSorters);
                this.getModel("appView").setProperty("/layout", "OneColumn");
                oPuschaseOrderTable.removeSelections(true);
            }

            this._getReceiptStatusValueHelp(); // call this for receipt status in the filter dialog.
        },

        onUpdateFinished: function (oEvent) {
            // update the master list object counter after new data is loaded
            this._updateListItemCount(oEvent.getParameter("total"));
        },

        _updateListItemCount: function (iTotalItems) {
            var sTitle;
            // only update the counter if the length is final
            if (this._oList.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
                this.getModel("masterView").setProperty("/title", sTitle);
            }
        },


        onSearchPO: async function (oEvent) {
            let sSearchQuery = oEvent.getParameter("query");

            let aFilters, oFilter, oBinding;

            if (oEvent.getParameter('clearButtonPressed')) {
                this._gSearchPoValue = ""; // reset search value if cancel button is pressed in search bar
            }

            if (sSearchQuery && sSearchQuery.length > 0) {
                // console.log("search query is from onSearch ", sSearchQuery);

                // add filters for search
                aFilters = [];
                if (sSearchQuery && sSearchQuery.length > 0) {
                    this._gSearchPoValue = sSearchQuery; //save search value in global variable, for future use, to load more data.

                    aFilters.push(new Filter("PoNumber", FilterOperator.EQ, sSearchQuery));
                    // aFilters.push(new Filter("CreatedBy", FilterOperator.EQ, sSearchQuery));
                    // aFilters.push(new Filter("VendorName", FilterOperator.EQ, sSearchQuery));
                    oFilter = new Filter({ filters: aFilters, and: false });  // OR filter
                } else {
                    oFilter = null;
                }
            }
            /** THIS LOGIC IS FOR OFFLINE FILTER */
            // Update list binding
            // oBinding = oEvent.getSource().getParent().getParent().getBinding("items");
            // oBinding.filter(oFilter, "Application");


            /** BELOW CODE IS FOR ONLINE SEARCH */
            const sPath = '/POSet';
            const urlParam = {
                "$skip": "0",
                "$top": "20"
            };
            sap.ui.core.BusyIndicator.show();
            try {
                const data = await this.getDataFromServer(sPath, urlParam, aFilters);

                if (data.results.length) {
                    // this.PurGroup = data.results[0].PurGroup;
                    // this.PurGroupDesc = data.results[0].PurGroupDesc;
                    sap.ui.core.BusyIndicator.hide();

                    data.results.forEach(POItem => {
                        if (POItem.RelIndDesc === "In Approval process" || POItem.RelIndDesc === "") {
                            POItem.visibilityFlag = false;
                        } else {
                            POItem.visibilityFlag = true;
                        }
                    });

                    const jsonPOListSet1 = new JSONModel(data);
                    this.getView().byId("id_list").setModel(jsonPOListSet1, "PoSetJson");
                } else {
                    sap.ui.core.BusyIndicator.hide();
                    const jsonPOListSet2 = new JSONModel(data);
                    this.getView().byId("id_list").setModel(jsonPOListSet2, "PoSetJson");
                }

            } catch (error) {
                sap.ui.core.BusyIndicator.hide();
                console.log('FOUND ERROR', error);
            }
        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         */
        onRefresh: function () {
            this._oList.getBinding("items").refresh();
        },

        /**
         * Event Handler to open Sorting Dialog.
         */
        onOpenSortingDialogForPO: function () {
            // console.log("Master Controller || Sort PO Function");
            if (!this._oViewSortingDialog) {
                this._oViewSortingDialog = sap.ui.xmlfragment("com.wel.goodsreceipt.fragments.ViewSortingDialog", this);
                this.getView().addDependent(this._oViewSortingDialog);
                // forward compact/cozy style into Dialog
                this._oViewSortingDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            }
            const sDialogTab = "sort";
            this._oViewSortingDialog.open(sDialogTab);
        },

        onConfirmButtonPressInSortingDialog: function (oEvent) {
            this._applySortGroup(oEvent);
        },

        /**
         * Apply the chosen sorter to the master list
         * @private
         */
        _applySortGroup: function (oEvent) {
            let oView = this.getView();
            let sPath;
            let oPuschaseOrderTable = oView.byId("id_list");
            if (oEvent) {
                sPath = oEvent.getParameter("sortItem").getKey();
                //console.log("sorting based on ", sPath);
            }
            var oBinding = oPuschaseOrderTable.getBinding("items");
            var aSorters = [];

            if (oEvent) {
                var bDescending = oEvent.getParameters("sortItem").sortDescending;
            }

            let oNewSorter = new Sorter(sPath, bDescending);

            this._oListFilterState.aSort = [];
            this._oListFilterState.aSort.push(oNewSorter);
            //console.log("sorter array ", this._oListFilterState.aSort);

            aSorters.push(oNewSorter);
            oBinding.sort(aSorters);
        },

        //********************************* filter group start *********************************************************** */

        _getReceiptStatusValueHelp: async function () {
            try {
                const sPath = "/GoodsReceiptStatusSet";
                const data = await this.getDataFromServer(sPath);
                //model for receipt status.
                let getReceiptStatusModel = new JSONModel(data);
                this.setModel(getReceiptStatusModel, "getReceiptStatusModelName");

                const sPath1 = "/PurchasingGroupSet";
                const data1 = await this.getDataFromServer(sPath1);
                // model purGroup
                let oPurchasingGroupSet = new JSONModel(data1);
                this.setModel(oPurchasingGroupSet, "oPurchasingGroupJsonSet");
            }
            catch (error) {
                console.error("something went wrong while getting receiptstauts", error);
            }
        },


        onOpenPOSelectDialog: async function () {
            this.onPOGroupFilterOpenDialog().open();

            // after opening the dialog, if default purchase group exists set that otherwise set the preselected groups or keep it blank
            const oPurchaseGroupControlRef = sap.ui.getCore().byId('id_purchaseGroupMultiCombobox_Field');
            const aSelectedItems = oPurchaseGroupControlRef.getSelectedItems();
            if (aSelectedItems.length === 0) {
                oPurchaseGroupControlRef.setSelectedKeys(this.PurGroup);
            }
        },

        onPOGroupFilterOpenDialog: function () {

            // console.log("Master Controller ||FILTER Function");
            if (!this._oFilterDialog) {
                this._oFilterDialog = sap.ui.xmlfragment("com.wel.goodsreceipt.fragments.PurchaseOrderSettingDialog", this);
                this.getView().addDependent(this._oFilterDialog);
                // forward compact/cozy style into Dialog
                this._oFilterDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            }
            sap.ui.getCore().byId("id_dts_range").setMaxDate(new Date()); // sets max data to the current day.
            // this._oFilterDialog.open();

            return this._oFilterDialog;
        },



        onPurchaseGroupFilterOkPress: async function (oEvent) {
            let aFilters = [];

            const oDialog = oEvent.getSource().getParent(); //parent Dialog.
            const oDialogAggregations = oDialog.getContent()[0].getAggregation('items');

            // index 0 purchaseGroup Hbox > PurchaseGroup.
            const oPurchaseGroupHboxRef = oDialogAggregations[0];
            const oPurGroupComboboxFieldControlRef = oPurchaseGroupHboxRef.getAggregation('items')[1];
            const aSelectedKeys = oPurGroupComboboxFieldControlRef.getProperty('selectedKeys');

            aSelectedKeys.forEach(PurGroup => {
                aFilters.push(new Filter("PurGroup", FilterOperator.EQ, PurGroup));
            });

            // index 1 DateRange Hbox > DateRange.
            const oDateRangeHboxRef = oDialogAggregations[1];
            const oDateRangeControlRef = oDateRangeHboxRef.getAggregation('items')[1];

            // get date range value.
            const dateInstance = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
            this._dateRange = [];
            if (oDateRangeControlRef.getValue()) {

                const sFromDate = oDateRangeControlRef.getFrom();
                const sToDate = oDateRangeControlRef.getTo();

                // NEWZEALAND TIME FORMAT ADDING 12 TO TIMESTAMP.
                const sFormatedFromDate = dateInstance.format(sFromDate) + "T12:00:00";
                const sFormatedToDate = dateInstance.format(sToDate) + "T12:00:00";

                aFilters.push(new Filter("FromDate", FilterOperator.EQ, sFormatedFromDate));
                aFilters.push(new Filter("ToDate", FilterOperator.EQ, sFormatedToDate));
            }

            // index 2 Receipt Status Hbox > Vbox > combobox.
            const oReceiptStatusHboxRef = oDialogAggregations[2];
            const oReceiptStatusControlRef = oReceiptStatusHboxRef.getAggregation('items')[1];
            const oReceiptStatusComboBoxRef = oReceiptStatusControlRef.getAggregation('items')[0];

            // get combobox value.
            const sGrStatus = oReceiptStatusComboBoxRef.getSelectedKey();
            if (sGrStatus) {
                aFilters.push(new Filter("GrStatus", FilterOperator.EQ, sGrStatus));
            }

            this._oListFilterState.aFilter = aFilters;
            const dataNotFoundMessage = this.getResourceBundle().getText("noDataFound");
            try {
                const sPath = "/POSet";
                const urlParam = {
                    "$skip": `0`,
                    "$top": `20`
                };
                const data = await this.getDataFromServer(sPath, urlParam, aFilters);

                sap.ui.core.BusyIndicator.hide();

                if (data.results.length === 0) {
                    MessageBox.error(dataNotFoundMessage);
                    var ModelItems = new JSONModel(data);
                    this.getView().byId("id_list").setModel(ModelItems, "PoSetJson");
                    this.getView().byId("id_list").getModel("PoSetJson").refresh();
                    this.getView().byId("searchField").setValue("");
                    this._gSearchPoValue = "";
                    this.onPOGroupFilterOpenDialog().close();
                    this.getModel("appView").setProperty("/layout", "OneColumn");
                } else {
                    var jsonPOListSet = new JSONModel(data);
                    this.getView().byId("id_list").setModel(jsonPOListSet, "PoSetJson");
                    this.getView().byId("searchField").setValue("");
                    this._gSearchPoValue = "";
                    this.onPOGroupFilterOpenDialog().close();
                    this.getModel("appView").setProperty("/layout", "OneColumn");
                }
            } catch (error) {
                console.log(error);
                sap.ui.core.BusyIndicator.hide();
                var bCompact = !!_self.getView().$().closest(".sapUiSizeCompact").length;
                (new MessageController()).handle(response, bCompact);
            }

        },


        onPurchaseGroupCancelPress: function () {
            if (sap.ui.getCore().byId("id_dts_range").getValue()) {
                this._dateRange = [];
                this._dateRange.push(sap.ui.getCore().byId("id_dts_range").getFrom());
                this._dateRange.push(sap.ui.getCore().byId("id_dts_range").getTo());
            }
            this.onPOGroupFilterOpenDialog().close();
        },

        onPurchaseGroupResetPress: function () {
            sap.ui.getCore().byId("id_purchaseGroupMultiCombobox_Field").setSelectedKeys("");
            sap.ui.getCore().byId("id_dts_range").setValue("");
            sap.ui.getCore().byId("id_purchaseGroupMultiCombobox_Field").setSelectedKeys(this.PurGroup);
            sap.ui.getCore().byId("idReceiptStatus_combobox").setSelectedKey("");
            sap.ui.getCore().byId("idReceiptStatus_combobox").setValue("");

            this._gGrStatus = null; //resets the global variables.
            this._gEDate = null;
            this._gSDate = null;
        },


        //********************************* filter group end *********************************************************** */

        onPOListItemSelected: function (oEvent) {
            // console.log("Po Item is selected");
            let oList = oEvent.getSource();
            let bSelected = oEvent.getParameter("selected");

            // skip navigation when deselecting an item in multi selection mode
            if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
                // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
                this._navigateToDetailPage(oEvent.getParameter("listItem") || oEvent.getSource());
            }
        },

        _navigateToDetailPage: function (oItem) {
            //  console.log("master to || navigateToDeailPage || list selected");
            var bReplace = !Device.system.phone;

            // set the layout property of FCL control to show two columns
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            let iPoNumber = oItem.getProperty("number");

            //console.log("Master || navigating to Detail Page");
            this.getRouter().navTo("object", {
                PONumber: iPoNumber
            }, bReplace);
            // console.log(bReplace);
            this._bNavigatingFromDetailPageToMasterPage = true;
        },

        _onBypassed: function () {
            this._oList.removeSelections(true);
        },

        _createViewModel: function () {
            return new JSONModel({
                osFilterBarVisible: false,
                filterBarLabel: "",
                delay: 0,
                title: this.getResourceBundle().getText("masterTitleCount", [0]),
                noDataText: this.getResourceBundle().getText("masterListNoDataText"),
                sortBy: "PONumber",
                descending: 'true',
                groupBy: "None"
            });
        },

        onUpdateStarted: function (oEvent) {
            // console.log('I AM IN onUpdateStarted EVENT');

            if (this.bIsthistheFirstTimeUpdateStarted === true) {
                // console.log('first time update has started.');
                this.bIsthistheFirstTimeUpdateStarted = false;
                // do nothing here.
            } else {
                // console.log("NOT THE FIRST TIME UPDATE STARTED.");
                this._loadMoreData(oEvent);
                this.bIsthistheFirstTimeUpdateStarted = true;
            }
        },

        _loadMoreData: async function (oEvent) {
            // console.log('I AM IN _LOADMOREDATA FUNCTION');
            let oPoSetModel = oEvent.getSource().getModel('PoSetJson');
            let oExistingData = oPoSetModel.getProperty("/results");

            const oExistingDataLength = oExistingData.length;
            const sSkip = oExistingDataLength;
            const sTop = 100;

            // sap.ui.core.BusyIndicator.show();

            try {
                const sPath = "/POSet";
                const urlParam = {
                    "$skip": `${sSkip}`,
                    "$top": `${sTop}`
                };
                // get global filter 
                const aFilter = this._oListFilterState.aFilter;

                // This is for search value filter.
                if (this._gSearchPoValue) {
                    aFilter.push(new Filter("PoNumber", FilterOperator.EQ, this._gSearchPoValue));
                }

                const data = await this.getDataFromServer(sPath, urlParam, aFilter); // es6 destructuring syntax.


                oExistingData = oExistingData.concat(data.results);
                oPoSetModel.setProperty("/results", oExistingData);
                data.results.forEach(POItem => {
                    if (POItem.RelIndDesc === "In Approval process" || POItem.RelIndDesc === "") {
                        POItem.visibilityFlag = false;
                    } else {
                        POItem.visibilityFlag = true;
                    }
                });


            } catch (error) {
                sap.ui.core.BusyIndicator.hide();
                console.log("ERROR ||POSet", error);
            }
        }
    });
});