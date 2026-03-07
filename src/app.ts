const LOCAL_STORAGE_KEY = 'expenses'
let currentEditingId: number | null = null
const $ = (id: string): HTMLElement | null => document.getElementById(id)

const loadMenu = (): void => {  
    const menu = $('menu')
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
    typeOfExpanse: string
    description: string
    amount: string
    date: string
}

const saveExpanse = (expanseTable: Expense[]): void =>
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expanseTable))

const getData = (): Expense[] => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')

const withData = (mutator: (data: Expense[]) => void): Expense[] => {
    const data = getData()
    mutator(data)
    saveExpanse(data)
    syncDataToDOM()
    return data
}

const syncDataToDOM = (): void => {
    const data = getData()
    let didNormalize = false
    const baseId = Date.now()
    
    data.forEach((item, i) => {
        if (item.id == null) {
            item.id = baseId + i
            didNormalize = true
        }
    })
    
    if (didNormalize) saveExpanse(data)

    const htmlString = data.map((expanse, index) => `
            <tr data-index="${index}">
                <td>${expanse.typeOfExpanse}</td>
                <td>${expanse.description}</td>
                <td>$${expanse.amount}</td>
                <td>${expanse.date}</td>
                <td>
                    <button onclick="deleteExpanse(${expanse.id})" class="deleteButton">delete</button>
                    <button onclick="updateExpanse(${expanse.id})" class="updateButton">update</button>
                </td>
            </tr>
        `).join('')
    
    const expanseTable = $('expanseTable')
    if (expanseTable) expanseTable.innerHTML = htmlString
    
    const totalElement = $('total')
    if (totalElement) totalElement.textContent = String(data.length)
    
    const avgElement = $('averagePrice')
    if (avgElement) avgElement.textContent = getExpanseAverage().toFixed(2)
}

const getExpanseAverage = (): number => {
    const data = getData()
    const sum = data.reduce((total, expanse) => total + Number(expanse.amount), 0)
    return data.length ? sum / data.length : 0
}

const setOtherReasonState = (show: boolean, value: string = ''): void => {
    const otherReasonWrapper = $('otherExpanse')
    const otherReasonInput = $('otherReason') as HTMLInputElement | null
    if (!otherReasonWrapper || !otherReasonInput) return
    otherReasonWrapper.classList.toggle('hidden', !show)
    otherReasonInput.toggleAttribute('required', show)
    otherReasonInput.value = show ? value : ''
}

const resetFormState = (): void => {
    const form = $('newExpanseForm') as HTMLFormElement | null
    form?.reset()
    currentEditingId = null
    const submitButton = $('submitExpanseButton')
    if (submitButton) submitButton.textContent = 'Add Expanse'
    setOtherReasonState(false)
}

const addExpanse = (event: Event): void => {
    event.preventDefault()

    const typeSelect = $('typeOfExpanse') as HTMLSelectElement | null
    const otherReasonInput = $('otherReason') as HTMLInputElement | null
    const otherReason = otherReasonInput?.value || ''
    let typeOfExpanse = typeSelect?.value || ''
    if (typeOfExpanse === 'Other' && otherReason.trim()) typeOfExpanse = otherReason

    const descriptionInput = $('description') as HTMLInputElement
    const amountInput = $('amount') as HTMLInputElement
    const dateInput = $('date') as HTMLInputElement
    
    const description = descriptionInput.value
    const amount = amountInput.value
    const date = dateInput.value

    withData((expanse) => {
        if (currentEditingId !== null) {
            const target = expanse.find((item) => item.id === currentEditingId)
            if (target) {
                target.typeOfExpanse = typeOfExpanse
                target.description = description
                target.amount = amount
                target.date = date
            }
            currentEditingId = null
            return
        }
        expanse.push({ id: Date.now(), typeOfExpanse, description, amount, date })
    })

    resetFormState()
}

const deleteExpanse = (expanseId: number): void => {
    if (!confirm('Are you sure you want to delete this expanse?')) return
    withData((expanse) => {
        const index = expanse.findIndex((item) => item.id === expanseId)
        if (index !== -1) expanse.splice(index, 1)
    })
}

const updateExpanse = (expanseId: number): void => {
    const expanse = getData().find(e => e.id === expanseId)
    if (expanse) {
        currentEditingId = expanseId
        const submitButton = $('submitExpanseButton')
        if (submitButton) submitButton.textContent = 'Update Expanse'

        const typeSelect = $('typeOfExpanse') as HTMLSelectElement | null
        if (typeSelect) {
            const isPresetType = Array.from(typeSelect.options).some(
                option => option.value === expanse.typeOfExpanse
            )
            if (isPresetType) {
                typeSelect.value = expanse.typeOfExpanse
                setOtherReasonState(false)
            } else {
                typeSelect.value = 'Other'
                setOtherReasonState(true, expanse.typeOfExpanse)
            }
        }
        
        const descriptionInput = $('description') as HTMLInputElement
        const amountInput = $('amount') as HTMLInputElement
        const dateInput = $('date') as HTMLInputElement
        
        descriptionInput.value = expanse.description
        amountInput.value = expanse.amount
        dateInput.value = expanse.date

        const form = $('newExpanseForm') as HTMLElement
        form?.scrollIntoView({ behavior: 'smooth' })
    }
}

