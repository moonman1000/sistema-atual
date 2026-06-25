import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable'; // Importa autoTable como uma função
import { Employee } from "@/context/EmployeeContext";
import { formatCurrency, formatDate } from "@/lib/utils";

export const generateAllPayrollsPdf = (employees: Employee[], restaurantName: string) => {
  try {
    const doc = new jsPDF();

    doc.setProperties({
      title: `Folha de Pagamentos - ${restaurantName}`,
      subject: `Relatório de Folha de Pagamentos para ${restaurantName}`,
      author: "Pizza Manager Admin",
    });

    doc.setFontSize(18);
    doc.text(`Folha de Pagamentos - ${restaurantName}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Data de Geração: ${formatDate(new Date().toISOString().split('T')[0])}`, 14, 28);

    const tableColumn = ["ID", "Nome", "Cargo", "Salário", "Data Contratação", "Status"];
    const tableRows: any[] = [];

    employees.forEach(employee => {
      const employeeData = [
        employee.id.substring(0, 8),
        employee.name,
        employee.role,
        formatCurrency(employee.salary),
        formatDate(employee.hire_date),
        employee.status,
      ];
      tableRows.push(employeeData);
    });

    autoTable(doc, { // Chamada explícita da função autoTable
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
        halign: 'left',
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        textColor: [51, 51, 51],
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30 },
        5: { cellWidth: 25, halign: 'center' },
      },
      didDrawPage: function (data: any) {
        let str = "Página " + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`folha_pagamentos_${restaurantName.replace(/\s/g, '_')}_${new Date().getFullYear()}.pdf`);
  } catch (error) {
    console.error("Erro detalhado ao gerar PDF da folha de pagamentos (todos):", error);
    throw error;
  }
};

export const generateSinglePayrollPdf = (employee: Employee, restaurantName: string) => {
  try {
    console.log(`[generateSinglePayrollPdf] Iniciando para funcionário: ${employee.name}`);
    const doc = new jsPDF();
    console.log("[generateSinglePayrollPdf] Objeto jsPDF criado.");

    console.log("[generateSinglePayrollPdf] autoTable será chamado diretamente.");

    doc.setProperties({
      title: `Folha de Pagamento - ${employee.name}`,
      subject: `Folha de Pagamento para ${employee.name} (${restaurantName})`,
      author: "Pizza Manager Admin",
    });
    console.log("[generateSinglePayrollPdf] Propriedades do documento definidas.");

    doc.setFontSize(18);
    doc.text(`Folha de Pagamento`, 14, 22);
    doc.setFontSize(12);
    doc.text(`${restaurantName}`, 14, 30);
    doc.setFontSize(10);
    doc.text(`Data de Geração: ${formatDate(new Date().toISOString().split('T')[0])}`, 14, 36);
    console.log("[generateSinglePayrollPdf] Cabeçalho do documento adicionado.");

    let startY = 50;

    doc.setFontSize(14);
    doc.text("Detalhes do Funcionário:", 14, startY);
    console.log("[generateSinglePayrollPdf] Preparando dados para autoTable.");

    const tableBodyData = [
      ['Nome', employee.name],
      ['Cargo', employee.role],
      ['Salário', formatCurrency(employee.salary)],
      ['Data Contratação', formatDate(employee.hire_date)],
      ['Status', employee.status],
      ['E-mail', employee.email || 'N/A'],
      ['Telefone', employee.phone || 'N/A'],
      ['ID', employee.id],
    ];
    console.log("[generateSinglePayrollPdf] Dados da tabela:", tableBodyData);

    autoTable(doc, { // Chamada explícita da função autoTable
      startY: startY + 5,
      head: [['Campo', 'Valor']],
      body: tableBodyData,
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'left' },
      },
    });
    console.log("[generateSinglePayrollPdf] autoTable executado com sucesso.");

    // Add signature section
    let signatureY = doc.lastAutoTable.finalY + 20; // Space after the table

    doc.setFontSize(10);
    doc.text("Declaro ter recebido o valor acima referente à minha remuneração.", 14, signatureY);
    signatureY += 15; // Space for the line and text

    // Employee Signature
    doc.line(20, signatureY, 90, signatureY); // x1, y1, x2, y2
    doc.text("Assinatura do Funcionário", 30, signatureY + 5);
    signatureY += 20; // Space for the next signature

    // Manager Signature
    doc.line(20, signatureY, 90, signatureY); // x1, y1, x2, y2
    doc.text("Assinatura do Gerente", 35, signatureY + 5);
    console.log("[generateSinglePayrollPdf] Seção de assinatura adicionada.");

    try {
      doc.save(`folha_pagamento_${employee.name.replace(/\s/g, '_')}.pdf`);
      console.log("[generateSinglePayrollPdf] PDF salvo com sucesso.");
    } catch (saveError) {
      console.error(`[generateSinglePayrollPdf] Erro ao salvar o PDF:`, saveError);
      throw new Error(`Falha ao salvar o PDF: ${(saveError as Error).message}`);
    }
  } catch (error) {
    console.error(`[generateSinglePayrollPdf] Erro detalhado ao gerar PDF da folha de pagamento para ${employee.name}:`, error);
    throw error;
  }
};