import * as XLSX from "xlsx"

function downloadExcelFile(workbook: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([wbout], { type: "application/octet-stream" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getAmountFromRow(row: any, columnNames: string[]): number {
  for (const colName of columnNames) {
    const value = row[colName]
    if (value !== undefined && value !== null && value !== "") {
      const parsed = Number.parseFloat(
        String(value)
          .toString()
          .replace(/[^\d.-]/g, ""),
      )
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }
  return 0
}

// Export Products to Excel
export function exportProductsToExcel(products: any[], vendors: any[]) {
  const workbook = XLSX.utils.book_new()

  // Create products sheet
  const productsData = products.map((product) => {
    const vendor = vendors.find((v) => v.id === product.vendorId)
    return {
      "Product Name": product.name,
      SKU: product.sku,
      Category: product.category,
      "Unit Price": product.unitPrice,
      "Cost Price": product.costPrice,
      Stock: product.stock,
      Vendor: vendor?.name || "N/A",
      Description: product.description,
      "Total Value": product.unitPrice * product.stock,
      "Profit Margin": (((product.unitPrice - product.costPrice) / product.costPrice) * 100).toFixed(2) + "%",
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(productsData)
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

  downloadExcelFile(workbook, `Products_${new Date().toISOString().split("T")[0]}.xlsx`)
}

// Export Customers to Excel
export function exportCustomersToExcel(customers: any[], invoices: any[]) {
  const workbook = XLSX.utils.book_new()

  const customersData = customers.map((customer) => {
    const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id)
    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalOrders = customerInvoices.length

    return {
      "Customer Name": customer.name,
      Email: customer.email,
      Phone: customer.phone,
      Address: customer.address,
      "Total Orders": totalOrders,
      "Total Spent": totalSpent.toFixed(2),
      "Average Order Value": totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : "0.00",
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(customersData)
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers")

  downloadExcelFile(workbook, `Customers_${new Date().toISOString().split("T")[0]}.xlsx`)
}

// Export Vendors to Excel
export function exportVendorsToExcel(vendors: any[], products: any[]) {
  const workbook = XLSX.utils.book_new()

  const vendorsData = vendors.map((vendor) => {
    const vendorProducts = products.filter((p) => p.vendorId === vendor.id)
    const totalInventoryValue = vendorProducts.reduce((sum, p) => sum + p.unitPrice * p.stock, 0)
    const totalCostValue = vendorProducts.reduce((sum, p) => sum + p.costPrice * p.stock, 0)
    const potentialProfit = totalInventoryValue - totalCostValue

    return {
      "Vendor Name": vendor.name,
      Email: vendor.email,
      Phone: vendor.phone,
      Address: vendor.address,
      City: vendor.city || "N/A",
      "Total Products": vendorProducts.length,
      "Total Inventory Value": totalInventoryValue.toFixed(2),
      "Total Cost Value": totalCostValue.toFixed(2),
      "Potential Profit": potentialProfit.toFixed(2),
      "Created Date": vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "N/A",
    }
  })

  const summarySheet = XLSX.utils.json_to_sheet(vendorsData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Vendors Summary")

  // Create detailed products by vendor sheet
  const vendorProductsData: any[] = []
  vendors.forEach((vendor) => {
    const vendorProducts = products.filter((p) => p.vendorId === vendor.id)
    vendorProducts.forEach((product) => {
      vendorProductsData.push({
        "Vendor Name": vendor.name,
        "Vendor Email": vendor.email,
        "Vendor Phone": vendor.phone,
        "Product Name": product.name,
        SKU: product.sku,
        Category: product.category,
        "Unit Price": product.unitPrice.toFixed(2),
        "Cost Price": product.costPrice.toFixed(2),
        "Stock Quantity": product.stock,
        "Inventory Value": (product.unitPrice * product.stock).toFixed(2),
        "Cost Value": (product.costPrice * product.stock).toFixed(2),
        "Profit Margin %":
          product.costPrice > 0
            ? (((product.unitPrice - product.costPrice) / product.costPrice) * 100).toFixed(2)
            : "0.00",
        Description: product.description || "",
      })
    })
  })

  const productsSheet = XLSX.utils.json_to_sheet(vendorProductsData)
  XLSX.utils.book_append_sheet(workbook, productsSheet, "Vendor Products Details")

  downloadExcelFile(workbook, `Vendors_${new Date().toISOString().split("T")[0]}.xlsx`)
}

// Export Invoices to Excel
export function exportInvoicesToExcel(invoices: any[], customers: any[], products: any[]) {
  const workbook = XLSX.utils.book_new()

  const invoicesData = invoices.map((invoice) => {
    const customer = customers.find((c) => c.name === invoice.customerName)
    const itemsDetails = invoice.items
      .map((item: any) => {
        const product = products.find((p) => p.id === item.productId)
        return `${product?.name || "Unknown"} (Qty: ${item.quantity})`
      })
      .join(", ")

    return {
      "Invoice ID": invoice.id,
      "Customer Name": invoice.customerName,
      "Customer Email": invoice.customerEmail,
      "Customer Phone": invoice.customerPhone || "N/A",
      Date: new Date(invoice.createdAt).toLocaleDateString(),
      Status: invoice.status,
      "Total Amount": invoice.totalAmount.toFixed(2),
      "Total Cost": invoice.totalCost.toFixed(2),
      "Total Profit": invoice.totalProfit.toFixed(2),
      "Profit %": invoice.profitPercentage.toFixed(1),
      "Items Count": invoice.items.length,
      "Items Details": itemsDetails,
    }
  })

  const mainSheet = XLSX.utils.json_to_sheet(invoicesData)
  XLSX.utils.book_append_sheet(workbook, mainSheet, "Invoices Summary")

  const itemsData: any[] = []
  invoices.forEach((invoice) => {
    invoice.items.forEach((item: any) => {
      const product = products.find((p) => p.id === item.productId)
      itemsData.push({
        "Invoice ID": invoice.id,
        "Customer Name": invoice.customerName,
        "Invoice Date": new Date(invoice.createdAt).toLocaleDateString(),
        "Product Name": product?.name || "Unknown",
        SKU: product?.sku || "N/A",
        Category: product?.category || "N/A",
        Quantity: item.quantity,
        "Cost Price (Per Unit)": (item.costPrice || 0).toFixed(2),
        "Sale Price (Per Unit)": (item.unitPrice || 0).toFixed(2),
        "Total Cost": (item.quantity * (item.costPrice || 0)).toFixed(2),
        "Total Sale": (item.quantity * (item.unitPrice || 0)).toFixed(2),
        "Item Profit": (item.quantity * ((item.unitPrice || 0) - (item.costPrice || 0))).toFixed(2),
        "Item Profit %":
          item.costPrice > 0 ? (((item.unitPrice - item.costPrice) / item.costPrice) * 100).toFixed(1) : "0.0",
        Description: product?.description || "",
        Vendor: products.find((p) => p.id === item.productId)?.vendorId ? "Listed" : "N/A",
      })
    })
  })

  const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
  XLSX.utils.book_append_sheet(workbook, itemsSheet, "Invoice Items Details")

  downloadExcelFile(workbook, `Invoices_${new Date().toISOString().split("T")[0]}.xlsx`)
}

// Export Daily Orders to Excel
export function exportDailyOrdersToExcel(orders: any[], customers: any[], selectedDate: Date) {
  const workbook = XLSX.utils.book_new()

  const ordersData = orders.map((order) => {
    const customer = customers.find((c) => c.id === order.customerId)
    return {
      "Order ID": order.id,
      Customer: order.customerName || "N/A",
      Email: order.customerEmail || "N/A",
      Date: new Date(order.createdAt).toLocaleDateString(),
      Time: new Date(order.createdAt).toLocaleTimeString(),
      Status: order.status || "pending",
      "Items Count": order.items?.length || 0,
      Total: (order.totalAmount || 0).toFixed(2),
      Profit: (order.totalProfit || 0).toFixed(2),
      "Profit %": (order.profitPercentage || 0).toFixed(1),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(ordersData)
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Orders")

  const dateStr = selectedDate.toISOString().split("T")[0]
  downloadExcelFile(workbook, `Daily_Orders_${dateStr}.xlsx`)
}

// Import Vendors from Excel
export function importVendorsFromExcel(
  file: File,
  onSuccess: (vendors: any[]) => void,
  onError: (error: string) => void,
) {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const vendors = jsonData.map((row: any) => ({
        id: Date.now() + Math.random(),
        name: row["Vendor Name"] || row["Name"] || "",
        email: row["Email"] || "",
        phone: row["Phone"] || "",
        address: row["Address"] || "",
        city: row["City"] || "",
        createdAt:
          row["Created At"] || row["Created Date"]
            ? new Date(row["Created At"] || row["Created Date"]).toISOString()
            : new Date().toISOString(),
      }))

      onSuccess(vendors)
    } catch (error) {
      onError("Failed to parse Excel file. Please check the format.")
    }
  }

  reader.onerror = () => {
    onError("Failed to read file.")
  }

  reader.readAsArrayBuffer(file)
}

// Import Products from Excel
export function importProductsFromExcel(
  file: File,
  vendors: any[],
  onSuccess: (products: any[]) => void,
  onError: (error: string) => void,
) {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const products = jsonData.map((row: any) => {
        const vendorName = row["Vendor"] || row["Vendor Name"] || ""
        const vendor = vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())

        const unitPrice = getAmountFromRow(row, ["Unit Price", "Price", "Sale Price", "Unit"])
        const costPrice = getAmountFromRow(row, ["Cost Price", "Cost", "Purchase Price"])
        const stock = Number.parseInt(row["Stock"] || row["Quantity"] || "0") || 0

        return {
          id: Date.now() + Math.random(),
          name: row["Product Name"] || row["Name"] || "",
          sku: row["SKU"] || "",
          category: row["Category"] || "",
          unitPrice: unitPrice,
          costPrice: costPrice,
          stock: stock,
          vendorId: vendor?.id || null,
          description: row["Description"] || "",
          purchaseHistory: [],
          salesHistory: [],
        }
      })

      onSuccess(products)
    } catch (error) {
      onError("Failed to parse Excel file. Please check the format.")
    }
  }

  reader.onerror = () => {
    onError("Failed to read file.")
  }

  reader.readAsArrayBuffer(file)
}

// Import Customers from Excel
export function importCustomersFromExcel(
  file: File,
  onSuccess: (customers: any[]) => void,
  onError: (error: string) => void,
) {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const customers = jsonData.map((row: any) => ({
        id: Date.now() + Math.random(),
        name: row["Customer Name"] || row["Name"] || "",
        email: row["Email"] || "",
        phone: row["Phone"] || "",
        address: row["Address"] || "",
        type: (row["Type"] || "new").toLowerCase() === "frequent" ? "frequent" : "new",
        createdAt:
          row["Created At"] || row["Created Date"]
            ? new Date(row["Created At"] || row["Created Date"]).toISOString()
            : new Date().toISOString(),
      }))

      onSuccess(customers)
    } catch (error) {
      onError("Failed to parse Excel file. Please check the format.")
    }
  }

  reader.onerror = () => {
    onError("Failed to read file.")
  }

  reader.readAsArrayBuffer(file)
}

// Import Invoices from Excel
export function importInvoicesFromExcel(
  file: File,
  onSuccess: (invoices: any[]) => void,
  onError: (error: string) => void,
) {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const invoices = jsonData.map((row: any) => ({
        id: `${row["Invoice ID"] || "INV"}_${Date.now()}`,
        customerName: row["Customer Name"] || "",
        customerEmail: row["Customer Email"] || "",
        customerPhone: row["Customer Phone"] || "",
        trackingId: row["Tracking ID"] || "",
        createdAt: row["Date"] ? new Date(row["Date"]).toISOString() : new Date().toISOString(),
        status: row["Status"] || "pending",
        totalAmount: getAmountFromRow(row, ["Total Amount", "Total Sale", "Amount", "Total"]),
        totalCost: getAmountFromRow(row, ["Total Cost", "Cost", "Total Cost"]),
        totalProfit: getAmountFromRow(row, ["Total Profit", "Profit", "Net Profit"]),
        profitPercentage: getAmountFromRow(row, ["Profit %", "Profit Percentage", "Margin %"]),
        currency: row["Currency"] || "Rs",
        items: [],
        notes: row["Notes"] || "",
      }))

      onSuccess(invoices)
    } catch (error) {
      onError("Failed to parse Excel file. Please check the format.")
    }
  }

  reader.onerror = () => {
    onError("Failed to read file.")
  }

  reader.readAsArrayBuffer(file)
}

// Export Customer Profit Analysis to Excel
export function exportCustomerProfitToExcel(invoices: any[], currentAppCurrency: string) {
  const workbook = XLSX.utils.book_new()

  // Calculate customer profit data
  const customerMap: {
    [customerName: string]: {
      totalSales: number
      totalCost: number
      totalProfit: number
      invoiceCount: number
      productSales: { [productName: string]: { qty: number; sales: number; cost: number; profit: number } }
      invoices: any[]
    }
  } = {}

  invoices.forEach((invoice) => {
    if (!customerMap[invoice.customerName]) {
      customerMap[invoice.customerName] = {
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        invoiceCount: 0,
        productSales: {},
        invoices: [],
      }
    }

    customerMap[invoice.customerName].totalSales += invoice.totalAmount
    customerMap[invoice.customerName].totalCost += invoice.totalCost
    customerMap[invoice.customerName].totalProfit += invoice.totalProfit
    customerMap[invoice.customerName].invoiceCount += 1
    customerMap[invoice.customerName].invoices.push(invoice)

    invoice.items.forEach((item: any) => {
      if (!customerMap[invoice.customerName].productSales[item.productName]) {
        customerMap[invoice.customerName].productSales[item.productName] = {
          qty: 0,
          sales: 0,
          cost: 0,
          profit: 0,
        }
      }
      customerMap[invoice.customerName].productSales[item.productName].qty += item.quantity
      customerMap[invoice.customerName].productSales[item.productName].sales += item.quantity * item.unitPrice
      customerMap[invoice.customerName].productSales[item.productName].cost += item.quantity * item.costPrice
      customerMap[invoice.customerName].productSales[item.productName].profit +=
        item.quantity * (item.unitPrice - item.costPrice)
    })
  })

  // Create Customer Summary Sheet
  const customerSummaryData = Object.entries(customerMap).map(([customerName, data]) => {
    const profitMargin = data.totalSales > 0 ? (data.totalProfit / data.totalSales) * 100 : 0
    return {
      "Customer Name": customerName,
      "Total Invoices": data.invoiceCount,
      "Total Sales": data.totalSales.toFixed(2),
      "Total Cost": data.totalCost.toFixed(2),
      "Total Profit": data.totalProfit.toFixed(2),
      "Profit Margin %": profitMargin.toFixed(2),
      "Avg Order Value": (data.totalSales / data.invoiceCount).toFixed(2),
    }
  })

  const summarySheet = XLSX.utils.json_to_sheet(customerSummaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Customer Summary")

  // Create Product-wise Sales Sheet
  const productWiseSalesData: any[] = []
  Object.entries(customerMap).forEach(([customerName, data]) => {
    Object.entries(data.productSales).forEach(([productName, productData]) => {
      productWiseSalesData.push({
        "Customer Name": customerName,
        "Product Name": productName,
        "Quantity Sold": productData.qty,
        "Total Sales": productData.sales.toFixed(2),
        "Total Cost": productData.cost.toFixed(2),
        "Product Profit": productData.profit.toFixed(2),
        "Profit Margin %": productData.cost > 0 ? ((productData.profit / productData.cost) * 100).toFixed(2) : "0.00",
      })
    })
  })

  const productSheet = XLSX.utils.json_to_sheet(productWiseSalesData)
  XLSX.utils.book_append_sheet(workbook, productSheet, "Product-wise Sales")

  // Create detailed invoices sheet
  const detailedInvoicesData: any[] = []
  Object.entries(customerMap).forEach(([customerName, data]) => {
    data.invoices.forEach((invoice) => {
      detailedInvoicesData.push({
        "Customer Name": customerName,
        "Invoice ID": invoice.id,
        Date: new Date(invoice.createdAt).toLocaleDateString(),
        "Invoice Amount": invoice.totalAmount.toFixed(2),
        "Invoice Cost": invoice.totalCost.toFixed(2),
        "Invoice Profit": invoice.totalProfit.toFixed(2),
        "Profit %": invoice.profitPercentage.toFixed(1),
        Status: invoice.status,
        "Items Count": invoice.items.length,
      })
    })
  })

  const detailedSheet = XLSX.utils.json_to_sheet(detailedInvoicesData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, "Invoice Details")

  downloadExcelFile(workbook, `Customer_Profit_Analysis_${new Date().toISOString().split("T")[0]}.xlsx`)
}
