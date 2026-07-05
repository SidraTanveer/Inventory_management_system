"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, UserPlus, Eye, Settings } from "lucide-react"
import type { User } from "@/types/auth"
import { generateId } from "@/lib/utils"

interface GuestManagementProps {
  guestUsers: User[]
  onAddGuest: (guest: User) => void
  onUpdateGuest: (guest: User) => void
  onDeleteGuest: (id: string) => void
}

export function GuestManagement({ guestUsers, onAddGuest, onUpdateGuest, onDeleteGuest }: GuestManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    permissions: {
      dashboard: true,
      products: true,
      invoices: false,
      reports: false,
      settings: false,
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      permissions: {
        dashboard: true,
        products: true,
        invoices: false,
        reports: false,
        settings: false,
      },
    })
  }

  const handleAddGuest = () => {
    const newGuest: User = {
      id: generateId(),
      ...formData,
      role: "guest",
      createdAt: new Date().toISOString().split("T")[0],
    }
    onAddGuest(newGuest)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditGuest = (guest: User) => {
    setEditingGuest(guest)
    setFormData({
      name: guest.name,
      email: guest.email,
      permissions: { ...guest.permissions },
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateGuest = () => {
    if (editingGuest) {
      const updatedGuest: User = {
        ...editingGuest,
        ...formData,
        role: "guest",
      }
      onUpdateGuest(updatedGuest)
      setIsEditDialogOpen(false)
      setEditingGuest(null)
      resetForm()
    }
  }

  const handlePermissionChange = (permission: keyof User["permissions"], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <UserPlus className="mr-3 h-8 w-8" />
              Guest Management
            </h1>
            <p className="text-purple-100">Manage guest users with limited access permissions</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
                  <Plus className="mr-2 h-6 w-6" />
                  Add New Guest
                </DialogTitle>
                <DialogDescription>Create a new guest account with limited permissions.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter guest name"
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="font-medium">Permissions</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(formData.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(key as keyof User["permissions"], checked as boolean)
                          }
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleAddGuest}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Add Guest
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Guests Grid */}
      <div className="grid gap-6">
        {guestUsers.map((guest) => (
          <Card key={guest.id} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{guest.name}</h3>
                    <p className="text-gray-600">{guest.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className="bg-green-100 text-green-800">Guest</Badge>
                      <span className="text-sm text-gray-500">Created: {guest.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGuest(guest)}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteGuest(guest.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  Permissions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(guest.permissions)
                    .filter(([, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} variant="secondary" className="text-xs bg-green-100 text-green-800">
                        {key}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Guest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
              <Edit className="mr-2 h-6 w-6" />
              Edit Guest
            </DialogTitle>
            <DialogDescription>Update guest information and permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="font-medium">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter guest name"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="font-medium">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <div>
              <Label className="font-medium">Permissions</Label>
              <div className="space-y-2 mt-2">
                {Object.entries(formData.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${key}`}
                      checked={value}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(key as keyof User["permissions"], checked as boolean)
                      }
                    />
                    <Label htmlFor={`edit-${key}`} className="capitalize">
                      {key}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={handleUpdateGuest}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Update Guest
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
