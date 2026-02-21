export const formatDateTime = (dateString) => {
  const d = new Date(dateString);
  const datePart = d
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\s/g, ""); // "2026.02.18." (모든 공백 제거)

  const timePart = d.toLocaleTimeString("ko-KR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }); // "11:05:20"

  return `${datePart} ${timePart}`;
};
