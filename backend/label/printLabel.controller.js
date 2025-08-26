const express = require("express");
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const axios = require("axios");
const Order = require("../models/newOrder.model");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load Shipex logo once as a buffer for reuse
const shipexLogoPath = path.join(__dirname, "Shipex.jpg");
const shipexLogo = fs.readFileSync(shipexLogoPath);

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

    // Setup constants for page and label sizes
    const A4_WIDTH = 597.28;
    const A4_HEIGHT = 841.89;
    const maxLabelsPerPage = 4;
    const totalUnits = orderData.child_awb_numbers.length;

    // Quarter label size (1/4 A4 minus margins and gaps)
    const marginX = 20;
    const marginY = 18;
    const gap = 8;
    const labelW = (A4_WIDTH - marginX * 2) / 2 - gap;
    const labelH = (A4_HEIGHT - marginY * 2) / 2 - gap;

    // Check if a single label
    const isSingleLabel = totalUnits === 1;

    // Create PDFDocument with conditional page size
    const doc = new PDFDocument({
      size: isSingleLabel ? [labelW, labelH] : "A4",
      margin: 0,
    });
    doc.pipe(res);

    for (let i = 0; i < totalUnits; i++) {
      if (i > 0 && !isSingleLabel && i % maxLabelsPerPage === 0) doc.addPage();

      let offsetX = 0;
      let offsetY = 0;

      if (!isSingleLabel) {
        // Multiple labels per page layout (grid)
        const pos = i % maxLabelsPerPage;
        offsetX = marginX + (pos % 2) * (labelW + gap);
        offsetY = marginY + Math.floor(pos / 2) * (labelH + gap);

        // Draw label border
        doc.lineWidth(1.2).rect(offsetX, offsetY, labelW, labelH).stroke();
      } else {
        // Single label fills the whole page (page = label size)
        doc.rect(0, 0, labelW, labelH).fill("white"); // white background clear
        doc.lineWidth(1.2).rect(0, 0, labelW, labelH).stroke();
      }

      // --- Header: Shipex logo (left) & Partner logo (right) ---
      const headerH = 0.14 * labelH;
      doc.rect(offsetX, offsetY, labelW, headerH).stroke();

      const logoH = headerH * 0.8;
      const logoW = logoH * 2.3;
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
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fillColor("black")
          .text(
            orderData.deliveryPartner?.name || "Partner",
            offsetX + labelW - logoW - 16,
            offsetY + (headerH - logoH) / 2 + logoH / 2 - 10,
            { width: logoW, align: "right" }
          );
      }

      // --- ORDER INFO SECTION ---
      const infoPad = 16;
      const colGap = 5;
      const leftColW = (labelW - colGap - 2 * infoPad) / 2;
      const rightColW = leftColW;

      const modeH = 13;
      const barcodeH = 20;
      const barcodeTextH = 14;
      const minGap = 8;
      const rightColTotalH = modeH + barcodeH + barcodeTextH + minGap + 4;
      const infoH = rightColTotalH + 6;

      const infoY = offsetY + headerH;
      doc
        .moveTo(offsetX, infoY + infoH)
        .lineTo(offsetX + labelW, infoY + infoH)
        .stroke();

      // LEFT COLUMN
      let leftColX = offsetX + infoPad;
      let leftColStartY = infoY + 7;
      const labelWidth = 60;
      const valueWidth = leftColW - labelWidth - 9;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("black")
        .text("Order Date:", leftColX, leftColStartY, {
          width: labelWidth,
          align: "left",
          lineBreak: false,
        });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("black")
        .text(
          new Date(orderData.createdAt).toLocaleDateString("en-GB"),
          leftColX + labelWidth + 6,
          leftColStartY,
          { width: valueWidth, align: "left", lineBreak: false }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("black")
        .text("Invoice No.:", leftColX, leftColStartY + modeH + minGap, {
          width: labelWidth,
          align: "left",
          lineBreak: false,
        });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("black")
        .text(
          orderData.orderId || "",
          leftColX + labelWidth + 6,
          leftColStartY + modeH + minGap,
          { width: valueWidth, align: "left", lineBreak: false }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("black")
        .text(
          "Invoice Value:",
          leftColX,
          leftColStartY + 2 * (modeH + minGap),
          { width: labelWidth, align: "left", lineBreak: false }
        );
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("black")
        .text(
          orderData.productDetails[i]?.unitPrice || "",
          leftColX + labelWidth + 6,
          leftColStartY + 2 * (modeH + minGap),
          { width: valueWidth, align: "left", lineBreak: false }
        );

      // RIGHT COLUMN
      let rightColX = offsetX + infoPad + leftColW + colGap + 12;
      let rightStartY = infoY + 7;

      const singleLabelOrderBarcodeWidth = 100;
      const multiLabelOrderBarcodeWidth = rightColW - 18;
      const orderBarcodeWidth = isSingleLabel
        ? singleLabelOrderBarcodeWidth
        : multiLabelOrderBarcodeWidth;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("black")
        .text("Mode:", rightColX, rightStartY, {
          width: 40,
          align: "left",
          lineBreak: false,
        });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("black")
        .text(
          orderData.paymentDetails?.method || "",
          rightColX + 42,
          rightStartY,
          { width: rightColW - 42, align: "left", lineBreak: false }
        );

      const orderIdBarcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(orderData.orderId),
        scale: 2,
        height: barcodeH,
        includetext: false,
      });

      const barcodeY = rightStartY + modeH + minGap;
      doc.image(orderIdBarcodeBuffer, rightColX, barcodeY, {
        width: orderBarcodeWidth,
        height: barcodeH,
      });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("black")
        .text(String(orderData.orderId), rightColX, barcodeY + barcodeH + 2, {
          width: orderBarcodeWidth,
          align: "center",
        });

      // --- Barcode section ---
      const barcodeBlockY = infoY + infoH + 1;
      const barcodeSectionH = 0.14 * labelH;
      const barcodeW = (labelW - 44) / 2;
      const barcodePad = 24;
      const childBarcodeH = 33;
      const barcodeLabelGap = 5;
      const topPadding = 6;

      const barcodeAvailableHeight = barcodeSectionH - 2 * topPadding;
      const barcodeHeightForSingleLabel = Math.min(40, barcodeAvailableHeight);
      const barcodeHeightForMultiLabel = Math.min(15, barcodeAvailableHeight);
      const dktBarcodeHeight = isSingleLabel
        ? barcodeHeightForSingleLabel
        : barcodeHeightForMultiLabel;

      const masterBarcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(orderData.awb_number),
        scale: 2,
        height: dktBarcodeHeight,
        includetext: false,
      });
      const childBarcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(orderData.child_awb_numbers[i]),
        scale: 2,
        height: dktBarcodeHeight,
        includetext: false,
      });

      if (isSingleLabel) {
        const cellW = barcodeW;
        const cellH = barcodeSectionH;
        const cellY = barcodeBlockY;
        const combinedH = dktBarcodeHeight + barcodeLabelGap + barcodeTextH;

        const masterCenterYOffset = (cellH - combinedH) / 2;
        const childCenterYOffset = masterCenterYOffset;

        doc.image(
          masterBarcodeBuffer,
          offsetX + barcodePad + 8,
          cellY + masterCenterYOffset + topPadding,
          {
            width: cellW - 24,
            height: dktBarcodeHeight - 2,
          }
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("black")
          .text(
            `Master DKT No. : ${orderData.awb_number}`,
            offsetX + barcodePad + 10,
            cellY +
              masterCenterYOffset +
              topPadding +
              dktBarcodeHeight +
              barcodeLabelGap,
            { width: cellW - 24, align: "center" }
          );

        doc.image(
          childBarcodeBuffer,
          offsetX + barcodePad + cellW + 8,
          cellY + childCenterYOffset + topPadding,
          {
            width: cellW - 24,
            height: dktBarcodeHeight - 2,
          }
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("black")
          .text(
            `Child DKT No. : ${orderData.child_awb_numbers[i]}`,
            offsetX + barcodePad + cellW + 8,
            cellY +
              childCenterYOffset +
              topPadding +
              dktBarcodeHeight +
              barcodeLabelGap,
            { width: cellW - 24, align: "center" }
          );
      } else {
        doc.image(
          masterBarcodeBuffer,
          offsetX + barcodePad + 8,
          barcodeBlockY + 8,
          { width: barcodeW - 24, height: childBarcodeH }
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("black")
          .text(
            `Master DKT No. : ${orderData.awb_number}`,
            offsetX + barcodePad + 8,
            barcodeBlockY + 8 + childBarcodeH + 6,
            { width: barcodeW - 24, align: "center" }
          );
        doc.image(
          childBarcodeBuffer,
          offsetX + barcodePad + barcodeW + 8,
          barcodeBlockY + 8,
          { width: barcodeW - 24, height: childBarcodeH }
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("black")
          .text(
            `Child DKT No. : ${orderData.child_awb_numbers[i]}`,
            offsetX + barcodePad + barcodeW + 8,
            barcodeBlockY + 8 + childBarcodeH + 6,
            { width: barcodeW - 24, align: "center" }
          );
      }

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
        boxDimValRaw,
        orderData.applicableWeight || "",
      ];

      // Adjusted column widths: make Box Dimension wider
      const tblColWs = [
        labelW * 0.23, // Wt. per box
        labelW * 0.23, // No. of Box
        labelW * 0.3, // Box Dimension (wider)
        labelW * 0.24, // Total Weight
      ];
      const tblCellH = 20;
      const tblY = tableBlockY + 10;

      // Table headers (centered both horizontally and vertically)
      let colX = offsetX;
      doc.font("Helvetica-Bold").fontSize(9);
      tblLabels.forEach((lbl, idx) => {
        const colW = tblColWs[idx];
        doc.rect(colX, tblY - 2, colW, tblCellH).stroke();
        const textHeight = 9; // font size ~ text height
        const textY = tblY - 2 + (tblCellH - textHeight) / 2;
        doc.text(lbl, colX, textY, {
          width: colW,
          align: "center",
          lineBreak: false,
        });
        colX += colW;
      });

      // Table values
      colX = offsetX;
      doc.font("Helvetica").fontSize(9);
      tableCols.forEach((val, idx) => {
        const colW = tblColWs[idx];
        doc.rect(colX, tblY + tblCellH - 2, colW, tblCellH).stroke();
        doc.text(String(val), colX, tblY + tblCellH - 2 + 5, {
          width: colW,
          align: "center",
          lineBreak: false,
        });
        colX += colW;
      });

      // --- New Section (between table and address): LR No. left, Delivery Partner name right ---
      const newSectionY = tblY + 2 * tblCellH + 10;
      const newSectionH = 12;
      const halfWidth = labelW / 2;
      const paddingX = 16;

      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("LR No. :", offsetX + paddingX, newSectionY, {
        width: 45,
        align: "left",
        lineBreak: false,
      });
      doc.font("Helvetica").fontSize(9);
      doc.text(
        String(orderData.awb_number || ""),
        offsetX + paddingX + 50,
        newSectionY,
        { width: halfWidth - 50, align: "left", lineBreak: false }
      );

      doc.font("Helvetica-Bold").fontSize(9);
      doc.text(
        orderData.deliveryPartner?.name || "",
        offsetX + halfWidth + paddingX,
        newSectionY,
        { width: halfWidth - paddingX * 2, align: "left", lineBreak: false }
      );

      // --- Address block ---
      const addrBlockY = newSectionY + newSectionH + 10;
      const addrBlockH = labelH - (addrBlockY - offsetY);
      doc.rect(offsetX, addrBlockY, labelW, addrBlockH).stroke();
      const addrPad = 12,
        addrW = labelW - 2 * addrPad,
        addrTop = addrBlockY + 12;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Delivery Address", offsetX + addrPad, addrTop, {
          width: addrW,
          align: "left",
        });
      doc.font("Helvetica").fontSize(9);
      const deliveryAddrText = `${orderData.receiverAddress?.contactName || ""}
${orderData.receiverAddress?.address || ""}
${orderData.receiverAddress?.city || ""}, ${
        orderData.receiverAddress?.state || ""
      }, ${orderData.receiverAddress?.pinCode || ""}
${orderData.receiverAddress?.phoneNumber || ""}`;
      doc.text(deliveryAddrText, offsetX + addrPad, addrTop + 10, {
        width: addrW - 2,
        align: "left",
        ellipsis: true,
      });

      let gapY = addrTop + 16 + 38;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Pickup Address", offsetX + addrPad, gapY, {
          width: addrW,
          align: "left",
        });
      doc.font("Helvetica").fontSize(9);
      const pickupAddrText = `${orderData.pickupAddress?.contactName || ""}
${orderData.pickupAddress?.address || ""}
${orderData.pickupAddress?.city || ""}, ${
        orderData.pickupAddress?.state || ""
      }, ${orderData.pickupAddress?.pinCode || ""}
${orderData.pickupAddress?.phoneNumber || ""}`;
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
