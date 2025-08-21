const express = require("express");
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const axios = require("axios");
const Order = require("../models/newOrder.model");
const path = require("path");
const shipexLogo = path.join(__dirname, "Shipex.jpg");

const router = express.Router();

router.get("/generate-pdf/:id", async (req, res) => {
  try {
    const orderData = await Order.findOne({ _id: req.params.id });
    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    // Download delivery partner logo if available
    let deliveryLogoBuffer = null;
    if (orderData.deliveryPartner && orderData.deliveryPartner.logo) {
      try {
        const logoResponse = await axios.get(orderData.deliveryPartner.logo, {
          responseType: "arraybuffer",
        });
        deliveryLogoBuffer = Buffer.from(logoResponse.data, "binary");
      } catch (e) {
        console.error("Failed to fetch delivery partner logo:", e.message);
        deliveryLogoBuffer = null;
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=shipping_labels.pdf"
    );

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    const pageW = 595.28,
      pageH = 841.89;
    const maxLabelsPerPage = 4;
    const totalUnits = orderData.child_awb_numbers.length;

    let labelW, labelH, marginX, marginY;
    if (totalUnits === 1) {
      labelW = pageW - 48;
      labelH = labelW * (4 / 3);
      if (labelH > pageH - 48) {
        labelH = pageH - 48;
        labelW = labelH * (3 / 4);
      }
      marginX = (pageW - labelW) / 2;
      marginY = (pageH - labelH) / 2;
    } else {
      marginX = 20;
      marginY = 18;
      labelW = (pageW - marginX * 2) / 2 - 8;
      labelH = (pageH - marginY * 2) / 2 - 8;
    }

    for (let i = 0; i < totalUnits; i++) {
      if (i > 0 && i % maxLabelsPerPage === 0) doc.addPage();

      let offsetX, offsetY;
      if (totalUnits === 1) {
        offsetX = marginX;
        offsetY = marginY;
      } else {
        const pos = i % maxLabelsPerPage;
        offsetX = marginX + (pos % 2) * (labelW + 8);
        offsetY = marginY + Math.floor(pos / 2) * (labelH + 8);
      }

      doc.lineWidth(1.2).rect(offsetX, offsetY, labelW, labelH).stroke();

      // --- Header: Shipex logo (left) & Partner logo (right, if available) ---
      const headerH = 0.14 * labelH;
      doc.rect(offsetX, offsetY, labelW, headerH).stroke();

      const logoH = headerH * 0.8,
        logoW = logoH * 2.3;
      doc.image(shipexLogo, offsetX + 16, offsetY + (headerH - logoH) / 2, {
        width: logoW,
        height: logoH,
      });

      if (deliveryLogoBuffer) {
        doc.image(
          deliveryLogoBuffer,
          offsetX + labelW - logoW - 16,
          offsetY + (headerH - logoH) / 2,
          { width: logoW, height: logoH }
        );
      } else {
        doc.font("Helvetica-Bold").fontSize(14)
          .text(
            orderData.deliveryPartner?.name || "Partner",
            offsetX + labelW - logoW - 16,
            offsetY + (headerH - logoH) / 2 + logoH / 2 - 10,
            {
              width: logoW,
              align: "right",
            }
          );
      }

      // --- ORDER INFO SECTION (further reduced height and fixed layout) ---
      const infoPad = 16;
      const colGap = 5;
      const leftColW = (labelW - colGap - 2 * infoPad) / 2;
      const rightColW = leftColW;

      const modeH = 13;
      const barcodeH = 20;
      const barcodeTextH = 14;
      const minGap = 6;
      const rightColTotalH = modeH + barcodeH + barcodeTextH + minGap + 4;
      const infoH = rightColTotalH + 6;

      const infoY = offsetY + headerH;
      doc.moveTo(offsetX, infoY + infoH)
        .lineTo(offsetX + labelW, infoY + infoH)
        .stroke();

      // LEFT COLUMN (adjusted widths and fixed horizontal positions)
      let leftColX = offsetX + infoPad;
      let leftColStartY = infoY + 7;
      const labelWidth = 60;
      const valueWidth = leftColW - labelWidth - 9;

      doc.font("Helvetica-Bold").fontSize(9)
        .text("Order Date:", leftColX, leftColStartY, { width: labelWidth, align: "left", lineBreak: false, ellipsis: false });
      doc.font("Helvetica").fontSize(9)
        .text(
          new Date(orderData.createdAt).toLocaleDateString("en-GB"),
          leftColX + labelWidth + 6,
          leftColStartY,
          { width: valueWidth, align: "left", lineBreak: false, ellipsis: false }
        );

      doc.font("Helvetica-Bold").fontSize(9)
        .text("Invoice No.:", leftColX, leftColStartY + modeH + minGap, { width: labelWidth, align: "left", lineBreak: false, ellipsis: false });
      doc.font("Helvetica").fontSize(9)
        .text(
          orderData.orderId || "",
          leftColX + labelWidth + 6,
          leftColStartY + modeH + minGap,
          { width: valueWidth, align: "left", lineBreak: false, ellipsis: false }
        );

      doc.font("Helvetica-Bold").fontSize(9)
        .text("Invoice Value:", leftColX, leftColStartY + 2 * (modeH + minGap), { width: labelWidth, align: "left", lineBreak: false, ellipsis: false });
      doc.font("Helvetica").fontSize(9)
        .text(
          orderData.productDetails[i]?.unitPrice || "",
          leftColX + labelWidth + 6,
          leftColStartY + 2 * (modeH + minGap),
          { width: valueWidth, align: "left", lineBreak: false, ellipsis: false }
        );

      // RIGHT COLUMN
      let rightColX = offsetX + infoPad + leftColW + colGap;
      let rightStartY = infoY + 7;

      doc.font("Helvetica-Bold").fontSize(9)
        .text("Mode:", rightColX, rightStartY, { width: 40, align: "left", ellipsis: false, lineBreak: false });
      doc.font("Helvetica").fontSize(9)
        .text(
          orderData.paymentDetails?.method || "",
          rightColX + 42,
          rightStartY,
          { width: rightColW - 42, align: "left", ellipsis: false, lineBreak: false }
        );

      const orderIdBarcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(orderData.orderId),
        scale: 2,
        height: barcodeH,
        includetext: false,
      });
      const barcodeY = rightStartY + modeH + minGap;
      doc.image(orderIdBarcodeBuffer, rightColX, barcodeY, { width: rightColW - 18, height: barcodeH });
      doc.font("Helvetica").fontSize(9)
        .text(
          String(orderData.orderId),
          rightColX,
          barcodeY + barcodeH + 2,
          { width: rightColW - 18, align: "center" }
        );

      // --- Barcode section: increased height ---
      const barcodeBlockY = infoY + infoH + 1;
      const barcodeSectionH = 0.13 * labelH;
      const barcodeW = (labelW - 48) / 2,
        barcodePad = 24,
        childBarcodeH = 34;
      const masterBarcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(orderData.awb_number),
        scale: 2,
        height: 15,
        includetext: false,
      });
      doc.image(
        masterBarcodeBuffer,
        offsetX + barcodePad + 8,
        barcodeBlockY + 8,
        { width: barcodeW - 24, height: childBarcodeH }
      );
      doc.font("Helvetica-Bold").fontSize(9)
        .text(
          `Master DKT No. : ${orderData.awb_number}`,
          offsetX + barcodePad + 8,
          barcodeBlockY + 8 + childBarcodeH + 6,
          {
            width: barcodeW - 24,
            align: "center",
          }
        );

      const childBarcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(orderData.child_awb_numbers[i]),
        scale: 2,
        height: 15,
        includetext: false,
      });
      doc.image(
        childBarcodeBuffer,
        offsetX + barcodePad + barcodeW + 8,
        barcodeBlockY + 8,
        { width: barcodeW - 24, height: childBarcodeH }
      );
      doc.font("Helvetica-Bold").fontSize(9)
        .text(
          `Child DKT No. : ${orderData.child_awb_numbers[i]}`,
          offsetX + barcodePad + barcodeW + 8,
          barcodeBlockY + 8 + childBarcodeH + 6,
          {
            width: barcodeW - 24,
            align: "center",
          }
        );

      // --- Details Table section ---
      const tableBlockY = barcodeBlockY + barcodeSectionH + 8;
      const tableBlockH = 0.16 * labelH;
      const totalBox = orderData.packageDetails.length;
      const pkg =
        orderData.packageDetails[i] || orderData.packageDetails[0] || {};
      const vol = pkg.volumetricWeight || {};
      const boxDimValRaw = `${vol.length || ""} x ${vol.width || ""} x ${
        vol.height || ""
      }`;

      const tblLabels = [
        "Wt. per box",
        "No. of Box",
        "Box Dimension",
        "Total Weight",
      ];
      const tableCols = [
        pkg.weightPerBox || "",
        `${i + 1} / ${totalBox}`,
        boxDimValRaw.length > 12
          ? boxDimValRaw.substring(0, 12) + "..."
          : boxDimValRaw,
        orderData.applicableWeight || "",
      ];
      const tblColW = labelW / tableCols.length,
        tblY = tableBlockY + 10,
        tblCellH = 28;

      // Table headers
      doc.font("Helvetica-Bold").fontSize(9);
      tblLabels.forEach((lbl, idx) => {
        doc.rect(offsetX + idx * tblColW, tblY - 2, tblColW, tblCellH).stroke();
        doc.text(lbl, offsetX + idx * tblColW, tblY - 2 + tblCellH / 2 - 6, {
          width: tblColW,
          align: "center",
          baseline: "middle",
        });
      });

      // Table values - fully centered vertically and horizontally
      doc.font("Helvetica").fontSize(9);
      tableCols.forEach((val, idx) => {
        doc
          .rect(offsetX + idx * tblColW, tblY + tblCellH - 2, tblColW, tblCellH)
          .stroke();
        doc.text(
          String(val),
          offsetX + idx * tblColW,
          tblY + tblCellH - 2 + tblCellH / 2 - 6,
          {
            width: tblColW,
            align: "center",
            baseline: "middle",
            lineBreak: false,
            ellipsis: false,
          }
        );
      });

      // --- Address block ---
      const addrBlockY = tableBlockY + tableBlockH + 2;
      const addrBlockH = labelH - (addrBlockY - offsetY);
      doc.rect(offsetX, addrBlockY, labelW, addrBlockH).stroke();
      const addrPad = 12,
        addrW = labelW - 2 * addrPad,
        addrTop = addrBlockY + 12;

      // Delivery address
      doc.font("Helvetica-Bold").fontSize(10)
        .text("Delivery Address", offsetX + addrPad, addrTop, {
          width: addrW,
          align: "left",
        });
      doc.font("Helvetica").fontSize(9);
      let deliveryAddrText = `${
        orderData.receiverAddress?.contactName || ""
      }\n${orderData.receiverAddress?.address || ""}\n${
        orderData.receiverAddress?.city || ""
      }, ${orderData.receiverAddress?.state || ""}, ${
        orderData.receiverAddress?.pinCode || ""
      }\n${orderData.receiverAddress?.phoneNumber || ""}`;
      doc.text(deliveryAddrText, offsetX + addrPad, addrTop + 10, {
        width: addrW - 2,
        align: "left",
        ellipsis: true,
      });

      // Pickup address
      let gapY = addrTop + 16 + 38;
      doc.font("Helvetica-Bold").fontSize(10)
        .text("Pickup Address", offsetX + addrPad, gapY, {
          width: addrW,
          align: "left",
        });
      doc.font("Helvetica").fontSize(9);
      let pickupAddrText = `${orderData.pickupAddress?.contactName || ""}\n${
        orderData.pickupAddress?.address || ""
      }\n${orderData.pickupAddress?.city || ""}, ${
        orderData.pickupAddress?.state || ""
      }, ${orderData.pickupAddress?.pinCode || ""}\n${
        orderData.pickupAddress?.phoneNumber || ""
      }`;
      doc.text(pickupAddrText, offsetX + addrPad, gapY + 10, {
        width: addrW - 2,
        align: "left",
        ellipsis: true,
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});


module.exports = router;
