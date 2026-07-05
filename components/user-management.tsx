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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, UserCheck, Users, Shield, Settings } from "lucide-react"
import type { User } from "@/types/auth"
import { generateId } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth" // Import useAuth

interface UserManagementProps {
  users: User[]
  onAddUser: (user: User) => void
  onUpdateUser: (user: User) => void
  onDeleteUser: (id: string) => void
}

export function UserManagement({ users, onAddUser, onUpdateUser, onDeleteUser }: UserManagementProps) {
  const { user: currentUser } = useAuth() // Get the current logged-in user
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "sales" as User["role"],
    permissions: {
      dashboard: true,
      products: true,
      invoices: true,
      reports: false,
      settings: false,
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "sales",
      permissions: {
        dashboard: true,
        products: true,
        invoices: true,
        reports: false,
        settings: false,
      },
    })
  }

  const handleAddUser = () => {
    const newUser: User = {
      id: generateId(),
      ...formData,
      createdAt: new Date().toISOString().split("T")[0],
    }
    onAddUser(newUser)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: { ...user.permissions },
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = () => {
    if (editingUser) {
      const updatedUser: User = {
        ...editingUser,
        ...formData,
      }
      onUpdateUser(updatedUser)
      setIsEditDialogOpen(false)
      setEditingUser(null)
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

  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "sales":
        return "bg-blue-100 text-blue-800"
      case "guest":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return <Shield className="h-6 w-6 text-red-600" />
      case "sales":
        return <Users className="h-6 w-6 text-blue-600" />
      case "guest":
        return <UserCheck className="h-6 w-6 text-gray-600" />
      default:
        return <UserCheck className="h-6 w-6 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Users className="mr-3 h-8 w-8" />
              User Management
            </h1>
            <p className="text-purple-100">Manage system users and their permissions</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
                  <Plus className="mr-2 h-6 w-6" />
                  Add New User
                </DialogTitle>
                <DialogDescription>Create a new user account with specific permissions.</DialogDescription>
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
                    placeholder="Enter user name"
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
                  <Label htmlFor="role" className="font-medium">
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: User["role"]) => setFormData((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="border-purple-200 focus:border-purple-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={handleAddUser}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Add User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                      <span className="text-sm text-gray-500">Created: {user.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    // Disable edit button if:
                    // 1. The current user is not an admin AND
                    // 2. The user being edited is not the current user
                    disabled={user.id !== currentUser?.id && currentUser?.role !== "admin"}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {currentUser?.role === "admin" && ( // Only show delete button if current user is admin
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteUser(user.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  Permissions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(user.permissions)
                    .filter(([, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        {key}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-700 flex items-center">
              <Edit className="mr-2 h-6 w-6" />
              Edit User
            </DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
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
                placeholder="Enter user name"
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
              <Label htmlFor="edit-role" className="font-medium">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: User["role"]) => setFormData((prev) => ({ ...prev, role: value }))}
                // Disable role selection if the user being edited is an admin and the current user is not an admin
                disabled={editingUser?.role === "admin" && currentUser?.role !== "admin"}
              >
                <SelectTrigger className="border-purple-200 focus:border-purple-500">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
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
                      // Disable permission checkboxes if the user being edited is an admin and the current user is not an admin
                      disabled={editingUser?.role === "admin" && currentUser?.role !== "admin"}
                    />
                    <Label htmlFor={`edit-${key}`} className="capitalize">
                      {key}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={handleUpdateUser}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
