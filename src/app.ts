const LOCAL_STORAGE_KEY = 'expenses'
let currentEditingId: number | null = null
function getElement(id: string): HTMLElement | null {
    return document.getElementById(id)
}

function loadMenu(): void {
    const menu = getElement('menu')
    if (!menu) return
    menu.innerHTML = `
        <ul>
            <li><a href="home.html">Home</a></li>
            <li><a href="filters.html">Filters</a></li>
            <li><a href="charts.html">Charts</a></li>
            <li><a href="about.html">About</a></li>
        </ul>
    `
}

interface Expense {
    id: number
    typeOfexpense: string
    description: string
    amount: string
    date: string
}

function saveexpense(expenseTable: Expense[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenseTable))
}

function getData(): Expense[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]')
}

function withData(mutator: (data: Expense[]) => void): Expense[] {
    const data = getData()
    mutator(data)
    saveexpense(data)
    syncDataToDOM()
    return data
}

function syncDataToDOM(): void {
    const data = getData()
    let didNormalize = false
    const baseId = Date.now()
    
    data.forEach((item, i) => {
        if (item.id == null) {
            item.id = baseId + i
            didNormalize = true
        }
    })
    
    if (didNormalize) saveexpense(data)

    const htmlString = data.map((expense, index) => `
            <tr data-index="${index}">
                <td>${expense.typeOfexpense}</td>
                <td>${expense.description}</td>
                <td>$${expense.amount}</td>
                <td>${expense.date}</td>
                <td>
                    <button onclick="deleteexpense(${expense.id})" class="deleteButton">delete</button>
                    <button onclick="updateexpense(${expense.id})" class="updateButton">update</button>
                </td>
            </tr>
        `).join('')
    
    const expenseTable = getElement('expenseTable')
    if (expenseTable) expenseTable.innerHTML = htmlString
    
    const totalElement = getElement('total')
    if (totalElement) totalElement.textContent = String(data.length)
    
    const avgElement = getElement('averagePrice')
    if (avgElement) avgElement.textContent = getexpenseAverage().toFixed(2)
}

function getexpenseAverage(): number {
    const data = getData()
    const sum = data.reduce((total, expense) => total + Number(expense.amount), 0)
    return data.length ? sum / data.length : 0
}

function setOtherReasonState(isShow: boolean, value: string = ''): void {
    const otherReasonWrapper = getElement('otherexpense')
    const otherReasonInput = getElement('otherReason') as HTMLInputElement | null
    if (!otherReasonWrapper || !otherReasonInput) return
    otherReasonWrapper.classList.toggle('hidden', !isShow)
    otherReasonInput.toggleAttribute('required', isShow)
    otherReasonInput.value = isShow ? value : ''
}

function resetFormState(): void {
    const form = getElement('newexpenseForm') as HTMLFormElement | null
    form?.reset()
    currentEditingId = null
    const submitButton = getElement('submitexpenseButton')
    if (submitButton) submitButton.textContent = 'Add expense'
    setOtherReasonState(false)
}

function addexpense(event: Event): void {
    event.preventDefault()

    const typeSelect = getElement('typeOfexpense') as HTMLSelectElement | null
    const otherReasonInput = getElement('otherReason') as HTMLInputElement | null
    const otherReason = otherReasonInput?.value ?? ''
    let typeOfexpense = typeSelect?.value ?? ''
    if (typeOfexpense === 'Other' && otherReason.trim()) typeOfexpense = otherReason

    const descriptionInput = getElement('description') as HTMLInputElement
    const amountInput = getElement('amount') as HTMLInputElement
    const dateInput = getElement('date') as HTMLInputElement
    
    const description = descriptionInput.value
    const amount = amountInput.value
    const date = dateInput.value

    withData((expense) => {
        if (currentEditingId !== null) {
            const target = expense.find((item) => item.id === currentEditingId)
            if (target) {
                target.typeOfexpense = typeOfexpense
                target.description = description
                target.amount = amount
                target.date = date
            }
            currentEditingId = null
            return
        }
        expense.push({ id: Date.now(), typeOfexpense, description, amount, date })
    })

    resetFormState()
}

function deleteexpense(expenseId: number): void {
    if (!confirm('Are you sure you want to delete this expense?')) return
    withData((expense) => {
        const index = expense.findIndex((item) => item.id === expenseId)
        if (index !== -1) expense.splice(index, 1)
    })
}

