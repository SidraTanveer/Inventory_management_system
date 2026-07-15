"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Product } from "@/types/app"
import { formatCurrency } from "@/lib/utils"
import { getKeywordSuggestions, searchAndRank } from "@/lib/search-utils"
import { Search, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProductSearchProps {
  products: Product[]
  currentAppCurrency: string
}

export function ProductSearch({ products, currentAppCurrency }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = useMemo(() => {
    return searchAndRank(products, searchTerm, [
      (product) => product.name,
      (product) => product.description,
      (product) => product.sku,
      (product) => product.category,
    ])
  }, [products, searchTerm])

  const productSuggestions = useMemo(() => {
    return getKeywordSuggestions(
      products,
      searchTerm,
      [(product) => product.name, (product) => product.sku, (product) => product.category],
      10,
    )
  }, [products, searchTerm])

  return (
    <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <Search className="mr-2 h-5 w-5 text-pink-600" />
          Product Search
        </CardTitle>
        <CardDescription>Search and filter products in your inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products by name, description, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            list="product-search-suggestions"
            className="pl-10 border-pink-200 focus:border-pink-500 focus:ring-pink-500"
          />
          <datalist id="product-search-suggestions">
            {productSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-pink-50 to-purple-50">
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                  <TableHead className="font-semibold text-gray-700">Unit Price</TableHead>
                  <TableHead className="font-semibold text-gray-700">Cost Price</TableHead>
                  <TableHead className="font-semibold text-gray-700">Profit/Unit</TableHead>
                  <TableHead className="font-semibold text-gray-700">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-pink-50/50 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-pink-700">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.stock < 10 ? "destructive" : "secondary"}
                        className={product.stock < 10 ? "" : "bg-green-100 text-green-800"}
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(product.unitPrice, currentAppCurrency)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatCurrency(product.costPrice, currentAppCurrency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {product.unitPrice - product.costPrice >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span
                          className={
                            product.unitPrice - product.costPrice >= 0
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {formatCurrency(product.unitPrice - product.costPrice, currentAppCurrency)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.unitPrice > 0 &&
                          ((product.unitPrice - product.costPrice) / product.unitPrice) * 100 >= 20
                            ? "default"
                            : "secondary"
                        }
                        className={
                          product.unitPrice > 0 &&
                          ((product.unitPrice - product.costPrice) / product.unitPrice) * 100 >= 20
                            ? "bg-green-100 text-green-800"
                            : product.unitPrice > 0 &&
                                ((product.unitPrice - product.costPrice) / product.unitPrice) * 100 >= 10
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {product.unitPrice > 0
                          ? `${(((product.unitPrice - product.costPrice) / product.unitPrice) * 100).toFixed(1)}%`
                          : "0%"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-pink-600" />
            </div>
            <p className="text-gray-500">No products found matching your search criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
