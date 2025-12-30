import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Tags, Trash2, Eye, EyeOff } from "lucide-react";
import { Category, CATEGORIES, CustomCategory } from "@/types/expense";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const EMOJI_OPTIONS = ["📌", "🎯", "⭐", "💎", "🔥", "🌟", "💫", "🎨", "🎭", "🎪", "🎬", "🎵", "🎮", "🎲", "🏋️", "🧘", "🏊", "🚴", "🍕", "🍜", "☕", "🍷"];

interface CategoryManagerProps {
  customCategories: CustomCategory[];
  customSubcategories: Record<Category, CustomCategory[]>;
  hiddenCategories: Category[];
  onAddCategory: (category: CustomCategory) => void;
  onRemoveCategory: (id: string) => void;
  onAddSubcategory: (parentCategory: Category, subcategory: CustomCategory) => void;
  onRemoveSubcategory: (parentCategory: Category, id: string) => void;
  onHideCategory: (categoryId: Category) => void;
  onShowCategory: (categoryId: Category) => void;
  onBack: () => void;
}

const CategoryManager = ({
  customCategories,
  customSubcategories,
  hiddenCategories,
  onAddCategory,
  onRemoveCategory,
  onAddSubcategory,
  onRemoveSubcategory,
  onHideCategory,
  onShowCategory,
  onBack,
}: CategoryManagerProps) => {
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("📌");
  const [subcategoryLabel, setSubcategoryLabel] = useState("");
  const [subcategoryIcon, setSubcategoryIcon] = useState("📌");
  const [parentCategory, setParentCategory] = useState<Category>("misc");

  const handleAddCategory = () => {
    if (!categoryLabel.trim()) {
      toast({ title: "Error", description: "Please enter a category name", variant: "destructive" });
      return;
    }

    const newCategory: CustomCategory = {
      id: `custom_${Date.now()}`,
      label: categoryLabel.trim(),
      icon: categoryIcon,
    };

    onAddCategory(newCategory);
    toast({ title: "Category added", description: `${categoryIcon} ${categoryLabel}` });
    setCategoryLabel("");
    setCategoryIcon("📌");
    setShowAddCategoryModal(false);
  };

  const handleAddSubcategory = () => {
    if (!subcategoryLabel.trim()) {
      toast({ title: "Error", description: "Please enter a subcategory name", variant: "destructive" });
      return;
    }

    const newSubcategory: CustomCategory = {
      id: `custom_sub_${Date.now()}`,
      label: subcategoryLabel.trim(),
      icon: subcategoryIcon,
      parentCategory,
    };

    onAddSubcategory(parentCategory, newSubcategory);
    toast({ title: "Subcategory added", description: `${subcategoryIcon} ${subcategoryLabel} under ${CATEGORIES.find(c => c.id === parentCategory)?.label}` });
    setSubcategoryLabel("");
    setSubcategoryIcon("📌");
    setShowAddSubcategoryModal(false);
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Manage Categories</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Built-in Categories */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Built-in Categories
          </h3>
          <div className="space-y-2">
            {CATEGORIES.filter((cat) => cat.id !== "custom").map((cat) => {
              const isHidden = hiddenCategories.includes(cat.id);
              return (
                <Card key={cat.id} className={cn("p-3 rounded-xl", isHidden && "opacity-50")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => isHidden ? onShowCategory(cat.id) : onHideCategory(cat.id)}
                    >
                      {isHidden ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Hidden categories won't appear when adding expenses
          </p>
        </div>

        {/* Custom Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Custom Categories
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowAddCategoryModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          {customCategories.length > 0 ? (
            <div className="space-y-2">
              {customCategories.map((cat) => (
                <Card key={cat.id} className="p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemoveCategory(cat.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 rounded-xl text-center">
              <Tags className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No custom categories yet</p>
            </Card>
          )}
        </div>

        {/* Custom Subcategories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Custom Subcategories
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowAddSubcategoryModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {CATEGORIES.map((cat) => {
            const subs = customSubcategories[cat.id] || [];
            if (subs.length === 0) return null;
            return (
              <div key={cat.id} className="mb-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span>{cat.icon}</span>
                  {cat.label}
                </p>
                <div className="space-y-2 pl-6">
                  {subs.map((sub) => (
                    <Card key={sub.id} className="p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span>{sub.icon}</span>
                          <span className="font-medium">{sub.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRemoveSubcategory(cat.id, sub.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.values(customSubcategories).every((subs) => subs.length === 0) && (
            <Card className="p-6 rounded-xl text-center">
              <Tags className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No custom subcategories yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="max-w-[90%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Category Name
              </label>
              <Input
                placeholder="e.g., Pet Care"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={categoryIcon === emoji ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 text-xl"
                    onClick={() => setCategoryIcon(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleAddCategory}>
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Modal */}
      <Dialog open={showAddSubcategoryModal} onOpenChange={setShowAddSubcategoryModal}>
        <DialogContent className="max-w-[90%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Parent Category
              </label>
              <Select value={parentCategory} onValueChange={(v) => setParentCategory(v as Category)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Subcategory Name
              </label>
              <Input
                placeholder="e.g., Vet Visits"
                value={subcategoryLabel}
                onChange={(e) => setSubcategoryLabel(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={subcategoryIcon === emoji ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 text-xl"
                    onClick={() => setSubcategoryIcon(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleAddSubcategory}>
              Add Subcategory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManager;
