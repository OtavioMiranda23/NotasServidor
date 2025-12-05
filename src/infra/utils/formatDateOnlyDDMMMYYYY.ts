export default function formatDateOnlyDDMMMYYYY(input: string) {
  const date = new Date(input);
  // Ajusta -3 horas no UTC
  const dateInUTC3 = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const day = String(dateInUTC3.getUTCDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[dateInUTC3.getUTCMonth()];
  const year = dateInUTC3.getUTCFullYear();
  return `${day}-${month}-${year}`;
}
