sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (
    BaseController,
    JSONModel
) {
    "use strict";

    return BaseController.extend("com.wel.goodsreceipt.controller.Label", {

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // console.log("Label Controllers || OnInit");
            this.getRouter().getRoute("label").attachPatternMatched(this._onObjectLabelMatched, this);
        },

        onAfterRendering: function () {
            this.disableScrollInInputFields("id_label_input_field_counterStart");
        },
        
        _onObjectLabelMatched: function (oEvent) {
            // console.log("Label Controllers || OnObjectMatched");
            this.PONumber = oEvent.getParameter("arguments").PONumber;
            this.ItemNo = oEvent.getParameter("arguments").Itemno;


            // id_header_overFlowToolbar_label_table_ShortText
            this._setupModelForLabel();
        },
        _setupModelForLabel: function () {
            let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
            let oSelectedItem = oGlobalPoItemModel.getProperty("/results")
                .filter((item) => {
                    return item.Itemno === this.ItemNo;
                });

            var oCurrentItem = JSON.parse(JSON.stringify(oSelectedItem[0]));
            this.nPostingQty = parseInt(oCurrentItem.Postingquantity);

            if (oCurrentItem.LabelPrefix !== "" || oCurrentItem.StartCounter > 0) {
                this.calculateLabelValues(oCurrentItem);
            }

            let oItemEntity = this.getoItemEntity(oCurrentItem);

            let oTable = this.getView().byId("id_Label_table");
            let jsonModel = new JSONModel({ results: [oItemEntity] });
            oTable.setModel(jsonModel, "labelJsonModel");

            //set the deescription in table header & material no
            this.setHeaderData(oSelectedItem);

        },
        calculateLabelValues: function (oCurrentItem) {
            let nStartCounter = oCurrentItem.StartCounter;
            //assigning value to labelStart;
            oCurrentItem.LabelStart = nStartCounter.toString();
            nStartCounter -= 1;
            //assigning value to labelEnd;
            oCurrentItem.LabelEnd = nStartCounter + parseInt(oCurrentItem.Postingquantity);
        },

        getoItemEntity(oCurrentItem) {
            let oItemEntity = {};
            oItemEntity.Batchno = oCurrentItem.Batchno;
            oItemEntity.Issplit = oCurrentItem.Issplit;
            oItemEntity.ItemType = oCurrentItem.ItemType;
            oItemEntity.Itemno = oCurrentItem.Itemno;
            oItemEntity.LabelPrefix = oCurrentItem.LabelPrefix;
            oItemEntity.LabelSuffix = oCurrentItem.LabelSuffix;
            oItemEntity.StartCounter = oCurrentItem.StartCounter === 0 ? "" : oCurrentItem.StartCounter;
            oItemEntity.LabelStart = oCurrentItem.LabelPrefix + oCurrentItem.LabelStart + oCurrentItem.LabelSuffix;
            oItemEntity.LabelEnd = oCurrentItem.LabelPrefix + oCurrentItem.LabelEnd + oCurrentItem.LabelSuffix;
            oItemEntity.PoNumber = oCurrentItem.PoNumber;
            oItemEntity.PoQuantity = oCurrentItem.PoQuantity;
            oItemEntity.Postingquantity = oCurrentItem.Postingquantity;
            oItemEntity.Receivedquantity = oCurrentItem.Receivedquantity;
            oItemEntity.Serialno = oCurrentItem.Serialno;
            oItemEntity.ShortText = oCurrentItem.ShortText;
            oItemEntity.SubItemno = oCurrentItem.SubItemno;
            return oItemEntity;
        },

        setHeaderData: function (oSelectedItem) {
            this.byId("id_header_overFlowToolbar_label_table_ShortText").
                setText(this.getView().getModel("i18n").getResourceBundle().getText("Description") +
                    " " + ":" + " " + oSelectedItem[0].ShortText);
        },

        onCloseDetailPress: function () {
            this.enableInputFieldsInDetailPage();

            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false);
            this.getRouter().navTo("object", {
                PONumber: this.PONumber
            }, true);
        },

        onCounterValueChange: function (oEvent) {
            let oLabelModel = this.getView().byId("id_Label_table").getModel("labelJsonModel");
            var oLabelData = oLabelModel.getProperty("/results/0");

            let sCounterStartFieldValue = parseInt(oEvent.getParameter("newValue"));
            oLabelData.LabelStart = sCounterStartFieldValue.toString();
            sCounterStartFieldValue -= 1;

            let nLabelEndValue = sCounterStartFieldValue + parseInt(oLabelData.Postingquantity);
            // console.log("counter start value", sCounterStartFieldValue)
            if ((oLabelData.LabelPrefix + nLabelEndValue.toString() + oLabelData.LabelSuffix).length > 10 || isNaN(nLabelEndValue) || oLabelData.LabelPrefix.length > 4) {
                oLabelData.LabelStart = "Invalid";
                oLabelData.LabelEnd = "Invalid";
                oLabelModel.setProperty("/results", [oLabelData]);

            } else {
                oLabelData.LabelStart = oLabelData.LabelPrefix + oLabelData.LabelStart + oLabelData.LabelSuffix;
                oLabelData.LabelEnd = oLabelData.LabelPrefix + nLabelEndValue.toString() + oLabelData.LabelSuffix;
                oLabelModel.setProperty("/results", [oLabelData]);
            }
        },

        onLabelPrefixAndValueChange: function (oEvent) {
            let oLabelModel = this.getView().byId("id_Label_table").getModel("labelJsonModel");
            let oLabelData = oLabelModel.getProperty("/results/0");

            let sCounterStartFieldValue = oLabelData.StartCounter;
            sCounterStartFieldValue === "" ? "" : sCounterStartFieldValue -= 1;
            let nLabelEndValue = sCounterStartFieldValue + parseInt(oLabelData.Postingquantity);


            let sLabelPrefixValue = oEvent.getParameter("newValue");
            // console.log(sLabelPrefixValue);
            if ((sLabelPrefixValue + oLabelData.StartCounter + oLabelData.LabelSuffix).length > 10 || sLabelPrefixValue.length > 4) {
                oLabelData.LabelStart = "Invalid";
                oLabelData.LabelEnd = "Invalid";
                oLabelModel.setProperty("/results", [oLabelData]);
                this.removeStyleClassAndSetErrorState(oEvent.getSource(), this.getResourceBundle().getText("Max4charactersallowed"));

            } else {
                oLabelData.LabelStart = sLabelPrefixValue + oLabelData.StartCounter + oLabelData.LabelSuffix;
                oLabelData.LabelEnd = sLabelPrefixValue + nLabelEndValue + oLabelData.LabelSuffix;
                oLabelModel.setProperty("/results", [oLabelData]);
                this.addStyleClass(oEvent.getSource());
            }
        },

        onSaveLabelButtonPress: function (oEvent) {
            //get the global model
            let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
            let data = oGlobalPoItemModel.getProperty("/results");

            //get the local model
            let oLabelModel = this.getView().byId("id_Label_table").getModel("labelJsonModel");
            let oLabelData = oLabelModel.getProperty("/results/0");
            //update the global modelfrom local model.

            let breakForEachFlag = false;
            data.map((item) => {
                if (breakForEachFlag === true) return;
                if (item.Itemno === this.ItemNo) {
                    breakForEachFlag = true;
                    if (oLabelData.LabelPrefix === "" || oLabelData.StartCounter === "") {
                        this.displayMessage("Error", this.getResourceBundle().getText("PrefixandCountershouldnotbeempty"));
                    } else {
                        item.LabelPrefix = oLabelData.LabelPrefix;
                        item.LabelSuffix = oLabelData.LabelSuffix;
                        item.LabelStart = oLabelData.StartCounter.toString();
                        item.LabelEnd = (parseInt(oLabelData.StartCounter) - 1) + parseInt(oLabelData.Postingquantity);
                        item.LabelEnd = item.LabelEnd.toString();
                        item.StartCounter = parseInt(oLabelData.StartCounter);
                        // item.showColor = "GREEN";
                        item.ButtonType = "Default";
                        oGlobalPoItemModel.setProperty("/results", data);
                        this.enableInputFieldsInDetailPage();
                        this.onCloseDetailPress(); //close the third column
                        // oGlobalPoItemModel.refresh();
                    }
                }
            });
        },

		onLabelSuffixAndValueChange: function(oEvent) {
            let oLabelModel = this.getView().byId("id_Label_table").getModel("labelJsonModel");
            let oLabelData = oLabelModel.getProperty("/results/0");

            let sCounterStartFieldValue = oLabelData.StartCounter;
            sCounterStartFieldValue === "" ? "" : sCounterStartFieldValue -= 1;
            let nLabelEndValue = sCounterStartFieldValue + parseInt(oLabelData.Postingquantity);


            // let sLabelPrefixValue = oEvent.getParameter("newValue");
            let sLabelSuffixValue = oEvent.getParameter("newValue");
            // console.log(sLabelPrefixValue);
            if ((oLabelData.StartCounter + sLabelSuffixValue).length > 10 || sLabelSuffixValue.length > 4) {
                oLabelData.LabelStart = "Invalid";
                oLabelData.LabelEnd = "Invalid";
                oLabelModel.setProperty("/results", [oLabelData]);
                this.removeStyleClassAndSetErrorState(oEvent.getSource(), this.getResourceBundle().getText("Max4charactersallowed"));

            } else {
                oLabelData.LabelStart = oLabelData.LabelPrefix + oLabelData.StartCounter + sLabelSuffixValue;
                oLabelData.LabelEnd = oLabelData.LabelPrefix + nLabelEndValue + sLabelSuffixValue;
                oLabelModel.setProperty("/results", [oLabelData]);
                this.addStyleClass(oEvent.getSource());
            }			
		}
    });
});


