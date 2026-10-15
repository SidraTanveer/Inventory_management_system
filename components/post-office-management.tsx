"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Search, Plus, Edit, Trash2, Download, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, generateId, getCurrentDate } from "@/lib/utils"
import { normalizeSearchText, searchMatchesAny } from "@/lib/search-utils"
import type { Customer, PostOfficeRecord } from "@/types/app"

interface PostOfficeManagementProps {
  records: PostOfficeRecord[]
  customers?: Customer[]
  onAddRecord: (record: PostOfficeRecord) => void
  onUpdateRecord: (record: PostOfficeRecord) => void
  onDeleteRecord: (id: string) => void
  onAddCustomerFromSlip?: (record: PostOfficeRecord) => void
}

const senderDetails = [
  "Noman Ali",
  "161/Z Scheme 3 Farid Town Sahiwal",
  "03110263606",
  "36502-1187762-7",
]

const getAddressLines = (value?: string) => {
  const raw = (value || senderDetails.join("\n")).trim()
  if (!raw) return [...senderDetails]

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const getDefaultForm = () => ({
  id: "",
  customerName: "",
  customerAddress: "",
  senderAddress: senderDetails.join("\n"),
  phone: "",
  complaintDetails: "",
  complaintDate: getCurrentDate(),
  vppEnabled: true,
  vppReceived: 0,
  invoiceNumber: "",
  invoiceAmount: 0,
  invoiceDate: getCurrentDate(),
})

export function PostOfficeManagement({ records, customers = [], onAddRecord, onUpdateRecord, onDeleteRecord, onAddCustomerFromSlip }: PostOfficeManagementProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [form, setForm] = useState(getDefaultForm())
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PostOfficeRecord | null>(records[0] || null)
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([])

  const customerMatches = useMemo(() => {
    const term = normalizeSearchText(customerSearchTerm)
    if (!term) return customers.slice(0, 6)

    return customers.filter((customer) => searchMatchesAny([customer.name, customer.phone, customer.email], term))
  }, [customers, customerSearchTerm])

  const filteredRecords = useMemo(() => {
    const term = normalizeSearchText(searchTerm)
    if (!term) return records

    return records.filter((record) =>
      searchMatchesAny(
        [
        record.customerName,
        record.customerAddress,
        record.senderAddress,
        record.phone,
        record.invoiceNumber,
        ],
        term,
      ),
    )
  }, [records, searchTerm])

  const totalVpp = records.reduce(
    (sum, record) => sum + (record.vppEnabled !== false ? Number(record.vppReceived || 0) : 0),
    0,
  )
  const totalInvoiceAmount = records.reduce((sum, record) => sum + Number(record.invoiceAmount || 0), 0)
  const complaintCount = records.filter((record) => (record.complaintDetails || "").trim().length > 0).length
  const recentRecords = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  const activeSenderAddress = getAddressLines(form.senderAddress || selectedRecord?.senderAddress)

  const resetForm = () => {
    setForm(getDefaultForm())
    setIsEditing(false)
  }

  const handleFormValue = (field: keyof ReturnType<typeof getDefaultForm>, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUseCustomerLookup = (customer: Customer) => {
    setCustomerSearchTerm(customer.name)
    setForm((prev) => ({
      ...prev,
      customerName: customer.name,
      phone: customer.phone,
      customerAddress: customer.address || prev.customerAddress || "",
      senderAddress: prev.senderAddress || senderDetails.join("\n"),
    }))
  }

  const handleSaveRecord = () => {
    if (!form.customerName.trim() || !form.customerAddress.trim() || !form.senderAddress.trim() || !form.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Customer name, address, sender address, and phone number are required.",
        variant: "destructive",
      })
      return
    }

    const normalizedRecord: PostOfficeRecord = {
      id: form.id || generateId(),
      customerName: form.customerName.trim(),
      customerAddress: form.customerAddress.trim(),
      senderAddress: form.senderAddress.trim() || "Noman Ali",
      phone: form.phone.trim(),
      complaintDetails: form.complaintDetails.trim(),
      complaintDate: form.complaintDate || getCurrentDate(),
      vppEnabled: form.vppEnabled,
      vppReceived: Number(form.vppReceived) || 0,
      invoiceNumber:
        form.invoiceNumber.trim() || `PO-${new Date().getFullYear()}-${String(records.length + 1).padStart(4, "0")}`,
      invoiceAmount: Number(form.invoiceAmount) || 0,
      invoiceDate: form.invoiceDate || getCurrentDate(),
      createdAt: isEditing ? records.find((item) => item.id === form.id)?.createdAt || getCurrentDate() : getCurrentDate(),
    }

    if (isEditing && form.id) {
      onUpdateRecord(normalizedRecord)
      toast({ title: "Record Updated", description: `${normalizedRecord.customerName} details were updated.` })
    } else {
      onAddRecord(normalizedRecord)
      toast({ title: "Record Saved", description: `${normalizedRecord.customerName} was saved successfully.` })
    }

    resetForm()
  }

  const handleEdit = (record: PostOfficeRecord) => {
    setSelectedRecord(record)
    setIsEditing(true)
    setForm({
      id: record.id,
      customerName: record.customerName,
      customerAddress: record.customerAddress,
      senderAddress: record.senderAddress,
      phone: record.phone,
      complaintDetails: record.complaintDetails,
      complaintDate: record.complaintDate,
      vppEnabled: record.vppEnabled !== false,
      vppReceived: record.vppReceived,
      invoiceNumber: record.invoiceNumber,
      invoiceAmount: record.invoiceAmount,
      invoiceDate: record.invoiceDate,
    })
  }

  const allFilteredRecordsSelected = filteredRecords.length > 0 && filteredRecords.every((record) => selectedRecordIds.includes(record.id))

  const handleToggleRecord = (recordId: string, checked: boolean) => {
    setSelectedRecordIds((current) =>
      checked ? [...new Set([...current, recordId])] : current.filter((id) => id !== recordId),
    )
  }

  const handleToggleFilteredRecords = (checked: boolean) => {
    const filteredIds = filteredRecords.map((record) => record.id)
    setSelectedRecordIds((current) =>
      checked
        ? [...new Set([...current, ...filteredIds])]
        : current.filter((id) => !filteredIds.includes(id)),
    )
  }

  const handleGenerateSelectedSlipsPdf = async () => {
    const selectedRecords = records.filter((record) => selectedRecordIds.includes(record.id))
    if (selectedRecords.length === 0) return

    try {
      selectedRecords.forEach((record) => {
        onAddCustomerFromSlip?.(record)
      })

      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const horizontalMargin = 3
      const verticalMargin = 4
      const horizontalGap = 2
      const verticalGap = 4
      const rowPadding = 1
      const columns = 4
      const rows = 2
      const cellWidth = (pageWidth - horizontalMargin * 2 - horizontalGap * (columns - 1)) / columns
      const cellHeight = (pageHeight - verticalMargin * 2 - verticalGap * (rows - 1)) / rows
      const scaleX = cellWidth / 150
      const scaleY = (cellHeight - rowPadding * 2) / 99
      const textScale = Math.min(scaleX, scaleY) * 1.26
      const slipWidth = cellWidth
      const slipHeight = cellHeight - rowPadding * 2

      selectedRecords.forEach((record, index) => {
        if (index > 0 && index % (columns * rows) === 0) doc.addPage()

        const positionInPage = index % (columns * rows)
        const column = positionInPage % columns
        const row = Math.floor(positionInPage / columns)
        const originX = horizontalMargin + column * (cellWidth + horizontalGap) + (cellWidth - slipWidth) / 2
        const originY = verticalMargin + row * (cellHeight + verticalGap) + (cellHeight - slipHeight) / 2
        const x = (value: number) => originX + value * scaleX
        const y = (value: number) => originY + value * scaleY
        const fontSize = (value: number) => doc.setFontSize(value * textScale + 2.25)
        const senderLines = getAddressLines(record.senderAddress)
        doc.setFont("helvetica", "normal")
        fontSize(9)
        const customerWidth = 140 * scaleX
        const addressLines = doc.splitTextToSize(record.customerAddress || "Customer Address", customerWidth)
        const customerNameLines = doc.splitTextToSize(record.customerName || "Customer Name", customerWidth)
        const addressStartY = 19 + customerNameLines.length * 5
        const customerPhoneY = addressStartY + addressLines.length * 4.5 + 2
        const dividerY = Math.max(40, customerPhoneY + 5)

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.7 * textScale)
        doc.roundedRect(originX, originY, slipWidth, slipHeight, 2 * textScale, 2 * textScale, "S")

        doc.setFont("helvetica", "bold")
        fontSize(8.5)
        doc.text("To,", x(5), y(9))

        doc.setFont("helvetica", "bold")
        fontSize(12)
        customerNameLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, x(5), y(17 + lineIndex * 5))
        })

        doc.setFont("helvetica", "normal")
        fontSize(9)
        addressLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, x(5), y(addressStartY + lineIndex * 4.5))
        })

        doc.text(record.phone || "Phone Number", x(5), y(customerPhoneY))
        doc.line(x(5), y(dividerY), x(142), y(dividerY))

        doc.setFont("helvetica", "bold")
        fontSize(8.6)
        doc.text("From,", x(5), y(dividerY + 7))

        doc.setFont("helvetica", "bold")
        fontSize(12)
        const senderName = senderLines[0] || "Noman Ali"
        doc.text(senderName, x(5), y(dividerY + 15))

        doc.setFont("helvetica", "normal")
        fontSize(8.6)
        senderLines.slice(1).forEach((line: string, lineIndex: number) => {
          doc.text(line, x(5), y(dividerY + 21 + lineIndex * 4.3))
        })

        doc.setFont("helvetica", "bold")
        fontSize(14)
        doc.text(
          record.vppEnabled === false ? "VPP: No" : `VPP Rs. ${Number(record.vppReceived || 0)}/-`,
          originX + slipWidth / 2,
          y(82),
          { align: "center" },
        )
      })

      doc.save(`post-office-slips-${new Date().toISOString().slice(0, 10)}.pdf`)

      toast({
        title: "Slips PDF Generated",
        description: `${selectedRecords.length} slips were downloaded in one PDF.`,
      })
    } catch (error) {
      console.error("Error generating post office PDF:", error)
      toast({
        title: "PDF Error",
        description: "Unable to generate the PDF invoice.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold">
              <Mail className="mr-3 h-8 w-8" /> Post Office Dashboard
            </h1>
            <p className="mt-2 text-violet-100">Track customer parcel details, complaints, sender addresses, and VPP records.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-white/15 px-3 py-1 text-sm text-white">Total Records: {records.length}</Badge>
            <Badge className="bg-emerald-500/80 px-3 py-1 text-sm text-white">VPP: {totalVpp}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Parcel Records</p>
            <h3 className="mt-2 text-3xl font-bold text-violet-700">{records.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total VPP</p>
            <h3 className="mt-2 text-3xl font-bold text-emerald-600">{totalVpp}</h3>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Complaint Cases</p>
            <h3 className="mt-2 text-3xl font-bold text-amber-600">{complaintCount}</h3>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Invoice Value</p>
            <h3 className="mt-2 text-3xl font-bold text-blue-600">{formatCurrency(totalInvoiceAmount, "PKR")}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Slip Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-none border-[3px] border-black bg-white p-4 text-black shadow-sm">
              <p className="text-2xl font-black">To,</p>
              <p className="mt-2 text-[clamp(2rem,4vw,4rem)] font-black leading-[0.95] tracking-tight">
                {form.customerName || selectedRecord?.customerName || "Customer Name"}
              </p>
              <p className="mt-2 text-[clamp(1.3rem,2vw,2.25rem)] font-black leading-[1.1] tracking-tight">
                {(form.customerAddress || selectedRecord?.customerAddress || "Customer Address").replace(/\n/g, " ")}
              </p>
              <p className="mt-2 text-[clamp(1.3rem,2vw,2.25rem)] font-black leading-[1.1] tracking-tight">
                {form.phone || selectedRecord?.phone || "03xx-xxxxxxx"}
              </p>

              <div className="my-5 border-t-[3px] border-black" />

              <p className="text-2xl font-black">From,</p>
              {activeSenderAddress.map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={`mt-2 font-black leading-[1.1] tracking-tight ${
                    index === 0 ? "text-[clamp(2rem,4vw,4rem)]" : "text-[clamp(1.3rem,2vw,2.25rem)]"
                  }`}
                >
                  {line}
                </p>
              ))}

              <div className="mt-6 flex items-center gap-4 text-[clamp(1.8rem,3vw,3rem)] font-black">
                {form.customerName || isEditing
                  ? form.vppEnabled
                    ? <><span>VPP Rs.</span><span className="inline-block min-h-14 min-w-24 border-[3px] border-black bg-white px-3 py-2 text-right">{form.vppReceived}</span></>
                    : <span>VPP: No</span>
                  : selectedRecord?.vppEnabled === false
                    ? <span>VPP: No</span>
                    : <><span>VPP Rs.</span><span className="inline-block min-h-14 min-w-24 border-[3px] border-black bg-white px-3 py-2 text-right">{selectedRecord?.vppReceived || 0}</span></>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Search className="mr-2 h-5 w-5 text-violet-600" /> Search Post Office Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by customer name, phone, address, or invoice"
              />

              <div className="space-y-3">
                <div>
                  <Label>Search Existing Customer</Label>
                  <Input
                    value={customerSearchTerm}
                    onChange={(event) => setCustomerSearchTerm(event.target.value)}
                    placeholder="Search customer by name, phone, or email"
                    list="post-office-customer-search"
                  />
                  <datalist id="post-office-customer-search">
                    {customerMatches.map((customer) => (
                      <option key={customer.id} value={customer.name} />
                    ))}
                  </datalist>
                </div>

                {customerMatches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customerMatches.slice(0, 5).map((customer) => (
                      <Button key={customer.id} type="button" variant="outline" size="sm" onClick={() => handleUseCustomerLookup(customer)}>
                        {customer.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={form.customerName}
                    onChange={(event) => handleFormValue("customerName", event.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={form.phone}
                    onChange={(event) => handleFormValue("phone", event.target.value)}
                    placeholder="03xx xxxxxxx"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Customer Address</Label>
                  <Input
                    value={form.customerAddress}
                    onChange={(event) => handleFormValue("customerAddress", event.target.value)}
                    placeholder="Full customer address"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Sender Address</Label>
                  <Input
                    value={form.senderAddress}
                    onChange={(event) => handleFormValue("senderAddress", event.target.value)}
                    placeholder="Noman Ali\n161/Z Scheme 3 Farid Town Sahiwal\n03110263606\n36502-1187762-7"
                  />
                </div>
                <div>
                  <Label>Complaint Date</Label>
                  <Input
                    type="date"
                    value={form.complaintDate}
                    onChange={(event) => handleFormValue("complaintDate", event.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label>VPP for this customer?</Label>
                  <RadioGroup
                    value={form.vppEnabled ? "yes" : "no"}
                    onValueChange={(value) => handleFormValue("vppEnabled", value === "yes")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="post-office-vpp-yes" value="yes" />
                      <Label htmlFor="post-office-vpp-yes">Yes, add VPP</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="post-office-vpp-no" value="no" />
                      <Label htmlFor="post-office-vpp-no">No VPP</Label>
                    </div>
                  </RadioGroup>
                  {form.vppEnabled && (
                    <div>
                      <Label htmlFor="post-office-vpp-amount">VPP Amount</Label>
                      <Input
                        id="post-office-vpp-amount"
                        type="number"
                        min={0}
                        value={form.vppReceived}
                        onChange={(event) => handleFormValue("vppReceived", Number(event.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    value={form.invoiceNumber}
                    onChange={(event) => handleFormValue("invoiceNumber", event.target.value)}
                    placeholder="PO-2026-0001"
                  />
                </div>
                <div>
                  <Label>Invoice Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.invoiceAmount}
                    onChange={(event) => handleFormValue("invoiceAmount", Number(event.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(event) => handleFormValue("invoiceDate", event.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Complaint Details</Label>
                  <Input
                    value={form.complaintDetails}
                    onChange={(event) => handleFormValue("complaintDetails", event.target.value)}
                    placeholder="Customer complaint issue and note"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleSaveRecord} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="mr-2 h-4 w-4" /> {isEditing ? "Update Record" : "Save Record"}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No matching post office records.
              </div>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{record.customerName}</p>
                      <Badge variant="secondary">
                        {record.vppEnabled === false ? "No VPP" : `${record.vppReceived} VPP`}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{record.phone}</p>
                    <p className="mt-1 text-sm text-slate-600">{record.customerAddress}</p>
                    <p className="mt-1 text-xs text-violet-700">Invoice: {record.invoiceNumber || "N/A"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl">Saved Customer Details</CardTitle>
          <Button onClick={handleGenerateSelectedSlipsPdf} disabled={selectedRecordIds.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Download Selected Slips ({selectedRecordIds.length})
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={allFilteredRecordsSelected}
                    onCheckedChange={(checked) => handleToggleFilteredRecords(checked === true)}
                    aria-label="Select all filtered slips"
                  />
                </TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Sender Address</TableHead>
                <TableHead>Complaint</TableHead>
                <TableHead>VPP</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecordIds.includes(record.id)}
                      onCheckedChange={(checked) => handleToggleRecord(record.id, checked === true)}
                      aria-label={`Select slip for ${record.customerName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{record.customerName}</TableCell>
                  <TableCell>{record.customerAddress}</TableCell>
                  <TableCell>{record.phone}</TableCell>
                  <TableCell>{record.senderAddress}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p>{record.complaintDetails || "No complaint"}</p>
                      <p className="text-xs text-slate-500">{record.complaintDate || "No date"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{record.vppEnabled === false ? "No VPP" : record.vppReceived}</TableCell>
                  <TableCell>
                    <div>
                      <p>{record.invoiceNumber || "N/A"}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(record.invoiceAmount || 0, "PKR")}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDeleteRecord(record.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
