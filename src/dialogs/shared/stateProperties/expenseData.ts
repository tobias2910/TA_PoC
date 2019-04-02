/**
 * General expense data
 */
export interface IExpenseData {
    projectNr: string;
    occasion: string;
    adress: string;
    departDate: string;
    returnDate: string;
    invoice: IInvoiceData[];
}

/**
 * Information about the invoice data
 */
export interface IInvoiceData {
    invoiceType: string;
    invoiceName: string;
    invoiceDate: string;
    invoiceTotal: string;
}