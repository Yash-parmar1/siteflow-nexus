import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Package, Cable, Wrench, Cpu, MoreHorizontal } from "lucide-react";
import type { InstallationMaterial } from "@/types/asset";

interface InstallationMaterialsFormProps {
  materials: InstallationMaterial[];
  onChange: (materials: InstallationMaterial[]) => void;
  readOnly?: boolean;
}

const materialCategories = [
  { value: "cables", label: "Cables", icon: Cable },
  { value: "brackets", label: "Brackets & Mounts", icon: Package },
  { value: "sensors", label: "Sensors", icon: Cpu },
  { value: "consumables", label: "Consumables", icon: Package },
  { value: "tools", label: "Tools", icon: Wrench },
  { value: "stabilizers", label: "Stabilizers", icon: Package },
  { value: "connectors", label: "Connectors", icon: Cable },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const defaultUnits = ["pcs", "meters", "kg", "sets", "rolls", "boxes"];

export function InstallationMaterialsForm({
  materials,
  onChange,
  readOnly = false,
}: InstallationMaterialsFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<InstallationMaterial>>({
    category: "cables",
    unit: "pcs",
    quantity: 1,
  });

  const addMaterial = () => {
    if (!newMaterial.name) return;
    
    const material: InstallationMaterial = {
      id: `mat-${Date.now()}`,
      name: newMaterial.name || "",
      category: newMaterial.category || "other",
      quantity: newMaterial.quantity || 1,
      unit: newMaterial.unit || "pcs",
      brand: newMaterial.brand,
      model: newMaterial.model,
      serialNumber: newMaterial.serialNumber,
      cost: newMaterial.cost,
      notes: newMaterial.notes,
    };
    
    onChange([...materials, material]);
    setNewMaterial({ category: "cables", unit: "pcs", quantity: 1 });
    setShowAddForm(false);
  };

  const updateMaterial = (id: string, updates: Partial<InstallationMaterial>) => {
    onChange(
      materials.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter((m) => m.id !== id));
  };

  const totalCost = materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);

  // Group by category for display
  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.category]) acc[material.category] = [];
    acc[material.category].push(material);
    return acc;
  }, {} as Record<string, InstallationMaterial[]>);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
        <div>
          <span className="text-2xl font-semibold text-foreground">{materials.length}</span>
          <p className="text-xs text-muted-foreground">Items Used</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-2xl font-semibold text-foreground">
            {Object.keys(groupedMaterials).length}
          </span>
          <p className="text-xs text-muted-foreground">Categories</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-2xl font-semibold text-foreground">
            ₹{totalCost.toLocaleString()}
          </span>
          <p className="text-xs text-muted-foreground">Total Cost</p>
        </div>
        {!readOnly && (
          <div className="ml-auto">
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Material
            </Button>
          </div>
        )}
      </div>

      {/* Add Material Form */}
      {showAddForm && !readOnly && (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
          <h4 className="font-medium text-foreground">Add New Material</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <Select
                value={newMaterial.category}
                onValueChange={(v) => setNewMaterial({ ...newMaterial, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Material Name *</Label>
              <Input
                value={newMaterial.name || ""}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="e.g., Power Cable 2.5mm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Quantity *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                  className="w-20"
                />
                <Select
                  value={newMaterial.unit}
                  onValueChange={(v) => setNewMaterial({ ...newMaterial, unit: v })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Unit Cost</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={newMaterial.cost || ""}
                  onChange={(e) => setNewMaterial({ ...newMaterial, cost: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Brand</Label>
              <Input
                value={newMaterial.brand || ""}
                onChange={(e) => setNewMaterial({ ...newMaterial, brand: e.target.value })}
                placeholder="e.g., Havells"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Model / Part No.</Label>
              <Input
                value={newMaterial.model || ""}
                onChange={(e) => setNewMaterial({ ...newMaterial, model: e.target.value })}
                placeholder="e.g., HRFR 2.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Serial Number</Label>
              <Input
                value={newMaterial.serialNumber || ""}
                onChange={(e) => setNewMaterial({ ...newMaterial, serialNumber: e.target.value })}
                placeholder="If applicable"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={newMaterial.notes || ""}
              onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={addMaterial} disabled={!newMaterial.name}>
              Add Material
            </Button>
          </div>
        </div>
      )}

      {/* Materials Table */}
      {materials.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-medium">Category</TableHead>
                <TableHead className="text-xs font-medium">Material</TableHead>
                <TableHead className="text-xs font-medium">Brand / Model</TableHead>
                <TableHead className="text-xs font-medium text-right">Qty</TableHead>
                <TableHead className="text-xs font-medium text-right">Unit Cost</TableHead>
                <TableHead className="text-xs font-medium text-right">Total</TableHead>
                {!readOnly && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const CategoryIcon = materialCategories.find(c => c.value === material.category)?.icon || Package;
                return (
                  <TableRow key={material.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{material.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{material.name}</p>
                        {material.serialNumber && (
                          <p className="text-xs text-muted-foreground">S/N: {material.serialNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {material.brand && material.model
                        ? `${material.brand} ${material.model}`
                        : material.brand || material.model || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {material.quantity} {material.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {material.cost ? `₹${material.cost.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {material.cost ? `₹${(material.cost * material.quantity).toLocaleString()}` : "-"}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeMaterial(material.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {materials.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No materials recorded yet</p>
          {!readOnly && (
            <Button variant="link" size="sm" onClick={() => setShowAddForm(true)}>
              Add your first material
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
