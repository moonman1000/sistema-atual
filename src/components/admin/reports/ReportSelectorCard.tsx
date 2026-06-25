"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ReportSelectorCardProps {
  selectedReport: string;
  setSelectedReport: (report: string) => void;
}

const ReportSelectorCard: React.FC<ReportSelectorCardProps> = ({ selectedReport, setSelectedReport }) => {
  const getReportLabel = (reportValue: string) => {
    switch (reportValue) {
      case "visao-geral-vendas": return "Visão Geral de Vendas";
      case "faturamento-mensal": return "Faturamento Mensal";
      case "vendas-vs-custos": return "Vendas vs Custos";
      default: return "Selecione um relatório";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios de Vendas e Custos</CardTitle>
        <CardDescription>Selecione um relatório para visualizar os dados.</CardDescription>
      </CardHeader>
      <CardContent>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {getReportLabel(selectedReport)} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onClick={() => setSelectedReport("visao-geral-vendas")}>
              Visão Geral de Vendas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedReport("faturamento-mensal")}>
              Faturamento Mensal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedReport("vendas-vs-custos")}>
              Vendas vs Custos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default ReportSelectorCard;