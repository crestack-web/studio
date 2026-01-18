'use client';
import { useState, useMemo } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Ingredient {
    name: string;
    cost: string;
}

export default function AddProductPage() {
    const [isManufactured, setIsManufactured] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIngredientCost, setNewIngredientCost] = useState('');

    const totalIngredientCost = useMemo(() => {
        return ingredients.reduce((total, ing) => total + (parseFloat(ing.cost) || 0), 0);
    }, [ingredients]);

    const handleAddIngredient = () => {
        if (newIngredientName.trim() && newIngredientCost.trim()) {
            setIngredients([...ingredients, { name: newIngredientName.trim(), cost: newIngredientCost.trim() }]);
            setNewIngredientName('');
            setNewIngredientCost('');
        }
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    return (
        <MainLayout title="Add New Product" backHref="/add-inventory">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>New Product</CardTitle>
                        <CardDescription>Add a new product to your inventory.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Product Name</Label>
                            <Input id="product-name" placeholder="e.g., Bottled Water" className="h-12 text-base" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="manufacturing-mode" checked={isManufactured} onCheckedChange={setIsManufactured} />
                            <Label htmlFor="manufacturing-mode">This is a manufactured product</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cost-price">Production/Cost Price</Label>
                                <Input 
                                    id="cost-price" 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="h-12 text-base" 
                                    value={isManufactured ? totalIngredientCost.toFixed(2) : undefined}
                                    readOnly={isManufactured}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling-price">Selling Price</Label>
                                <Input id="selling-price" type="number" placeholder="0.00" className="h-12 text-base" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="quantity">Initial Quantity</Label>
                            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" />
                        </div>
                    </CardContent>
                </Card>

                {isManufactured && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Ingredients</CardTitle>
                            <CardDescription>Add the raw materials used to make this product. The total cost will be your production price.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ingredients.length > 0 && (
                                <div className="space-y-2">
                                    {ingredients.map((ing, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-md border">
                                            <span className="flex-1 font-medium">{ing.name}</span>
                                            <span className="text-muted-foreground">₦{parseFloat(ing.cost).toLocaleString()}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveIngredient(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <Label>Add Ingredient</Label>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="ing-name" className="text-xs text-muted-foreground">Name</Label>
                                        <Input id="ing-name" placeholder="e.g., Flour" value={newIngredientName} onChange={e => setNewIngredientName(e.target.value)} />
                                    </div>
                                    <div className="w-28 space-y-1">
                                        <Label htmlFor="ing-cost" className="text-xs text-muted-foreground">Cost</Label>
                                        <Input id="ing-cost" type="number" placeholder="100" value={newIngredientCost} onChange={e => setNewIngredientCost(e.target.value)} />
                                    </div>
                                    <Button size="icon" onClick={handleAddIngredient} disabled={!newIngredientName || !newIngredientCost}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Button className="w-full h-14 text-lg">Add Product</Button>
            </div>
        </MainLayout>
    );
}
