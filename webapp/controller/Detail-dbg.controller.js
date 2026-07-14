sap.ui.define(
  [
    "./BaseController",
    "../model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "../util/MessageController",
    "../util/SuccessMessageController",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/DialogType",
    "sap/m/BusyDialog",
    "sap/ui/model/FilterOperator"
  ],
  function (BaseController,
	formatter,
	JSONModel,
	Filter,
	MessageController,
	SuccessMessageController,
	MessageBox,
	Fragment,
	Dialog,
	Text,
	Button,
	DialogType,
	BusyDialog,
	FilterOperator) {
    "use strict";

    return BaseController.extend("com.wel.goodsreceipt.controller.Detail", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onInit: function () {
        // console.log("Detail || OnInit");
        var oViewModel = new JSONModel({
          busy: false,
          delay: 0,
          lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
        });
        this._bisThisSecondTimeInDetailPageFromBatchPage = false;
        this._bIsThisFromMasterPage = false;
        this._service = {
          detailPrintLabel: false
        };

        this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

        this.setModel(oViewModel, "detailView");

        var eventBus = this.getOwnerComponent().getEventBus();
        eventBus.subscribe("object", "event1", this.getPONumber, this);
      },

      onAfterRendering: function () {
        this.disableScrollInInputFields("id_PostingQuantityInputField");
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Toggle between full and non full screen mode.
       */
      toggleFullScreen: function () {
        var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
        this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
        if (!bFullScreen) {
          // store current layout and go full screen
          this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
          this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
        } else {
          // reset to previous layout
          this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
        }
        this._bisThisSecondTimeInDetailPageFromBatchPage = false;
      },

      //search functionality is working.. it searchees for itemNo and shortText
      onSearchPOItemTable: function (oEvent) {
        // console.log("Inside search PO Item Table");
        var filters;
        var sQuery = oEvent.getParameter("query");
        if (sQuery && sQuery.length > 0) {
          filters = new Filter({
            filters: [
              new Filter({
                path: "Itemno",
                operator: sap.ui.model.FilterOperator.Contains,
                value1: sQuery,
              }),
              new Filter({
                path: "ShortText",
                operator: sap.ui.model.FilterOperator.Contains,
                value1: sQuery,
              }),
              new Filter({
                path: "Materialno",
                operator: sap.ui.model.FilterOperator.Contains,
                value1: sQuery,
              }),
              new Filter({
                path: "ItemType",
                operator: sap.ui.model.FilterOperator.Contains,
                value1: sQuery,
              }),
            ],
            and: false,
          });
        }
        var list = this.getView().byId("id_POitemTable");
        var binding = list.getBinding("items");
        binding.filter(filters);
      },

      //-------------------------------onsavepo----------make post request---------------start---------------
      onPOSTPOButtonPress: function (oEvent) {
        // 1. get selected items and the data.

        let referenceToPoItemsTable = this.byId("id_POitemTable");
        let aAllItems = referenceToPoItemsTable.getModel("poItemGlobalJsonModel").getProperty("/results");

        aAllItems = aAllItems.filter((item) => {
          return item.Postingquantity !== "" && item.Postingquantity !== "0";
        });

        let oRefToDeliveryNoteControl = this.byId("deleveryNote");
        const sDeliveryNote = oRefToDeliveryNoteControl.getValue();

        //check if delivery note is empty
        if (sDeliveryNote === "") {
          // handle deliverynote empty
          this.byId("deleveryNote").removeStyleClass("input_css");
          this.byId("deleveryNote").setValueState("Error");
          const URL11 = this.getView().getModel("i18n").getResourceBundle().getText("MandtFieldAltMsg");
          // sap.m.MessageBox.warning(
          //     URL11, {
          //     actions: [sap.m.MessageBox.Action.OK],
          //     onClose: function (oAction) {
          //         if (oAction === "OK") { }
          //     }
          // });
          this.displayMessage("Error", URL11);
        } else {
          //handle post request.
          //3 . get document date and popsting date.
          let _self = this;
          MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("SaveConfirmationMsg"), {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: async function (oAction) {
              if (oAction === "YES") {
                var _oPOHeaderData = _self.getView().getModel("poHeaderJson").getProperty("/"); //po data

                _self.POnm = _oPOHeaderData.PoNumber; //store PoNumber in global reference.

                var dateInst = sap.ui.core.format.DateFormat.getDateInstance({
                  pattern: "yyyy-MM-dd",
                });
                let oDocumentDateControlRef = _self.byId("id_documentdate");
                let oPostinigDateControlRef = _self.byId("id_postingdate");

                var _sDocumentDate = oDocumentDateControlRef.getDateValue();
                var _oHeaderDataDocDate = dateInst.format(_sDocumentDate) + "T00:00:00";

                var _sPostingDate = oPostinigDateControlRef.getDateValue();
                var _oHeaderDataPostDate = dateInst.format(_sPostingDate) + "T00:00:00";

                let oEntity = {};
                oEntity.PoNumber = _oPOHeaderData.PoNumber; //ed
                oEntity.PoType = _oPOHeaderData.PoType;
                oEntity.PoTypeDesc = _oPOHeaderData.PoTypeDesc;
                oEntity.FromDate = _oPOHeaderData.FromDate;
                oEntity.ToDate = _oPOHeaderData.ToDate;
                oEntity.CreatedOn = _oPOHeaderData.CreatedOn;
                oEntity.VendorNo = _oPOHeaderData.VendorNo;
                oEntity.VendorName = _oPOHeaderData.VendorName;
                oEntity.CreatedBy = _oPOHeaderData.CreatedBy;
                oEntity.PurGroup = _oPOHeaderData.PurGroup;
                oEntity.PurGroupDesc = _oPOHeaderData.PurGroupDesc;
                oEntity.GrStatus = _oPOHeaderData.GrStatus;
                oEntity.GrStatusDesc = _oPOHeaderData.GrStatusDesc;
                oEntity.RelIndicator = _oPOHeaderData.RelIndicator;
                oEntity.RelIndDesc = _oPOHeaderData.RelIndDesc;
                oEntity.PoValue = _oPOHeaderData.PoValue;
                oEntity.CurrencyKey = _oPOHeaderData.CurrencyKey;
                oEntity.DeliveryNote = sDeliveryNote; //edited field
                oEntity.DocumentDate = _oHeaderDataDocDate; //edited
                oEntity.PostingDate = _oHeaderDataPostDate; //edited
                oEntity.Message = _oPOHeaderData.Message;
                const oPrintLabelEntity = { ...oEntity };
                oEntity.POItemNav = []; //deep insert entity.

                let results = [];
                aAllItems.forEach((item) => {
                  let oPoItem = {};
                  oPoItem.PoNumber = item.PoNumber;
                  oPoItem.Itemno = item.Itemno;
                  oPoItem.SubItemno = item.SubItemno;
                  oPoItem.ItemType = item.ItemType;
                  oPoItem.Issplit = item.Issplit;
                  oPoItem.Materialno = item.Materialno;
                  oPoItem.ShortText = item.ShortText;
                  oPoItem.PoQuantity = item.PoQuantity;
                  oPoItem.Uom = item.Uom;
                  oPoItem.Receivedquantity = item.Receivedquantity;
                  oPoItem.Postingquantity = item.Postingquantity; //edited.
                  oPoItem.Batchno = item.Batchno;
                  oPoItem.Serialno = item.Serialno;
                  oPoItem.Plant = item.Plant;
                  oPoItem.Sloc = item.Sloc;
                  oPoItem.Storagebin = item.Storagebin;
                  oPoItem.Price = item.Price;
                  oPoItem.LabelPrefix = item.LabelPrefix;
                  oPoItem.LabelSuffix = item.LabelSuffix;
                  oPoItem.StartCounter = item.StartCounter;
                  oPoItem.LabelStart = item.LabelStart;
                  oPoItem.LabelEnd = item.LabelEnd;
                  oPoItem.IsSmartmeter = item.IsSmartmeter;
                  oPoItem.SerialStart = item.SerialStart;
                  oPoItem.SerialEnd = item.SerialEnd;
                  oPoItem.SerialPrefix = item.SerialPrefix;
                  oPoItem.SerialSuffix = item.SerialSuffix;
                  oPoItem.SerialStartCntr = item.SerialStartCntr;

                  // oPoItem.ConfirmFlag = true; //edited
                  results.push(oPoItem);
                });
                oEntity.POItemNav = { results };
                debugger
                console.log("final entity to push", oEntity);
                // create a print Label Model
                const oPrintLabelData = JSON.parse(JSON.stringify(oEntity.POItemNav));
                const aPrintLabelData = _self._getPrintLabelModelData(oPrintLabelData.results);
                const oJsonModel = _self.getModel("oJsonPrintLabelModel");
                // console.log(oJsonModel);

                oJsonModel.setProperty('/results', aPrintLabelData);
                oJsonModel.setProperty('/oEntity', oPrintLabelEntity);
                
                try {
                  const sUrl = "/POSet";
                  sap.ui.core.BusyIndicator.show();
                  const data = await _self.postDataToServer(sUrl, oEntity);
                  // console.log("success while getting object data", data);
                  sap.ui.core.BusyIndicator.hide();

                  var successMessage = data.Message;
                  var MultiPleMessage = data.BatchMsgStr;

                  // start of the feature

                  if (successMessage) {
                    // console.log('successMessage is ', successMessage);
                    var successLines = [];
                    if (MultiPleMessage) {
                      //prepare split data
                      var MultiPleMessage = MultiPleMessage.split("\n");
                      MultiPleMessage = MultiPleMessage.filter((item) => item != "");
                      MultiPleMessage.map((item) => item.trim());
                      MultiPleMessage.forEach((item) => successLines.push(item));
                    }

                    let aContentArray = [];
                    aContentArray = successLines.map((message) => {
                      return new sap.m.Text({ text: "-\t" + message + "\n\n" });
                    });
                    aContentArray.unshift(new sap.m.Text({ text: successMessage + "\n\n" }));

                    // console.log('success lines are ', successLines);
                    // console.log('aContentArray is ', aContentArray);
                    // if (!_self.oSuccessMessageDialog) {
                    _self.oSuccessMessageDialog = new sap.m.Dialog({
                      type: sap.m.DialogType.Message,
                      title: "Success",
                      state: sap.ui.core.ValueState.Success,
                      content: new sap.m.FlexBox({
                        direction: sap.m.FlexDirection.Column,
                        items: aContentArray,
                      }),
                      beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Print Labels",
                        press: function () {
                          _self.oSuccessMessageDialog.close();
                          _self._onPressPrintLabels();
                        }.bind(_self),
                      }),
                      endButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Close",
                        press: function () {
                          _self.oSuccessMessageDialog.close();
                          _self.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
                          _self.getRouter().navTo("master", {}, {}, true);
                        }.bind(_self),
                      }),
                    });
                    // }
                    _self.oSuccessMessageDialog.open();
                  }
                  // end of the feature
                } catch (error) {
                  // console.log(JSON.stringify(error, null, 4));
                  sap.ui.core.BusyIndicator.hide();
                  var bCompact = !!_self.getView().$().closest(".sapUiSizeCompact").length;
                  new MessageController().handle(error, bCompact);
                }
              }
            },
          });
        }
      },

      //-------------------------------onsavepo----------make post request---------------end---------------

      OnDeliveryNoteChange: function (oEvent) {
        let oDelControlRef = oEvent.getSource();
        this.addStyleClass(oDelControlRef);
      },

      onResetButtonPress: function (oEvent) {
        // console.log("Detail || Reseting ");

        let _self = this;
        MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("exitConfirmMessage"), {
          actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
          onClose: function (oAction) {
            if (oAction === "YES") {
              _self.getView().byId("idPONumber").setText("");
              _self.getView().byId("idStatus").setText("");
              _self.getView().byId("idVendorName").setText("");
              _self.byId("id_documentdate").setValue("");
              _self.byId("id_postingdate").setValue("");
              _self.byId("deleveryNote").setValue("");
              _self.byId("deleveryNote").setValueState("None");

              _self.byId("searchField").setValue("");

              var ModelItems = new JSONModel([]);
              _self.getOwnerComponent().setModel(ModelItems, "poItemGlobalJsonModel");
              // _self.getView().byId("id_POitemTable").setModel(ModelItems, "poItemGlobalJsonModel");
              _self.getOwnerComponent().getModel("poItemGlobalJsonModel").refresh();
              // _self.getView().byId("id_POitemTable").getModel("poItemGlobalJsonModel").refresh();
              var _sLength = "0";
              _self
                .getView()
                .byId("id_TemTitle")
                .setText("Items  (" + _sLength + ") ");

              /*_self.byId("id_savepo").setEnabled(false);*/

              _self.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
              // No item should be selected on master after detail page is closed
              _self.getOwnerComponent().oListSelector.clearMasterListSelection();
              _self.getRouter().navTo("master", {}, {}, true);

              _self._bisThisSecondTimeInDetailPageFromBatchPage = false;
            }
          },
        });
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      getPONumber: function (object, event, data) {
        // console.log("subscribing to podata from master", data);
        let selectedPo = data.customData;
        // console.log("selected po is", selectedPo);
        this._onObjectMatched(selectedPo);
      },

      _onObjectMatched: async function (oEvent) {
        // console.log("onObjectMatched || selected po");

        //create model for Printlabel
        this._createPrintLabelJsonModel()
        // console.log("is this second time in Detail page? from the batchsplit page?", this._bisThisSecondTimeInDetailPageFromBatchPage);
        let _self = this;
        // || !this._bIsThisFromMasterPage
        if (!this._bisThisSecondTimeInDetailPageFromBatchPage) {
          // console.log("getting latest data from the server for detail page");
          let sObjectId;
          if (oEvent.oSource) {
            sObjectId = oEvent.getParameter("arguments").PONumber;
          } else {
            sObjectId = oEvent;
          }
          //   sap.ui.core.BusyIndicator.show();
          this.getView().setBusy(true);
          try {
            const sUrl = "/POSet('" + sObjectId + "')";
            const urlParam = { $expand: "POItemNav" };
            const data = await this.getDataFromServer(sUrl, urlParam, []);

            console.log("success while getting object data", data);
            // sap.ui.core.BusyIndicator.hide(); moved to finally block
            var jsonModel = new JSONModel(data);
            _self.setModel(jsonModel, "poHeaderJson");

            data.POItemNav.results.map((item) => {
              item.ButtonType = "Default";
              //2. check if ItemType is Batch. if yes show batch input field based on condition.
              if (item.ItemType === "BATCH" && item.PoQuantity !== item.Receivedquantity) {
                item.BatchShowFlag = true;
                item.Postingquantity = "";
                item.isInputFieldEnabled = true;
              } else {
                item.BatchShowFlag = false;
                item.ButtonType = "Transparent";
              }
              //add one more property to disable and enable the Action button.
              item.isButtonEnabled = true;
              //if itemType is stock then disable the button as we dont need it.
              if (item.ItemType === "STOCK") {
                item.isButtonEnabled = false;
                item.ButtonType = "Transparent";
              }
              // if (item.PoQuantity === item.Receivedquantity) {
              //     item.isButtonEnabled = false;
              //     item.ButtonType = "Transparent";
              // }

              if (item.ItemType === "SERIAL" || item.ItemType === "LABEL") {
                item.ButtonType = "Default";
              }
              //row color property
              // item.showColor = "NOCOLOR";
              //.1 check if po == received qty. if yes then remove input field in view based on the flag.
              if (item.PoQuantity === item.Receivedquantity) {
                // console.log("order quantity == received quantity", item);
                item.PostingQuantityFlag = false;
                item.ButtonType = "Transparent";
                item.isButtonEnabled = false;
              }

              if ((item.Postingquantity = "0")) {
                item.Postingquantity = "";
              }
            });

            let jsonModel2 = new JSONModel(data.POItemNav);
            _self.getOwnerComponent().setModel(jsonModel2, "poItemGlobalJsonModel");
            _self._showObjectHeaderDataPo(data);
            _self.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded"); //onreload button pressed
          } catch (error) {
            // console.log('error while getting POItemnav', error);
            // sap.ui.core.BusyIndicator.hide(); //moved to finally block
            var bCompact = !!_self.getView().$().closest(".sapUiSizeCompact").length;
            new MessageController().handle(error, bCompact);
          } finally {
            // sap.ui.core.BusyIndicator.hide();
            this.getView().setBusy(false);
          }
        } else {
          // console.log("USING exixting data from the memory");
          this._bisThisSecondTimeInDetailPageFromBatchPage = false;
          _self.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
        }
      },

      _showObjectHeaderDataPo: function (data) {
        var _self = this;

        _self.getView().byId("idVendorName").setText(data.VendorName);

        _self.getView().byId("idPONumber").setText(data.PoNumber);

        _self.byId("id_documentdate").setDateValue(new Date(data.DocumentDate));
        _self.byId("id_documentdate").setMaxDate(new Date());
        _self.byId("id_postingdate").setDateValue(new Date());
        _self.byId("id_postingdate").setMaxDate(new Date());
        _self.getView().byId("idStatus").setText(data.RelIndDesc);
        if (data.RelIndicator === "1") {
          // Approve color
          _self.getView().byId("idPONumber").addStyleClass("rowColorChangeApp");
          _self.getView().byId("idStatus").addStyleClass("rowColorChangeApp");

          _self.getView().byId("idPONumber").removeStyleClass("rowColorChangeInpro");
          _self.getView().byId("idPONumber").removeStyleClass("rowColorChangeError");
          _self.getView().byId("idStatus").removeStyleClass("rowColorChangeInpro");
          _self.getView().byId("idStatus").removeStyleClass("rowColorChangeError");

          _self.getView().byId("id_savepo").setEnabled(true);
          //_self.getView().byId("id_reset").setVisible(true);
        } else if (data.RelIndicator === "A") {
          // In progress color
          _self.getView().byId("idPONumber").addStyleClass("rowColorChangeInpro");
          _self.getView().byId("idStatus").addStyleClass("rowColorChangeInpro");

          _self.getView().byId("idPONumber").removeStyleClass("rowColorChangeApp");
          _self.getView().byId("idPONumber").removeStyleClass("rowColorChangeError");
          _self.getView().byId("idStatus").removeStyleClass("rowColorChangeApp");
          _self.getView().byId("idStatus").removeStyleClass("rowColorChangeError");

          _self.getView().byId("id_savepo").setEnabled(false);
          // _self.getView().byId("id_reset").setVisible(false);
        } else if (data.RelIndicator === "B") {
          // Error color
          _self.getView().byId("idPONumber").addStyleClass("rowColorChangeError");
          _self.getView().byId("idStatus").addStyleClass("rowColorChangeError");

          _self.getView().byId("idPONumber").removeStyleClass("rowColorChangeApp");
          _self.getView().byId("idPONumber").removeStyleClass("rowColorChangeInpro");
          _self.getView().byId("idStatus").removeStyleClass("rowColorChangeApp");
          _self.getView().byId("idStatus").removeStyleClass("rowColorChangeInpro");

          _self.getView().byId("id_savepo").setEnabled(false);
          // _self.getView().byId("id_reset").setVisible(false);
        }
        //if the po is fully delivered then disable the posting.
        if (data.GrStatus === "01") {
          _self.getView().byId("id_savepo").setEnabled(false);
          // _self.getView().byId("id_reset").setEnabled(false);
        }

        //sets the size of the total items in the headertoolbar of table.
        _self
          .getView()
          .byId("id_TemTitle")
          .setText("Items  (" + data.POItemNav.results.length + ") ");

        _self.byId("deleveryNote").setValue("");
        _self.byId("deleveryNote").setValueState("None");
      },

      onActionButtonPressInItemsTable: function (oEvent) {
        // console.log("Action Button Pressed", oEvent);
        const sButtonText = oEvent.getSource().getText();
        switch (sButtonText) {
          case "LABEL":
            this._handleLABEL(oEvent);
            break;
          case "BATCH":
            this._handleBATCH(oEvent);
            break;
          case "SERIAL":
            this._handleSERIAL(oEvent);
            break;
          default:
            break;
        }
      },

      _handleLABEL: function (oEvent) {
        let PONumber = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().PoNumber;
        let Itemno = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().Itemno;
        let Postingquantity = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().Postingquantity;

        if (parseInt(Postingquantity) === 0 || Postingquantity === "") {
          this.displayMessage("Error", "Enter Posting Quantity.");
        } else {
          this.getModel("appView").setProperty("/layout", "ThreeColumnsEndExpanded"); //EndColumnFullScreen
          this.getRouter().navTo(
            "label",
            {
              PONumber: PONumber,
              Itemno: Itemno,
            }, {},
            true
          );
          this._bisThisSecondTimeInDetailPageFromBatchPage = true;
          this._diableInputFieldsInDetailPage(oEvent);
        }
      },

      _handleBATCH: function (oEvent) {
        this.getModel("appView").setProperty("/layout", "ThreeColumnsEndExpanded");
        let PONumber = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().PoNumber;
        let Itemno = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().Itemno;

        this.getRouter().navTo(
          "batch",
          {
            PONumber: PONumber,
            Itemno: Itemno,
          }, {},
          true
        );
        this._bisThisSecondTimeInDetailPageFromBatchPage = true;
        this._diableInputFieldsInDetailPage(oEvent);
      },

      _handleSERIAL: function (oEvent) {
        debugger;
        let PONumber = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().PoNumber;
        let Itemno = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().Itemno;

        let Postingquantity = oEvent.getSource().getBindingContext("poItemGlobalJsonModel").getObject().Postingquantity;

        if (parseInt(Postingquantity) === 0 || Postingquantity === "") {
          this.displayMessage("Error", "Enter Posting Quantity.");
        } else {
          this.getModel("appView").setProperty("/layout", "ThreeColumnsEndExpanded");
          this.getRouter().navTo(
            "serial",
            {
              PONumber: PONumber,
              Itemno: Itemno,
            }, {},
            true
          );
          this._bisThisSecondTimeInDetailPageFromBatchPage = true;
          //get the global model and disable all input fields in the detail page.
          this._diableInputFieldsInDetailPage(oEvent);
        }
      },
      //disable input field before going to the third screen.
      _diableInputFieldsInDetailPage: function (oEvent) {
        let oGlobalModel = oEvent.getSource().getModel("poItemGlobalJsonModel");
        let oGlobalModelData = oGlobalModel.getProperty("/results");
        oGlobalModelData.map((item) => (item.isInputFieldEnabled = false));
        oGlobalModel.setProperty("/results", oGlobalModelData);
      },

      postingQuantityCheckInDetail: function (oEvent) {
        let oInputFieldPostingQtyControlRef = oEvent.getSource();

        let oDataOfCurrentRow = oEvent.getSource().getParent().getBindingContext("poItemGlobalJsonModel").getObject();
        let nOrderQuantity = parseInt(oDataOfCurrentRow.PoQuantity);
        let nReceivedQuantity = parseInt(oDataOfCurrentRow.Receivedquantity);
        let nPostingQtyValue = parseInt(oEvent.getParameter("value"));
        // console.log("posting qty value", nPostingQtyValue);

        if (nPostingQtyValue > nOrderQuantity - nReceivedQuantity) {
          this.removeStyleClassAndSetErrorState(oInputFieldPostingQtyControlRef, "Value greater than Order Qty"); //only for input_css
        } else if (nPostingQtyValue === 0) {
          this.removeStyleClassAndSetErrorState(oInputFieldPostingQtyControlRef, "Posting qty cannot be 0"); //only for input_css
        } else {
          this.addStyleClass(oInputFieldPostingQtyControlRef); //only for input_css
        }

        //if user changes the value of posting qty in serial type then remove the serial items and change the color of row to red.
        if (oDataOfCurrentRow.ItemType === "SERIAL")
          this._validateSERIALPostingQtyLiveChange(oDataOfCurrentRow, nPostingQtyValue);

        //validate LABEL field
        if (oDataOfCurrentRow.ItemType === "LABEL")
          this._validateLABELPostingQtyLiveChange(oDataOfCurrentRow, nPostingQtyValue);
      },

      _validateSERIALPostingQtyLiveChange: function (oDataOfCurrentRow, nPostingQtyValue) {
        // console.log("posting qty value", nPostingQtyValue);

        let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
        let data = oGlobalPoItemModel.getProperty("/results");

        let serialData = data.filter(
          (item) =>
            item.ItemType === "SERIAL" && parseInt(item.SubItemno) > 0 && item.Itemno === oDataOfCurrentRow.Itemno
        );
        data = data.filter((item) => !serialData.includes(item));
        //if user decides not to enter the value then remove the row color.
        if (!isNaN(nPostingQtyValue)) {
          //make the color of row red becasue the posting qty is changed.
          data.map((item) => {
            if (
              item.ItemType === "SERIAL" &&
              parseInt(item.SubItemno) === 0 &&
              oDataOfCurrentRow.Itemno === item.Itemno
            ) {
              // item.showColor = "RED"; // removing this property
              item.ButtonType = "Reject";
              item.SerialEnd = "";
              item.SerialStart = "";
              item.SerialPrefix = "";
              item.SerialSuffix = "";
              item.SerialStartCntr = null;
            }
          });
          //remove all subItems
          oGlobalPoItemModel.setProperty("/results", data);
        } else {
          //remove the color.
          data.map((item) => {
            if (
              item.ItemType === "SERIAL" &&
              parseInt(item.SubItemno) === 0 &&
              oDataOfCurrentRow.Itemno === item.Itemno
            ) {
              // item.showColor = "NOCOLOR"; removing this property
              item.ButtonType = "Default";
            }
          });
          oGlobalPoItemModel.setProperty("/results", data);
        }
      },

      _validateLABELPostingQtyLiveChange: function (oDataOfCurrentRow, nPostingQtyValue) {
        let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
        let data = oGlobalPoItemModel.getProperty("/results");

        if (!isNaN(nPostingQtyValue)) {
          if (oDataOfCurrentRow.LabelPrefix === "" || oDataOfCurrentRow.StartCounter === 0) {
            //make the color of row red becasue the posting qty is changed.
            data.map((item) => {
              if (item.ItemType === "LABEL" && oDataOfCurrentRow.Itemno === item.Itemno) {
                // item.showColor = "RED";
                item.ButtonType = "Reject";
              }
            });
          }
          oGlobalPoItemModel.setProperty("/results", data);
        }
        if (oDataOfCurrentRow.LabelPrefix !== "" && oDataOfCurrentRow.StartCounter > 0) {
          //calculate labelstart and label end and assign it to the global model and make the row color to green.
          data.map((item) => {
            if (item.ItemType === "LABEL" && oDataOfCurrentRow.Itemno === item.Itemno) {
              let nStartCounter = item.StartCounter;
              //assigning value to labelStart;
              item.LabelStart = nStartCounter.toString();
              nStartCounter -= 1;
              //assigning value to labelEnd;
              item.LabelEnd = (nStartCounter + nPostingQtyValue).toString();
              // item.showColor = "GREEN";
              item.ButtonType = "Default";
            }
          });
          oGlobalPoItemModel.setProperty("/results", data);
        }
        if (isNaN(nPostingQtyValue)) {
          //remove the color.
          data.map((item) => {
            if (item.ItemType === "LABEL" && oDataOfCurrentRow.Itemno === item.Itemno) {
              // item.showColor = "NOCOLOR";
              item.ButtonType = "Default";
            }
          });
          oGlobalPoItemModel.setProperty("/results", data);
        }
      },

      batchCheckInDetail: function (oEvent) {
        let sBatchValue = oEvent.getParameter("value");
        let oObjectContext = oEvent.getSource().getBindingContext("poItemGlobalJsonModel");
        let sPath = oObjectContext.getPath();
        let oObjectProperty = oObjectContext.getProperty(sPath);
        let oModel = oObjectContext.getModel();

        let oInputFieldBatchControlRef = oEvent.getSource();
        let referenceToRowCells = oEvent.getSource().getParent().getCells();
        let oPostingQtyControlRef = referenceToRowCells[8];

        if (sBatchValue.trim().length > 0) {
          //disable batch button.
          oObjectProperty.isButtonEnabled = false;
          oModel.setProperty(sPath, oObjectProperty);
          //remove error from batch field
          this.addStyleClass(oInputFieldBatchControlRef);

          //show error in posting qty
          if (isNaN(parseInt(oPostingQtyControlRef.getValue())))
            this.removeStyleClassAndSetErrorState(oPostingQtyControlRef, "Posting Qty Cannot Be Empty");
        } else {
          this.addStyleClass(oPostingQtyControlRef); //only for input_css
          // enable batch button.
          oObjectProperty.isButtonEnabled = true;
          oModel.setProperty(sPath, oObjectProperty);
        }
      },

      _createPrintLabelJsonModel: function () {
        const oJsonModel = new JSONModel({ results: [], oEntity: {} });
        this.setModel(oJsonModel, "oJsonPrintLabelModel");
      },

      _onPressPrintLabels: async function () {
        const oView = this.getView();
        if (!this._pValueHelpDialog) {
          this._pValueHelpDialog = await Fragment.load({
            id: oView.getId(),
            name: "com.wel.goodsreceipt.fragments.PrintLabels",
            controller: this
          })
        }
        oView.addDependent(this._pValueHelpDialog);
        this._pValueHelpDialog.open();

        this._clearSearchFieldAndFilters();

        if(!this._service.detailPrintLabel) {
          this.byId("printBtn").setEnabled(true);
        } else {
          this.byId("printBtn").setEnabled(false);
        }
      },

      _clearSearchFieldAndFilters: function () {
        this.byId("searchFieldId_printLabel").setValue("");
        const oTableControl = this.byId("idPrintLabelsTable");
        const oBinding = oTableControl.getBinding("items");
        oBinding.filter(null);
      },

      _getPrintLabelModelData: function (aPrintLabelData) {
        return aPrintLabelData.map(({ PoNumber, Materialno, ShortText, Storagebin }) => {
          return { PoNumber, Materialno, Description: ShortText, Storagebin, TotalCopies: 1 }
        })
      },

      onPressPrintLabelCancel: function () {
        this.byId("printLabelDialog").close();
        if (!this._service.detailPrintLabel) {
          this._onNavToMasterPage();
        }
        this._service.detailPrintLabel = false;
      },

      onPressPrintMaterial: async function () {
        const that = this;
        const busy = new BusyDialog();
        busy.open();

        this.byId("printLabelDialog").close();

        // Get the oEntity and results properties from the oJsonPrintLabelModel
        const { oEntity, results } = this.getModel("oJsonPrintLabelModel").getProperty("/");

        // Filter the print label data to include only items with a TotalCopies greater than 0
        const aFilteredPrintLabelData = results.filter(item => item.TotalCopies > 0);

        oEntity.POPrintLabelNav = aFilteredPrintLabelData;

        const sPath = '/POSet'

        // Try to post the data to the server, catch any errors and close the busy dialog in the finally block
        try {
          // console.log("oEntity", oEntity);
          const { Message: message } = await this.postDataToServer(sPath, oEntity);
          const Action = await this._showConfirmationMessage(message);
          if (Action === "OK") {
            if (!this._service.detailPrintLabel) {
              this.getModel("oJsonPrintLabelModel").setProperty("/", "");
              this._onNavToMasterPage();
            }
            this._service.detailPrintLabel = false;
          }
        } catch (error) {
          console.error(error);
          const ErrorMessage = JSON.parse(error.responseText);
          MessageBox.error(ErrorMessage.error.message.value, {
            actions: [MessageBox.Action.CLOSE],
            onClose: function (sAction) {
              if (!that._service.detailPrintLabel) {
                that._onNavToMasterPage();
                this._service.detailPrintLabel = false;
              }
            }
          });

        } finally {
          busy.close();
        }
      },

      _showConfirmationMessage: function (sMessage) {
        return new Promise((fnResolve, fnReject) => {
          MessageBox.success(sMessage, {
            actions: [MessageBox.Action.OK],
            onClose: fnResolve,
          });
        });
      },

      onPrintButtonPress: async function () {
        // Set the detailPrintLabel property to true
        this._service.detailPrintLabel = true;

        // Get the global model data
        const globalModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel").getProperty('/results');

        // Get the print data and set the TotalCopies property to 0 for each item
        const aPrintData = this._getPrintLabelModelData(globalModel);
        aPrintData.forEach(item => item.TotalCopies = 0);

        // Get the print model and set the results property with the print data
        const oPrintModel = await this.getModel("oJsonPrintLabelModel")
        oPrintModel.setProperty('/results', aPrintData);

        // Get the PO header data and remove the POItemNav and __metadata properties
        const poHeaderData = this.getView().getModel("poHeaderJson").getProperty("/");
        const { POItemNav, __metadata, ...oEntity } = poHeaderData;

        // Set the oEntity property in the print model
        oPrintModel.setProperty('/oEntity', oEntity);

        // call the function to press the print labels
        this._onPressPrintLabels();

      },

      _onNavToMasterPage: function () {
        this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
        this.getRouter().navTo("master", {}, {}, true);
      },

      _debounceSearch: function (sValue, oBinding) {
        const aPaths = ["Descriptions", "Materialno", "Storagebin"];
        let aFilters;

        if (sValue && sValue.length > 0) {
          aFilters = aPaths.map((path) => new Filter({
            path: path,
            operator: FilterOperator.Contains,
            value1: sValue,
          }));
        }

        oBinding.filter(new Filter({ filters: aFilters, and: false }));
      },

      onStepInputValueChange: function (oEvent) {
        const oPrintModel = this.getModel("oJsonPrintLabelModel").getProperty(
          "/results"
        );
        const isValidData = oPrintModel.some((item) => item.TotalCopies > 0);

        this.byId("printBtn").setEnabled(isValidData);
      },

      onSearchLabelPrintTable: function (oEvent) {
        const sValue = oEvent.getParameter("newValue");
        const oTableControl = oEvent.getSource().getParent().getParent();
        const oBinding = oTableControl.getBinding("items");
        const DEBOUNCE_TIMEOUT = 500; // in milliseconds

        // Debounce the search function
        if (this._TimerId) {
          clearTimeout(this._TimerId);
        }
        
        this._TimerId = setTimeout(() => {
          this._debounceSearch(sValue, oBinding);
        }, DEBOUNCE_TIMEOUT);
      },
    });
  }
);
