sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (
    BaseController,
    JSONModel
) {
    "use strict";

    return BaseController.extend("com.wel.goodsreceipt.controller.BatchSplit", {

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // console.log("BatchSplit Controllers || OnInit");
            this._aBatchItem = [];
            this.getRouter().getRoute("batch").attachPatternMatched(this._onObjectBatchSplitMatched, this);
        },

        onAfterRendering: function () {
            this.disableScrollInInputFields("id_PostingQuantityInputField");
        },

        /* =========================================================== */
        /* methods                                                     */
        /* =========================================================== */

        onCloseBatchPress: function () {
            this.enableInputFieldsInDetailPage();

            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false);
            this.getRouter().navTo("object", {
                PONumber: this.PONumber
            }, true);
        },


        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "EndColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        },

        _onObjectBatchSplitMatched: function (oEvent) {
            // console.log("route mateched || Batch Spplit controller");
            this.byId("id_savepo_batch_split").setEnabled(false); //disable the save button initially.

            this.PONumber = oEvent.getParameter("arguments").PONumber;
            this.ItemNo = oEvent.getParameter("arguments").Itemno;

            this._getModelAndBindData();
        },

        _getModelAndBindData: function () {
            let mGlobalPOItemMdel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
            let mCurrentPOItemInTable = mGlobalPOItemMdel.getProperty("/results")
                .filter((item) => {
                    return item.Itemno === this.ItemNo;
                });

            let proxyItems = [];
            if (mCurrentPOItemInTable.length === 1) {
                mCurrentPOItemInTable.forEach((item) => {
                    proxyItems.push(item);
                });

                this._aBatchItem = proxyItems[0];
                this._nOrderQuantity = proxyItems[0].PoQuantity;
                this._nReceivedQuantity = proxyItems[0].Receivedquantity;
                this._MaterialNumber = proxyItems[0].Materialno;
                proxyItems = [];

            } else {

                mCurrentPOItemInTable.forEach((item) => {
                    if (parseInt(item.SubItemno) > 0) {
                        let oItemEntity = {};
                        oItemEntity.PoNumber = item.PoNumber;
                        oItemEntity.Itemno = item.Itemno;
                        oItemEntity.SubItemno = item.SubItemno;
                        oItemEntity.Batchno = item.Batchno;
                        oItemEntity.ItemType = item.ItemType;
                        oItemEntity.Materialno = item.Materialno;
                        oItemEntity.PoQuantity = item.PoQuantity;
                        oItemEntity.Postingquantity = item.Postingquantity;
                        oItemEntity.Price = item.Price;
                        oItemEntity.Receivedquantity = item.Receivedquantity;
                        oItemEntity.Serialno = item.Serialno;
                        oItemEntity.ShortText = item.ShortText;
                        oItemEntity.Uom = item.Uom;

                        proxyItems.push(oItemEntity);
                    }
                });
            }

            let oTable = this.getView().byId("id_BatchSplit_table");
            let jsonModel = new JSONModel({ results: proxyItems });
            oTable.setModel(jsonModel, "itemJsonModel");

            this.setHeaderData();
        },

        onBatchSplitButtonPress: function (oEvent) {
            this.byId("id_savepo_batch_split").setEnabled(true);

            let oTableControlRef = oEvent.getSource().getParent().getParent();
            let oItemJsonModel = oTableControlRef.getModel("itemJsonModel");

            let localData = oItemJsonModel.getProperty("/results"); //get all the SubItems

            let oItemEntity = {};
            oItemEntity.PoNumber = this._aBatchItem.PoNumber;
            oItemEntity.Itemno = this.ItemNo;
            oItemEntity.SubItemno = this._getUniqueSubItemno(oEvent);
            oItemEntity.Batchno = "";
            oItemEntity.ItemType = this._aBatchItem.ItemType;
            oItemEntity.Materialno = this._aBatchItem.Materialno;
            oItemEntity.PoQuantity = this._aBatchItem.PoQuantity;
            oItemEntity.Postingquantity = "";
            oItemEntity.Price = this._aBatchItem.Price;
            oItemEntity.Receivedquantity = this._aBatchItem.Receivedquantity;
            oItemEntity.Serialno = this._aBatchItem.Serialno;
            oItemEntity.ShortText = this._aBatchItem.ShortText;
            oItemEntity.Uom = this._aBatchItem.Uom;

            localData.push(oItemEntity);
            oItemJsonModel.setProperty("/results", localData);
        },

        onItemDeletePress: function (oEvent) {
            this.byId("id_savepo_batch_split").setEnabled(true); //enable save button on deleting an item.

            let sPath = oEvent.getParameter('listItem').getBindingContext("itemJsonModel").getPath();
            let index = parseInt(sPath.substring(sPath.lastIndexOf('/') + 1));

            let oModel = oEvent.getSource().getModel("itemJsonModel");
            let data = oModel.getProperty("/results");

            data.splice(index, 1);
            let idx = 0;
            data.map((item) => {
                console.log(item);
                item.SubItemno = (idx + 1).toString();
                idx++;
            });
            console.log(data);
            oModel.setProperty("/results", data);
        },

        _getUniqueSubItemno: function (oEvent) {
            let oTableControlRef = oEvent.getSource().getParent().getParent();
            let oItemJsonModel = oTableControlRef.getModel("itemJsonModel");

            let localData = oItemJsonModel.getProperty("/results");
            let aSubItemno = [];
            localData.forEach(item => {
                aSubItemno.push(parseInt(item.SubItemno));
            });
            let nMaximumNo = aSubItemno.reduce(function (a, b) {
                return Math.max(a, b);
            }, 0);
            return (nMaximumNo + 1).toString();
        },

        onLiveChangePostingQuantity: function (oEvent) {
            let oInputFieldPostingQtyControlRef = oEvent.getSource();

            let nValidAcceptablePostingQty = this._nOrderQuantity - this._nReceivedQuantity;
            let nPostingQuantityValue = parseInt(oEvent.getParameter("newValue")) || 0;

            // get model of the table and then calculate the total value of all the rows and then validate.
            let oItems = oEvent.getSource().getParent().getModel("itemJsonModel").getProperty("/results");
            let nLatestValueOfPostingQtyOfAllRows = 0;
            oItems.forEach((item) => {
                if (item.Postingquantity !== "") {
                    nLatestValueOfPostingQtyOfAllRows += parseInt(item.Postingquantity);
                }
            });

            if (nPostingQuantityValue > nValidAcceptablePostingQty) {
                this.removeStyleClassAndSetErrorState(oInputFieldPostingQtyControlRef, this.getResourceBundle().getText("ValuegreaterthanOrderQty"));
                this.byId("id_savepo_batch_split").setEnabled(false);
            } else if (nLatestValueOfPostingQtyOfAllRows > nValidAcceptablePostingQty) {
                this.removeStyleClassAndSetErrorState(oInputFieldPostingQtyControlRef, this.getResourceBundle().getText("postingqtyexceedstotalqty  ") + nValidAcceptablePostingQty);
                this.byId("id_savepo_batch_split").setEnabled(false);
            } else {
                this.addStyleClass(oInputFieldPostingQtyControlRef);
                this.byId("id_savepo_batch_split").setEnabled(true);
            }
        },

        onLiveChangeBatch: function (oEvent) {
            this.byId("id_savepo_batch_split").setEnabled(true);
            // let BatchValue = oEvent.getParameter("newValue");
            // let oBatchInputFieldControlRef = oEvent.getSource();
            // if (BatchValue.trim() === "") {
            //     this.removeStyleClassAndSetErrorState(oBatchInputFieldControlRef, "Batch Field Cannot be Empty");
            //     this.byId("id_savepo_batch_split").setEnabled(false);
            // } else {
            //     this.addStyleClass(oBatchInputFieldControlRef);
            //     this.byId("id_savepo_batch_split").setEnabled(true);
            // }
        },

        setHeaderData: function (oEvent) {
            this.byId("id_text_for_Materialno").setText(this._MaterialNumber);
            // this.byId("id_text_for_Materialno").addStyleClass('rowColorChangeApp');
            this.byId("id_text_for_orderQuantity").setText(this._nOrderQuantity);
            this.byId("id_text_for_receivQuantity").setText(this._nReceivedQuantity);
        },

        onSavePOBatchItemButtonPress: function (oEvent) {

            let oTableControlRef = this.byId("id_BatchSplit_table")
            let oItemJsonModel = oTableControlRef.getModel("itemJsonModel");
            let updatedBatchItems = oItemJsonModel.getProperty("/results");

            let bIsPostingQtyEmpty = this.isPostingQtyEmpty(updatedBatchItems);

            if (bIsPostingQtyEmpty === true) {
                this.displayMessage("Warning", this.getResourceBundle().getText("PostingQuantityCannotBeEmpty"));
            } else {
                //enable input fields in detail page.
                this.enableInputFieldsInDetailPage();

                let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
                let data = oGlobalPoItemModel.getProperty("/results");
                let updatedData = [];
                //1.Delete previous local records and update it with the lates records.
                data.forEach((item) => {
                    //item.isInputFieldEnabled = true;
                    if (item.Itemno === this.ItemNo && item.SubItemno > 0) {
                        // do nothing.
                    } else {
                        // consolelog("updated item in globaldata array is ", item);
                        if (item.Itemno === this.ItemNo && parseInt(item.SubItemno) === 0) {
                            //1. update the issplit to true
                            item.Issplit = true;
                            //2. update the posting qty in the header item.
                            item.Postingquantity = this.getTotalPostingQtyCount(updatedBatchItems).toString();
                            //3. disable the posting and batch fields
                            if (item.Postingquantity > 0) {
                                item.isInputFieldEnabled = false;
                            } else {
                                item.isInputFieldEnabled = true;
                                item.Postingquantity = "";
                                item.Issplit = false;
                            }
                        }
                        updatedData.push(item);
                    }
                });
                // console.log("new data is with only the original header items ", data);

                if (updatedBatchItems.length > 0) {
                    updatedBatchItems.forEach((item) => updatedData.push(item));
                }
                //find the header item and make isSplit as true;

                oGlobalPoItemModel.setProperty("/results", updatedData);
                // console.log(oGlobalPoItemModel);
                this.onCloseBatchPress(); //close the third column
            }
        },

        isPostingQtyEmpty: function (updatedBatchItems) {
            //validate the posting qty field to find out empty fields.
            let bIsPostingQtyEmptyFlag = false;
            updatedBatchItems.forEach((item) => {
                if (bIsPostingQtyEmptyFlag === true) return;
                if (item.Postingquantity === "") {
                    bIsPostingQtyEmptyFlag = true;
                }
            });
            return bIsPostingQtyEmptyFlag;
        },

        getTotalPostingQtyCount: function (updatedBatchItems) {
            let nTotalPostingQty = 0;
            updatedBatchItems.forEach((item) => {
                nTotalPostingQty += parseInt(item.Postingquantity);
            });
            return nTotalPostingQty;
        }
    });
});
