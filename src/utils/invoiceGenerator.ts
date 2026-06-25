import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable'; // Importa autoTable como uma função
import { formatCurrency, formatDate } from "@/lib/utils"; // Certifique-se de que formatDate está disponível
import { Order, OrderItem } from "@/context/OrderContext";
import { Expense } from "@/context/ExpenseContext";
import { Restaurant } from "@/context/RestaurantContext";
import { Supplier } from "@/context/SupplierContext";

interface InvoiceDetails {
  restaurant: Restaurant;
  order?: Order;
  expense?: Expense;
  supplier?: Supplier; // Only for supplier expense receipts
}

export const generateInvoicePdf = (type: 'order' | 'expense', details: InvoiceDetails) => {
  try {
    console.log("[generateInvoicePdf] Iniciando geração do PDF...");
    const doc = new jsPDF();
    console.log("[generateInvoicePdf] Objeto jsPDF criado.");

    // Define formattedToday aqui
    const formattedToday = formatDate(new Date().toISOString().split('T')[0]);

    doc.setProperties({
      title: type === 'order' ? `Nota Fiscal - Pedido ${details.order?.id}` : `Comprovante - Despesa ${details.expense?.id}`,
      subject: type === 'order' ? `Nota Fiscal para Pedido ${details.order?.id}` : `Comprovante de Pagamento para Despesa ${details.expense?.id}`,
      author: details.restaurant.name,
    });
    console.log("[generateInvoicePdf] Propriedades do documento definidas.");

    let startY = 20;

    // Restaurant Header
    doc.setFontSize(18);
    doc.text(details.restaurant.name, 14, startY);
    doc.setFontSize(10);
    doc.text(`${details.restaurant.address || 'N/A'}`, 14, startY + 6);
    doc.text(`Telefone: ${details.restaurant.phone || 'N/A'}`, 14, startY + 12);
    doc.text(`Email: ${details.restaurant.email || 'N/A'}`, 14, startY + 18);
    startY += 30;

    doc.line(14, startY, 196, startY); // Horizontal line
    startY += 10;

    if (type === 'order' && details.order) {
      const order = details.order;

      doc.setFontSize(16);
      doc.text(`NOTA FISCAL - PEDIDO #${order.id?.substring(0, 8).toUpperCase()}`, 14, startY);
      doc.setFontSize(10);
      doc.text(`Data do Pedido: ${formatDate(order.order_date)}`, 14, startY + 6);
      doc.text(`Data de Emissão: ${formattedToday}`, 14, startY + 12);
      startY += 25;

      doc.setFontSize(12);
      doc.text("Informações do Cliente:", 14, startY);
      doc.setFontSize(10);
      doc.text(`Nome: ${order.client_name}`, 14, startY + 6);
      doc.text(`Endereço: ${order.client_address}`, 14, startY + 12);
      doc.text(`Status: ${order.status}`, 14, startY + 18);
      startY += 30;

      doc.setFontSize(12);
      doc.text("Itens do Pedido:", 14, startY);
      startY += 5;

      // NOVO: Log de depuração para verificar os itens do pedido
      console.log("[generateInvoicePdf] Itens do pedido recebidos:", order.order_items);

      const itemsTableBody = order.order_items?.map((item: OrderItem) => {
        let itemDescription = item.name;
        let itemUnitPrice = item.base_price;

        if (item.selected_size_name && item.selected_size_price_modifier !== undefined) {
          itemDescription += ` (${item.selected_size_name})`;
          itemUnitPrice += item.selected_size_price_modifier;
        }
        if (item.selected_toppings && item.selected_toppings.length > 0) {
          const toppingsNames = item.selected_toppings.map(t => t.name).join(', ');
          const toppingsPrice = item.selected_toppings.reduce((sum, t) => sum + t.price, 0);
          itemDescription += ` c/ ${toppingsNames}`;
          itemUnitPrice += toppingsPrice;
        }

        return [
          item.quantity,
          itemDescription,
          formatCurrency(itemUnitPrice),
          formatCurrency(itemUnitPrice * item.quantity),
        ];
      }) || [];

      autoTable(doc, {
        startY: startY + 5,
        head: [['Qtd', 'Item', 'Preço Unit.', 'Total']],
        body: itemsTableBody,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 100 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
        },
      });
      startY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text(`Total do Pedido: ${formatCurrency(order.total)}`, 196, startY, { align: 'right' });
      startY += 10;

    } else if (type === 'expense' && details.expense && details.supplier) {
      const expense = details.expense;
      const supplier = details.supplier;

      doc.setFontSize(16);
      doc.text(`COMPROVANTE DE PAGAMENTO - DESPESA #${expense.id?.substring(0, 8).toUpperCase()}`, 14, startY);
      doc.setFontSize(10);
      doc.text(`Data da Despesa: ${formatDate(expense.date)}`, 14, startY + 6);
      doc.text(`Data de Emissão: ${formattedToday}`, 14, startY + 12);
      startY += 25;

      doc.setFontSize(12);
      doc.text("Informações do Fornecedor:", 14, startY);
      doc.setFontSize(10);
      doc.text(`Nome: ${supplier.name}`, 14, startY + 6);
      if (supplier.contact_person) doc.text(`Contato: ${supplier.contact_person}`, 14, startY + 12);
      if (supplier.phone) doc.text(`Telefone: ${supplier.phone}`, 14, startY + 18);
      if (supplier.email) doc.text(`Email: ${supplier.email}`, 14, startY + 24);
      if (supplier.address) doc.text(`Endereço: ${supplier.address}`, 14, startY + 30);
      startY += 40;

      doc.setFontSize(12);
      doc.text("Detalhes da Despesa:", 14, startY);
      startY += 5;

      autoTable(doc, {
        startY: startY + 5,
        head: [['Tipo', 'Descrição', 'Status', 'Valor']],
        body: [[
          expense.type,
          expense.description || 'N/A',
          expense.status,
          formatCurrency(expense.amount),
        ]],
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 80 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' },
        },
      });
      startY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text(`Valor Total: ${formatCurrency(expense.amount)}`, 196, startY, { align: 'right' });
      startY += 10;
    }

    doc.save(type === 'order' ? `nota_fiscal_pedido_${details.order?.id?.substring(0, 8)}.pdf` : `comprovante_despesa_${details.expense?.id?.substring(0, 8)}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw new Error(`Falha ao gerar o PDF: ${(error as Error).message}`);
  }
};