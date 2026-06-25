import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminTableFiltersWrapperProps {
  children: React.ReactNode;
}

const AdminTableFiltersWrapper: React.FC<AdminTableFiltersWrapperProps> = ({ children }) => {
  return (
    <Card className="p-4 shadow-sm">
      <CardContent className="p-0 flex flex-wrap items-center gap-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default AdminTableFiltersWrapper;