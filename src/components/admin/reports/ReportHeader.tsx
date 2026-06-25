"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

interface ReportHeaderProps {
  onGeneratePdf: () => Promise<void>;
  isGeneratingPdf: boolean;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ onGeneratePdf, isGeneratingPdf }) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Relatórios</h1>
      <Button onClick={onGeneratePdf} disabled={isGeneratingPdf}>
        {isGeneratingPdf ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando PDF...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" /> Gerar Relatório PDF
          </>
        )}
      </Button>
    </div>
  );
};

export default ReportHeader;