const renderFilteredTable = (data: Expense[]): void => {
    const table = $('filteredExpanseTable')
    if (!table) return
    if (!data.length) {
        table.innerHTML = `
            <tr>
                <td colspan="4">There are no expanses found for selected period</td>
            </tr>
        `
        return
    }
    table.innerHTML = data.map((expanse) => `
        <tr>
            <td>${expanse.typeOfExpanse}</td>
            <td>${expanse.description}</td>
            <td>$${expanse.amount}</td>
            <td>${expanse.date}</td>
        </tr>
    `).join('')
}

const filter = (event: Event): void => {
    event.preventDefault()
    
    const yearInput = $('filterByYear') as HTMLInputElement | null
    const monthInput = $('filterByMonth') as HTMLInputElement | null
    const dayInput = $('filterByDate') as HTMLInputElement | null
    
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
    const filtered = getData().filter((expanse) => {
        if (!expanse.date) return false
        const date = new Date(expanse.date)
        const matchesYear = date.getFullYear() === year
        const matchesMonth = month ? date.getMonth() + 1 === month : true
        const matchesDay = day ? date.getDate() === day : true
        return matchesYear && matchesMonth && matchesDay
    })
    renderFilteredTable(filtered)
    const resultsTable = $('expanseResultsTable')
    if (resultsTable) resultsTable.classList.remove('hidden')
}

(() => {
    document.addEventListener('DOMContentLoaded', () => {
        loadMenu()
        if ($('expanseTable')) syncDataToDOM()

        const resetButton = document.querySelector('#newExpanseForm button[type="reset"]')
        resetButton?.addEventListener('click', resetFormState)

        if ($('filteredExpanseTable')) {
            const dateFilterForm = $('dateFilterForm')
            dateFilterForm?.addEventListener('reset', () => {
                const resultsTable = $('expanseResultsTable')
                if (resultsTable) resultsTable.classList.add('hidden')
            })
        }
    })

    const reasonSelect = $('typeOfExpanse') as HTMLSelectElement | null

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
        getData().forEach(expanse => {
            const expanseYear = new Date(expanse.date).getFullYear()
            if (expanseYear > currentYear) {
                expanse.date = `${currentYear}-12-31`
            }
        })
    }
})()

let pieChartInstance: any = null
let histogramChartInstance: any = null

const initializeCharts = (): void => {
    const data = getData()
    if (!data.length) return
    createPieChart(data)
    createHistogramChart(data)
}

const createPieChart = (data: Expense[]): void => {
    const canvas = $('pieChart') as HTMLCanvasElement | null
    if (!canvas) return
    
    const categoryData = data.reduce((acc: Record<string, number>, exp) => {
        const cat = exp.typeOfExpanse || 'Unknown'
        acc[cat] = (acc[cat] || 0) + Number(exp.amount)
        return acc
    }, {})
    
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

const createHistogramChart = (data: Expense[]): void => {
    const canvas = $('histogramChart') as HTMLCanvasElement | null
    if (!canvas) return
    
    const monthData = data.reduce((acc: Record<string, number>, exp) => {
        if (!exp.date) return acc
        const date = new Date(exp.date)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        acc[key] = (acc[key] || 0) + Number(exp.amount)
        return acc
    }, {})
    
    const sorted = Object.keys(monthData).sort()
    
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

const generateColors = (count: number): string[] => 
    Array.from({ length: count }, () => {
        const [r, g, b] = Array(3).fill(0).map(() => Math.floor(Math.random() * 255))
        return `rgba(${r}, ${g}, ${b}, 0.7)`
    })

const exportToCSV = (): void => {
    const data = getData()
    if (!data.length) return alert('No data to export')
    
    const rows = [['Type of Expense', 'Description', 'Amount', 'Date']]
    data.forEach(e => rows.push([`"${e.typeOfExpanse || ''}"`, `"${e.description || ''}"`, e.amount || '0', e.date || '']))
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    link.classList.add('invisible')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const exportToPDF = (): void => {
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
        body: data.map((e: Expense) => [e.typeOfExpanse || '', e.description || '', `$${Number(e.amount).toFixed(2)}`, e.date || '']),
        theme: 'striped',
        headStyles: { fillColor: [54, 162, 235] }
    })
    
    doc.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`)
}

(() => {
    if ($('pieChart') && $('histogramChart')) {
        document.addEventListener('DOMContentLoaded', initializeCharts)
    }
})();

(window as any).deleteExpanse = deleteExpanse;
(window as any).updateExpanse = updateExpanse;
(window as any).addExpanse = addExpanse;
(window as any).filter = filter;
(window as any).exportToCSV = exportToCSV;
(window as any).exportToPDF = exportToPDF;
