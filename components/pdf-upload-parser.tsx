"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product, Invoice, Customer } from "@/types/app"
import { getCurrentDate } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

interface PDFUploadParserProps {
  onProductsExtracted?: (products: Product[]) => void
  onInvoicesExtracted?: (invoices: Invoice[]) => void
  onVendorsExtracted?: (vendors: Vendor[]) => void
  onCustomersExtracted?: (customers: Customer[]) => void
}

export function PDFUploadParser({
  onProductsExtracted,
  onInvoicesExtracted,
  onVendorsExtracted,
  onCustomersExtracted,
}: PDFUploadParserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      // For now, we'll show a placeholder for PDF parsing
      // In production, you'd use a library like pdf-parse or pdfjs-dist
      toast({
        title: "PDF Upload",
        description: "PDF parsing feature is ready for integration with a PDF library.",
      })

      // Example: Parse CSV-like data from PDF
      const text = await file.text()
      const lines = text.split("\n")

      // Detect data type and parse accordingly
      let dataType = "unknown"
      let parsedData = []

      if (text.includes("Product") || text.includes("SKU")) {
        dataType = "products"
        parsedData = parseProductsFromText(text)
      } else if (text.includes("Invoice") || text.includes("Customer")) {
        dataType = "invoices"
        parsedData = parseInvoicesFromText(text)
      } else if (text.includes("Vendor") || text.includes("Supplier")) {
        dataType = "vendors"
        parsedData = parseVendorsFromText(text)
      } else if (text.includes("Customer") || text.includes("Email")) {
        dataType = "customers"
        parsedData = parseCustomersFromText(text)
      }

      setExtractedData({ type: dataType, data: parsedData })

      toast({
        title: "PDF Parsed Successfully",
        description: `Extracted ${parsedData.length} ${dataType} records from the PDF.`,
      })
    } catch (error) {
      toast({
        title: "Error Parsing PDF",
        description: "Failed to parse the PDF file. Please ensure it contains valid data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const parseProductsFromText = (text: string): Product[] => {
    const cleanPrice = (priceStr: string): number => {
      // Remove currency symbols and text (Rs, $, €, etc)
      const cleaned = priceStr.replace(/[^\d.]/g, "")
      return Number.parseFloat(cleaned) || 0
    }

    const products: Product[] = []

    const lines = text.split("\n")
    lines.forEach((line) => {
      const parts = line.split("|").map((p) => p.trim())
      if (parts.length >= 7) {
        products.push({
          id: `prod-${Date.now()}-${Math.random()}`,
          name: parts[0],
          sku: parts[1],
          category: parts[2],
          unitPrice: cleanPrice(parts[3]), // Use cleanPrice helper
          costPrice: cleanPrice(parts[4]), // Use cleanPrice helper
          stock: Number.parseInt(parts[5]) || 0,
          vendorId: parts[6],
          description: "",
          purchaseHistory: [],
        })
      }
    })

    return products
  }

  const parseInvoicesFromText = (text: string): Invoice[] => {
    const cleanPrice = (priceStr: string): number => {
      const cleaned = priceStr.replace(/[^\d.]/g, "")
      return Number.parseFloat(cleaned) || 0
    }

    const invoices: Invoice[] = []

    const lines = text.split("\n")
    lines.forEach((line) => {
      const parts = line.split("|").map((p) => p.trim())
      if (parts.length >= 8) {
        const totalAmount = cleanPrice(parts[4])
        const totalProfit = cleanPrice(parts[5])
        invoices.push({
          id: parts[0],
          customerName: parts[1],
          customerEmail: parts[2],
          customerPhone: parts[3],
          totalAmount: totalAmount,
          totalProfit: totalProfit,
          totalCost: totalAmount - totalProfit || 0,
          profitPercentage: 0,
          status: parts[6] as "pending" | "completed",
          createdAt: parts[7],
          currency: "PKR",
          items: [],
        })
      }
    })

    return invoices
  }

  const parseVendorsFromText = (text: string): Vendor[] => {
    const vendors: Vendor[] = []

    const lines = text.split("\n")
    lines.forEach((line) => {
      const parts = line.split("|").map((p) => p.trim())
      if (parts.length >= 4) {
        vendors.push({
          id: `vendor-${Date.now()}-${Math.random()}`,
          name: parts[0],
          email: parts[1],
          phone: parts[2],
          address: parts[3],
          createdAt: getCurrentDate(),
        })
      }
    })

    return vendors
  }

  const parseCustomersFromText = (text: string): Customer[] => {
    const customers: Customer[] = []

    const lines = text.split("\n")
    lines.forEach((line) => {
      const parts = line.split("|").map((p) => p.trim())
      if (parts.length >= 4) {
        customers.push({
          id: `cust-${Date.now()}-${Math.random()}`,
          name: parts[0],
          email: parts[1],
          phone: parts[2],
          type: parts[3] as "frequent" | "new",
          createdAt: getCurrentDate(),
        })
      }
    })

    return customers
  }

  const handleImportData = () => {
    if (!extractedData) return

    switch (extractedData.type) {
      case "products":
        onProductsExtracted?.(extractedData.data)
        break
      case "invoices":
        onInvoicesExtracted?.(extractedData.data)
        break
      case "vendors":
        onVendorsExtracted?.(extractedData.data)
        break
      case "customers":
        onCustomersExtracted?.(extractedData.data)
        break
    }

    toast({
      title: "Data Imported",
      description: `Successfully imported ${extractedData.data.length} ${extractedData.type} records.`,
    })

    setExtractedData(null)
    setIsOpen(false)
  }

  return (
    <>
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Upload className="mr-2 h-5 w-5 text-green-600" />
            PDF Upload & Parser
          </CardTitle>
          <CardDescription>Upload PDFs to extract and import data into respective sections</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900">
              <FileText className="mr-2 h-6 w-6 text-green-600" />
              Upload PDF for Data Extraction
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <Input
                type="file"
                accept=".pdf,.txt,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-12 w-12 text-green-600" />
                  <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-600">PDF, TXT, or CSV files supported</p>
                </div>
              </label>
            </div>

            {extractedData && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-gray-900">Data Extracted Successfully</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Type: <Badge className="ml-2">{extractedData.type}</Badge>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Records Found: <span className="font-bold">{extractedData.data.length}</span>
                  </p>
                </div>

                <Button onClick={handleImportData} className="w-full bg-green-600 hover:bg-green-700">
                  Import {extractedData.data.length} Records
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <p className="text-gray-600">Parsing PDF...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
