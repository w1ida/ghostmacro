' Inventory Manager - counts stock and flags low items
' Reorder level is 5. Anything at or below it is haunted (low stock).

Sub CheckStock()
    Dim row As Integer
    Dim quantity As Integer
    Dim lowCount As Integer
    lowCount = 0
    For row = 2 To 8
        quantity = Cells(row, 5).Value
        If quantity <= 5 Then
            lowCount = lowCount + 1
            MsgBox "Low stock: " & Cells(row, 4).Value
        End If
    Next row
    If lowCount = 0 Then
        MsgBox "All stock levels are healthy."
    End If
End Sub

Function StockValue() As Double
    Dim total As Double
    Dim i As Integer
    total = 0
    For i = 2 To 8
        total = total + Cells(i, 5).Value * Cells(i, 6).Value
    Next i
    StockValue = total
End Function
