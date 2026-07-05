"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Deal } from "@/types/app"
import { formatDate, getCurrentDate } from "@/lib/utils"
import { Search, Gift, Plus, Edit, Trash2, Download, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DealManagementProps {
  deals: Deal[]
  onAddDeal: (deal: Deal) => void
  onUpdateDeal: (deal: Deal) => void
  onDeleteDeal: (dealId: string) => void
  onDownloadDealPdf: (deal: Deal) => void
}

export function DealManagement({
  deals,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  onDownloadDealPdf,
}: DealManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // Form states
  const [dealName, setDealName] = useState("")
  const [dealDescription, setDealDescription] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState<number | string>("")
  const [expiryDate, setExpiryDate] = useState("")

  const { toast } = useToast()

  const filteredDeals = useMemo(() => {
    if (!searchTerm) return deals
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return deals.filter(
      (deal) =>
        deal.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        deal.description.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [deals, searchTerm])

  const dealStats = useMemo(() => {
    const now = new Date()
    const activeDeals = deals.filter((deal) => new Date(deal.expiryDate) > now)
    const expiredDeals = deals.filter((deal) => new Date(deal.expiryDate) <= now)
    const expiringSoon = deals.filter((deal) => {
      const expiryDate = new Date(deal.expiryDate)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0
    })

    const averageDiscount =
      deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.discountPercentage, 0) / deals.length : 0

    return {
      totalDeals: deals.length,
      activeDeals: activeDeals.length,
      expiredDeals: expiredDeals.length,
      expiringSoon: expiringSoon.length,
      averageDiscount,
    }
  }, [deals])

  const getDealStatus = (deal: Deal) => {
    const now = new Date()
    const expiryDate = new Date(deal.expiryDate)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (expiryDate <= now) {
      return { status: "expired", color: "bg-red-100 text-red-800", label: "Expired" }
    } else if (daysUntilExpiry <= 7) {
      return { status: "expiring", color: "bg-yellow-100 text-yellow-800", label: "Expiring Soon" }
    } else {
      return { status: "active", color: "bg-green-100 text-green-800", label: "Active" }
    }
  }

  const resetForm = () => {
    setDealName("")
    setDealDescription("")
    setDiscountPercentage("")
    setExpiryDate("")
    setEditingDeal(null)
  }

  const handleCreateDeal = () => {
    if (!dealName || !dealDescription || !discountPercentage || !expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      name: dealName,
      description: dealDescription,
      discountPercentage: Number(discountPercentage),
      expiryDate,
      createdAt: getCurrentDate(),
    }

    onAddDeal(newDeal)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setDealName(deal.name)
    setDealDescription(deal.description)
    setDiscountPercentage(deal.discountPercentage)
    setExpiryDate(deal.expiryDate)
    setIsEditDialogOpen(true)
  }

  const handleUpdateDeal = () => {
    if (!editingDeal || !dealName || !dealDescription || !discountPercentage || !expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const updatedDeal: Deal = {
      ...editingDeal,
      name: dealName,
      description: dealDescription,
      discountPercentage: Number(discountPercentage),
      expiryDate,
    }

    onUpdateDeal(updatedDeal)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteDeal = (dealId: string) => {
    onDeleteDeal(dealId)
    toast({
      title: "Deal Deleted",
      description: "The deal has been moved to trash.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Gift className="mr-3 h-8 w-8" />
              Deal Management
            </h1>
            <p className="text-orange-100">Create and manage special offers and discounts for your customers</p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Deal
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{dealStats.totalDeals}</div>
            <p className="text-sm text-gray-600">Total Deals</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{dealStats.activeDeals}</div>
            <p className="text-sm text-gray-600">Active Deals</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{dealStats.expiringSoon}</div>
            <p className="text-sm text-gray-600">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{dealStats.expiredDeals}</div>
            <p className="text-sm text-gray-600">Expired</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{dealStats.averageDiscount.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">Avg Discount</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Search className="mr-2 h-5 w-5 text-orange-600" />
            Search Deals
          </CardTitle>
          <CardDescription>Find deals by name or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search deals by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          {filteredDeals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-orange-50 to-red-50">
                    <TableHead className="font-semibold text-gray-700">Deal Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                    <TableHead className="font-semibold text-gray-700">Discount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Expiry Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => {
                    const dealStatus = getDealStatus(deal)
                    return (
                      <TableRow key={deal.id} className="hover:bg-orange-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{deal.name}</TableCell>
                        <TableCell className="max-w-xs truncate text-gray-600">{deal.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 text-green-600 mr-1" />
                            <span className="font-semibold text-green-600">{deal.discountPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(deal.expiryDate)}</TableCell>
                        <TableCell>
                          <Badge className={dealStatus.color}>{dealStatus.label}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(deal.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDeal(deal)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadDealPdf(deal)}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-gray-500 mb-4">No deals found matching your search</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Deal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Deal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dealName">Deal Name</Label>
              <Input
                id="dealName"
                placeholder="Enter deal name..."
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealDescription">Description</Label>
              <Textarea
                id="dealDescription"
                placeholder="Enter deal description..."
                value={dealDescription}
                onChange={(e) => setDealDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                placeholder="Enter discount percentage..."
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={getCurrentDate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeal}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDealName">Deal Name</Label>
              <Input
                id="editDealName"
                placeholder="Enter deal name..."
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDealDescription">Description</Label>
              <Textarea
                id="editDealDescription"
                placeholder="Enter deal description..."
                value={dealDescription}
                onChange={(e) => setDealDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDiscountPercentage">Discount Percentage</Label>
              <Input
                id="editDiscountPercentage"
                type="number"
                placeholder="Enter discount percentage..."
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editExpiryDate">Expiry Date</Label>
              <Input
                id="editExpiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={getCurrentDate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDeal}>Update Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
