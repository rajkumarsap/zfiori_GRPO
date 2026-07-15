// sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (e, t) {
    
    
    
//     "use strict"; return e.extend("com.wel.goodsreceipt.controller.Serial", { onInit: function () {
//         console.log("line here "); 
        
        
//         this._isSmartMeter = null; this._serialPostingQuantity = null; this.getRouter().getRoute("serial").attachPatternMatched(this._onObjectSerialMatched, this) }, _onObjectSerialMatched: function (e) { this.PONumber = e.getParameter("arguments").PONumber; this.ItemNo = e.getParameter("arguments").Itemno; this._setupModelForSerial() }, _setupModelForSerial: function () { let e = this.getOwnerComponent().getModel("poItemGlobalJsonModel"); let r = e.getProperty("/results"); let s = r.filter(e => e.Itemno === this.ItemNo); this._isSmartMeter = s[0].IsSmartmeter; let i = parseInt(s[0].Postingquantity); this._serialPostingQuantity = i; let o = []; let n = []; s.forEach(e => { let t = {}; t.Itemno = e.Itemno; t.SubItemno = e.SubItemno; t.Serialno = e.Serialno; t.Issplit = e.Issplit; t.PoNumber = e.PoNumber; t.Postingquantity = e.Postingquantity; t.ItemType = e.ItemType; let r = JSON.parse(JSON.stringify(t)); o.push(r) }); if (!this._isSmartMeter) { if (o.length === 1) { n = this.constructNewRows(i, o) } else { let e = o.filter(e => parseInt(e.SubItemno) > 0 && e.Itemno === this.ItemNo); n = [...e] } let e = this.getView().byId("id_serial_table"); let r = new t({ results: n }); e.setModel(r, "serialJsonModel") } else { this._createSmartMeterSerialModel(o); this.getModel("oSmartMeterSerialModel").setProperty("/SerialStart", s[0].SerialStart); this.getModel("oSmartMeterSerialModel").setProperty("/SerialEnd", s[0].SerialEnd) } this.setHeaderData(s) }, constructNewRows: function (e, t) { let r = []; for (let s = 1; s <= e; s++) { let e = {}; e.Itemno = t[0].Itemno; e.SubItemno = s.toString(); e.Serialno = ""; e.Issplit = t[0].Issplit; e.PoNumber = t[0].PoNumber; e.Postingquantity = "1"; e.Serialno = t[0].Serialno; e.ItemType = t[0].ItemType; let i = JSON.parse(JSON.stringify(e)); r.push(i) } return r }, setHeaderData: function (e) { this.byId("id_serial_text_for_Materialno").setText(e[0].Materialno); this.byId("id_serial_text_for_ShortText").setText(e[0].ShortText); this.byId("idSmartVBox").setVisible(this._isSmartMeter); this.byId("id_serial_table").setVisible(!this._isSmartMeter) }, onCloseDetailPress: function () { this.enableInputFieldsInDetailPage(); this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false); this.getRouter().navTo("object", { PONumber: this.PONumber }, true) }, onSerialSaveButtonPress: function (e) { debugger; let t = this.getOwnerComponent().getModel("poItemGlobalJsonModel"); let r = t.getProperty("/results"); let s = []; let i = null; let o = []; if (!this._isSmartMeter) { let e = this.getView().byId("id_serial_table").getModel("serialJsonModel"); o = e.getProperty("/results"); i = this.highlightEmpltyFields(o) } else { i = this._checkSmartmeterSerailEmpty() } if (i === true) { this.displayMessage("Warning", this.getResourceBundle().getText("SerialFieldCannotBeEmpty")) } else { this.enableInputFieldsInDetailPage(); r.forEach(e => { if (e.Itemno === this.ItemNo && e.SubItemno > 0) { } else { if (e.Itemno === this.ItemNo && parseInt(e.SubItemno) === 0) { e.Issplit = true; e.ButtonType = "Default" } s.push(e) } }); debugger; if (!this._isSmartMeter) { console.log("new data is with only the original header items ", r); if (o.length > 0) { o.forEach(e => s.push(e)) } } else { const e = this.getModel("oSmartMeterSerialModel").getProperty("/"); const t = e.SerialStart; const r = e.SerialEnd; s.forEach(e => { if (this.ItemNo == e.Itemno) { const s = this.parseScanValue(t); e.SerialStart = t; e.SerialEnd = r; e.SerialPrefix = s[0]; e.SerialSuffix = s[2]; e.SerialStartCntr = Number(s[1]); e.Issplit = false } }); console.log(s) } t.setProperty("/results", s); console.log(t); this.onCloseDetailPress() } }, _checkSmartmeterSerailEmpty: function () { const e = this.getModel("oSmartMeterSerialModel").getProperty("/"); const t = e.SerialStart; const r = e.SerialEnd; if (!r && !t) { return true } else { return false } }, _constructRowsForSmartmeterSerial: function () { debugger; const e = this.getModel("oSmartMeterSerialModel").getProperty("/"); const t = e.SerialStart; const r = e.SerialEnd; const s = e.results; let i = []; for (let e = t, o = 1; e <= r; e++, o++) { let t = {}; t.Itemno = s[0].Itemno; t.SubItemno = o.toString(); t.Serialno = e.toString(); t.Issplit = false; t.PoNumber = s[0].PoNumber; t.Postingquantity = "1"; t.ItemType = s[0].ItemType; t.IsSmartmeter = true; i.push(t) } return i }, highlightEmpltyFields: function (e) { let t = false; e.forEach(e => { if (t === true) return; if (e.Serialno === "") { t = true } }); return t }, _createSmartMeterSerialModel: function (e) { const r = { SerialPrefix: "", SerialSuffix: "", SerialStartCntr: "", SerialStart: "", SerialEnd: "", results: e }; const s = new t(r); this.setModel(s, "oSmartMeterSerialModel") }, onInputValueHelpRequest: function (e) { debugger; var t = e.getSource(); const r = this.byId("idEndSerialInput"); if (sap.ndc && sap.ndc.BarcodeScanner) { sap.ndc.BarcodeScanner.scan(function (e) { console.log(e.text); t.setValue(e.text); r.setValue(Number(e.text) + Number(this._serialPostingQuantity) - 1) }, function (e) { sap.m.MessageToast.show("Scanning failed: " + e) }) } else { sap.m.MessageToast.show("Barcode scanning is not supported on this device.") } }, onSerialStartInputChange: function (e) { var t = e.getSource(); const r = this.byId("idEndSerialInput"); const s = t.getValue(); if (s) { const e = this.parseScanValue(s); r.setValue(e[0] + (Number(e[1]) + Number(this._serialPostingQuantity) - 1) + e[2]) } }, onScanSuccess: function (e) { const t = this; const r = e.getParameter("text"); const s = this.byId("idStartSerialInput"); const i = this.byId("idEndSerialInput"); if (r) { const e = this.parseScanValue(r); console.log("Scanned Value:", r); s.setValue(r); i.setValue(e[0] + (Number(e[1]) + Number(t._serialPostingQuantity) - 1) + e[2]) } else { sap.m.MessageToast.show("No barcode detected.") } }, parseScanValue: function (e) { const t = e.match(/^(\D+)?(\d+)(\D+)?$/); if (t) { return [t[1] || "", t[2], t[3] || ""] } else { return [] } } }) });
// //# sourceMappingURL=Serial.controller.js.map




sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (e, t) {
    "use strict";
    return e.extend("com.wel.goodsreceipt.controller.Serial", {
      onInit: function () {
        console.log("line here ");

        this._isSmartMeter = null;
        this._serialPostingQuantity = null;
        this.getRouter()
          .getRoute("serial")
          .attachPatternMatched(this._onObjectSerialMatched, this);
      },
      _onObjectSerialMatched: function (e) {
        this.PONumber = e.getParameter("arguments").PONumber;
        this.ItemNo = e.getParameter("arguments").Itemno;
        this._setupModelForSerial();
      },
      _setupModelForSerial: function () {
        let e = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
        let r = e.getProperty("/results");
        let s = r.filter((e) => e.Itemno === this.ItemNo);
        this._isSmartMeter = s[0].IsSmartmeter;
        let i = parseInt(s[0].Postingquantity);
        this._serialPostingQuantity = i;
        let o = [];
        let n = [];
        s.forEach((e) => {
          let t = {};
          t.Itemno = e.Itemno;
          t.SubItemno = e.SubItemno;
          t.Serialno = e.Serialno;
          t.Issplit = e.Issplit;
          t.PoNumber = e.PoNumber;
          t.Postingquantity = e.Postingquantity;
          t.ItemType = e.ItemType;
          let r = JSON.parse(JSON.stringify(t));
          o.push(r);
        });
        if (!this._isSmartMeter) {
          if (o.length === 1) {
            n = this.constructNewRows(i, o);
          } else {
            let e = o.filter(
              (e) => parseInt(e.SubItemno) > 0 && e.Itemno === this.ItemNo,
            );
            n = [...e];
          }
          let e = this.getView().byId("id_serial_table");
          let r = new t({ results: n });
          e.setModel(r, "serialJsonModel");
        } else {
          this._createSmartMeterSerialModel(o);
          this.getModel("oSmartMeterSerialModel").setProperty(
            "/SerialStart",
            s[0].SerialStart,
          );
          this.getModel("oSmartMeterSerialModel").setProperty(
            "/SerialEnd",
            s[0].SerialEnd,
          );
        }
        this.setHeaderData(s);
      },
      constructNewRows: function (e, t) {
        let r = [];
        for (let s = 1; s <= e; s++) {
          let e = {};
          e.Itemno = t[0].Itemno;
          e.SubItemno = s.toString();
          e.Serialno = "";
          e.Issplit = t[0].Issplit;
          e.PoNumber = t[0].PoNumber;
          e.Postingquantity = "1";
          e.Serialno = t[0].Serialno;
          e.ItemType = t[0].ItemType;
          let i = JSON.parse(JSON.stringify(e));
          r.push(i);
        }
        return r;
      },
      setHeaderData: function (e) {
        this.byId("id_serial_text_for_Materialno").setText(e[0].Materialno);
        this.byId("id_serial_text_for_ShortText").setText(e[0].ShortText);
        this.byId("idSmartVBox").setVisible(this._isSmartMeter);
        this.byId("id_serial_table").setVisible(!this._isSmartMeter);
      },
      onCloseDetailPress: function () {
        this.enableInputFieldsInDetailPage();
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/endColumn/fullScreen",
          false,
        );
        this.getRouter().navTo("object", { PONumber: this.PONumber }, true);
      },
      onSerialSaveButtonPress: function (e) {
        debugger;
        let t = this.getOwnerComponent().getModel("poItemGlobalJsonModel");
        let r = t.getProperty("/results");
        let s = [];
        let i = null;
        let o = [];
        if (!this._isSmartMeter) {
          let e = this.getView()
            .byId("id_serial_table")
            .getModel("serialJsonModel");
          o = e.getProperty("/results");
          i = this.highlightEmpltyFields(o);
        } else {
          i = this._checkSmartmeterSerailEmpty();
        }
        if (i === true) {
          this.displayMessage(
            "Warning",
            this.getResourceBundle().getText("SerialFieldCannotBeEmpty"),
          );
        } else {
          this.enableInputFieldsInDetailPage();
          r.forEach((e) => {
            if (e.Itemno === this.ItemNo && e.SubItemno > 0) {
            } else {
              if (e.Itemno === this.ItemNo && parseInt(e.SubItemno) === 0) {
                e.Issplit = true;
                e.ButtonType = "Default";
              }
              s.push(e);
            }
          });
          debugger;
          if (!this._isSmartMeter) {
            console.log("new data is with only the original header items ", r);
            if (o.length > 0) {
              o.forEach((e) => s.push(e));
            }
          } else {
            const e = this.getModel("oSmartMeterSerialModel").getProperty("/");
            const t = e.SerialStart;
            const r = e.SerialEnd;
            s.forEach((e) => {
              if (this.ItemNo == e.Itemno) {
                const s = this.parseScanValue(t);
                e.SerialStart = t;
                e.SerialEnd = r;
                e.SerialPrefix = s[0];
                e.SerialSuffix = s[2];
                e.SerialStartCntr = Number(s[1]);
                e.Issplit = false;
              }
            });
            console.log(s);
          }
          t.setProperty("/results", s);
          console.log(t);
          this.onCloseDetailPress();
        }
      },
      _checkSmartmeterSerailEmpty: function () {
        const e = this.getModel("oSmartMeterSerialModel").getProperty("/");
        const t = e.SerialStart;
        const r = e.SerialEnd;
        if (!r && !t) {
          return true;
        } else {
          return false;
        }
      },
      _constructRowsForSmartmeterSerial: function () {
        debugger;
        const e = this.getModel("oSmartMeterSerialModel").getProperty("/");
        const t = e.SerialStart;
        const r = e.SerialEnd;
        const s = e.results;
        let i = [];
        for (let e = t, o = 1; e <= r; e++, o++) {
          let t = {};
          t.Itemno = s[0].Itemno;
          t.SubItemno = o.toString();
          t.Serialno = e.toString();
          t.Issplit = false;
          t.PoNumber = s[0].PoNumber;
          t.Postingquantity = "1";
          t.ItemType = s[0].ItemType;
          t.IsSmartmeter = true;
          i.push(t);
        }
        return i;
      },
      highlightEmpltyFields: function (e) {
        let t = false;
        e.forEach((e) => {
          if (t === true) return;
          if (e.Serialno === "") {
            t = true;
          }
        });
        return t;
      },
      _createSmartMeterSerialModel: function (e) {
        const r = {
          SerialPrefix: "",
          SerialSuffix: "",
          SerialStartCntr: "",
          SerialStart: "",
          SerialEnd: "",
          results: e,
        };
        const s = new t(r);
        this.setModel(s, "oSmartMeterSerialModel");
      },
      onInputValueHelpRequest: function (e) {
        debugger;
        var t = e.getSource();
        const r = this.byId("idEndSerialInput");
        if (sap.ndc && sap.ndc.BarcodeScanner) {
          sap.ndc.BarcodeScanner.scan(
            function (e) {
              console.log(e.text);
              t.setValue(e.text);
              r.setValue(
                Number(e.text) + Number(this._serialPostingQuantity) - 1,
              );
            },
            function (e) {
              sap.m.MessageToast.show("Scanning failed: " + e);
            },
          );
        } else {
          sap.m.MessageToast.show(
            "Barcode scanning is not supported on this device.",
          );
        }
      },
      onSerialStartInputChange: function (e) {
        var t = e.getSource();
        const r = this.byId("idEndSerialInput");
        const s = t.getValue();
        if (s) {
          const e = this.parseScanValue(s);
          r.setValue(
            e[0] +
              (Number(e[1]) + Number(this._serialPostingQuantity) - 1) +
              e[2],
          );
        }
      },
      onScanSuccess: function (e) {
        const t = this;
        const r = e.getParameter("text");
        const s = this.byId("idStartSerialInput");
        const i = this.byId("idEndSerialInput");
        if (r) {
          const e = this.parseScanValue(r);
          console.log("Scanned Value:", r);
          s.setValue(r);
          i.setValue(
            e[0] + (Number(e[1]) + Number(t._serialPostingQuantity) - 1) + e[2],
          );
        } else {
          sap.m.MessageToast.show("No barcode detected.");
        }
      },
      parseScanValue: function (e) {
        const t = e.match(/^(\D+)?(\d+)(\D+)?$/);
        if (t) {
          return [t[1] || "", t[2], t[3] || ""];
        } else {
          return [];
        }
      },

       onFillRange: function () {
            debugger;
            console.log("fill range");

        }  
    });
  },
);
//# sourceMappingURL=Serial.controller.js.map
