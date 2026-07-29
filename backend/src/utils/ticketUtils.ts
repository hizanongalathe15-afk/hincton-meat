export const ticketNumberForId = (id: string) => `T-${String(id).slice(0, 8).toUpperCase()}`

export const attachTicketNumber = (ticket: any) => ({
  ...ticket,
  ticketNumber: ticket.ticketNumber || ticketNumberForId(ticket.id),
})

export const attachTicketNumbers = (tickets: any[]) => (tickets || []).map(attachTicketNumber)

export default {
  ticketNumberForId,
  attachTicketNumber,
  attachTicketNumbers,
}
