import { useState } from 'react';
import { Plus, Tag, Edit2, Home, ShoppingCart, Coffee, Car, FileText, Zap, Utensils, Monitor, Heart, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';

const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

const ICONS: Record<string, any> = {
  Tag, Home, ShoppingCart, Coffee, Car, FileText, Zap, Utensils, Monitor, Heart, Briefcase
};

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, transactions } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const defaultFormData = {
    name: '',
    color: COLORS[0],
    icon: 'Tag',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  };
  
  const [formData, setFormData] = useState(defaultFormData);

  const handleOpenEdit = (category: any) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      color: category.color || COLORS[0],
      icon: category.icon || 'Tag',
      type: category.type as 'INCOME' | 'EXPENSE',
    });
    setIsOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingCategoryId(null);
    setFormData(defaultFormData);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          type: formData.type,
        });
        toast.success('Category updated successfully!');
      } else {
        await addCategory({
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          type: formData.type,
        });
        toast.success('Category created successfully!');
      }
      setIsOpen(false);
      setFormData(defaultFormData);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${editingCategoryId ? 'update' : 'create'} category`);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryTransactionCount = (categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId).length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600">Organize your transactions with categories</p>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        <Dialog open={!!(isOpen || editingCategoryId)} onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false);
            setEditingCategoryId(null);
            setFormData(defaultFormData);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategoryId ? 'Edit Category' : 'Create Category'}</DialogTitle>
              <DialogDescription>
                {editingCategoryId ? 'Modify the details for this category' : 'Enter the details for the new category'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form content ... */}
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Groceries"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'INCOME' | 'EXPENSE') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="INCOME">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          formData.color === color ? 'border-gray-900 scale-110 shadow-md' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.keys(ICONS).map((iconName) => {
                      const IconComponent = ICONS[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          className={`p-2 border rounded-md transition-all ${
                            formData.icon === iconName ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setFormData({ ...formData, icon: iconName })}
                        >
                          <IconComponent className="w-5 h-5 text-gray-700" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingCategoryId ? 'Save Changes' : 'Create Category'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const IconComponent = ICONS[category.icon || 'Tag'] || Tag;
            return (
              <Card key={category.id} className="relative group overflow-hidden">
                <CardContent className="p-0">
                  <div 
                    className="absolute top-0 left-0 w-1.5 h-full" 
                    style={{ backgroundColor: category.color || '#6b7280' }} 
                  />
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-xl shadow-sm"
                        style={{ backgroundColor: (category.color || '#6b7280') + '15' }}
                      >
                        <IconComponent className="h-6 w-6" style={{ color: category.color || '#6b7280' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{category.name}</h3>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
                          {category.type} • {getCategoryTransactionCount(category.id)} transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(category)}>
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No categories yet</p>
              <Button onClick={handleOpenAdd}>Create First Category</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}