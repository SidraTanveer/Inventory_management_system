"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertCircle, Undo2, Trash2, FolderOpen, Package, FileText, Building2, Gift } from "lucide-react"
import type { TrashItem, Product, Invoice, Deal, Vendor } from "@/types/app"
import { formatDate, getDaysSince } from "@/lib/utils"

interface TrashManagementProps {
  trashItems: TrashItem[]
  onRecoverItem: (trashItemId: string) => void
  onEmptyTrash: (itemIds?: string[]) => void
  currentAppCurrency: string
}

export function TrashManagement({ trashItems, onRecoverItem, onEmptyTrash, currentAppCurrency }: TrashManagementProps) {
  const [isConfirmEmptyDialogOpen, setIsConfirmEmptyDialogOpen] = useState(false)
  const [isConfirmDeleteOneDialogOpen, setIsConfirmDeleteOneDialogOpen] = useState(false)
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<TrashItem | null>(null)

  const getIconForType = (type: TrashItem["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4 text-blue-500" />
      case "invoice":
        return <FileText className="h-4 w-4 text-purple-500" />
      case "deal":
        return <Gift className="h-4 w-4 text-pink-500" />
      case "vendor":
        return <Building2 className="h-4 w-4 text-green-500" />
      default:
        return <FolderOpen className="h-4 w-4 text-gray-500" />
    }
  }

  const getItemName = (item: TrashItem) => {
    switch (item.type) {
      case "product":
      case "deal":
      case "vendor":
        return (item.data as Product | Deal | Vendor).name
      case "invoice":
        return `Invoice ${item.originalId} (${(item.data as Invoice).customerName})`
      default:
        return item.originalId
    }
  }

  const openConfirmDeleteOneDialog = (item: TrashItem) => {
    setItemToDeletePermanently(item)
    setIsConfirmDeleteOneDialogOpen(true)
  }

  const handlePermanentDeleteOne = () => {
    if (itemToDeletePermanently) {
      onEmptyTrash([itemToDeletePermanently.id])
      setIsConfirmDeleteOneDialogOpen(false)
      setItemToDeletePermanently(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Trash2 className="mr-3 h-8 w-8" />
              Trash Bin
            </h1>
            <p className="text-red-100">Recover or permanently delete items</p>
          </div>
          <Button
            onClick={() => setIsConfirmEmptyDialogOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            size="lg"
            disabled={trashItems.length === 0}
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Empty Trash Now
          </Button>
        </div>
      </div>

      <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
            Deleted Items
          </CardTitle>
          <CardDescription>Items in trash will be permanently deleted after 60 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {trashItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-red-50 to-orange-50">
                    <TableHead className="font-semibold text-gray-700">Item Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Deleted On</TableHead>
                    <TableHead className="font-semibold text-gray-700">Days In Trash</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashItems.map((item) => {
                    const daysInTrash = getDaysSince(item.deletedAt)
                    const daysRemaining = 60 - daysInTrash
                    return (
                      <TableRow key={item.id} className="hover:bg-red-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getIconForType(item.type)}
                            <p className="font-medium text-gray-900">{getItemName(item)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(item.deletedAt)}</TableCell>
                        <TableCell>
                          <span className={daysRemaining <= 7 ? "font-bold text-red-600" : "text-gray-600"}>
                            {daysInTrash} days ({daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"})
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRecoverItem(item.id)}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              <Undo2 className="h-4 w-4 mr-1" /> Recover
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDeleteOneDialog(item)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-gray-500 mb-4">Your trash bin is empty.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Empty Trash Dialog */}
      <Dialog open={isConfirmEmptyDialogOpen} onOpenChange={setIsConfirmEmptyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-700 flex items-center">
              <Trash2 className="mr-2 h-6 w-6" />
              Confirm Empty Trash
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete ALL items in the trash? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmEmptyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onEmptyTrash()
                setIsConfirmEmptyDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Empty Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete One Item Dialog */}
      <Dialog open={isConfirmDeleteOneDialogOpen} onOpenChange={setIsConfirmDeleteOneDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-700 flex items-center">
              <Trash2 className="mr-2 h-6 w-6" />
              Confirm Permanent Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "
              <span className="font-semibold text-gray-900">
                {itemToDeletePermanently ? getItemName(itemToDeletePermanently) : ""}
              </span>
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePermanentDeleteOne} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
