"use client"

import type React from "react"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product, Customer, Vendor, Invoice } from "@/types/app"

interface ExcelImportParserProps {
  onImportProducts?: (products: Partial<Product>[]) => void
  onImportCustomers?: (customers: Partial<Customer>[]) => void
  onImportVendors?: (vendors: Partial<Vendor>[]) => void
  onImportInvoices?: (invoices: Partial<Invoice>[]) => void
}

export function ExcelImportParser({
  onImportProducts,
  onImportCustomers,
  onImportVendors,
  onImportInvoices,
}: ExcelImportParserProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setUploadStatus({ type: null, message: "" })

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)

      // Detect data type based on sheet names
      const sheetNames = workbook.SheetNames

      if (sheetNames.includes("Products") || sheetNames.includes("Purchase History")) {
        await parseProductsExcel(workbook)
      } else if (sheetNames.includes("Customers") || sheetNames.includes("Purchase History")) {
        await parseCustomersExcel(workbook)
      } else if (sheetNames.includes("Vendors") || sheetNames.includes("Products by Vendor")) {
        await parseVendorsExcel(workbook)
      } else if (sheetNames.includes("Invoices") || sheetNames.includes("Invoice Items")) {
        await parseInvoicesExcel(workbook)
      } else {
        throw new Error("Unable to detect data type from Excel file")
      }

      setUploadStatus({
        type: "success",
        message: "Excel file imported successfully!",
      })

      toast({
        title: "Import Successful",
        description: "Data has been imported from Excel file.",
      })
    } catch (error) {
      console.error("Error parsing Excel:", error)
      setUploadStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to parse Excel file",
      })

      toast({
        title: "Import Failed",
        description: "Failed to import data from Excel file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      event.target.value = ""
    }
  }

  const parseProductsExcel = async (workbook: XLSX.WorkBook) => {
    const productsSheet = workbook.Sheets["Products"]
    if (!productsSheet) throw new Error("Products sheet not found")

    const productsData = XLSX.utils.sheet_to_json(productsSheet)
    const products: Partial<Product>[] = productsData.map((row: any) => ({
      name: row["Product Name"],
      sku: row["SKU"],
      category: row["Category"],
      description: row["Description"] || "",
      unitPrice: Number.parseFloat(row["Unit Price"]) || 0,
      costPrice: Number.parseFloat(row["Cost Price"]) || 0,
      stock: Number.parseInt(row["Stock"]) || 0,
    }))

    if (onImportProducts) {
      onImportProducts(products)
    }
  }

  const parseCustomersExcel = async (workbook: XLSX.WorkBook) => {
    const customersSheet = workbook.Sheets["Customers"]
    if (!customersSheet) throw new Error("Customers sheet not found")

    const customersData = XLSX.utils.sheet_to_json(customersSheet)
    const customers: Partial<Customer>[] = customersData.map((row: any) => ({
      name: row["Name"],
      email: row["Email"],
      phone: row["Phone"],
      address: row["Address"] || "",
      type: row["Type"] || "one-time",
    }))

    if (onImportCustomers) {
      onImportCustomers(customers)
    }
  }

  const parseVendorsExcel = async (workbook: XLSX.WorkBook) => {
    const vendorsSheet = workbook.Sheets["Vendors"]
    if (!vendorsSheet) throw new Error("Vendors sheet not found")

    const vendorsData = XLSX.utils.sheet_to_json(vendorsSheet)
    const vendors: Partial<Vendor>[] = vendorsData.map((row: any) => ({
      name: row["Name"],
      email: row["Email"],
      phone: row["Phone"],
      address: row["Address"] || "",
    }))

    if (onImportVendors) {
      onImportVendors(vendors)
    }
  }

  const parseInvoicesExcel = async (workbook: XLSX.WorkBook) => {
    const invoicesSheet = workbook.Sheets["Invoices"]
    if (!invoicesSheet) throw new Error("Invoices sheet not found")

    const invoicesData = XLSX.utils.sheet_to_json(invoicesSheet)
    const invoices: Partial<Invoice>[] = invoicesData.map((row: any) => ({
      id: row["Invoice ID"],
      customerName: row["Customer Name"],
      customerEmail: row["Customer Email"],
      customerPhone: row["Customer Phone"],
      totalAmount: Number.parseFloat(row["Total Amount"]) || 0,
      totalProfit: Number.parseFloat(row["Total Profit"]) || 0,
      status: row["Status"] || "pending",
    }))

    if (onImportInvoices) {
      onImportInvoices(invoices)
    }
  }

  return (
    <Card className="bg-white border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          Import Data from Excel
        </CardTitle>
        <CardDescription>Upload an Excel file to import products, customers, vendors, or invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="excel-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Excel files (.xlsx, .xls)</p>
            </div>
            <input
              id="excel-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-sm text-blue-600">Processing Excel file...</p>
          </div>
        )}

        {uploadStatus.type === "success" && (
          <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600">{uploadStatus.message}</p>
          </div>
        )}

        {uploadStatus.type === "error" && (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{uploadStatus.message}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold">Supported formats:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Products: Must have "Products" sheet with columns (Product Name, SKU, Category, etc.)</li>
            <li>Customers: Must have "Customers" sheet with columns (Name, Email, Phone, etc.)</li>
            <li>Vendors: Must have "Vendors" sheet with columns (Name, Email, Phone, etc.)</li>
            <li>Invoices: Must have "Invoices" sheet with columns (Invoice ID, Customer Name, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
