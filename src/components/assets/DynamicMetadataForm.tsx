import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import type { MetadataField } from "@/types/asset";

interface DynamicMetadataFormProps {
  fields: MetadataField[];
  onChange: (fields: MetadataField[]) => void;
  templateFields?: Omit<MetadataField, "value">[];
  readOnly?: boolean;
  showAddCustom?: boolean;
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes/No" },
  { value: "date", label: "Date" },
  { value: "currency", label: "Currency" },
  { value: "select", label: "Selection" },
];

export function DynamicMetadataForm({
  fields,
  onChange,
  templateFields,
  readOnly = false,
  showAddCustom = true,
}: DynamicMetadataFormProps) {
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<MetadataField["type"]>("text");

  const updateField = (index: number, updates: Partial<MetadataField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    if (!newFieldKey || !newFieldLabel) return;
    
    const newField: MetadataField = {
      key: newFieldKey.toLowerCase().replace(/\s+/g, "_"),
      label: newFieldLabel,
      value: newFieldType === "boolean" ? false : newFieldType === "number" || newFieldType === "currency" ? 0 : "",
      type: newFieldType,
      category: "custom",
    };
    
    onChange([...fields, newField]);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const renderFieldInput = (field: MetadataField, index: number) => {
    if (readOnly) {
      return (
        <span className="text-foreground">
          {field.type === "boolean" 
            ? (field.value ? "Yes" : "No")
            : field.type === "currency"
            ? `₹${Number(field.value).toLocaleString()}`
            : String(field.value)}
          {field.unit && ` ${field.unit}`}
        </span>
      );
    }

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => updateField(index, { value: checked })}
            />
            <span className="text-sm text-muted-foreground">
              {field.value ? "Yes" : "No"}
            </span>
          </div>
        );
      
      case "number":
      case "currency":
        return (
          <div className="flex items-center gap-2">
            {field.type === "currency" && <span className="text-muted-foreground">₹</span>}
            <Input
              type="number"
              value={Number(field.value)}
              onChange={(e) => updateField(index, { value: parseFloat(e.target.value) || 0 })}
              className="w-32"
            />
            {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
          </div>
        );
      
      case "date":
        return (
          <Input
            type="date"
            value={String(field.value)}
            onChange={(e) => updateField(index, { value: e.target.value })}
            className="w-40"
          />
        );
      
      case "select":
        return (
          <Select
            value={String(field.value)}
            onValueChange={(value) => updateField(index, { value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={String(field.value)}
            onChange={(e) => updateField(index, { value: e.target.value })}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  // Group fields by category
  const groupedFields = fields.reduce((acc, field, index) => {
    const category = field.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push({ field, index });
    return acc;
  }, {} as Record<string, { field: MetadataField; index: number }[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([category, categoryFields]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {category}
          </h4>
          <div className="space-y-3">
            {categoryFields.map(({ field, index }) => (
              <div
                key={field.key}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                {!readOnly && (
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                )}
                <div className="flex-1 grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    {renderFieldInput(field, index)}
                  </div>
                </div>
                {!readOnly && field.category === "custom" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeField(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Custom Field */}
      {!readOnly && showAddCustom && (
        <div className="pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Add Custom Field
          </h4>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Field Name</Label>
              <Input
                value={newFieldLabel}
                onChange={(e) => {
                  setNewFieldLabel(e.target.value);
                  setNewFieldKey(e.target.value);
                }}
                placeholder="e.g., Cable Length"
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as MetadataField["type"])}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomField}
              disabled={!newFieldLabel}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
