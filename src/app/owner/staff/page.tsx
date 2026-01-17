'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, User, FileText, BarChart } from 'lucide-react';
import MainLayout from '@/components/app/main-layout';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const staffMembers = [
  { id: 1, name: 'Adebayo', phone: '+234 801 234 5678', canRecordSales: true, canSeeReports: false },
  { id: 2, name: 'Chidinma', phone: '+234 908 765 4321', canRecordSales: true, canSeeReports: false },
];

export default function StaffPage() {
  return (
    <MainLayout title="Staff Management" backHref="/owner/home">
      <div className="flex flex-col gap-6 h-full w-full max-w-md">
        <Button className="h-14 text-lg">
          <Plus className="mr-2 h-5 w-5" />
          Add New Staff
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Staff</CardTitle>
            <CardDescription>Manage permissions for your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffMembers.map((staff, index) => (
                <div key={staff.id}>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted rounded-full p-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-1 pl-5">
                      <div className="flex items-center justify-between p-2 rounded-md">
                        <Label htmlFor={`sales-${staff.id}`} className="flex items-center gap-3 cursor-pointer">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          Can record sales
                        </Label>
                        <Switch id={`sales-${staff.id}`} checked={staff.canRecordSales} disabled />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md">
                        <Label htmlFor={`reports-${staff.id}`} className="flex items-center gap-3 cursor-pointer">
                          <BarChart className="w-4 h-4 text-muted-foreground" />
                          Can see reports
                        </Label>
                        <Switch id={`reports-${staff.id}`} checked={staff.canSeeReports} disabled />
                      </div>
                    </div>
                  </div>
                  {index < staffMembers.length - 1 && <Separator className="my-4"/>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
