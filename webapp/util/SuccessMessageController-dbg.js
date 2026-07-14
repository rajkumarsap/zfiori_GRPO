sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox"
], function (Object, MessageBox) {
    "use strict";
    return Object.extend("com.wel.goodsreceipt.util.SuccessMessageController", {
        handle: function (responseMessage, MultiPleMessage, bCompact) {
            if (responseMessage) {
                var successLines = [];
                if (MultiPleMessage) {
                    //prepare split data
                    var MultiPleMessage = MultiPleMessage.split("\n");
                    MultiPleMessage = MultiPleMessage.filter(item => item != '');
                    MultiPleMessage.map((item) => item.trim());
                    MultiPleMessage.forEach((item) => successLines.push(item));
                }
                //-display leading message
                var msgText = responseMessage;
                var dialogHeader = "Success";
                return this.showFormattedTextInfo(dialogHeader, msgText, successLines, bCompact);
            }
        },

        showFormattedTextInfo: function (header, msgText, successLines, bCompact) {
            return new Promise(function (resolve, reject) {

                if (successLines && successLines.length >= 1) {
                    var details = "<ul>";
                    $.each(successLines, function (idx, line) {
                        details = details + '<li>' + line + '</li>';
                    });
                    details = details + '</ul>';

                    MessageBox.show(msgText, {
                        icon: MessageBox.Icon.SUCCESS,
                        title: header,
                        actions: [sap.m.MessageBox.Action.CLOSE],
                        details: details,
                        styleClass: bCompact ? "sapUiSizeCompact" : "",
                        onClose: function (oAction) {
                            if (oAction === "CLOSE")
                                resolve();
                        }
                    });
                } else {
                    MessageBox.show(msgText, {
                        icon: MessageBox.Icon.SUCCESS,
                        title: header,
                        styleClass: bCompact ? "sapUiSizeCompact" : "",
                        actions: [sap.m.MessageBox.Action.CLOSE],
                        onClose: function (oAction) {
                            if (oAction === "CLOSE")
                                resolve();
                        }
                    });
                }
            });
        }
    });
});