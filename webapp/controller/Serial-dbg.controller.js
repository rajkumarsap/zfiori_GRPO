sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (
    BaseController,
    JSONModel
) {
    "use strict";

    return BaseController.extend("com.wel.goodsreceipt.controller.Serial", {

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            debugger;
            console.log("line here ");
            //console.log("serial Controllers || OnInit");
            this._isSmartMeter = null;
            this._serialPostingQuantity = null;
            this.getRouter().getRoute("serial").attachPatternMatched(this._onObjectSerialMatched, this);
        },

        _onObjectSerialMatched: function (oEvent) {
            //console.log("Serial Controllers || OnObjectMatched");
            this.PONumber = oEvent.getParameter("arguments").PONumber;
            this.ItemNo = oEvent.getParameter("arguments").Itemno;

            this._setupModelForSerial();
        },

        _setupModelForSerial: function () {
            let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
            let aCurrentItemsInTable = oGlobalPoItemModel.getProperty("/results");

            let currentItemsInTable = aCurrentItemsInTable.filter((item) => {
                return item.Itemno === this.ItemNo;
            });
            this._isSmartMeter = currentItemsInTable[0].IsSmartmeter;


            let nRowCountToConstructForSerial = parseInt(currentItemsInTable[0].Postingquantity);
            this._serialPostingQuantity = nRowCountToConstructForSerial;
            let aNewCopyofItemsInTable = [];

            let aProxyItemsArray = [];

            currentItemsInTable.forEach((item) => {
                let oItemEntity = {};
                oItemEntity.Itemno = item.Itemno;
                oItemEntity.SubItemno = item.SubItemno;
                oItemEntity.Serialno = item.Serialno;
                oItemEntity.Issplit = item.Issplit;
                oItemEntity.PoNumber = item.PoNumber;
                oItemEntity.Postingquantity = item.Postingquantity;
                oItemEntity.ItemType = item.ItemType;
                let newObject = JSON.parse(JSON.stringify(oItemEntity));
                aNewCopyofItemsInTable.push(newObject);
            });
            if (!this._isSmartMeter) {
                if (aNewCopyofItemsInTable.length === 1) {
                    aProxyItemsArray = this.constructNewRows(nRowCountToConstructForSerial, aNewCopyofItemsInTable);
                } else {
                    //all subitems with serial type
                    let aArrayWithSubItemsOfSerialType = aNewCopyofItemsInTable.filter((item) => {
                        return (parseInt(item.SubItemno) > 0 && item.Itemno === this.ItemNo);
                    });
                    aProxyItemsArray = [...aArrayWithSubItemsOfSerialType];
                }

                // if (aProxyItemsArray.length !== nRowCountToConstructForSerial) {
                //     aProxyItemsArray = [];
                //     aProxyItemsArray = this.constructNewRows(nRowCountToConstructForSerial, aNewCopyofItemsInTable);
                // }

                let oTable = this.getView().byId("id_serial_table");
                let jsonModel = new JSONModel({ results: aProxyItemsArray });
                oTable.setModel(jsonModel, "serialJsonModel");
            } else {
                this._createSmartMeterSerialModel(aNewCopyofItemsInTable)
                this.getModel("oSmartMeterSerialModel").setProperty("/SerialStart", currentItemsInTable[0].SerialStart);
                this.getModel("oSmartMeterSerialModel").setProperty("/SerialEnd", currentItemsInTable[0].SerialEnd);
            }
            //set the description in table header & material number
            this.setHeaderData(currentItemsInTable);
        },

        constructNewRows: function (nRowCountToConstructForSerial, aCurrentItemsInTable) {
            let aProxyItems = [];
            for (let index = 1; index <= nRowCountToConstructForSerial; index++) {
                let oItemEntity = {};
                oItemEntity.Itemno = aCurrentItemsInTable[0].Itemno;
                oItemEntity.SubItemno = index.toString();
                oItemEntity.Serialno = "";
                oItemEntity.Issplit = aCurrentItemsInTable[0].Issplit;
                oItemEntity.PoNumber = aCurrentItemsInTable[0].PoNumber;
                oItemEntity.Postingquantity = "1";
                oItemEntity.Serialno = aCurrentItemsInTable[0].Serialno;
                oItemEntity.ItemType = aCurrentItemsInTable[0].ItemType;
                let newObject = JSON.parse(JSON.stringify(oItemEntity));
                aProxyItems.push(newObject);
            }
            return aProxyItems;
        },

        setHeaderData: function (aCurrentItemsInTable) {
            this.byId("id_serial_text_for_Materialno").setText(aCurrentItemsInTable[0].Materialno);
            this.byId("id_serial_text_for_ShortText").setText(aCurrentItemsInTable[0].ShortText);
            this.byId("idSmartVBox").setVisible(this._isSmartMeter);
            this.byId("id_serial_table").setVisible(!this._isSmartMeter);
        },

        onCloseDetailPress: function () {
            this.enableInputFieldsInDetailPage();
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false);
            this.getRouter().navTo("object", {
                PONumber: this.PONumber
            }, true);
        },

        onSerialSaveButtonPress: function (oEvent) {
            debugger
            //get the  global model
            let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
            let data = oGlobalPoItemModel.getProperty("/results");
            let updatedData = [];
            let bIsSerialFieldEmpty = null;
            let aUpdatedSerialItems=[];
            //get the local model
            if (!this._isSmartMeter) {
                let oSerialTableModel = this.getView().byId("id_serial_table").getModel("serialJsonModel");
                aUpdatedSerialItems = oSerialTableModel.getProperty("/results")
                bIsSerialFieldEmpty = this.highlightEmpltyFields(aUpdatedSerialItems);
            } else {
                bIsSerialFieldEmpty = this._checkSmartmeterSerailEmpty();
                
            }
            if (bIsSerialFieldEmpty === true) {
                this.displayMessage("Warning", this.getResourceBundle().getText("SerialFieldCannotBeEmpty"))
            } else {
                //enable input fields in DetailPage.
                this.enableInputFieldsInDetailPage();

                data.forEach((item) => {
                    // item.isInputFieldEnabled = true;
                    if (item.Itemno === this.ItemNo && item.SubItemno > 0) {
                        // do nothing.
                        // console.log("itemno", this.ItemNo + " matched and subitem no > 0", item);
                    } else {
                        //console.log("updated item in globaldata array is ", item);
                        if (item.Itemno === this.ItemNo && parseInt(item.SubItemno) === 0) {
                            //1. update the issplit to true
                            item.Issplit = true;
                            // item.showColor = "GREEN";
                            item.ButtonType = "Default";
                        }
                        updatedData.push(item);
                    }
                });

                debugger
                if (!this._isSmartMeter) {
                    console.log("new data is with only the original header items ", data);
                    if (aUpdatedSerialItems.length > 0) {
                        aUpdatedSerialItems.forEach((item) => updatedData.push(item));
                    }
                } else {
                    const oSmartmeterSerialItems = this.getModel("oSmartMeterSerialModel").getProperty("/");
                    const serialStart = oSmartmeterSerialItems.SerialStart;
                    const serialEnd = oSmartmeterSerialItems.SerialEnd;
                    
                    updatedData.forEach(data => {
                        if(this.ItemNo == data.Itemno)
                        {
                            const aParts = this.parseScanValue(serialStart);                            
                            data.SerialStart = serialStart;
                            data.SerialEnd = serialEnd;
                            data.SerialPrefix = aParts[0];
                            data.SerialSuffix = aParts[2];
                            data.SerialStartCntr = Number(aParts[1]);
                            data.Issplit = false;
                        }
                    })
                    //smart meter serial range processing from backend
                    // const items = this._constructRowsForSmartmeterSerial();
                    // items.forEach((item) => updatedData.push(item));
                    console.log(updatedData);

                }
                oGlobalPoItemModel.setProperty("/results", updatedData);
                console.log(oGlobalPoItemModel);
                this.onCloseDetailPress(); //close the third column
            }
        },

        _checkSmartmeterSerailEmpty: function () {
            const oSmartmeterSerialItems = this.getModel("oSmartMeterSerialModel").getProperty("/");
                    const serialStart = oSmartmeterSerialItems.SerialStart;
                    const serialEnd = oSmartmeterSerialItems.SerialEnd;
                    if(!serialEnd&&!serialStart){
                        return true
                    }else{
                        return false
                    }
        },

        _constructRowsForSmartmeterSerial: function () {
            debugger
            const oSmartmeterSerialItems = this.getModel("oSmartMeterSerialModel").getProperty("/");
            const serialStart = oSmartmeterSerialItems.SerialStart;
            const serialEnd = oSmartmeterSerialItems.SerialEnd;
            const aCurrentItemsInTable = oSmartmeterSerialItems.results
            let oItemEntities = [];

            for (let i = serialStart, index = 1; i <= serialEnd; i++, index++) {
                let oItemEntity = {};
                oItemEntity.Itemno = aCurrentItemsInTable[0].Itemno;
                oItemEntity.SubItemno = index.toString();
                oItemEntity.Serialno = i.toString();
                oItemEntity.Issplit = false;
                oItemEntity.PoNumber = aCurrentItemsInTable[0].PoNumber;
                oItemEntity.Postingquantity = "1";
                oItemEntity.ItemType = aCurrentItemsInTable[0].ItemType;
                oItemEntity.IsSmartmeter = true;
                oItemEntities.push(oItemEntity);
            }
            return oItemEntities

        },

        highlightEmpltyFields: function (aSerialItems) {
            //validate the posting qty field and batch field again to find out empty fields.
            let bSerialFlag = false;
            aSerialItems.forEach((item) => {
                if (bSerialFlag === true) return;
                if (item.Serialno === "") {
                    bSerialFlag = true;
                }
            });
            return bSerialFlag;
        },

        _createSmartMeterSerialModel: function (aNewCopyofItemsInTable) {
            const oData = {
                SerialPrefix: "",
                SerialSuffix: "",
                SerialStartCntr: "",
                SerialStart: "",
                SerialEnd: "",
                results: aNewCopyofItemsInTable

            }
            const oJsonModel = new JSONModel(oData);
            this.setModel(oJsonModel, "oSmartMeterSerialModel")
        },

        onInputValueHelpRequest: function (oEvent) {
            debugger
            var oInput = oEvent.getSource(); // Get the input field where the scan was triggered
            const oEndSerial = this.byId("idEndSerialInput");
            if (sap.ndc && sap.ndc.BarcodeScanner) {
                sap.ndc.BarcodeScanner.scan(
                    function (mResult) {
                        console.log(mResult.text);
                        oInput.setValue(mResult.text);
                        oEndSerial.setValue((Number(mResult.text) + Number(this._serialPostingQuantity)) - 1);
                    },
                    function (Error) {
                        sap.m.MessageToast.show("Scanning failed: " + Error);
                    }
                );
            } else {
                sap.m.MessageToast.show("Barcode scanning is not supported on this device.");
            }
        },

        onSerialStartInputChange: function (oEvent) {
            var oInput = oEvent.getSource();
            const oEndSerial = this.byId("idEndSerialInput");
            const sSerialStart = oInput.getValue();
            if (sSerialStart) {
                const aParts = this.parseScanValue(sSerialStart);
                oEndSerial.setValue(aParts[0] + ((Number(aParts[1]) + Number(this._serialPostingQuantity)) - 1) + aParts[2]);                
            }
        },

        onScanSuccess: function (oEvent) {
            const that = this;
            const sScannedValue = oEvent.getParameter("text");
            const oSerialInput = this.byId("idStartSerialInput");
            const oEndSerialInput = this.byId("idEndSerialInput");
        
            if (sScannedValue) {
                const aParts = this.parseScanValue(sScannedValue);
                console.log("Scanned Value:", sScannedValue);
                oSerialInput.setValue(sScannedValue);
                oEndSerialInput.setValue(aParts[0] + ((Number(aParts[1]) + Number(that._serialPostingQuantity)) - 1) + aParts[2]);
            } else {
                sap.m.MessageToast.show("No barcode detected.");
            }
        },
        
        parseScanValue : function(sScan) {
            // Regular expression to match prefix, number, and suffix
            const match = sScan.match(/^(\D+)?(\d+)(\D+)?$/); 
        
            // Check if input matches the pattern
            if (match) {
                // Return the captured groups, excluding the full match (match[0])
                return [match[1] || "", match[2], match[3] || ""];
            } else {
                return [];
            }
        },
              
    });
});
