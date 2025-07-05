function formatDateToIndo(dateInput) {
  const date = new Date(dateInput)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

module.exports = { formatDateToIndo }
