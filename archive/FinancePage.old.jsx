import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign } from 'lucide-react';

const FinancePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
        <p className="text-gray-600 mt-1">Manage budgets, expenses, and financial reports</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={24} />
            Finance Module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This page will contain the complete finance management system including:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Budget tracking and forecasting</li>
            <li>Expense management</li>
            <li>Purchase order system</li>
            <li>Payroll management</li>
            <li>Financial reports and analytics</li>
            <li>Invoice management</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🚧 Under construction - This module is being migrated from the original App.jsx
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;