function updateexpense(expenseId: number): void {
    const expense = getData().find(e => e.id === expenseId)
    if (expense) {
        currentEditingId = expenseId
        const submitButton = getElement('submitexpenseButton')
        if (submitButton) submitButton.textContent = 'Update expense'

        const typeSelect = getElement('typeOfexpense') as HTMLSelectElement | null
        if (typeSelect) {
            const isPresetType = Array.from(typeSelect.options).some(
                option => option.value === expense.typeOfexpense
            )
            if (isPresetType) {
                typeSelect.value = expense.typeOfexpense
                setOtherReasonState(false)
            } else {
                typeSelect.value = 'Other'
                setOtherReasonState(true, expense.typeOfexpense)
            }
        }
        
        const descriptionInput = getElement('description') as HTMLInputElement
        const amountInput = getElement('amount') as HTMLInputElement
        const dateInput = getElement('date') as HTMLInputElement
        
        descriptionInput.value = expense.description
        amountInput.value = expense.amount
        dateInput.value = expense.date

        const form = getElement('newexpenseForm') as HTMLElement
        form?.scrollIntoView({ behavior: 'smooth' })
    }
}

function renderFilteredTable(data: Expense[]): void {
    const table = getElement('filteredexpenseTable')
    if (!table) return
    if (!data.length) {
        table.innerHTML = `
            <tr>
                <td colspan="4">There are no expenses found for selected period</td>
            </tr>
        `
        return
    }
    table.innerHTML = data.map((expense) => `
        <tr>
            <td>${expense.typeOfexpense}</td>
            <td>${expense.description}</td>
            <td>$${expense.amount}</td>
            <td>${expense.date}</td>
        </tr>
    `).join('')
}

function filter(event: Event): void {
    event.preventDefault()
    
    const yearInput = getElement('filterByYear') as HTMLInputElement | null
    const monthInput = getElement('filterByMonth') as HTMLInputElement | null
    const dayInput = getElement('filterByDate') as HTMLInputElement | null
    
    const yearValue = yearInput?.value
    const monthValue = monthInput?.value
    const dayValue = dayInput?.value

    if (dayValue && (!yearValue || !monthValue)) {
        alert('Please enter a year and month before filtering by date.')
        return
    }

    if (monthValue && !yearValue) {
        alert('Please enter a year before filtering by month.')
        return
    }

    if (!yearValue) {
        renderFilteredTable(getData())
        return
    }

    const year = Number(yearValue)
    const month = monthValue ? Number(monthValue) : null
    const day = dayValue ? Number(dayValue) : null
    const filtered = getData().filter((expense) => {
        if (!expense.date) return false
        const date = new Date(expense.date)
        const matchesYear = date.getFullYear() === year
        const matchesMonth = month ? date.getMonth() + 1 === month : true
        const matchesDay = day ? date.getDate() === day : true
        return matchesYear && matchesMonth && matchesDay
    })
    renderFilteredTable(filtered)
    const resultsTable = getElement('expenseResultsTable')
    if (resultsTable) resultsTable.classList.remove('hidden')
}

loadMenu()

if (getElement('expenseTable')) syncDataToDOM()

const resetButton = document.querySelector('#newexpenseForm button[type="reset"]')
resetButton?.addEventListener('click', resetFormState)

if (getElement('filteredexpenseTable')) {
    const dateFilterForm = getElement('dateFilterForm')
    dateFilterForm?.addEventListener('reset', () => {
        const resultsTable = getElement('expenseResultsTable')
        if (resultsTable) resultsTable.classList.add('hidden')
    })
}

const reasonSelect = getElement('typeOfexpense') as HTMLSelectElement | null

reasonSelect?.addEventListener('change', () => {
    setOtherReasonState(reasonSelect.value === 'Other')
})

const dateInput = document.getElementById('date') as HTMLInputElement | null
if (dateInput) {
    const today = new Date().toISOString().split('T')[0]
    dateInput.max = today
}

const filterByYear = document.getElementById('filterByYear') as HTMLInputElement | null
if (filterByYear) {
    const currentYear = new Date().getFullYear()
    filterByYear.max = String(currentYear)
    getData().forEach(expense => {
        const expenseYear = new Date(expense.date).getFullYear()
        if (expenseYear > currentYear) {
            expense.date = `${currentYear}-12-31`
        }
    })
}

