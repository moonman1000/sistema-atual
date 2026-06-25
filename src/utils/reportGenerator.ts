import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable'; // Importa autoTable como uma função
import { formatCurrency, formatDate } from "@/lib/utils"; // Certifique-se de que formatDate está disponível

interface SalesData {
  name: string;
  vendas: number;
  pedidos: number;
}

interface MonthlyRevenueData {
  name: string;
  vendas: number;
}

interface RevenueVsExpenseData {
  name: string;
  Receita: number;
  Custo: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
}

interface OrderStatusSummary {
  status: string;
  count: number;
  variant: string;
}

interface SalesByCategoryData {
  name: string;
  value: number;
}

interface ReportData {
  selectedReport: string;
  salesData: SalesData[];
  monthlyRevenueData: MonthlyRevenueData[];
  revenueVsExpenseData: RevenueVsExpenseData[];
  topProducts: TopProduct[];
  orderStatusSummary: OrderStatusSummary[];
  salesByCategoryData: SalesByCategoryData[];
  dailyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyExpenses: number;
  annualExpenses: number;
  netAnnualRevenue: number;
}

export const generateReportPdf = (data: ReportData) => {
  try {
    console.log("[generateReportPdf] Iniciando geração do PDF...");
    const doc = new jsPDF();
    console.log("[generateReportPdf] Objeto jsPDF criado.");

    doc.setProperties({
      title: `Relatório de Vendas e Custos - ${data.selectedReport}`,
      subject: `Relatório gerado em ${formatDate(new Date().toISOString().split('T')[0])}`,
      author: "Pizza Manager Admin",
    });
    console.log("[generateReportPdf] Propriedades do documento definidas.");

    let startY = 40;

    // Summary Metrics
    doc.setFontSize(12);
    doc.text("Métricas de Resumo:", 14, startY + 10);
    console.log("[generateReportPdf] Adicionando tabela de Métricas de Resumo.");
    autoTable(doc, {
      startY: startY + 15,
      head: [['Métrica', 'Valor']],
      body: [
        ['Faturamento do Dia', formatCurrency(data.dailyRevenue || 0)],
        ['Faturamento Mensal', formatCurrency(data.monthlyRevenue || 0)],
        ['Custo Mensal', formatCurrency(data.monthlyExpenses || 0)],
        ['Faturamento Anual Total', formatCurrency(data.annualRevenue || 0)],
        ['Custos Anuais', formatCurrency(data.annualExpenses || 0)],
        ['Faturamento Anual Líquido', formatCurrency(data.netAnnualRevenue || 0)],
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    });
    startY = (doc as any).lastAutoTable.finalY + 10; // Corrigido: Usar doc.lastAutoTable.finalY
    console.log("[generateReportPdf] Tabela de Métricas de Resumo adicionada. startY:", startY);


    if (data.selectedReport === "visao-geral-vendas") {
      doc.setFontSize(14);
      doc.text("Visão Geral de Vendas (Vendas e Pedidos por Mês)", 14, startY + 10);
      console.log("[generateReportPdf] Adicionando tabela de Visão Geral de Vendas.");
      autoTable(doc, {
        startY: startY + 15,
        head: [['Mês', 'Vendas (R$)', 'Pedidos']],
        body: data.salesData.map(row => [row.name || 'N/A', formatCurrency(row.vendas || 0), row.pedidos || 0]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });
      startY = (doc as any).lastAutoTable.finalY + 10; // Corrigido: Usar doc.lastAutoTable.finalY
      console.log("[generateReportPdf] Tabela de visão geral de vendas adicionada. startY:", startY);
    } else if (data.selectedReport === "faturamento-mensal") {
      doc.setFontSize(14);
      doc.text("Faturamento Mensal", 14, startY + 10);
      console.log("[generateReportPdf] Adicionando tabela de Faturamento Mensal.");
      autoTable(doc, {
        startY: startY + 15,
        head: [['Mês/Ano', 'Vendas (R$)']],
        body: data.monthlyRevenueData.map(row => [row.name || 'N/A', formatCurrency(row.vendas || 0)]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' } },
      });
      startY = (doc as any).lastAutoTable.finalY + 10; // Corrigido: Usar doc.lastAutoTable.finalY
      console.log("[generateReportPdf] Tabela de faturamento mensal adicionada. startY:", startY);
    } else if (data.selectedReport === "vendas-vs-custos") {
      doc.setFontSize(14);
      doc.text("Vendas vs Custos Mensais", 14, startY + 10);
      console.log("[generateReportPdf] Adicionando tabela de Vendas vs Custos.");
      autoTable(doc, {
        startY: startY + 15,
        head: [['Mês', 'Receita (R$)', 'Custo (R$)']],
        body: data.revenueVsExpenseData.map(row => [row.name || 'N/A', formatCurrency(row.Receita || 0), formatCurrency(row.Custo || 0)]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });
      startY = doc.lastAutoTable.finalY + 10; // Corrigido: Usar doc.lastAutoTable.finalY
      console.log("[generateReportPdf] Tabela de vendas vs custos adicionada. startY:", startY);
    }

    // Always include Top Selling Products and Order Status Summary
    doc.addPage();
    startY = 22; // Reset Y for new page
    console.log("[generateReportPdf] Nova página adicionada. startY:", startY);

    doc.setFontSize(14);
    doc.text("Produtos Mais Vendidos", 14, startY);
    console.log("[generateReportPdf] Adicionando tabela de Produtos Mais Vendidos.");
    autoTable(doc, {
      startY: startY + 5,
      head: [['Produto', 'Categoria', 'Vendas', 'Faturamento (R$)']],
      body: data.topProducts.map(row => [row.name || 'N/A', row.category || 'N/A', row.sales || 0, formatCurrency(row.revenue || 0)]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    startY = doc.lastAutoTable.finalY + 10; // Corrigido: Usar doc.lastAutoTable.finalY
    console.log("[generateReportPdf] Tabela de produtos mais vendidos adicionada. startY:", startY);

    doc.setFontSize(14);
    doc.text("Resumo do Status dos Pedidos", 14, startY);
    console.log("[generateReportPdf] Adicionando tabela de Resumo do Status dos Pedidos.");
    autoTable(doc, {
      startY: startY + 5,
      head: [['Status', 'Quantidade']],
      body: data.orderStatusSummary.map(row => [row.status || 'N/A', row.count || 0]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    });
    startY = doc.lastAutoTable.finalY + 10; // Corrigido: Usar doc.lastAutoTable.finalY
    console.log("[generateReportPdf] Tabela de resumo do status dos pedidos adicionada.");

    doc.setFontSize(14);
    doc.text("Distribuição de Vendas por Categoria", 14, startY);
    console.log("[generateReportPdf] Adicionando tabela de Distribuição de Vendas por Categoria.");
    const totalSalesValue = data.salesByCategoryData.reduce((sum, c) => sum + (c.value || 0), 0);
    autoTable(doc, {
      startY: startY + 5,
      head: [['Categoria', 'Valor (R$)', 'Percentual']],
      body: data.salesByCategoryData.map(row => [
        row.name || 'N/A',
        formatCurrency(row.value || 0),
        `${((row.value || 0) / (totalSalesValue || 1) * 100).toFixed(2)}%`
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
    console.log("[generateReportPdf] Tabela de distribuição de vendas por categoria adicionada.");


    doc.save(`relatorio_${data.selectedReport.replace(/\s/g, '_')}_${new Date().getFullYear()}.pdf`);
    console.log("[generateReportPdf] PDF salvo com sucesso.");
  } catch (error) {
    console.error("[generateReportPdf] Erro detalhado ao gerar PDF do relatório (catch principal):", error);
    throw error; // Re-throw para que o toast na página ainda seja acionado
  }
};