' Expense Tracker - haunted since 2009
' Adds an expense and keeps a running total.
' Original author left the company. The spreadsheet stayed.

Sub AddExpense(Category As String, Amount As Double)
    Dim total As Double
    Dim row As Integer
    Dim message As String
    total = 0
    row = 2
    For row = 2 To 10
        total = total + Cells(row, 2).Value
    Next row
    If Amount > 0 Then
        total = total + Amount
        message = "Expense added. Total is " & total
        MsgBox message
    Else
        MsgBox "Amount must be greater than zero."
    End If
End Sub

Function TotalExpenses() As Double
    Dim total As Double
    total = WorksheetFunction.Sum(Range("B2:B10"))
    TotalExpenses = total
End Function
