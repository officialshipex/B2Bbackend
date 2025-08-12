const PDFDocument = require('pdfkit');

const generateStyledInvoiceWithPages = (selectedItems, res) => {
  const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });

  pdfDoc.pipe(res);

  selectedItems.forEach((item, index) => {
    if (index > 0) pdfDoc.addPage(); 

    // pdfDoc.image('path/to/logo.png', 50, 30, { width: 100 }); 

    pdfDoc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Invoice', 400, 30, { align: 'right' });

    pdfDoc
      .fontSize(10)
    //   .text(`Invoice Number: ${item.invoiceNumber}`, 400, 50, { align: 'right' })
      .text(`Invoice Date: ${item.createdAt}`, 400, 65, { align: 'right' });

    pdfDoc.moveTo(50, 90).lineTo(550, 90).stroke();

    pdfDoc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Bill To:', 50, 100)
      .font('Helvetica')
      .text(`${item.Biling_details.firstName} ${item.Biling_details.lastName}`, 50, 115)
      .text(`${item.Biling_details.address}`, 50, 130)
      .text(`State Code: ${item.Biling_details.stateCode || '-'}`, 50, 145)
      .text(`GST No: ${item.Biling_details.gstNumber || '-'}`, 50, 160);

    pdfDoc
      .font('Helvetica-Bold')
      .text('Ship To:', 300, 100)
      .font('Helvetica')
      .text(`${item.shipping_details.firstName} ${item.shipping_details.lastName}`, 400, 115)
      .text(`${item.shipping_details.address}`, 400, 130)
      .text(`${item.shipping_details.pinCode}`, 400, 145);

    pdfDoc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Payment Method:', 50, 180)
      .font('Helvetica')
      .text(item.order_type, 150, 180)
      .font('Helvetica-Bold')
      .text('AWB No:', 50, 195)
      .font('Helvetica')
      .text(item.awb_number, 150, 195);

    pdfDoc
      .font('Helvetica-Bold')
      .text('Order Date:', 300, 180)
      .font('Helvetica')
    //   .text(item.order_date || '-', 400, 180)
      .font('Helvetica-Bold')
      .text('Shipped By:', 300, 195)
      .font('Helvetica')
    //   .text(item.shipper || '-', 400, 195);

    const tableTop = 220;
    pdfDoc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Product Name', 50, tableTop)
      .text('Product SKU', 150, tableTop)
      .text('HSN', 250, tableTop)
      .text('Quantity', 320, tableTop)
      .text('Unit Price', 380, tableTop)
      .text('Total', 450, tableTop);

    pdfDoc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Rows
    let yPosition = tableTop + 30;
    item.Product_details.forEach((product) => {
      pdfDoc
        .fontSize(10)
        .font('Helvetica')
        .text(product.product, 50, yPosition)
        .text(product.sku || '-', 150, yPosition)
        .text(product.hsn || '-', 250, yPosition)
        .text(product.quantity, 320, yPosition, { width: 40, align: 'right' })
        .text(`Rs. ${product.amount}`, 380, yPosition, { width: 60, align: 'right' })
        .text(`Rs. ${(product.quantity * product.amount)}`, 450, yPosition, { width: 60, align: 'right' });

      yPosition += 20;
    });

    yPosition += 20;
    pdfDoc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Charges Applied', 50, yPosition)
      .text('Tax Amount', 250, yPosition)
      .text('Total (Including GST)', 450, yPosition, { align: 'right' });

    yPosition += 20;
    pdfDoc
      .font('Helvetica')
      .text('Shipping Charges:', 50, yPosition)
    //   .text(`Rs. ${item.shipping_charges || '0.00'}`, 450, yPosition, { align: 'right' });

    yPosition += 15;
    pdfDoc
      .text('COD Charges:', 50, yPosition)
    //   .text(`Rs. ${item.cod_charges || '0.00'}`, 450, yPosition, { align: 'right' });

    yPosition += 30;
    pdfDoc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Amount:', 400, yPosition, { align: 'right' })
      .font('Helvetica')
      .text(`Rs. ${item.sub_total}`, 500, yPosition, { align: 'right' });

    
    pdfDoc
      .moveTo(50, 750)
      .lineTo(550, 750)
      .stroke();

    pdfDoc
      .fontSize(10)
      .text(`Page ${index + 1} of ${selectedItems.length}`, 50, 760, { align: 'center' });
  });

  pdfDoc.end();
};

module.exports = { generateStyledInvoiceWithPages };
