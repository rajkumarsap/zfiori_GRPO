sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (
    Controller,
    History,
    MessageBox
) {
    "use strict";

    return Controller.extend("com.wel.goodsreceipt.controller.BaseController", {

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("master", {}, {}, true);
            }
        },

        getDataFromServer: function (sPath, urlParam, filter) {
            return new Promise((resolve, reject) => {
                let oDataModel = this.getOwnerComponent().getModel();

                let onSuccess = (oData) => {
                    // consoleinfo(`BaseController | getDataFromServer | Successfully retrieved data from server`);
                    resolve(oData);
                }

                let onError = (err) => {
                    // consolelog(`BaseController | getDataFromServer | Error getting data from server `);
                    reject(err);
                }

                oDataModel.read(sPath, {
                    urlParameters: urlParam,
                    filters: [filter],
                    success: onSuccess,
                    error: onError,
                    async: true
                });
            });
        },

        postDataToServer: function (sPath, oEntity) {
            return new Promise((resolve, reject) => {
                let oDataModel = this.getOwnerComponent().getModel();

                let onSuccess = (oData) => {
                    // consoleinfo(`BaseController | getDataFromServer | Successfully posted data to server`);
                    resolve(oData);
                }

                let onError = (err) => {
                    // consolelog(`BaseController | getDataFromServer | Error posting data to server `);
                    reject(err);
                }

                oDataModel.create(sPath, oEntity, {
                    success: onSuccess,
                    error: onError,
                    async: true
                });
            });
        },

        displayMessage: function (sType, sMsg) {
            switch (sType) {
                case "Error": MessageBox.error(sMsg);
                    break;
                case "Warning": MessageBox.warning(sMsg);
                    break;
                case "Alert": MessageBox.alert(sMsg);
                    break;
                case "Show": MessageBox.show(sMsg);
                    break;
                default:
                    break;
            }
        },

        addStyleClass: function (oControlRef) {
            oControlRef.addStyleClass("input_css");
            oControlRef.setValueState(sap.ui.core.ValueState.None);
        },

        removeStyleClassAndSetErrorState: function (oControlRef, sValueStateText) {
            oControlRef.removeStyleClass("input_css");
            oControlRef.setValueState(sap.ui.core.ValueState.Error);
            oControlRef.setValueStateText(sValueStateText);
        },

        enableInputFieldsInDetailPage: function () {
            let oGlobalPoItemModel = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
            let oGlobalModelData = oGlobalPoItemModel.getProperty("/results");
            oGlobalModelData.map((item) => {
                if (item.Issplit !== true) {
                    item.isInputFieldEnabled = true;
                }
                if (item.Issplit === true && item.ItemType === "SERIAL") {
                    item.isInputFieldEnabled = true;
                }
            });
            oGlobalPoItemModel.setProperty("/results", oGlobalModelData);
        },


        /**
         * This event adds event to mousewheel so that when scrolled on input field,
         * the numbers dont change.
         * @param {*} idOfInputField
         */
        disableScrollInInputFields: function (sIdOfInputField) {
            const oInput = this.byId(sIdOfInputField);
            oInput.attachBrowserEvent("mousewheel", function (oEvent) {
                oEvent.preventDefault();
            });
        },

    });
});