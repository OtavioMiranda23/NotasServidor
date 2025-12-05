export default function formatDateToCustom(input: string) {
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

  const hours = String(dateInUTC3.getUTCHours()).padStart(2, "0");
  const minutes = String(dateInUTC3.getUTCMinutes()).padStart(2, "0");
  const seconds = String(dateInUTC3.getUTCSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}
