const LOCAL_STORAGE_KEY = 'expenses'
let currentEditingId = null
const $ = (id) => document.getElementById(id)
function loadMenu() {
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

const saveExpanse = (expanseTable) =>
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expanseTable))
const getData = () => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || []
const withData = (mutator) => {
    const data = getData()
    mutator(data)
    saveExpanse(data)
    syncDataToDOM()
    return data
}


function syncDataToDOM() {
    const data = getData()
    let didNormalize = false
    const baseId = Date.now()
    for (let i = 0; i < data.length; i++) {
        if (data[i].id == null) {
            data[i].id = baseId + i
            didNormalize = true
        }
    }
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
    $('expanseTable').innerHTML = htmlString
    $('total').textContent = data.length
    $('averagePrice').textContent = getExpanseAverage().toFixed(2)
}

const getExpanseAverage = () => {
    const data = getData()
    const sum = data.reduce((total, expanse) => total + Number(expanse.amount), 0)
    return data.length ? sum / data.length : 0
}

const resetFormState = () => {
    $('newExpanseForm')?.reset()
    currentEditingId = null
    const submitButton = $('submitExpanseButton')
    if (submitButton) submitButton.textContent = 'Add Expanse'
    setOtherReasonState(false)
}

function addExpanse(event) {

    event.preventDefault()

    const typeSelect = $('typeOfExpanse')
    const otherReason = $('otherReason')?.value || ''
    let typeOfExpanse = typeSelect?.value || ''
    if (typeOfExpanse === 'Other' && otherReason.trim()) typeOfExpanse = otherReason

    const description = $('description').value
    const amount = $('amount').value
    const date = $('date').value

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
function deleteExpanse(expanseId) {
    if (!confirm('Are you sure you want to delete this expanse?')) return
    withData((expanse) => {
        const index = expanse.findIndex((item) => item.id === expanseId)
        if (index !== -1) expanse.splice(index, 1)
    })
}
function updateExpanse(expanseId) {
    const expanse = getData().find(e => e.id === expanseId)
    if (expanse) {
        currentEditingId = expanseId
        const submitButton = $('submitExpanseButton')
        if (submitButton) submitButton.textContent = 'Update Expanse'

        const typeSelect = $('typeOfExpanse')
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
        $('description').value = expanse.description
        $('amount').value = expanse.amount
        $('date').value = expanse.date

        $('newExpanseForm').scrollIntoView({ behavior: 'smooth' })
    }
}
const renderFilteredTable = (data) => {
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

const filter = (event) => {
    event.preventDefault()
    const yearValue = $('filterByYear')?.value
    const monthValue = $('filterByMonth')?.value
    const dayValue = $('filterByDate')?.value

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
}

document.addEventListener('DOMContentLoaded', () => {
    loadMenu()
    if ($('expanseTable')) syncDataToDOM()

    document
        .querySelector('#newExpanseForm button[type="reset"]')
        ?.addEventListener('click', resetFormState)

    if ($('filteredExpanseTable')) {
        renderFilteredTable(getData())
        $('dateFilterForm')?.addEventListener('reset', () => {
            renderFilteredTable(getData())
        })
    }
})

const reasonSelect = $('typeOfExpanse')
const otherReasonInput = $('otherReason')
const otherReasonWrapper = $('otherExpanse')

const setOtherReasonState = (show, value = '') => {
    if (!otherReasonWrapper || !otherReasonInput) return
    otherReasonWrapper.style.display = show ? 'block' : 'none'
    otherReasonInput.toggleAttribute('required', show)
    otherReasonInput.value = show ? value : ''
}

reasonSelect?.addEventListener('change', () => {
    setOtherReasonState(reasonSelect.value === 'Other')
})

const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0]
    dateInput.max = today
}

const filterByYear = document.getElementById('filterByYear')
if (filterByYear) {
    const currentYear = new Date().getFullYear()
    filterByYear.max = currentYear
    getData().forEach(expanse => {
        const expanseYear = new Date(expanse.date).getFullYear()
        if (expanseYear > currentYear) {
            expanse.date = `${currentYear}-12-31`
        }
    })
}