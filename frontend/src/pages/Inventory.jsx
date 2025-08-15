import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, TrendingDown, Search, Filter } from 'lucide-react';
import axios from 'axios'; // <-- Make sure axios is imported

import { API_URL } from '../lib/api';
 // <-- Define the API URL

const Inventory = ( ) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState(''); // <-- Good practice to have an error state

  // --- THIS IS THE UPDATED PART THAT FETCHES LIVE DATA ---
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/inventory`);
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
        setError('Could not load inventory data. Please ensure the backend server is running.');
      }
    };
    fetchInventory();
  }, []);
  // ---------------------------------------------------------

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reorder':
        return 'bg-red-100 text-red-800';
      case 'Out of Stock':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = products.filter(product => {
    const nameMatch = product.name ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const categoryMatch = product.category ? product.category.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const supplierMatch = product.supplier ? product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    const matchesSearch = nameMatch || categoryMatch || supplierMatch;
    const matchesCategory = categoryFilter === 'all' || (product.category && product.category.toLowerCase() === categoryFilter.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = products.filter(p => p.currentStock <= p.minStock);
  const reorderItems = products.filter(p => p.status === 'Reorder');
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, stock levels, and suppliers
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-semibold text-yellow-600">{lowStockItems.length}</p>
            <p className="text-sm text-gray-500">Low Stock</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600">{reorderItems.length}</p>
            <p className="text-sm text-gray-500">Need Reorder</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">${totalValue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Value</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-full sm:w-48"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="termiticides">Termiticides</option>
            <option value="insecticides">Insecticides</option>
            <option value="rodenticides">Rodenticides</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.currentStock} / {product.maxStock} units
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            product.currentStock <= product.minStock
                              ? 'bg-red-500'
                              : product.currentStock <= product.maxStock * 0.5
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((product.currentStock / product.maxStock) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {product.minStock} units
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">Cost: ${product.unitCost}</div>
                      <div className="text-sm text-gray-500">Sell: ${product.sellingPrice}</div>
                      <div className="text-xs text-green-600">
                        Margin: {product.sellingPrice > 0 ? Math.round(((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100) : 0}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{product.supplier}</div>
                      <div className="text-sm text-gray-500">Last: {product.lastOrdered}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                    {product.currentStock <= product.minStock && (
                      <div className="flex items-center mt-1">
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-xs text-red-600">Low Stock</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {product.status === 'Reorder' && (
                        <button className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">
                          Reorder
                        </button>
                      )}
                      <button className="btn-secondary text-xs px-2 py-1">
                        Edit
                      </button>
                      <button className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700">
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
