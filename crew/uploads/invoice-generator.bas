' Invoice Generator - builds an invoice total with tax
' Tax rate is 8 percent. Discount applies above 500.

Sub MakeInvoice(Customer As String, Subtotal As Double)
    Dim tax As Double
    Dim total As Double
    Dim discount As Double
    discount = 0
    If Subtotal > 500 Then
        discount = Subtotal * 0.1
    End If
    tax = (Subtotal - discount) * 0.08
    total = Subtotal - discount + tax
    MsgBox "Invoice for " & Customer & " total is " & total
End Sub

Function InvoiceTotal(Subtotal As Double) As Double
    Dim tax As Double
    Dim total As Double
    tax = Subtotal * 0.08
    total = Subtotal + tax
    InvoiceTotal = total
End Function
