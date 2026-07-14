sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/FlexBox",
    "sap/m/Dialog",
    "sap/m/Text"
], function (
    Object,
    MessageBox,
    Button,
    FlexBox,
    Dialog,
    Text
) {
    "use strict";
    return Object.extend("com.wel.goodsreceipt.util.MessageController", {
        /**
         * Parse response object and show all errors in dialog
         * @public
         */
        handle: function (response, bCompact, resourceModel) {
            if (response.responseText) {

                //.getResourceBundle().getText("error.dialog.title");
                var payload = JSON.parse(response.responseText);
                var errorLines = [];
                if (payload.error) {
                    if (payload.error.innererror && payload.error.innererror.errordetails) {
                        //-display multiple messages if exists
                        var errors = payload.error.innererror.errordetails;
                        $.each(errors, function (idx, error) {
                            if (error.message && error.message.length > 0) {
                                errorLines.push(error.message);
                            }
                        });
                    };
                    if (payload.error.message) {
                        //-display leading message
                        var _self = this;
                        var msgText = payload.error.message.value;
                        var dialogHeader = "Error";
                        this.showFormattedTextInfo(dialogHeader, msgText, errorLines, bCompact);
                    }
                }
            }
        },

        showFormattedTextInfo: function (header, msgText, errorLines, bCompact) {

            let aContentArray = [];
            $.each(errorLines, function (idx, line) {
                aContentArray.push(new Text({ text: '-\t' + line + '\n\n' }))
            });

            this.oSuccessMessageDialog = new Dialog({
                type: sap.m.DialogType.Message,
                title: "Error",
                state: sap.ui.core.ValueState.Error,
                content: new FlexBox({
                    direction: sap.m.FlexDirection.Column,
                    items: aContentArray
                }),
                beginButton: new Button({
                    type: sap.m.ButtonType.Emphasized,
                    text: "Close",
                    press: function () {
                        this.oSuccessMessageDialog.close();
                    }.bind(this)
                })
            });
            this.oSuccessMessageDialog.open();
        }
    });
});