let pieChartInstance: any = null
let histogramChartInstance: any = null

function initializeCharts(): void {
    const data = getData()
    if (!data.length) return
    createPieChart(data)
    createHistogramChart(data)
}

function createPieChart(data: Expense[]): void {
    const canvas = getElement('pieChart') as HTMLCanvasElement | null
    if (!canvas) return
    
    const grouped = Object.groupBy(data, (exp) => exp.typeOfexpense || 'Unknown')
    const categoryData = Object.fromEntries(
        Object.entries(grouped).map(([cat, expenses]) => [
            cat,
            expenses!.reduce((sum, exp) => sum + Number(exp.amount), 0)
        ])
    )
    
    if (pieChartInstance) pieChartInstance.destroy()
    
    pieChartInstance = new (window as any).Chart(canvas, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: generateColors(Object.keys(categoryData).length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
                            const pct = ((ctx.parsed / total) * 100).toFixed(1)
                            return `${ctx.label}: $${ctx.parsed.toFixed(2)} (${pct}%)`
                        }
                    }
                }
            }
        }
    })
}

function createHistogramChart(data: Expense[]): void {
    const canvas = getElement('histogramChart') as HTMLCanvasElement | null
    if (!canvas) return
    
    const dataWithDates = data.filter(exp => exp.date)
    const grouped = Object.groupBy(dataWithDates, (exp) => {
        const date = new Date(exp.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
    const monthData = Object.fromEntries(
        Object.entries(grouped).map(([key, expenses]) => [
            key,
            expenses!.reduce((sum, exp) => sum + Number(exp.amount), 0)
        ])
    )
    
    const sorted = Object.keys(monthData).toSorted()
    
    if (histogramChartInstance) histogramChartInstance.destroy()
    
    histogramChartInstance = new (window as any).Chart(canvas, {
        type: 'bar',
        data: {
            labels: sorted.map(m => m.split('-').reverse().join('/')),
            datasets: [{
                label: 'Total Expenses',
                data: sorted.map(m => monthData[m]),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { callback: (val: any) => '$' + val } } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx: any) => 'Total: $' + ctx.parsed.y.toFixed(2) } }
            }
        }
    })
}

function generateColors(count: number): string[] {
    return Array.from({ length: count }, () => {
        const [r, g, b] = Array(3).fill(0).map(() => Math.floor(Math.random() * 255))
        return `rgba(${r}, ${g}, ${b}, 0.7)`
    })
}

function exportToCSV(): void {
    const data = getData()
    if (!data.length) return alert('No data to export')
    
    const rows = [['Type of Expense', 'Description', 'Amount', 'Date']]
    data.forEach(e => rows.push([`"${e.typeOfexpense || ''}"`, `"${e.description || ''}"`, e.amount || '0', e.date || '']))
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    link.classList.add('invisible')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

function exportToPDF(): void {
    const data = getData()
    if (!data.length) return alert('No data to export')
    
    const { jsPDF } = (window as any).jspdf
    const doc = new jsPDF()
    const total = data.reduce((sum, e) => sum + Number(e.amount), 0)
    
    doc.setFontSize(18).text('Expense Report', 14, 20)
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
    doc.text(`Total Expenses: $${total.toFixed(2)}`, 14, 35)
    doc.text(`Number of Expenses: ${data.length}`, 14, 42)
    
    doc.autoTable({
        startY: 50,
        head: [['Type', 'Description', 'Amount', 'Date']],
        body: data.map((e: Expense) => [e.typeOfexpense || '', e.description || '', `$${Number(e.amount).toFixed(2)}`, e.date || '']),
        theme: 'striped',
        headStyles: { fillColor: [54, 162, 235] }
    })
    
    doc.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`)
}

if (getElement('pieChart') && getElement('histogramChart')) initializeCharts();

;(window as any).deleteexpense = deleteexpense;
;(window as any).updateexpense = updateexpense;
;(window as any).addexpense = addexpense;
;(window as any).filter = filter;
;(window as any).exportToCSV = exportToCSV;
;(window as any).exportToPDF = exportToPDF;
