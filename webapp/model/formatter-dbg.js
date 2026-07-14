// jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");
// jQuery.sap.require("sap.ca.ui.model.format.DateFormat"); removed to check if everything works fine.
sap.ui.define(
    ["sap/ca/ui/model/format/NumberFormat", "sap/ca/ui/model/format/DateFormat"],
    function (NumberFormat, DateFormat) {
        "use strict";
        return {
            /*** Rounds the currency value to 2 digits
             * @public
             * @param {string} sValue value to be formatted
             * @returns {string} formatted currency value with 2 digits
             */
            currencyValue:
                function (sValue) {
                    if (!sValue) {
                        return "";
                    }
                    return parseFloat(sValue).toFixed(2);
                },
            oDateFormat: function (sValue) {
                if (sValue) {
                    var selectedDateFormat =
                        sap.ui.core.format.DateFormat.getDateInstance(
                            { style: "medium" },
                            sap.ui.getCore().getConfiguration().getLocale()
                        );
                    var formattedDate = selectedDateFormat.format(sValue);
                    return formattedDate;
                }
            },
            oColorFormat: function (sValue) {
                if (sValue === "1") {
                    return "Success";
                } else if (sValue === "A") {
                    return "Warning";
                } else if (sValue === "B") {
                    return "Error";
                } else {
                    return "None";
                }
            },
            roundNumberFormat: function (sValue) {
                var formattedValue = 0;
                var formatter;
                if (sValue) {
                    if (!isNaN(parseFloat(sValue)) && isFinite(sValue)) {
                        formatter = sap.ca.ui.model.format.NumberFormat.getInstance({
                            style: "standard",
                        });
                        formattedValue = formatter.format(sValue);
                    }
                }
                return formattedValue;
            },
            oSubItemCheck: function (sValue) {
                let nValue = parseInt(sValue);
                if (nValue === 0) {
                    return true;
                } else {
                    return false;
                }
            },
        };
    }
);
